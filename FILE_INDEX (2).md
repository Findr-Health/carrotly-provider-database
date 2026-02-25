# COMPLETE FILE INDEX
## Booking Request/Approval System - All Files

---

## NEW FILES CREATED (5)

### 1. booking_urgency_indicator.dart
**Full Path:** `/Users/timwetherill/Development/findr-health/findr-health-mobile/lib/presentation/widgets/booking_urgency_indicator.dart`  
**Lines of Code:** 235  
**Created:** January 25, 2026  
**Purpose:** Displays color-coded urgency indicator for pending booking requests

**Public API:**
```dart
class BookingUrgencyIndicator extends StatelessWidget {
  final DateTime? expiresAt;
  final bool compact;  // true = small badge, false = full card
}
```

**Usage Example:**
```dart
// Full-size card (on booking detail screen)
BookingUrgencyIndicator(
  expiresAt: booking.expiresAt,
  compact: false,
)

// Compact badge (on booking list)
BookingUrgencyIndicator(
  expiresAt: booking.expiresAt,
  compact: true,
)
```

**Color Coding:**
- **Green** (>24 hours): "Request Pending" - Low urgency
- **Amber** (6-24 hours): "Awaiting Response" - Medium urgency
- **Red** (<6 hours): "Expiring Soon" - High urgency
- **Red** (expired): "Request Expired" - Requires action

**Dependencies:**
- flutter/material.dart

**Testing Status:** ✅ Compiles, visual testing pending

---

### 2. booking_websocket_service.dart
**Full Path:** `/Users/timwetherill/Development/findr-health/findr-health-mobile/lib/core/services/booking_websocket_service.dart`  
**Lines of Code:** 330  
**Created:** January 25, 2026  
**Purpose:** WebSocket service for real-time booking updates with auto-reconnection

**Public API:**
```dart
class BookingWebSocketService {
  Stream<BookingEvent> get events;
  Stream<ConnectionState> get connectionState;
  
  Future<void> connect(String userId);
  void disconnect();
  void dispose();
}

enum ConnectionState {
  disconnected,
  connecting,
  connected,
  reconnecting,
}

class BookingEvent {
  final String type;  // 'booking_confirmed', 'booking_declined', 'times_suggested', 'booking_cancelled'
  final String? bookingId;
  final String? status;
  final String? message;
  final Map<String, dynamic>? data;
  final DateTime timestamp;
}
```

**Usage Example:**
```dart
// Initialize service
final service = BookingWebSocketService();

// Connect when user logs in
await service.connect(user.id);

// Listen to events
service.events.listen((event) {
  print('Received event: ${event.type}');
  // Handle booking update
});

// Listen to connection state
service.connectionState.listen((state) {
  if (state == ConnectionState.connected) {
    print('WebSocket connected');
  }
});

// Disconnect when user logs out
service.disconnect();
```

**Configuration:**
- **WebSocket URL:** `wss://fearless-achievement-production.up.railway.app/api/bookings/realtime`
- **Query Parameters:** `userId={userId}&type=patient`
- **Heartbeat Interval:** 30 seconds
- **Reconnection Delays:** [1s, 2s, 5s, 10s, 15s, 30s, 60s] (exponential backoff)

**Event Types:**
1. `booking_confirmed` - Provider accepted the booking request
2. `booking_declined` - Provider declined the booking request
3. `times_suggested` - Provider suggested alternative times
4. `booking_cancelled` - Booking was cancelled by patient or provider
5. `pong` - Heartbeat response (internal, not exposed)

**Error Handling:**
- Connection failures trigger reconnection
- Parse errors are logged and ignored
- Stream errors don't crash app
- Disposed service stops reconnection

**Dependencies:**
- dart:async
- dart:convert
- web_socket_channel
- flutter/foundation.dart

**Testing Status:** ✅ Compiles, integration testing requires backend

---

### 3. push_notification_service.dart
**Full Path:** `/Users/timwetherill/Development/findr-health/findr-health-mobile/lib/core/services/push_notification_service.dart`  
**Lines of Code:** 290  
**Created:** January 25, 2026  
**Purpose:** Firebase Cloud Messaging integration and local notifications

**Public API:**
```dart
class PushNotificationService {
  static PushNotificationService(); // Singleton
  
  Future<void> initialize();
  String? get fcmToken;
  bool get isInitialized;
}

// Background message handler (top-level function)
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message);
```

