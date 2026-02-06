/**
 * Booking Model - Findr Health
 * Calendar-Optional Booking Flow
 * Created: January 15, 2026
 * 
 * Supports both:
 * - Instant Book (providers with connected calendars)
 * - Request Booking (providers without calendars - requires confirmation)
 */

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // ==================== BOOKING IDENTIFIER ====================
  bookingNumber: { 
    type: String, 
    unique: true, 
    sparse: true,
    index: true
    // Format: FH-YYYYMMDD-XXXXX (e.g., FH-20260115-A7B3C)
  },

  // ==================== RELATIONSHIPS ====================
  patient: { 
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


  // ==================== TEAM MEMBER (Optional) ====================
  teamMember: {
    memberId: String,  // ID from provider.teamMembers array
    name: String,      // Snapshot at booking time
    title: String      // Snapshot at booking time
  },
  // ==================== SERVICE DETAILS ====================
  service: {
    serviceId: String,
    name: { type: String, required: true },
    category: String,
    duration: { type: Number, required: true }, // minutes
    price: { type: Number, required: true },    // cents (USD)
    description: String
  },

  // ==================== BOOKING TYPE ====================
  bookingType: {
    type: String,
    enum: ['instant', 'request'],
    default: 'instant',
    index: true
  },

  // ==================== STATUS (State Machine) ====================
  status: {
    type: String,
    enum: [
      // Initial states
      'slot_reserved',        // Temporary hold during checkout (5 min TTL)
      'pending_payment',      // Awaiting payment processing
      
      // Request flow states
      'pending_confirmation', // Request booking awaiting provider response
      'reschedule_proposed',  // Provider proposed alternative time
      
      // Confirmed states
      'confirmed',            // Booking confirmed (instant or accepted)
      
      // Active states
      'checked_in',           // Patient has arrived
      'in_progress',          // Service being delivered
      
      // Terminal states
      'completed',            // Service delivered successfully
      'cancelled_patient',    // Cancelled by patient
      'cancelled_provider',   // Cancelled by provider
      'cancelled_admin',      // Cancelled by admin
      'expired',              // Provider didn't respond in time
      'no_show',              // Patient didn't show up
      'payment_failed'        // Payment capture failed
    ],
    default: 'pending_payment',
    index: true
  },

  // ==================== DATE/TIME ====================
  dateTime: {
    // All times stored in UTC
    requestedStart: { type: Date, required: true, index: true },
    requestedEnd: { type: Date, required: true },
    confirmedStart: Date,  // May differ if rescheduled
    confirmedEnd: Date,
    actualStart: Date,     // When service actually started
    actualEnd: Date,       // When service actually ended
    
    // Timezone context (IANA timezone names)
    providerTimezone: { type: String, default: 'America/Denver' },
    patientTimezone: { type: String, default: 'America/Denver' },
    
    // Buffer time
    bufferMinutes: { type: Number, default: 0 }
  },

  // ==================== SLOT RESERVATION ====================
  slotReservation: {
    reservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'SlotReservation' },
    reservedAt: Date,
    expiresAt: Date,
    released: { type: Boolean, default: false },
    releasedAt: Date,
    releasedReason: String
  },

  // ==================== CONFIRMATION (Request Bookings) ====================
  confirmation: {
    required: { type: Boolean, default: false },
    requestedAt: Date,
    expiresAt: Date,           // 24hr deadline
    respondedAt: Date,
    responseType: {
      type: String,
      enum: ['confirmed', 'rescheduled', 'declined', 'expired', null]
    },
    declineReason: String,
    remindersSent: { type: Number, default: 0 }
  },

  // ==================== RESCHEDULE TRACKING ====================
  reschedule: {
    count: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 2 },
    current: {
      proposedBy: { type: String, enum: ['provider', 'patient', null] },
      proposedAt: Date,
      proposedStart: Date,
      proposedEnd: Date,
      responseDeadline: Date,
      message: String
    },
    history: [{
      attemptNumber: Number,
      fromStart: Date,
      fromEnd: Date,
      toStart: Date,
      toEnd: Date,
      proposedBy: String,
      proposedAt: Date,
      respondedAt: Date,
      accepted: Boolean,
      message: String
    }]
  },

  // ==================== PAYMENT ====================

  // ==================== CALENDAR INTEGRATION ====================
  calendar: {
    eventRequired: { type: Boolean, default: false },
    eventCreated: { type: Boolean, default: false },
    provider: String,          // 'google' or 'microsoft'
    eventId: String,
    eventLink: String,
    syncStatus: {
      type: String,
      enum: ['pending', 'synced', 'failed', 'not_applicable', 'deleted'],
      default: 'not_applicable'
    },
    syncError: String,
    syncAttempts: { type: Number, default: 0 }
  },

  // ==================== NOTIFICATIONS ====================
  notifications: {
    patient: {
      confirmed: { sent: Boolean, sentAt: Date },
      rescheduleProposed: { sent: Boolean, sentAt: Date },
      declined: { sent: Boolean, sentAt: Date },
      expired: { sent: Boolean, sentAt: Date },
      reminder24h: { sent: Boolean, sentAt: Date },
      reminder1h: { sent: Boolean, sentAt: Date }
    },
    provider: {
      newRequest: { sent: Boolean, sentAt: Date },
      expiringWarning: { sent: Boolean, sentAt: Date },
      patientCancelled: { sent: Boolean, sentAt: Date },
      rescheduleAccepted: { sent: Boolean, sentAt: Date },
      rescheduleDeclined: { sent: Boolean, sentAt: Date }
    }
  },

  // ==================== LOCATION ====================
  location: {
    type: { type: String, enum: ['in_person', 'telehealth', 'home_visit'] },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String
    },
    meetingLink: String,       // For telehealth
    instructions: String       // Special instructions
  },

  // ==================== NOTES ====================
  notes: {
    patientNotes: String,      // Patient's message to provider
    providerNotes: String,     // Provider's internal notes
    adminNotes: String,        // Admin notes
    cancellationReason: String
  },

  // ==================== METADATA ====================
  metadata: {
    source: { 
      type: String, 
      enum: ['app', 'web', 'admin', 'api'], 
      default: 'app' 
    },
    appVersion: String,
    userAgent: String,
    ipAddress: String,
    deviceId: String
  },

  // ==================== IDEMPOTENCY ====================
  idempotencyKey: { 
    type: String, 
    unique: true, 
    sparse: true 
  },

  // ==================== VERSION (Optimistic Locking) ====================
  version: { type: Number, default: 1 }
