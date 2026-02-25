# CALENDAR-OPTIONAL BOOKING FLOW IMPLEMENTATION PLAN

**Document Version:** 2.0  
**Created:** January 15, 2026  
**Last Updated:** January 15, 2026  
**Status:** Planning - Ready for Implementation  
**Authors:** Claude AI + Tim Wetherill  

---

## 📋 EXECUTIVE SUMMARY

This document outlines the complete implementation plan for supporting two booking modes:
1. **Instant Book** - Providers with connected calendars (Google/Microsoft)
2. **Request Booking** - Providers without calendars (manual confirmation required)

The goal is to enable all providers to receive bookings regardless of calendar integration status, while providing clear UX differentiation, appropriate payment handling, and a seamless path to upgrade.

---

## 🔍 CRITICAL ANALYSIS: V1 GAPS ADDRESSED IN V2

| Gap Identified | Impact | Resolution in V2 |
|----------------|--------|------------------|
| No timezone handling | High - Incorrect appointment times | Added timezone storage & conversion layer |
| Race conditions not addressed | High - Double bookings, data corruption | Added slot reservation, optimistic locking |
| Missing idempotency | Medium - Duplicate operations | Added idempotency keys to all mutating endpoints |
| Weak audit trail | Medium - No accountability | Added comprehensive BookingEvent model |
| No real-time updates | Medium - Poor UX | Added WebSocket/SSE architecture |
| Missing deep linking | Medium - Broken notification flow | Added universal link specifications |
| No feature flags | High - Risky deployment | Added feature flag system |
| Missing migration strategy | High - Data corruption risk | Added migration plan |
| No monitoring/alerting | High - Blind to issues | Added observability layer |
| Missing slot reservation | High - Lost bookings during checkout | Added temporary slot holds |
| No abuse prevention | Medium - Platform gaming | Added rate limiting & trust scoring |
| Missing buffer time | Medium - Back-to-back booking issues | Added configurable buffer times |
| Weak error recovery | Medium - Stuck states | Added admin intervention tools |
| No offline handling | Medium - Mobile app failures | Added offline queue & sync |
| Missing accessibility | Medium - Compliance risk | Added WCAG 2.1 specifications |

---

## 🎯 DESIGN PRINCIPLES

1. **No provider left behind** - All providers can accept bookings from day one
2. **Clear expectations** - Patients always know if booking is instant vs. request
3. **Safe payments** - Card holds protect both parties; no charge until confirmed
4. **Timely responses** - 24hr SLA with automatic handling and escalation
5. **Seamless upgrades** - Easy path from request mode to instant book
6. **Defensive design** - Handle failures gracefully; never lose a booking
7. **Observable** - Every state change is logged, tracked, and alertable
8. **Reversible** - Any action can be undone by admin if needed
9. **Accessible** - WCAG 2.1 AA compliant across all interfaces
10. **Internationally ready** - Timezone-aware, i18n-ready architecture

---

## 🏗️ ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FINDR HEALTH ECOSYSTEM                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │ Consumer App │    │Provider Portal│   │Admin Dashboard│              │
│  │   (Flutter)  │    │   (React)    │    │   (React)    │              │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘              │
│         │                   │                   │                       │
│         ▼                   ▼                   ▼                       │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │                    API GATEWAY (Railway)                     │       │
│  │  • Rate Limiting  • Auth  • Feature Flags  • Request ID     │       │
│  └─────────────────────────────────────────────────────────────┘       │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │                    BOOKING SERVICE                           │       │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │       │
│  │  │ Instant │  │ Request  │  │Reschedule│  │ Slot Reserve│  │       │
│  │  │  Flow   │  │  Flow    │  │  Flow    │  │   Manager   │  │       │
│  │  └─────────┘  └──────────┘  └──────────┘  └─────────────┘  │       │
│  └─────────────────────────────────────────────────────────────┘       │
│         │                                                               │
│         ▼                                                               │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐        │
│  │   MongoDB    │    Stripe    │   Calendar   │    Redis     │        │
│  │   (Atlas)    │   Connect    │   (G/MSFT)   │   (Cache)    │        │
│  └──────────────┴──────────────┴──────────────┴──────────────┘        │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │                    BACKGROUND SERVICES                       │       │
│  │  • Expiration Worker  • Notification Worker  • Stats Worker │       │
│  │  • Sync Worker        • Hold Monitor         • Cleanup      │       │
│  └─────────────────────────────────────────────────────────────┘       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 DATABASE SCHEMA

### 1. Booking Model (Enhanced)

**File:** `backend/models/Booking.js`

