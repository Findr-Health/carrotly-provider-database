# CALENDAR-OPTIONAL BOOKING FLOW IMPLEMENTATION PLAN

**Document Version:** 1.0  
**Created:** January 15, 2026  
**Status:** Planning  

---

## 📋 EXECUTIVE SUMMARY

This document outlines the complete implementation plan for supporting two booking modes:
1. **Instant Book** - Providers with connected calendars (Google/Microsoft)
2. **Request Booking** - Providers without calendars (manual confirmation required)

The goal is to enable all providers to receive bookings regardless of calendar integration status, while providing clear UX differentiation and appropriate payment handling.

---

## 🎯 DESIGN PRINCIPLES

1. **No provider left behind** - All providers can accept bookings
2. **Clear expectations** - Patients know if booking is instant vs. request
3. **Safe payments** - Card holds protect both parties
4. **Timely responses** - 24hr SLA with automatic handling
5. **Seamless upgrades** - Easy path from manual to calendar-integrated

---

## 📊 DATABASE SCHEMA CHANGES

### 1. Booking Model Updates

**File:** `backend/models/Booking.js`

```javascript
// EXISTING FIELDS (no changes)
{
  _id: ObjectId,
  patient: { type: ObjectId, ref: 'User' },
  provider: { type: ObjectId, ref: 'Provider' },
  service: {
    serviceId: String,
    name: String,
    duration: Number,
    price: Number
  },
  // ... other existing fields
}

// NEW/MODIFIED FIELDS
{
  // Booking Type (NEW)
  bookingType: {
    type: String,
    enum: ['instant', 'request'],
    required: true
  },
  
  // Enhanced Status (MODIFY existing status field)
  status: {
    type: String,
    enum: [
      'pending_payment',      // Initial state
      'pending_confirmation', // Request booking awaiting provider response (NEW)
      'confirmed',            // Provider confirmed or instant book
      'rescheduled',          // Provider proposed new time (NEW)
      'reschedule_pending',   // Awaiting patient acceptance of new time (NEW)
      'in_progress',          // Appointment happening now
      'completed',            // Service delivered
      'cancelled',            // Cancelled by patient or provider
      'expired',              // Provider didn't respond in time (NEW)
      'no_show'               // Patient didn't show up
    ],
    default: 'pending_payment'
  },
  
  // Confirmation Tracking (NEW)
  confirmation: {
    required: { type: Boolean, default: false },
    requestedAt: Date,           // When booking request was sent
    respondedAt: Date,           // When provider responded
    expiresAt: Date,             // 24hr deadline
    responseType: {              // How provider responded
      type: String,
      enum: ['confirmed', 'rescheduled', 'declined', 'expired']
    }
  },
  
  // Rescheduling (NEW)
  reschedule: {
    originalDateTime: Date,      // Original requested time
    proposedDateTime: Date,      // Provider's proposed alternative
    proposedBy: {
      type: String,
      enum: ['provider', 'patient']
    },
    proposedAt: Date,
    patientResponseDeadline: Date,  // 24hrs for patient to accept
    history: [{                     // Track all reschedule attempts
      from: Date,
      to: Date,
      proposedBy: String,
      proposedAt: Date,
      accepted: Boolean
    }]
  },
  
  // Payment Hold (NEW - for request bookings)
  paymentHold: {
    holdId: String,              // Stripe PaymentIntent ID in 'requires_capture' state
    amount: Number,              // Amount held
    createdAt: Date,
    expiresAt: Date,             // Stripe holds expire after 7 days
    capturedAt: Date,            // When hold was converted to charge
    cancelledAt: Date            // When hold was released
  },
  
  // Calendar Event Reference (MODIFY - support both providers)
  calendarEvent: {
    provider: String,            // 'google' or 'microsoft'
    eventId: String,
    eventLink: String,
    createdAt: Date,
    syncStatus: {
      type: String,
      enum: ['pending', 'synced', 'failed', 'not_applicable']
    }
  },
  
  // Notification Tracking (NEW)
  notifications: {
    providerConfirmationRequest: {
      sent: Boolean,
      sentAt: Date,
      channels: [String]         // ['email', 'push', 'sms']
    },
    providerReminder: {
      sent: Boolean,
      sentAt: Date
    },
    patientConfirmation: {
      sent: Boolean,
      sentAt: Date
    },
    patientRescheduleRequest: {
      sent: Boolean,
      sentAt: Date
    },
    expirationWarning: {
      sent: Boolean,
      sentAt: Date
    }
  },
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  confirmedAt: Date,
  completedAt: Date,
  cancelledAt: Date
}
```

