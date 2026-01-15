/**
 * BookingEvent Model - Immutable Audit Trail
 * Findr Health Calendar-Optional Booking Flow
 * Created: January 15, 2026
 * 
 * This model captures all booking state changes for:
 * - Compliance and auditing
 * - Debugging production issues
 * - Analytics and reporting
 * - Dispute resolution
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const BookingEventSchema = new Schema({
  // ==================== REFERENCES ====================
  booking: { 
    type: Schema.Types.ObjectId, 
    ref: 'Booking', 
    required: true,
    index: true 
  },
  bookingNumber: { 
    type: String, 
    required: true, 
    index: true 
  },
  
  // ==================== EVENT DETAILS ====================
  eventType: {
    type: String,
    enum: [
      // Lifecycle events
      'created',
      'slot_reserved',
      'slot_released',
      'slot_converted',
      
      // Payment events
      'payment_initiated',
      'payment_held',
      'payment_captured',
      'payment_failed',
      'payment_refunded',
      'payment_hold_cancelled',
      
      // Status changes
      'status_changed',
      'confirmed',
      'declined',
      'expired',
      'cancelled',
      'completed',
      'no_show',
      'checked_in',
      
      // Reschedule events
      'reschedule_proposed',
      'reschedule_accepted',
      'reschedule_declined',
      'reschedule_expired',
      
      // Calendar events
      'calendar_event_created',
      'calendar_event_updated',
      'calendar_event_deleted',
      'calendar_sync_failed',
      
      // Notification events
      'notification_sent',
      'notification_failed',
      'notification_delivered',
      
      // Admin actions
      'admin_override',
      'admin_note_added',
      'admin_refund_issued',
      'manual_confirmation',
      'manual_cancellation'
    ],
    required: true,
    index: true
  },
  
  // ==================== STATE TRANSITION ====================
  previousStatus: { type: String },
  newStatus: { type: String },
  
  // ==================== EVENT DATA ====================
  // Flexible JSON for event-specific data
  data: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // ==================== ACTOR ====================
  actor: {
    type: { 
      type: String, 
      enum: ['patient', 'provider', 'admin', 'system'],
      required: true
    },
    userId: { type: Schema.Types.ObjectId },
    userEmail: { type: String },
    userName: { type: String }
  },
  
  // ==================== REQUEST CONTEXT ====================
  context: {
    requestId: { type: String },      // For tracing
    idempotencyKey: { type: String }, // For duplicate detection
    ipAddress: { type: String },
    userAgent: { type: String },
    source: { 
      type: String,
      enum: ['app', 'web', 'api', 'cron', 'webhook', 'admin']
    },
    appVersion: { type: String }
  },
  
  // ==================== TIMESTAMP ====================
  // Immutable - cannot be changed after creation
  timestamp: { 
    type: Date, 
    default: Date.now, 
    immutable: true,
    index: true
  }
  
}, {
  timestamps: false,  // We use our own immutable timestamp
  collection: 'bookingevents'
});

// ==================== INDEXES ====================
// Compound index for efficient booking history queries
BookingEventSchema.index({ booking: 1, timestamp: -1 });

// Index for analytics queries
BookingEventSchema.index({ eventType: 1, timestamp: -1 });

// Index for finding recent events by type
BookingEventSchema.index({ eventType: 1, 'actor.type': 1, timestamp: -1 });

// Index for admin searches
BookingEventSchema.index({ 'actor.userId': 1, timestamp: -1 });

// ==================== STATIC METHODS ====================

/**
 * Create an event with automatic context capture
 */
BookingEventSchema.statics.logEvent = async function(params) {
  const {
    booking,
    bookingNumber,
    eventType,
    previousStatus,
    newStatus,
    data = {},
    actor,
    context = {}
  } = params;
  
  return this.create({
    booking: booking._id || booking,
    bookingNumber: bookingNumber || booking.bookingNumber,
    eventType,
    previousStatus,
    newStatus,
    data,
    actor,
    context: {
      requestId: context.requestId || global.currentRequestId,
      idempotencyKey: context.idempotencyKey,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      source: context.source || 'api',
      appVersion: context.appVersion
    }
  });
};

/**
 * Get full history for a booking
 */
BookingEventSchema.statics.getBookingHistory = function(bookingId) {
  return this.find({ booking: bookingId })
    .sort({ timestamp: 1 })
    .lean();
};

/**
 * Get recent events of a specific type
 */
BookingEventSchema.statics.getRecentByType = function(eventType, limit = 100) {
  return this.find({ eventType })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

/**
 * Count events by type in a time range
 */
BookingEventSchema.statics.countByTypeInRange = function(eventType, startDate, endDate) {
  return this.countDocuments({
    eventType,
    timestamp: { $gte: startDate, $lte: endDate }
  });
};

// ==================== PREVENT MODIFICATIONS ====================
// Events are immutable - disable update operations
BookingEventSchema.pre('updateOne', function() {
  throw new Error('BookingEvents are immutable and cannot be updated');
});

BookingEventSchema.pre('updateMany', function() {
  throw new Error('BookingEvents are immutable and cannot be updated');
});

BookingEventSchema.pre('findOneAndUpdate', function() {
  throw new Error('BookingEvents are immutable and cannot be updated');
});

module.exports = mongoose.model('BookingEvent', BookingEventSchema);
