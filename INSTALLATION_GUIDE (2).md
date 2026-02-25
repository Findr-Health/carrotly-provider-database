# 📱 FLUTTER BOOKING UPDATES - INSTALLATION GUIDE

**Professional-Grade Implementation for Findr Health Mobile App**  
**Status:** Production-Ready  
**Estimated Time:** 2-3 hours  
**Complexity:** Moderate  

---

## 🎯 WHAT THIS IMPLEMENTS

✅ **Pending Bookings Tab** - View all requests awaiting provider response  
✅ **Real-time Updates** - WebSocket connection for instant booking changes  
✅ **Push Notifications** - Firebase Cloud Messaging for booking updates  
✅ **Suggested Times** - Accept/decline provider-suggested alternative times  
✅ **Urgency Indicators** - Color-coded expiration warnings  
✅ **Payment Status** - Clear display of pre-authorized vs charged  

---

## 📋 PREREQUISITES

Before starting, ensure you have:

- [ ] Flutter SDK 3.0+ installed
- [ ] Xcode 14+ (for iOS)
- [ ] CocoaPods installed
- [ ] Firebase project created
- [ ] Access to Findr Health backend repository

---

## 📦 STEP 1: ADD DEPENDENCIES

**File:** `pubspec.yaml`

Add these dependencies under the `dependencies:` section:

```yaml
dependencies:
  # Existing dependencies...
  
  # NEW - For booking updates
  web_socket_channel: ^2.4.0
  firebase_core: ^2.24.2
  firebase_messaging: ^14.7.10
  flutter_local_notifications: ^16.3.0
```

Then run:

```bash
cd ~/Development/findr-health/findr-health-mobile
flutter pub get
```

---

## 📁 STEP 2: CREATE NEW FILES

Copy these 5 new files to your project:

### **1. Booking Urgency Indicator**
```bash
cp flutter-booking-updates/lib/presentation/widgets/booking_urgency_indicator.dart \
   ~/Development/findr-health/findr-health-mobile/lib/presentation/widgets/
```

### **2. Suggested Times Modal**
```bash
cp flutter-booking-updates/lib/presentation/widgets/suggested_times_modal.dart \
   ~/Development/findr-health/findr-health-mobile/lib/presentation/widgets/
```

### **3. WebSocket Service**
```bash
cp flutter-booking-updates/lib/core/services/booking_websocket_service.dart \
   ~/Development/findr-health/findr-health-mobile/lib/core/services/
```

### **4. Real-time Provider**
```bash
cp flutter-booking-updates/lib/providers/booking_realtime_provider.dart \
   ~/Development/findr-health/findr-health-mobile/lib/providers/
```

### **5. Push Notification Service**
```bash
cp flutter-booking-updates/lib/core/services/push_notification_service.dart \
   ~/Development/findr-health/findr-health-mobile/lib/core/services/
```

---

## 🔧 STEP 3: MODIFY EXISTING FILES

### **3.1 Update booking_service.dart**

**File:** `lib/services/booking_service.dart`

**Location:** After the `rescheduleBooking` method (around line 180)

**Add these two methods:**

```dart
// ==================== SUGGESTED TIMES ====================

/// Accept a provider-suggested time
Future<AcceptSuggestedTimeResult> acceptSuggestedTime({
  required String bookingId,
  required DateTime selectedDate,
  required String selectedTime,
}) async {
  try {
    final response = await _dio.post(
      '/bookings/$bookingId/accept-suggested-time',
      data: {
        'selectedDate': _formatDate(selectedDate),
        'selectedTime': selectedTime,
      },
    );

    return AcceptSuggestedTimeResult(
      booking: Booking.fromJson(response.data['booking']),
      message: response.data['message'] ?? 'Time accepted and booking confirmed',
    );
  } on DioException catch (e) {
    throw BookingException(_parseError(e));
  }
}

/// Decline all suggested times
Future<DeclineSuggestedTimesResult> declineSuggestedTimes({
  required String bookingId,
}) async {
  try {
    final response = await _dio.post(
      '/bookings/$bookingId/decline-suggested-times',
    );

    return DeclineSuggestedTimesResult(
      booking: Booking.fromJson(response.data['booking']),
      message: response.data['message'] ?? 'Booking request cancelled',
      refundAmount: (response.data['refundAmount'] ?? 0).toDouble(),
    );
  } on DioException catch (e) {
    throw BookingException(_parseError(e));
  }
}
```

**Then add these result classes after RescheduleResult (around line 230):**

```dart
class AcceptSuggestedTimeResult {
  final Booking booking;
  final String message;

  AcceptSuggestedTimeResult({
    required this.booking,
    required this.message,
  });
}

class DeclineSuggestedTimesResult {
  final Booking booking;
  final String message;
  final double refundAmount;

  DeclineSuggestedTimesResult({
    required this.booking,
    required this.message,
    required this.refundAmount,
  });
}
```

---

### **3.2 Update main.dart**

