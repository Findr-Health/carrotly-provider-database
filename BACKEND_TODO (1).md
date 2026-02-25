# BACKEND PHASE 2 - TODO & IMPLEMENTATION GUIDE
## Booking Request/Approval System Backend

---

## EXECUTIVE SUMMARY

**Status:** Mobile app complete ✅ | Backend 40% complete ⏳  
**Time Required:** 3-4 hours  
**Priority:** HIGH (blocks full feature activation)  
**Risk:** LOW (changes are additive, existing features unaffected)

---

## PRIORITY 1: RE-ENABLE WEBSOCKET SERVICE (30 minutes)

### Current Status
- ✅ `ws` npm package installed
- ❌ WebSocket service temporarily disabled (commented out in server.js)
- ❌ Cannot send real-time updates to mobile app

### Implementation

**File:** `backend/server.js`  
**Location:** Lines ~137-139

**STEP 1: Uncomment These Lines**
```javascript
// FIND THESE COMMENTED LINES:
// const BookingRealtimeService = require('./services/bookingRealtimeService');
// const realtimeService = new BookingRealtimeService(server);
// global.realtimeService = realtimeService;

// CHANGE TO:
const BookingRealtimeService = require('./services/bookingRealtimeService');
const realtimeService = new BookingRealtimeService(server);
global.realtimeService = realtimeService;
```

**STEP 2: Verify bookingRealtimeService.js Exists**
```bash
cd backend/services
ls -la bookingRealtimeService.js
```

**STEP 3: Test WebSocket Service**
```bash
# Start server locally
node backend/server.js

# Should see:
# 📡 WebSocket ready for real-time booking updates
# (No errors about 'ws' module)

# Test with wscat:
npm install -g wscat
wscat -c "ws://localhost:3001/api/bookings/realtime?userId=test123&type=patient"

# Should connect successfully
```

**STEP 4: Deploy to Railway**
```bash
git add backend/server.js
git commit -m "Enable WebSocket service for real-time booking updates"
git push railway main

# Or push to origin if Railway auto-deploys from GitHub
git push origin main
```

**STEP 5: Verify Production**
```bash
# Test production WebSocket
wscat -c "wss://fearless-achievement-production.up.railway.app/api/bookings/realtime?userId=test123&type=patient"

# Should connect successfully
```

**Success Criteria:**
- ✅ Server starts without 'ws' module error
- ✅ WebSocket endpoint responds to connections
- ✅ Heartbeat ping/pong works
- ✅ No memory leaks after 1 hour

---

## PRIORITY 2: ACCEPT/DECLINE ENDPOINTS (1 hour)

### Current Status
- ❌ POST `/api/bookings/:bookingId/accept-suggested-time` doesn't exist
- ❌ POST `/api/bookings/:bookingId/decline-suggested-times` doesn't exist
- ❌ Mobile app accept/decline buttons won't work

### Implementation

**File:** `backend/routes/bookings.js`

**ENDPOINT 1: Accept Suggested Time**

Add after the reschedule endpoint (around line 200):

```javascript
// Accept provider's suggested alternative time
router.post('/:bookingId/accept-suggested-time', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { suggestedTimeId } = req.body;
    const userId = req.user.userId;

    // Get booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify user owns booking
    if (booking.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Verify booking is pending
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Booking is not pending' });
    }

    // Find suggested time
    const suggestedTime = booking.suggestedTimes?.find(t => t.id === suggestedTimeId);
    if (!suggestedTime) {
      return res.status(404).json({ error: 'Suggested time not found' });
    }

    // Update booking
    booking.appointmentDate = suggestedTime.startTime;
    booking.appointmentTime = suggestedTime.startTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    booking.status = 'confirmed';
    booking.confirmedAt = new Date();
    booking.suggestedTimes = []; // Clear suggested times

    await booking.save();

    // Capture payment (was on hold)
    if (booking.paymentIntentId) {
      await stripe.paymentIntents.capture(booking.paymentIntentId);
    }

    // Send real-time notification
    if (global.realtimeService) {
      global.realtimeService.notifyBookingUpdate(booking, {
        type: 'booking_confirmed',
        message: 'Your appointment has been confirmed',
        bookingId: booking._id.toString(),
        status: 'confirmed'
      });
    }

    // TODO: Send push notification via FCM

    res.json({
      booking: booking.toObject(),
      message: 'Time accepted! Booking confirmed.'
    });

  } catch (error) {
    console.error('Accept suggested time error:', error);
    res.status(500).json({ error: 'Failed to accept suggested time' });
  }
});
```

