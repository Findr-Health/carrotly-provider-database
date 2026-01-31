/**
 * Findr Health - Booking Check-In Routes
 * 
 * HIPAA-compliant check-in verification
 * Requires: Confirmation number + Last 4 phone digits
 */

const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const User = require('../models/User');
const { authenticateProvider } = require('../middleware/auth');

/**
 * POST /api/bookings/check-in
 * Verify patient and check them in
 * 
 * Body: {
 *   confirmationNumber: "FH-2026-0234",
 *   phoneLastFour: "5678"
 * }
 */
router.post('/check-in', authenticateProvider, async (req, res) => {
  try {
    const { confirmationNumber, phoneLastFour } = req.body;
    
    // Validate input
    if (!confirmationNumber || !phoneLastFour) {
      return res.status(400).json({
        success: false,
        error: 'Confirmation number and phone last 4 digits required'
      });
    }
    
    // Find booking
    const booking = await Booking.findOne({ 
      bookingNumber: confirmationNumber.toUpperCase().trim()
    })
    .populate('patient', 'firstName lastName email phone dateOfBirth address')
    .populate('provider', 'practiceName')
    .populate('service');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found. Please verify confirmation number.'
      });
    }
    
    // Verify booking belongs to this provider
    if (booking.provider._id.toString() !== req.user.providerId) {
      return res.status(403).json({
        success: false,
        error: 'This booking does not belong to your practice'
      });
    }
    
    // Verify phone last 4 digits
    const patientPhone = booking.patient.phone.replace(/\D/g, ''); // Remove non-digits
    const lastFour = patientPhone.slice(-4);
    
    if (lastFour !== phoneLastFour) {
      return res.status(401).json({
        success: false,
        error: 'Phone verification failed. Please check the last 4 digits.'
      });
    }
    
    // Verify booking is today
    const bookingDate = new Date(booking.dateTime.confirmedStart || booking.dateTime.requestedStart);
    const today = new Date();
    const isToday = 
      bookingDate.getFullYear() === today.getFullYear() &&
      bookingDate.getMonth() === today.getMonth() &&
      bookingDate.getDate() === today.getDate();
    
    if (!isToday) {
      return res.status(400).json({
        success: false,
        error: `This appointment is scheduled for ${bookingDate.toLocaleDateString()}, not today`,
        bookingDate: bookingDate.toISOString()
      });
    }
    
    // Verify booking status allows check-in
    const allowedStatuses = ['confirmed', 'checked_in'];
    if (!allowedStatuses.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot check in. Booking status: ${booking.status}`,
        currentStatus: booking.status
      });
    }
    
    // Update booking status to checked_in
    if (booking.status !== 'checked_in') {
      booking.status = 'checked_in';
      booking.dateTime.actualStart = new Date();
      await booking.save();
    }
    
    // Return full patient details (now that identity is verified)
    return res.json({
      success: true,
      message: 'Patient verified and checked in successfully',
      checkedInAt: booking.dateTime.actualStart,
      patient: {
        name: `${booking.patient.firstName} ${booking.patient.lastName}`,
        dateOfBirth: booking.patient.dateOfBirth,
        phone: booking.patient.phone,
        email: booking.patient.email,
        address: booking.patient.address
      },
      booking: {
        confirmationNumber: booking.bookingNumber,
        service: booking.service.name,
        scheduledTime: booking.dateTime.confirmedStart || booking.dateTime.requestedStart,
        duration: booking.service.duration,
        notes: booking.patientNotes,
        specialRequests: booking.specialRequests
      }
    });
    
  } catch (error) {
    console.error('Check-in error:', error);
    return res.status(500).json({
      success: false,
      error: 'Check-in failed. Please try again.'
    });
  }
});

/**
 * GET /api/bookings/check-in/status/:confirmationNumber
 * Get basic booking status (no PHI) for check-in verification
 */
router.get('/check-in/status/:confirmationNumber', authenticateProvider, async (req, res) => {
  try {
    const { confirmationNumber } = req.params;
    
    const booking = await Booking.findOne({ 
      bookingNumber: confirmationNumber.toUpperCase().trim(),
      provider: req.user.providerId
    })
    .select('bookingNumber status dateTime service')
    .populate('service', 'name duration');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    return res.json({
      success: true,
      booking: {
        confirmationNumber: booking.bookingNumber,
        status: booking.status,
        serviceName: booking.service.name,
        scheduledTime: booking.dateTime.confirmedStart || booking.dateTime.requestedStart,
        canCheckIn: ['confirmed'].includes(booking.status)
      }
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve booking status'
    });
  }
});

module.exports = router;
