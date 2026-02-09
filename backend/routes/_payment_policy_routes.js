// backend/routes/bookings.js - UPDATES FOR 80/20 PAYMENT POLICY
// This shows the modified endpoints - integrate into existing bookings.js file

const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const PaymentService = require('../services/PaymentService');
const { calculatePlatformFee, generateFeeBreakdown } = require('../utils/platformFee');
const { fromZonedTime } = require('date-fns-tz');

/**
 * POST /api/bookings
 * Create new booking with 80% deposit charge
 */
router.post('/', async (req, res) => {
  try {
    const {
      providerId,
      serviceId,
      teamMemberId,
      startTime,
      patientId,
      patientNote,
      paymentMethodId
    } = req.body;
    
    // Get service details and calculate amounts
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Calculate payment amounts
    const totalAmount = service.price;
    const depositAmount = totalAmount * 0.80;
    const finalAmount = totalAmount * 0.20;
    const platformFee = calculatePlatformFee(totalAmount);
    
    // Convert timezone
    const patientTz = req.headers['x-timezone'] || 'America/Denver';
    const requestedStart = fromZonedTime(startTime, patientTz);
    const requestedEnd = new Date(requestedStart.getTime() + service.duration * 60 * 1000);
    
    // Charge 80% deposit via PaymentService
    const paymentResult = await PaymentService.chargeDeposit({
      totalAmount,
      customerId: patient.stripeCustomerId,
      paymentMethodId,
      bookingId: 'temp', // Will update after creation
      serviceName: service.name,
      providerName: provider.businessName || provider.practiceName
    });
    
    if (!paymentResult.success) {
      return res.status(402).json({ 
        error: 'Payment failed',
        message: paymentResult.error,
        code: paymentResult.errorCode
      });
    }
    
    // Create booking with payment details
    const booking = await Booking.create({
      patient: patientId,
      provider: providerId,
      service: {
        serviceId,
        name: service.name,
        price: service.price,
        duration: service.duration,
        category: service.category
      },
      teamMember: teamMemberId,
      requestedStart,
      requestedEnd,
      status: 'pending_confirmation',
      patientNote,
      providerTimezone: provider.timezone || 'America/Denver',
      patientTimezone: patientTz,
      
      payment: {
        totalAmount,
        depositAmount,
        finalAmount,
        depositPaymentIntentId: paymentResult.paymentIntentId,
        depositChargedAt: paymentResult.chargedAt,
        depositStatus: 'succeeded',
        finalStatus: 'pending',
        platformFee,
        platformFeePercent: 10,
        platformFeeFlat: 1.50,
        providerPayout: totalAmount - platformFee,
        paymentMethodId,
        stripeCustomerId: patient.stripeCustomerId,
        status: 'deposit_charged'
      }
    });
    
    // Generate booking number
    booking.bookingNumber = `BK-${Date.now()}-${booking._id.toString().slice(-6).toUpperCase()}`;
    await booking.save();
    
    console.log(`✅ Booking created: ${booking.bookingNumber} - Deposit charged: $${depositAmount}`);
    
    // TODO: Send confirmation email
    // await NotificationService.sendBookingConfirmation(patient, provider, booking);
    
    res.status(201).json({
      success: true,
      booking: {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        requestedStart: booking.requestedStart,
        requestedEnd: booking.requestedEnd,
        service: booking.service,
        payment: {
          depositCharged: depositAmount,
          finalPaymentDue: finalAmount,
          totalAmount,
          platformFee
        }
      },
      message: `Deposit of $${depositAmount} charged. Remaining $${finalAmount} will be charged after your appointment.`
    });
    
  } catch (error) {
    console.error('❌ Booking creation failed:', error);
    res.status(500).json({ 
      error: 'Failed to create booking',
      message: error.message
    });
  }
});

/**
 * POST /api/bookings/:id/cancel-patient
 * Patient cancels booking (48-hour binary logic)
 */