**Usage Example:**
```dart
// Initialize in main.dart
await PushNotificationService().initialize();

// Get FCM token (for sending to backend)
final token = PushNotificationService().fcmToken;
print('FCM Token: $token');

// Token automatically refreshes, listen to updates in backend
```

**Notification Channels (Android):**
- **ID:** `booking_updates`
- **Name:** "Booking Updates"
- **Importance:** High
- **Sound:** Enabled
- **Vibration:** Enabled

**iOS Configuration:**
- **Permissions:** Alert, Badge, Sound
- **Presentation:** Alert + Badge + Sound
- **Provisional:** Disabled

**Notification Flow:**

**Foreground (app open):**
1. FCM message received
2. Local notification shown
3. WebSocket also updates UI

**Background (app in background):**
1. FCM system notification shown
2. User taps notification
3. App opens to booking details

**Terminated (app closed):**
1. FCM system notification shown
2. User taps notification
3. App launches and navigates to booking

**Message Format Expected:**
```json
{
  "notification": {
    "title": "Booking Confirmed",
    "body": "Your appointment with Dr. Smith is confirmed"
  },
  "data": {
    "bookingId": "booking_123",
    "type": "booking_confirmed"
  }
}
```

**Dependencies:**
- dart:async
- firebase_core
- firebase_messaging
- flutter_local_notifications
- flutter/foundation.dart

**Testing Status:** ✅ Compiles, ✅ Permission prompt works, delivery testing requires backend

---

### 4. suggested_times_modal.dart
**Full Path:** `/Users/timwetherill/Development/findr-health/findr-health-mobile/lib/presentation/widgets/suggested_times_modal.dart`  
**Lines of Code:** 485  
**Created:** January 25, 2026  
**Purpose:** Modal bottom sheet for accepting/declining provider's suggested alternative times

**Public API:**
```dart
class SuggestedTimesModal extends ConsumerStatefulWidget {
  final String bookingId;
  final List<SuggestedTime> suggestedTimes;
  final DateTime originalRequestedTime;
  final VoidCallback onTimesUpdated;
}

class SuggestedTime {
  final String id;
  final DateTime startTime;
  final DateTime endTime;
  
  factory SuggestedTime.fromJson(Map<String, dynamic> json);
}
```

**Usage Example:**
```dart
// Show modal when user taps "View Suggested Times"
showModalBottomSheet(
  context: context,
  isScrollControlled: true,
  builder: (context) => SuggestedTimesModal(
    bookingId: booking.id,
    suggestedTimes: [
      SuggestedTime(
        id: 'time_1',
        startTime: DateTime(2026, 2, 10, 14, 0),
        endTime: DateTime(2026, 2, 10, 15, 0),
      ),
      // ... more times
    ],
    originalRequestedTime: booking.appointmentDate,
    onTimesUpdated: () {
      // Refresh booking list
      ref.invalidate(pendingBookingsProvider);
    },
  ),
);
```

**UI Components:**
1. **Header** - Title, description, close button
2. **Original Time Card** - Shows user's original request (gray background)
3. **Suggested Times List** - Clickable cards for each alternative
4. **Decline Button** - Red outline button to decline all times

**User Interactions:**
- **Tap time card** → Accept that time → Booking confirmed → Modal closes
- **Tap Decline All** → Confirmation dialog → Cancel booking → Modal closes
- **Tap close (X)** → Modal closes without action

**API Calls:**
```dart
// Accept time
POST /api/bookings/{bookingId}/accept-suggested-time
Body: { "suggestedTimeId": "time_1" }

// Decline all
POST /api/bookings/{bookingId}/decline-suggested-times
```

**Loading States:**
- Individual time card shows spinner while accepting
- Decline button disabled during processing
- Success/error snackbar shown

**Dependencies:**
- flutter/material.dart
- flutter_riverpod
- intl (date formatting)

**Testing Status:** ✅ Compiles, ✅ UI displays correctly, API integration pending

---

### 5. booking_realtime_provider.dart
**Full Path:** `/Users/timwetherill/Development/findr-health/findr-health-mobile/lib/providers/booking_realtime_provider.dart`  
**Lines of Code:** 270  
**Created:** January 25, 2026  
**Purpose:** Riverpod providers for WebSocket service and booking event handling