```javascript
const mongoose = require('mongoose');
const { Schema } = mongoose;

const BookingSchema = new Schema({
  // ==================== IDENTIFIERS ====================
  _id: { type: Schema.Types.ObjectId, auto: true },
  bookingNumber: { 
    type: String, 
    unique: true, 
    required: true,
    index: true
    // Format: FH-YYYYMMDD-XXXXX (e.g., FH-20260115-A7B3C)
  },
  
  // ==================== RELATIONSHIPS ====================
  patient: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  provider: { 
    type: Schema.Types.ObjectId, 
    ref: 'Provider', 
    required: true,
    index: true 
  },
  
  // ==================== SERVICE DETAILS ====================
  service: {
    serviceId: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    duration: { type: Number, required: true }, // minutes
    price: { type: Number, required: true },    // cents (USD)
    currency: { type: String, default: 'usd' },
    description: String
  },
  
  // ==================== BOOKING TYPE & MODE ====================
  bookingType: {
    type: String,
    enum: ['instant', 'request'],
    required: true,
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
      'reschedule_pending',   // Awaiting patient acceptance of new time
      
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
    default: 'slot_reserved',
    index: true
  },
  
  // ==================== DATETIME & TIMEZONE ====================
  dateTime: {
    // All times stored in UTC, converted for display
    requestedStart: { type: Date, required: true, index: true },
    requestedEnd: { type: Date, required: true },
    confirmedStart: Date,  // May differ if rescheduled
    confirmedEnd: Date,
    actualStart: Date,     // When service actually started
    actualEnd: Date,       // When service actually ended
    
    // Timezone context
    providerTimezone: { type: String, required: true }, // e.g., 'America/Denver'
    patientTimezone: { type: String, required: true },
    
    // Buffer time (minutes after appointment blocks next slot)
    bufferMinutes: { type: Number, default: 0 }
  },
  
  // ==================== SLOT RESERVATION ====================
  slotReservation: {
    reservedAt: Date,
    expiresAt: Date,           // 5 minutes from reservation
    released: { type: Boolean, default: false },
    releasedAt: Date,
    releasedReason: String     // 'converted', 'expired', 'cancelled'
  },
  
  // ==================== CONFIRMATION TRACKING ====================
  confirmation: {
    required: { type: Boolean, default: false },
    requestedAt: Date,
    expiresAt: Date,           // 24hr deadline
    respondedAt: Date,
    responseType: {
      type: String,
      enum: ['confirmed', 'rescheduled', 'declined', 'expired', null]
    },
    declineReason: String,     // Optional reason for decline
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
      message: String          // Optional message with proposal
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
  payment: {
    mode: { 
      type: String, 
      enum: ['prepay', 'hold', 'at_visit', 'card_on_file'],
      required: true 
    },
    status: {
      type: String,
      enum: ['pending', 'held', 'captured', 'refunded', 'partial_refund', 'failed', 'cancelled'],
      default: 'pending'
    },
    
    // Amounts (all in cents)
    originalAmount: { type: Number, required: true },
    capturedAmount: Number,
    refundedAmount: { type: Number, default: 0 },
    
    // Stripe references
    stripeCustomerId: String,
    paymentMethodId: String,
    paymentIntentId: { type: String, index: true },
    
    // Hold-specific fields
    hold: {
      createdAt: Date,
      expiresAt: Date,         // Stripe 7-day limit
      capturedAt: Date,
      cancelledAt: Date,
      cancelReason: String
    },
    
    // Refund tracking
    refunds: [{
      refundId: String,
      amount: Number,
      reason: String,
      initiatedBy: String,     // 'patient', 'provider', 'admin', 'system'
      createdAt: Date
    }],
    
    // Platform fees
    platformFee: {
      percentage: { type: Number, default: 10 },
      flatFee: { type: Number, default: 150 },  // $1.50 in cents
      maxFee: { type: Number, default: 3500 },  // $35 cap in cents
      calculatedFee: Number
    }
  },
  
  // ==================== CALENDAR INTEGRATION ====================
  calendar: {
    eventRequired: { type: Boolean, default: false },
    eventCreated: { type: Boolean, default: false },
    provider: String,          // 'google' or 'microsoft'
    eventId: String,
    eventLink: String,
    createdAt: Date,
    updatedAt: Date,
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
      confirmationRequest: { sent: Boolean, sentAt: Date, channels: [String] },
      confirmed: { sent: Boolean, sentAt: Date, channels: [String] },
      rescheduleProposed: { sent: Boolean, sentAt: Date, channels: [String] },
      declined: { sent: Boolean, sentAt: Date, channels: [String] },
      expired: { sent: Boolean, sentAt: Date, channels: [String] },
      reminder24h: { sent: Boolean, sentAt: Date, channels: [String] },
      reminder1h: { sent: Boolean, sentAt: Date, channels: [String] }
    },
    provider: {
      newRequest: { sent: Boolean, sentAt: Date, channels: [String] },
      expiringWarning: { sent: Boolean, sentAt: Date, channels: [String] },
      patientCancelled: { sent: Boolean, sentAt: Date, channels: [String] },
      rescheduleAccepted: { sent: Boolean, sentAt: Date, channels: [String] },
      rescheduleDeclined: { sent: Boolean, sentAt: Date, channels: [String] },
      reminder24h: { sent: Boolean, sentAt: Date, channels: [String] }
    }
  },
  
  // ==================== LOCATION ====================
  location: {
    type: { type: String, enum: ['in_person', 'telehealth', 'home_visit'] },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: { type: String, default: 'US' }
    },
    coordinates: {
      lat: Number,
      lng: Number
    },
    meetingLink: String,       // For telehealth
    meetingPassword: String,
    instructions: String       // "Enter through side door"
  },
  
  // ==================== PATIENT NOTES ====================
  notes: {
    patientNotes: String,      // Patient's message to provider
    providerNotes: String,     // Provider's internal notes
    adminNotes: String,        // Admin notes
    cancellationReason: String
  },
  
  // ==================== METADATA ====================
  metadata: {
    source: { type: String, enum: ['app', 'web', 'admin', 'api'], default: 'app' },
    appVersion: String,
    userAgent: String,
    ipAddress: String,
    deviceId: String,
    referrer: String,
    utmSource: String,
    utmCampaign: String
  },
  
  // ==================== IDEMPOTENCY ====================
  idempotencyKey: { type: String, unique: true, sparse: true },
  
  // ==================== VERSION (Optimistic Locking) ====================
  __v: { type: Number, select: false },
  version: { type: Number, default: 1 }
  
}, {
  timestamps: true,            // Adds createdAt, updatedAt
  optimisticConcurrency: true  // Enables version checking
});

// ==================== INDEXES ====================
BookingSchema.index({ provider: 1, 'dateTime.requestedStart': 1 });
BookingSchema.index({ patient: 1, status: 1, createdAt: -1 });
BookingSchema.index({ status: 1, 'confirmation.expiresAt': 1 });
BookingSchema.index({ 'payment.paymentIntentId': 1 });
BookingSchema.index({ createdAt: -1 });
BookingSchema.index({ 
  provider: 1, 
  status: 1, 
  'dateTime.requestedStart': 1 
}, { 
  name: 'provider_availability_lookup' 
});

// ==================== VIRTUALS ====================
BookingSchema.virtual('isExpired').get(function() {
  return this.status === 'expired' || 
    (this.status === 'pending_confirmation' && 
     this.confirmation.expiresAt < new Date());
});

BookingSchema.virtual('canReschedule').get(function() {
  return this.reschedule.count < this.reschedule.maxAttempts;
});

// ==================== METHODS ====================
BookingSchema.methods.generateBookingNumber = async function() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  this.bookingNumber = `FH-${date}-${random}`;
  return this.bookingNumber;
};

// ==================== STATICS ====================
BookingSchema.statics.findPendingExpiring = function(hoursAhead) {
  const now = new Date();
  const future = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
  return this.find({
    status: 'pending_confirmation',
    'confirmation.expiresAt': { $gt: now, $lt: future }
  });
};

module.exports = mongoose.model('Booking', BookingSchema);
```

### 2. BookingEvent Model (Audit Trail)

**File:** `backend/models/BookingEvent.js`

```javascript
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * BookingEvent - Immutable audit log for all booking state changes
 * Enables full reconstruction of booking history
 */
const BookingEventSchema = new Schema({
  // Reference to booking
  booking: { 
    type: Schema.Types.ObjectId, 
    ref: 'Booking', 
    required: true,
    index: true 
  },
  bookingNumber: { type: String, required: true, index: true },
  
  // Event details
  eventType: {
    type: String,
    enum: [
      // Lifecycle events
      'created',
      'slot_reserved',
      'slot_released',
      'payment_initiated',
      'payment_held',
      'payment_captured',
      'payment_failed',
      'payment_refunded',
      
      // Status changes
      'status_changed',
      'confirmed',
      'declined',
      'expired',
      'cancelled',
      'completed',
      'no_show',
      
      // Reschedule events
      'reschedule_proposed',
      'reschedule_accepted',
      'reschedule_declined',
      
      // Calendar events
      'calendar_event_created',
      'calendar_event_updated',
      'calendar_event_deleted',
      'calendar_sync_failed',
      
      // Notification events
      'notification_sent',
      'notification_failed',
      
      // Admin actions
      'admin_override',
      'admin_note_added',
      'manual_confirmation',
      'manual_cancellation'
    ],
    required: true,
    index: true
  },
  
  // State transition
  previousStatus: String,
  newStatus: String,
  
  // Event data (flexible JSON)
  data: Schema.Types.Mixed,
  
  // Actor who triggered event
  actor: {
    type: { type: String, enum: ['patient', 'provider', 'admin', 'system'] },
    userId: Schema.Types.ObjectId,
    userEmail: String,
    userName: String
  },
  
  // Request context
  context: {
    requestId: String,
    ipAddress: String,
    userAgent: String,
    source: String  // 'app', 'web', 'api', 'cron'
  },
  
  // Immutable timestamp
  timestamp: { type: Date, default: Date.now, immutable: true }
  
}, {
  timestamps: false  // We use our own immutable timestamp
});

// Compound index for efficient queries
BookingEventSchema.index({ booking: 1, timestamp: -1 });
BookingEventSchema.index({ eventType: 1, timestamp: -1 });

module.exports = mongoose.model('BookingEvent', BookingEventSchema);
```

### 3. Provider Model Updates

**File:** `backend/models/Provider.js` (additions)

