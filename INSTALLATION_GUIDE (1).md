# Mobile App Updates - Complete Installation Guide
**Provider Appointments System - Patient/User Side**

---

## 📋 Overview

This guide provides step-by-step instructions to integrate the new provider appointments confirmation flow into your mobile app. The system allows:

- Patients create booking **requests** (not instant confirmations)
- Real-time WebSocket updates when providers respond
- Accept provider-suggested alternative times
- Handle declined bookings gracefully
- Push notifications for all booking updates

---

## 🎯 What Changes

### **Before (Old Flow)**
1. Patient books → Instantly confirmed ✅
2. Shows in provider calendar

### **After (New Flow)**
1. Patient books → **Request sent** ⏳
2. Provider receives notification
3. Provider confirms/declines/suggests times
4. **Patient gets real-time notification** 🔔
5. Patient accepts suggested time OR books different slot

---

## 📦 Prerequisites

### **Required Dependencies**

```bash
# Install required packages
npm install zustand date-fns date-fns-tz
npm install @notifee/react-native
npm install @react-native-firebase/messaging
npm install react-native-vector-icons

# iOS specific
cd ios && pod install && cd ..
```

### **Minimum Versions**
- React Native: 0.70+
- Node: 16+
- iOS: 12+
- Android: API Level 23+ (Android 6.0)

---

## 📂 File Structure

Create the following directory structure in your project:

```
src/
├── config/
│   └── api.ts (NEW)
├── services/
│   ├── websocket.service.ts (NEW)
│   ├── booking.service.ts (MODIFIED)
│   └── notification.service.ts (NEW)
├── store/
│   └── booking.store.ts (NEW)
├── components/
│   ├── BookingStatusBadge.tsx (NEW)
│   ├── BookingCard.tsx (MODIFIED)
│   └── SuggestedTimesModal.tsx (NEW)
└── screens/
    ├── MyBookingsScreen.tsx (MODIFIED)
    └── BookingDetailScreen.tsx (MODIFIED)
```

---

## 🔧 Step-by-Step Installation

### **Step 1: Copy Configuration File**

```bash
# Copy the config file
cp config/api.ts src/config/api.ts
```

**Action Required:** Update API URLs in `src/config/api.ts`:

```typescript
// Change these to your actual endpoints
BASE_URL: 'https://your-api-domain.com'
WS_URL: 'wss://your-api-domain.com/api/bookings/realtime'
```

---

### **Step 2: Add Services**

```bash
# Copy service files
cp services/websocket.service.ts src/services/websocket.service.ts
cp services/booking.service.ts src/services/booking.service.ts
cp services/notification.service.ts src/services/notification.service.ts
```

**No modifications needed** - services are ready to use.

---

### **Step 3: Add State Management**

```bash
# Copy store file
cp store/booking.store.ts src/store/booking.store.ts
```

The store auto-initializes WebSocket on creation. No additional setup needed.

---

### **Step 4: Add UI Components**

```bash
# Copy component files
cp components/BookingStatusBadge.tsx src/components/BookingStatusBadge.tsx
cp components/BookingCard.tsx src/components/BookingCard.tsx
cp components/SuggestedTimesModal.tsx src/components/SuggestedTimesModal.tsx
```

**Note:** Components use `react-native-vector-icons/Feather`. Make sure it's configured.

---

### **Step 5: Update Screens**

```bash
# Copy screen files
cp screens/MyBookingsScreen.tsx src/screens/MyBookingsScreen.tsx
```

**Action Required:** Add route to your navigation:

```typescript
// In your Stack Navigator
<Stack.Screen 
  name="MyBookings" 
  component={MyBookingsScreen}
  options={{ title: 'My Appointments' }}
/>
```

---

### **Step 6: Initialize Services in App.tsx**

Add initialization code to your main `App.tsx`:

```typescript
import { useEffect } from 'react';
import { pushNotificationService } from './services/notification.service';
import { bookingWebSocket } from './services/websocket.service';
import { useBookingStore } from './store/booking.store';

function App() {
  useEffect(() => {
    // Initialize push notifications
    pushNotificationService.initialize();

    // Store already initializes WebSocket automatically
    // But you can manually connect/disconnect as needed:
    // bookingWebSocket.connect();

    return () => {
      // Cleanup on unmount
      bookingWebSocket.disconnect();
    };
  }, []);

  // ... rest of your app
}
```

