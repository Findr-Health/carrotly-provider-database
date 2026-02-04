// backend/services/PaymentService.js
// Centralized payment logic for 80/20 binary policy

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');
const { calculatePlatformFee } = require('../utils/platformFee');

class PaymentService {
  
  /**
   * Charge 80% deposit at booking creation
   * @param {Object} bookingData - Booking details
   * @returns {Object} Payment result
   */
  async chargeDeposit(bookingData) {
    const {
      totalAmount,
      customerId,
      paymentMethodId,
      bookingId,
      serviceName,
      providerName
    } = bookingData;
    
    const depositAmount = totalAmount * 0.80;
    const finalAmount = totalAmount * 0.20;
    const platformFee = calculatePlatformFee(totalAmount);
    
    try {
      // Create PaymentIntent for deposit (80%)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(depositAmount * 100), // Convert to cents
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId,
        confirm: true,
        capture_method: 'automatic', // Charge immediately
        metadata: {
          bookingId: bookingId.toString(),
          paymentType: 'deposit',
          depositPercent: '80',
          totalAmount: totalAmount.toString(),
          platformFee: platformFee.toString()
        },
        description: `Findr Health - ${serviceName} at ${providerName} - Deposit (80%)`,
        statement_descriptor: 'FINDR*Deposit',
        
        // Error handling
        error_on_requires_action: false,
        
        // Off-session support (for saved cards)
        off_session: false // First charge is on-session
      });
      
      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        depositAmount,
        finalAmount,
        platformFee,
        chargedAt: new Date()
      };
      
    } catch (error) {
      console.error('❌ Deposit charge failed:', error);
      
      // Parse Stripe error
      const errorMessage = error.code === 'card_declined' 
        ? 'Your card was declined. Please try a different payment method.'
        : error.message;
      
      return {
        success: false,
        error: errorMessage,
        errorCode: error.code,
        depositAmount,
        finalAmount,
        platformFee
      };
    }
  }
  
  /**
   * Process cancellation with 48-hour binary logic
   * @param {Object} booking - Booking document
   * @param {String} cancelledBy - 'patient', 'provider', or 'admin'
   * @param {String} reason - Cancellation reason
   * @returns {Object} Cancellation result
   */
  async processCancellation(booking, cancelledBy, reason) {
    const now = new Date();
    const appointmentTime = new Date(booking.requestedStart);
    const hoursUntil = (appointmentTime - now) / (1000 * 60 * 60);
    
    // BINARY DECISION: 48 hours
    const refundEligible = hoursUntil >= 48;
    
    let refundAmount = 0;
    let refundId = null;
    
    try {
      // CASE 1: Provider cancellation = ALWAYS full refund
      if (cancelledBy === 'provider') {
        refundAmount = booking.payment.depositAmount;
        
        const refund = await stripe.refunds.create({
          payment_intent: booking.payment.depositPaymentIntentId,
          amount: Math.round(refundAmount * 100),
          reason: 'requested_by_customer',
          metadata: {
            bookingId: booking._id.toString(),
            cancelledBy: 'provider',
            reason,
            hoursBeforeAppointment: hoursUntil.toFixed(2)
          }
        });
        
        refundId = refund.id;
        
        console.log(`✅ Provider cancellation refund processed: $${refundAmount}`);
        
        // TODO: Issue $20 platform credit to patient
        // await this.issuePlatformCredit(booking.patient._id, 20, 'Provider cancellation compensation');
      }
      
      // CASE 2: Patient cancels >= 48 hours = Full refund
      else if (refundEligible) {
        refundAmount = booking.payment.depositAmount;
        
        const refund = await stripe.refunds.create({
          payment_intent: booking.payment.depositPaymentIntentId,
          amount: Math.round(refundAmount * 100),
          reason: 'requested_by_customer',
          metadata: {
            bookingId: booking._id.toString(),
            cancelledBy,
            reason,
            hoursBeforeAppointment: hoursUntil.toFixed(2)
          }
        });
        
        refundId = refund.id;
        
        console.log(`✅ Early cancellation refund processed: $${refundAmount} (${hoursUntil.toFixed(1)} hours notice)`);
      }
      
      // CASE 3: Patient cancels < 48 hours = No refund
      else {
        refundAmount = 0;
        console.log(`⚠️ Late cancellation - no refund (${hoursUntil.toFixed(1)} hours notice, <48hr threshold)`);
        
        // Platform fee is charged on the kept deposit
        // Provider will receive: depositAmount - platformFee
      }
      
      return {
        success: true,
        refunded: refundAmount,
        kept: booking.payment.depositAmount - refundAmount,
        refundId,
        refundEligible,
        hoursBeforeAppointment: hoursUntil
      };
      
    } catch (error) {
      console.error('❌ Refund failed:', error);
      
      return {
        success: false,
        error: error.message,
        refunded: 0,
        kept: booking.payment.depositAmount,
        hoursBeforeAppointment: hoursUntil
      };
    }
  }
  
  /**
   * Charge remaining 20% after service completion
   * @param {Object} booking - Booking document
   * @returns {Object} Payment result
   */
  async chargeFinalPayment(booking) {
    const finalAmount = booking.payment.finalAmount + (booking.payment.adjustmentTotal || 0);
    
    try {
      // Charge remaining 20% (+ any adjustments)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(finalAmount * 100),
        currency: 'usd',
        customer: booking.patient.stripeCustomerId,
        payment_method: booking.payment.paymentMethodId,
        confirm: true,
        off_session: true, // Charge without customer present
        metadata: {
          bookingId: booking._id.toString(),
          paymentType: 'final',
          finalPercent: '20',
          totalAmount: booking.payment.totalAmount.toString(),
          adjustmentTotal: (booking.payment.adjustmentTotal || 0).toString()
        },
        description: `Findr Health - ${booking.service.name} - Final Payment (20%)`,
        statement_descriptor: 'FINDR*Final'
      });
      
      console.log(`✅ Final payment charged: $${finalAmount}`);
      
      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        finalAmount,
        chargedAt: new Date()
      };
      
    } catch (error) {
      console.error('❌ Final payment failed:', error);
      
      // Card declined or expired
      return {
        success: false,
        error: error.message,
        errorCode: error.code,
        finalAmount,
        requiresRetry: error.code === 'card_declined' || error.code === 'expired_card'
      };
    }
  }
  
  /**
   * Transfer funds to provider's Stripe Connect account
   * @param {Object} booking - Booking document
   * @returns {Object} Transfer result
   */
  async transferToProvider(booking) {
    if (!booking.provider.stripeAccountId) {
      throw new Error('Provider has no Stripe Connect account');
    }
    
    const totalPaid = booking.payment.totalAmount;
    const platformFee = booking.payment.platformFee;
    const providerPayout = totalPaid - platformFee;
    
    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(providerPayout * 100),
        currency: 'usd',
        destination: booking.provider.stripeAccountId,
        transfer_group: booking.bookingNumber,
        metadata: {
          bookingId: booking._id.toString(),
          bookingNumber: booking.bookingNumber,
          totalPaid: totalPaid.toString(),
          platformFee: platformFee.toString(),
          providerPayout: providerPayout.toString()
        },
        description: `Booking ${booking.bookingNumber} - ${booking.service.name}`
      });
      
      console.log(`✅ Provider payout transferred: $${providerPayout} (fee: $${platformFee})`);
      
      return {
        success: true,
        transferId: transfer.id,
        providerPayout,
        platformFee,
        transferredAt: new Date()
      };
      
    } catch (error) {
      console.error('❌ Provider transfer failed:', error);
      
      return {
        success: false,
        error: error.message,
        providerPayout,
        platformFee
      };
    }
  }
  
  /**
   * Adjust service price (up to 15% increase allowed)
   * @param {Object} booking - Booking document
   * @param {Array} adjustments - [{name, amount}]
   * @param {String} reason - Adjustment reason
   * @returns {Object} Adjustment result
   */
  async adjustServicePrice(booking, adjustments, reason) {
    const originalTotal = booking.payment.totalAmount;
    const adjustmentTotal = adjustments.reduce((sum, adj) => sum + adj.amount, 0);
    const newTotal = originalTotal + adjustmentTotal;
    const percentIncrease = (adjustmentTotal / originalTotal) * 100;
    
    // Validate 15% limit
    if (percentIncrease > 15) {
      return {
        success: false,
        error: 'Adjustments cannot exceed 15% of original amount',
        percentIncrease: percentIncrease.toFixed(2),
        limit: 15
      };
    }
    
    // Update booking amounts
    booking.payment.adjustments = adjustments;
    booking.payment.adjustmentTotal = adjustmentTotal;
    booking.payment.totalAmount = newTotal;
    booking.payment.finalAmount = originalTotal * 0.20 + adjustmentTotal; // Adjustment added to final payment
    booking.payment.adjustmentReason = reason;
    
    await booking.save();
    
    console.log(`✅ Service adjusted: +$${adjustmentTotal} (${percentIncrease.toFixed(1)}%)`);
    
    return {
      success: true,
      adjustmentTotal,
      newTotal,
      percentIncrease: percentIncrease.toFixed(2),
      adjustments
    };
  }
  
  /**
   * Retry failed final payment
   * @param {Object} booking - Booking document
   * @returns {Object} Retry result
   */
  async retryFinalPayment(booking) {
    console.log(`🔄 Retrying final payment for booking ${booking.bookingNumber}`);
    
    // Try charging with saved payment method
    const result = await this.chargeFinalPayment(booking);
    
    if (result.success) {
      booking.payment.finalPaymentIntentId = result.paymentIntentId;
      booking.payment.finalChargedAt = result.chargedAt;
      booking.payment.finalStatus = 'succeeded';
      booking.payment.status = 'completed';
      await booking.save();
      
      console.log(`✅ Retry successful for booking ${booking.bookingNumber}`);
    } else {
      console.log(`❌ Retry failed for booking ${booking.bookingNumber}: ${result.error}`);
      
      // TODO: Send email to patient to update payment method
    }
    
    return result;
  }
}

module.exports = new PaymentService();