router.post('/:id/cancel-patient', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const patientId = req.headers['x-user-id']; // From auth middleware
    
    const booking = await Booking.findById(id)
      .populate('provider', 'businessName practiceName email')
      .populate('patient', 'name email');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Verify patient owns this booking
    if (booking.patient._id.toString() !== patientId) {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }
    
    // Check if already cancelled
    if (booking.status.includes('cancelled')) {
      return res.status(400).json({ error: 'Booking already cancelled' });
    }
    
    // Check if already completed
    if (booking.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel completed booking' });
    }
    
    // Process cancellation with 48-hour binary logic
    const cancellationResult = await PaymentService.processCancellation(
      booking,
      'patient',
      reason
    );
    
    if (!cancellationResult.success) {
      return res.status(500).json({ 
        error: 'Cancellation failed',
        message: cancellationResult.error
      });
    }
    
    // Update booking
    booking.status = 'cancelled_patient';
    booking.cancellation = {
      cancelledAt: new Date(),
      cancelledBy: 'patient',
      reason,
      hoursBeforeAppointment: cancellationResult.hoursBeforeAppointment,
      refundEligible: cancellationResult.refundEligible
    };
    booking.payment.refundId = cancellationResult.refundId;
    booking.payment.refundAmount = cancellationResult.refunded;
    booking.payment.refundedAt = cancellationResult.refunded > 0 ? new Date() : null;
    booking.payment.status = cancellationResult.refunded > 0 ? 'refunded' : 'no_refund';
    
    await booking.save();
    
    console.log(`✅ Patient cancelled: ${booking.bookingNumber} - Refunded: $${cancellationResult.refunded}`);
    
    // TODO: Send cancellation emails
    // await NotificationService.sendCancellationConfirmation(booking.patient, booking, cancellationResult);
    // await NotificationService.notifyProviderOfCancellation(booking.provider, booking);
    
    res.json({
      success: true,
      booking: {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        status: booking.status
      },
      cancellation: {
        refunded: cancellationResult.refunded,
        kept: cancellationResult.kept,
        hoursBeforeAppointment: cancellationResult.hoursBeforeAppointment,
        refundEligible: cancellationResult.refundEligible,
        message: cancellationResult.refundEligible
          ? `Full refund of $${cancellationResult.refunded} processed`
          : `No refund - cancelled less than 48 hours before appointment`
      }
    });
    
  } catch (error) {
    console.error('❌ Patient cancellation failed:', error);
    res.status(500).json({ 
      error: 'Failed to cancel booking',
      message: error.message
    });
  }
});

/**
 * POST /api/bookings/:id/cancel-provider
 * Provider cancels booking (always full refund + credit)
 */
router.post('/:id/cancel-provider', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const providerId = req.headers['x-provider-id']; // From auth middleware
    
    const booking = await Booking.findById(id)
      .populate('provider', 'businessName practiceName email')
      .populate('patient', 'name email');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Verify provider owns this booking
    if (booking.provider._id.toString() !== providerId) {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }
    
    // Check if already cancelled/completed
    if (booking.status.includes('cancelled') || booking.status === 'completed') {
      return res.status(400).json({ error: `Cannot cancel ${booking.status} booking` });
    }
    
    // Process cancellation (always full refund for provider cancellation)
    const cancellationResult = await PaymentService.processCancellation(
      booking,
      'provider',
      reason
    );
    
    if (!cancellationResult.success) {
      return res.status(500).json({ 
        error: 'Cancellation failed',
        message: cancellationResult.error
      });
    }
    
    // Update booking
    booking.status = 'cancelled_provider';
    booking.cancellation = {
      cancelledAt: new Date(),
      cancelledBy: 'provider',
      reason,
      hoursBeforeAppointment: cancellationResult.hoursBeforeAppointment,
      refundEligible: true // Always true for provider cancellations
    };
    booking.payment.refundId = cancellationResult.refundId;
    booking.payment.refundAmount = cancellationResult.refunded;
    booking.payment.refundedAt = new Date();
    booking.payment.status = 'refunded';
    
    await booking.save();
    
    // Track provider cancellation
    const provider = await Provider.findById(providerId);
    provider.cancellationHistory = provider.cancellationHistory || [];
    provider.cancellationHistory.push({
      bookingId: booking._id,
      cancelledAt: new Date(),
      reason,
      hoursBeforeAppointment: cancellationResult.hoursBeforeAppointment
    });
    
    // Count cancellations in last 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const recentCancellations = provider.cancellationHistory.filter(
      c => c.cancelledAt > ninetyDaysAgo
    ).length;
    
    // Issue warnings/suspensions
    if (recentCancellations === 2) {
      provider.cancellationWarning = true;
      // TODO: Send warning email
    } else if (recentCancellations === 3) {
      provider.accountStatus = 'under_review';
      // TODO: Notify admin team
    } else if (recentCancellations >= 4) {
      provider.accountStatus = 'suspended';
      // TODO: Suspend account
    }
    
    await provider.save();
    
    console.log(`⚠️ Provider cancelled: ${booking.bookingNumber} - Refunded: $${cancellationResult.refunded} - Total cancellations (90d): ${recentCancellations}`);
    
    // TODO: Send emails + issue $20 credit
    // await NotificationService.sendProviderCancellationToPatient(booking.patient, booking);
    // await NotificationService.issuePlatformCredit(booking.patient._id, 20, 'Provider cancellation compensation');
    
    res.json({
      success: true,
      booking: {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        status: booking.status
      },
      cancellation: {
        refunded: cancellationResult.refunded,
        creditIssued: 20,
        hoursBeforeAppointment: cancellationResult.hoursBeforeAppointment
      },
      message: `Patient refunded $${cancellationResult.refunded} + $20 platform credit`,
      warning: recentCancellations >= 2 ? `Warning: ${recentCancellations} cancellations in last 90 days` : null
    });
    
  } catch (error) {
    console.error('❌ Provider cancellation failed:', error);
    res.status(500).json({ 
      error: 'Failed to cancel booking',
      message: error.message
    });
  }
});

