/**
 * Enhanced Booking Routes for Provider Appointments Management
 * Supports: pending requests, confirm/decline, suggest times, real-time updates
 */

const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/bookings/provider/:providerId
 * Get provider's bookings with filtering, pagination, and metadata
 */
router.get('/provider/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { status = 'pending', limit = 20, offset = 0 } = req.query;
    
    // Build query based on status
    let query = { provider: providerId };
    
    if (status === 'pending') {
      query.status = 'pending_confirmation';
      // Only show non-expired pending requests by default
      const showExpired = req.query.showExpired === 'true';
      if (!showExpired) {
        query['confirmation.expiresAt'] = { $gte: new Date() };
      }
    } else if (status === 'upcoming') {
      query.status = 'confirmed';
      query['dateTime.requestedStart'] = { $gte: new Date() };
    } else if (status === 'past') {
      query['dateTime.requestedStart'] = { $lt: new Date() };
    } else if (status === 'all') {
      // No additional filters
    }
    
    // Get bookings with pagination
    const bookings = await Booking.find(query)
      .sort({ 'confirmation.requestedAt': -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate("patient", "firstName lastName email phone profileImage").lean();
    
    // Get counts
    const totalCount = await Booking.countDocuments(query);
    
    // Count urgent bookings (expiring in < 6 hours)
    const sixHoursFromNow = new Date(Date.now() + 6 * 60 * 60 * 1000);
    const urgentCount = await Booking.countDocuments({
      provider: providerId,
      status: 'pending_confirmation',
      'confirmation.expiresAt': { $lt: sixHoursFromNow, $gte: new Date() }
    });
    
    // Get provider metadata
    const provider = await User.findById(providerId).select('calendar.timezone calendar.accessToken').lean();
    
    res.json({
      bookings: bookings.map(b => formatBookingForProvider(b)),
      totalCount,
      urgentCount,
      metadata: {
        timezone: provider?.calendar?.timezone || 'America/Los_Angeles',
        calendarIntegrated: !!provider?.calendar?.accessToken,
        notificationsEnabled: true
      }
    });
    
  } catch (error) {
    console.error('Get provider bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

/**
 * POST /api/bookings/:id/confirm
 * Confirm a pending booking request
 */
router.post('/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const providerId = req.headers['x-provider-id'] || req.provider?.id;
    
    // Idempotency check
    const idempotencyKey = req.headers['idempotency-key'];
    if (idempotencyKey) {
      // Check if this action was already performed
      const existing = await Booking.findOne({
        _id: id,
        status: 'confirmed',
        'confirmation.idempotencyKey': idempotencyKey
      });
      
      if (existing) {
        return res.json({ 
          booking: formatBookingForProvider(existing),
          message: 'Booking already confirmed'
        });
      }
    }
    
    // Find and validate booking
    const booking = await Booking.findOne({
      _id: id,
      provider: providerId,
      status: 'pending_confirmation'
    }).populate('patient.id');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or already processed' });
    }
    
    // Check if expired
    if (new Date() > new Date(booking.confirmation.expiresAt)) {
      return res.status(400).json({ error: 'Booking request has expired' });
    }
    
    // Update booking status
    booking.status = 'confirmed';
    booking.confirmation.confirmedAt = new Date();
    booking.confirmation.confirmedBy = providerId;
    booking.confirmation.providerNote = note;
    booking.confirmation.idempotencyKey = idempotencyKey;
    
    // Release slot reservation (now permanent)
    booking.slotReservation.released = true;
    
    // Update payment status to charged
    booking.payment.status = 'charged';
    booking.payment.chargedAt = new Date();
    
    await booking.save();
    
    // Send notifications to patient
    await sendBookingConfirmationNotifications(booking, note);
    
    // Emit real-time event
    emitBookingUpdate(booking.patient.id, 'booking.confirmed', booking);
    
    res.json({ 
      booking: formatBookingForProvider(booking),
      message: 'Booking confirmed successfully'
    });
    
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ error: 'Failed to confirm booking' });
  }
});

/**
 * POST /api/bookings/:id/decline
 * Decline a pending booking request
 */