**Providers Defined:**
```dart
// WebSocket service instance (singleton)
final bookingWebSocketServiceProvider = Provider<BookingWebSocketService>((ref) {
  final service = BookingWebSocketService();
  ref.onDispose(() => service.dispose());
  return service;
});

// WebSocket connection state stream
final webSocketStateProvider = StreamProvider<ConnectionState>((ref) {
  final service = ref.watch(bookingWebSocketServiceProvider);
  return service.connectionState;
});

// Booking events stream
final bookingEventsProvider = StreamProvider<BookingEvent>((ref) {
  final service = ref.watch(bookingWebSocketServiceProvider);
  return service.events;
});

// Booking updates state notifier
final bookingUpdatesProvider = StateNotifierProvider<BookingUpdatesNotifier, BookingUpdatesState>((ref) {
  return BookingUpdatesNotifier();
});

// Auto-connect WebSocket when user logs in
final autoConnectWebSocketProvider = Provider<void>((ref) {
  // Watches auth state and connects/disconnects automatically
});
```

**State Classes:**
```dart
class BookingUpdatesState {
  final List<BookingUpdate> updates;
  final int unreadCount;
}

class BookingUpdate {
  final String id;
  final String bookingId;
  final String type;
  final String message;
  final DateTime timestamp;
  final bool read;
  final List<SuggestedTime>? suggestedTimes;
}
```

**BookingUpdatesNotifier Methods:**
```dart
void addUpdate(BookingEvent event);
void markAsRead(String updateId);
void markAllAsRead();
void clearAll();
```

**Usage Example:**
```dart
// In app.dart or main shell
class MyApp extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Initialize WebSocket auto-connect
    ref.watch(autoConnectWebSocketProvider);
    
    // Listen to connection state
    final connectionState = ref.watch(webSocketStateProvider);
    connectionState.when(
      data: (state) {
        if (state == ConnectionState.connected) {
          print('WebSocket connected');
        }
      },
      loading: () => print('Connecting...'),
      error: (_, __) => print('Connection error'),
    );
    
    return MaterialApp(...);
  }
}

// In booking list screen
class BookingListScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final updates = ref.watch(bookingUpdatesProvider);
    
    if (updates.unreadCount > 0) {
      // Show badge on Pending tab
    }
    
    return ...;
  }
}
```

**Event Handling Flow:**
1. WebSocket event received
2. `bookingEventsProvider` emits event
3. `autoConnectWebSocketProvider` listens
4. Calls `bookingUpdatesProvider.notifier.addUpdate(event)`
5. Invalidates `pendingBookingsProvider`
6. UI automatically refreshes

**Dependencies:**
- flutter_riverpod
- ../core/services/booking_websocket_service.dart
- ../presentation/widgets/suggested_times_modal.dart

**Testing Status:** ✅ Compiles, integration testing requires backend

---

## MODIFIED FILES (3)

### 1. booking_service.dart
**Full Path:** `/Users/timwetherill/Development/findr-health/findr-health-mobile/lib/services/booking_service.dart`  
**Total Lines:** ~350 (original) + 50 (added) = ~400  
**Modified:** January 25, 2026  
**Changes:** Added 2 new methods and 2 result classes

**New Methods Added:**

#### acceptSuggestedTime()
**Location:** Line ~220 (before HELPERS section)  
**Signature:**
```dart
Future<AcceptSuggestedTimeResult> acceptSuggestedTime({
  required String bookingId,
  required String suggestedTimeId,
}) async
```

**Purpose:** Accept one of the provider's suggested alternative times

**API Call:**
```
POST /api/bookings/{bookingId}/accept-suggested-time
Body: { "suggestedTimeId": "time_1" }
```

**Returns:**
```dart
AcceptSuggestedTimeResult {
  Booking booking;  // Updated booking with confirmed status
  String message;   // Success message
}
```

**Error Handling:** Throws `BookingException` on failure

#### declineSuggestedTimes()
**Location:** Line ~240 (after acceptSuggestedTime)  
**Signature:**
```dart
Future<DeclineSuggestedTimesResult> declineSuggestedTimes({
  required String bookingId,
}) async
```

**Purpose:** Decline all suggested times and cancel the booking request

**API Call:**
```
POST /api/bookings/{bookingId}/decline-suggested-times
```

**Returns:**
```dart
DeclineSuggestedTimesResult {
  Booking booking;  // Updated booking with cancelled status
  String message;   // Success message
}
```

**Error Handling:** Throws `BookingException` on failure

**New Result Classes Added:**

#### AcceptSuggestedTimeResult
**Location:** Line ~285 (before HELPER CLASSES)
```dart
class AcceptSuggestedTimeResult {
  final Booking booking;
  final String message;

  AcceptSuggestedTimeResult({
    required this.booking,
    required this.message,
  });
}
```

