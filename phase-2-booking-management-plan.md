# Phase 2: Booking Management Implementation Plan
## Findr Health - Detailed Roadmap
**Date:** February 1, 2026  
**Status:** Planning Complete - Ready to Execute 🚀

---

## Executive Summary

Phase 2 focuses on **complete booking lifecycle management**, enabling users and providers to cancel, reschedule, and receive notifications for all booking events. This phase transforms the booking system from "create-only" to "full CRUD" with proper calendar synchronization and communication.

**Timeline:** 4-6 weeks  
**Complexity:** Medium  
**Dependencies:** Phase 1 (Complete ✅)  
**Blockers:** None

---

## Strategic Goals

### **User Experience Goals:**
1. Users can cancel bookings with automatic refunds
2. Users can reschedule bookings seamlessly
3. Users receive timely notifications (email, SMS, push)
4. Providers can manage pending requests efficiently

### **Technical Goals:**
1. Bidirectional calendar sync (create, update, delete)
2. Automated notification system
3. Proper refund handling via Stripe
4. Provider dashboard for booking management

### **Business Goals:**
1. Reduce no-shows via reminder notifications
2. Improve provider efficiency with request management
3. Increase customer satisfaction with self-service tools
4. Maintain HIPAA compliance throughout

---

## Features Breakdown

### **Feature 1: Booking Cancellation** 🔴

**Priority:** P0 (Critical)  
**Effort:** 2 weeks  
**Dependencies:** None

#### **User Stories:**
1. As a **patient**, I want to cancel my booking so I can get a refund
2. As a **provider**, I want cancelled bookings removed from my calendar
3. As a **support agent**, I need cancellation audit trail

#### **Technical Requirements:**

**Backend Changes:**
1. Cancel booking endpoint with refund logic
2. Calendar event deletion via Google/Microsoft API
3. Refund processing via Stripe
4. Booking status state machine updates

**Frontend Changes:**
1. "Cancel" button on booking details screen
2. Confirmation dialog with refund policy
3. Cancellation reason capture (optional)
4. Loading states during cancellation

**API Endpoint:**
```http
POST /api/bookings/:bookingId/cancel
Content-Type: application/json
Authorization: Bearer <token>

{
  "reason": "Schedule conflict",
  "cancelledBy": "patient"
}
```

**Response:**
```json
{
  "success": true,
  "booking": {
    "status": "cancelled_patient",
    "refund": {
      "amount": 175.00,
      "status": "processed",
      "refundId": "re_abc123"
    },
    "calendar": {
      "eventDeleted": true
    }
  }
}
```

#### **Implementation Steps:**

**Step 1: Backend - Refund Logic (3 days)**
```javascript
// routes/bookings.js - Enhance existing cancel endpoint

router.post('/:id/cancel', authenticateUser, async (req, res) => {
  const { reason, cancelledBy } = req.body;
  const booking = await Booking.findById(req.params.id);
  
  // Authorization check
  if (cancelledBy === 'patient' && booking.patient.toString() !== req.userId) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  // Calculate refund amount based on cancellation policy
  const refundAmount = calculateRefund(booking);
  
  // Process Stripe refund
  if (refundAmount > 0 && booking.payment.paymentIntentId) {
    const refund = await stripe.refunds.create({
      payment_intent: booking.payment.paymentIntentId,
      amount: Math.round(refundAmount * 100), // Convert to cents
      reason: 'requested_by_customer'
    });
    
    booking.payment.refunds.push({
      refundId: refund.id,
      amount: refundAmount,
      processedAt: new Date()
    });
  }
  
  // Update booking status
  booking.status = cancelledBy === 'patient' ? 'cancelled_patient' : 'cancelled_provider';
  booking.notes.cancellationReason = reason;
  
  await booking.save();
  
  // Delete calendar event (async, non-blocking)
  if (booking.calendar.eventCreated) {
    deleteCalendarEvent(booking).catch(err => {
      console.error('Calendar deletion failed:', err);
      // Log but don't fail the cancellation
    });
  }
  
  res.json({ success: true, booking });
});

// Helper function - Refund calculation
function calculateRefund(booking) {
  const now = new Date();
  const appointmentTime = new Date(booking.dateTime.requestedStart);
  const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);
  
  // Cancellation policy
  if (hoursUntilAppointment >= 24) {
    return booking.payment.originalAmount; // Full refund
  } else if (hoursUntilAppointment >= 12) {
    return booking.payment.originalAmount * 0.5; // 50% refund
  } else {
    return 0; // No refund
  }
}
```