**ENDPOINT 2: Decline Suggested Times**

Add after accept endpoint:

```javascript
// Decline all suggested times and cancel booking
router.post('/:bookingId/decline-suggested-times', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId;

    // Get booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify user owns booking
    if (booking.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Verify booking is pending
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Booking is not pending' });
    }

    // Cancel booking
    booking.status = 'cancelled';
    booking.cancelledBy = 'user';
    booking.cancelledAt = new Date();
    booking.cancellationReason = 'Declined suggested times';
    booking.suggestedTimes = [];

    await booking.save();

    // Release payment hold
    if (booking.paymentIntentId) {
      await stripe.paymentIntents.cancel(booking.paymentIntentId);
    }

    // Send real-time notification
    if (global.realtimeService) {
      global.realtimeService.notifyBookingUpdate(booking, {
        type: 'booking_cancelled',
        message: 'Booking request cancelled',
        bookingId: booking._id.toString(),
        status: 'cancelled'
      });
    }

    // TODO: Send push notification via FCM

    res.json({
      booking: booking.toObject(),
      message: 'Booking request cancelled. Payment hold released.'
    });

  } catch (error) {
    console.error('Decline suggested times error:', error);
    res.status(500).json({ error: 'Failed to decline suggested times' });
  }
});
```

**Testing:**

```bash
# Test accept suggested time
curl -X POST http://localhost:3001/api/bookings/BOOKING_ID/accept-suggested-time \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"suggestedTimeId": "time_1"}'

# Should return:
# {
#   "booking": {...},
#   "message": "Time accepted! Booking confirmed."
# }

# Test decline
curl -X POST http://localhost:3001/api/bookings/BOOKING_ID/decline-suggested-times \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Should return:
# {
#   "booking": {...},
#   "message": "Booking request cancelled. Payment hold released."
# }
```

**Deploy:**
```bash
git add backend/routes/bookings.js
git commit -m "Add accept/decline suggested times endpoints"
git push origin main
```

---

## PRIORITY 3: UPDATE BOOKING CREATION LOGIC (30 minutes)

### Current Status
- ✅ Booking creation works
- ❌ Doesn't check provider calendar
- ❌ Always returns status='confirmed'
- ❌ Mobile app Pending tab always empty

### Implementation

**File:** `backend/routes/bookings.js`  
**Method:** POST `/api/bookings`

**STEP 1: Update Booking Creation Logic**

Find the booking creation logic (around line 80-120) and modify:

```javascript
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { providerId, serviceId, appointmentDate, appointmentTime, paymentMethodId, notes } = req.body;
    const userId = req.user.userId;

    // Get provider
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // NEW: Determine booking type based on calendar connection
    let bookingType = 'request';  // Default: requires approval
    let paymentMode = 'hold';     // Default: hold payment
    let status = 'pending';       // Default: pending approval

    // NEW: If provider has calendar connected, check availability
    if (provider.calendarConnected && provider.calendar?.calendarId) {
      try {
        // Import calendar service (see Priority 4 below)
        const CalendarService = require('../services/CalendarService');
        
        const availabilityResult = await CalendarService.checkAvailability(
          providerId,
          new Date(appointmentDate + ' ' + appointmentTime),
          new Date(appointmentDate + ' ' + appointmentTime) // Add duration
        );

        if (availabilityResult.available) {
          // Time is available - instant booking!
          bookingType = 'instant';
          paymentMode = 'prepay';
          status = 'confirmed';
        } else {
          // Time conflict - request booking
          bookingType = 'auto-request';
          paymentMode = 'hold';
          status = 'pending';
        }
      } catch (calendarError) {
        // Calendar API error - fail open (allow booking as request)
        console.error('Calendar check error:', calendarError);
        bookingType = 'auto-request';
        paymentMode = 'hold';
        status = 'pending';
      }
    }

    // Create payment intent with correct mode
    const paymentIntent = await stripe.paymentIntents.create({
      amount: servicePrice * 100,
      currency: 'usd',
      payment_method: paymentMethodId,
      capture_method: paymentMode === 'prepay' ? 'automatic' : 'manual',
      metadata: { userId, providerId, bookingType }
    });

    // Confirm payment intent
    await stripe.paymentIntents.confirm(paymentIntent.id);

    // Create booking
    const booking = new Booking({
      userId,
      providerId,
      serviceId,
      serviceName: service.name,
      appointmentDate,
      appointmentTime,
      status,  // 'confirmed' or 'pending'
      bookingType,  // 'instant', 'auto-request', or 'request'
      paymentIntentId: paymentIntent.id,
      paymentStatus: paymentMode === 'prepay' ? 'paid' : 'held',
      totalAmount: servicePrice,
      notes,
      expiresAt: status === 'pending' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null, // 24 hours
    });

    await booking.save();

    // NEW: If instant booking, add to provider's calendar
    if (bookingType === 'instant' && provider.calendarConnected) {
      try {
        const CalendarService = require('../services/CalendarService');
        await CalendarService.createBookingEvent(booking);
      } catch (calendarError) {
        console.error('Failed to add to calendar:', calendarError);
        // Don't fail booking if calendar add fails
      }
    }

    // Send response
    res.json({
      booking: booking.toObject(),
      isRequest: status === 'pending',  // NEW: Tell mobile app it's a request
      bookingType,  // NEW: Tell mobile app the booking type
      message: bookingType === 'instant' 
        ? 'Appointment confirmed!'
        : 'Booking request sent. Provider will respond within 24 hours.'
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});
```

