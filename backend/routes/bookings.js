/**
 * Booking Routes - Calendar-Optional Booking Flow
 * Findr Health
 * Created: January 15, 2026
 * 
 * Endpoints:
 * - POST /api/bookings/reserve-slot     - Reserve a slot (5 min hold)
 * - POST /api/bookings                  - Create booking (instant or request)
 * - GET  /api/bookings/:id              - Get booking details
 * - GET  /api/bookings/patient          - Patient's bookings
 * - GET  /api/bookings/provider         - Provider's bookings
 * - GET  /api/bookings/provider/pending - Provider's pending confirmations
 * - POST /api/bookings/:id/confirm      - Provider confirms
 * - POST /api/bookings/:id/decline      - Provider declines
 * - POST /api/bookings/:id/reschedule   - Provider proposes new time
 * - POST /api/bookings/:id/accept-reschedule  - Patient accepts
 * - POST /api/bookings/:id/decline-reschedule - Patient declines
 * - POST /api/bookings/:id/cancel       - Cancel booking
 */

const { generateBookingNumber } = require('../utils/bookingNumberGenerator');
const calendarSync = require('../services/calendarSync');


const { authenticateToken } = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const BookingEvent = require('../models/BookingEvent');
const SlotReservation = require('../models/SlotReservation');
const Provider = require('../models/Provider');
const User = require('../models/User');
const StateMachine = require('../services/BookingStateMachine');
const FeatureFlags = require('../services/FeatureFlags');

// Import Stripe if available
let stripe;
try {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} catch (e) {
  console.log('Stripe not configured');
}

// ==================== MIDDLEWARE ====================

/**
 * Extract user from auth token
 */
const authenticateUser = async (req, res, next) => {
  try {
    // Your existing auth middleware logic
    // For now, check for userId in headers or token
    const userId = req.headers['x-user-id'] || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    req.userId = userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication' });
  }
};

/**
 * Verify provider owns the resource
 */
const authenticateProvider = async (req, res, next) => {
  try {
    const providerId = req.headers['x-provider-id'] || req.provider?.id;
    if (!providerId) {
      return res.status(401).json({ error: 'Provider authentication required' });
    }
    req.providerId = providerId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid provider authentication' });
  }
};

/**
 * Log booking event helper
 */