**Step 2: Calendar Event Deletion (2 days)**
```javascript
// services/calendarSync.js

async function deleteCalendarEvent(booking) {
  if (!booking.calendar.eventId) {
    console.log('No calendar event to delete');
    return { success: false, reason: 'no_event' };
  }
  
  const provider = await Provider.findById(booking.provider);
  const teamMember = provider.teamMembers.id(booking.teamMember?.memberId);
  
  if (!teamMember?.calendar?.connected) {
    console.log('Team member has no calendar');
    return { success: false, reason: 'no_calendar' };
  }
  
  try {
    if (teamMember.calendar.provider === 'google') {
      await deleteGoogleEvent(teamMember, booking.calendar.eventId);
    } else if (teamMember.calendar.provider === 'microsoft') {
      await deleteMicrosoftEvent(teamMember, booking.calendar.eventId);
    }
    
    // Update booking
    booking.calendar.eventDeleted = true;
    booking.calendar.deletedAt = new Date();
    await booking.save();
    
    return { success: true };
  } catch (error) {
    console.error('Calendar deletion failed:', error);
    booking.calendar.syncStatus = 'delete_failed';
    booking.calendar.lastSyncError = error.message;
    await booking.save();
    
    return { success: false, error: error.message };
  }
}

async function deleteGoogleEvent(teamMember, eventId) {
  const oauth2Client = getGoogleOAuthClient(teamMember);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  await calendar.events.delete({
    calendarId: teamMember.calendar.calendarId || 'primary',
    eventId: eventId
  });
}

async function deleteMicrosoftEvent(teamMember, eventId) {
  const accessToken = await refreshMicrosoftToken(teamMember);
  
  await axios.delete(
    `https://graph.microsoft.com/v1.0/me/events/${eventId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
}

module.exports = { deleteCalendarEvent };
```

**Step 3: Frontend - Cancel UI (2 days)**
```dart
// lib/presentation/screens/booking/booking_details_screen.dart

Widget _buildCancelButton() {
  return ElevatedButton(
    onPressed: () => _showCancelDialog(context),
    style: ElevatedButton.styleFrom(
      backgroundColor: Colors.red,
      foregroundColor: Colors.white,
    ),
    child: const Text('Cancel Booking'),
  );
}

Future<void> _showCancelDialog(BuildContext context) async {
  final refundInfo = _calculateRefundInfo(booking);
  
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Cancel Booking?'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Booking: ${booking.bookingNumber}'),
          const SizedBox(height: 12),
          Text('Date: ${_formatDate(booking.dateTime.requestedStart)}'),
          const SizedBox(height: 12),
          Text(
            'Refund: \$${refundInfo.amount.toStringAsFixed(2)}',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: refundInfo.amount > 0 ? Colors.green : Colors.red,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            refundInfo.policy,
            style: const TextStyle(fontSize: 12, color: Colors.grey),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: const Text('Keep Booking'),
        ),
        ElevatedButton(
          onPressed: () => Navigator.pop(context, true),
          style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
          child: const Text('Cancel Booking'),
        ),
      ],
    ),
  );
  
  if (confirmed == true) {
    await _processCancel ation();
  }
}

