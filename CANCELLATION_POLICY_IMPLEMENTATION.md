# Carrotly Cancellation & Payment Policy
## Complete Implementation Guide

**Document Version:** 1.0  
**Last Updated:** December 9, 2025  
**Status:** Ready for Implementation  

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Policy Overview](#policy-overview)
3. [Technical Architecture](#technical-architecture)
4. [Stripe Integration](#stripe-integration)
5. [Database Schema](#database-schema)
6. [Backend API Endpoints](#backend-api-endpoints)
7. [Cron Jobs & Automation](#cron-jobs--automation)
8. [User App UI/UX Changes](#user-app-uiux-changes)
9. [Provider Platform UI/UX Changes](#provider-platform-uiux-changes)
10. [Testing Checklist](#testing-checklist)

---

## 📊 Executive Summary

### Policy at a Glance

| Timeline | Action | Fee | Purpose |
|----------|--------|-----|---------|
| **At Booking** | Save payment method | $0 | Reduce friction, build trust |
| **7 Days Before** | Authorize card (hold) | $0 | Ensure valid payment |
| **72+ Hours Before** | Free cancellation | $0 | Fair notice for provider |
| **24-72 Hours** | Late cancellation | 50% | Compensate lost rebooking time |
| **<24 Hours** | Very late cancel | 75% | Slot cannot be filled |
| **No-Show** | Patient doesn't attend | 100% | Full provider compensation |
| **After Service** | Auto-capture payment | 100% + adjustments | Standard billing |
| **24hrs Post-Service** | Provider payout initiated | - | Industry standard timing |

### Key Benefits

**For Patients:**
- ✅ No upfront charges
- ✅ 72-hour free cancellation
- ✅ First-time forgiveness
- ✅ Credit instead of fee option
- ✅ Emergency waiver process

**For Providers:**
- ✅ Protected revenue
- ✅ Easy payment adjustments
- ✅ Automated processing
- ✅ Fast payouts (2-5 days)
- ✅ Minimal manual work

---

## 🎯 Policy Overview

### Timeline Visualization

```
BOOKING (Week 1)
    ↓
    Save Card → No Charge
    
7 DAYS BEFORE
    ↓
    Authorize Card → Hold $150
    
72 HOURS BEFORE (Free Cancellation Deadline)
    ↓
    ├─ Cancel → $0 fee ✅
    │
24 HOURS BEFORE (Late Cancel Deadline)  
    ↓
    ├─ Cancel → $75 fee (50%) ⚠️
    │
APPOINTMENT TIME
    ↓
    ├─ No-Show → $150 fee (100%) ❌
    ├─ Attended → Service Rendered ✅
    │
24 HOURS AFTER
    ↓
    Auto-Capture Payment → $150 + adjustments
    
2-5 DAYS LATER
    ↓
    Provider Receives Payout 💰
```

---

## 🏗️ Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────┐
│                  USER APP                           │
│  - Booking flow with policy display                 │
│  - Cancellation interface                           │
│  - Payment method management                        │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│              BACKEND API                            │
│  - Appointment CRUD                                 │
│  - Payment processing                               │
│  - Cancellation logic                               │
└─────────────────┬───────────────────────────────────┘
                  │
        ┌─────────┴─────────┬─────────────┐
        │                   │             │
┌───────▼────────┐ ┌───────▼────────┐ ┌──▼──────┐
│  STRIPE API    │ │   MONGODB      │ │  CRON   │
│  - Setup       │ │  - Appointments│ │ JOBS    │
│  - Payment     │ │  - Payments    │ │         │
│  - Intents     │ │  - Waivers     │ │         │
└────────────────┘ └────────────────┘ └─────────┘
```

---

## 💳 Stripe Integration

### Setup & Configuration

#### 1. Install Stripe SDK

```bash
npm install stripe
```

#### 2. Initialize Stripe

```javascript
// backend/config/stripe.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = stripe;
```

#### 3. Environment Variables

```bash
# .env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLATFORM_FEE_PERCENT=15
```

---

### Core Stripe Functions

#### Save Payment Method (At Booking)

```javascript
// backend/services/paymentService.js
const stripe = require('../config/stripe');

/**
 * Save patient's payment method for future charges
 * @param {string} patientId - Patient's Stripe customer ID
 * @returns {Promise<Object>} Setup intent with client secret
 */
async function savePaymentMethod(patientId) {
  const setupIntent = await stripe.setupIntents.create({
    customer: patientId,
    payment_method_types: ['card'],
    usage: 'off_session', // Allow charging without patient present
    metadata: {
      type: 'appointment_booking'
    }
  });

  return {
    clientSecret: setupIntent.client_secret,
    setupIntentId: setupIntent.id
  };
}

/**
 * Confirm payment method was saved
 * @param {string} setupIntentId - Setup intent ID
 * @returns {Promise<string>} Payment method ID
 */
async function confirmPaymentMethod(setupIntentId) {
  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
  
  if (setupIntent.status !== 'succeeded') {
    throw new Error('Payment method setup failed');
  }
  
  return setupIntent.payment_method;
}

module.exports = {
  savePaymentMethod,
  confirmPaymentMethod
};
```

---

#### Authorize Payment (7 Days Before)

```javascript
/**
 * Authorize card 7 days before appointment
 * @param {Object} appointment - Appointment document
 * @returns {Promise<Object>} Payment intent
 */
async function authorizePayment(appointment) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: appointment.amount, // Amount in cents
      currency: 'usd',
      customer: appointment.customerId,
      payment_method: appointment.paymentMethodId,
      capture_method: 'manual', // KEY: Don't capture yet
      off_session: true, // Charge without patient present
      confirm: true, // Confirm immediately
      metadata: {
        appointmentId: appointment._id.toString(),
        providerId: appointment.providerId.toString(),
        patientId: appointment.patientId.toString(),
        scheduledFor: appointment.scheduledFor.toISOString(),
        serviceName: appointment.serviceName
      },
      description: `Appointment: ${appointment.serviceName} on ${appointment.scheduledFor.toLocaleDateString()}`
    });

    // Update appointment with payment intent ID
    appointment.paymentIntentId = paymentIntent.id;
    appointment.paymentStatus = 'authorized';
    appointment.authorizedAt = new Date();
    await appointment.save();

    return paymentIntent;
    
  } catch (error) {
    // Handle authorization failures
    appointment.paymentStatus = 'authorization_failed';
    appointment.authorizationError = error.message;
    await appointment.save();
    
    // Notify patient to update card
    await sendAuthFailureNotification(appointment);
    
    throw error;
  }
}
```

---

#### Cancel Authorization (Free Cancellation)

```javascript
/**
 * Release authorization without charging
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Promise<Object>} Cancelled payment intent
 */
async function cancelAuthorization(paymentIntentId) {
  const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
  return paymentIntent;
}
```

---

#### Capture Payment (After Service or Cancellation Fee)

```javascript
/**
 * Capture payment (charge the card)
 * @param {string} paymentIntentId - Payment intent ID
 * @param {number} amount - Amount to capture (optional, for adjustments)
 * @returns {Promise<Object>} Captured payment intent
 */
async function capturePayment(paymentIntentId, amount = null) {
  const captureData = {};
  
  if (amount) {
    // Verify amount doesn't exceed 15% increase
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const originalAmount = paymentIntent.amount;
    const maxAmount = originalAmount * 1.15;
    
    if (amount > maxAmount) {
      throw new Error(`Adjustment exceeds 15% limit. Max: $${maxAmount/100}`);
    }
    
    // Update amount before capture
    await stripe.paymentIntents.update(paymentIntentId, {
      amount: amount
    });
  }
  
  // Capture the payment
  const captured = await stripe.paymentIntents.capture(paymentIntentId);
  
  return captured;
}
```

---

#### Update Payment Amount (Provider Adjustments)

```javascript
/**
 * Update payment amount before capture (for service adjustments)
 * @param {string} paymentIntentId - Payment intent ID
 * @param {number} newAmount - New amount in cents
 * @param {Object} metadata - Adjustment details
 * @returns {Promise<Object>} Updated payment intent
 */
async function updatePaymentAmount(paymentIntentId, newAmount, metadata = {}) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
  // Verify not already captured
  if (paymentIntent.status === 'succeeded') {
    throw new Error('Cannot update captured payment');
  }
  
  const originalAmount = paymentIntent.amount;
  const increasePercent = (newAmount - originalAmount) / originalAmount;
  
  // Verify 15% limit
  if (increasePercent > 0.15) {
    throw new Error('Adjustment exceeds 15% limit');
  }
  
  const updated = await stripe.paymentIntents.update(paymentIntentId, {
    amount: newAmount,
    metadata: {
      ...paymentIntent.metadata,
      adjustmentReason: metadata.reason || 'Additional services',
      originalAmount: originalAmount,
      adjustedAmount: newAmount,
      adjustedAt: new Date().toISOString(),
      adjustments: JSON.stringify(metadata.adjustments || [])
    }
  });
  
  return updated;
}

module.exports = {
  savePaymentMethod,
  confirmPaymentMethod,
  authorizePayment,
  cancelAuthorization,
  capturePayment,
  updatePaymentAmount
};
```

---

### Webhook Handler

```javascript
// backend/routes/webhooks.js
const express = require('express');
const router = express.Router();
const stripe = require('../config/stripe');
const Appointment = require('../models/Appointment');

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
      
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
      
    case 'payment_intent.canceled':
      await handlePaymentCanceled(event.data.object);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  
  res.json({ received: true });
});

async function handlePaymentSucceeded(paymentIntent) {
  const appointment = await Appointment.findOne({
    paymentIntentId: paymentIntent.id
  });
  
  if (appointment) {
    appointment.paymentStatus = 'succeeded';
    appointment.paidAt = new Date();
    await appointment.save();
    
    // Send receipt to patient
    await sendReceipt(appointment);
  }
}

async function handlePaymentFailed(paymentIntent) {
  const appointment = await Appointment.findOne({
    paymentIntentId: paymentIntent.id
  });
  
  if (appointment) {
    appointment.paymentStatus = 'failed';
    appointment.paymentError = paymentIntent.last_payment_error?.message;
    await appointment.save();
    
    // Notify patient
    await sendPaymentFailureNotification(appointment);
  }
}

async function handlePaymentCanceled(paymentIntent) {
  const appointment = await Appointment.findOne({
    paymentIntentId: paymentIntent.id
  });
  
  if (appointment) {
    appointment.paymentStatus = 'authorization_cancelled';
    await appointment.save();
  }
}

module.exports = router;
```

---

## 🗄️ Database Schema

### Appointment Model

```javascript
// backend/models/Appointment.js
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // Basic Info
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
    index: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  serviceName: {
    type: String,
    required: true
  },
  scheduledFor: {
    type: Date,
    required: true,
    index: true
  },
  duration: {
    type: Number,
    required: true // in minutes
  },
  
  // Status
  status: {
    type: String,
    enum: [
      'scheduled',
      'cancelled',
      'cancelled_late',
      'cancelled_very_late',
      'no_show',
      'no_show_pending',
      'completed',
      'disputed'
    ],
    default: 'scheduled',
    index: true
  },
  
  // Payment Info
  customerId: {
    type: String, // Stripe customer ID
    required: true
  },
  paymentMethodId: {
    type: String, // Stripe payment method ID
    required: true
  },
  setupIntentId: {
    type: String // Stripe setup intent ID
  },
  paymentIntentId: {
    type: String, // Stripe payment intent ID
    index: true
  },
  paymentStatus: {
    type: String,
    enum: [
      'card_saved',
      'authorized',
      'authorization_failed',
      'captured',
      'succeeded',
      'failed',
      'authorization_cancelled',
      'late_cancellation_fee_charged',
      'no_show_fee_charged'
    ],
    default: 'card_saved',
    index: true
  },
  
  // Amounts (in cents)
  amount: {
    type: Number,
    required: true
  },
  adjustedAmount: {
    type: Number
  },
  finalAmount: {
    type: Number
  },
  cancellationFee: {
    type: Number,
    default: 0
  },
  
  // Adjustments
  adjustments: [{
    name: String,
    price: Number, // in cents
    addedBy: mongoose.Schema.Types.ObjectId,
    addedAt: Date
  }],
  adjustmentReason: String,
  
  // Cancellation Policy
  cancellationPolicy: {
    freeCancellationUntil: Date,
    lateCancellationFee: Number, // 50%
    veryLateCancellationFee: Number, // 75%
    noShowFee: Number // 100%
  },
  
  // Cancellation Info
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'cancelledByModel'
  },
  cancelledByModel: {
    type: String,
    enum: ['Patient', 'Provider', 'Admin']
  },
  cancellationReason: String,
  feeWaivedReason: String,
  
  // Waiver Request
  waiverRequested: {
    type: Boolean,
    default: false
  },
  waiverRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WaiverRequest'
  },
  
  // No-Show Handling
  noShowGracePeriodUntil: Date,
  
  // Timestamps
  authorizedAt: Date,
  capturedAt: Date,
  paidAt: Date,
  
  // Errors
  authorizationError: String,
  captureError: String,
  paymentError: String
  
}, {
  timestamps: true
});