const logEvent = async (booking, eventType, data = {}, actor = { type: 'system' }, context = {}) => {
  try {
    await BookingEvent.create({
      booking: booking._id,
      bookingNumber: booking.bookingNumber,
      eventType,
      previousStatus: data.previousStatus,
      newStatus: data.newStatus || booking.status,
      data,
      actor,
      context,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to log booking event:', error);
    // Don't throw - logging shouldn't break the flow
  }
};

// ==================== SLOT RESERVATION ====================

/**
 * POST /api/bookings/reserve-slot
 * Reserve a time slot for 5 minutes while patient completes checkout
 */
router.post('/reserve-slot', async (req, res) => {
  try {
    const { providerId, serviceId, startTime, endTime, duration } = req.body;
    
    // Validate required fields
    if (!providerId || !startTime) {
      return res.status(400).json({ error: 'providerId and startTime are required' });
    }
    
    // Check if slot reservation is enabled
    const isEnabled = await FeatureFlags.isEnabled('booking.slot_reservation_enabled', { providerId });
    if (!isEnabled) {
      // Skip reservation, return dummy success
      return res.status(200).json({
        success: true,
        reservationId: null,
        message: 'Slot reservation disabled, proceeding directly'
      });
    }
    
    // Calculate end time if not provided
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date(start.getTime() + (duration || 30) * 60 * 1000);
    
    // Try to reserve the slot
    const reservation = await SlotReservation.reserveSlot({
      provider: providerId,
      
      teamMember: teamMemberId && selectedTeamMember ? {
        memberId: teamMemberId,
        name: selectedTeamMember.name || teamMemberName,
        title: selectedTeamMember.title
      } : undefined,
      startTime: start,
      endTime: end,
      serviceId: serviceId || 'default',
      duration: duration || 30,
      patient: req.userId || null,
      sessionId: req.headers['x-session-id'] || null,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        source: req.headers['x-source'] || 'app'
      }
    });
    
    if (!reservation) {
      return res.status(409).json({ 
        error: 'Slot not available',
        message: 'This time slot is currently being booked by another user. Please select a different time.'
      });
    }
    
    res.status(201).json({
      success: true,
      reservationId: reservation._id,
      expiresAt: reservation.expiresAt,
      remainingSeconds: reservation.getRemainingSeconds()
    });
    
  } catch (error) {
    console.error('Reserve slot error:', error);
    res.status(500).json({ error: 'Failed to reserve slot' });
  }
});

/**
 * DELETE /api/bookings/reserve-slot/:id
 * Release a slot reservation
 */
router.delete('/reserve-slot/:id', async (req, res) => {
  try {
    const reservation = await SlotReservation.releaseReservation(
      req.params.id, 
      'user_cancelled'
    );
    
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    res.json({ success: true, message: 'Reservation released' });
    
  } catch (error) {
    console.error('Release reservation error:', error);
    res.status(500).json({ error: 'Failed to release reservation' });
  }
});

// ==================== CREATE BOOKING ====================

/**
 * POST /api/bookings
 * Create a new booking (instant or request based on provider's calendar status)
 */
router.post('/', async (req, res) => {
  try {
    const {
      providerId,
      serviceId,
      serviceName,
      servicePrice,
      serviceDuration,
      serviceCategory,
      startTime,
      endTime,
      patientId,
      patientNotes,
      paymentMethodId,
      reservationId,
      locationType,
      idempotencyKey,
      teamMemberId,
      teamMemberName
    } = req.body;
    
    // Check idempotency
    if (idempotencyKey) {
      const existing = await Booking.findOne({ idempotencyKey });
      if (existing) {
        return res.status(200).json({
          success: true,
          booking: existing,
          message: 'Booking already created (idempotent)'
        });
      }
    }
    
    // Validate required fields
    if (!providerId || !startTime || !patientId) {
      return res.status(400).json({ 
        error: 'providerId, startTime, and patientId are required' 
      });
    }
    
    // Get provider to determine booking mode
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Calculate times
    const requestedStart = new Date(startTime);
    const requestedEnd = endTime 
      ? new Date(endTime) 
      : new Date(requestedStart.getTime() + (serviceDuration || 30) * 60 * 1000);
    
    // Check calendar availability if connected
    const { checkTimeSlotAvailability } = require('../utils/calendarAvailability');
    let bookingType = 'request'; // Default to request
    let isAvailable = false;
    
    let selectedTeamMember = null;
    
    // Check team member's calendar if specified
    if (teamMemberId) {
      selectedTeamMember = provider.teamMembers.id(teamMemberId);
      
      if (selectedTeamMember?.calendar?.connected) {
        try {
          isAvailable = await checkTimeSlotAvailability(provider, requestedStart, serviceDuration || 30, teamMemberId);
          bookingType = isAvailable ? 'instant' : 'request';
          console.log(`📅 Team member ${selectedTeamMember.name} calendar: ${isAvailable ? 'AVAILABLE' : 'BUSY'} → ${bookingType} booking`);
        } catch (error) {
          console.error('Calendar availability check failed:', error);
          bookingType = 'request'; // Fallback to request on error
        }
      } else {
        console.log(`📋 Team member ${selectedTeamMember?.name || teamMemberName || 'unknown'} has no calendar - request booking`);
      }
    } else if (provider.calendarConnected) {
      // Fallback to provider-level calendar (legacy)
      try {
        isAvailable = await checkTimeSlotAvailability(provider, requestedStart, serviceDuration || 30);
        bookingType = isAvailable ? 'instant' : 'request';
        console.log(`📅 Provider-level calendar: ${isAvailable ? 'AVAILABLE' : 'BUSY'} → ${bookingType} booking`);
      } catch (error) {
        console.error('Calendar availability check failed:', error);
        bookingType = 'request'; // Fallback to request on error
      }
    }
    const paymentMode = bookingType === 'request' ? 'hold' : 'prepay';
    // Create booking object
    const booking = new Booking({
      patient: patientId,
      provider: providerId,
      
      teamMember: teamMemberId && selectedTeamMember ? {
        memberId: teamMemberId,
        name: selectedTeamMember.name || teamMemberName,
        title: selectedTeamMember.title
      } : undefined,
      bookingType,
      status: 'pending_payment',
      
      service: {
        serviceId: serviceId || `svc_${Date.now()}`,
        name: serviceName || 'Consultation',
        category: serviceCategory || provider.providerTypes?.[0] || 'Medical',
        duration: serviceDuration || 30,
        price: servicePrice || 0,
        description: ''
      },
      
      dateTime: {
        requestedStart,
        requestedEnd,
        providerTimezone: provider.timezone || 'America/Denver',
        patientTimezone: req.headers['x-timezone'] || 'America/Denver',
        bufferMinutes: provider.bookingSettings?.bufferMinutes || 15
      },
      
      confirmation: {
        required: bookingType === 'request',
        requestedAt: bookingType === 'request' ? new Date() : null,
        expiresAt: bookingType === 'request' 
          ? new Date(Date.now() + (provider.bookingSettings?.confirmationDeadlineHours || 24) * 60 * 60 * 1000)
          : null
      },
      
      payment: {
        mode: paymentMode,
        status: 'pending',
        originalAmount: servicePrice || 0
      },
      
      location: {
        type: locationType || 'in_person'
      },
      
      notes: {
        patientNotes: patientNotes || ''
      },
      
      metadata: {
        source: req.headers['x-source'] || 'app',
        appVersion: req.headers['x-app-version'],
        ipAddress: req.ip
      },
      
      idempotencyKey
    });
    
    // Generate booking number
    await booking.generateBookingNumber();
    
    // Get patient for customer ID
    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    if (!patient.stripeCustomerId) {
      return res.status(400).json({ 
        error: 'Patient has no payment method configured. Please add a payment method first.' 
      });
    }
    
    // Process payment
    if (stripe && paymentMethodId && servicePrice > 0) {
      try {
        const paymentIntentParams = {
          amount: servicePrice,
          currency: 'usd',
          customer: patient.stripeCustomerId,
          payment_method: paymentMethodId,
          confirm: true,
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never'
          },
          metadata: {
            bookingId: booking._id.toString(),
            bookingNumber: booking.bookingNumber,
            providerId: providerId,
            patientId: patientId
          }
        };
        
        // For request bookings, use manual capture (hold)
        if (bookingType === 'request') {
          paymentIntentParams.capture_method = 'manual';
        }
        
        const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
        
        booking.payment.paymentIntentId = paymentIntent.id;
        booking.payment.status = bookingType === 'request' ? 'held' : 'captured';
        
        if (bookingType === 'request') {
          booking.payment.hold = {
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          };
        }
        
      } catch (paymentError) {
        console.error('Payment error:', paymentError);
        booking.status = 'payment_failed';
        booking.payment.status = 'failed';
        await booking.save();
        
        // Log event
        await logEvent(booking, 'payment_failed', { 
          error: paymentError.message 
        });
        
        return res.status(400).json({
          error: 'Payment failed',
          message: paymentError.message
        });
      }
    }
    
    // Set final status
    if (bookingType === 'instant') {
      booking.status = 'confirmed';
      booking.dateTime.confirmedStart = requestedStart;
      booking.dateTime.confirmedEnd = requestedEnd;
    } else {
      booking.status = 'pending_confirmation';
    }
    
    // Convert slot reservation if exists
    if (reservationId) {
      await SlotReservation.convertToBooking(reservationId, booking._id);
      booking.slotReservation = {
        reservationId,
        reservedAt: new Date(),
        released: true,
        releasedAt: new Date(),
        releasedReason: 'converted'
      };
    }

    // Create calendar event for instant bookings
    if (bookingType === 'instant' && booking.status === 'confirmed') {
      try {
        console.log('📅 Creating calendar event for instant booking...');
        
        // Get team member if specified
        let teamMember = null;
        if (req.body.teamMemberId) {
          teamMember = provider.teamMembers.id(req.body.teamMemberId);
        }
        
        // Create HIPAA-compliant calendar event
        const calendarEvent = await calendarSync.createCalendarEvent(
          booking,
          provider,
          teamMember
        );
        
        if (calendarEvent) {
          console.log(`✅ Calendar event created: ${calendarEvent.id || 'success'}`);
        }
        
      } catch (calendarError) {
        console.error('Calendar event creation failed:', calendarError);
        // Don't fail the booking - event can be created later
      }
    }

    
    // Save booking
    await booking.save();
    
    // Log creation event
    await logEvent(booking, 'created', {
      bookingType,
      newStatus: booking.status
    }, {
      type: 'patient',
      userId: patientId
    });
    
    // TODO: Send notifications
    // - If instant: Send confirmation to patient, notify provider
    // - If request: Send request notification to provider
    
    res.status(201).json({
      success: true,
      booking: {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        bookingType: booking.bookingType,
        status: booking.status,
        service: booking.service,
        dateTime: booking.dateTime,
        confirmation: booking.confirmation,
        payment: {
          mode: booking.payment.mode,
          status: booking.payment.status,
          amount: booking.payment.originalAmount
        }
      }
    });
    
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// ==================== GET BOOKINGS ====================

/**
 * GET /api/bookings/:id
 * Get booking details
 */
/**
 * GET /api/bookings/cancellation-policy
 * Get cancellation policy details for display
 */
router.get('/cancellation-policy', (req, res) => {
  const { getPolicyDetails } = require('../utils/cancellationPolicy');
  
  res.json({
    success: true,
    policy: getPolicyDetails(),
    note: 'This standard 24-hour policy applies to all providers on Findr Health'
  });
});

router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('patient', 'firstName lastName email phone')
      .populate('provider', 'practiceName email phone address photos')
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({ success: true, booking });
    
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Failed to get booking' });
  }
});