---

### **Step 7: Update Booking Creation Flow**

Find where you create bookings (e.g., `BookingConfirmationScreen.tsx`):

**Before:**
```typescript
const handleBookNow = async () => {
  const booking = await createBooking({
    ...bookingData,
    status: 'confirmed', // ❌ Old way
  });
  
  navigation.navigate('BookingSuccess');
};
```

**After:**
```typescript
import { useBookingStore } from '../store/booking.store';

const handleBookNow = async () => {
  const { createBooking } = useBookingStore();
  
  const booking = await createBooking({
    ...bookingData,
    // Status is automatically set to 'pending' by service
  });
  
  // Show success message
  Alert.alert(
    'Request Sent!',
    'Your booking request has been sent. The provider will respond within 24 hours.',
    [{ text: 'OK', onPress: () => navigation.navigate('MyBookings') }]
  );
};
```

---

### **Step 8: Configure Push Notifications**

#### **iOS Configuration:**

1. Enable Push Notifications capability in Xcode
2. Add to `ios/YourApp/AppDelegate.mm`:

```objective-c
#import <UserNotifications/UserNotifications.h>
#import <RNCPushNotificationIOS.h>

// Add before @implementation AppDelegate
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  [RNCPushNotificationIOS didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  [RNCPushNotificationIOS didFailToRegisterForRemoteNotificationsWithError:error];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [RNCPushNotificationIOS didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}
```

#### **Android Configuration:**

1. Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.VIBRATE"/>
```

2. Configure Firebase Cloud Messaging (FCM) following the official docs

---

### **Step 9: Test the Integration**

#### **Test Checklist:**

- [ ] App starts without errors
- [ ] WebSocket connects (check logs)
- [ ] Create a test booking
- [ ] Booking shows as "Pending" in My Bookings
- [ ] Have provider confirm booking (from provider portal)
- [ ] Receive push notification
- [ ] Booking updates to "Confirmed" in real-time
- [ ] Test declined booking with suggested times
- [ ] Accept a suggested time
- [ ] Test cancelling a booking

#### **Debug Commands:**

```bash
# View iOS logs
npx react-native log-ios

# View Android logs
npx react-native log-android

# Check for WebSocket connection
# Look for: "[BookingWS] Connected successfully"
```

---

## 🎨 UI Customization

### **Colors**

All colors are defined inline in StyleSheets. To customize:

1. Create a theme file: `src/theme/colors.ts`
2. Replace hardcoded colors in components
3. Example:

```typescript
// src/theme/colors.ts
export const colors = {
  primary: '#6366F1', // Indigo
  success: '#10B981', // Green
  warning: '#F59E0B', // Amber
  error: '#EF4444',   // Red
  // ... etc
};
```

---

## 🔔 Push Notification Setup

### **Backend Integration Required**

Your backend needs to send notifications. Example payload:

```json
{
  "to": "<USER_FCM_TOKEN>",
  "notification": {
    "title": "Appointment Confirmed!",
    "body": "Your appointment with Dr. Smith is confirmed."
  },
  "data": {
    "bookingId": "abc123",
    "type": "booking_confirmed",
    "action": "VIEW_BOOKING"
  }
}
```

The notification service automatically handles these payloads.

---

## 🐛 Troubleshooting

### **WebSocket Won't Connect**

**Issue:** `[BookingWS] Connection error`

**Solutions:**
1. Check API_URL in `config/api.ts`
2. Verify backend WebSocket is running
3. For local development on device: use your computer's IP instead of `localhost`
   ```typescript
   const WS_URL = __DEV__ 
     ? 'ws://192.168.1.100:3001/api/bookings/realtime' // Your IP
     : 'wss://production-url.com/api/bookings/realtime';
   ```

### **Push Notifications Not Working**

**iOS:**
- Check provisioning profile has Push Notification capability
- Verify APN certificate is configured in Firebase
- Test on physical device (simulator doesn't support push)

**Android:**
- Check `google-services.json` is in `android/app/`
- Verify Firebase project is configured correctly
- Check notification permissions are granted

### **Bookings Not Updating**

**Issue:** Status doesn't change when provider confirms

**Solutions:**
1. Check WebSocket connection: `bookingWebSocket.getConnectionState()`
2. Verify backend is broadcasting updates correctly
3. Check Redux/Zustand store is receiving updates
4. Enable debug logs: Set `FEATURES.DEBUG_MODE = true` in config

### **"Cannot read property of undefined" Errors**

**Issue:** `Cannot read property 'suggestedTimes' of undefined`

**Solution:**
- Add null checks in components
- Ensure booking data structure matches TypeScript interfaces
- Check API response format

---

## 📊 Performance Optimization

### **Reduce Re-renders**

```typescript
// Use memo for expensive components
import { memo } from 'react';

