/**
 * Findr Health Booking Routes
 * 
 * Endpoints:
 * POST   /api/bookings                    - Create booking
 * GET    /api/bookings/user/:userId       - Get user's bookings
 * GET    /api/bookings/:id                - Get booking detail
 * GET    /api/bookings/:id/cancellation-quote - Get cancellation fee quote
 * POST   /api/bookings/:id/cancel         - Cancel booking
 * POST   /api/bookings/:id/reschedule     - Reschedule booking
 * POST   /api/bookings/:id/confirm        - Provider confirms request
 * POST   /api/bookings/:id/decline        - Provider declines request
 * POST   /api/bookings/:id/complete       - Mark as completed
 * POST   /api/bookings/:id/no-show        - Mark as no-show
 */

const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Provider = require('../models/Provider');
const User = require('../models/User');
const { calculateFees, toCents } = require('../utils/feeCalculation');
const { calculateCancellationFee, getCancellationQuote, getRequestExpirationDate } = require('../utils/cancellation');
const stripeService = require('../services/stripeService');
const emailService = require('../services/emailService');

// ==================== CREATE BOOKING ====================

router.post('/', async (req, res) => {
  try {
    const {
      userId,
      providerId,
      service,
      teamMember,
      appointmentDate,
      appointmentTime,
      paymentMethodId,
      chargeType = 'card_on_file',  // 'prepay', 'at_visit', 'card_on_file'
      notes
    } = req.body;

    // Validate required fields
    const requiresPayment = chargeType === 'prepay';
    if (!userId || !providerId || !service || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'providerId', 'service', 'appointmentDate', 'appointmentTime']
      });
    }
    if (requiresPayment && !paymentMethodId) {
      return res.status(400).json({ 
        error: 'Payment method required for prepay bookings',
        required: ['paymentMethodId']
      });
    }

    // Get provider
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    if (provider.status !== 'approved') {
      return res.status(400).json({ error: 'Provider is not accepting bookings' });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if provider has calendar integration (instant booking vs request)
    const hasCalendarIntegration = provider.calendar?.provider && 
                                   ['google', 'microsoft', 'apple'].includes(provider.calendar.provider);

    // Calculate fees
    const fees = calculateFees(service.price);

    // Handle payment based on chargeType
    let stripeCustomerId = null;
    let paymentIntent = null;
    
    if (chargeType === 'prepay' || (chargeType === 'card_on_file' && paymentMethodId)) {
      // Get or create Stripe customer
      stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripeService.createCustomer({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          phone: user.phone,
          metadata: { userId: userId.toString() }
        });
        stripeCustomerId = customer.id;
        
        // Save to user
        await User.findByIdAndUpdate(userId, { stripeCustomerId });
      }
      
      // Attach payment method if not already attached
      try {
        await stripeService.attachPaymentMethod(paymentMethodId, stripeCustomerId);
      } catch (err) {
        // Payment method might already be attached, that's ok
        if (!err.message.includes('already been attached')) {
          throw err;
        }
      }
      
      // Create payment intent (authorize only, don't capture)
      paymentIntent = await stripeService.createPaymentIntent({
        amount: fees.userTotal,
        customerId: stripeCustomerId,
        paymentMethodId,
        providerId,
        serviceName: service.name
      });
      
      // Check if payment needs additional action (3DS)
      if (paymentIntent.requiresAction) {
        return res.status(200).json({
          requiresAction: true,
          clientSecret: paymentIntent.clientSecret,
          nextActionUrl: paymentIntent.nextActionUrl
        });
      }
    } // End of payment processing block

    // Create booking
    const booking = new Booking({
      user: userId,
      provider: providerId,
      service: {
        serviceId: service.serviceId || service._id,
        name: service.name,
        category: service.category,
        duration: service.duration,
        price: service.price
      },
      teamMember: teamMember ? {
        memberId: teamMember.memberId || teamMember._id,
        name: teamMember.name
      } : undefined,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: hasCalendarIntegration ? 'confirmed' : 'pending',
      payment: chargeType === 'at_visit' ? {
        method: 'at_visit',
        servicePrice: fees.servicePrice,
        platformFee: fees.platformFee,
        stripeFee: fees.stripeFee,
        providerPayout: fees.providerPayout,
        total: fees.userTotal,
        status: 'pending',
        chargeType: 'at_visit'
      } : {
        method: 'card',
        stripeCustomerId,
        stripePaymentMethodId: paymentMethodId,
        stripePaymentIntentId: paymentIntent?.id,
        servicePrice: fees.servicePrice,
        platformFee: fees.platformFee,
        stripeFee: fees.stripeFee,
        providerPayout: fees.providerPayout,
        total: fees.userTotal,
        status: paymentIntent ? 'authorized' : 'pending',
        authorizedAt: paymentIntent ? new Date() : undefined,
        chargeType: chargeType
      },
      notes,
      bookingRequest: hasCalendarIntegration ? undefined : {
        isRequest: true,
        requestedAt: new Date(),
        expiresAt: getRequestExpirationDate(new Date())
      }
    });

    await booking.save();

    // Increment provider bookingCount
    await Provider.findByIdAndUpdate(providerId, { $inc: { bookingCount: 1 } });


    // Send notifications (non-blocking - don't let email failure block booking)
    const providerEmail = provider.contactInfo?.email || provider.email;
    
    // Fire and forget - don't await emails
    (async () => {
      try {
        if (hasCalendarIntegration) {
          await emailService.sendBookingConfirmed(user.email, booking, provider);
          if (providerEmail) {
            await emailService.sendProviderNewBooking(providerEmail, booking, user);
          }
        } else {
          await emailService.sendBookingRequest(user.email, booking, provider);
          if (providerEmail) {
            await emailService.sendProviderBookingRequest(providerEmail, booking, user);
          }
        }
              } catch (emailErr) {
        console.error('Email notification failed (non-blocking):', emailErr.message);
      }
    })();

    res.status(201).json({
      success: true,
      booking: {
        _id: booking._id,
        confirmationCode: booking.confirmationCode,
        status: booking.status,
        appointmentDate: booking.appointmentDate,
        appointmentTime: booking.appointmentTime,
        service: booking.service,
        provider: {
          _id: provider._id,
          practiceName: provider.practiceName,
          address: provider.address
        },
        payment: {
          total: booking.payment.total,
          status: booking.payment.status
        }
      },
      isRequest: !hasCalendarIntegration,
      message: hasCalendarIntegration 
        ? 'Booking confirmed!' 
        : 'Booking request sent. Provider will confirm within 48 hours.'
    });

  } catch (error) {
    console.error('Create booking error:', error);
    
    // Handle Stripe errors gracefully
    if (error.type === 'StripeCardError') {
      return res.status(400).json({ 
        error: 'Payment failed', 
        message: error.message 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// ==================== GET USER'S BOOKINGS ====================

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, limit = 20, page = 1 } = req.query;

    const query = { user: userId };
    
    // Filter by status tab
    if (status === 'upcoming') {
      query.status = { $in: ['pending', 'confirmed'] };
      query.appointmentDate = { $gte: new Date() };
    } else if (status === 'completed') {
      query.status = 'completed';
    } else if (status === 'cancelled') {
      query.status = { $in: ['cancelled_by_user', 'cancelled_by_provider', 'expired', 'no_show'] };
    }

    const bookings = await Booking.find(query)
      .populate('provider', 'practiceName address photos rating contactInfo')
      .sort({ appointmentDate: status === 'upcoming' ? 1 : -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      bookings,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== GET BOOKING DETAIL ====================

router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('provider', 'practiceName address photos contactInfo cancellationPolicy calendar')
      .populate('user', 'firstName lastName email phone');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ success: true, booking });

  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== GET CANCELLATION QUOTE ====================

router.get('/:id/cancellation-quote', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('provider', 'cancellationPolicy');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ error: 'Booking cannot be cancelled' });
    }

    const policyTier = booking.provider?.cancellationPolicy?.tier || 'standard';
    const quote = getCancellationQuote(
      booking.appointmentDate,
      booking.payment.total,
      policyTier
    );

    res.json({
      success: true,
      quote
    });

  } catch (error) {
    console.error('Get cancellation quote error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== CANCEL BOOKING ====================

router.post('/:id/cancel', async (req, res) => {
  try {
    const { cancelledBy = 'user', reason } = req.body;
    
    const booking = await Booking.findById(req.params.id)
      .populate('provider', 'cancellationPolicy contactInfo practiceName')
      .populate('user', 'email firstName lastName');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ error: 'Booking cannot be cancelled' });
    }

    // Calculate fee
    const policyTier = booking.provider?.cancellationPolicy?.tier || 'standard';
    const fee = calculateCancellationFee(
      booking.appointmentDate,
      booking.payment.total,
      policyTier
    );

    // Provider cancels = full refund always
    const isByProvider = cancelledBy === 'provider';
    const actualFee = isByProvider ? 0 : fee.feeAmount;
    const refundAmount = booking.payment.total - actualFee;

    // Process Stripe
    let refundResult = null;
    if (booking.payment.stripePaymentIntentId) {
      if (refundAmount > 0) {
        // If payment was captured, refund it
        // If only authorized, cancel the intent
        const paymentIntent = await stripeService.getPaymentIntent(booking.payment.stripePaymentIntentId);
        
        if (paymentIntent.status === 'requires_capture') {
          // Cancel the authorization
          await stripeService.cancelPaymentIntent(booking.payment.stripePaymentIntentId);
        } else if (paymentIntent.status === 'succeeded') {
          // Refund the captured payment
          refundResult = await stripeService.createRefund(
            booking.payment.stripePaymentIntentId,
            refundAmount,
            isByProvider ? 'requested_by_customer' : 'requested_by_customer'
          );
        }
      } else if (actualFee > 0) {
        // Capture only the fee amount
        await stripeService.capturePaymentIntent(
          booking.payment.stripePaymentIntentId,
          actualFee
        );
      }
    }

    // Update booking
    booking.status = isByProvider ? 'cancelled_by_provider' : 'cancelled_by_user';
    booking.cancellation = {
      cancelledAt: new Date(),
      cancelledBy,
      reason,
      policyTier,
      hoursBeforeAppointment: fee.hoursBeforeAppointment,
      feePercent: fee.feePercent,
      feeAmount: actualFee,
      refundAmount,
      stripeRefundId: refundResult?.id
    };
    booking.payment.status = refundAmount > 0 ? 'refunded' : 'captured';
    if (refundResult) {
      booking.payment.refundedAt = new Date();
    }

    await booking.save();


    // Send notifications
    const providerEmail = booking.provider?.contactInfo?.email;
    
    if (isByProvider) {
      await emailService.sendUserBookingCancelledByProvider(
        booking.user.email,
        booking,
        booking.provider
      );
    } else {
      await emailService.sendUserBookingCancelledByUser(
        booking.user.email,
        booking,
        booking.provider
      );
      if (providerEmail) {
        await emailService.sendProviderBookingCancelled(
          providerEmail,
          booking,
          booking.user
        );
      }
    }

    res.json({
      success: true,
      booking: {
        _id: booking._id,
        status: booking.status,
        cancellation: booking.cancellation
      },
      message: refundAmount > 0 
        ? `Booking cancelled. $${refundAmount.toFixed(2)} will be refunded.`
        : actualFee > 0 
          ? `Booking cancelled. A $${actualFee.toFixed(2)} cancellation fee was charged.`
          : 'Booking cancelled.'
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== RESCHEDULE BOOKING ====================

router.post('/:id/reschedule', async (req, res) => {
  try {
    const { newDate, newTime } = req.body;
    
    if (!newDate || !newTime) {
      return res.status(400).json({ error: 'New date and time required' });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('provider', 'practiceName')
      .populate('user', 'email firstName');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ error: 'Only confirmed bookings can be rescheduled' });
    }

    if (booking.rescheduleCount >= 2) {
      return res.status(400).json({ error: 'Maximum reschedule limit reached (2)' });
    }

    // Create new booking with same details but new date/time
    const newBooking = new Booking({
      user: booking.user._id,
      provider: booking.provider._id,
      service: booking.service,
      teamMember: booking.teamMember,
      appointmentDate: new Date(newDate),
      appointmentTime: newTime,
      status: 'confirmed',
      payment: { ...booking.payment.toObject() },
      notes: booking.notes,
      rescheduledFrom: booking._id,
      rescheduleCount: booking.rescheduleCount + 1
    });

    // Generate new confirmation code
    newBooking.confirmationCode = undefined;
    await newBooking.save();

    // Update old booking
    booking.status = 'rescheduled';
    booking.rescheduledTo = newBooking._id;
    await booking.save();


    res.json({
      success: true,
      newBooking: {
        _id: newBooking._id,
        confirmationCode: newBooking.confirmationCode,
        appointmentDate: newBooking.appointmentDate,
        appointmentTime: newBooking.appointmentTime,
        status: newBooking.status
      },
      message: 'Booking rescheduled successfully'
    });

  } catch (error) {
    console.error('Reschedule booking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== PROVIDER: CONFIRM REQUEST ====================

router.post('/:id/confirm', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('provider', 'practiceName')
      .populate('user', 'email firstName lastName');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Booking is not pending' });
    }

    // Update booking
    booking.status = 'confirmed';
    booking.bookingRequest.respondedAt = new Date();
    booking.bookingRequest.providerResponse = 'accepted';
    
    await booking.save();


    // Notify user
    await emailService.sendBookingConfirmed(booking.user.email, booking, booking.provider);

    res.json({ 
      success: true, 
      booking,
      message: 'Booking confirmed'
    });

  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== PROVIDER: DECLINE REQUEST ====================

router.post('/:id/decline', async (req, res) => {
  try {
    const { reason, counterOffer } = req.body;
    
    const booking = await Booking.findById(req.params.id)
      .populate('provider', 'practiceName')
      .populate('user', 'email firstName');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Booking is not pending' });
    }

    // Release the authorized payment
    if (booking.payment.stripePaymentIntentId) {
      await stripeService.cancelPaymentIntent(booking.payment.stripePaymentIntentId);
    }

    // Update booking
    booking.status = 'cancelled_by_provider';
    booking.bookingRequest.respondedAt = new Date();
    booking.bookingRequest.providerResponse = counterOffer ? 'counter_offered' : 'declined';
    
    if (counterOffer) {
      booking.bookingRequest.counterOffer = {
        date: new Date(counterOffer.date),
        time: counterOffer.time,
        message: counterOffer.message,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };
    }
    
    booking.cancellation = {
      cancelledAt: new Date(),
      cancelledBy: 'provider',
      reason,
      feeAmount: 0,
      refundAmount: booking.payment.total
    };
    booking.payment.status = 'cancelled';
    
    await booking.save();


    // Notify user
    // TODO: Add counter offer email template
    await emailService.sendUserBookingCancelledByProvider(
      booking.user.email,
      booking,
      booking.provider
    );

    res.json({ 
      success: true, 
      booking,
      message: counterOffer 
        ? 'Booking declined with counter offer sent'
        : 'Booking declined'
    });

  } catch (error) {
    console.error('Decline booking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== PROVIDER: MARK COMPLETED ====================

router.post('/:id/complete', async (req, res) => {
  try {
    const { adjustedAmount, adjustmentReason } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ error: 'Only confirmed bookings can be completed' });
    }

    // Determine capture amount
    const captureAmount = adjustedAmount || booking.payment.total;
    
    // Capture the payment
    if (booking.payment.stripePaymentIntentId && booking.payment.status === 'authorized') {
      await stripeService.capturePaymentIntent(
        booking.payment.stripePaymentIntentId,
        captureAmount
      );
    }

    // Update booking
    booking.status = 'completed';
    booking.payment.status = 'captured';
    booking.payment.capturedAt = new Date();
    
    if (adjustedAmount && adjustedAmount !== booking.payment.total) {
      booking.payment.adjustedAmount = adjustedAmount;
      booking.payment.adjustmentReason = adjustmentReason;
      
      // Recalculate fees for adjusted amount
      const newFees = calculateFees(adjustedAmount);
      booking.payment.platformFee = newFees.platformFee;
      booking.payment.stripeFee = newFees.stripeFee;
      booking.payment.providerPayout = newFees.providerPayout;
    }

    await booking.save();


    res.json({ 
      success: true, 
      booking,
      message: 'Booking marked as completed'
    });

  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== PROVIDER: MARK NO-SHOW ====================

router.post('/:id/no-show', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('provider', 'cancellationPolicy')
      .populate('user', 'email firstName');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ error: 'Only confirmed bookings can be marked as no-show' });
    }

    // Capture full amount (100% no-show fee)
    if (booking.payment.stripePaymentIntentId && booking.payment.status === 'authorized') {
      await stripeService.capturePaymentIntent(
        booking.payment.stripePaymentIntentId,
        booking.payment.total
      );
    }

    // Update booking
    booking.status = 'no_show';
    booking.cancellation = {
      cancelledAt: new Date(),
      cancelledBy: 'system',
      reason: 'Patient did not show up',
      feePercent: 100,
      feeAmount: booking.payment.total,
      refundAmount: 0
    };
    booking.payment.status = 'captured';
    booking.payment.capturedAt = new Date();

    await booking.save();


    // Notify user
    // TODO: Add no-show email template

    res.json({ 
      success: true, 
      booking,
      message: 'Booking marked as no-show. Full amount captured.'
    });

  } catch (error) {
    console.error('No-show booking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== PROVIDER: WAIVE FEE ====================

router.post('/:id/waive-fee', async (req, res) => {
  try {
    const { reason, waivedBy } = req.body;
    
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (!booking.cancellation || booking.cancellation.feeAmount === 0) {
      return res.status(400).json({ error: 'No fee to waive' });
    }

    if (booking.cancellation.feeWaived) {
      return res.status(400).json({ error: 'Fee already waived' });
    }

    // Refund the fee if it was already captured
    if (booking.payment.status === 'captured' && booking.cancellation.feeAmount > 0) {
      await stripeService.createRefund(
        booking.payment.stripePaymentIntentId,
        booking.cancellation.feeAmount
      );
    }

    // Update booking
    booking.cancellation.feeWaived = true;
    booking.cancellation.feeWaivedBy = waivedBy;
    booking.cancellation.feeWaivedReason = reason;
    booking.cancellation.refundAmount = booking.payment.total; // Full refund now
    booking.payment.status = 'refunded';

    await booking.save();


    res.json({ 
      success: true, 
      booking,
      message: 'Cancellation fee waived'
    });

  } catch (error) {
    console.error('Waive fee error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
