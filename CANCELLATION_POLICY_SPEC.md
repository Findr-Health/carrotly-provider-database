# Findr Health - Cancellation Policy Implementation

## Overview

This document specifies the cancellation policy system for Findr Health, covering provider configuration, user booking flow, cancellation handling, and Stripe integration.

---

## Policy Tiers

### Standard (Default)
| Timeframe | Refund | Fee |
|-----------|--------|-----|
| 24+ hours before | 100% | $0 |
| 12-24 hours before | 75% | 25% |
| < 12 hours before | 50% | 50% |
| No-show | 0% | 100% |

### Moderate
| Timeframe | Refund | Fee |
|-----------|--------|-----|
| 48+ hours before | 100% | $0 |
| 24-48 hours before | 75% | 25% |
| < 24 hours before | 50% | 50% |
| No-show | 0% | 100% |

---

## Database Schema

### Provider Model Addition

```javascript
// Add to Provider schema
cancellationPolicy: {
  tier: {
    type: String,
    enum: ['standard', 'moderate'],
    default: 'standard'
  },
  // Provider can override and waive fees on individual bookings
  allowFeeWaiver: {
    type: Boolean,
    default: true
  }
}
```

### Booking Model Addition

```javascript
// Add to Booking schema
payment: {
  method: {
    type: String,
    enum: ['card', 'cash', 'insurance'],
    default: 'card'
  },
  stripeCustomerId: String,
  stripePaymentMethodId: String,
  stripePaymentIntentId: String,
  amount: Number,
  currency: {
    type: String,
    default: 'usd'
  },
  status: {
    type: String,
    enum: ['pending', 'authorized', 'captured', 'refunded', 'failed'],
    default: 'pending'
  }
},

cancellation: {
  status: {
    type: String,
    enum: ['none', 'cancelled_by_user', 'cancelled_by_provider', 'no_show'],
    default: 'none'
  },
  cancelledAt: Date,
  cancelledBy: {
    type: String,
    enum: ['user', 'provider', 'system']
  },
  reason: String,
  
  // Fee calculation
  policyTier: String,
  hoursBeforeAppointment: Number,
  calculatedFeePercent: Number,
  calculatedFeeAmount: Number,
  
  // Fee handling
  feeWaived: {
    type: Boolean,
    default: false
  },
  feeWaivedBy: mongoose.Schema.Types.ObjectId,
  feeWaivedReason: String,
  
  // Stripe
  refundAmount: Number,
  stripeRefundId: String,
  feeChargeId: String
}
```

---

## API Endpoints

### Provider Endpoints

```
GET    /api/providers/:id/cancellation-policy
PUT    /api/providers/:id/cancellation-policy
```

### Booking Cancellation Endpoints

```
POST   /api/bookings/:id/cancel              # User or provider cancels
POST   /api/bookings/:id/mark-no-show        # Provider marks no-show
POST   /api/bookings/:id/waive-fee           # Provider waives fee
GET    /api/bookings/:id/cancellation-quote  # Get fee before cancelling
```

---

## Fee Calculation Logic

```javascript
const calculateCancellationFee = (booking, provider) => {
  const now = new Date();
  const appointmentTime = new Date(booking.appointmentDate);
  const hoursUntil = (appointmentTime - now) / (1000 * 60 * 60);
  
  const policy = provider.cancellationPolicy?.tier || 'standard';
  
  let feePercent = 0;
  
  if (policy === 'standard') {
    if (hoursUntil >= 24) {
      feePercent = 0;
    } else if (hoursUntil >= 12) {
      feePercent = 25;
    } else if (hoursUntil > 0) {
      feePercent = 50;
    } else {
      feePercent = 100; // No-show
    }
  } else if (policy === 'moderate') {
    if (hoursUntil >= 48) {
      feePercent = 0;
    } else if (hoursUntil >= 24) {
      feePercent = 25;
    } else if (hoursUntil > 0) {
      feePercent = 50;
    } else {
      feePercent = 100; // No-show
    }
  }
  
  const feeAmount = Math.round(booking.payment.amount * (feePercent / 100));
  const refundAmount = booking.payment.amount - feeAmount;
  
  return {
    policyTier: policy,
    hoursUntilAppointment: Math.max(0, hoursUntil),
    feePercent,
    feeAmount,
    refundAmount,
    freeCancellationDeadline: policy === 'standard' 
      ? new Date(appointmentTime - 24 * 60 * 60 * 1000)
      : new Date(appointmentTime - 48 * 60 * 60 * 1000)
  };
};
```

---

## Stripe Integration

### 1. Booking Creation (Authorize Card)