Future<void> _processCancellation() async {
  setState(() => _isLoading = true);
  
  try {
    final repository = ref.read(bookingRepositoryProvider);
    await repository.cancelBooking(
      bookingId: booking.id,
      reason: 'User requested',
    );
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Booking cancelled successfully')),
      );
      context.pop(); // Return to previous screen
    }
  } catch (e) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to cancel: $e')),
      );
    }
  } finally {
    setState(() => _isLoading = false);
  }
}
```

**Step 4: Testing (2 days)**
- [ ] Cancel booking with >24hr notice → Full refund
- [ ] Cancel booking with 12-24hr notice → 50% refund
- [ ] Cancel booking with <12hr notice → No refund
- [ ] Calendar event deleted from Google Calendar
- [ ] Calendar event deleted from Microsoft Calendar
- [ ] Booking status updated correctly
- [ ] Refund appears in Stripe dashboard
- [ ] UI shows loading states properly

---

### **Feature 2: Booking Reschedule** 🟡

**Priority:** P1 (High)  
**Effort:** 3 weeks  
**Dependencies:** Feature 1 (Cancellation)

#### **User Stories:**
1. As a **patient**, I want to reschedule my booking without losing my spot
2. As a **provider**, I want rescheduled bookings reflected in my calendar
3. As a **system**, I want to prevent double-booking during reschedule

#### **Technical Requirements:**

**Backend Changes:**
1. Reschedule endpoint with availability check
2. Calendar event update via Google/Microsoft API
3. Payment adjustment if price changed
4. Reschedule history tracking

**Frontend Changes:**
1. "Reschedule" button on booking details
2. Date/time picker with live availability
3. Confirmation screen showing old vs. new time
4. Visual diff of changes

**API Endpoint:**
```http
POST /api/bookings/:bookingId/reschedule
Content-Type: application/json
Authorization: Bearer <token>

{
  "newStartTime": "2026-02-15T14:30:00.000Z",
  "newEndTime": "2026-02-15T15:45:00.000Z",
  "reason": "Schedule conflict"
}
```

#### **Implementation Steps:**

**Step 1: Backend - Reschedule Logic (4 days)**
```javascript
// routes/bookings.js

router.post('/:id/reschedule', authenticateUser, async (req, res) => {
  const { newStartTime, newEndTime, reason } = req.body;
  const booking = await Booking.findById(req.params.id)
    .populate('provider');
  
  // Authorization
  if (booking.patient.toString() !== req.userId) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  // Check if reschedule allowed
  if (!booking.canReschedule) {
    return res.status(400).json({ 
      error: 'Maximum reschedule attempts reached',
      maxAttempts: booking.reschedule.maxAttempts
    });
  }
  
  // Verify new time is available
  const teamMember = booking.provider.teamMembers.id(booking.teamMember?.memberId);
  if (teamMember?.calendar?.connected) {
    const isAvailable = await checkTimeSlotAvailability(
      booking.provider,
      new Date(newStartTime),
      booking.service.duration,
      booking.teamMember?.memberId
    );
    
    if (!isAvailable) {
      return res.status(409).json({ error: 'Time slot not available' });
    }
  }
  
  // Store old times in history
  booking.reschedule.history.push({
    attemptNumber: booking.reschedule.count + 1,
    fromStart: booking.dateTime.requestedStart,
    fromEnd: booking.dateTime.requestedEnd,
    toStart: new Date(newStartTime),
    toEnd: new Date(newEndTime),
    rescheduledBy: 'patient',
    rescheduledAt: new Date(),
    reason: reason
  });
  
  // Update booking times
  booking.dateTime.requestedStart = new Date(newStartTime);
  booking.dateTime.requestedEnd = new Date(newEndTime);
  booking.dateTime.confirmedStart = new Date(newStartTime);
  booking.dateTime.confirmedEnd = new Date(newEndTime);
  booking.reschedule.count += 1;
  
  await booking.save();
  
  // Update calendar event (async, non-blocking)
  if (booking.calendar.eventCreated) {
    updateCalendarEvent(booking, newStartTime, newEndTime)
      .catch(err => console.error('Calendar update failed:', err));
  }
  
  res.json({ success: true, booking });
});
```

**Step 2: Calendar Event Update (3 days)**
```javascript
// services/calendarSync.js