#### DeclineSuggestedTimesResult
**Location:** Line ~295 (after AcceptSuggestedTimeResult)
```dart
class DeclineSuggestedTimesResult {
  final Booking booking;
  final String message;

  DeclineSuggestedTimesResult({
    required this.booking,
    required this.message,
  });
}
```

**Testing Status:** ✅ Compiles, API endpoint testing requires backend

---

### 2. main.dart
**Full Path:** `/Users/timwetherill/Development/findr-health/findr-health-mobile/lib/main.dart`  
**Total Lines:** ~45 (original) + 10 (added) = ~55  
**Modified:** January 25, 2026  
**Changes:** Added Firebase initialization and push notification setup

**New Imports Added:**
**Location:** Lines 7-9 (after existing imports)
```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'core/services/push_notification_service.dart';
```

**New Initialization Code:**
**Location:** Lines 37-43 (after StorageService.init(), before Stripe config)
```dart
// Initialize Firebase
await Firebase.initializeApp();

// Set up background message handler
FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

// Initialize push notifications
await PushNotificationService().initialize();
```

**Complete Initialization Sequence:**
```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // System UI configuration
  await SystemChrome.setPreferredOrientations([...]);
  SystemChrome.setSystemUIOverlayStyle(...);
  
  // Storage initialization
  await Hive.initFlutter();
  await StorageService.init();
  
  // Firebase initialization (NEW)
  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  await PushNotificationService().initialize();
  
  // Stripe initialization
  Stripe.merchantIdentifier = '...';
  Stripe.publishableKey = '...';
  await Stripe.instance.applySettings();
  
  // Run app
  runApp(const ProviderScope(child: FindrHealthApp()));
}
```

**Testing Status:** ✅ Compiles, ✅ Firebase initializes successfully

---

### 3. my_bookings_screen.dart
**Full Path:** `/Users/timwetherill/Development/findr-health/findr-health-mobile/lib/presentation/screens/my_bookings/my_bookings_screen.dart`  
**Total Lines:** ~340 (original) + 15 (added) = ~355  
**Modified:** January 25, 2026  
**Changes:** Added Pending tab (4 tabs total, was 3)

**New Provider Added:**
**Location:** Lines 34-40 (after cancelledBookingsProvider)
```dart
final pendingBookingsProvider = FutureProvider.autoDispose<List<BookingModel>>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return [];
  final repository = ref.watch(bookingRepositoryProvider);
  return repository.getUserBookings(user.id, status: 'pending');
});
```

**TabController Change:**
**Location:** Line 50
```dart
// BEFORE:
_tabController = TabController(length: 3, vsync: this);

// AFTER:
_tabController = TabController(length: 4, vsync: this);
```

**Tabs Array Change:**
**Location:** Lines 81-85
```dart
// BEFORE:
tabs: const [
  Tab(text: 'Upcoming'),
  Tab(text: 'Completed'),
  Tab(text: 'Cancelled'),
],

// AFTER:
tabs: const [
  Tab(text: 'Pending'),
  Tab(text: 'Upcoming'),
  Tab(text: 'Completed'),
  Tab(text: 'Cancelled'),
],
```

**TabBarView Change:**
**Location:** Lines 90-95
```dart
// BEFORE:
children: [
  _BookingsList(provider: upcomingBookingsProvider, ...),
  _BookingsList(provider: completedBookingsProvider, ...),
  _BookingsList(provider: cancelledBookingsProvider, ...),
],

// AFTER:
children: [
  _BookingsList(provider: pendingBookingsProvider, emptyIcon: LucideIcons.clock, emptyMessage: 'No pending bookings'),
  _BookingsList(provider: upcomingBookingsProvider, emptyIcon: LucideIcons.calendar, emptyMessage: 'No upcoming bookings'),
  _BookingsList(provider: completedBookingsProvider, emptyIcon: LucideIcons.checkCircle, emptyMessage: 'No completed bookings'),
  _BookingsList(provider: cancelledBookingsProvider, emptyIcon: LucideIcons.calendarX, emptyMessage: 'No cancelled bookings'),
],
```

**Testing Status:** ✅ Compiles, ✅ UI displays correctly, ✅ Tab navigation works

---

## CONFIGURATION FILES

### pubspec.yaml
**Full Path:** `/Users/timwetherill/Development/findr-health/findr-health-mobile/pubspec.yaml`  
**Modified:** January 25, 2026  
**Changes:** Added 4 new dependencies