```javascript
// When user books, authorize (hold) the amount
const createBookingPayment = async (booking, paymentMethodId, customerId) => {
  // Create payment intent with capture_method: 'manual'
  // This authorizes the card but doesn't charge yet
  const paymentIntent = await stripe.paymentIntents.create({
    amount: booking.totalAmount * 100, // Stripe uses cents
    currency: 'usd',
    customer: customerId,
    payment_method: paymentMethodId,
    capture_method: 'manual', // Don't capture yet
    confirm: true,
    metadata: {
      bookingId: booking._id.toString(),
      providerId: booking.providerId.toString(),
      userId: booking.userId.toString()
    }
  });
  
  return paymentIntent;
};
```

### 2. Service Completed (Capture Full Amount)

```javascript
// When appointment is completed, capture the held amount
const capturePayment = async (paymentIntentId) => {
  const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
  return paymentIntent;
};
```

### 3. User Cancels (Partial Capture or Cancel)

```javascript
const processCancellation = async (booking, feeAmount) => {
  if (feeAmount === 0) {
    // Full refund - cancel the payment intent
    await stripe.paymentIntents.cancel(booking.payment.stripePaymentIntentId);
    return { refunded: true, refundAmount: booking.payment.amount };
  } else if (feeAmount === booking.payment.amount) {
    // No refund (no-show) - capture full amount
    await stripe.paymentIntents.capture(booking.payment.stripePaymentIntentId);
    return { refunded: false, chargedAmount: booking.payment.amount };
  } else {
    // Partial refund - capture only the fee amount
    await stripe.paymentIntents.capture(
      booking.payment.stripePaymentIntentId,
      { amount_to_capture: feeAmount * 100 }
    );
    return { 
      refunded: true, 
      refundAmount: booking.payment.amount - feeAmount,
      chargedAmount: feeAmount 
    };
  }
};
```

### 4. Provider Cancels (Full Refund)

```javascript
const providerCancellation = async (booking) => {
  // Always cancel/refund fully when provider cancels
  await stripe.paymentIntents.cancel(booking.payment.stripePaymentIntentId);
  
  return { 
    refunded: true, 
    refundAmount: booking.payment.amount,
    chargedAmount: 0
  };
};
```

### 5. Provider Waives Fee

```javascript
const waiveCancellationFee = async (booking, adminId, reason) => {
  // If fee was already charged, issue refund
  if (booking.cancellation.feeChargeId) {
    const refund = await stripe.refunds.create({
      payment_intent: booking.payment.stripePaymentIntentId,
      amount: booking.cancellation.calculatedFeeAmount * 100,
      reason: 'requested_by_customer',
      metadata: {
        bookingId: booking._id.toString(),
        waivedBy: adminId,
        waiverReason: reason
      }
    });
    
    return refund;
  }
  
  // If not yet charged, just cancel the intent
  await stripe.paymentIntents.cancel(booking.payment.stripePaymentIntentId);
  return { waived: true };
};
```

---

## User Interface

### Provider Onboarding - Policy Selection

Add to Section 6 (Provider Agreement) or as new Section:

```
┌─────────────────────────────────────────────────────────────────┐
│ Cancellation Policy                                             │
│ Choose the policy that applies to all bookings at your practice │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ● Standard (Recommended)                                        │
│   Patients can cancel free of charge up to 24 hours before     │
│   their appointment.                                            │
│                                                                 │
│   • 24+ hours notice: Full refund                               │
│   • 12-24 hours notice: 25% fee                                 │
│   • Less than 12 hours: 50% fee                                 │
│   • No-show: Full charge                                        │
│                                                                 │
│ ○ Moderate                                                      │
│   Best for specialists and procedures requiring preparation.    │
│                                                                 │
│   • 48+ hours notice: Full refund                               │
│   • 24-48 hours notice: 25% fee                                 │
│   • Less than 24 hours: 50% fee                                 │
│   • No-show: Full charge                                        │
│                                                                 │
│ ☑ Allow fee waivers                                             │
│   You can waive cancellation fees on a case-by-case basis       │
│   from your dashboard.                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Provider Dashboard - Booking Detail with Waive Option

```
┌─────────────────────────────────────────────────────────────────┐
│ Booking #12345                                    [Mark No-Show]│
├─────────────────────────────────────────────────────────────────┤
│ Patient: John Smith                                             │
│ Service: Dental Cleaning                                        │
│ Date: Dec 15, 2025 at 2:00 PM                                  │
│ Amount: $150                                                    │
│                                                                 │
│ Status: Cancelled by Patient                                    │
│ Cancelled: Dec 14, 2025 at 8:00 PM (18 hours before)           │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Cancellation Fee: $37.50 (25%)                              │ │
│ │ Status: Charged                                              │ │
│ │                                                              │ │
│ │ [Waive Fee & Refund]                                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Waive Fee Modal