/**
 * POST /api/bookings/:id/complete
 * Mark booking as complete and charge final 20%
 */
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { adjustments } = req.body; // Optional price adjustments
    const providerId = req.headers['x-provider-id'];
    
    const booking = await Booking.findById(id)
      .populate('provider', 'businessName stripeAccountId')
      .populate('patient', 'name email');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Verify provider owns this booking
    if (booking.provider._id.toString() !== providerId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Check if already completed
    if (booking.status === 'completed') {
      return res.status(400).json({ error: 'Booking already completed' });
    }
    
    // Apply adjustments if provided
    if (adjustments && adjustments.length > 0) {
      const adjustmentResult = await PaymentService.adjustServicePrice(
        booking,
        adjustments,
        'Services added during appointment'
      );
      
      if (!adjustmentResult.success) {
        return res.status(400).json({ 
          error: 'Adjustment failed',
          message: adjustmentResult.error
        });
      }
    }
    
    // Charge final 20%
    const finalPaymentResult = await PaymentService.chargeFinalPayment(booking);
    
    if (!finalPaymentResult.success) {
      // Payment failed - mark for retry
      booking.payment.finalStatus = 'failed';
      booking.payment.status = 'final_payment_failed';
      await booking.save();
      
      return res.status(402).json({ 
        error: 'Final payment failed',
        message: finalPaymentResult.error,
        requiresRetry: finalPaymentResult.requiresRetry
      });
    }
    
    // Update booking
    booking.status = 'completed';
    booking.completedAt = new Date();
    booking.payment.finalPaymentIntentId = finalPaymentResult.paymentIntentId;
    booking.payment.finalChargedAt = finalPaymentResult.chargedAt;
    booking.payment.finalStatus = 'succeeded';
    booking.payment.status = 'completed';
    
    await booking.save();
    
    console.log(`✅ Booking completed: ${booking.bookingNumber} - Final payment: $${finalPaymentResult.finalAmount}`);
    
    // Transfer to provider (2-5 days via Stripe)
    const transferResult = await PaymentService.transferToProvider(booking);
    
    if (transferResult.success) {
      booking.payment.providerPayoutId = transferResult.transferId;
      booking.payment.providerPayoutAt = transferResult.transferredAt;
      await booking.save();
    }
    
    // TODO: Send receipt email
    // await NotificationService.sendReceipt(booking.patient, booking);
    
    res.json({
      success: true,
      booking: {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        completedAt: booking.completedAt
      },
      payment: {
        depositCharged: booking.payment.depositAmount,
        finalCharged: finalPaymentResult.finalAmount,
        totalCharged: booking.payment.totalAmount,
        platformFee: booking.payment.platformFee,
        providerReceives: booking.payment.providerPayout
      },
      message: `Service completed. Total charged: $${booking.payment.totalAmount}`
    });
    
  } catch (error) {
    console.error('❌ Complete booking failed:', error);
    res.status(500).json({ 
      error: 'Failed to complete booking',
      message: error.message
    });
  }
});

/**
 * GET /api/bookings/fee-breakdown/:amount
 * Get payment breakdown for a service amount (for display in booking flow)
 */
router.get('/fee-breakdown/:amount', (req, res) => {
  try {
    const amount = parseFloat(req.params.amount);
    
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    const breakdown = generateFeeBreakdown(amount);
    
    res.json({
      success: true,
      breakdown
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to calculate fee breakdown',
      message: error.message
    });
  }
});

module.exports = router;