**Testing:**
```bash
# Test with calendar provider (should be instant if available)
curl -X POST http://localhost:3001/api/bookings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "PROVIDER_WITH_CALENDAR",
    "serviceId": "SERVICE_ID",
    "appointmentDate": "2026-02-10",
    "appointmentTime": "2:00 PM",
    "paymentMethodId": "pm_test_card"
  }'

# Should return:
# {
#   "booking": {..., "status": "confirmed"},
#   "isRequest": false,
#   "bookingType": "instant",
#   "message": "Appointment confirmed!"
# }

# Test with non-calendar provider (should be request)
curl -X POST http://localhost:3001/api/bookings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "PROVIDER_WITHOUT_CALENDAR",
    ...
  }'

# Should return:
# {
#   "booking": {..., "status": "pending"},
#   "isRequest": true,
#   "bookingType": "request",
#   "message": "Booking request sent..."
# }
```

---

## PRIORITY 4: CALENDAR INTEGRATION (2 hours)

### Current Status
- ❌ No calendar services implemented
- ❌ Cannot check real-time availability
- ❌ Cannot auto-add confirmed bookings to provider's calendar

### Implementation

**Create 3 new service files:**

#### FILE 1: services/GoogleCalendarService.js

```javascript
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

class GoogleCalendarService {
  constructor() {
    this.oauth2Client = new OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  // Set OAuth tokens for provider
  setCredentials(provider) {
    if (!provider.calendar || !provider.calendar.accessToken) {
      throw new Error('Provider calendar not connected');
    }

    this.oauth2Client.setCredentials({
      access_token: provider.calendar.accessToken,
      refresh_token: provider.calendar.refreshToken,
      expiry_date: provider.calendar.expiresAt?.getTime()
    });

    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  // Check if time slot is available
  async isSlotAvailable(provider, startTime, endTime) {
    try {
      const calendar = this.setCredentials(provider);

      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: startTime.toISOString(),
          timeMax: endTime.toISOString(),
          items: [{ id: provider.calendar.calendarId || 'primary' }]
        }
      });

      const calendars = response.data.calendars;
      const primaryCalendar = calendars[provider.calendar.calendarId || 'primary'];
      
      // If no busy times, slot is available
      return !primaryCalendar.busy || primaryCalendar.busy.length === 0;

    } catch (error) {
      console.error('Google Calendar availability check error:', error);
      
      // If token expired, try to refresh
      if (error.code === 401) {
        await this.refreshAccessToken(provider);
        return this.isSlotAvailable(provider, startTime, endTime);
      }
      
      // Fail open - return available on error
      return true;
    }
  }

  // Create calendar event for confirmed booking
  async createEvent(provider, booking) {
    try {
      const calendar = this.setCredentials(provider);

      const event = {
        summary: `${booking.serviceName} - ${booking.userName || 'Patient'}`,
        description: booking.notes || 'Findr Health Booking',
        start: {
          dateTime: new Date(booking.appointmentDate + ' ' + booking.appointmentTime).toISOString(),
          timeZone: provider.calendar.timezone || 'America/New_York'
        },
        end: {
          dateTime: new Date(new Date(booking.appointmentDate + ' ' + booking.appointmentTime).getTime() + booking.duration * 60000).toISOString(),
          timeZone: provider.calendar.timezone || 'America/New_York'
        },
        attendees: [
          { email: booking.userEmail }
        ]
      };

      const response = await calendar.events.insert({
        calendarId: provider.calendar.calendarId || 'primary',
        requestBody: event
      });

      return response.data;

    } catch (error) {
      console.error('Google Calendar event creation error:', error);
      throw error;
    }
  }

  // Refresh access token
  async refreshAccessToken(provider) {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      // Update provider with new token
      provider.calendar.accessToken = credentials.access_token;
      provider.calendar.expiresAt = new Date(credentials.expiry_date);
      await provider.save();

      return credentials.access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }
}

module.exports = new GoogleCalendarService();
```

