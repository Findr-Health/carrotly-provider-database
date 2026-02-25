# DEEP LINKING IMPLEMENTATION PLAN
## Findr Health - Navigate from Notifications to Bookings

**Created:** January 17, 2026  
**Priority:** P1 - HIGH  
**Estimated Time:** 2-3 hours  
**Engineering Standard:** World-class, production-ready

---

## 📋 OVERVIEW

### Current State
- ✅ Notification system working (email + in-app)
- ✅ NotificationProvider fetches notifications
- ✅ NotificationsScreen displays list
- ❌ Tapping notifications does nothing

### Desired State
- ✅ Tap notification → Navigate to booking detail
- ✅ Tap notification → Navigate to provider profile
- ✅ Handle deleted/invalid bookings gracefully
- ✅ Update notification as read on navigation

---

## 🎯 TECHNICAL APPROACH

### Navigation Architecture
```
User taps notification
     ↓
Parse actionUrl from notification data
     ↓
Determine route type (booking/provider/etc)
     ↓
Use go_router to navigate
     ↓
Mark notification as read
     ↓
Show appropriate detail screen
```

### Deep Link URL Structure
```
/booking/:bookingId          → BookingDetailScreen
/provider/:providerId        → ProviderDetailScreen  
/my-bookings                 → MyBookingsScreen
/my-bookings?tab=upcoming    → MyBookingsScreen (upcoming tab)
/my-bookings?tab=completed   → MyBookingsScreen (completed tab)
```

---

## 📁 FILES TO MODIFY

### 1. Notification Model (Add actionUrl)
**File:** `lib/data/models/notification_model.dart`

**Changes:**
- Add `actionUrl` field (if not present)
- Add `actionType` field (booking/provider/general)
- Parse from API response

**Current:**
```dart
class NotificationModel {
  final String id;
  final String title;
  final String body;
  final DateTime createdAt;
  final bool read;
  // ... other fields
}
```

**New:**
```dart
class NotificationModel {
  final String id;
  final String title;
  final String body;
  final DateTime createdAt;
  final bool read;
  final String? actionUrl;        // NEW
  final String? actionType;       // NEW (booking/provider/general)
  final Map<String, dynamic>? data; // NEW - additional data
}
```

---

### 2. Router Configuration
**File:** `lib/core/router/app_router.dart`

**Changes:**
- Add route for `/booking/:id`
- Ensure provider route exists
- Handle query parameters

**Implementation:**
```dart
GoRoute(
  path: '/booking/:id',
  builder: (context, state) {
    final bookingId = state.pathParameters['id']!;
    return BookingDetailScreen(bookingId: bookingId);
  },
),

GoRoute(
  path: '/provider/:id',
  builder: (context, state) {
    final providerId = state.pathParameters['id']!;
    return ProviderDetailScreen(providerId: providerId);
  },
),

GoRoute(
  path: '/my-bookings',
  builder: (context, state) {
    final tab = state.uri.queryParameters['tab'];
    return MyBookingsScreen(initialTab: tab);
  },
),
```

---

### 3. Notification Tap Handler
**File:** `lib/presentation/screens/notifications/notifications_screen.dart`

**Changes:**
- Add `onNotificationTap` method
- Parse actionUrl and navigate
- Mark notification as read
- Handle errors gracefully

**Implementation:**
```dart
Future<void> _onNotificationTap(NotificationModel notification) async {
  try {
    // Mark as read immediately
    if (!notification.read) {
      await ref.read(notificationProvider.notifier).markAsRead(notification.id);
    }
    
    // Parse and navigate
    if (notification.actionUrl != null && notification.actionUrl!.isNotEmpty) {
      final uri = Uri.parse(notification.actionUrl!);
      
      // Navigate using go_router
      if (mounted) {
        context.go(notification.actionUrl!);
      }
    } else {
      // No action URL - just mark as read
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Notification marked as read')),
        );
      }
    }
  } catch (e) {
    print('Error handling notification tap: $e');
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open notification')),
      );
    }
  }
}
```

**Wire it up:**
```dart
// In the notification list
ListTile(
  onTap: () => _onNotificationTap(notification),
  // ... other properties
)
```

---

### 4. Backend - Ensure actionUrl is Sent
**File:** `backend/services/NotificationService.js`

**Verification Needed:**
- Check if `actionUrl` is included in notification creation
- Ensure format matches Flutter expectations