```
┌─────────────────────────────────────────────────────────────────┐
│ Waive Cancellation Fee                                      ✕   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ You're about to waive the $37.50 cancellation fee for this     │
│ booking. The patient will receive a full refund.               │
│                                                                 │
│ Reason (optional):                                              │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Emergency situation                                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Common reasons:                                                 │
│ • Emergency / illness                                           │
│ • Weather conditions                                            │
│ • First-time patient courtesy                                   │
│ • Provider requested reschedule                                 │
│                                                                 │
│              [Cancel]              [Waive Fee - Refund $37.50] │
└─────────────────────────────────────────────────────────────────┘
```

### User Booking Confirmation

```
┌─────────────────────────────────────────────────────────────────┐
│ ✅ Booking Confirmed                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Dental Cleaning                                                 │
│ Smith Family Dental                                             │
│ 📅 December 15, 2025 at 2:00 PM                                │
│ 📍 123 Main St, Bozeman, MT                                    │
│                                                                 │
│ Total: $150.00                                                  │
│ Payment: Visa •••• 4242                                         │
│                                                                 │
│ ───────────────────────────────────────────────────────────────│
│                                                                 │
│ 📋 Cancellation Policy                                          │
│                                                                 │
│ ✓ FREE cancellation until Dec 14, 2:00 PM                      │
│                                                                 │
│ After that:                                                     │
│ • 12-24 hrs before: $37.50 fee (25%)                           │
│ • Under 12 hrs: $75.00 fee (50%)                               │
│ • No-show: Full charge                                          │
│                                                                 │
│                    [Add to Calendar]                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### User Cancellation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Cancel Appointment                                          ✕   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Dental Cleaning                                                 │
│ December 15, 2025 at 2:00 PM                                   │
│                                                                 │
│ ───────────────────────────────────────────────────────────────│
│                                                                 │
│ Current time: December 14, 8:00 PM                             │
│ Time until appointment: 18 hours                               │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ⚠️ Cancellation Fee: $37.50                                 │ │
│ │                                                              │ │
│ │ You're cancelling within 24 hours of your appointment.      │ │
│ │ A 25% fee will be charged to your card.                     │ │
│ │                                                              │ │
│ │ Refund amount: $112.50                                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Reason for cancellation:                                        │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Select reason...                                        ▼   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│      [Keep Appointment]        [Cancel & Pay $37.50 Fee]       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Notifications

### User Receives (Email + Push)

| Event | Subject |
|-------|---------|
| Booking confirmed | "Booking confirmed - [Service] on [Date]" |
| Free cancellation deadline approaching | "Reminder: Free cancellation ends in 24 hours" |
| User cancels (with fee) | "Booking cancelled - $X fee charged" |
| User cancels (no fee) | "Booking cancelled - Full refund processed" |
| Provider cancels | "Appointment cancelled by provider - Full refund" |
| No-show charged | "Missed appointment - $X charged" |
| Fee waived | "Good news! Cancellation fee waived" |

### Provider Receives (Email + Dashboard)

| Event | Subject |
|-------|---------|
| New booking | "New booking: [Patient] - [Service]" |
| User cancels | "Booking cancelled by [Patient]" |
| Fee waived confirmation | "Fee waived for booking #[ID]" |

---

## Implementation Phases

### Phase 1: Schema & Backend (Today)
- [ ] Update Provider model with cancellationPolicy
- [ ] Update Booking model with cancellation fields
- [ ] Create cancellation calculation utility
- [ ] Create API endpoints

### Phase 2: Provider UI (Next)
- [ ] Add policy selector to onboarding
- [ ] Add policy settings to provider dashboard
- [ ] Add waive fee button to booking detail

### Phase 3: User Booking Flow
- [ ] Display policy on booking confirmation
- [ ] Build cancellation flow with fee preview
- [ ] Handle payment authorization

### Phase 4: Stripe Integration
- [ ] Implement authorize-then-capture flow
- [ ] Handle partial captures for fees
- [ ] Implement refunds and waivers

### Phase 5: Notifications
- [ ] Email templates
- [ ] Push notification triggers

---

## Files to Create/Update

| File | Action | Purpose |
|------|--------|---------|
| `models/Provider.js` | Update | Add cancellationPolicy field |
| `models/Booking.js` | Update | Add payment & cancellation fields |
| `utils/cancellation.js` | Create | Fee calculation logic |
| `routes/bookings.js` | Update | Cancellation endpoints |
| `services/stripeService.js` | Create | Stripe payment handling |
| Provider onboarding | Update | Policy selection UI |
| Provider dashboard | Update | Waive fee UI |
| Mobile app | Update | User cancellation flow |

---

## Questions Resolved

| Question | Decision |
|----------|----------|
| Policy tiers | Standard + Moderate only |
| Default policy | Standard |
| No-show grace period | Provider decides (not enforced by platform) |
| Fee waiver | Yes, provider can waive from dashboard |
| Provider cancellation | Always full refund |