#### FILE 2: services/MicrosoftCalendarService.js

```javascript
const { Client } = require('@microsoft/microsoft-graph-client');
const { ClientSecretCredential } = require('@azure/identity');

class MicrosoftCalendarService {
  constructor() {
    this.credential = new ClientSecretCredential(
      process.env.MICROSOFT_TENANT_ID || 'common',
      process.env.MICROSOFT_CLIENT_ID,
      process.env.MICROSOFT_CLIENT_SECRET
    );
  }

  // Create Graph API client for provider
  getClient(provider) {
    if (!provider.calendar || !provider.calendar.accessToken) {
      throw new Error('Provider calendar not connected');
    }

    return Client.init({
      authProvider: (done) => {
        done(null, provider.calendar.accessToken);
      }
    });
  }

  // Check if time slot is available
  async isSlotAvailable(provider, startTime, endTime) {
    try {
      const client = this.getClient(provider);

      const response = await client
        .api(`/me/calendar/getSchedule`)
        .post({
          schedules: [provider.calendar.calendarEmail || provider.email],
          startTime: {
            dateTime: startTime.toISOString(),
            timeZone: provider.calendar.timezone || 'Eastern Standard Time'
          },
          endTime: {
            dateTime: endTime.toISOString(),
            timeZone: provider.calendar.timezone || 'Eastern Standard Time'
          }
        });

      const schedule = response.value[0];
      return !schedule.scheduleItems || schedule.scheduleItems.length === 0;

    } catch (error) {
      console.error('Microsoft Calendar availability check error:', error);
      // Fail open
      return true;
    }
  }

  // Create calendar event
  async createEvent(provider, booking) {
    try {
      const client = this.getClient(provider);

      const event = {
        subject: `${booking.serviceName} - ${booking.userName || 'Patient'}`,
        body: {
          contentType: 'text',
          content: booking.notes || 'Findr Health Booking'
        },
        start: {
          dateTime: new Date(booking.appointmentDate + ' ' + booking.appointmentTime).toISOString(),
          timeZone: provider.calendar.timezone || 'Eastern Standard Time'
        },
        end: {
          dateTime: new Date(new Date(booking.appointmentDate + ' ' + booking.appointmentTime).getTime() + booking.duration * 60000).toISOString(),
          timeZone: provider.calendar.timezone || 'Eastern Standard Time'
        },
        attendees: [
          {
            emailAddress: { address: booking.userEmail },
            type: 'required'
          }
        ]
      };

      const response = await client
        .api('/me/events')
        .post(event);

      return response;

    } catch (error) {
      console.error('Microsoft Calendar event creation error:', error);
      throw error;
    }
  }
}

module.exports = new MicrosoftCalendarService();
```

#### FILE 3: services/CalendarService.js (Unified Interface)