async function updateCalendarEvent(booking, newStartTime, newEndTime) {
  if (!booking.calendar.eventId) {
    console.log('No calendar event to update');
    return { success: false, reason: 'no_event' };
  }
  
  const provider = await Provider.findById(booking.provider);
  const teamMember = provider.teamMembers.id(booking.teamMember?.memberId);
  
  try {
    if (teamMember.calendar.provider === 'google') {
      await updateGoogleEvent(teamMember, booking, newStartTime, newEndTime);
    } else if (teamMember.calendar.provider === 'microsoft') {
      await updateMicrosoftEvent(teamMember, booking, newStartTime, newEndTime);
    }
    
    booking.calendar.lastUpdatedAt = new Date();
    booking.calendar.syncStatus = 'synced';
    await booking.save();
    
    return { success: true };
  } catch (error) {
    booking.calendar.syncStatus = 'update_failed';
    booking.calendar.lastSyncError = error.message;
    await booking.save();
    
    return { success: false, error: error.message };
  }
}

async function updateGoogleEvent(teamMember, booking, newStartTime, newEndTime) {
  const oauth2Client = getGoogleOAuthClient(teamMember);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  await calendar.events.patch({
    calendarId: teamMember.calendar.calendarId || 'primary',
    eventId: booking.calendar.eventId,
    requestBody: {
      start: { dateTime: newStartTime },
      end: { dateTime: newEndTime }
    }
  });
}