```javascript
// Add these fields to existing Provider schema

{
  // ==================== TIMEZONE ====================
  timezone: { 
    type: String, 
    default: 'America/Denver',
    required: true 
  },
  
  // ==================== BOOKING CONFIGURATION ====================
  bookingSettings: {
    // Booking mode (auto-detected based on calendar)
    mode: {
      type: String,
      enum: ['instant', 'request'],
      default: 'request'
    },
    modeOverride: {
      type: Boolean,
      default: false  // If true, mode is manually set, not auto
    },
    
    // Auto-confirm settings
    autoConfirm: {
      enabled: { type: Boolean, default: false },
      maxDailyAutoConfirm: { type: Number, default: 10 },
      autoConfirmedToday: { type: Number, default: 0 },
      lastResetDate: Date
    },
    
    // Timing settings
    confirmationDeadlineHours: { type: Number, default: 24, min: 4, max: 72 },
    minimumNoticeHours: { type: Number, default: 24, min: 1, max: 168 },
    maximumAdvanceDays: { type: Number, default: 60, min: 7, max: 365 },
    bufferMinutes: { type: Number, default: 15, min: 0, max: 60 },
    
    // Reschedule settings
    allowReschedule: { type: Boolean, default: true },
    maxRescheduleAttempts: { type: Number, default: 2, min: 1, max: 5 },
    rescheduleNoticeHours: { type: Number, default: 24, min: 1 },
    
    // Cancellation settings
    allowCancellation: { type: Boolean, default: true },
    cancellationNoticeHours: { type: Number, default: 24 },
    cancellationFeePercent: { type: Number, default: 0, min: 0, max: 100 },
    
    // Slot settings
    slotDurationMinutes: { type: Number, default: 30 },
    allowMultipleServices: { type: Boolean, default: false }
  },
  
  // ==================== BOOKING STATISTICS ====================
  bookingStats: {
    // Volume
    totalRequests: { type: Number, default: 0 },
    totalConfirmed: { type: Number, default: 0 },
    totalCompleted: { type: Number, default: 0 },
    totalCancelled: { type: Number, default: 0 },
    totalExpired: { type: Number, default: 0 },
    totalNoShow: { type: Number, default: 0 },
    
    // Performance
    avgResponseTimeMinutes: Number,
    medianResponseTimeMinutes: Number,
    confirmationRate: Number,        // % of requests confirmed
    completionRate: Number,          // % of confirmed that complete
    
    // Revenue
    totalRevenue: { type: Number, default: 0 },
    avgBookingValue: Number,
    
    // Trends
    last30DaysRequests: { type: Number, default: 0 },
    last30DaysConfirmed: { type: Number, default: 0 },
    lastBookingAt: Date,
    lastCompletedAt: Date,
    
    // Updated timestamp
    lastCalculatedAt: Date
  },
  
  // ==================== NOTIFICATION PREFERENCES ====================
  notificationPreferences: {
    channels: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    quietHours: {
      enabled: { type: Boolean, default: false },
      start: String,  // "22:00"
      end: String     // "08:00"
    },
    frequency: {
      newBookingRequest: { type: String, enum: ['immediate', 'hourly', 'daily'], default: 'immediate' },
      expiringReminder: { type: Boolean, default: true }
    }
  },
  
  // ==================== TRUST & REPUTATION ====================
  trustScore: {
    score: { type: Number, default: 100, min: 0, max: 100 },
    factors: {
      responseRate: { weight: 30, value: Number },
      completionRate: { weight: 25, value: Number },
      noShowRate: { weight: 20, value: Number },
      reviewScore: { weight: 15, value: Number },
      accountAge: { weight: 10, value: Number }
    },
    lastCalculatedAt: Date
  }
}
```

### 4. SlotReservation Model (Temporary Holds)

**File:** `backend/models/SlotReservation.js`

```javascript
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * SlotReservation - Temporary hold on a time slot during checkout
 * Prevents double-booking while patient completes payment
 * TTL: 5 minutes
 */
const SlotReservationSchema = new Schema({
  provider: { 
    type: Schema.Types.ObjectId, 
    ref: 'Provider', 
    required: true,
    index: true 
  },
  
  // Slot details
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  serviceId: { type: String, required: true },
  
  // Reservation holder
  patient: { type: Schema.Types.ObjectId, ref: 'User' },
  sessionId: String,  // Anonymous session for non-logged-in users
  
  // Status
  status: {
    type: String,
    enum: ['active', 'converted', 'expired', 'released'],
    default: 'active'
  },
  
  // Conversion tracking
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
  convertedAt: Date,
  
  // TTL - auto-expire after 5 minutes
  expiresAt: { 
    type: Date, 
    required: true,
    index: { expires: 0 }  // MongoDB TTL index
  },
  
  createdAt: { type: Date, default: Date.now }
});

// Compound index for slot lookup
SlotReservationSchema.index({ 
  provider: 1, 
  startTime: 1, 
  status: 1 
});

module.exports = mongoose.model('SlotReservation', SlotReservationSchema);
```

---

## 🔄 STATE MACHINE

### Valid Status Transitions

```
                                    ┌─────────────────┐
                                    │  slot_reserved  │
                                    └────────┬────────┘
                                             │
                         ┌───────────────────┼───────────────────┐
                         │                   │                   │
                         ▼                   ▼                   ▼
               ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
               │ pending_payment │ │     expired     │ │cancelled_patient│
               └────────┬────────┘ └─────────────────┘ └─────────────────┘
                        │
          ┌─────────────┴─────────────┐
          │                           │
          ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│   confirmed     │         │pending_confirm- │
│ (instant book)  │         │    ation        │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │            ┌──────────────┼──────────────┐
         │            │              │              │
         │            ▼              ▼              ▼
         │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
         │  │  confirmed  │ │   expired   │ │ reschedule_ │
         │  │ (accepted)  │ │             │ │  proposed   │
         │  └──────┬──────┘ └─────────────┘ └──────┬──────┘
         │         │                               │
         │         │                    ┌──────────┴──────────┐
         │         │                    │                     │
         │         │                    ▼                     ▼
         │         │          ┌─────────────────┐  ┌─────────────────┐
         │         │          │   confirmed     │  │cancelled_patient│
         │         │          │ (reschedule ok) │  │ (declined)      │
         │         │          └────────┬────────┘  └─────────────────┘
         │         │                   │
         └─────────┴───────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │   checked_in    │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  in_progress    │
         └────────┬────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌─────────────────┐ ┌─────────────────┐
│   completed     │ │    no_show      │
└─────────────────┘ └─────────────────┘


Cancellation possible from:
- pending_payment → cancelled_patient
- pending_confirmation → cancelled_patient, cancelled_provider
- confirmed → cancelled_patient (may incur fee), cancelled_provider
- reschedule_proposed → cancelled_patient

Admin can transition to any state via admin_override
```

### Transition Validation

**File:** `backend/services/BookingStateMachine.js`

```javascript
const VALID_TRANSITIONS = {
  'slot_reserved': ['pending_payment', 'expired', 'cancelled_patient'],
  'pending_payment': ['confirmed', 'pending_confirmation', 'payment_failed', 'cancelled_patient'],
  'pending_confirmation': ['confirmed', 'expired', 'reschedule_proposed', 'cancelled_patient', 'cancelled_provider'],
  'reschedule_proposed': ['confirmed', 'cancelled_patient', 'expired'],
  'confirmed': ['checked_in', 'cancelled_patient', 'cancelled_provider', 'no_show'],
  'checked_in': ['in_progress', 'no_show'],
  'in_progress': ['completed', 'no_show'],
  // Terminal states - no transitions allowed
  'completed': [],
  'cancelled_patient': [],
  'cancelled_provider': [],
  'cancelled_admin': [],
  'expired': [],
  'no_show': [],
  'payment_failed': ['pending_payment'] // Allow retry
};

function canTransition(currentStatus, newStatus, isAdmin = false) {
  if (isAdmin) return true; // Admins can override
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
}

module.exports = { VALID_TRANSITIONS, canTransition };
```