```javascript
const GoogleCalendarService = require('./GoogleCalendarService');
const MicrosoftCalendarService = require('./MicrosoftCalendarService');
const Provider = require('../models/Provider');

class CalendarService {
  // Route to correct calendar service
  getService(provider) {
    if (provider.calendar?.provider === 'google') {
      return GoogleCalendarService;
    } else if (provider.calendar?.provider === 'microsoft') {
      return MicrosoftCalendarService;
    } else {
      throw new Error('Unknown calendar provider');
    }
  }

  // Check availability across all calendar types
  async checkAvailability(providerId, startTime, endTime) {
    try {
      const provider = await Provider.findById(providerId);
      
      if (!provider || !provider.calendarConnected) {
        return { available: false, reason: 'No calendar connected' };
      }

      const service = this.getService(provider);
      const available = await service.isSlotAvailable(provider, startTime, endTime);

      return { available };

    } catch (error) {
      console.error('Calendar availability check error:', error);
      // Fail open - allow booking as request
      return { available: false, error: error.message };
    }
  }

  // Create booking event in provider's calendar
  async createBookingEvent(booking) {
    try {
      const provider = await Provider.findById(booking.providerId);
      
      if (!provider || !provider.calendarConnected) {
        return null;
      }

      const service = this.getService(provider);
      return await service.createEvent(provider, booking);

    } catch (error) {
      console.error('Calendar event creation error:', error);
      // Don't fail booking if calendar add fails
      return null;
    }
  }

  // Update event in calendar
  async updateBookingEvent(booking) {
    // TODO: Implement if needed for rescheduling
  }

  // Delete event from calendar
  async deleteBookingEvent(booking) {
    // TODO: Implement for cancellations
  }
}

module.exports = new CalendarService();
```

**Install Required Packages:**
```bash
npm install googleapis @microsoft/microsoft-graph-client @azure/identity
```

**Add Environment Variables:**
```bash
# In Railway or .env file:

# Google Calendar
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/calendar/google/callback

# Microsoft Graph
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=https://your-domain.com/api/calendar/microsoft/callback
```

**Testing:**
```bash
# Test Google Calendar availability check
curl http://localhost:3001/api/test-calendar-availability \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "PROVIDER_ID_WITH_GOOGLE_CALENDAR",
    "startTime": "2026-02-10T14:00:00Z",
    "endTime": "2026-02-10T15:00:00Z"
  }'

# Should return: { "available": true/false }
```

**Deploy:**
```bash
git add backend/services/
git commit -m "Add calendar integration services (Google + Microsoft)"
git push origin main
```

---

## PRIORITY 5: PUSH NOTIFICATIONS (15 minutes)

### Current Status
- ✅ Mobile app configured to receive notifications
- ❌ Backend can't send notifications yet
- ❌ Need FCM server key

### Implementation

**STEP 1: Get FCM Server Key**

1. Go to Firebase Console
2. Project Settings → Cloud Messaging
3. Under "Cloud Messaging API (Legacy)", enable it if disabled
4. Copy "Server key"

**STEP 2: Add to Environment Variables**
```bash
# Railway or .env:
FCM_SERVER_KEY=your_fcm_server_key_here
```

**STEP 3: Install Firebase Admin SDK**
```bash
npm install firebase-admin
```

**STEP 4: Create Notification Service**

**File:** `backend/services/NotificationService.js`

```javascript
const admin = require('firebase-admin');

class NotificationService {
  constructor() {
    // Initialize Firebase Admin (use service account JSON if available)
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
      });
    }
  }

  async sendBookingNotification(userId, notification) {
    try {
      // Get user's FCM token from database
      const user = await User.findById(userId);
      if (!user?.fcmToken) {
        console.log('No FCM token for user:', userId);
        return;
      }

      const message = {
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: {
          bookingId: notification.bookingId || '',
          type: notification.type || 'booking_update'
        },
        token: user.fcmToken
      };

      const response = await admin.messaging().send(message);
      console.log('Notification sent:', response);
      return response;

    } catch (error) {
      console.error('Push notification error:', error);
      // Don't fail request if notification fails
    }
  }
}

module.exports = new NotificationService();
```

**STEP 5: Add to Booking Endpoints**

In `backend/routes/bookings.js`, after WebSocket notification:

```javascript
// After: global.realtimeService.notifyBookingUpdate(...)

// Send push notification
const NotificationService = require('../services/NotificationService');
await NotificationService.sendBookingNotification(booking.userId, {
  title: 'Booking Confirmed',
  body: `Your appointment with ${provider.name} is confirmed`,
  bookingId: booking._id.toString(),
  type: 'booking_confirmed'
});
```

**STEP 6: Store FCM Tokens**

Add endpoint to store FCM tokens from mobile app:

```javascript
// POST /api/users/fcm-token
router.post('/fcm-token', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.userId;

    await User.findByIdAndUpdate(userId, { fcmToken: token });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save FCM token' });
  }
});
```

**Mobile App Integration:**

Update mobile app to send FCM token to backend (in `push_notification_service.dart`):