async function updateMicrosoftEvent(teamMember, booking, newStartTime, newEndTime) {
  const accessToken = await refreshMicrosoftToken(teamMember);
  
  await axios.patch(
    `https://graph.microsoft.com/v1.0/me/events/${booking.calendar.eventId}`,
    {
      start: { dateTime: newStartTime, timeZone: 'UTC' },
      end: { dateTime: newEndTime, timeZone: 'UTC' }
    },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
}
```

**Step 3: Frontend - Reschedule Flow (4 days)**
```dart
// lib/presentation/screens/booking/reschedule_screen.dart

class RescheduleScreen extends ConsumerStatefulWidget {
  final BookingModel currentBooking;
  
  @override
  ConsumerState<RescheduleScreen> createState() => _RescheduleScreenState();
}

class _RescheduleScreenState extends ConsumerState<RescheduleScreen> {
  DateTime? _newDate;
  String? _newTimeSlot;
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reschedule Booking')),
      body: Column(
        children: [
          // Show current booking info
          _buildCurrentBookingCard(),
          
          const Divider(),
          
          // Date/time picker
          DateTimeSelectionScreen(
            provider: widget.currentBooking.provider,
            selectedService: widget.currentBooking.service,
            selectedTeamMember: widget.currentBooking.teamMember,
            onDateTimeSelected: (date, time) {
              setState(() {
                _newDate = date;
                _newTimeSlot = time;
              });
            },
          ),
          
          // Confirm button
          if (_newDate != null && _newTimeSlot != null)
            _buildConfirmButton(),
        ],
      ),
    );
  }
  
  Widget _buildCurrentBookingCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Current Appointment', 
              style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('Date: ${_formatDate(widget.currentBooking.dateTime.requestedStart)}'),
            Text('Time: ${_formatTime(widget.currentBooking.dateTime.requestedStart)}'),
            Text('Provider: ${widget.currentBooking.teamMember?.name ?? "N/A"}'),
          ],
        ),
      ),
    );
  }
  
  Widget _buildConfirmButton() {
    return ElevatedButton(
      onPressed: () => _showConfirmDialog(),
      child: const Text('Confirm Reschedule'),
    );
  }
  
  Future<void> _showConfirmDialog() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Reschedule'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildTimeComparison(),
            const SizedBox(height: 16),
            const Text('Are you sure you want to reschedule?'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
    
    if (confirmed == true) {
      await _processReschedule();
    }
  }
  
  Future<void> _processReschedule() async {
    // Implementation similar to cancellation
    // Call repository.rescheduleBooking()
  }
}
```

**Step 4: Testing (3 days)**
- [ ] Reschedule to available time → Success
- [ ] Reschedule to unavailable time → Error
- [ ] Reschedule limit enforced (2 attempts max)
- [ ] Calendar event updated in Google Calendar
- [ ] Calendar event updated in Microsoft Calendar
- [ ] Reschedule history tracked
- [ ] UI shows old vs. new time comparison
- [ ] Booking list reflects new time

---

### **Feature 3: Notification System** 📧

**Priority:** P1 (High)  
**Effort:** 2 weeks  
**Dependencies:** None (parallel with Features 1-2)

#### **User Stories:**
1. As a **patient**, I want email confirmation when I book
2. As a **patient**, I want SMS reminders 24hrs before my appointment
3. As a **provider**, I want notifications for new booking requests
4. As a **system admin**, I want notification delivery tracking

#### **Technical Requirements:**

**Backend Changes:**
1. Email service integration (SendGrid or AWS SES)
2. SMS service integration (Twilio)
3. Push notification service (Firebase Cloud Messaging)
4. Notification queue system (Bull or BullMQ)
5. Notification templates for all event types

**Notification Types:**
1. **Booking Created** → Email + Push
2. **Booking Confirmed** → Email + Push + SMS
3. **Booking Reminder** → Email + SMS (24hr before)
4. **Booking Cancelled** → Email + Push
5. **Booking Rescheduled** → Email + Push
6. **Request Pending** → Email to provider

#### **Implementation Steps:**

**Step 1: Email Service Setup (2 days)**
```javascript
// services/emailService.js

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendBookingConfirmation(booking, user, provider) {
  const msg = {
    to: user.email,
    from: 'noreply@findrhealth.com',
    subject: `Booking Confirmed - ${booking.bookingNumber}`,
    templateId: 'd-abc123...', // SendGrid template ID
    dynamicTemplateData: {
      userName: user.firstName,
      bookingNumber: booking.bookingNumber,
      providerName: provider.practiceName,
      serviceName: booking.service.name,
      appointmentDate: formatDate(booking.dateTime.requestedStart),
      appointmentTime: formatTime(booking.dateTime.requestedStart),
      teamMemberName: booking.teamMember?.name,
      phoneLastFour: user.phone.slice(-4)
    }
  };
  
  try {
    await sgMail.send(msg);
    console.log(`✅ Confirmation email sent to ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error('Email send failed:', error);
    return { success: false, error };
  }
}

module.exports = { sendBookingConfirmation };
```

**Step 2: SMS Service Setup (2 days)**
```javascript
// services/smsService.js

const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendBookingReminder(booking, user, provider) {
  const message = `Reminder: You have an appointment tomorrow at ${formatTime(booking.dateTime.requestedStart)} with ${provider.practiceName}. Confirmation #: ${booking.bookingNumber}. Reply CANCEL to cancel.`;
  
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: user.phone
    });
    
    console.log(`✅ SMS reminder sent to ${user.phone}`);
    return { success: true };
  } catch (error) {
    console.error('SMS send failed:', error);
    return { success: false, error };
  }
}

module.exports = { sendBookingReminder };
```

**Step 3: Notification Queue (3 days)**
```javascript
// services/notificationQueue.js

const Queue = require('bull');
const notificationQueue = new Queue('notifications', process.env.REDIS_URL);

