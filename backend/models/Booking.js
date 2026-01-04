const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  // References
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
    index: true
  },
  
  // Service details (snapshot at time of booking)
  service: {
    serviceId: String,
    name: { type: String, required: true },
    category: String,
    duration: { type: Number, required: true }, // minutes
    price: { type: Number, required: true }
  },
  
  // Team member (optional)
  teamMember: {
    memberId: String,
    name: String
  },
  
  // Appointment details
  appointmentDate: { 
    type: Date, 
    required: true,
    index: true
  },
  appointmentTime: { 
    type: String, 
    required: true  // "10:00 AM"
  },
  appointmentEndTime: String,
  timezone: {
    type: String,
    default: 'America/Denver'
  },
  
  // Status
  status: {
    type: String,
    enum: [
      'pending',              // Awaiting provider confirmation (non-integrated)
      'confirmed',            // Provider confirmed / instant booking
      'completed',            // Service delivered
      'cancelled_by_user',
      'cancelled_by_provider',
      'no_show',
      'rescheduled',
      'expired'               // Request timed out (48h no response)
    ],
    default: 'confirmed',
    index: true
  },
  
  // Payment
  payment: {
    method: {
      type: String,
      enum: ['card', 'apple_pay', 'google_pay'],
      default: 'card'
    },
    
    // Stripe IDs
    stripeCustomerId: String,
    stripePaymentMethodId: String,
    stripePaymentIntentId: String,
    
    // Amounts (in dollars, not cents)
    servicePrice: Number,       // Original service price
    platformFee: Number,        // Our fee: MIN((price × 10%) + $1.50, $35)
    stripeFee: Number,          // ~2.9% + $0.30
    providerPayout: Number,     // What provider receives
    
    // What user paid
    total: Number,              // = servicePrice (user pays service price only)
    currency: { 
      type: String, 
      default: 'usd' 
    },
    
    // Status
    status: {
      type: String,
      enum: ['pending', 'authorized', 'captured', 'refunded', 'partially_refunded', 'failed', 'cancelled'],
      default: 'pending'
    },
    
    // Timestamps
    authorizedAt: Date,
    capturedAt: Date,
    refundedAt: Date,
    
    // Adjustments (if provider changes amount after service)
    adjustedAmount: Number,
    adjustmentReason: String
  },
  
  // Cancellation details
  cancellation: {
    cancelledAt: Date,
    cancelledBy: { 
      type: String, 
      enum: ['user', 'provider', 'system'] 
    },
    reason: String,
    
    // Fee calculation snapshot
    policyTier: String,              // 'standard' or 'moderate'
    hoursBeforeAppointment: Number,
    feePercent: Number,
    feeAmount: Number,
    
    // Fee waiver (provider can waive)
    feeWaived: { type: Boolean, default: false },
    feeWaivedBy: mongoose.Schema.Types.ObjectId,
    feeWaivedReason: String,
    
    // Refund details
    refundAmount: Number,
    stripeRefundId: String
  },
  
  // Reschedule tracking
  rescheduledFrom: mongoose.Schema.Types.ObjectId,
  rescheduledTo: mongoose.Schema.Types.ObjectId,
  rescheduleCount: { type: Number, default: 0 },
  
  // User notes (optional message to provider)
  notes: String,
  
  // For non-integrated providers (request flow)
  bookingRequest: {
    isRequest: { type: Boolean, default: false },
    requestedAt: Date,
    reminderSentAt: Date,         // 24h reminder
    respondedAt: Date,
    expiresAt: Date,              // 48h from request
    
    providerResponse: { 
      type: String, 
      enum: ['accepted', 'declined', 'counter_offered'] 
    },
    
    // Counter offer details
    counterOffer: {
      date: Date,
      time: String,
      message: String,
      expiresAt: Date,            // 24h to accept counter
      userResponse: {
        type: String,
        enum: ['accepted', 'declined', 'expired']
      },
      userRespondedAt: Date
    }
  },
  
  // Confirmation details
  confirmationCode: String,       // Human-readable code like "FH-ABC123"
  
  // Calendar integration
  calendarEventId: String,
  
  // Reminders sent
  reminders: {
    dayBefore: { sent: Boolean, sentAt: Date },
    hourBefore: { sent: Boolean, sentAt: Date }
  }

}, { 
  timestamps: true  // Adds createdAt, updatedAt automatically
});

// Indexes for common queries
BookingSchema.index({ user: 1, status: 1, appointmentDate: -1 });
BookingSchema.index({ provider: 1, appointmentDate: 1, status: 1 });
BookingSchema.index({ 'payment.stripePaymentIntentId': 1 });
BookingSchema.index({ confirmationCode: 1 }, { unique: true, sparse: true });
BookingSchema.index({ 'bookingRequest.expiresAt': 1 }, { sparse: true });

// Generate confirmation code before save
BookingSchema.pre('save', function(next) {
  if (!this.confirmationCode) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars
    let code = 'FH-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.confirmationCode = code;
  }
  next();
});

// Virtual: Is booking in the past?
BookingSchema.virtual('isPast').get(function() {
  return new Date(this.appointmentDate) < new Date();
});

// Virtual: Can be cancelled?
BookingSchema.virtual('canCancel').get(function() {
  return ['pending', 'confirmed'].includes(this.status) && !this.isPast;
});

// Virtual: Can be rescheduled?
BookingSchema.virtual('canReschedule').get(function() {
  return ['confirmed'].includes(this.status) && 
         !this.isPast && 
         this.rescheduleCount < 2; // Max 2 reschedules
});

BookingSchema.set('toJSON', { virtuals: true });
BookingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Booking', BookingSchema);