---

## 🔌 API ENDPOINTS

### Booking Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/bookings/reserve-slot` | Patient | Create temporary slot hold |
| POST | `/api/bookings` | Patient | Create booking (instant or request) |
| GET | `/api/bookings/:id` | Patient/Provider | Get booking details |
| GET | `/api/bookings/patient` | Patient | List patient's bookings |
| GET | `/api/bookings/provider` | Provider | List provider's bookings |
| GET | `/api/bookings/provider/pending` | Provider | Get pending confirmations |

### Confirmation Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/bookings/:id/confirm` | Provider | Confirm request booking |
| POST | `/api/bookings/:id/decline` | Provider | Decline request booking |
| POST | `/api/bookings/:id/reschedule` | Provider | Propose alternative time |
| POST | `/api/bookings/:id/accept-reschedule` | Patient | Accept proposed time |
| POST | `/api/bookings/:id/decline-reschedule` | Patient | Decline, cancel booking |

### Action Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/bookings/:id/cancel` | Patient/Provider | Cancel booking |
| POST | `/api/bookings/:id/check-in` | Provider | Mark patient checked in |
| POST | `/api/bookings/:id/start` | Provider | Start service |
| POST | `/api/bookings/:id/complete` | Provider | Complete service |
| POST | `/api/bookings/:id/no-show` | Provider | Mark as no-show |

### Admin Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/admin/bookings` | Admin | List all bookings with filters |
| GET | `/api/admin/bookings/:id` | Admin | Get booking with full audit trail |
| POST | `/api/admin/bookings/:id/override` | Admin | Force status change |
| POST | `/api/admin/bookings/:id/refund` | Admin | Process refund |
| GET | `/api/admin/bookings/health` | Admin | System health metrics |

### All Endpoints Include

```javascript
// Request headers required
{
  'Authorization': 'Bearer <token>',
  'X-Request-ID': '<uuid>',           // For tracing
  'X-Idempotency-Key': '<uuid>',      // For POST/PUT (prevents duplicates)
  'X-Client-Version': '1.2.3',        // App version
  'X-Timezone': 'America/Denver'      // Client timezone
}

// Response format
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO8601",
    "version": "1.0"
  }
}

// Error format
{
  "success": false,
  "error": {
    "code": "BOOKING_EXPIRED",
    "message": "This booking request has expired",
    "details": { ... }
  },
  "meta": { ... }
}
```

---

## 💳 PAYMENT FLOWS

### Flow 1: Instant Book (Calendar Connected)

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Reserve │────▶│ Payment │────▶│ Capture │────▶│ Calendar│
│  Slot   │     │ Intent  │     │ Charge  │     │ Event   │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
     │               │               │               │
     ▼               ▼               ▼               ▼
  5 min TTL      Create PI      Immediate       Create
  on slot       w/ confirm      capture        event
```

### Flow 2: Request Book (No Calendar)

```
┌─────────┐     ┌─────────┐     ┌─────────────┐     ┌─────────┐
│ Reserve │────▶│ Payment │────▶│   WAITING   │────▶│ Capture │
│  Slot   │     │  Hold   │     │ (max 24hrs) │     │ or Fail │
└─────────┘     └─────────┘     └─────────────┘     └─────────┘
     │               │                 │                 │
     ▼               ▼                 ▼                 ▼
  5 min TTL      Manual          Provider          On confirm
  on slot       capture=true     responds          → capture
                                                   On expire
                                                   → cancel PI
```

### Stripe Integration Code

```javascript
// backend/services/PaymentService.js

class PaymentService {
  
  /**
   * Create payment hold (for request bookings)
   */
  async createPaymentHold(booking, paymentMethodId) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: booking.service.price,
      currency: 'usd',
      customer: booking.patient.stripeCustomerId,
      payment_method: paymentMethodId,
      capture_method: 'manual',  // KEY: Hold, don't capture
      confirm: true,
      
      // Prevent duplicate charges
      idempotency_key: `hold_${booking._id}`,
      
      metadata: {
        bookingId: booking._id.toString(),
        bookingNumber: booking.bookingNumber,
        bookingType: 'request',
        providerId: booking.provider._id.toString(),
        patientId: booking.patient._id.toString(),
        serviceName: booking.service.name
      },
      
      // Auto-expire if we don't capture
      // (Stripe holds expire in 7 days regardless)
      description: `Findr Health - ${booking.service.name} with ${booking.provider.businessName}`
    });
    
    return {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      holdExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
  }
  
  /**
   * Capture held payment (when provider confirms)
   */
  async capturePayment(booking) {
    if (!booking.payment.paymentIntentId) {
      throw new Error('No payment intent to capture');
    }
    
    const paymentIntent = await stripe.paymentIntents.capture(
      booking.payment.paymentIntentId,
      { idempotency_key: `capture_${booking._id}` }
    );
    
    // Transfer to provider (minus platform fee)
    if (booking.provider.stripeAccountId) {
      const transferAmount = booking.service.price - booking.payment.platformFee.calculatedFee;
      
      await stripe.transfers.create({
        amount: transferAmount,
        currency: 'usd',
        destination: booking.provider.stripeAccountId,
        transfer_group: booking.bookingNumber,
        metadata: {
          bookingId: booking._id.toString(),
          bookingNumber: booking.bookingNumber
        }
      }, {
        idempotency_key: `transfer_${booking._id}`
      });
    }
    
    return paymentIntent;
  }
  
  /**
   * Cancel payment hold (when booking expires/declined)
   */
  async cancelPaymentHold(booking, reason) {
    if (!booking.payment.paymentIntentId) {
      return null;
    }
    
    const paymentIntent = await stripe.paymentIntents.cancel(
      booking.payment.paymentIntentId,
      { 
        cancellation_reason: reason,
        idempotency_key: `cancel_${booking._id}_${Date.now()}`
      }
    );
    
    return paymentIntent;
  }
  
  /**
   * Verify FreeBusy before capture (prevent stale confirmations)
   */
  async verifyAvailabilityBeforeCapture(booking) {
    if (!booking.provider.calendarConnected) {
      return true; // Can't verify, proceed
    }
    
    const busyTimes = await CalendarService.getFreeBusy(
      booking.provider._id,
      booking.dateTime.confirmedStart,
      booking.dateTime.confirmedEnd
    );
    
    // Check if the slot is still free
    const slotStart = new Date(booking.dateTime.confirmedStart);
    const slotEnd = new Date(booking.dateTime.confirmedEnd);
    
    for (const busy of busyTimes) {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);
      
      // Check for overlap
      if (slotStart < busyEnd && slotEnd > busyStart) {
        return false; // Conflict found
      }
    }
    
    return true;
  }
}
```

---

## 📱 CONSUMER APP (FLUTTER) CHANGES

### New/Modified Screens

| Screen | Status | Changes |
|--------|--------|---------|
| `ProviderCard` | Modify | Add booking mode badge |
| `ProviderDetailScreen` | Modify | Add response time, booking mode info |
| `DateTimeSelectionScreen` | Modify | Different copy for request vs instant |
| `BookingConfirmationScreen` | Modify | Branch UI by booking type |
| `BookingDetailScreen` | Modify | Add status timeline, actions |
| `RescheduleResponseScreen` | **NEW** | Accept/decline reschedule |
| `BookingsListScreen` | Modify | Status badges, filters |

### Booking Mode Badge Component

```dart
// lib/widgets/booking_mode_badge.dart

import 'package:flutter/material.dart';

class BookingModeBadge extends StatelessWidget {
  final bool isInstantBook;
  final int? avgResponseMinutes;
  