### 2. Provider Model Updates

**File:** `backend/models/Provider.js`

```javascript
// NEW FIELDS to add
{
  // Booking Configuration (NEW)
  bookingSettings: {
    mode: {
      type: String,
      enum: ['instant', 'request', 'hybrid'],
      default: 'request'  // Default to request until calendar connected
    },
    autoConfirm: {
      type: Boolean,
      default: false      // If true, auto-confirm request bookings
    },
    confirmationDeadlineHours: {
      type: Number,
      default: 24
    },
    allowReschedule: {
      type: Boolean,
      default: true
    },
    maxRescheduleAttempts: {
      type: Number,
      default: 2
    },
    minimumNoticeHours: {
      type: Number,
      default: 24         // Minimum hours before appointment for booking
    }
  },
  
  // Stats for display (NEW)
  bookingStats: {
    totalBookings: { type: Number, default: 0 },
    confirmedBookings: { type: Number, default: 0 },
    avgResponseTimeMinutes: { type: Number, default: null },
    responseRate: { type: Number, default: null },  // % of requests responded to
    lastBookingAt: Date
  },
  
  // EXISTING calendar fields remain unchanged
  calendar: { /* ... */ },
  calendarConnected: Boolean
}
```

### 3. New Model: BookingRequest (Optional - for complex request tracking)

**File:** `backend/models/BookingRequest.js`

```javascript
// Consider if tracking gets complex - for now, embed in Booking model
```

---

## 🔌 API ENDPOINTS

### New Endpoints Required

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/bookings/request` | Create request booking (hold payment) |
| POST | `/api/bookings/:id/confirm` | Provider confirms booking |
| POST | `/api/bookings/:id/decline` | Provider declines booking |
| POST | `/api/bookings/:id/reschedule` | Provider proposes new time |
| POST | `/api/bookings/:id/accept-reschedule` | Patient accepts new time |
| POST | `/api/bookings/:id/decline-reschedule` | Patient declines, cancels booking |
| GET | `/api/bookings/pending` | Get provider's pending confirmations |
| POST | `/api/bookings/:id/capture-payment` | Capture held payment (internal) |
| POST | `/api/bookings/:id/release-hold` | Release payment hold (internal) |

### Modified Endpoints

| Method | Endpoint | Changes |
|--------|----------|---------|
| POST | `/api/bookings` | Add `bookingType` detection, branching logic |
| GET | `/api/bookings/:id` | Include confirmation/reschedule status |
| GET | `/api/providers/:id` | Include `bookingMode` in response |
| GET | `/api/providers` | Add `bookingMode` filter, badges |

### Webhook Endpoints (for scheduled jobs)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/webhooks/booking-expiration` | Handle 24hr timeout |
| POST | `/api/webhooks/payment-hold-expiring` | Handle 7-day Stripe hold expiry |

---

## 💳 PAYMENT FLOW CHANGES

### Instant Book (Calendar Connected)
```
1. Patient selects time
2. Stripe PaymentIntent created + captured immediately
3. Booking confirmed
4. Calendar event created
5. Confirmation emails sent
```

### Request Booking (No Calendar)
```
1. Patient selects time
2. Stripe PaymentIntent created with capture_method: 'manual'
3. Payment authorized but NOT captured (hold)
4. Booking created as 'pending_confirmation'
5. Provider notified
6. BRANCH:
   a. Provider confirms → Capture payment → Create calendar event (if available)
   b. Provider declines → Release hold → Notify patient
   c. Provider reschedules → Patient accepts → Capture payment
   d. 24hr timeout → Release hold → Notify both parties
```