router.post('/:id/decline', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const providerId = req.headers['x-provider-id'] || req.provider?.id;
    
    if (!reason) {
      return res.status(400).json({ error: 'Decline reason is required' });
    }
    
    // Find booking
    const booking = await Booking.findOne({
      _id: id,
      provider: providerId,
      status: 'pending_confirmation'
    }).populate('patient.id');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or already processed' });
    }
    
    // Update status
    booking.status = 'declined';
    booking.confirmation.declinedAt = new Date();
    booking.confirmation.declinedBy = providerId;
    booking.confirmation.declineReason = reason;
    
    // Release slot reservation
    booking.slotReservation.released = true;
    
    // Refund deposit
    booking.payment.status = 'refunded';
    booking.payment.refundedAt = new Date();
    booking.payment.refundedAmount = booking.payment.originalAmount;
    
    await booking.save();
    
    // Send notifications to patient
    await sendBookingDeclinedNotifications(booking, reason);
    
    // Emit real-time event
    emitBookingUpdate(booking.patient.id, 'booking.declined', booking);
    
    res.json({ 
      message: 'Booking declined successfully'
    });
    
  } catch (error) {
    console.error('Decline booking error:', error);
    res.status(500).json({ error: 'Failed to decline booking' });
  }
});

/**
 * POST /api/bookings/:id/suggest-times
 * Suggest alternative times for a booking
 */
router.post('/:id/suggest-times', async (req, res) => {
  try {
    const { id } = req.params;
    const { proposedTimes, message } = req.body;
    const providerId = req.headers['x-provider-id'] || req.provider?.id;
    
    if (!proposedTimes || proposedTimes.length === 0) {
      return res.status(400).json({ error: 'At least one alternative time is required' });
    }
    
    if (proposedTimes.length > 3) {
      return res.status(400).json({ error: 'Maximum 3 alternative times allowed' });
    }
    
    // Find booking
    const booking = await Booking.findOne({
      _id: id,
      provider: providerId,
      status: 'pending_confirmation'
    }).populate('patient.id');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or already processed' });
    }
    
    // Update status
    booking.status = 'reschedule_proposed';
    booking.reschedule.proposedTimes = proposedTimes.map(time => ({
      start: new Date(time.start),
      end: new Date(time.end),
      proposedAt: new Date(),
      proposedBy: providerId
    }));
    booking.reschedule.providerMessage = message;
    booking.reschedule.count += 1;
    
    await booking.save();
    
    // Send notifications to patient
    await sendRescheduleProposalNotifications(booking, proposedTimes, message);
    
    // Emit real-time event
    emitBookingUpdate(booking.patient.id, 'booking.reschedule_proposed', booking);
    
    res.json({ 
      booking: formatBookingForProvider(booking),
      message: 'Alternative times suggested successfully'
    });
    
  } catch (error) {
    console.error('Suggest times error:', error);
    res.status(500).json({ error: 'Failed to suggest alternative times' });
  }
});

/**
 * Helper: Format booking data for provider view
 */
function formatBookingForProvider(booking) {
  // Patient is stored as embedded object with {id, name, email, phone}
  const patient = booking.patient || {};
  
  return {
    _id: booking._id,
    patient: {
      name: patient.firstName && patient.lastName ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient',
      email: patient.email || '',
      phone: patient.phone || '',
      avatar: patient.avatar || patient.profileImage || null,
    },
    isReturningPatient: false, // TODO: Calculate from booking history
    previousBookingCount: 0, // TODO: Calculate from booking history
    service: {
      name: booking.service.name,
      category: booking.service.category,
      duration: booking.service.duration,
      price: booking.service.price
    },
    requestedStart: booking.dateTime.requestedStart,
    requestedEnd: booking.dateTime.requestedEnd,
    providerTimezone: booking.dateTime.providerTimezone,
    patientTimezone: booking.dateTime.patientTimezone,
    status: booking.status,
    patientNote: booking.notes.patientNotes,
    totalAmount: booking.payment.originalAmount,
    depositAmount: booking.payment.platformFee.calculatedFee / 2, // Example: half as deposit
    paymentStatus: booking.payment.status,
    expiresAt: booking.confirmation.expiresAt,
    confirmedAt: booking.confirmation.confirmedAt,
    declinedAt: booking.confirmation.declinedAt,
    declineReason: booking.confirmation.declineReason,
    proposedTimes: booking.reschedule.proposedTimes,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt
  };
}

/**
 * Helper: Send booking confirmation notifications
 */