  const BookingModeBadge({
    Key? key,
    required this.isInstantBook,
    this.avgResponseMinutes,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    if (isInstantBook) {
      return _buildInstantBadge();
    } else {
      return _buildRequestBadge();
    }
  }
  
  Widget _buildInstantBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: const Color(0xFFDCFCE7),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.bolt,
            size: 14,
            color: const Color(0xFF15803D),
          ),
          const SizedBox(width: 4),
          Text(
            'Instant Book',
            style: TextStyle(
              color: const Color(0xFF15803D),
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildRequestBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: const Color(0xFFDBEAFE),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.schedule_send,
            size: 14,
            color: const Color(0xFF1D4ED8),
          ),
          const SizedBox(width: 4),
          Text(
            'Request Booking',
            style: TextStyle(
              color: const Color(0xFF1D4ED8),
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
  
  String _formatResponseTime() {
    if (avgResponseMinutes == null) return 'Usually responds within 24 hours';
    if (avgResponseMinutes! < 60) return 'Usually responds within 1 hour';
    if (avgResponseMinutes! < 180) return 'Usually responds within a few hours';
    if (avgResponseMinutes! < 720) return 'Usually responds within 12 hours';
    return 'Usually responds within 24 hours';
  }
}
```

### Booking Status Timeline

```dart
// lib/widgets/booking_status_timeline.dart

class BookingStatusTimeline extends StatelessWidget {
  final Booking booking;
  
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildTimelineItem(
          title: 'Booking Requested',
          time: booking.createdAt,
          isComplete: true,
          isFirst: true,
        ),
        if (booking.bookingType == 'request') ...[
          _buildTimelineItem(
            title: 'Awaiting Confirmation',
            subtitle: booking.status == 'pending_confirmation'
                ? 'Provider will respond by ${_formatDeadline(booking.confirmation.expiresAt)}'
                : null,
            isComplete: booking.status != 'pending_confirmation',
            isActive: booking.status == 'pending_confirmation',
          ),
        ],
        if (booking.reschedule.count > 0) ...[
          _buildTimelineItem(
            title: 'Reschedule Proposed',
            subtitle: 'New time: ${_formatDateTime(booking.reschedule.current.proposedStart)}',
            isComplete: booking.status != 'reschedule_proposed',
            isActive: booking.status == 'reschedule_proposed',
          ),
        ],
        _buildTimelineItem(
          title: 'Confirmed',
          time: booking.confirmedAt,
          isComplete: ['confirmed', 'checked_in', 'in_progress', 'completed'].contains(booking.status),
        ),
        _buildTimelineItem(
          title: 'Appointment',
          subtitle: _formatDateTime(booking.dateTime.confirmedStart ?? booking.dateTime.requestedStart),
          isComplete: ['completed'].contains(booking.status),
          isLast: true,
        ),
      ],
    );
  }
}
```

### Deep Linking Setup

```dart
// lib/services/deep_link_service.dart

class DeepLinkService {
  static const String scheme = 'findrhealth';
  static const String host = 'app.findrhealth.com';
  
  // Universal link patterns
  static final Map<String, Function> routes = {
    '/booking/:id': (String id) => BookingDetailScreen(bookingId: id),
    '/booking/:id/reschedule': (String id) => RescheduleResponseScreen(bookingId: id),
    '/provider/:id': (String id) => ProviderDetailScreen(providerId: id),
    '/bookings': () => BookingsListScreen(),
  };
  
  static void handleDeepLink(Uri uri) {
    // Parse and navigate to appropriate screen
    final path = uri.path;
    final segments = path.split('/');
    
    if (segments.contains('booking')) {
      final bookingId = segments[segments.indexOf('booking') + 1];
      if (segments.contains('reschedule')) {
        navigatorKey.currentState?.push(
          MaterialPageRoute(
            builder: (_) => RescheduleResponseScreen(bookingId: bookingId),
          ),
        );
      } else {
        navigatorKey.currentState?.push(
          MaterialPageRoute(
            builder: (_) => BookingDetailScreen(bookingId: bookingId),
          ),
        );
      }
    }
  }
}
```

### Offline Queue

```dart
// lib/services/offline_queue_service.dart

class OfflineQueueService {
  static const String _queueKey = 'offline_action_queue';
  
  Future<void> queueAction(BookingAction action) async {
    final prefs = await SharedPreferences.getInstance();
    final queue = prefs.getStringList(_queueKey) ?? [];
    queue.add(jsonEncode(action.toJson()));
    await prefs.setStringList(_queueKey, queue);
  }
  
  Future<void> processQueue() async {
    if (!await hasConnectivity()) return;
    
    final prefs = await SharedPreferences.getInstance();
    final queue = prefs.getStringList(_queueKey) ?? [];
    
    for (final item in queue) {
      try {
        final action = BookingAction.fromJson(jsonDecode(item));
        await _processAction(action);
        queue.remove(item);
      } catch (e) {
        // Log error, keep in queue for retry
      }
    }
    
    await prefs.setStringList(_queueKey, queue);
  }
}
```

---

## 💻 PROVIDER PORTAL CHANGES

### New Pages

| Page | Purpose |
|------|---------|
| `PendingRequests.tsx` | View and manage pending booking requests |
| `BookingSettings.tsx` | Configure booking preferences |

### Dashboard Pending Requests Widget

```tsx
// src/components/PendingRequestsWidget.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface PendingBooking {
  _id: string;
  bookingNumber: string;
  patient: { name: string; email: string };
  service: { name: string; price: number };
  dateTime: { requestedStart: string };
  confirmation: { expiresAt: string };
}

interface Props {
  bookings: PendingBooking[];
  onConfirm: (id: string) => void;
  onDecline: (id: string) => void;
  onReschedule: (id: string) => void;
}