// Add job to queue
async function scheduleBookingReminder(booking, user, provider) {
  const reminderTime = new Date(booking.dateTime.requestedStart);
  reminderTime.setHours(reminderTime.getHours() - 24); // 24 hours before
  
  await notificationQueue.add(
    'booking-reminder',
    { bookingId: booking._id, userId: user._id, providerId: provider._id },
    { delay: reminderTime - Date.now() }
  );
  
  console.log(`Reminder scheduled for ${reminderTime}`);
}

// Process jobs
notificationQueue.process('booking-reminder', async (job) => {
  const { bookingId, userId, providerId } = job.data;
  
  const booking = await Booking.findById(bookingId);
  const user = await User.findById(userId);
  const provider = await Provider.findById(providerId);
  
  if (booking.status === 'confirmed') {
    await sendBookingReminder(booking, user, provider);
    await sendEmailReminder(booking, user, provider);
  }
});

module.exports = { scheduleBookingReminder };
```

**Step 4: Integration Points (3 days)**
```javascript
// routes/bookings.js - Add after booking creation

// After successful booking
await booking.save();

// Send confirmation email + push
await sendBookingConfirmation(booking, patient, provider);
await sendPushNotification(patient, 'Booking Confirmed', 
  `Your appointment on ${formatDate(booking.dateTime.requestedStart)} is confirmed!`);

// Schedule reminder for 24hrs before
if (booking.status === 'confirmed') {
  await scheduleBookingReminder(booking, patient, provider);
}

// Notify provider if it's a request
if (booking.bookingType === 'request') {
  await sendProviderRequestNotification(provider, booking);
}
```

**Step 5: Testing (2 days)**
- [ ] Confirmation email sent on booking creation
- [ ] Push notification received on mobile
- [ ] SMS reminder sent 24hrs before appointment
- [ ] Provider notified of new requests
- [ ] Cancellation emails sent properly
- [ ] Reschedule emails sent properly
- [ ] Queue processes jobs correctly
- [ ] Failed notifications logged

---

### **Feature 4: Provider Confirmation UI** 👨‍⚕️

**Priority:** P1 (High)  
**Effort:** 1 week  
**Dependencies:** Feature 3 (Notifications)

#### **User Stories:**
1. As a **provider**, I want to see all pending booking requests
2. As a **provider**, I want to confirm or decline requests easily
3. As a **provider**, I want to propose alternative times if needed

#### **Implementation Steps:**

**Step 1: Provider Dashboard API (2 days)**
```javascript
// routes/bookingsAdmin.js

