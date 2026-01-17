# Stripe Webhook Handler Additions

Add these handlers to `backend/routes/webhooks.js` inside your webhook switch statement.

```javascript

// Add these handlers to backend/routes/webhooks.js
// Place inside the webhook handler switch statement

// ============================================================================
// PAYMENT INTENT EVENTS - For Request Booking Flow
// ============================================================================

case 'payment_intent.amount_capturable_updated':
  // Payment hold is now active
  {
    const paymentIntent = event.data.object;
    const bookingId = paymentIntent.metadata?.bookingId;
    
    if (bookingId) {
      console.log(`[Webhook] Payment hold active for booking ${bookingId}`);
      
      // Update booking to reflect hold is active
      await Booking.findByIdAndUpdate(bookingId, {
        'payment.holdActive': true,
        'payment.holdAmount': paymentIntent.amount_capturable,
        'payment.holdCreatedAt': new Date()
      });
    }
  }
  break;

case 'payment_intent.canceled':
  // Payment hold was released (decline, expire, or cancel)
  {
    const paymentIntent = event.data.object;
    const bookingId = paymentIntent.metadata?.bookingId;
    
    if (bookingId) {
      console.log(`[Webhook] Payment hold released for booking ${bookingId}`);
      
      // Update booking
      await Booking.findByIdAndUpdate(bookingId, {
        'payment.holdActive': false,
        'payment.holdReleasedAt': new Date(),
        'payment.status': 'cancelled'
      });
      
      // Trigger notification
      try {
        const booking = await Booking.findById(bookingId);
        if (booking && ['expired', 'cancelled_provider', 'cancelled_patient'].includes(booking.status)) {
          // Notification already sent by status change
          console.log(`[Webhook] Booking ${bookingId} already notified`);
        }
      } catch (err) {
        console.error('[Webhook] Error sending cancellation notification:', err);
      }
    }
  }
  break;

case 'payment_intent.succeeded':
  // Payment was captured (booking completed or instant book)
  {
    const paymentIntent = event.data.object;
    const bookingId = paymentIntent.metadata?.bookingId;
    
    if (bookingId) {
      console.log(`[Webhook] Payment captured for booking ${bookingId}`);
      
      // Update booking
      await Booking.findByIdAndUpdate(bookingId, {
        'payment.status': 'captured',
        'payment.capturedAt': new Date(),
        'payment.holdActive': false
      });
    }
  }
  break;

case 'payment_intent.payment_failed':
  // Payment failed
  {
    const paymentIntent = event.data.object;
    const bookingId = paymentIntent.metadata?.bookingId;
    
    if (bookingId) {
      console.log(`[Webhook] Payment failed for booking ${bookingId}`);
      
      await Booking.findByIdAndUpdate(bookingId, {
        status: 'payment_failed',
        'payment.status': 'failed',
        'payment.failedAt': new Date(),
        'payment.failureReason': paymentIntent.last_payment_error?.message
      });
    }
  }
  break;

```

## Also Required

Add this import at the top of webhooks.js:
```javascript
const Booking = require('../models/Booking');
```

## Register Notification Routes

In `backend/server.js` or `backend/app.js`, add:
```javascript
const notificationRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationRoutes);
```