**Expected format:**
```javascript
{
  recipientId: userId,
  recipientType: 'user',
  type: 'booking_confirmed',
  title: 'Booking Confirmed',
  body: 'Your appointment has been confirmed',
  actionUrl: '/booking/123456',  // THIS
  data: {
    bookingId: '123456',
    providerId: '789',
    // ... other data
  }
}
```

---

### 5. Create BookingDetailScreen (if doesn't exist)
**File:** `lib/presentation/screens/booking/booking_detail_screen.dart`

**Purpose:** Show full booking details when navigating from notification

**Features:**
- Fetch booking by ID from API
- Show provider info, service, date/time
- Show booking status with timeline
- Actions: Cancel, Reschedule (if applicable)
- Handle booking not found

**Skeleton:**
```dart
class BookingDetailScreen extends ConsumerStatefulWidget {
  final String bookingId;
  
  const BookingDetailScreen({required this.bookingId, super.key});
  
  @override
  ConsumerState<BookingDetailScreen> createState() => _BookingDetailScreenState();
}

class _BookingDetailScreenState extends ConsumerState<BookingDetailScreen> {
  bool _isLoading = true;
  BookingModel? _booking;
  String? _error;
  
  @override
  void initState() {
    super.initState();
    _loadBooking();
  }
  
  Future<void> _loadBooking() async {
    try {
      setState(() => _isLoading = true);
      final booking = await ref.read(bookingApiServiceProvider).getBookingById(widget.bookingId);
      setState(() {
        _booking = booking;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    if (_isLoading) return LoadingScreen();
    if (_error != null) return ErrorScreen(error: _error!);
    if (_booking == null) return NotFoundScreen();
    
    // Build booking detail UI
    return Scaffold(
      appBar: AppBar(title: Text('Booking Details')),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Provider info
            // Service details
            // Date/time
            // Status timeline
            // Actions (cancel/reschedule)
          ],
        ),
      ),
    );
  }
}
```

---

## 🔄 IMPLEMENTATION WORKFLOW

### Phase 1: Model Updates (15 min)
1. Update `NotificationModel` with actionUrl
2. Update fromJson/toJson methods
3. Run `flutter analyze`

### Phase 2: Router Setup (20 min)
1. Add `/booking/:id` route
2. Verify `/provider/:id` route exists
3. Add `/my-bookings` with query params
4. Test navigation manually

### Phase 3: Backend Verification (15 min)
1. Check NotificationService.js includes actionUrl
2. Verify format matches Flutter expectations
3. Test notification creation via Postman/API

### Phase 4: Tap Handler (30 min)
1. Implement `_onNotificationTap` in NotificationsScreen
2. Add error handling
3. Add loading indicator
4. Wire up to ListTile

### Phase 5: BookingDetailScreen (60 min)
1. Create screen if doesn't exist
2. Implement booking fetch by ID
3. Add UI components
4. Add error states
5. Test with valid/invalid IDs

### Phase 6: Testing (30 min)
1. Test each notification type
2. Test deleted booking handling
3. Test network errors
4. Test mark-as-read flow
5. Test back navigation

### Phase 7: Polish (15 min)
1. Add loading indicators
2. Add success feedback
3. Add animations (optional)
4. Final `flutter analyze`
5. Build and test

**Total Estimated Time:** 2-3 hours

---

## 🧪 TEST SCENARIOS

### Scenario 1: Booking Confirmed Notification
```
1. Create booking request
2. Provider confirms
3. User receives notification
4. Tap notification
Expected: Navigate to booking detail, show confirmed status
```

### Scenario 2: Reschedule Proposed Notification
```
1. Provider proposes reschedule
2. User receives notification
3. Tap notification
Expected: Navigate to booking detail, show reschedule options
```

### Scenario 3: Deleted Booking
```
1. Create notification for booking X
2. Delete booking X from database
3. Tap notification
Expected: Show "Booking not found" error, don't crash
```

### Scenario 4: Network Error
```
1. Turn off internet
2. Tap notification
Expected: Show network error, option to retry
```

### Scenario 5: Already Read Notification
```
1. Mark notification as read manually
2. Tap notification
Expected: Still navigate, don't mark as read again
```

---

## 🛡️ ERROR HANDLING

### Invalid Booking ID
```dart
try {
  final booking = await api.getBookingById(id);
} catch (e) {
  if (e is NotFoundException) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Booking Not Found'),
        content: Text('This booking may have been cancelled or deleted.'),
        actions: [
          TextButton(
            onPressed: () => context.go('/my-bookings'),
            child: Text('View All Bookings'),
          ),
        ],
      ),
    );
  }
}
```