// Indexes
appointmentSchema.index({ scheduledFor: 1, paymentStatus: 1 });
appointmentSchema.index({ status: 1, scheduledFor: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
```

---

### Waiver Request Model

```javascript
// backend/models/WaiverRequest.js
const mongoose = require('mongoose');

const waiverRequestSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  reason: {
    type: String,
    enum: [
      'medical_emergency',
      'family_emergency',
      'car_accident',
      'work_obligation',
      'weather',
      'transportation',
      'other'
    ],
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  documentation: {
    type: String // URL to uploaded document
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  reviewedAt: Date,
  reviewNotes: String,
  requestedAt: {
    type: Date,
    default: Date.now
  },
  reviewBy: Date // Deadline for review
}, {
  timestamps: true
});

module.exports = mongoose.model('WaiverRequest', waiverRequestSchema);
```

---

### Account Credit Model

```javascript
// backend/models/AccountCredit.js
const mongoose = require('mongoose');

const accountCreditSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true // in cents
  },
  originalAmount: {
    type: Number,
    required: true
  },
  remainingAmount: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    enum: [
      'cancellation_fee_conversion',
      'refund',
      'compensation',
      'promotion'
    ],
    required: true
  },
  sourceAppointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  status: {
    type: String,
    enum: ['active', 'used', 'expired'],
    default: 'active'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  usedAt: Date,
  usedForAppointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AccountCredit', accountCreditSchema);
```

---

## 🔌 Backend API Endpoints

### POST /api/appointments/book

```javascript
// backend/routes/appointments.js
const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { savePaymentMethod } = require('../services/paymentService');
const { authenticatePatient } = require('../middleware/auth');

/**
 * Book a new appointment
 * Saves payment method, NO charge yet
 */
router.post('/book', authenticatePatient, async (req, res) => {
  try {
    const {
      providerId,
      serviceId,
      scheduledFor,
      paymentMethodId
    } = req.body;
    
    // Verify time slot is available
    const existingAppointment = await Appointment.findOne({
      providerId,
      scheduledFor,
      status: { $in: ['scheduled', 'completed'] }
    });
    
    if (existingAppointment) {
      return res.status(400).json({ error: 'Time slot not available' });
    }
    
    // Get service details
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Calculate cancellation deadlines
    const scheduledDate = new Date(scheduledFor);
    const freeCancellationUntil = new Date(scheduledDate.getTime() - 72 * 60 * 60 * 1000);
    
    // Create appointment
    const appointment = await Appointment.create({
      patientId: req.user._id,
      providerId,
      serviceId,
      serviceName: service.name,
      scheduledFor: scheduledDate,
      duration: service.duration,
      customerId: req.user.stripeCustomerId,
      paymentMethodId,
      amount: service.price,
      paymentStatus: 'card_saved',
      cancellationPolicy: {
        freeCancellationUntil,
        lateCancellationFee: Math.round(service.price * 0.5),
        veryLateCancellationFee: Math.round(service.price * 0.75),
        noShowFee: service.price
      }
    });
    
    // Send confirmation
    await sendBookingConfirmation(appointment);
    
    res.status(201).json({
      success: true,
      appointment: {
        id: appointment._id,
        scheduledFor: appointment.scheduledFor,
        amount: appointment.amount / 100,
        freeCancellationUntil: appointment.cancellationPolicy.freeCancellationUntil
      }
    });
    
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

### POST /api/appointments/:id/cancel

```javascript
/**
 * Cancel an appointment
 * Applies appropriate cancellation fee based on timing
 */
router.post('/:id/cancel', authenticatePatient, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Verify patient owns appointment
    if (appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Verify appointment can be cancelled
    if (!['scheduled', 'authorized'].includes(appointment.paymentStatus)) {
      return res.status(400).json({ error: 'Cannot cancel this appointment' });
    }
    
    const now = new Date();
    const scheduledFor = new Date(appointment.scheduledFor);
    const hoursUntilAppt = (scheduledFor - now) / (1000 * 60 * 60);
    
    let cancellationFee = 0;
    let status = 'cancelled';
    
    // Determine fee based on timing
    if (hoursUntilAppt >= 72) {
      // FREE CANCELLATION
      cancellationFee = 0;
      status = 'cancelled';
      
      // Release authorization
      if (appointment.paymentIntentId) {
        await cancelAuthorization(appointment.paymentIntentId);
        appointment.paymentStatus = 'authorization_cancelled';
      }
      
    } else if (hoursUntilAppt >= 24) {
      // LATE CANCELLATION - 50%
      cancellationFee = appointment.cancellationPolicy.lateCancellationFee;
      status = 'cancelled_late';
      
      // Check for first-time forgiveness
      const priorCancellations = await Appointment.countDocuments({
        patientId: appointment.patientId,
        status: { $in: ['cancelled_late', 'cancelled_very_late', 'no_show'] },
        _id: { $ne: appointment._id }
      });
      
      if (priorCancellations === 0) {
        // WAIVE FEE - first offense
        cancellationFee = 0;
        appointment.feeWaivedReason = 'first_time_cancellation_forgiveness';
      } else {
        // Apply fee
        await updatePaymentAmount(appointment.paymentIntentId, cancellationFee, {
          reason: 'Late cancellation fee',
          adjustments: []
        });
        await capturePayment(appointment.paymentIntentId);
        appointment.paymentStatus = 'late_cancellation_fee_charged';
      }
      
    } else if (hoursUntilAppt > 0) {
      // VERY LATE CANCELLATION - 75%
      cancellationFee = appointment.cancellationPolicy.veryLateCancellationFee;
      status = 'cancelled_very_late';
      
      // Offer credit option
      const creditOption = {
        available: true,
        amount: cancellationFee / 100,
        expiresIn: 90 // days
      };
      
      // For now, charge the fee (patient can request credit conversion)
      await updatePaymentAmount(appointment.paymentIntentId, cancellationFee, {
        reason: 'Very late cancellation fee',
        adjustments: []
      });
      await capturePayment(appointment.paymentIntentId);
      appointment.paymentStatus = 'late_cancellation_fee_charged';
      
      res.json({
        success: true,
        fee: cancellationFee / 100,
        creditOption
      });
      return;
      
    } else {
      // Past appointment time
      return res.status(400).json({ error: 'Cannot cancel past appointment' });
    }
    
    // Update appointment
    appointment.status = status;
    appointment.cancelledAt = now;
    appointment.cancelledBy = req.user._id;
    appointment.cancelledByModel = 'Patient';
    appointment.cancellationReason = req.body.reason || 'Patient cancelled';
    appointment.cancellationFee = cancellationFee;
    
    await appointment.save();
    
    // Notify provider
    await notifyProviderOfCancellation(appointment);
    
    res.json({
      success: true,
      fee: cancellationFee / 100,
      message: cancellationFee === 0 
        ? 'Appointment cancelled at no charge'
        : `Cancellation fee of $${cancellationFee/100} has been charged`
    });
    
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

### POST /api/appointments/:id/adjust

```javascript
/**
 * Adjust appointment charges (Provider only)
 * Add additional services rendered
 */
router.post('/:id/adjust', authenticateProvider, async (req, res) => {
  try {
    const { adjustments, reason } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Verify provider owns appointment
    if (appointment.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Verify appointment hasn't been captured yet
    if (appointment.paymentStatus === 'captured' || appointment.paymentStatus === 'succeeded') {
      return res.status(400).json({ error: 'Payment already processed' });
    }
    
    // Calculate new total
    const originalAmount = appointment.amount;
    const additionalAmount = adjustments.reduce((sum, adj) => sum + adj.price, 0);
    const newTotal = originalAmount + additionalAmount;
    
    // Verify 15% limit
    const increasePercent = (newTotal - originalAmount) / originalAmount;
    if (increasePercent > 0.15) {
      return res.status(400).json({ 
        error: 'Adjustment exceeds 15% limit',
        maxAmount: Math.round(originalAmount * 1.15) / 100,
        requestedAmount: newTotal / 100
      });
    }
    
    // Update payment intent
    await updatePaymentAmount(appointment.paymentIntentId, newTotal, {
      reason: reason,
      adjustments: adjustments
    });
    
    // Save adjustments to appointment
    appointment.adjustments = adjustments.map(adj => ({
      name: adj.name,
      price: adj.price,
      addedBy: req.user._id,
      addedAt: new Date()
    }));
    appointment.adjustedAmount = newTotal;
    appointment.adjustmentReason = reason;
    
    await appointment.save();
    
    // Notify patient of adjustment
    await notifyPatientOfAdjustment(appointment);
    
    res.json({
      success: true,
      originalAmount: originalAmount / 100,
      newAmount: newTotal / 100,
      adjustments: adjustments
    });
    
  } catch (error) {
    console.error('Adjustment error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

### POST /api/appointments/:id/request-waiver

```javascript
/**
 * Request cancellation fee waiver
 * Patient can request fee forgiveness for emergencies
 */
router.post('/:id/request-waiver', authenticatePatient, async (req, res) => {
  try {
    const { reason, description, documentationUrl } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Verify patient owns appointment
    if (appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Verify appointment has a fee
    if (appointment.cancellationFee === 0) {
      return res.status(400).json({ error: 'No fee to waive' });
    }
    
    // Create waiver request
    const waiver = await WaiverRequest.create({
      appointmentId: appointment._id,
      patientId: req.user._id,
      reason,
      description,
      documentation: documentationUrl,
      reviewBy: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
    });
    
    // Update appointment
    appointment.waiverRequested = true;
    appointment.waiverRequestId = waiver._id;
    await appointment.save();
    
    // Notify admin for review
    await notifyAdminOfWaiverRequest(waiver);
    
    res.json({
      success: true,
      waiverId: waiver._id,
      message: 'Waiver request submitted. You will receive a response within 48 hours.'
    });
    
  } catch (error) {
    console.error('Waiver request error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

## ⏰ Cron Jobs & Automation

### 1. Authorize Upcoming Appointments (Daily at 3 AM)

```javascript
// backend/jobs/authorizeAppointments.js
const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const { authorizePayment } = require('../services/paymentService');

/**
 * Authorize cards 7 days before appointments
 * Runs daily at 3:00 AM
 */
cron.schedule('0 3 * * *', async () => {
  console.log('Running authorization job...');
  
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  
  const eightDaysFromNow = new Date();
  eightDaysFromNow.setDate(eightDaysFromNow.getDate() + 8);
  
  // Find appointments scheduled 7 days from now
  const appointments = await Appointment.find({
    scheduledFor: {
      $gte: sevenDaysFromNow,
      $lt: eightDaysFromNow
    },
    paymentStatus: 'card_saved',
    status: 'scheduled'
  }).populate('patientId', 'email phone firstName lastName');
  
  console.log(`Found ${appointments.length} appointments to authorize`);
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const appointment of appointments) {
    try {
      await authorizePayment(appointment);
      
      // Notify patient
      await sendNotification(appointment.patientId, {
        type: 'payment_authorized',
        subject: 'Payment Authorized for Upcoming Appointment',
        message: `Your card has been authorized for $${appointment.amount/100} for your appointment on ${appointment.scheduledFor.toLocaleDateString()}.`,
        appointmentId: appointment._id
      });
      
      successCount++;
      console.log(`✅ Authorized appointment ${appointment._id}`);
      
    } catch (error) {
      failureCount++;
      console.error(`❌ Failed to authorize ${appointment._id}:`, error.message);
      
      // Notify patient of failure
      await sendNotification(appointment.patientId, {
        type: 'payment_authorization_failed',
        subject: 'Action Required: Update Payment Method',
        message: `We couldn't authorize your card for your upcoming appointment on ${appointment.scheduledFor.toLocaleDateString()}. Please update your payment method.`,
        appointmentId: appointment._id,
        action: 'update_payment_method'
      });
    }
  }
  
  console.log(`Authorization job complete: ${successCount} success, ${failureCount} failures`);
});
```

---

### 2. Capture Completed Appointments (Hourly)

```javascript
// backend/jobs/capturePayments.js
const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const { capturePayment } = require('../services/paymentService');

/**
 * Capture payments 24 hours after appointment time
 * Runs every hour
 */
cron.schedule('0 * * * *', async () => {
  console.log('Running payment capture job...');
  
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Find appointments that should be captured
  const appointments = await Appointment.find({
    scheduledFor: { $lt: twentyFourHoursAgo },
    paymentStatus: 'authorized',
    status: { $nin: ['cancelled', 'cancelled_late', 'cancelled_very_late', 'no_show', 'disputed'] }
  }).populate('patientId providerId', 'email firstName lastName');
  
  console.log(`Found ${appointments.length} appointments to capture`);
  
  for (const appointment of appointments) {
    try {
      // Check for adjustments
      const finalAmount = appointment.adjustedAmount || appointment.amount;
      
      // Capture payment
      const captured = await capturePayment(appointment.paymentIntentId, finalAmount);
      
      // Update appointment
      appointment.paymentStatus = 'captured';
      appointment.capturedAt = new Date();
      appointment.finalAmount = finalAmount;
      await appointment.save();
      
      // Send receipt to patient
      await sendReceipt(appointment.patientId, {
        appointmentId: appointment._id,
        amount: finalAmount / 100,
        receiptUrl: captured.charges.data[0].receipt_url
      });
      
      // Notify provider
      await notifyProvider(appointment.providerId, {
        type: 'payment_captured',
        message: `Payment of $${finalAmount/100} captured for appointment on ${appointment.scheduledFor.toLocaleDateString()}`,
        appointmentId: appointment._id,
        expectedPayout: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      });
      
      console.log(`✅ Captured payment for ${appointment._id}: $${finalAmount/100}`);
      
    } catch (error) {
      console.error(`❌ Capture failed for ${appointment._id}:`, error.message);
      
      appointment.paymentStatus = 'capture_failed';
      appointment.captureError = error.message;
      await appointment.save();
      
      // Alert admin
      await alertAdmin({
        type: 'capture_failed',
        appointmentId: appointment._id,
        error: error.message
      });
    }
  }
  
  console.log('Payment capture job complete');
});
```

---

### 3. Process No-Shows (Every 15 Minutes)

```javascript
// backend/jobs/processNoShows.js
const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const { capturePayment } = require('../services/paymentService');

/**
 * Mark appointments as no-shows 15 minutes after scheduled time
 * Give patient 2 hours to dispute
 * Runs every 15 minutes
 */
cron.schedule('*/15 * * * *', async () => {
  console.log('Running no-show detection job...');
  
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  
  // Find potential no-shows
  const potentialNoShows = await Appointment.find({
    scheduledFor: { $lt: fifteenMinutesAgo },
    status: 'scheduled',
    paymentStatus: 'authorized'
  });
  
  for (const appointment of potentialNoShows) {
    // Mark as pending no-show
    appointment.status = 'no_show_pending';
    appointment.noShowGracePeriodUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
    await appointment.save();
    
    // Notify patient - give chance to dispute
    await sendNotification(appointment.patientId, {
      type: 'no_show_confirmation',
      subject: 'Did you attend your appointment?',
      message: `We noticed you may have missed your appointment today. If you attended, please let us know within 2 hours to avoid a no-show fee.`,
      appointmentId: appointment._id,
      actions: [
        { label: 'I attended', action: 'confirm_attendance' },
        { label: 'I had an emergency', action: 'explain_absence' }
      ]
    });
  }
  
  console.log(`Marked ${potentialNoShows.length} appointments as pending no-show`);
  
  // Process confirmed no-shows (grace period expired)
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  
  const confirmedNoShows = await Appointment.find({
    status: 'no_show_pending',
    noShowGracePeriodUntil: { $lt: new Date() }
  }).populate('patientId', 'email firstName lastName');
  
  for (const appointment of confirmedNoShows) {
    try {
      // Charge full amount
      await capturePayment(appointment.paymentIntentId);
      
      appointment.status = 'no_show';
      appointment.paymentStatus = 'no_show_fee_charged';
      appointment.cancellationFee = appointment.amount;
      appointment.finalAmount = appointment.amount;
      await appointment.save();
      
      // Record on patient account
      await recordNoShow(appointment.patientId, appointment._id);
      
      // Send notification
      await sendNotification(appointment.patientId, {
        type: 'no_show_fee_charged',
        subject: 'No-Show Fee Charged',
        message: `You missed your appointment on ${appointment.scheduledFor.toLocaleDateString()}. A no-show fee of $${appointment.amount/100} has been charged per our cancellation policy.`,
        appointmentId: appointment._id
      });
      
      console.log(`✅ Processed no-show for ${appointment._id}`);
      
    } catch (error) {
      console.error(`❌ No-show processing failed for ${appointment._id}:`, error.message);
    }
  }
  
  console.log(`Processed ${confirmedNoShows.length} confirmed no-shows`);
});
```

---

### 4. Setup Cron Jobs in Server

```javascript
// backend/server.js
const express = require('express');
const app = express();

// Import cron jobs
require('./jobs/authorizeAppointments');
require('./jobs/capturePayments');
require('./jobs/processNoShows');

// ... rest of server setup

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Cron jobs initialized');
});
```

---

## 📱 User App UI/UX Changes

### 1. Booking Flow - Policy Display

**Location:** Booking confirmation page

```jsx
// user-app/src/components/BookingConfirmation.jsx
import React from 'react';

function CancellationPolicyDisplay({ appointment }) {
  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-blue-900">
            Cancellation Policy
          </h3>
          <div className="mt-2 text-sm text-blue-800 space-y-2">
            <div className="flex items-center">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              <span>
                <strong>Free cancellation</strong> until {formatDate(appointment.cancellationPolicy.freeCancellationUntil)}
              </span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
              <span>
                <strong>50% fee</strong> for cancellations 24-72 hours before
              </span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
              <span>
                <strong>75% fee</strong> for cancellations within 24 hours
              </span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              <span>
                <strong>100% fee</strong> for no-shows
              </span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-xs text-blue-700">
              💳 Your card will be authorized 7 days before your appointment.
              You'll only be charged after service is rendered.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CancellationPolicyDisplay;
```

---

### 2. Payment Method Setup

**Location:** During booking flow

```jsx
// user-app/src/components/PaymentMethodSetup.jsx
import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

function PaymentMethodSetup({ onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      // Get setup intent client secret from backend
      const response = await fetch('/api/payments/setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      const { clientSecret } = await response.json();
      
      // Confirm card setup
      const { setupIntent, error } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)
          }
        }
      );
      
      if (error) {
        setError(error.message);
      } else {
        // Success! Pass payment method ID to parent
        onSuccess(setupIntent.payment_method);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Credit or Debit Card
        </label>
        <div className="border border-gray-300 rounded-lg p-3">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#1f2937',
                  '::placeholder': {
                    color: '#9ca3af'
                  }
                }
              }
            }}
          />
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-gray-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div className="ml-2">
            <p className="text-xs text-gray-600">
              Your card will be saved securely and authorized 7 days before your appointment.
              <strong> You will not be charged yet.</strong>
            </p>
          </div>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? 'Processing...' : 'Save Card & Book Appointment'}
      </button>
    </form>
  );
}