### Stripe Implementation Details

**File:** `backend/routes/bookings.js`

```javascript
// For Request Bookings - Create hold
const paymentIntent = await stripe.paymentIntents.create({
  amount: amountInCents,
  currency: 'usd',
  customer: stripeCustomerId,
  payment_method: paymentMethodId,
  capture_method: 'manual',  // KEY: Don't capture immediately
  confirm: true,
  metadata: {
    bookingId: booking._id.toString(),
    bookingType: 'request',
    providerId: providerId,
    patientId: patientId
  }
});

// Save hold info
booking.paymentHold = {
  holdId: paymentIntent.id,
  amount: amountInCents,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
};

// Later - Capture payment when provider confirms
await stripe.paymentIntents.capture(paymentIntent.id);

// Or - Cancel hold if expired/declined
await stripe.paymentIntents.cancel(paymentIntent.id);
```

---

## 📱 CONSUMER APP (FLUTTER) CHANGES

### 1. Provider Card Component

**File:** `lib/widgets/provider_card.dart`

**Changes:**
- Add booking mode badge
- Show response time for request bookings
- Visual differentiation (instant = green, request = blue)

```dart
// Badge display logic
Widget _buildBookingBadge() {
  if (provider.calendarConnected) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.green.shade100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.bolt, size: 14, color: Colors.green.shade700),
          SizedBox(width: 4),
          Text('Instant Book', style: TextStyle(
            color: Colors.green.shade700,
            fontSize: 12,
            fontWeight: FontWeight.w600
          )),
        ],
      ),
    );
  } else {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.blue.shade100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.schedule_send, size: 14, color: Colors.blue.shade700),
          SizedBox(width: 4),
          Text('Request Booking', style: TextStyle(
            color: Colors.blue.shade700,
            fontSize: 12,
            fontWeight: FontWeight.w600
          )),
        ],
      ),
    );
  }
}
```

### 2. Provider Detail Screen

**File:** `lib/screens/provider_detail_screen.dart`

**Changes:**
- Show booking mode prominently
- For request bookings, show:
  - Average response time
  - Response rate percentage
  - "Usually responds within X hours"

### 3. DateTime Selection Screen

**File:** `lib/screens/datetime_selection_screen.dart`

**Changes:**
- For instant book: "Select your appointment time"
- For request: "Request your preferred time"
- Show disclaimer for request: "Provider will confirm within 24 hours"

### 4. Booking Confirmation Screen

**File:** `lib/screens/booking_confirmation_screen.dart`

**Changes:**
- Instant book: "Your appointment is confirmed!"
- Request: "Your booking request has been sent!"
  - Show expected confirmation time
  - Explain payment hold
  - Show next steps

### 5. NEW: Reschedule Response Screen

**File:** `lib/screens/reschedule_response_screen.dart` (NEW)

**Purpose:** Patient responds to provider's reschedule proposal

**UI Elements:**
- Original requested time (struck through)
- Proposed new time (highlighted)
- Accept / Decline buttons
- "Accept" → Confirms booking at new time
- "Decline" → Cancels booking, releases hold

### 6. Bookings List Screen

**File:** `lib/screens/bookings_screen.dart`

**Changes:**
- Add status indicators:
  - 🟡 "Awaiting Confirmation" for pending_confirmation
  - 🔵 "Reschedule Proposed" for reschedule_pending
  - 🟢 "Confirmed" for confirmed
  - 🔴 "Expired" for expired
- Add action buttons where applicable

### 7. Booking Detail Screen

**File:** `lib/screens/booking_detail_screen.dart`

**Changes:**
- Show full timeline of booking status changes
- For reschedule_pending: Show accept/decline UI
- Show payment status (held vs charged)

### 8. Push Notifications

**New notification types:**
- `booking_confirmed` - Provider confirmed your request
- `booking_declined` - Provider unable to accommodate
- `reschedule_proposed` - Provider proposed new time
- `booking_expired` - Request expired (payment released)
- `confirmation_reminder` - Your request expires soon

---

## 💻 PROVIDER PORTAL CHANGES