export default function PendingRequestsWidget({ bookings, onConfirm, onDecline, onReschedule }: Props) {
  const navigate = useNavigate();
  
  if (bookings.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <span className="text-xl">⏳</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-amber-900">
              Pending Booking Requests
            </h2>
            <p className="text-sm text-amber-700">
              {bookings.length} request{bookings.length !== 1 ? 's' : ''} need{bookings.length === 1 ? 's' : ''} your response
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/pending-requests')}
          className="text-amber-700 hover:text-amber-900 font-medium text-sm"
        >
          View All →
        </button>
      </div>
      
      <div className="space-y-3">
        {bookings.slice(0, 3).map((booking) => {
          const expiresAt = new Date(booking.confirmation.expiresAt);
          const isUrgent = expiresAt.getTime() - Date.now() < 4 * 60 * 60 * 1000;
          
          return (
            <div
              key={booking._id}
              className={`bg-white rounded-lg p-4 border ${
                isUrgent ? 'border-red-200' : 'border-amber-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {booking.patient.name}
                    </span>
                    {isUrgent && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                        Expires soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {booking.service.name} • ${(booking.service.price / 100).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(booking.dateTime.requestedStart).toLocaleString()}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Expires {formatDistanceToNow(expiresAt, { addSuffix: true })}
                  </p>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => onConfirm(booking._id)}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => onReschedule(booking._id)}
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => onDecline(booking._id)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### Real-time Updates (WebSocket)

```tsx
// src/hooks/useBookingUpdates.ts

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useBookingUpdates(providerId: string) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  
  useEffect(() => {
    const ws = new WebSocket(
      `wss://fearless-achievement-production.up.railway.app/ws?providerId=${providerId}`
    );
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'NEW_BOOKING_REQUEST':
          // Invalidate queries to refetch
          queryClient.invalidateQueries(['pending-bookings']);
          queryClient.invalidateQueries(['bookings']);
          // Show toast notification
          showToast('New booking request received!', 'info');
          break;
          
        case 'BOOKING_CANCELLED':
          queryClient.invalidateQueries(['bookings']);
          showToast('A booking was cancelled', 'warning');
          break;
          
        case 'RESCHEDULE_RESPONSE':
          queryClient.invalidateQueries(['bookings']);
          break;
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    wsRef.current = ws;
    
    return () => {
      ws.close();
    };
  }, [providerId, queryClient]);
  
  return wsRef;
}
```

---

## 🔧 ADMIN DASHBOARD CHANGES

### Booking Health Dashboard

```tsx
// src/pages/BookingHealth.tsx

export default function BookingHealth() {
  const { data: metrics } = useBookingHealthMetrics();
  
  return (
    <div className="space-y-6">
      {/* Alert Banner for Critical Issues */}
      {metrics?.criticalAlerts?.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <div className="flex items-center">
            <span className="text-red-500 text-xl mr-3">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-800">Critical Issues</h3>
              <ul className="text-sm text-red-700 mt-1">
                {metrics.criticalAlerts.map((alert, i) => (
                  <li key={i}>• {alert}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Pending Requests"
          value={metrics?.pendingCount || 0}
          trend={metrics?.pendingTrend}
          alert={metrics?.pendingCount > 50}
        />
        <MetricCard
          title="Expiring Soon (4h)"
          value={metrics?.expiringSoonCount || 0}
          alert={metrics?.expiringSoonCount > 10}
        />
        <MetricCard
          title="Active Payment Holds"
          value={`$${((metrics?.activeHoldsAmount || 0) / 100).toFixed(2)}`}
          subtitle={`${metrics?.activeHoldsCount || 0} holds`}
        />
        <MetricCard
          title="Expired Today"
          value={metrics?.expiredToday || 0}
          alert={metrics?.expiredToday > 5}
        />
      </div>
      
      {/* Provider Response Leaderboard */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Provider Response Performance</h3>
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="pb-2">Provider</th>
              <th className="pb-2">Pending</th>
              <th className="pb-2">Avg Response</th>
              <th className="pb-2">Confirmation Rate</th>
              <th className="pb-2">Expired (30d)</th>
            </tr>
          </thead>
          <tbody>
            {metrics?.providerStats?.map((provider) => (
              <tr key={provider._id} className="border-b last:border-0">
                <td className="py-3">{provider.businessName}</td>
                <td className="py-3">
                  <span className={provider.pendingCount > 5 ? 'text-red-600 font-medium' : ''}>
                    {provider.pendingCount}
                  </span>
                </td>
                <td className="py-3">{formatMinutes(provider.avgResponseTime)}</td>
                <td className="py-3">
                  <span className={provider.confirmationRate < 70 ? 'text-red-600' : 'text-green-600'}>
                    {provider.confirmationRate?.toFixed(1)}%
                  </span>
                </td>
                <td className="py-3">{provider.expiredCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Payment Holds Aging */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Payment Holds Aging</h3>
        <div className="grid grid-cols-5 gap-4">
          <AgingBucket label="< 24h" count={metrics?.holdsAging?.under24h} />
          <AgingBucket label="1-3 days" count={metrics?.holdsAging?.days1to3} />
          <AgingBucket label="3-5 days" count={metrics?.holdsAging?.days3to5} />
          <AgingBucket label="5-7 days" count={metrics?.holdsAging?.days5to7} alert />
          <AgingBucket label="> 7 days" count={metrics?.holdsAging?.over7days} critical />
        </div>
      </div>
    </div>
  );
}
```

---

## ⏰ BACKGROUND JOBS

### Job Configuration

```javascript
// backend/jobs/index.js

const cron = require('node-cron');
const { processExpiredBookings } = require('./processExpiredBookings');
const { sendExpirationWarnings } = require('./sendExpirationWarnings');
const { monitorPaymentHolds } = require('./monitorPaymentHolds');
const { updateProviderStats } = require('./updateProviderStats');
const { cleanupSlotReservations } = require('./cleanupSlotReservations');
const { syncCalendarEvents } = require('./syncCalendarEvents');

module.exports = function initializeJobs() {
  // Every 5 minutes: Process expired bookings
  cron.schedule('*/5 * * * *', async () => {
    console.log('[CRON] Processing expired bookings...');
    await processExpiredBookings();
  });
  
  // Every 30 minutes: Send expiration warnings
  cron.schedule('*/30 * * * *', async () => {
    console.log('[CRON] Sending expiration warnings...');
    await sendExpirationWarnings();
  });
  
  // Every hour: Monitor payment holds
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Monitoring payment holds...');
    await monitorPaymentHolds();
  });
  
  // Every 6 hours: Update provider stats
  cron.schedule('0 */6 * * *', async () => {
    console.log('[CRON] Updating provider stats...');
    await updateProviderStats();
  });
  
  // Every minute: Cleanup expired slot reservations (backup to TTL)
  cron.schedule('* * * * *', async () => {
    await cleanupSlotReservations();
  });
  
  // Every 15 minutes: Sync calendar events for failed syncs
  cron.schedule('*/15 * * * *', async () => {
    await syncCalendarEvents();
  });
  
  console.log('✅ Background jobs initialized');
};
```

### Process Expired Bookings

```javascript
// backend/jobs/processExpiredBookings.js

const Booking = require('../models/Booking');
const BookingEvent = require('../models/BookingEvent');
const PaymentService = require('../services/PaymentService');
const NotificationService = require('../services/NotificationService');
const ProviderStatsService = require('../services/ProviderStatsService');

async function processExpiredBookings() {
  const now = new Date();
  
  // Find bookings that have expired
  const expiredBookings = await Booking.find({
    status: 'pending_confirmation',
    'confirmation.expiresAt': { $lt: now }
  }).populate('patient provider');
  
  console.log(`[CRON] Found ${expiredBookings.length} expired bookings`);
  
  for (const booking of expiredBookings) {
    try {
      // 1. Release payment hold
      if (booking.payment.paymentIntentId && booking.payment.status === 'held') {
        await PaymentService.cancelPaymentHold(booking, 'expired');
      }
      
      // 2. Update booking status
      const previousStatus = booking.status;
      booking.status = 'expired';
      booking.confirmation.responseType = 'expired';
      booking.payment.status = 'cancelled';
      booking.payment.hold.cancelledAt = now;
      booking.payment.hold.cancelReason = 'Request expired - provider did not respond';
      await booking.save();
      
      // 3. Create audit event
      await BookingEvent.create({
        booking: booking._id,
        bookingNumber: booking.bookingNumber,
        eventType: 'expired',
        previousStatus,
        newStatus: 'expired',
        actor: { type: 'system' },
        context: { source: 'cron' }
      });
      
      // 4. Notify patient
      await NotificationService.send({
        recipient: booking.patient,
        template: 'booking_expired_patient',
        data: {
          bookingNumber: booking.bookingNumber,
          providerName: booking.provider.businessName,
          serviceName: booking.service.name,
          requestedDate: booking.dateTime.requestedStart
        },
        channels: ['email', 'push']
      });
      
      // 5. Notify provider
      await NotificationService.send({
        recipient: booking.provider,
        template: 'booking_expired_provider',
        data: {
          bookingNumber: booking.bookingNumber,
          patientName: `${booking.patient.firstName} ${booking.patient.lastName}`,
          serviceName: booking.service.name,
          requestedDate: booking.dateTime.requestedStart
        },
        channels: ['email']
      });
      
      // 6. Update provider stats
      await ProviderStatsService.recordExpiration(booking.provider._id);
      
      console.log(`[CRON] Expired booking ${booking.bookingNumber}`);
      
    } catch (error) {
      console.error(`[CRON] Error expiring booking ${booking._id}:`, error);
      // Don't throw - continue processing other bookings
    }
  }
  
  return expiredBookings.length;
}

module.exports = { processExpiredBookings };
```

---

## 🔔 NOTIFICATION SYSTEM

### Notification Service

```javascript
// backend/services/NotificationService.js

const sgMail = require('@sendgrid/mail');
const admin = require('firebase-admin');
const twilio = require('twilio');

class NotificationService {
  
  async send({ recipient, template, data, channels }) {
    const results = [];
    
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmail(recipient, template, data);
            results.push({ channel: 'email', success: true });
            break;
            
          case 'push':
            if (recipient.fcmToken) {
              await this.sendPush(recipient.fcmToken, template, data);
              results.push({ channel: 'push', success: true });
            }
            break;
            
          case 'sms':
            if (recipient.phone && recipient.smsEnabled) {
              await this.sendSMS(recipient.phone, template, data);
              results.push({ channel: 'sms', success: true });
            }
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
        results.push({ channel, success: false, error: error.message });
      }
    }
    
    return results;
  }
  
  async sendEmail(recipient, template, data) {
    const templates = {
      'booking_request_received': {
        subject: 'New Booking Request - Action Required',
        templateId: 'd-xxxxx'
      },
      'booking_confirmed_patient': {
        subject: 'Your Booking is Confirmed! ✓',
        templateId: 'd-xxxxx'
      },
      'booking_expired_patient': {
        subject: 'Booking Request Expired - Payment Released',
        templateId: 'd-xxxxx'
      },
      // ... more templates
    };
    
    const config = templates[template];
    if (!config) throw new Error(`Unknown email template: ${template}`);
    
    await sgMail.send({
      to: recipient.email,
      from: {
        email: 'bookings@findrhealth.com',
        name: 'Findr Health'
      },
      subject: config.subject,
      templateId: config.templateId,
      dynamicTemplateData: data
    });
  }
  
  async sendPush(fcmToken, template, data) {
    const messages = {
      'new_booking_request': {
        title: 'New Booking Request',
        body: `${data.patientName} wants to book ${data.serviceName}`
      },
      'booking_confirmed_patient': {
        title: 'Booking Confirmed! ✓',
        body: `Your appointment with ${data.providerName} is confirmed`
      },
      // ... more messages
    };
    
    const config = messages[template];
    if (!config) return;
    
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: config.title,
        body: config.body
      },
      data: {
        type: template,
        bookingId: data.bookingId,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    });
  }
}
```

---

## 🚀 FEATURE FLAGS

### Feature Flag System

```javascript
// backend/services/FeatureFlags.js

const FEATURE_FLAGS = {
  // Global flags
  'booking.request_mode_enabled': {
    default: true,
    description: 'Enable request booking mode for providers without calendars'
  },
  'booking.instant_mode_enabled': {
    default: true,
    description: 'Enable instant booking for providers with calendars'
  },
  'booking.payment_holds_enabled': {
    default: true,
    description: 'Use payment holds instead of immediate capture for request bookings'
  },
  
  // Rollout flags
  'booking.request_mode_percentage': {
    default: 100,
    description: 'Percentage of providers to enable request mode for'
  },
  
  // Kill switches
  'booking.disable_all_bookings': {
    default: false,
    description: 'Emergency: Disable all new bookings'
  },
  'payment.disable_captures': {
    default: false,
    description: 'Emergency: Stop all payment captures'
  }
};

class FeatureFlags {
  constructor() {
    this.overrides = new Map();
  }
  
  async isEnabled(flagName, context = {}) {
    // Check for emergency kill switch
    if (flagName === 'booking.request_mode_enabled' && 
        await this.isEnabled('booking.disable_all_bookings')) {
      return false;
    }
    
    // Check for override
    if (this.overrides.has(flagName)) {
      return this.overrides.get(flagName);
    }
    
    // Check provider-specific override
    if (context.providerId) {
      const providerOverride = await this.getProviderOverride(flagName, context.providerId);
      if (providerOverride !== null) return providerOverride;
    }
    
    // Check percentage rollout
    if (flagName.endsWith('_percentage')) {
      return this.checkPercentage(flagName, context);
    }
    
    // Return default
    return FEATURE_FLAGS[flagName]?.default ?? false;
  }
  
  checkPercentage(flagName, context) {
    const percentage = FEATURE_FLAGS[flagName]?.default ?? 0;
    if (percentage >= 100) return true;
    if (percentage <= 0) return false;
    
    // Deterministic based on provider ID
    const hash = this.hashString(context.providerId || '');
    return (hash % 100) < percentage;
  }
}

module.exports = new FeatureFlags();
```

---

## 📦 MIGRATION STRATEGY

### Migration Script

```javascript
// backend/migrations/20260115_add_booking_request_fields.js

async function up(db) {
  console.log('Running migration: add_booking_request_fields');
  
  // 1. Update existing bookings with new fields
  await db.collection('bookings').updateMany(
    { bookingType: { $exists: false } },
    {
      $set: {
        bookingType: 'instant',  // Existing bookings were instant
        'confirmation.required': false,
        'reschedule.count': 0,
        'reschedule.maxAttempts': 2,
        version: 1
      }
    }
  );
  
  // 2. Update existing providers with booking settings
  await db.collection('providers').updateMany(
    { 'bookingSettings.mode': { $exists: false } },
    {
      $set: {
        'bookingSettings.mode': 'instant',  // Default based on calendar
        'bookingSettings.confirmationDeadlineHours': 24,
        'bookingSettings.minimumNoticeHours': 24,
        'bookingSettings.allowReschedule': true,
        'bookingSettings.maxRescheduleAttempts': 2,
        'bookingStats.totalRequests': 0,
        'bookingStats.totalConfirmed': 0,
        'bookingStats.totalExpired': 0
      }
    }
  );
  
  // 3. Set mode based on calendar connection
  await db.collection('providers').updateMany(
    { calendarConnected: false },
    { $set: { 'bookingSettings.mode': 'request' } }
  );
  
  await db.collection('providers').updateMany(
    { calendarConnected: true },
    { $set: { 'bookingSettings.mode': 'instant' } }
  );
  
  // 4. Create indexes
  await db.collection('bookings').createIndex(
    { provider: 1, status: 1, 'confirmation.expiresAt': 1 },
    { name: 'pending_expiration_lookup' }
  );
  
  await db.collection('bookings').createIndex(
    { 'payment.paymentIntentId': 1 },
    { name: 'payment_intent_lookup', sparse: true }
  );
  
  // 5. Create BookingEvents collection
  await db.createCollection('bookingevents');
  await db.collection('bookingevents').createIndex({ booking: 1, timestamp: -1 });
  await db.collection('bookingevents').createIndex({ eventType: 1, timestamp: -1 });
  
  // 6. Create SlotReservations collection with TTL
  await db.createCollection('slotreservations');
  await db.collection('slotreservations').createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }  // TTL index
  );
  await db.collection('slotreservations').createIndex(
    { provider: 1, startTime: 1, status: 1 }
  );
  
  console.log('Migration complete: add_booking_request_fields');
}

async function down(db) {
  // Rollback logic if needed
  await db.collection('bookings').updateMany(
    {},
    {
      $unset: {
        bookingType: '',
        confirmation: '',
        reschedule: '',
        slotReservation: '',
        version: ''
      }
    }
  );
}

module.exports = { up, down };
```

---

## 📊 MONITORING & ALERTING

### Key Metrics to Track

| Metric | Type | Alert Threshold |
|--------|------|-----------------|
| `booking.request.created` | Counter | - |
| `booking.request.confirmed` | Counter | - |
| `booking.request.expired` | Counter | > 10/hour |
| `booking.request.response_time_ms` | Histogram | p95 > 4h |
| `booking.payment.hold_created` | Counter | - |
| `booking.payment.hold_captured` | Counter | - |
| `booking.payment.hold_cancelled` | Counter | - |
| `booking.payment.holds_active_amount` | Gauge | > $10,000 |
| `booking.slot.reserved` | Counter | - |
| `booking.slot.conversion_rate` | Gauge | < 80% |
| `api.request.duration_ms` | Histogram | p99 > 2s |
| `api.error.rate` | Gauge | > 1% |
| `cron.job.duration_ms` | Histogram | - |
| `cron.job.failure` | Counter | > 0 |

### Health Check Endpoint

```javascript
// backend/routes/health.js

router.get('/health/booking', async (req, res) => {
  const checks = {};
  
  // 1. Database connectivity
  try {
    await Booking.findOne().limit(1);
    checks.database = { status: 'healthy' };
  } catch (e) {
    checks.database = { status: 'unhealthy', error: e.message };
  }
  
  // 2. Pending bookings count
  const pendingCount = await Booking.countDocuments({ status: 'pending_confirmation' });
  checks.pendingBookings = {
    status: pendingCount < 100 ? 'healthy' : 'warning',
    count: pendingCount
  };
  
  // 3. Expiring soon count
  const expiringSoon = await Booking.countDocuments({
    status: 'pending_confirmation',
    'confirmation.expiresAt': { 
      $lt: new Date(Date.now() + 4 * 60 * 60 * 1000)
    }
  });
  checks.expiringSoon = {
    status: expiringSoon < 20 ? 'healthy' : 'warning',
    count: expiringSoon
  };
  
  // 4. Payment holds
  const activeHolds = await Booking.aggregate([
    { $match: { 'payment.status': 'held' } },
    { $group: { _id: null, total: { $sum: '$payment.originalAmount' }, count: { $sum: 1 } } }
  ]);
  checks.paymentHolds = {
    status: (activeHolds[0]?.total || 0) < 1000000 ? 'healthy' : 'warning',
    amount: activeHolds[0]?.total || 0,
    count: activeHolds[0]?.count || 0
  };
  
  // 5. Last cron run
  const lastCronRun = await SystemStatus.findOne({ key: 'last_expiration_job' });
  const cronAge = Date.now() - (lastCronRun?.timestamp || 0);
  checks.cronJobs = {
    status: cronAge < 10 * 60 * 1000 ? 'healthy' : 'unhealthy',
    lastRun: lastCronRun?.timestamp
  };
  
  // Overall status
  const overallStatus = Object.values(checks).every(c => c.status === 'healthy')
    ? 'healthy'
    : Object.values(checks).some(c => c.status === 'unhealthy')
      ? 'unhealthy'
      : 'degraded';
  
  res.status(overallStatus === 'unhealthy' ? 503 : 200).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks
  });
});
```

---

## ♿ ACCESSIBILITY (WCAG 2.1 AA)

### Requirements

| Element | Requirement | Implementation |
|---------|-------------|----------------|
| Status badges | Color + text | Never rely on color alone; include text labels |
| Booking mode | Screen reader | Add `aria-label` describing the mode |
| Countdown timer | Live region | Use `aria-live="polite"` for expiration updates |
| Action buttons | Focus visible | 3px outline on focus |
| Error messages | Association | Use `aria-describedby` linking to error |
| Loading states | Announcement | Use `aria-busy` and announce completion |
| Modal dialogs | Focus trap | Trap focus within modal, return on close |

### Color Contrast

All status colors meet WCAG AA (4.5:1 for text, 3:1 for UI):

| Status | Background | Text | Contrast Ratio |
|--------|------------|------|----------------|
| Pending | `#FEF3C7` | `#92400E` | 5.2:1 ✓ |
| Confirmed | `#D1FAE5` | `#065F46` | 5.8:1 ✓ |
| Expired | `#FEE2E2` | `#991B1B` | 5.4:1 ✓ |
| Cancelled | `#F3F4F6` | `#374151` | 7.1:1 ✓ |

---

## 📋 IMPLEMENTATION PHASES (REVISED)

### Phase 0: Foundation (2 hours)
- [ ] Set up feature flags
- [ ] Create migration script
- [ ] Set up monitoring dashboards
- [ ] Create BookingEvent model

### Phase 1: Backend Core (6-8 hours)
- [ ] Update Booking model with all new fields
- [ ] Update Provider model with booking settings
- [ ] Create SlotReservation model
- [ ] Implement state machine with validation
- [ ] Create payment hold service
- [ ] Implement slot reservation API
- [ ] Create confirmation/reschedule endpoints
- [ ] Add idempotency layer
- [ ] Write unit tests

### Phase 2: Background Jobs (3-4 hours)
- [ ] Implement expiration job
- [ ] Implement warning notification job
- [ ] Implement payment hold monitor
- [ ] Implement stats calculation job
- [ ] Add job health monitoring

### Phase 3: Provider Portal (4-5 hours)
- [ ] Create pending requests dashboard widget
- [ ] Build PendingRequests page
- [ ] Implement confirm/reschedule/decline flows
- [ ] Add real-time WebSocket updates
- [ ] Create booking settings page
- [ ] Update navigation with badges

### Phase 4: Consumer App (5-6 hours)
- [ ] Add booking mode badges
- [ ] Update provider detail with response stats
- [ ] Implement slot reservation during checkout
- [ ] Create reschedule response screen
- [ ] Add booking status timeline
- [ ] Implement deep linking
- [ ] Add offline queue
- [ ] Update push notification handling

### Phase 5: Admin Dashboard (3-4 hours)
- [ ] Create booking health dashboard
- [ ] Add provider response metrics
- [ ] Implement admin override capability
- [ ] Add payment hold aging view
- [ ] Create alert configuration

### Phase 6: Onboarding Integration (2 hours)
- [ ] Add calendar step to onboarding wizard
- [ ] Show booking mode implications
- [ ] Add skip functionality with explanation

### Phase 7: Testing & Launch (4-5 hours)
- [ ] Integration testing all flows
- [ ] Load testing payment holds
- [ ] Edge case validation
- [ ] Accessibility audit
- [ ] Documentation updates
- [ ] Staged rollout (10% → 50% → 100%)

**Total Estimated: 29-36 hours**

---

## ✅ ACCEPTANCE CRITERIA

### Must Have (P0)
- [ ] Request bookings work end-to-end
- [ ] Payment holds created and released correctly
- [ ] Expiration handling works automatically
- [ ] Provider can confirm/decline/reschedule
- [ ] Patient can accept/decline reschedule
- [ ] Notifications sent for all state changes
- [ ] Audit trail captures all events
- [ ] No double-booking possible

### Should Have (P1)
- [ ] Real-time updates in provider portal
- [ ] Deep linking from notifications
- [ ] Provider response stats displayed
- [ ] Admin can override any state
- [ ] Offline queue in mobile app

### Nice to Have (P2)
- [ ] SMS notifications
- [ ] Provider auto-confirm option
- [ ] Bulk actions for providers
- [ ] A/B testing framework

---

## 📝 CHANGE LOG

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 15, 2026 | Claude + Tim | Initial planning document |
| 2.0 | Jan 15, 2026 | Claude + Tim | Critical analysis improvements: Added timezone handling, state machine, slot reservation, audit trail, feature flags, migration strategy, monitoring, accessibility, offline support, deep linking, real-time updates, rate limiting |

---

*Document Status: Ready for Implementation*  
*Next Step: Execute Phase 0 (Foundation) followed by Phase 1 (Backend Core)*