export const BookingCard = memo(({ booking, ...props }) => {
  // Component code
}, (prevProps, nextProps) => {
  // Only re-render if booking ID changed
  return prevProps.booking._id === nextProps.booking._id;
});
```

### **Lazy Loading**

```typescript
// Lazy load screens
const MyBookingsScreen = lazy(() => import('./screens/MyBookingsScreen'));
```

### **WebSocket Optimization**

```typescript
// Disconnect WebSocket when app is backgrounded
AppState.addEventListener('change', (state) => {
  if (state === 'background') {
    bookingWebSocket.disconnect();
  } else if (state === 'active') {
    bookingWebSocket.connect();
  }
});
```

---

## 🔒 Security Considerations

### **Token Security**

```typescript
// Never log tokens in production
if (__DEV__) {
  console.log('FCM Token:', token);
}
```

### **API Security**

- Always use HTTPS/WSS in production
- Validate user authentication before API calls
- Don't expose sensitive data in push notifications

---

## 📈 Analytics Integration

Track booking events for analytics:

```typescript
import { ANALYTICS_EVENTS } from './config/api';

// When booking is created
analytics().logEvent(ANALYTICS_EVENTS.BOOKING_CREATED, {
  serviceId: booking.serviceId,
  providerId: booking.providerId,
  price: booking.price,
});

// When booking is confirmed
analytics().logEvent(ANALYTICS_EVENTS.BOOKING_CONFIRMED, {
  bookingId: booking._id,
  confirmationType: 'provider_confirmed',
});
```

---

## 🚀 Deployment Checklist

Before releasing to production:

- [ ] Update API URLs to production endpoints
- [ ] Test on both iOS and Android
- [ ] Test with slow network (3G)
- [ ] Test with no network (offline handling)
- [ ] Test WebSocket reconnection
- [ ] Test push notifications on real devices
- [ ] Verify error messages are user-friendly
- [ ] Test with multiple concurrent bookings
- [ ] Verify timezone handling
- [ ] Test accessibility (VoiceOver/TalkBack)
- [ ] Run performance profiling
- [ ] Check memory leaks (WebSocket cleanup)

---

## 📝 Additional Resources

### **Documentation**
- [Zustand Docs](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Notifee Docs](https://notifee.app/react-native/docs/overview)
- [React Navigation](https://reactnavigation.org/)

### **Related Backend Files**
- Backend Installation Summary (see provider portal documentation)
- Backend API documentation
- WebSocket protocol documentation

---

## ✅ Success Criteria

After installation, you should have:

- ✅ Bookings start as "pending" status
- ✅ Real-time updates when provider responds
- ✅ Push notifications working
- ✅ Suggested times modal functioning
- ✅ Booking cancellation working
- ✅ WebSocket auto-reconnect working
- ✅ No console errors
- ✅ Smooth UI/UX transitions
- ✅ Proper error handling

---

## 💬 Support

If you encounter issues:

1. Check the Troubleshooting section above
2. Review error logs carefully
3. Verify all files were copied correctly
4. Check that dependencies are installed
5. Test backend endpoints independently

---

**Installation completed successfully when all tests pass and bookings flow works end-to-end!** 🎉