### 1. Dashboard Updates

**File:** `src/pages/Dashboard.tsx`

**Changes:**
- Add "Pending Requests" section at top (high visibility)
- Show count badge on navigation
- Quick action buttons: Confirm / Reschedule / Decline

```tsx
// Pending Requests Card
<div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-semibold text-yellow-800">
      ⏳ Pending Booking Requests ({pendingCount})
    </h2>
    <span className="text-sm text-yellow-600">
      Respond within 24 hours
    </span>
  </div>
  
  {pendingBookings.map(booking => (
    <PendingBookingCard 
      key={booking._id}
      booking={booking}
      onConfirm={handleConfirm}
      onReschedule={handleReschedule}
      onDecline={handleDecline}
    />
  ))}
</div>
```

### 2. NEW: Pending Requests Page

**File:** `src/pages/PendingRequests.tsx` (NEW)

**Purpose:** Dedicated page for managing booking requests

**Features:**
- List all pending confirmations
- Sort by expiration time (urgent first)
- Bulk actions (confirm all)
- Reschedule modal with calendar picker
- Decline with reason (optional)

### 3. Bookings Page Updates

**File:** `src/pages/Bookings.tsx`

**Changes:**
- Add status filter tabs: All | Pending | Confirmed | Completed
- Visual status indicators
- Action buttons per status
- Timeline view of status changes

### 4. Calendar Settings Page Updates

**File:** `src/pages/Calendar.tsx`

**Changes:**
- Add section explaining booking modes
- Show current mode: "Instant Book" or "Request Booking"
- Explain benefits of connecting calendar
- Stats: "Providers with Instant Book get 40% more bookings"

### 5. NEW: Booking Settings Page

**File:** `src/pages/BookingSettings.tsx` (NEW)

**Purpose:** Configure booking preferences

**Options:**
- Auto-confirm requests (toggle)
- Confirmation deadline (12h / 24h / 48h)
- Allow rescheduling (toggle)
- Minimum notice period
- Booking buffer time

### 6. Navigation Updates

**File:** `src/components/Sidebar.tsx`

**Changes:**
- Add badge to "Bookings" showing pending count
- Add "Pending Requests" quick link when count > 0

### 7. Email Notifications for Providers

**New templates needed:**
- `new_booking_request` - New request received (action required)
- `request_expiring_soon` - 4 hours until expiration
- `request_expired` - Request auto-expired

---

## 🔧 ADMIN DASHBOARD CHANGES

### 1. Bookings Overview

**File:** `src/pages/Bookings.tsx` (admin)

**Changes:**
- Add booking type column (Instant / Request)
- Add status breakdown chart
- Show conversion rate: requests → confirmed
- Show average response time by provider
- Flag providers with low response rates

### 2. Provider Detail Updates

**File:** `src/components/ProviderDetail.jsx`

**Changes:**
- Add "Booking Performance" section
- Show metrics:
  - Total requests received
  - Confirmation rate
  - Average response time
  - Expiration rate (concerning if high)
- Ability to manually confirm/cancel bookings

### 3. NEW: Booking Health Dashboard

**File:** `src/pages/BookingHealth.tsx` (NEW)

**Purpose:** Monitor booking system health

**Metrics:**
- Pending requests aging (how many approaching 24h)
- Payment holds active (total $ held)
- Expiration rate trends
- Provider response time leaderboard
- Problematic providers (low response rate)

### 4. Alerts/Notifications

- Alert when payment holds approaching Stripe 7-day limit
- Alert for providers with multiple expired requests
- Daily digest of booking metrics

---

## ⏰ SCHEDULED JOBS (CRON)

### 1. Booking Expiration Job

**Schedule:** Every 15 minutes

**Logic:**
```javascript
// Find expired pending confirmations
const expiredBookings = await Booking.find({
  status: 'pending_confirmation',
  'confirmation.expiresAt': { $lt: new Date() }
});

for (const booking of expiredBookings) {
  // Release payment hold
  await stripe.paymentIntents.cancel(booking.paymentHold.holdId);
  
  // Update status
  booking.status = 'expired';
  booking.confirmation.responseType = 'expired';
  booking.paymentHold.cancelledAt = new Date();
  await booking.save();
  
  // Notify patient
  await sendPatientNotification(booking, 'booking_expired');
  
  // Log for provider metrics
  await updateProviderStats(booking.provider, 'expiration');
}
```

