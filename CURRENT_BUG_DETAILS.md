# Critical Bug: Booking Hangs After Calendar Event

## REPRODUCTION STEPS
1. Open Flutter app
2. Select: Physical Therapy Session, $125, Feb 17 9:15 AM
3. Tap "Book Appointment"
4. App shows loading spinner indefinitely

## RAILWAY LOGS (Actual)
```
🕐 BOOKING TIME DEBUG: { rawStartTime: '2026-02-17T09:15:00.000' }
🕐 CONVERTED: { requestedStart: '2026-02-17T16:15:00.000Z' }
✅ Time slot available: 2026-02-17T16:15:00.000Z for 60 minutes
📅 Team member Dr. Sarah Johnson calendar: AVAILABLE → instant booking
✅ Deposit charged: 100 (deposit_charged)
📅 Creating calendar event for instant booking...
✅ Calendar event created: success
[STOPS HERE - NO FURTHER OUTPUT]
```

## EXPECTED LOGS (Missing)
```
💰 PAYMENT DEBUG BEFORE SAVE: { totalAmount: 125, depositAmount: 100... }
📧 Sent instant booking confirmation to patient
[Response sent to client]
```

## CODE CONTEXT (routes/bookings.js)

**Lines 450-475 (Calendar Event - EXECUTES):**
```javascript
if (bookingType === 'instant' && booking.status === 'confirmed') {
  try {
    console.log('📅 Creating calendar event for instant booking...');
    const calendarEvent = await calendarSync.createCalendarEvent(booking, provider, teamMember);
    if (calendarEvent) {
      console.log(`✅ Calendar event created: success`);
    }
  } catch (calendarError) {
    console.error('Calendar event creation failed:', calendarError);
  }
}
```

**Lines 476-490 (Save - NEVER EXECUTES):**
```javascript
// Debug payment values before save
console.log('💰 PAYMENT DEBUG BEFORE SAVE:', {
  totalAmount: booking.payment.totalAmount,
  depositAmount: booking.payment.depositAmount,
  finalAmount: booking.payment.finalAmount,
  platformFee: booking.payment.platformFee,
  status: booking.payment.status
});

// Save booking
await booking.save({ validateBeforeSave: false });

// Log creation event
await logEvent(booking, 'created', {
  bookingType,
  newStatus: booking.status
}, {
  type: 'patient',
  userId: patientId
});
```

## DIAGNOSTIC COMMANDS RUN
```bash
# ✅ No console.log syntax errors
grep -n "console\.log\`" routes/bookings.js
# Result: (empty)

# ✅ No model syntax errors  
node -c models/Booking.js
# Result: (no output = valid)

# ✅ NotificationService imported
grep "NotificationService" routes/bookings.js
# Result: Line 26: const NotificationService = require(...)
```

## THEORIES TO INVESTIGATE
1. **Unhandled Promise Rejection** - Code after calendar event has await without try/catch
2. **Mongoose Middleware Hook** - pre('save') hook hanging in Booking model
3. **Memory/Timeout** - Railway container running out of resources
4. **Missing Return** - calendarSync.createCalendarEvent not resolving properly

## FILES MODIFIED IN THIS SESSION
1. `routes/bookings.js` - Payment integration, notifications, calendar flow
2. `services/PaymentService.js` - 80/20 split logic, Stripe config
3. `models/Booking.js` - Payment schema fields
4. `services/calendarSync.js` - Event creation logic
5. `utils/calendarAvailability.js` - Availability checking

## COMMIT HISTORY (Relevant)
```
a91ce1e - fix: use statement_descriptor_suffix (CURRENT)
7bf73db - fix: add automatic_payment_methods
aa63e1e - fix: update payment amounts from PaymentService
feaf325 - fix: complete booking migration
44d5048 - fix: console.log syntax
```
