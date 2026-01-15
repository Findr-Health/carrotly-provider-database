/**
 * SlotReservation Model - Temporary Slot Holds
 * Findr Health Calendar-Optional Booking Flow
 * Created: January 15, 2026
 * 
 * Purpose: Hold time slots temporarily during checkout to prevent
 * double-booking while patient completes payment.
 * 
 * TTL: 5 minutes (auto-expires via MongoDB TTL index)
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const SlotReservationSchema = new Schema({
  // ==================== PROVIDER REFERENCE ====================
  provider: { 
    type: Schema.Types.ObjectId, 
    ref: 'Provider', 
    required: true,
    index: true 
  },
  
  // ==================== SLOT DETAILS ====================
  startTime: { 
    type: Date, 
    required: true,
    index: true
  },
  endTime: { 
    type: Date, 
    required: true 
  },
  
  // Service being booked
  serviceId: { 
    type: String, 
    required: true 
  },
  serviceName: { 
    type: String 
  },
  duration: { 
    type: Number,  // minutes
    required: true
  },
  
  // ==================== RESERVATION HOLDER ====================
  // Can be a logged-in user or anonymous session
  patient: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    sparse: true
  },
  sessionId: { 
    type: String,
    sparse: true
  },
  
  // ==================== STATUS ====================
  status: {
    type: String,
    enum: ['active', 'converted', 'expired', 'released'],
    default: 'active',
    index: true
  },
  
  // ==================== CONVERSION TRACKING ====================
  // When reservation converts to actual booking
  bookingId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Booking',
    sparse: true
  },
  convertedAt: { type: Date },
  
  // ==================== RELEASE TRACKING ====================
  releasedAt: { type: Date },
  releaseReason: {
    type: String,
    enum: ['converted', 'expired', 'user_cancelled', 'payment_failed', 'admin']
  },
  
  // ==================== TTL ====================
  // MongoDB will auto-delete documents after expiresAt
  expiresAt: { 
    type: Date, 
    required: true,
    index: { expires: 0 }  // TTL index - deletes when current time > expiresAt
  },
  
  // ==================== METADATA ====================
  metadata: {
    ipAddress: String,
    userAgent: String,
    source: {
      type: String,
      enum: ['app', 'web'],
      default: 'app'
    }
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
  
}, {
  collection: 'slotreservations'
});

// ==================== INDEXES ====================
// Compound index for checking slot availability
SlotReservationSchema.index({ 
  provider: 1, 
  startTime: 1, 
  endTime: 1,
  status: 1 
}, { 
  name: 'slot_availability_check' 
});

// Index for cleanup queries
SlotReservationSchema.index({ 
  status: 1, 
  expiresAt: 1 
});

// Index for user's active reservations
SlotReservationSchema.index({ 
  patient: 1, 
  status: 1 
});

// ==================== CONSTANTS ====================
const RESERVATION_TTL_MINUTES = 5;

// ==================== STATIC METHODS ====================

/**
 * Create a new slot reservation
 * Returns null if slot is already reserved
 */
SlotReservationSchema.statics.reserveSlot = async function(params) {
  const {
    provider,
    startTime,
    endTime,
    serviceId,
    serviceName,
    duration,
    patient,
    sessionId,
    metadata = {}
  } = params;
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  const expiresAt = new Date(Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000);
  
  // Check for existing active reservation on this slot
  const existingReservation = await this.findOne({
    provider,
    status: 'active',
    $or: [
      // New slot overlaps with existing
      { startTime: { $lt: end }, endTime: { $gt: start } }
    ]
  });
  
  if (existingReservation) {
    // Slot already reserved
    return null;
  }
  
  // Create reservation
  const reservation = await this.create({
    provider,
    startTime: start,
    endTime: end,
    serviceId,
    serviceName,
    duration,
    patient,
    sessionId,
    expiresAt,
    metadata,
    status: 'active'
  });
  
  return reservation;
};

/**
 * Check if a slot is available (no active reservations)
 */
SlotReservationSchema.statics.isSlotAvailable = async function(provider, startTime, endTime, excludeReservationId = null) {
  const query = {
    provider,
    status: 'active',
    startTime: { $lt: new Date(endTime) },
    endTime: { $gt: new Date(startTime) }
  };
  
  if (excludeReservationId) {
    query._id = { $ne: excludeReservationId };
  }
  
  const existing = await this.findOne(query);
  return !existing;
};

/**
 * Convert reservation to booking
 */
SlotReservationSchema.statics.convertToBooking = async function(reservationId, bookingId) {
  return this.findByIdAndUpdate(
    reservationId,
    {
      status: 'converted',
      bookingId,
      convertedAt: new Date(),
      releaseReason: 'converted'
    },
    { new: true }
  );
};

/**
 * Release a reservation (user cancelled, payment failed, etc.)
 */
SlotReservationSchema.statics.releaseReservation = async function(reservationId, reason) {
  return this.findByIdAndUpdate(
    reservationId,
    {
      status: 'released',
      releasedAt: new Date(),
      releaseReason: reason
    },
    { new: true }
  );
};

/**
 * Get user's active reservation
 */
SlotReservationSchema.statics.getUserActiveReservation = async function(patient, sessionId) {
  const query = { status: 'active' };
  
  if (patient) {
    query.patient = patient;
  } else if (sessionId) {
    query.sessionId = sessionId;
  } else {
    return null;
  }
  
  return this.findOne(query).sort({ createdAt: -1 });
};

/**
 * Cleanup expired reservations (backup to TTL index)
 */
SlotReservationSchema.statics.cleanupExpired = async function() {
  const result = await this.updateMany(
    {
      status: 'active',
      expiresAt: { $lt: new Date() }
    },
    {
      status: 'expired',
      releasedAt: new Date(),
      releaseReason: 'expired'
    }
  );
  
  return result.modifiedCount;
};

/**
 * Get reservation stats for monitoring
 */
SlotReservationSchema.statics.getStats = async function() {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  const [active, converted, expired, recent] = await Promise.all([
    this.countDocuments({ status: 'active' }),
    this.countDocuments({ status: 'converted', convertedAt: { $gte: fiveMinutesAgo } }),
    this.countDocuments({ status: 'expired', releasedAt: { $gte: fiveMinutesAgo } }),
    this.countDocuments({ createdAt: { $gte: fiveMinutesAgo } })
  ]);
  
  return {
    activeReservations: active,
    recentConversions: converted,
    recentExpirations: expired,
    recentCreated: recent,
    conversionRate: recent > 0 ? (converted / recent * 100).toFixed(1) : 0
  };
};

// ==================== INSTANCE METHODS ====================

/**
 * Check if reservation is still valid
 */
SlotReservationSchema.methods.isValid = function() {
  return this.status === 'active' && this.expiresAt > new Date();
};

/**
 * Get remaining time in seconds
 */
SlotReservationSchema.methods.getRemainingSeconds = function() {
  if (!this.isValid()) return 0;
  return Math.max(0, Math.floor((this.expiresAt - new Date()) / 1000));
};

module.exports = mongoose.model('SlotReservation', SlotReservationSchema);