### 2. Expiration Warning Job

**Schedule:** Every hour

**Logic:**
```javascript
// Find bookings expiring in 4 hours
const expiringBookings = await Booking.find({
  status: 'pending_confirmation',
  'confirmation.expiresAt': { 
    $gt: new Date(),
    $lt: new Date(Date.now() + 4 * 60 * 60 * 1000)
  },
  'notifications.expirationWarning.sent': { $ne: true }
});

for (const booking of expiringBookings) {
  await sendProviderNotification(booking, 'request_expiring_soon');
  booking.notifications.expirationWarning = { sent: true, sentAt: new Date() };
  await booking.save();
}
```

### 3. Payment Hold Monitor Job

**Schedule:** Daily

**Logic:**
```javascript
// Find holds approaching 7-day Stripe limit
const agingHolds = await Booking.find({
  status: { $in: ['pending_confirmation', 'reschedule_pending'] },
  'paymentHold.expiresAt': { 
    $lt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
  }
});

// Alert admin
if (agingHolds.length > 0) {
  await sendAdminAlert('payment_holds_expiring', { count: agingHolds.length });
}
```

### 4. Provider Stats Update Job

**Schedule:** Daily at midnight

**Logic:**
```javascript
// Recalculate provider booking stats
const providers = await Provider.find({ status: 'approved' });

for (const provider of providers) {
  const stats = await Booking.aggregate([
    { $match: { provider: provider._id } },
    { $group: {
      _id: null,
      total: { $sum: 1 },
      confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
      avgResponseTime: { $avg: { 
        $subtract: ['$confirmation.respondedAt', '$confirmation.requestedAt'] 
      }}
    }}
  ]);
  
  provider.bookingStats = {
    totalBookings: stats[0]?.total || 0,
    confirmedBookings: stats[0]?.confirmed || 0,
    avgResponseTimeMinutes: stats[0]?.avgResponseTime ? stats[0].avgResponseTime / 60000 : null,
    responseRate: stats[0]?.total ? (stats[0].confirmed / stats[0].total * 100) : null
  };
  await provider.save();
}
```

---

## 🔔 NOTIFICATION TEMPLATES

### Email Templates Needed

| Template | Recipient | Trigger |
|----------|-----------|---------|
| `booking_request_received` | Provider | New request booking |
| `booking_request_expiring` | Provider | 4hrs before expiration |
| `booking_request_expired_provider` | Provider | Request expired |
| `booking_confirmed_patient` | Patient | Provider confirmed |
| `booking_declined_patient` | Patient | Provider declined |
| `booking_reschedule_proposed` | Patient | Provider proposed new time |
| `booking_request_expired_patient` | Patient | Request expired, hold released |
| `booking_reschedule_accepted` | Provider | Patient accepted new time |
| `booking_reschedule_declined` | Provider | Patient declined, booking cancelled |

### Push Notification Templates

| Type | Title | Body |
|------|-------|------|
| `new_request` | "New Booking Request" | "{patient} wants to book {service} on {date}" |
| `request_expiring` | "Response Needed" | "Booking request expires in 4 hours" |
| `confirmed` | "Booking Confirmed! ✓" | "Your appointment with {provider} is confirmed" |
| `declined` | "Booking Update" | "{provider} couldn't accommodate your request" |
| `reschedule_proposed` | "New Time Proposed" | "{provider} suggested {new_date} instead" |
| `expired` | "Request Expired" | "Your booking request has expired. Payment hold released." |

---

## 🎨 UI/UX SPECIFICATIONS

### Badge Designs

**Instant Book Badge:**
- Background: `#dcfce7` (green-100)
- Text: `#15803d` (green-700)
- Icon: Lightning bolt ⚡
- Text: "Instant Book"