**File:** `lib/main.dart`

**Replace entire file with:**

```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'app.dart';
import 'core/services/storage_service.dart';
import 'core/services/push_notification_service.dart';

// Background message handler (must be top-level)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('[FCM] Background message: ${message.notification?.title}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
    statusBarBrightness: Brightness.light,
    systemNavigationBarColor: Colors.white,
    systemNavigationBarIconBrightness: Brightness.dark,
  ));

  // Initialize Firebase
  await Firebase.initializeApp();

  // Set up background message handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  // Initialize Hive
  await Hive.initFlutter();

  // Initialize storage service
  await StorageService.init();

  // Initialize Stripe
  Stripe.merchantIdentifier = 'merchant.com.findrhealth.app';
  Stripe.publishableKey = 'pk_test_51SVH0HRoHR2gRYs6H0Gr2sYNqVtq2PJMesd92y0ZBMBBoCrIiZRu19o338xwTunj8pp9wjyolhJ5Msm8w0TgUQBL00ucNYWN5u';
  await Stripe.instance.applySettings();

  // Initialize push notifications
  final pushService = PushNotificationService();
  await pushService.initialize();

  // Run app
  runApp(
    const ProviderScope(
      child: FindrHealthApp(),
    ),
  );
}
```

---

### **3.3 Update my_bookings_screen.dart**

**File:** `lib/presentation/screens/my_bookings/my_bookings_screen.dart`

**This is the most complex update. Follow carefully:**

#### **A. Add imports (at top of file):**

```dart
import '../../../widgets/booking_urgency_indicator.dart';
import '../../../widgets/suggested_times_modal.dart';
import '../../../providers/booking_realtime_provider.dart';
```

#### **B. Add pending bookings provider (after line 17):**

```dart
final pendingBookingsProvider = FutureProvider.autoDispose<List<BookingModel>>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return [];
  final repository = ref.watch(bookingRepositoryProvider);
  return repository.getUserBookings(user.id, status: 'pending');
});
```

#### **C. Update TabController length (line ~50):**

Change from:
```dart
_tabController = TabController(length: 3, vsync: this);
```

To:
```dart
_tabController = TabController(length: 4, vsync: this);
```

#### **D. Update TabBar tabs (line ~80):**

Change from:
```dart
tabs: const [
  Tab(text: 'Upcoming'),
  Tab(text: 'Completed'),
  Tab(text: 'Cancelled'),
],
```

To:
```dart
tabs: const [
  Tab(text: 'Pending'),    // NEW - First position
  Tab(text: 'Upcoming'),
  Tab(text: 'Completed'),
  Tab(text: 'Cancelled'),
],
```

#### **E. Update TabBarView (line ~95):**

Change from:
```dart
children: [
  _BookingsList(provider: upcomingBookingsProvider, ...),
  _BookingsList(provider: completedBookingsProvider, ...),
  _BookingsList(provider: cancelledBookingsProvider, ...),
],
```

To:
```dart
children: [
  _PendingBookingsList(provider: pendingBookingsProvider), // NEW
  _BookingsList(provider: upcomingBookingsProvider, emptyIcon: LucideIcons.calendar, emptyMessage: 'No upcoming bookings'),
  _BookingsList(provider: completedBookingsProvider, emptyIcon: LucideIcons.checkCircle, emptyMessage: 'No completed bookings'),
  _BookingsList(provider: cancelledBookingsProvider, emptyIcon: LucideIcons.calendarX, emptyMessage: 'No cancelled bookings'),
],
```

#### **F. Add new widget classes (at end of file):**

See `MODIFICATIONS_my_bookings_screen.dart.txt` for the complete _PendingBookingsList and _PendingBookingCard widgets (approx. 200 lines).

---

## 🔥 STEP 4: FIREBASE SETUP

### **4.1 iOS Setup**

1. **Download** `GoogleService-Info.plist` from Firebase Console
2. **Add to Xcode:**
   - Open `ios/Runner.xcworkspace` in Xcode
   - Drag `GoogleService-Info.plist` into Runner folder
   - Ensure "Copy items if needed" is checked

3. **Update Info.plist:**

Open `ios/Runner/Info.plist` and add:

```xml
<key>FirebaseAppDelegateProxyEnabled</key>
<false/>
```

4. **Update AppDelegate.swift:**

Open `ios/Runner/AppDelegate.swift` and update:

```swift
import UIKit
import Flutter
import FirebaseCore
import FirebaseMessaging

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    FirebaseApp.configure()
    
    if #available(iOS 10.0, *) {
      UNUserNotificationCenter.current().delegate = self
    }
    
    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
  
  override func application(_ application: UIApplication,
                            didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    Messaging.messaging().apnsToken = deviceToken
    super.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }
}
```

5. **Add Capabilities:**
   - Open project in Xcode
   - Select Runner target
   - Go to "Signing & Capabilities"
   - Click "+ Capability"
   - Add "Push Notifications"
   - Add "Background Modes"
   - Check "Remote notifications"

