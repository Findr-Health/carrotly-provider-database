const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');
const Provider = require('../models/Provider');

const JWT_SECRET = process.env.JWT_SECRET || 'findr-health-user-secret-2025';

// Auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// ==================== USER BOOKING ROUTES ====================

// Get user's bookings
router.get('/', auth, async (req, res) => {
  try {
    const { status, upcoming } = req.query;
    
    const query = { userId: req.userId };
    
    if (status) {
      query.status = status;
    }
    
    if (upcoming === 'true') {
      query.appointmentDate = { $gte: new Date() };
      query.status = { $in: ['pending', 'confirmed'] };
    }
    
    const bookings = await Booking.find(query)
      .populate('providerId', 'practiceName providerTypes address photos primaryPhoto phone')
      .sort({ appointmentDate: upcoming === 'true' ? 1 : -1 });
    
    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// Get upcoming bookings
router.get('/upcoming', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({
      userId: req.userId,
      appointmentDate: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed'] }
    })
    .populate('providerId', 'practiceName providerTypes address photos primaryPhoto phone')
    .sort({ appointmentDate: 1 })
    .limit(10);
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get upcoming bookings' });
  }
});

// Get past bookings
router.get('/past', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const query = {
      userId: req.userId,
      $or: [
        { appointmentDate: { $lt: new Date() } },
        { status: { $in: ['completed', 'cancelled', 'no_show'] } }
      ]
    };
    
    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('providerId', 'practiceName providerTypes address photos primaryPhoto')
      .sort({ appointmentDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    res.json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get past bookings' });
  }
});

// Get single booking
router.get('/:bookingId', auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      userId: req.userId
    })
    .populate('providerId', 'practiceName providerTypes address photos primaryPhoto phone contactInfo calendar');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get booking' });
  }
});

// Get booking by confirmation code
router.get('/code/:confirmationCode', auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      confirmationCode: req.params.confirmationCode,
      userId: req.userId
    })
    .populate('providerId', 'practiceName providerTypes address photos primaryPhoto phone');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get booking' });
  }
});

// Create booking
router.post('/', auth, async (req, res) => {
  try {
    const {
      providerId,
      serviceId,
      serviceName,
      servicePrice,
      serviceDuration,
      serviceCategory,
      teamMemberId,
      teamMemberName,
      appointmentDate,
      userNotes
    } = req.body;
    
    // Validation
    if (!providerId || !serviceName || !servicePrice || !serviceDuration || !appointmentDate) {
      return res.status(400).json({ 
        error: 'Provider, service details, and appointment date are required' 
      });
    }
    
    // Verify provider exists and is approved
    const provider = await Provider.findOne({ _id: providerId, status: 'approved' });
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Check appointment is in the future
    const appointmentDateTime = new Date(appointmentDate);
    if (appointmentDateTime <= new Date()) {
      return res.status(400).json({ error: 'Appointment must be in the future' });
    }
    
    // TODO: Check provider availability for this time slot
    
    // Calculate fees
    const serviceFee = Math.round(servicePrice * 0.05);  // 5% service fee
    const totalAmount = servicePrice + serviceFee;
    
    // Create booking
    const booking = new Booking({
      userId: req.userId,
      providerId,
      serviceId,
      serviceName,
      servicePrice,
      serviceDuration,
      serviceCategory,
      teamMemberId,
      teamMemberName,
      appointmentDate: appointmentDateTime,
      userNotes,
      serviceFee,
      totalAmount,
      paymentAmount: totalAmount
    });
    
    await booking.save();
    await booking.populate('providerId', 'practiceName providerTypes address photos primaryPhoto phone');
    
    res.status(201).json(booking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Update booking (reschedule)
router.put('/:bookingId', auth, async (req, res) => {
  try {
    const { appointmentDate, userNotes } = req.body;
    
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      userId: req.userId
    });
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (!booking.canReschedule) {
      return res.status(400).json({ 
        error: 'This booking cannot be rescheduled. Bookings must be rescheduled at least 24 hours in advance.' 
      });
    }
    
    if (appointmentDate) {
      const newDate = new Date(appointmentDate);
      if (newDate <= new Date()) {
        return res.status(400).json({ error: 'New appointment must be in the future' });
      }
      booking.appointmentDate = newDate;
      booking.appointmentEndDate = new Date(newDate.getTime() + booking.serviceDuration * 60000);
      booking.isRescheduled = true;
    }
    
    if (userNotes !== undefined) {
      booking.userNotes = userNotes;
    }
    
    await booking.save();
    await booking.populate('providerId', 'practiceName providerTypes address photos primaryPhoto phone');
    
    res.json(booking);
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Cancel booking
router.post('/:bookingId/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      userId: req.userId
    });
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (!booking.canCancel) {
      return res.status(400).json({ 
        error: 'This booking cannot be cancelled. Bookings must be cancelled at least 24 hours in advance.' 
      });
    }
    
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = 'user';
    booking.cancellationReason = reason;
    
    // Calculate refund (full refund if cancelled 24+ hours before)
    if (booking.paymentStatus === 'paid') {
      booking.refundAmount = booking.totalAmount;
      booking.paymentStatus = 'refunded';
      // TODO: Process actual Stripe refund
    }
    
    await booking.save();
    
    res.json({ message: 'Booking cancelled', booking });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Confirm booking (after payment)
router.post('/:bookingId/confirm', auth, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      userId: req.userId
    });
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    booking.status = 'confirmed';
    booking.confirmedAt = new Date();
    booking.paymentStatus = 'paid';
    booking.stripePaymentIntentId = paymentIntentId;
    
    await booking.save();
    await booking.populate('providerId', 'practiceName providerTypes address photos primaryPhoto phone');
    
    res.json(booking);
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ error: 'Failed to confirm booking' });
  }
});

module.exports = router;