**Request Booking Badge:**
- Background: `#dbeafe` (blue-100)
- Text: `#1d4ed8` (blue-700)
- Icon: Clock/Send 📩
- Text: "Request Booking"

### Status Colors

| Status | Color | Hex |
|--------|-------|-----|
| pending_confirmation | Yellow | `#fbbf24` |
| confirmed | Green | `#22c55e` |
| reschedule_pending | Blue | `#3b82f6` |
| expired | Red | `#ef4444` |
| cancelled | Gray | `#6b7280` |
| completed | Teal | `#14b8a6` |

### Response Time Display

- "Usually responds within 1 hour" (< 2hrs avg)
- "Usually responds within a few hours" (2-6hrs avg)
- "Usually responds within 12 hours" (6-12hrs avg)
- "Usually responds within 24 hours" (12-24hrs avg)
- No display if no data

---

## 📋 IMPLEMENTATION PHASES

### Phase 1: Backend Foundation (4-6 hours)
- [ ] Update Booking model schema
- [ ] Update Provider model schema
- [ ] Create new API endpoints
- [ ] Implement payment hold logic
- [ ] Add confirmation/reschedule endpoints
- [ ] Create scheduled jobs

### Phase 2: Provider Portal (3-4 hours)
- [ ] Add pending requests section to dashboard
- [ ] Create PendingRequests page
- [ ] Add confirm/reschedule/decline UI
- [ ] Update bookings list with new statuses
- [ ] Add booking settings page
- [ ] Update navigation with badges

### Phase 3: Consumer App (4-5 hours)
- [ ] Add booking mode badges to provider cards
- [ ] Update provider detail screen
- [ ] Modify booking confirmation flow
- [ ] Create reschedule response screen
- [ ] Update bookings list with new statuses
- [ ] Implement new push notifications

### Phase 4: Admin Dashboard (2-3 hours)
- [ ] Add booking type to bookings view
- [ ] Update provider detail with booking stats
- [ ] Create booking health dashboard
- [ ] Add admin alerts

### Phase 5: Onboarding Integration (1-2 hours)
- [ ] Add calendar step to provider onboarding
- [ ] Show booking mode implications
- [ ] Allow skip with explanation

### Phase 6: Testing & Polish (2-3 hours)
- [ ] End-to-end testing of both flows
- [ ] Edge case handling
- [ ] Performance testing
- [ ] Documentation updates

---

## ⚠️ EDGE CASES TO HANDLE

1. **Patient cancels during pending_confirmation**
   - Release hold immediately
   - Notify provider

2. **Provider confirms after patient cancels**
   - Block confirmation
   - Show "booking was cancelled" message

3. **Multiple reschedule attempts**
   - Limit to 2 attempts
   - After 2, must confirm or decline

4. **Payment hold expires (7 days)**
   - Rare but possible
   - Auto-cancel booking
   - Alert admin

5. **Provider goes offline during pending**
   - Continue countdown
   - Auto-expire normally

6. **Booking time passes while still pending**
   - Auto-expire
   - Release hold
   - Alert both parties

7. **Patient payment method fails on capture**
   - Notify patient immediately
   - Give 24hrs to update payment
   - Cancel if not resolved

---

## 📊 SUCCESS METRICS

| Metric | Target | Measurement |
|--------|--------|-------------|
| Request confirmation rate | > 85% | Confirmed / Total requests |
| Average response time | < 4 hours | Time to first response |
| Expiration rate | < 10% | Expired / Total requests |
| Patient satisfaction | > 4.5/5 | Post-booking survey |
| Calendar connection rate | > 60% | Connected / Total providers |

---

## 🔗 RELATED DOCUMENTS

- `BOOKING_FLOW_IMPLEMENTATION_PLAN.md` (existing)
- `CANCELLATION_POLICY_IMPLEMENTATION.md` (existing)
- `PROVIDER_PORTAL_INTEGRATION_GUIDE.md` (existing)

---

## 📝 CHANGE LOG

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 15, 2026 | Claude + Tim | Initial planning document |

---

*Document Status: Ready for Review*  
*Next Step: Approve and begin Phase 1 implementation*