,

  // ==================== PAYMENT TRACKING (80/20 Binary) ====================
  payment: {
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
        const expected = this.totalAmount * 0.80;
        return Math.abs(v - expected) < 0.01; // Allow 1 cent tolerance for floating point
      },
      message: 'Deposit must be 80% of total amount (within 1 cent)'
    }
  },
  finalAmount: {
    type: Number,
    required: true,
    validate: {
      validator: function(v) {
        const expected = this.totalAmount * 0.20;
        return Math.abs(v - expected) < 0.01; // Allow 1 cent tolerance for floating point
      },
      message: 'Final amount must be 20% of total amount (within 1 cent)'
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
},

  // ==================== CANCELLATION TRACKING (48-Hour Threshold) ====================
  cancellation: {
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
}
}, {
  timestamps: true  // Adds createdAt, updatedAt
});

// ==================== INDEXES ====================
bookingSchema.index({ provider: 1, 'dateTime.requestedStart': 1 });
bookingSchema.index({ patient: 1, status: 1, createdAt: -1 });
bookingSchema.index({ status: 1, 'confirmation.expiresAt': 1 });
bookingSchema.index({ bookingType: 1, status: 1, createdAt: -1 });
bookingSchema.index({ 
  provider: 1, 
  status: 1, 
  'dateTime.requestedStart': 1 
}, { 
  name: 'provider_availability_lookup' 
});

// ==================== VIRTUALS ====================
bookingSchema.virtual('isExpired').get(function() {
  return this.status === 'expired' || 
    (this.status === 'pending_confirmation' && 
     this.confirmation?.expiresAt < new Date());
});

bookingSchema.virtual('canReschedule').get(function() {
  return (this.reschedule?.count || 0) < (this.reschedule?.maxAttempts || 2);
});

bookingSchema.virtual('isTerminal').get(function() {
  const terminalStatuses = [
    'completed', 'cancelled_patient', 'cancelled_provider', 
    'cancelled_admin', 'expired', 'no_show'
  ];
  return terminalStatuses.includes(this.status);
});

// ==================== METHODS ====================
bookingSchema.methods.generateBookingNumber = async function() {
  const maxRetries = 5;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const bookingNumber = `FH-${month}${day}-${random}`;
    
    // Check for collision
    const existing = await this.constructor.findOne({ bookingNumber });
    if (!existing) {
      this.bookingNumber = bookingNumber;
      return this.bookingNumber;
    }
    
    attempt++;
  }
  
  throw new Error('Failed to generate unique booking number after 5 attempts');
};

bookingSchema.methods.calculatePlatformFee = function() {
  const amount = this.payment?.originalAmount || this.service?.price || 0;
  const percentage = this.payment?.platformFee?.percentage || 10;
  const flatFee = this.payment?.platformFee?.flatFee || 150;
  const maxFee = this.payment?.platformFee?.maxFee || 3500;
  
  const percentageFee = Math.round(amount * (percentage / 100));
  const totalFee = Math.min(percentageFee + flatFee, maxFee);
  
  if (!this.payment) this.payment = {};
  if (!this.payment.platformFee) this.payment.platformFee = {};
  this.payment.platformFee.calculatedFee = totalFee;
  
  return totalFee;
};

// ==================== STATICS ====================
bookingSchema.statics.findPendingExpiring = function(hoursAhead = 4) {
  const now = new Date();
  const future = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
  return this.find({
    status: 'pending_confirmation',
    'confirmation.expiresAt': { $gt: now, $lt: future }
  }).populate('patient provider');
};

bookingSchema.statics.findExpired = function() {
  return this.find({
    status: 'pending_confirmation',
    'confirmation.expiresAt': { $lt: new Date() }
  }).populate('patient provider');
};

bookingSchema.statics.getPendingCount = async function(providerId) {
  return this.countDocuments({
    provider: providerId,
    status: 'pending_confirmation'
  });
};

// ==================== PRE-SAVE HOOKS ====================
// bookingSchema.pre('save', async function(next) {
//   // Generate booking number if not set
//   if (!this.bookingNumber) {
//     await this.generateBookingNumber();
//   }
//   
//   // Calculate platform fee if amount is set
//   if (this.payment?.originalAmount || this.service?.price) {
//     this.calculatePlatformFee();
//   }
//   
//   // Increment version
//   if (this.isModified() && !this.isNew) {
//     this.version = (this.version || 0) + 1;
//   }
//   
//   next();
// });
// 
// Ensure virtuals are included in JSON output
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Booking', bookingSchema);