router.get('/provider/:providerId/pending', authenticateProvider, async (req, res) => {
  const bookings = await Booking.find({
    provider: req.params.providerId,
    status: 'pending_confirmation'
  })
  .populate('patient', 'firstName lastName email phone')
  .sort({ 'confirmation.expiresAt': 1 }); // Soonest expiring first
  
  // Calculate urgency
  const now = new Date();
  const enrichedBookings = bookings.map(b => {
    const expiresAt = new Date(b.confirmation.expiresAt);
    const hoursUntilExpiry = (expiresAt - now) / (1000 * 60 * 60);
    
    return {
      ...b.toObject(),
      urgency: hoursUntilExpiry < 4 ? 'high' : 
               hoursUntilExpiry < 12 ? 'medium' : 'low',
      hoursUntilExpiry: Math.max(0, hoursUntilExpiry).toFixed(1)
    };
  });
  
  res.json({ success: true, bookings: enrichedBookings });
});
```

**Step 2: Provider Web Dashboard (3 days)**
- Create admin portal at admin.findrhealth.com
- Pending requests table with urgency indicators
- Confirm/Decline/Reschedule actions
- Real-time updates via WebSocket

**Step 3: Testing (2 days)**
- [ ] Pending requests display correctly
- [ ] Urgency indicators accurate
- [ ] Confirm action works
- [ ] Decline action works
- [ ] Patient notified of provider action

---

## Timeline & Milestones

### **Week 1-2: Booking Cancellation**
- Days 1-3: Backend refund logic
- Days 4-5: Calendar event deletion
- Days 6-7: Frontend UI
- Days 8-10: Testing & bug fixes

### **Week 3-5: Booking Reschedule**
- Days 11-14: Backend reschedule logic
- Days 15-17: Calendar event update
- Days 18-21: Frontend flow
- Days 22-24: Testing & bug fixes

### **Week 3-4: Notification System** (Parallel)
- Days 11-12: Email service setup
- Days 13-14: SMS service setup
- Days 15-17: Notification queue
- Days 18-19: Integration
- Days 20-21: Testing

### **Week 6: Provider Confirmation UI**
- Days 22-23: Backend API
- Days 24-26: Web dashboard
- Days 27-28: Testing

### **Week 6: Integration & Launch**
- Days 29-30: End-to-end testing
- Deploy to staging
- User acceptance testing
- Production deployment

---

## Resource Requirements

### **Development Team:**
- 1 Backend Engineer (full-time, 6 weeks)
- 1 Frontend Engineer (full-time, 6 weeks)
- 1 QA Engineer (part-time, 2 weeks)

### **Infrastructure:**
- SendGrid account (Email service)
- Twilio account (SMS service)
- Redis instance (Queue system)
- Additional Railway resources

### **Third-Party Costs:**
- SendGrid: ~$20/month (12,000 emails)
- Twilio: ~$0.0075/SMS (~$100/month for 13k SMS)
- Redis: ~$20/month (Railway addon)
**Total Monthly Cost:** ~$140

---

## Risk Assessment

### **Technical Risks:**

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Calendar API rate limits | Medium | High | Implement retry logic, queue |
| Refund processing delays | Low | Medium | Async processing, status tracking |
| SMS delivery failures | Medium | Medium | Fallback to email, retry logic |
| Queue system downtime | Low | High | Redis persistence, monitoring |

### **Business Risks:**

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| User abuse of refunds | Low | Medium | Clear cancellation policy |
| Provider dissatisfaction | Low | High | Training, support documentation |
| Notification spam complaints | Medium | Low | Opt-out options, compliance |

---

## Success Metrics

### **Key Performance Indicators:**

1. **Cancellation Rate:** < 15% of bookings
2. **Reschedule Rate:** < 10% of bookings
3. **Notification Delivery:** > 98% success rate
4. **Provider Response Time:** < 6 hours average for requests
5. **User Satisfaction:** > 4.5/5 stars in app reviews

### **Monitoring:**
- Daily dashboard of cancellations/reschedules
- Weekly notification delivery reports
- Monthly provider response time analysis
- Quarterly user satisfaction surveys

---

## Rollout Strategy

### **Phase 2A: Internal Testing (Week 1-2)**
- Deploy to staging environment
- Internal team testing
- Fix critical bugs

### **Phase 2B: Beta Launch (Week 3-4)**
- Release to 10% of users
- Monitor metrics closely
- Gather user feedback
- Iterate quickly

### **Phase 2C: Full Launch (Week 5-6)**
- Release to all users
- Marketing announcement
- Support team training
- Monitor for issues

---

## Documentation Requirements

- [ ] API documentation (Swagger)
- [ ] User guide (cancellation/reschedule)
- [ ] Provider guide (request management)
- [ ] Support runbook (troubleshooting)
- [ ] Notification template library

---

## Next Steps

1. **Review & Approve** this plan with stakeholders
2. **Allocate Resources** (engineers, budget)
3. **Set Up Infrastructure** (SendGrid, Twilio, Redis)
4. **Create Jira Tickets** for all features
5. **Begin Sprint Planning** for Week 1-2

---

**Phase 2 Plan Status:** ✅ Complete - Ready to Execute  
**Approved By:** [Pending]  
**Start Date:** [TBD]  
**Estimated Completion:** [Start Date + 6 weeks]

---

**End of Document**
