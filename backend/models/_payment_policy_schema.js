// backend/models/Booking.js - UPDATES TO EXISTING MODEL

// Add these fields to the existing Booking schema:

const bookingPaymentSchema = {
  // Total amounts
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  depositAmount: {
    type: Number,
    required: true,
    validate: {
      validator: function(v) {
        return v === this.totalAmount * 0.80;
      },
      message: 'Deposit must be exactly 80% of total amount'
    }
  },
  finalAmount: {
    type: Number,
    required: true,
    validate: {
      validator: function(v) {
        return v === this.totalAmount * 0.20;
      },
      message: 'Final amount must be exactly 20% of total amount'
    }
  },
  
  // Deposit payment (charged at booking)
  depositPaymentIntentId: {
    type: String,
    index: true
  },
  depositChargedAt: Date,
  depositStatus: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  // Final payment (charged after service)
  finalPaymentIntentId: {
    type: String,
    index: true
  },
  finalChargedAt: Date,
  finalStatus: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'not_required'],
    default: 'pending'
  },
  
  // Refunds
  refundId: String,
  refundAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  refundedAt: Date,
  refundReason: String,
  
  // Adjustments (if provider adds services)
  adjustments: [{
    name: String,
    amount: Number,
    addedAt: Date,
    reason: String
  }],
  adjustmentTotal: {
    type: Number,
    default: 0
  },
  
  // Platform fee
  platformFee: {
    type: Number,
    required: true,
    min: 0,
    max: 35 // Fee cap
  },
  platformFeePercent: {
    type: Number,
    default: 10
  },
  platformFeeFlat: {
    type: Number,
    default: 1.50
  },
  
  // Provider payout
  providerPayout: {
    type: Number,
    min: 0
  },
  providerPayoutId: String, // Stripe Transfer ID
  providerPayoutAt: Date,
  
  // Payment status (overall)
  status: {
    type: String,
    enum: [
      'pending',
      'deposit_charged',
      'completed',
      'refunded',
      'partially_refunded',
      'payment_failed',
      'final_payment_failed',
      'disputed'
    ],
    default: 'pending',
    index: true
  },
  
  // Stripe metadata
  paymentMethodId: String, // For charging final payment
  stripeCustomerId: String,
  
  // Dispute tracking
  disputeId: String,
  disputeReason: String,
  disputeStatus: String,
  disputedAt: Date
};

const cancellationSchema = {
  cancelledAt: Date,
  cancelledBy: {
    type: String,
    enum: ['patient', 'provider', 'admin', 'system']
  },
  reason: String,
  hoursBeforeAppointment: Number,
  refundEligible: {
    type: Boolean,
    default: false
  },
  
  // Provider cancellation tracking
  providerCancellationCount: {
    type: Number,
    default: 0
  },
  providerLastCancellation: Date,
  providerWarningIssued: {
    type: Boolean,
    default: false
  },
  providerSuspended: {
    type: Boolean,
    default: false
  }
};

// IMPORTANT: These need to be added to the existing Booking model
// The complete model already exists, we're just adding these fields

// Usage in existing schema:
/*
const BookingSchema = new mongoose.Schema({
  // ... existing fields ...
  
  payment: bookingPaymentSchema,
  cancellation: cancellationSchema,
  
  // ... rest of existing fields ...
}, {
  timestamps: true
});
*/

module.exports = { bookingPaymentSchema, cancellationSchema };