```dart
// After getting FCM token
final token = await _fcm.getToken();
if (token != null) {
  // Send to backend
  await dio.post('/api/users/fcm-token', data: {'token': token});
}
```

**Testing:**
```bash
# Test notification sending
curl -X POST http://localhost:3001/api/test-notification \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "title": "Test Notification",
    "body": "This is a test"
  }'

# Check mobile device for notification
```

---

## TESTING CHECKLIST

### Unit Tests
- [ ] WebSocket connection/disconnection
- [ ] Accept suggested time with valid ID
- [ ] Decline suggested times
- [ ] Calendar availability check (Google)
- [ ] Calendar availability check (Microsoft)
- [ ] Calendar event creation
- [ ] Push notification sending

### Integration Tests
- [ ] End-to-end booking flow (instant booking)
- [ ] End-to-end booking flow (request booking)
- [ ] Accept suggested time → Booking confirmed → Calendar updated → Notification sent
- [ ] Decline times → Booking cancelled → Payment released → Notification sent
- [ ] WebSocket delivers events to mobile app
- [ ] Push notifications received on mobile device

### Load Tests
- [ ] 100 concurrent WebSocket connections
- [ ] Calendar API rate limiting
- [ ] FCM batch notification sending

---

## DEPLOYMENT SEQUENCE

1. ✅ Install dependencies (`ws`, `googleapis`, etc.)
2. ✅ Add environment variables to Railway
3. ✅ Deploy calendar services
4. ✅ Deploy updated booking endpoints
5. ✅ Deploy notification service
6. ✅ Re-enable WebSocket service
7. ✅ Test on staging environment
8. ✅ Deploy to production
9. ✅ Monitor for errors (first 24 hours)
10. ✅ Update mobile app documentation

---

## SUCCESS CRITERIA

### Technical
- ✅ WebSocket server running without errors
- ✅ Calendar API calls succeeding (>95% success rate)
- ✅ Push notifications delivering (<5% failure rate)
- ✅ No memory leaks in WebSocket connections
- ✅ Response times <500ms for booking creation

### Functional
- ✅ Instant bookings work for calendar providers
- ✅ Request bookings work for non-calendar providers
- ✅ Accept suggested time confirms booking
- ✅ Decline times cancels booking and releases payment
- ✅ Real-time updates reach mobile app
- ✅ Push notifications received on device

### User Experience
- ✅ Booking creation completes in <3 seconds
- ✅ Real-time updates arrive within 2 seconds
- ✅ Push notifications arrive within 5 seconds
- ✅ Calendar conflicts detected accurately

---

## ROLLBACK PLAN

If critical issues arise:

1. **Disable WebSocket Service**
   ```bash
   # Comment out in server.js
   // const realtimeService = new BookingRealtimeService(server);
   git commit -m "Hotfix: Disable WebSocket"
   git push origin main
   ```

2. **Revert Booking Creation Changes**
   ```bash
   git revert HEAD~3  # Revert last 3 commits
   git push origin main
   ```

3. **Disable Calendar Integration**
   ```javascript
   // In booking creation:
   // const available = await CalendarService.checkAvailability(...);
   const available = false;  // Force all bookings to be requests
   ```

---

## TIMELINE ESTIMATE

**Total Time:** 3-4 hours (for experienced developer)

- Priority 1 (WebSocket): 30 minutes
- Priority 2 (Accept/Decline): 1 hour
- Priority 3 (Booking Logic): 30 minutes
- Priority 4 (Calendar): 2 hours
- Priority 5 (Notifications): 15 minutes
- Testing: 30 minutes
- Deployment: 15 minutes

**Recommended Approach:**
1. Do Priority 1-3 first (2 hours) → Deploy → Test mobile app
2. Do Priority 4-5 next day (2.5 hours) → Deploy → Full end-to-end test

---

## SUPPORT RESOURCES

**Documentation:**
- Google Calendar API: https://developers.google.com/calendar/api/guides/overview
- Microsoft Graph API: https://learn.microsoft.com/en-us/graph/api/resources/calendar
- Firebase Cloud Messaging: https://firebase.google.com/docs/cloud-messaging
- ws Package: https://github.com/websockets/ws

**Testing Tools:**
- wscat: WebSocket testing
- Postman: API testing
- Firebase Console: Push notification testing

---

**Document Version:** 1.0  
**Last Updated:** January 25, 2026  
**Status:** Ready for Implementation