export default PaymentMethodSetup;
```

---

### 3. Cancellation Modal

**Location:** Appointment detail page

```jsx
// user-app/src/components/CancellationModal.jsx
import React, { useState } from 'react';

function CancellationModal({ appointment, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  
  const calculateFee = () => {
    const now = new Date();
    const scheduledFor = new Date(appointment.scheduledFor);
    const hoursUntil = (scheduledFor - now) / (1000 * 60 * 60);
    
    if (hoursUntil >= 72) {
      return { amount: 0, percentage: 0, type: 'free' };
    } else if (hoursUntil >= 24) {
      return { 
        amount: appointment.amount * 0.5, 
        percentage: 50, 
        type: 'late' 
      };
    } else if (hoursUntil > 0) {
      return { 
        amount: appointment.amount * 0.75, 
        percentage: 75, 
        type: 'very_late' 
      };
    }
    return { amount: appointment.amount, percentage: 100, type: 'too_late' };
  };
  
  const fee = calculateFee();
  
  const handleCancel = async () => {
    setLoading(true);
    try {
      await onConfirm(reason);
    } finally {
      setLoading(false);
    }
  };
  
  if (fee.type === 'too_late') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Cannot Cancel
          </h3>
          <p className="text-gray-700 mb-6">
            Your appointment time has passed. Please contact the provider directly if you have questions.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Cancel Appointment
        </h3>
        
        {/* Fee Display */}
        <div className={`border-2 rounded-lg p-4 mb-4 ${
          fee.type === 'free' ? 'border-green-200 bg-green-50' :
          fee.type === 'late' ? 'border-yellow-200 bg-yellow-50' :
          'border-orange-200 bg-orange-50'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {fee.type === 'free' ? (
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h4 className={`font-semibold ${
                fee.type === 'free' ? 'text-green-900' :
                fee.type === 'late' ? 'text-yellow-900' :
                'text-orange-900'
              }`}>
                {fee.type === 'free' ? 'Free Cancellation' :
                 fee.type === 'late' ? 'Late Cancellation Fee' :
                 'Very Late Cancellation Fee'}
              </h4>
              <p className={`text-sm mt-1 ${
                fee.type === 'free' ? 'text-green-800' :
                fee.type === 'late' ? 'text-yellow-800' :
                'text-orange-800'
              }`}>
                {fee.type === 'free' ? (
                  'No charge - you\'re cancelling with enough notice'
                ) : (
                  <>
                    A <strong>${(fee.amount / 100).toFixed(2)}</strong> cancellation fee 
                    ({fee.percentage}% of ${(appointment.amount / 100).toFixed(2)}) will be charged to your card.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
        
        {/* Reason */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for cancellation (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            placeholder="Let us know why you're cancelling..."
          />
        </div>
        
        {/* Emergency Waiver Link */}
        {fee.type !== 'free' && (
          <div className="mb-4 text-center">
            <button
              onClick={() => {/* Open waiver request modal */}}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Had an emergency? Request fee waiver
            </button>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            Keep Appointment
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
          >
            {loading ? 'Cancelling...' : 'Cancel Appointment'}
          </button>
        </div>
        
        {fee.type === 'free' && (
          <p className="text-xs text-gray-500 mt-3 text-center">
            Your slot will be released for other patients
          </p>
        )}
      </div>
    </div>
  );
}

export default CancellationModal;
```

---

### 4. Credit Option Modal

**Location:** After very late cancellation

```jsx
// user-app/src/components/CreditOptionModal.jsx
import React, { useState } from 'react';

function CreditOptionModal({ fee, onChoice }) {
  const [loading, setLoading] = useState(false);
  
  const handleChoice = async (convertToCredit) => {
    setLoading(true);
    await onChoice(convertToCredit);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-4">
            <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Choose Your Option
          </h3>
          <p className="text-gray-600">
            Your cancellation fee is <strong>${(fee / 100).toFixed(2)}</strong>
          </p>
        </div>
        
        {/* Option 1: Pay Fee */}
        <div className="border-2 border-gray-200 rounded-lg p-4 mb-3 hover:border-gray-300 cursor-pointer"
             onClick={() => handleChoice(false)}>
          <div className="flex items-start">
            <input
              type="radio"
              name="payment-option"
              className="mt-1"
              defaultChecked
            />
            <div className="ml-3 flex-1">
              <h4 className="font-semibold text-gray-900">
                Pay Cancellation Fee
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                ${(fee / 100).toFixed(2)} will be charged to your card ending in {/* card last 4 */}
              </p>
            </div>
          </div>
        </div>
        
        {/* Option 2: Convert to Credit */}
        <div className="border-2 border-teal-500 bg-teal-50 rounded-lg p-4 mb-6 hover:border-teal-600 cursor-pointer"
             onClick={() => handleChoice(true)}>
          <div className="flex items-start">
            <input
              type="radio"
              name="payment-option"
              className="mt-1"
            />
            <div className="ml-3 flex-1">
              <div className="flex items-center">
                <h4 className="font-semibold text-gray-900">
                  Convert to Account Credit
                </h4>
                <span className="ml-2 bg-teal-600 text-white text-xs px-2 py-1 rounded">
                  Recommended
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-1">
                Receive <strong>${(fee / 100).toFixed(2)} credit</strong> to use toward any future appointment within 90 days
              </p>
              <ul className="text-xs text-gray-600 mt-2 space-y-1">
                <li>✓ Use with any provider</li>
                <li>✓ Valid for 90 days</li>
                <li>✓ Applies automatically at checkout</li>
              </ul>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => handleChoice(false)}
          disabled={loading}
          className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Confirm Choice'}
        </button>
      </div>
    </div>
  );
}

export default CreditOptionModal;
```

---

## 🏥 Provider Platform UI/UX Changes

### 1. Appointment List - Payment Status Indicators

**Location:** Provider dashboard appointment list

```jsx
// provider-platform/src/components/AppointmentList.jsx
import React from 'react';

function PaymentStatusBadge({ status }) {
  const configs = {
    'card_saved': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Card Saved' },
    'authorized': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Authorized' },
    'captured': { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
    'authorization_cancelled': { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Cancelled' }
  };
  
  const config = configs[status] || configs['card_saved'];
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

function AppointmentListItem({ appointment }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">
              {appointment.patientName}
            </h3>
            <PaymentStatusBadge status={appointment.paymentStatus} />
          </div>
          
          <p className="text-sm text-gray-600">
            {appointment.serviceName} • {appointment.duration} min
          </p>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>📅 {new Date(appointment.scheduledFor).toLocaleString()}</span>
            <span>💰 ${(appointment.amount / 100).toFixed(2)}</span>
            {appointment.adjustedAmount && (
              <span className="text-teal-600 font-medium">
                → ${(appointment.adjustedAmount / 100).toFixed(2)}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          {appointment.paymentStatus === 'authorized' && (
            <button className="px-3 py-1 text-sm bg-teal-600 text-white rounded hover:bg-teal-700">
              Adjust Charges
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppointmentListItem;
```

---

### 2. Service Adjustment Form

**Location:** Appointment detail page in provider dashboard

```jsx
// provider-platform/src/components/ServiceAdjustmentForm.jsx
import React, { useState } from 'react';

function ServiceAdjustmentForm({ appointment, onSave, onCancel }) {
  const [adjustments, setAdjustments] = useState([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  
  const originalAmount = appointment.amount / 100;
  const adjustedTotal = originalAmount + adjustments.reduce((sum, adj) => sum + adj.price, 0);
  const maxAllowed = originalAmount * 1.15;
  const withinLimit = adjustedTotal <= maxAllowed;
  
  const quickServices = [
    { name: 'Strep Test', price: 25 },
    { name: 'Flu Test', price: 30 },
    { name: 'Rapid COVID Test', price: 35 },
    { name: 'Basic Lab Work', price: 50 },
    { name: 'Urinalysis', price: 40 },
    { name: 'Blood Pressure Monitoring', price: 15 },
    { name: 'EKG', price: 100 },
    { name: 'X-Ray (single view)', price: 75 }
  ];
  
  const addQuickService = (service) => {
    if (adjustedTotal + service.price > maxAllowed) {
      alert(`Adding this service would exceed the 15% limit ($${maxAllowed.toFixed(2)})`);
      return;
    }
    setAdjustments([...adjustments, service]);
  };
  
  const removeAdjustment = (index) => {
    setAdjustments(adjustments.filter((_, i) => i !== index));
  };
  
  const handleSave = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for the adjustment');
      return;
    }
    
    setLoading(true);
    try {
      await onSave({
        adjustments: adjustments.map(adj => ({
          name: adj.name,
          price: adj.price * 100 // Convert to cents
        })),
        reason
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">Adjust Service Charges</h2>
      
      {/* Original Service */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-semibold text-gray-900">{appointment.serviceName}</p>
            <p className="text-sm text-gray-600">
              {new Date(appointment.scheduledFor).toLocaleDateString()} at{' '}
              {new Date(appointment.scheduledFor).toLocaleTimeString()}
            </p>
          </div>
          <p className="text-xl font-bold text-gray-900">${originalAmount.toFixed(2)}</p>
        </div>
      </div>
      
      {/* Quick Add Services */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">
          Quick Add Common Services
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {quickServices.map((service) => {
            const wouldExceed = adjustedTotal + service.price > maxAllowed;
            return (
              <button
                key={service.name}
                onClick={() => addQuickService(service)}
                disabled={wouldExceed}
                className={`px-3 py-3 text-sm border-2 rounded-lg transition ${
                  wouldExceed
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 hover:border-teal-500 hover:bg-teal-50'
                }`}
              >
                <div className="font-medium">{service.name}</div>
                <div className="text-xs text-gray-600 mt-1">+${service.price}</div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Added Services List */}
      {adjustments.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            Additional Services Rendered
          </h3>
          <div className="space-y-2">
            {adjustments.map((adj, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-teal-50 border border-teal-200 rounded-lg"
              >
                <span className="font-medium text-gray-900">{adj.name}</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-teal-700">
                    +${adj.price.toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeAdjustment(idx)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Reasoning */}
      {adjustments.length > 0 && (
        <div className="mb-6">
          <label className="block font-semibold text-gray-900 mb-2">
            Reason for Adjustment <span className="text-red-600">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Briefly explain why additional services were needed (patient will see this)..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            rows={3}
          />
        </div>
      )}
      
      {/* Total Summary */}
      <div className="border-t border-gray-200 pt-4 mb-6">
        <div className="space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Original Amount:</span>
            <span>${originalAmount.toFixed(2)}</span>
          </div>
          
          {adjustments.length > 0 && (
            <>
              <div className="flex justify-between text-teal-600">
                <span>Additional Services:</span>
                <span>+${(adjustedTotal - originalAmount).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                <span>New Total:</span>
                <span className={!withinLimit ? 'text-red-600' : ''}>
                  ${adjustedTotal.toFixed(2)}
                </span>
              </div>
              
              {!withinLimit && (
                <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-red-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm font-semibold text-red-800">
                        Adjustment exceeds 15% limit
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        Maximum allowed: ${maxAllowed.toFixed(2)}
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        For larger adjustments, please contact support.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {withinLimit && (
                <p className="text-sm text-gray-600 text-right">
                  Increase: {((adjustedTotal - originalAmount) / originalAmount * 100).toFixed(1)}% 
                  (max 15%)
                </p>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Patient Notification Preview */}
      {adjustments.length > 0 && withinLimit && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div className="ml-3">
              <p className="font-semibold text-blue-900">
                Patient will receive notification:
              </p>
              <p className="text-sm text-blue-800 mt-1 italic">
                "Your provider added {adjustments.length} service(s) to your visit on{' '}
                {new Date(appointment.scheduledFor).toLocaleDateString()}. 
                New total: ${adjustedTotal.toFixed(2)}. 
                Reason: {reason || '(pending)'}"
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!withinLimit || adjustments.length === 0 || !reason.trim() || loading}
          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {loading ? 'Saving...' : 'Save Adjustments'}
        </button>
      </div>
      
      {/* Help Text */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        Adjustments must be saved before payment is automatically processed 
        (24 hours after appointment time)
      </p>
    </div>
  );
}

export default ServiceAdjustmentForm;
```

---

### 3. Payment Timeline View

**Location:** Appointment detail page

```jsx
// provider-platform/src/components/PaymentTimeline.jsx
import React from 'react';

function PaymentTimeline({ appointment }) {
  const events = [
    {
      label: 'Appointment Booked',
      timestamp: appointment.createdAt,
      status: 'complete',
      detail: 'Card saved'
    },
    {
      label: 'Card Authorized',
      timestamp: appointment.authorizedAt,
      status: appointment.authorizedAt ? 'complete' : 'pending',
      detail: appointment.authorizedAt ? `$${(appointment.amount/100).toFixed(2)} held` : 'Pending (7 days before)'
    },
    {
      label: 'Service Rendered',
      timestamp: appointment.scheduledFor,
      status: new Date() > new Date(appointment.scheduledFor) ? 'complete' : 'pending',
      detail: new Date(appointment.scheduledFor).toLocaleDateString()
    },
    {
      label: 'Payment Captured',
      timestamp: appointment.capturedAt,
      status: appointment.capturedAt ? 'complete' : 'pending',
      detail: appointment.capturedAt 
        ? `$${(appointment.finalAmount/100).toFixed(2)} charged`
        : 'Pending (24 hrs after service)'
    },
    {
      label: 'Provider Payout',
      timestamp: appointment.capturedAt ? new Date(new Date(appointment.capturedAt).getTime() + 2 * 24 * 60 * 60 * 1000) : null,
      status: 'pending',
      detail: 'Expected in 2-5 business days'
    }
  ];
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="font-bold text-lg mb-4">Payment Timeline</h3>
      
      <div className="space-y-4">
        {events.map((event, idx) => (
          <div key={idx} className="flex items-start">
            <div className="flex flex-col items-center mr-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                event.status === 'complete' ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {event.status === 'complete' ? (
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                )}
              </div>
              {idx < events.length - 1 && (
                <div className={`w-0.5 h-12 ${event.status === 'complete' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              )}
            </div>
            
            <div className="flex-1 pb-4">
              <h4 className="font-semibold text-gray-900">{event.label}</h4>
              <p className="text-sm text-gray-600">{event.detail}</p>
              {event.timestamp && (
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(event.timestamp).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PaymentTimeline;
```

---

## ✅ Testing Checklist

### Booking Flow
- [ ] Patient can book appointment and save card
- [ ] Cancellation policy is displayed clearly
- [ ] Booking confirmation email sent
- [ ] Card saved successfully (no charge)

### Authorization
- [ ] Card authorized 7 days before appointment
- [ ] Patient notified of authorization
- [ ] Authorization failure handled (patient notified)
- [ ] Patient can update payment method if authorization fails

### Free Cancellation
- [ ] Patient can cancel 72+ hours before (no fee)
- [ ] Authorization released
- [ ] Provider notified
- [ ] Cancellation confirmation sent

### Late Cancellation
- [ ] 50% fee charged for 24-72 hour cancellations
- [ ] First-time forgiveness applied correctly
- [ ] Credit option offered for very late cancellations
- [ ] Fees captured correctly

### No-Shows
- [ ] Pending status set 15 minutes after appointment
- [ ] Patient given 2-hour grace period
- [ ] 100% fee charged if confirmed no-show
- [ ] No-show recorded on patient account

### Service Completion
- [ ] Payment auto-captured 24 hours after appointment
- [ ] Adjustments applied before capture (within 15% limit)
- [ ] Receipt sent to patient
- [ ] Provider notified of payment capture

### Provider Adjustments
- [ ] Provider can add services (up to 15% increase)
- [ ] Patient notified of adjustments
- [ ] Adjustments apply before capture
- [ ] Exceeded limit shows error

### Waiver Requests
- [ ] Patient can request emergency waiver
- [ ] Admin receives waiver notification
- [ ] Admin can approve/deny waiver
- [ ] Patient notified of waiver decision

### Webhooks
- [ ] Payment success webhook updates appointment
- [ ] Payment failure webhook triggers notification
- [ ] Cancellation webhook updates status

---

## 📝 Summary

This cancellation policy implementation provides:

1. **Fair & Transparent** - Clear policies communicated upfront
2. **Automated** - Minimal manual intervention required
3. **Flexible** - Credit options, waivers, first-time forgiveness
4. **Provider-Friendly** - Easy adjustments, protected revenue
5. **Patient-Friendly** - No upfront charges, generous cancellation window

**Next Steps:**
1. Review and approve this specification
2. Set up Stripe account and webhooks
3. Implement database schema changes
4. Build API endpoints
5. Create UI components
6. Test thoroughly in staging
7. Deploy to production

**Questions?** Contact the development team for clarification on any component.