---

### **4.2 Android Setup**

1. **Download** `google-services.json` from Firebase Console
2. **Place** in `android/app/google-services.json`

3. **Update** `android/build.gradle`:

```gradle
dependencies {
    classpath 'com.android.tools.build:gradle:7.3.0'
    classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
    classpath 'com.google.gms:google-services:4.3.15' // ADD THIS LINE
}
```

4. **Update** `android/app/build.gradle`:

Add at the bottom of the file:
```gradle
apply plugin: 'com.google.gms.google-services'
```

---

## 🧪 STEP 5: TEST THE IMPLEMENTATION

### **5.1 Build and Run**

```bash
cd ~/Development/findr-health/findr-health-mobile

# Clean build
flutter clean
flutter pub get

# iOS
flutter run -d ios

# Or Android
flutter run -d android
```

### **5.2 Test Checklist**

- [ ] App launches without errors
- [ ] My Bookings screen shows 4 tabs (Pending, Upcoming, Completed, Cancelled)
- [ ] Pending tab displays correctly
- [ ] Create a test booking (should show as pending)
- [ ] WebSocket connects (check console logs)
- [ ] Push notification permission requested

### **5.3 Test Real-time Updates**

1. **Create a pending booking** from the app
2. **From provider portal**, confirm the booking
3. **On mobile app**, you should see:
   - Push notification: "🎉 Appointment Confirmed!"
   - Booking moves from Pending → Upcoming tab
   - Payment status changes to "Charged"

### **5.4 Test Suggested Times**

1. **Create a pending booking** from the app
2. **From provider portal**, suggest alternative times
3. **On mobile app**, you should see:
   - Push notification: "📅 Alternative Times Available"
   - "View X Suggested Times" button on booking card
   - Modal opens with suggested times
   - Can accept or decline

---

## 🚀 STEP 6: PRODUCTION DEPLOYMENT

### **6.1 Update API URLs**

**File:** `lib/core/services/booking_websocket_service.dart`

Ensure production URL is used:
```dart
final wsUrl = _buildWebSocketUrl(userId);
// Should connect to: wss://fearless-achievement-production.up.railway.app/api/bookings/realtime
```

### **6.2 Configure Push Notifications**

**Upload APNs Certificate** (iOS):
- Go to Firebase Console → Project Settings → Cloud Messaging
- Upload APNs Authentication Key

**Configure FCM** (Android):
- Already configured via google-services.json

### **6.3 Test in TestFlight**

1. **Build for TestFlight:**
   ```bash
   flutter build ios --release
   ```

2. **Archive in Xcode:**
   - Open `ios/Runner.xcworkspace`
   - Product → Archive
   - Upload to App Store Connect

3. **Test thoroughly:**
   - Install from TestFlight
   - Test all booking flows
   - Test push notifications on real device

---

## 🐛 TROUBLESHOOTING

### **WebSocket not connecting**

**Check:**
1. Console logs show connection attempts
2. Backend is running and accessible
3. User ID is valid

**Fix:**
```dart
// Add debug logs in booking_websocket_service.dart
if (kDebugMode) {
  print('[WebSocket] Connecting to: $wsUrl');
}
```

### **Push notifications not working**

**iOS:**
1. Check Info.plist has FirebaseAppDelegateProxyEnabled
2. Verify APNs certificate uploaded to Firebase
3. Check device has notification permission

**Android:**
1. Verify google-services.json is in android/app/
2. Check google-services plugin is applied
3. Verify FCM server key in Firebase Console

### **Suggested times not showing**

**Check:**
1. Backend sending suggested times in correct format
2. WebSocket event received (check logs)
3. Provider returns suggestedTimes array

---

## ✅ VERIFICATION CHECKLIST

Before marking as complete:

- [ ] All 5 new files added
- [ ] All 3 existing files modified correctly
- [ ] Dependencies installed (`flutter pub get`)
- [ ] Firebase configured (iOS + Android)
- [ ] App builds without errors
- [ ] Pending tab displays
- [ ] WebSocket connects
- [ ] Push notifications work
- [ ] Suggested times modal works
- [ ] Urgency indicators display correctly
- [ ] Payment status shows correctly
- [ ] Tested end-to-end booking flow

---

## 📞 SUPPORT

**If you encounter issues:**

1. Check console logs for errors
2. Verify all files are in correct locations
3. Ensure Firebase is configured correctly
4. Test WebSocket connection separately

**Common issues:**
- Import errors → Run `flutter pub get`
- Firebase errors → Check google-services files
- WebSocket errors → Check backend URL
- Build errors → Run `flutter clean`

---

**Installation Complete!** 🎉

Your Flutter app now has world-class booking request functionality with real-time updates and push notifications.

**Next Steps:**
1. Test thoroughly on TestFlight
2. Monitor logs for any issues
3. Deploy to production when ready

---

*Last Updated: January 26, 2026*  
*Version: 1.0*  
*Status: Production-Ready*