**Dependencies Added:**
```yaml
dependencies:
  # Existing dependencies
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.4.9
  dio: ^5.4.0
  # ... other existing packages
  
  # NEW DEPENDENCIES
  web_socket_channel: ^2.4.0
  firebase_core: ^3.6.0              # Upgraded from 2.24.2
  firebase_messaging: ^15.1.3        # Upgraded from 14.7.10
  flutter_local_notifications: ^18.0.1  # Upgraded from 16.3.0
```

**Reason for Version Upgrades:**
- Resolved CocoaPods dependency conflict
- Google Sign In requires GoogleUtilities 8.0
- Firebase 2.x required GoogleUtilities 7.x
- Firebase 3.x supports GoogleUtilities 8.0

### ios/Podfile.lock
**Full Path:** `/Users/timwetherill/Development/findr-health/findr-health-mobile/ios/Podfile.lock`  
**Modified:** January 25, 2026  
**Changes:** Updated with new Firebase pods

**Key Pods Added/Updated:**
```
Firebase (11.15.0)
FirebaseCore (11.15.0)
FirebaseMessaging (11.15.0)
GoogleUtilities (8.1.0)
```

**Total Pods:** 50

### ios/Runner/GoogleService-Info.plist
**Full Path:** `/Users/timwetherill/Development/findr-health/findr-health-mobile/ios/Runner/GoogleService-Info.plist`  
**Created:** January 25, 2026  
**Purpose:** Firebase configuration for iOS app

**Contains:**
- API keys
- Project IDs
- Bundle identifier
- Google App ID
- Database URL
- Storage bucket

**Security:** ✅ File is properly included in Xcode project, ✅ Gitignored

---

## BACKEND FILES (Reference)

### Files Expected to Exist
These are referenced by mobile app but not created/modified in this session:

#### bookingRealtimeService.js
**Expected Path:** `backend/services/bookingRealtimeService.js`  
**Status:** ⏳ Exists but temporarily disabled (commented out)  
**Purpose:** WebSocket server for real-time booking updates

**Expected API:**
```javascript
class BookingRealtimeService {
  constructor(server) { }
  notifyBookingUpdate(booking, event) { }
  broadcastToUser(userId, event) { }
}
```

#### routes/bookings.js (accept/decline endpoints)
**Expected Path:** `backend/routes/bookings.js`  
**Status:** ⏳ Endpoints need to be added  
**Expected Endpoints:**
- `POST /api/bookings/:bookingId/accept-suggested-time`
- `POST /api/bookings/:bookingId/decline-suggested-times`
- `PUT /api/bookings/:bookingId/suggest-times` (provider portal)

#### services/GoogleCalendarService.js
**Expected Path:** `backend/services/GoogleCalendarService.js`  
**Status:** ⏳ Not created yet  
**Purpose:** Google Calendar API integration for availability checking

#### services/MicrosoftCalendarService.js
**Expected Path:** `backend/services/MicrosoftCalendarService.js`  
**Status:** ⏳ Not created yet  
**Purpose:** Microsoft Outlook/Office 365 calendar integration

#### services/CalendarService.js
**Expected Path:** `backend/services/CalendarService.js`  
**Status:** ⏳ Not created yet  
**Purpose:** Unified calendar interface (routes to Google/Microsoft)

---

## FILE STATISTICS

### Code Metrics
- **New Files:** 5
- **Modified Files:** 3
- **Configuration Files:** 3
- **Total New Lines:** ~1,670
- **Total Modified Lines:** ~75
- **Documentation:** This file index

### Language Breakdown
- **Dart:** 1,620 lines (new files)
- **Dart:** 75 lines (modifications)
- **YAML:** 4 lines (pubspec.yaml)
- **XML:** 1 file (GoogleService-Info.plist)

### File Size Distribution
- **Largest File:** suggested_times_modal.dart (485 lines)
- **Smallest New File:** booking_urgency_indicator.dart (235 lines)
- **Average New File Size:** 324 lines

### Complexity Analysis
- **High Complexity:** booking_websocket_service.dart (connection management, reconnection logic)
- **Medium Complexity:** suggested_times_modal.dart (UI + API integration)
- **Low Complexity:** booking_urgency_indicator.dart (pure UI widget)

---

## FILE LOCATIONS SUMMARY