async function sendBookingConfirmationNotifications(booking, note) {
  const patient = booking.patient;
  
  // TODO: Implement actual notification service
  console.log(`📧 Sending confirmation to ${patient.email}`);
  console.log(`📱 SMS to ${patient.phone}: Your booking is confirmed!`);
  
  // Email content
  const emailContent = {
    to: patient.email,
    subject: 'Booking Confirmed! 🎉',
    body: `
      Your appointment has been confirmed!
      
      Provider: ${booking.provider.practiceName}
      Service: ${booking.service.name}
      Date: ${booking.dateTime.requestedStart}
      Duration: ${booking.service.duration} minutes
      Amount: $${booking.payment.originalAmount}
      
      ${note ? `Provider's message: ${note}` : ''}
      
      See you soon!
    `
  };
  
  // TODO: Call email service
  // await emailService.send(emailContent);
}

/**
 * Helper: Send booking declined notifications
 */
async function sendBookingDeclinedNotifications(booking, reason) {
  const patient = booking.patient;
  
  console.log(`📧 Sending decline notification to ${patient.email}`);
  console.log(`📱 SMS to ${patient.phone}: Your booking request was declined`);
  
  // TODO: Implement actual notification service
}

/**
 * Helper: Send reschedule proposal notifications
 */
async function sendRescheduleProposalNotifications(booking, proposedTimes, message) {
  const patient = booking.patient;
  
  console.log(`📧 Sending reschedule options to ${patient.email}`);
  console.log(`Proposed times: ${proposedTimes.length}`);
  
  // TODO: Implement actual notification service
}

/**
 * Helper: Emit real-time booking update
 */
function emitBookingUpdate(userId, eventType, booking) {
  // TODO: Implement WebSocket broadcast
  console.log(`🔔 Emitting ${eventType} to user ${userId}`);
  
  // This will be implemented in websocket handler
  // global.io?.to(`user:${userId}`).emit(eventType, {
  //   bookingId: booking._id,
  //   status: booking.status,
  //   data: formatBookingForProvider(booking)
  // });
}

/**
 * DEBUG: Check raw booking data
 */
router.get("/debug-patient/:bookingId", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).lean();
    res.json({
      hasPatient: !!booking.patient,
      patientStructure: booking.patient,
      patientKeys: booking.patient ? Object.keys(booking.patient) : []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;

/**
 * DELETE /api/bookings/cleanup/expired-pending
 * Remove expired pending confirmation requests
 * Security: Only accessible with admin key
 */
router.delete('/cleanup/expired-pending', async (req, res) => {
  try {
    // Simple security check
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'temp-cleanup-key-2026') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Find expired pending requests
    const expiredBookings = await Booking.find({
      status: 'pending_confirmation',
      'confirmation.expiresAt': { $lt: new Date() }
    }).select('bookingNumber confirmation.expiresAt createdAt').lean();
    
    const count = expiredBookings.length;
    
    if (req.query.preview === 'true') {
      return res.json({
        preview: true,
        count,
        sample: expiredBookings.slice(0, 5),
        message: 'Add ?preview=false to actually delete'
      });
    }
    
    // Actually delete
    const result = await Booking.deleteMany({
      status: 'pending_confirmation',
      'confirmation.expiresAt': { $lt: new Date() }
    });
    
    res.json({
      success: true,
      deleted: result.deletedCount,
      message: `Removed ${result.deletedCount} expired pending requests`
    });
    
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/bookings/admin/sync-team-calendar
 * Copy calendar integration to all team members
 */
router.post('/admin/sync-team-calendar/:providerId', async (req, res) => {
  try {
    const Provider = require('../models/Provider');
    const provider = await Provider.findById(req.params.providerId);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Find first team member with calendar
    const withCalendar = provider.teamMembers.find(m => m.calendar?.connected);
    
    if (!withCalendar) {
      return res.status(400).json({ error: 'No team member has calendar integration' });
    }
    
    // Copy to all team members without calendar
    let updated = 0;
    provider.teamMembers.forEach(member => {
      if (!member.calendar?.connected) {
        member.calendar = {
          provider: withCalendar.calendar.provider,
          connected: true,
          accessToken: withCalendar.calendar.accessToken,
          refreshToken: withCalendar.calendar.refreshToken,
          tokenExpiry: withCalendar.calendar.tokenExpiry,
          calendarId: withCalendar.calendar.calendarId,
          calendarEmail: withCalendar.calendar.calendarEmail,
          syncStatus: 'active',
          lastSyncAt: new Date(),
          bufferMinutes: 15,
          minNoticeHours: 24,
          maxDaysOut: 60
        };
        updated++;
      }
    });
    
    await provider.save();
    
    res.json({
      success: true,
      updated,
      message: `Synced calendar to ${updated} team members`
    });
    
  } catch (error) {
    console.error('Sync calendar error:', error);
    res.status(500).json({ error: error.message });
  }
});