### Network Error
```dart
try {
  final booking = await api.getBookingById(id);
} catch (e) {
  if (e is NetworkException) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Network error. Please try again.'),
        action: SnackBarAction(
          label: 'Retry',
          onPressed: () => _loadBooking(),
        ),
      ),
    );
  }
}
```

### Malformed actionUrl
```dart
try {
  final uri = Uri.parse(notification.actionUrl!);
  context.go(notification.actionUrl!);
} catch (e) {
  print('Invalid actionUrl: ${notification.actionUrl}');
  ScaffoldMessenger.of(context).showSnackBar(
    const SnackBar(content: Text('Invalid notification link')),
  );
}
```

---

## 📊 SUCCESS CRITERIA

- [ ] Tapping notification navigates to correct screen
- [ ] Notification marked as read after tap
- [ ] Deleted bookings handled gracefully
- [ ] Network errors show user-friendly messages
- [ ] Back button returns to notifications
- [ ] All notification types work (confirmed, declined, reschedule, etc.)
- [ ] No crashes on edge cases
- [ ] `flutter analyze` returns 0 errors
- [ ] iOS build successful
- [ ] End-to-end flow tested

---

## 🔗 API ENDPOINTS NEEDED

### Get Booking by ID
```
GET /api/bookings/:id
Headers: Authorization: Bearer {token}

Response:
{
  "id": "123456",
  "providerId": "789",
  "serviceId": "abc",
  "appointmentDate": "2026-01-20T14:00:00Z",
  "status": "confirmed",
  // ... full booking object
}
```

**Verify this endpoint exists in backend!**

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying deep linking:

1. [ ] Backend verification
   - [ ] actionUrl included in all notification types
   - [ ] GET /api/bookings/:id endpoint exists
   - [ ] Proper error handling for not found

2. [ ] Flutter implementation
   - [ ] All routes registered
   - [ ] Error handling complete
   - [ ] Loading states added
   - [ ] Mark-as-read working

3. [ ] Testing
   - [ ] All test scenarios passed
   - [ ] Edge cases handled
   - [ ] No crashes

4. [ ] Code quality
   - [ ] `flutter analyze` = 0 errors
   - [ ] No technical debt
   - [ ] Comments added for complex logic

5. [ ] Build
   - [ ] iOS build successful
   - [ ] Test on device

---

## 📝 IMPLEMENTATION NOTES

### Notification Data Structure (Expected from Backend)
```json
{
  "id": "notif_123",
  "recipientId": "user_456",
  "recipientType": "user",
  "type": "booking_confirmed",
  "title": "Booking Confirmed",
  "body": "Your appointment with Dr. Smith has been confirmed for Jan 20 at 2:00 PM",
  "actionUrl": "/booking/booking_789",
  "data": {
    "bookingId": "booking_789",
    "providerId": "provider_123",
    "status": "confirmed"
  },
  "read": false,
  "createdAt": "2026-01-17T20:00:00Z"
}
```

### Router Path Examples
```dart
// Valid paths that should work:
context.go('/booking/123456');
context.go('/provider/789');
context.go('/my-bookings');
context.go('/my-bookings?tab=upcoming');
```

### Mark as Read API Call
```dart
// Already implemented in NotificationProvider
await ref.read(notificationProvider.notifier).markAsRead(notificationId);
```

---

## 🎯 NEXT STEPS AFTER IMPLEMENTATION

1. **TestFlight Testing**
   - Test deep linking on real devices
   - Test all notification types
   - Get user feedback

2. **Analytics** (Future)
   - Track which notifications get tapped
   - Measure conversion rates
   - Identify most engaging notification types

3. **Push Notifications** (Future Phase 2)
   - Extend deep linking to Firebase push notifications
   - Handle app closed → notification tap → deep link

---

## 🔧 TROUBLESHOOTING

### Issue: Navigation not working
**Check:**
- Router has the route registered
- actionUrl format is correct
- `context` is still mounted
- go_router package is up to date

### Issue: Notification not marked as read
**Check:**
- API endpoint returns success
- Provider state updates
- UI refreshes after state change

### Issue: Booking detail shows loading forever
**Check:**
- API endpoint exists and returns data
- BookingId is valid
- Network connection
- Error handling catches issues

---

*Plan Version: 1.0*  
*Created: January 17, 2026*  
*Estimated Implementation Time: 2-3 hours*  
*Status: Ready to implement*