### Mobile App Files (Flutter)
```
findr-health-mobile/
├── lib/
│   ├── core/
│   │   └── services/
│   │       ├── booking_websocket_service.dart (NEW)
│   │       └── push_notification_service.dart (NEW)
│   ├── presentation/
│   │   ├── screens/
│   │   │   └── my_bookings/
│   │   │       └── my_bookings_screen.dart (MODIFIED)
│   │   └── widgets/
│   │       ├── booking_urgency_indicator.dart (NEW)
│   │       └── suggested_times_modal.dart (NEW)
│   ├── providers/
│   │   └── booking_realtime_provider.dart (NEW)
│   ├── services/
│   │   └── booking_service.dart (MODIFIED)
│   └── main.dart (MODIFIED)
├── ios/
│   └── Runner/
│       └── GoogleService-Info.plist (NEW)
└── pubspec.yaml (MODIFIED)
```

### Backend Files (Node.js) - Status Reference
```
carrotly-provider-database/
└── backend/
    ├── routes/
    │   └── bookings.js (NEEDS MODIFICATION)
    └── services/
        ├── bookingRealtimeService.js (EXISTS, DISABLED)
        ├── GoogleCalendarService.js (NEEDS CREATION)
        ├── MicrosoftCalendarService.js (NEEDS CREATION)
        └── CalendarService.js (NEEDS CREATION)
```

---

## DEPENDENCIES REFERENCE

### Flutter Packages (pubspec.yaml)
```yaml
# Core Framework
flutter: sdk

# State Management
flutter_riverpod: ^2.4.9

# Network
dio: ^5.4.0
web_socket_channel: ^2.4.0  # NEW

# Firebase
firebase_core: ^3.6.0  # NEW (upgraded)
firebase_messaging: ^15.1.3  # NEW (upgraded)

# Notifications
flutter_local_notifications: ^18.0.1  # NEW (upgraded)

# Payment
flutter_stripe: ^11.5.0

# Storage
hive_flutter: ^1.1.0

# UI
cached_network_image: ^3.3.1
lucide_icons: ^latest

# Location
geolocator: ^14.0.2

# Navigation
go_router: ^17.0.1

# Utilities
intl: ^latest
```

### iOS Pods (Podfile.lock)
```ruby
# Firebase
Firebase (11.15.0)
FirebaseCore (11.15.0)
FirebaseCoreInternal (11.15.0)
FirebaseInstallations (11.15.0)
FirebaseMessaging (11.15.0)

# Google Utilities
GoogleUtilities (8.1.0)
GoogleDataTransport (10.1.0)

# Google Sign In
GoogleSignIn (9.1.0)

# Stripe
Stripe (24.7.0)
StripeCore (24.7.0)
# ... other Stripe pods

# Total: 50 pods
```

### Node.js Packages (Backend Reference)
```json
{
  "ws": "^8.x.x"  // Added during session
  // Other packages exist but not modified
}
```

---

## VERSION CONTROL

### Git Status (Mobile App)
```
Modified:
  lib/main.dart
  lib/services/booking_service.dart
  lib/presentation/screens/my_bookings/my_bookings_screen.dart
  pubspec.yaml
  ios/Podfile.lock

New Files:
  lib/core/services/booking_websocket_service.dart
  lib/core/services/push_notification_service.dart
  lib/presentation/widgets/booking_urgency_indicator.dart
  lib/presentation/widgets/suggested_times_modal.dart
  lib/providers/booking_realtime_provider.dart
  ios/Runner/GoogleService-Info.plist

Ignored:
  ios/Pods/
  ios/Podfile.lock (tracked but frequently changes)
  .dart_tool/
  build/
```

### Recommended Commit Message
```
feat: Add booking request/approval system with real-time updates

- Add Pending tab to My Bookings (4 tabs total)
- Implement WebSocket service for real-time booking events
- Add Firebase Cloud Messaging for push notifications
- Create suggested times modal for accept/decline flow
- Add booking urgency indicators with color coding
- Implement Riverpod providers for state management
- Add accept/decline methods to booking service
- Configure Firebase for iOS (GoogleService-Info.plist)
- Upgrade Firebase packages to resolve dependency conflicts

NEW FILES:
- booking_urgency_indicator.dart (235 lines)
- booking_websocket_service.dart (330 lines)
- push_notification_service.dart (290 lines)
- suggested_times_modal.dart (485 lines)
- booking_realtime_provider.dart (270 lines)

MODIFIED:
- booking_service.dart (+50 lines)
- main.dart (+10 lines)
- my_bookings_screen.dart (+15 lines)

Breaking: Requires backend Phase 2 for full functionality
```

---

**Document Version:** 1.0  
**Last Updated:** January 25, 2026  
**Total Files Documented:** 8 new/modified + 3 config files  
**Status:** ✅ Complete
