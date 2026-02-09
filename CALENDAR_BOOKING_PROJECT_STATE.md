# Calendar Integration & Booking Flow - Project State
**Date:** February 5, 2026  
**Status:** 95% Complete - One Critical Bug Blocking Production

## PROJECT OVERVIEW
Integrated Google Calendar availability checking into booking flow for instant vs. request booking determination. Implemented 80/20 payment split with PaymentService. Added NotificationService for booking confirmations.

## WORKING COMPONENTS ✅
1. **Calendar Integration**
   - Google Calendar OAuth connection (provider + team member level)
   - Real-time availability checking via `calendarAvailability.js`
   - HIPAA-compliant event creation (blocks time without PHI)
   - Team member calendar support

2. **Payment Flow (80/20 Split)**
   - PaymentService charges 80% deposit at booking
   - Stripe integration with automatic_payment_methods
   - statement_descriptor_suffix: 'Deposit' / 'Final'
   - Platform fee calculation (2.9%)

3. **Booking Flow**
   - Instant booking: Available slot → charge deposit → create event → confirm
   - Request booking: Busy slot → hold payment → pending_confirmation

4. **Notification System**
   - Email + Push via NotificationService
   - Templates: booking_confirmed_patient, booking_request_sent, new_booking_request
   - Integrated at booking creation + provider confirmation

## CURRENT BUG 🚨
**Symptom:** Booking hangs after calendar event creation, never sends response to mobile app

**Logs Show:**
```
✅ Deposit charged: 100 (deposit_charged)
📅 Creating calendar event for instant booking...
✅ Calendar event created: success
[HANGS - NO FURTHER OUTPUT]
```

**Expected Next Steps:**
1. `booking.save({ validateBeforeSave: false })`
2. `logEvent(booking, 'created')`
3. `NotificationService.send()`
4. `res.status(201).json(...)`

**Code Location:** `backend/routes/bookings.js` lines 475-590

**Theories Tested:**
- ❌ console.log syntax errors (verified clean)
- ❌ Mongoose model syntax errors (verified clean)
- ⏳ Unknown hang between calendar creation and save

## KEY FILES
```
backend/
├── routes/bookings.js           # Main booking endpoint (POST /)
├── services/
│   ├── PaymentService.js        # 80/20 payment processing
│   ├── NotificationService.js   # Email + push notifications
│   └── calendarSync.js          # Calendar event creation
├── utils/
│   └── calendarAvailability.js  # Availability checking
└── models/
    └── Booking.js               # Schema with payment fields
```

## PAYMENT SCHEMA
```javascript
payment: {
  totalAmount: Number,      // Full service price
  depositAmount: Number,    // 80% charged upfront
  finalAmount: Number,      // 20% charged later
  platformFee: Number,      // 2.9% of total
  depositStatus: 'pending' | 'succeeded' | 'failed',
  finalStatus: 'pending' | 'succeeded' | 'failed',
  status: 'pending' | 'deposit_charged' | 'completed' | 'refunded',
  depositPaymentIntentId: String,
  finalPaymentIntentId: String
}
```

## DEPLOYMENT INFO
- **Railway:** https://carrotly-provider-database-production.up.railway.app
- **Branch:** main
- **Last Good Commit:** a91ce1e (Stripe descriptor fix)
- **Database:** MongoDB on Railway

## MOBILE APP
- Flutter app at `~/Development/findr-health/findr-health-mobile`
- Makes POST to `/api/bookings` with servicePrice, teamMemberId, startTime
- Expects 201 response with booking object

## NEXT STEPS FOR NEW CONVERSATION
1. Debug why code hangs after calendar event creation
2. Add logging between calendar event and booking.save()
3. Check for unhandled promise rejections
4. Verify NotificationService doesn't crash silently
5. Test end-to-end booking flow
