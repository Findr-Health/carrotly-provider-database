const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // References
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  
  // Service Details (snapshot at booking time - prices may change later)
  serviceId: String,  // Reference to provider's service subdocument
  serviceName: {
    type: String,
    required: true
  },
  servicePrice: {
    type: Number,
    required: true
  },
  serviceDuration: {
    type: Number,  // minutes
    required: true
  },
  serviceCategory: String,
  
  // Team member (if applicable)
  teamMemberId: String,
  teamMemberName: String,
  
  // Appointment Time
  appointmentDate: {
    type: Date,
    required: true
  },
  appointmentEndDate: Date,
  timezone: {
    type: String,
    default: 'America/Denver'
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  
  // Payment
  paymentStatus: {
    type: String,
    enum: ['pending', 'authorized', 'paid', 'partially_refunded', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentAmount: Number,
  serviceFee: {
    type: Number,
    default: 0
  },
  totalAmount: Number,  // servicePrice + serviceFee
  
  // Stripe
  stripePaymentIntentId: String,
  stripeChargeId: String,
  
  // Cancellation
  cancelledAt: Date,
  cancelledBy: {
    type: String,
    enum: ['user', 'provider', 'system', 'admin']
  },
  cancellationReason: String,
  refundAmount: Number,
  refundedAt: Date,
  // Cancellation Policy Details
  cancellationPolicy: {
    tierApplied: String,  // 'standard' or 'moderate'
    hoursBeforeAppointment: Number,
    feePercent: Number,
    feeAmount: Number,
    feeWaived: {
      type: Boolean,
      default: false
    },
    feeWaivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider'
    },
    feeWaivedReason: String,
    feeWaivedAt: Date
  },
  
  // Stripe Payment Method (for authorize-then-capture)
  stripeCustomerId: String,
  stripePaymentMethodId: String,

  // Rescheduling
  isRescheduled: {
    type: Boolean,
    default: false
  },
  rescheduledFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  rescheduledTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  
  // Notes
  userNotes: String,  // Special requests from user
  providerNotes: String,  // Internal notes from provider
  
  // Confirmation
  confirmationCode: String,
  confirmedAt: Date,
  
  // Reminders
  reminderSent24h: {
    type: Boolean,
    default: false
  },
  reminderSent1h: {
    type: Boolean,
    default: false
  },
  
  // Review
  hasReview: {
    type: Boolean,
    default: false
  },
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  },
  
  // Calendar sync
  googleEventId: String,
  appleEventId: String,
  outlookEventId: String,
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date,
  completedAt: Date
});

// Update timestamps
bookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate end time if not set
  if (this.appointmentDate && this.serviceDuration && !this.appointmentEndDate) {
    this.appointmentEndDate = new Date(this.appointmentDate.getTime() + this.serviceDuration * 60000);
  }
  
  // Calculate total if not set
  if (this.servicePrice && !this.totalAmount) {
    this.totalAmount = this.servicePrice + (this.serviceFee || 0);
  }
  
  // Generate confirmation code if not set
  if (!this.confirmationCode) {
    this.confirmationCode = 'FH' + Date.now().toString(36).toUpperCase() + 
      Math.random().toString(36).substring(2, 6).toUpperCase();
  }
  
  next();
});

// Virtual for formatted date
bookingSchema.virtual('formattedDate').get(function() {
  if (!this.appointmentDate) return '';
  return this.appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for formatted time
bookingSchema.virtual('formattedTime').get(function() {
  if (!this.appointmentDate) return '';
  return this.appointmentDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
});

// Virtual to check if booking can be cancelled
bookingSchema.virtual('canCancel').get(function() {
  if (['cancelled', 'completed', 'no_show'].includes(this.status)) return false;
  // Can cancel up to 24 hours before
  const now = new Date();
  const hoursUntilAppointment = (this.appointmentDate - now) / (1000 * 60 * 60);
  return hoursUntilAppointment > 24;
});

// Virtual to check if booking can be rescheduled
bookingSchema.virtual('canReschedule').get(function() {
  if (['cancelled', 'completed', 'no_show', 'in_progress'].includes(this.status)) return false;
  const now = new Date();
  const hoursUntilAppointment = (this.appointmentDate - now) / (1000 * 60 * 60);
  return hoursUntilAppointment > 24;
});

// Include virtuals in JSON
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

// Indexes
bookingSchema.index({ userId: 1, appointmentDate: -1 });  // User's bookings
bookingSchema.index({ providerId: 1, appointmentDate: 1 });  // Provider's schedule
bookingSchema.index({ status: 1, appointmentDate: 1 });  // Upcoming bookings
bookingSchema.index({ confirmationCode: 1 }, { unique: true });  // Lookup by code
bookingSchema.index({ stripePaymentIntentId: 1 }, { sparse: true });  // Payment lookup

module.exports = mongoose.model('Booking', bookingSchema);