/**
 * GET /api/bookings/patient/:patientId
 * Get patient's bookings
 */
// Get current authenticated user's bookings
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    // Get user ID from JWT token
    const userId = req.params.userId;
    
    // Security: Verify authenticated user matches requested user
    if (userId !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized: Cannot access another user\'s bookings' 
      });
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { status, upcoming, limit = 20, skip = 0 } = req.query;
    
    let query = { patient: userId };
    
    // Handle special status filters
    if (status === 'upcoming') {
      // Upcoming includes all active statuses
      query.status = { 
        $in: ['pending_confirmation', 'confirmed', 'pending_payment'] 
      };
      query['dateTime.requestedStart'] = { $gte: new Date() };
    } else if (status === 'completed') {
      query.status = { $in: ['completed', 'no_show'] };
    } else if (status === 'cancelled') {
      query.status = { $in: ['cancelled', 'declined', 'expired'] };
    } else if (status) {
      // Exact status match
      query.status = status;
    }
    
    if (upcoming === 'true' && !status) {
      query['dateTime.requestedStart'] = { $gte: new Date() };
    }

    const bookings = await Booking.find(query)
      .populate('provider', 'practiceName providerTypes address')
      .select('-__v')
      .sort({ appointmentDate: upcoming === 'true' ? 1 : -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json({ 
      bookings,
      total: await Booking.countDocuments(query)
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

router.get('/patient/:patientId', async (req, res) => {
  try {
    const { status, limit = 20, skip = 0 } = req.query;
    
    const query = { patient: req.params.patientId };
    if (status) {
      query.status = status;
    }
    
    const bookings = await Booking.find(query)
      .populate('provider', 'practiceName address photos')
      .sort({ 'dateTime.requestedStart': -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const total = await Booking.countDocuments(query);
    
    res.json({ 
      success: true, 
      bookings,
      pagination: { total, limit: parseInt(limit), skip: parseInt(skip) }
    });
    
  } catch (error) {
    console.error('Get patient bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

/**
 * GET /api/bookings/provider/:providerId
 * Get provider's bookings
 */
router.get('/provider/:providerId', async (req, res) => {
  try {
    const { status, startDate, endDate, limit = 50, skip = 0 } = req.query;
    
    const query = { provider: req.params.providerId };
    
    if (status) {
      if (status === 'upcoming') {
        query.status = { $in: ['confirmed', 'pending_confirmation'] };
        query['dateTime.requestedStart'] = { $gte: new Date() };
      } else if (status === 'past') {
        query.status = 'completed';
      } else {
        query.status = status;
      }
    }
    
    if (startDate) {
      query['dateTime.requestedStart'] = { 
        ...query['dateTime.requestedStart'],
        $gte: new Date(startDate) 
      };
    }
    
    if (endDate) {
      query['dateTime.requestedStart'] = { 
        ...query['dateTime.requestedStart'],
        $lte: new Date(endDate) 
      };
    }
    
    const bookings = await Booking.find(query)
      .populate('patient', 'firstName lastName email phone')
      .sort({ 'dateTime.requestedStart': 1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const total = await Booking.countDocuments(query);
    
    res.json({ 
      success: true, 
      bookings,
      pagination: { total, limit: parseInt(limit), skip: parseInt(skip) }
    });
    
  } catch (error) {
    console.error('Get provider bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

/**
 * GET /api/bookings/provider/:providerId/pending
 * Get provider's pending confirmation requests
 */
router.get('/provider/:providerId/pending', async (req, res) => {
  try {
    const bookings = await Booking.find({
      provider: req.params.providerId,
      status: 'pending_confirmation'
    })
    .populate('patient', 'firstName lastName email phone')
    .sort({ 'confirmation.expiresAt': 1 }); // Soonest expiring first
    
    // Calculate urgency
    const now = new Date();
    const enrichedBookings = bookings.map(b => {
      const booking = b.toObject();
      const expiresAt = new Date(booking.confirmation.expiresAt);
      const hoursUntilExpiry = (expiresAt - now) / (1000 * 60 * 60);
      
      booking.urgency = hoursUntilExpiry < 4 ? 'high' : hoursUntilExpiry < 12 ? 'medium' : 'low';
      booking.hoursUntilExpiry = Math.max(0, hoursUntilExpiry).toFixed(1);
      
      return booking;
    });
    
    res.json({ 
      success: true, 
      bookings: enrichedBookings,
      count: enrichedBookings.length
    });
    
  } catch (error) {
    console.error('Get pending bookings error:', error);
    res.status(500).json({ error: 'Failed to get pending bookings' });
  }
});

// ==================== PROVIDER ACTIONS ====================

/**
 * POST /api/bookings/:id/confirm
 * Provider confirms a request booking
 */
router.post('/:id/confirm', authenticateProvider, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Verify provider owns this booking
    if (booking.provider.toString() !== req.providerId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Validate state transition
    if (!StateMachine.canTransition(booking.status, 'confirmed')) {
      return res.status(400).json({ 
        error: 'Invalid status transition',
        currentStatus: booking.status,
        allowedTransitions: StateMachine.getValidTransitions(booking.status)
      });
    }
    
    const previousStatus = booking.status;
    
    // Capture payment if held
    if (stripe && booking.payment.paymentIntentId && booking.payment.status === 'held') {
      try {
        await stripe.paymentIntents.capture(booking.payment.paymentIntentId);
        booking.payment.status = 'captured';
        booking.payment.hold.capturedAt = new Date();
      } catch (captureError) {
        console.error('Payment capture error:', captureError);
        return res.status(400).json({
          error: 'Payment capture failed',
          message: captureError.message
        });
      }
    }
    
    // Update booking
    booking.status = 'confirmed';
    booking.confirmation.respondedAt = new Date();
    booking.confirmation.responseType = 'confirmed';
    booking.dateTime.confirmedStart = booking.dateTime.requestedStart;
    booking.dateTime.confirmedEnd = booking.dateTime.requestedEnd;
    
    await booking.save();
    
    // Log event
    await logEvent(booking, 'confirmed', {
      previousStatus,
      newStatus: 'confirmed'
    }, {
      type: 'provider',
      userId: req.providerId
    });
    
    // Update provider stats
    await Provider.findByIdAndUpdate(req.providerId, {
      $inc: { 'bookingStats.totalConfirmed': 1 },
      $set: { 'bookingStats.lastBookingAt': new Date() }
    });
    
    // TODO: Send confirmation notification to patient
    // TODO: Create calendar event if provider has calendar connected
    
    res.json({
      success: true,
      message: 'Booking confirmed',
      booking: {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        dateTime: booking.dateTime
      }
    });
    
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ error: 'Failed to confirm booking' });
  }
});

/**
 * POST /api/bookings/:id/decline
 * Provider declines a request booking
 */
router.post('/:id/decline', authenticateProvider, async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Verify provider owns this booking
    if (booking.provider.toString() !== req.providerId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Validate state transition
    if (!StateMachine.canTransition(booking.status, 'cancelled_provider')) {
      return res.status(400).json({ 
        error: 'Invalid status transition',
        currentStatus: booking.status
      });
    }
    
    const previousStatus = booking.status;
    
    // Cancel payment hold if exists
    if (stripe && booking.payment.paymentIntentId && booking.payment.status === 'held') {
      try {
        await stripe.paymentIntents.cancel(booking.payment.paymentIntentId);
        booking.payment.status = 'cancelled';
        booking.payment.hold.cancelledAt = new Date();
        booking.payment.hold.cancelReason = 'Provider declined';
      } catch (cancelError) {
        console.error('Payment cancel error:', cancelError);
        // Continue anyway - payment will expire
      }
    }
    
    // Update booking
    booking.status = 'cancelled_provider';
    booking.confirmation.respondedAt = new Date();
    booking.confirmation.responseType = 'declined';
    booking.confirmation.declineReason = reason;
    booking.notes.cancellationReason = reason;
    
    await booking.save();
    
    // Log event
    await logEvent(booking, 'declined', {
      previousStatus,
      newStatus: 'cancelled_provider',
      reason
    }, {
      type: 'provider',
      userId: req.providerId
    });
    
    // TODO: Notify patient of decline
    
    res.json({
      success: true,
      message: 'Booking declined',
      booking: {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        status: booking.status
      }
    });
    
  } catch (error) {
    console.error('Decline booking error:', error);
    res.status(500).json({ error: 'Failed to decline booking' });
  }
});

/**
 * POST /api/bookings/:id/reschedule
 * Provider proposes a new time
 */
router.post('/:id/reschedule', authenticateProvider, async (req, res) => {
  try {
    const { proposedStart, proposedEnd, message } = req.body;
    
    if (!proposedStart) {
      return res.status(400).json({ error: 'proposedStart is required' });
    }
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Verify provider owns this booking
    if (booking.provider.toString() !== req.providerId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Check reschedule limit
    if (!booking.canReschedule) {
      return res.status(400).json({ 
        error: 'Reschedule limit reached',
        message: `Maximum ${booking.reschedule.maxAttempts} reschedule attempts allowed`
      });
    }
    
    // Validate state transition
    if (!StateMachine.canTransition(booking.status, 'reschedule_proposed')) {
      return res.status(400).json({ 
        error: 'Invalid status transition',
        currentStatus: booking.status
      });
    }
    
    const previousStatus = booking.status;
    const provider = await Provider.findById(req.providerId);
    
    // Calculate proposed end if not provided
    const start = new Date(proposedStart);
    const end = proposedEnd 
      ? new Date(proposedEnd) 
      : new Date(start.getTime() + booking.service.duration * 60 * 1000);
    
    // Update booking
    booking.status = 'reschedule_proposed';
    booking.reschedule.count += 1;
    booking.reschedule.current = {
      proposedBy: 'provider',
      proposedAt: new Date(),
      proposedStart: start,
      proposedEnd: end,
      responseDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      message: message || ''
    };
    
    // Add to history
    booking.reschedule.history.push({
      attemptNumber: booking.reschedule.count,
      fromStart: booking.dateTime.requestedStart,
      fromEnd: booking.dateTime.requestedEnd,
      toStart: start,
      toEnd: end,
      proposedBy: 'provider',
      proposedAt: new Date(),
      message
    });
    
    await booking.save();
    
    // Log event
    await logEvent(booking, 'reschedule_proposed', {
      previousStatus,
      newStatus: 'reschedule_proposed',
      proposedStart: start,
      proposedEnd: end,
      attemptNumber: booking.reschedule.count
    }, {
      type: 'provider',
      userId: req.providerId
    });
    
    // TODO: Notify patient of reschedule proposal
    
    res.json({
      success: true,
      message: 'Reschedule proposed',
      booking: {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        reschedule: booking.reschedule
      }
    });
    
  } catch (error) {
    console.error('Reschedule booking error:', error);
    res.status(500).json({ error: 'Failed to propose reschedule' });
  }
});

// ==================== PATIENT ACTIONS ====================

/**
 * POST /api/bookings/:id/accept-reschedule
 * Patient accepts the proposed reschedule
 */
router.post('/:id/accept-reschedule', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (booking.status !== 'reschedule_proposed') {
      return res.status(400).json({ 
        error: 'No pending reschedule',
        currentStatus: booking.status
      });
    }
    
    const previousStatus = booking.status;
    
    // Update booking with new times
    booking.status = 'confirmed';
    booking.dateTime.confirmedStart = booking.reschedule.current.proposedStart;
    booking.dateTime.confirmedEnd = booking.reschedule.current.proposedEnd;
    
    // Update history
    const lastHistoryIndex = booking.reschedule.history.length - 1;
    if (lastHistoryIndex >= 0) {
      booking.reschedule.history[lastHistoryIndex].respondedAt = new Date();
      booking.reschedule.history[lastHistoryIndex].accepted = true;
    }
    
    // Clear current proposal
    booking.reschedule.current = null;
    
    // Capture payment if still held
    if (stripe && booking.payment.paymentIntentId && booking.payment.status === 'held') {
      try {
        await stripe.paymentIntents.capture(booking.payment.paymentIntentId);
        booking.payment.status = 'captured';
        booking.payment.hold.capturedAt = new Date();
      } catch (captureError) {
        console.error('Payment capture error:', captureError);
        return res.status(400).json({
          error: 'Payment capture failed',
          message: captureError.message
        });
      }
    }
    
    await booking.save();
    
    // Log event
    await logEvent(booking, 'reschedule_accepted', {
      previousStatus,
      newStatus: 'confirmed',
      newStart: booking.dateTime.confirmedStart,
      newEnd: booking.dateTime.confirmedEnd
    }, {
      type: 'patient',
      userId: booking.patient
    });
    
    // TODO: Notify provider
    
    res.json({
      success: true,
      message: 'Reschedule accepted',
      booking: {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        dateTime: booking.dateTime
      }
    });
    
  } catch (error) {
    console.error('Accept reschedule error:', error);
    res.status(500).json({ error: 'Failed to accept reschedule' });
  }
});

/**
 * POST /api/bookings/:id/decline-reschedule
 * Patient declines the proposed reschedule (cancels booking)
 */
router.post('/:id/decline-reschedule', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (booking.status !== 'reschedule_proposed') {
      return res.status(400).json({ 
        error: 'No pending reschedule',
        currentStatus: booking.status
      });
    }
    
    const previousStatus = booking.status;
    
    // Cancel payment hold
    if (stripe && booking.payment.paymentIntentId && booking.payment.status === 'held') {
      try {
        await stripe.paymentIntents.cancel(booking.payment.paymentIntentId);
        booking.payment.status = 'cancelled';
        booking.payment.hold.cancelledAt = new Date();
        booking.payment.hold.cancelReason = 'Patient declined reschedule';
      } catch (cancelError) {
        console.error('Payment cancel error:', cancelError);
      }
    }
    
    // Update booking
    booking.status = 'cancelled_patient';
    booking.notes.cancellationReason = 'Patient declined reschedule';
    
    // Update history
    const lastHistoryIndex = booking.reschedule.history.length - 1;
    if (lastHistoryIndex >= 0) {
      booking.reschedule.history[lastHistoryIndex].respondedAt = new Date();
      booking.reschedule.history[lastHistoryIndex].accepted = false;
    }
    
    await booking.save();
    
    // Log event
    await logEvent(booking, 'reschedule_declined', {
      previousStatus,
      newStatus: 'cancelled_patient'
    }, {
      type: 'patient',
      userId: booking.patient
    });
    
    // TODO: Notify provider
    
    res.json({
      success: true,
      message: 'Reschedule declined, booking cancelled',
      booking: {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        status: booking.status
      }
    });
    
  } catch (error) {
    console.error('Decline reschedule error:', error);
    res.status(500).json({ error: 'Failed to decline reschedule' });
  }
});

/**
 * POST /api/bookings/:id/cancel-patient
 * Patient cancels their booking with refund based on standard 24hr policy
 */
router.post('/:id/cancel-patient', authenticateUser, async (req, res) => {
  try {
    const { reason } = req.body;
    const { calculateRefund } = require('../utils/cancellationPolicy');
    
    const booking = await Booking.findById(req.params.id)
      .populate('provider', 'practiceName email')
      .populate('patient', 'firstName lastName email');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Authorization - only patient can cancel their booking
    if (booking.patient._id.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }
    
    // Check if already cancelled
    if (booking.status.includes('cancelled')) {
      return res.status(400).json({ error: 'Booking already cancelled' });
    }
    
    // Calculate refund based on standard policy
    const refundCalc = calculateRefund(
      booking.dateTime.requestedStart,
      booking.payment.originalAmount || booking.service.price
    );
    
    // Process refund via Stripe if payment exists
    let stripeRefund = null;
    if (booking.payment.paymentIntentId && refundCalc.refundAmount > 0) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        stripeRefund = await stripe.refunds.create({
          payment_intent: booking.payment.paymentIntentId,
          amount: Math.round(refundCalc.refundAmount * 100), // Convert to cents
          reason: 'requested_by_customer',
          metadata: {
            bookingId: booking._id.toString(),
            bookingNumber: booking.bookingNumber,
            refundPercentage: refundCalc.refundPercentage,
            feePercentage: refundCalc.feePercentage
          }
        });
        
        booking.payment.refunds = booking.payment.refunds || [];
        booking.payment.refunds.push({
          refundId: stripeRefund.id,
          amount: refundCalc.refundAmount,
          percentage: refundCalc.refundPercentage,
          processedAt: new Date(),
          reason: 'patient_cancellation'
        });
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError);
        return res.status(500).json({ 
          error: 'Failed to process refund',
          details: stripeError.message 
        });
      }
    }
    
    // Update booking status
    const previousStatus = booking.status;
    booking.status = 'cancelled_patient';
    booking.cancellation = {
      cancelledAt: new Date(),
      cancelledBy: 'patient',
      reason: reason || 'Patient requested cancellation',
      refundAmount: refundCalc.refundAmount,
      refundPercentage: refundCalc.refundPercentage,
      feeAmount: refundCalc.feeAmount,
      feePercentage: refundCalc.feePercentage,
      policy: refundCalc.policyDescription,
      hoursBeforeAppointment: refundCalc.hoursUntilAppointment
    };
    
    await booking.save();
    
    // TODO: Delete calendar event if exists
    // TODO: Send notification to provider
    // TODO: Send confirmation email to patient
    
    console.log('✅ Booking cancelled by patient', {
      bookingNumber: booking.bookingNumber,
      refundAmount: refundCalc.refundAmount,
      feeAmount: refundCalc.feeAmount,
      stripeRefundId: stripeRefund?.id
    });
    
    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        cancellation: booking.cancellation
      },
      refund: {
        amount: refundCalc.refundAmount,
        percentage: refundCalc.refundPercentage,
        feeAmount: refundCalc.feeAmount,
        feePercentage: refundCalc.feePercentage,
        description: refundCalc.policyDescription,
        stripeRefundId: stripeRefund?.id
      }
    });
    
  } catch (error) {
    console.error('Patient cancel error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

/**
 * POST /api/bookings/:id/cancel
 * Cancel a booking (patient or provider)
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const { reason, cancelledBy } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Check if cancellation is allowed
    const cancellerType = cancelledBy || 'patient';
    const newStatus = cancellerType === 'provider' ? 'cancelled_provider' : 'cancelled_patient';
    
    if (!StateMachine.canTransition(booking.status, newStatus)) {
      return res.status(400).json({ 
        error: 'Cannot cancel booking in current status',
        currentStatus: booking.status
      });
    }
    
    const previousStatus = booking.status;
    
    // Handle payment
    if (stripe && booking.payment.paymentIntentId) {
      if (booking.payment.status === 'held') {
        // Release hold
        try {
          await stripe.paymentIntents.cancel(booking.payment.paymentIntentId);
          booking.payment.status = 'cancelled';
          booking.payment.hold.cancelledAt = new Date();
          booking.payment.hold.cancelReason = reason || 'Booking cancelled';
        } catch (e) {
          console.error('Failed to cancel payment hold:', e);
        }
      } else if (booking.payment.status === 'captured') {
        // TODO: Handle refund based on cancellation policy
        // For now, just mark as needing refund
        console.log('TODO: Process refund for captured payment');
      }
    }
    
    // Update booking
    booking.status = newStatus;
    booking.notes.cancellationReason = reason;
    
    await booking.save();
    
    // Log event
    await logEvent(booking, 'cancelled', {
      previousStatus,
      newStatus,
      reason,
      cancelledBy: cancellerType
    }, {
      type: cancellerType,
      userId: cancellerType === 'provider' ? booking.provider : booking.patient
    });
    
    // Update provider stats
    await Provider.findByIdAndUpdate(booking.provider, {
      $inc: { 'bookingStats.totalCancelled': 1 }
    });
    
    res.json({
      success: true,
      message: 'Booking cancelled',
      booking: {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        status: booking.status
      }
    });
    
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// ==================== BOOKING HISTORY ====================

/**
 * GET /api/bookings/:id/history
 * Get booking event history
 */
router.get('/:id/history', async (req, res) => {
  try {
    const events = await BookingEvent.find({ booking: req.params.id })
      .sort({ timestamp: 1 });
    
    res.json({ success: true, events });
    
  } catch (error) {
    console.error('Get booking history error:', error);
    res.status(500).json({ error: 'Failed to get booking history' });
  }
});


// ==================== BOOKING REQUEST/APPROVAL ENDPOINTS ====================

/**
 * POST /api/bookings/:bookingId/accept-suggested-time
 * Patient accepts one of the suggested times
 */
router.post('/:bookingId/accept-suggested-time', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { suggestedTimeId } = req.body;
    
    // Validate input
    if (!suggestedTimeId) {
      return res.status(400).json({
        success: false,
        error: 'suggestedTimeId is required'
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Verify booking is in pending status
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Booking is not in pending status',
        currentStatus: booking.status
      });
    }

    // Find the selected time
    const selectedTime = booking.suggestedTimes?.find(
      st => st.id === suggestedTimeId
    );

    if (!selectedTime) {
      return res.status(404).json({
        success: false,
        error: 'Suggested time not found'
      });
    }

    // Update booking with confirmed time
    booking.status = 'confirmed';
    booking.appointmentDate = new Date(selectedTime.startTime);
    booking.appointmentTime = new Date(selectedTime.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    booking.confirmedAt = new Date();
    booking.isRequest = false;
    
    // Capture payment if it was on hold
    if (booking.payment?.paymentIntentId && booking.payment?.status === 'held') {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        await stripe.paymentIntents.capture(booking.payment.paymentIntentId);
        booking.payment.status = 'captured';
        booking.payment.capturedAt = new Date();
      } catch (stripeError) {
        console.error('Payment capture error:', stripeError);
        // Continue anyway - we can retry payment capture later
      }
    }

    await booking.save();

    // Emit WebSocket event if service is available
    if (global.realtimeService) {
      try {
        global.realtimeService.emitBookingUpdate(booking.userId?.toString(), 'booking_confirmed', {
          bookingId: booking._id,
          status: 'confirmed',
          appointmentDate: booking.appointmentDate,
          appointmentTime: booking.appointmentTime
        });
      } catch (wsError) {
        console.error('WebSocket emit error:', wsError);
        // Non-critical - continue
      }
    }

    console.log(`✅ Booking ${bookingId} confirmed - suggested time accepted`);

    // Send push notification to user
    try {
      const pushService = require('../services/pushNotificationService');
      const User = require('../models/User');
      
      const user = await User.findById(booking.userId);
      const provider = await Provider.findById(booking.providerId);
      
      if (user && provider) {
        await pushService.sendBookingConfirmed(user, booking, provider);
      }
    } catch (pushError) {
      console.error('Push notification failed (non-critical):', pushError.message);
    }

    res.json({
      success: true,
      message: 'Booking confirmed successfully',
      booking: {
        id: booking._id,
        status: booking.status,
        appointmentDate: booking.appointmentDate,
        appointmentTime: booking.appointmentTime,
        paymentStatus: booking.payment?.status
      }
    });

  } catch (error) {
    console.error('Accept suggested time error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept suggested time'
    });
  }
});

/**
 * POST /api/bookings/:bookingId/decline-suggested-times
 * Patient declines all suggested times (cancels request)
 */
router.post('/:bookingId/decline-suggested-times', async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Find booking
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Verify booking is in pending status
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Booking is not in pending status',
        currentStatus: booking.status
      });
    }

    // Cancel booking
    booking.status = 'cancelled_patient';
    booking.cancelledAt = new Date();
    booking.notes = booking.notes || {};
    booking.notes.cancellationReason = 'Patient declined suggested times';

    // Release payment hold
    if (booking.payment?.paymentIntentId && booking.payment?.status === 'held') {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        await stripe.paymentIntents.cancel(booking.payment.paymentIntentId);
        booking.payment.status = 'cancelled';
        booking.payment.hold = booking.payment.hold || {};
        booking.payment.hold.cancelledAt = new Date();
        booking.payment.hold.cancelReason = 'Declined suggested times';
      } catch (stripeError) {
        console.error('Payment cancellation error:', stripeError);
        // Continue anyway - payment can be cancelled manually
      }
    }

    await booking.save();

    // Emit WebSocket event if service is available
    if (global.realtimeService) {
      try {
        global.realtimeService.emitBookingUpdate(booking.userId?.toString(), 'booking_cancelled', {
          bookingId: booking._id,
          status: 'cancelled_patient',
          reason: 'Declined suggested times'
        });
      } catch (wsError) {
        console.error('WebSocket emit error:', wsError);
        // Non-critical - continue
      }
    }

    console.log(`❌ Booking ${bookingId} cancelled - suggested times declined`);

    // Send push notification to user
    try {
      const pushService = require('../services/pushNotificationService');
      const User = require('../models/User');
      
      const user = await User.findById(booking.userId);
      const provider = await Provider.findById(booking.providerId);
      
      if (user && provider) {
        await pushService.sendBookingCancelled(
          user, 
          booking, 
          provider, 
          'You declined the suggested times. You can submit a new booking request anytime.'
        );
      }
    } catch (pushError) {
      console.error('Push notification failed (non-critical):', pushError.message);
    }

    res.json({
      success: true,
      message: 'Booking request cancelled successfully',
      booking: {
        id: booking._id,
        status: booking.status,
        paymentStatus: booking.payment?.status
      }
    });

  } catch (error) {
    console.error('Decline suggested times error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to decline suggested times'
    });
  }
});

module.exports = router;


/**
 * TEST ONLY: Cancel booking without auth
 * DELETE THIS AFTER TESTING
 */
router.post('/:id/cancel-patient-test', async (req, res) => {
  try {
    const { calculateRefund } = require('../utils/cancellationPolicy');
    const Booking = require('../models/Booking');
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const refundCalc = calculateRefund(
      booking.dateTime.requestedStart,
      booking.payment.originalAmount || booking.service.price
    );
    
    booking.status = 'cancelled_patient';
    booking.cancellation = {
      cancelledAt: new Date(),
      cancelledBy: 'patient',
      reason: 'TEST CANCELLATION',
      refundAmount: refundCalc.refundAmount,
      refundPercentage: refundCalc.refundPercentage,
      feeAmount: refundCalc.feeAmount,
      feePercentage: refundCalc.feePercentage,
      policy: refundCalc.policyDescription,
      hoursBeforeAppointment: refundCalc.hoursUntilAppointment
    };
    
    await booking.save();
    
    res.json({
      success: true,
      booking,
      refund: refundCalc,
      note: 'TEST MODE - No Stripe refund processed'
    });
    
  } catch (error) {
    console.error('Test cancel error:', error);
    res.status(500).json({ error: error.message });
  }
});
