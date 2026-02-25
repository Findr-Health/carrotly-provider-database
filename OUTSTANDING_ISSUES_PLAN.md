# FINDR HEALTH - OUTSTANDING ISSUES IMPLEMENTATION PLAN
## January 7, 2026

---

## Issue 1: Book Button from Category Screen (CRITICAL)

### Current Behavior
- User searches "labs" → sees providers with labs
- Taps "Labs" category → sees CategoryServicesScreen with all lab services
- Taps "Book" button → Error: "Provider not loaded. Pass provider data to BookingFlowScreen"

### Root Cause
```dart
// In category_services_screen.dart line 206:
onBook: () => context.push('/book/${offering.providerId}')

// But BookingFlowScreen router expects:
state.extra as ProviderModel  // OR
state.extra as Map<String, dynamic> with 'provider' key
```

The route `/book/:providerId` requires provider data via `extra`, but we're only passing the providerId in the URL.

### Solution Options

**Option A: Load provider in BookingFlowScreen if not passed (RECOMMENDED)**
```dart
// In BookingFlowScreen - add provider loading fallback
if (provider == null) {
  // Fetch from API using providerId
  final repository = ref.read(providerRepositoryProvider);
  provider = await repository.getProvider(providerId);
}
```

**Option B: Pass providerId and let service fetch it**
Update CategoryServicesScreen to use a different navigation approach.

### Implementation Plan
1. Locate BookingFlowScreen
2. Add fallback provider loading
3. Show loading indicator while fetching
4. Handle error case
5. Test booking flow from category

---

## Issue 2: Favorites Feature

### Requirements
- Favorite providers OR services
- Heart icon on provider cards
- Favorites screen to view all favorites
- Persist to backend

### Best Practice UX
```
┌─────────────────────────────────────────┐
│ Provider Card                     ♡     │  ← Empty heart = not favorited
│ WellNow Urgent Care                     │
│ Medical • 2.5 mi                        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Provider Card                     ♥     │  ← Filled heart = favorited
│ Summit Health                           │
│ Medical • 1.2 mi                        │
└─────────────────────────────────────────┘
```

### Implementation Plan

**Backend:**
```javascript
// User model update
favorites: {
  providers: [{ providerId: ObjectId, addedAt: Date }],
  services: [{ serviceId: String, providerId: ObjectId, addedAt: Date }]
}

// New endpoints:
POST /api/users/:userId/favorites/provider/:providerId
DELETE /api/users/:userId/favorites/provider/:providerId
GET /api/users/:userId/favorites
```

**Flutter:**
```dart
// New provider for favorites state
final favoritesProvider = StateNotifierProvider<FavoritesNotifier, FavoritesState>

// Update provider_card.dart - add heart icon
// Add onFavoriteTap callback
// Optimistic update (instant UI change, sync in background)
```

**Effort:** 3-4 hours

---

## Issue 3: Location Picker Issues

### Current Problems
1. "Use current location" shows "Loading..." or wrong name
2. Search for "New York" returns nothing
3. Places API autocomplete not working

### Root Cause Investigation Needed
- Check if Google Places API key is valid
- Verify API is enabled in Google Cloud Console
- Check if billing is set up
- Debug network requests

### Implementation Plan
1. Verify API key in `.env` or `AndroidManifest.xml`/`Info.plist`
2. Test Places API directly via curl
3. Check Flutter debugger for API errors
4. Fix autocomplete implementation
5. Add proper error handling/messages

**Files to check:**
- `lib/presentation/widgets/location_picker.dart`
- `lib/services/location_service.dart`
- `android/app/src/main/AndroidManifest.xml`
- `ios/Runner/Info.plist`

**Effort:** 2-3 hours

---

## Issue 4: Notifications Feature

### Requirements
- Push notifications for:
  - Booking confirmations
  - Appointment reminders (24h, 1h before)
  - Provider messages
  - Promotional offers
- In-app notification center
- Notification preferences

### Architecture
```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   BACKEND     │────▶│   FIREBASE    │────▶│  FLUTTER APP  │
│  (triggers)   │     │     FCM       │     │  (receives)   │
└───────────────┘     └───────────────┘     └───────────────┘
```

### Implementation Plan

**Phase 1: Firebase Setup**
1. Create Firebase project
2. Add iOS & Android apps
3. Configure FCM
4. Add GoogleService-Info.plist & google-services.json

**Phase 2: Backend**
```javascript
// User model - add FCM token
fcmTokens: [{ token: String, platform: String, lastUsed: Date }]

// New notification service
const admin = require('firebase-admin');
sendNotification(userId, title, body, data)

// Triggers:
- POST /api/bookings → send booking confirmation
- Cron job → send reminders
```

**Phase 3: Flutter**
```dart
// Dependencies
firebase_messaging: ^14.0.0
flutter_local_notifications: ^16.0.0

// NotificationService class
- requestPermission()
- getToken()
- handleMessage()
- showLocalNotification()

// NotificationCenterScreen
- List of past notifications
- Mark as read
- Deep link handling
```

**Effort:** 6-8 hours

---

## Issue 5: Terms of Service in Profile

### Requirements
- Show TOS document in profile/settings
- Link to current TOS version user accepted
- Display acceptance date

### Implementation Plan
1. Check if settings_screen.dart has TOS button
2. Create TOS viewer screen (WebView or Markdown)
3. Link to `Findr_Health_Patient_Terms_of_Service_v2_REVISED.docx`
4. Convert to HTML/Markdown for in-app display
5. Show acceptance timestamp from user record

**Backend data needed:**
```javascript
// User model should have:
tosAcceptance: {
  version: "2.0",
  acceptedAt: Date,
  ipAddress: String
}
```

**Effort:** 1 hour

---

## Issue 6: Settings Screen Buttons

### Buttons Needing Implementation

| Button | Status | Implementation |
|--------|--------|----------------|
| Biometric Login | ❌ | Use `local_auth` package |
| Push Notifications | ❌ | Toggle FCM subscription |
| Email Notifications | ❌ | User preference in backend |
| SMS Notifications | ❌ | User preference in backend |
| Privacy Settings | ❌ | Link to privacy policy |
| Account Deletion | ❌ | Confirmation + API call |
| Language | ❌ | Localization support |
| Dark Mode | ❌ | Theme toggle |

### Implementation Plan

**Biometric Login:**
```dart
// pubspec.yaml
local_auth: ^2.1.0

// In auth flow
final LocalAuthentication auth = LocalAuthentication();
final bool canAuthenticateWithBiometrics = await auth.canCheckBiometrics;
final bool didAuthenticate = await auth.authenticate(
  localizedReason: 'Please authenticate to continue',
);
```

**Notification Toggles:**
```dart
// SharedPreferences for local storage
// API call to update user preferences
PUT /api/users/:userId/preferences
{
  notifications: {
    push: true,
    email: false,
    sms: true
  }
}
```

**Account Deletion:**
```dart
// Confirmation dialog
// API call: DELETE /api/users/:userId
// Clear local storage
// Navigate to login
```

**Effort:** 3-4 hours

---

## Priority Matrix

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 🔴 P0 | Book button fix | 1 hr | Blocking core flow |
| 🔴 P0 | Location picker fix | 2 hrs | Core functionality |
| 🟡 P1 | Favorites feature | 4 hrs | User engagement |
| 🟡 P1 | Settings functionality | 3 hrs | User experience |
| 🟢 P2 | TOS in profile | 1 hr | Legal compliance |
| 🟢 P2 | Notifications | 8 hrs | Future feature |

---

## Recommended Implementation Order

### Day 1 (Today)
1. ✅ Fix Book button (1 hour)
2. ✅ Fix Location picker (2 hours)
3. ✅ TOS in profile (1 hour)

### Day 2
4. Favorites feature - backend (2 hours)
5. Favorites feature - Flutter (2 hours)
6. Settings buttons - biometrics & toggles (3 hours)

### Day 3+
7. Notifications - Firebase setup
8. Notifications - Backend integration
9. Notifications - Flutter implementation
10. Notifications - Testing & polish

---

## Next Steps

**Immediate Action Items:**

1. **For Book Button Fix:**
   ```bash
   # Locate and examine BookingFlowScreen
   find ~/Downloads/Findr_health_APP -name "*booking*flow*" -o -name "*BookingFlow*"
   
   # Check how provider is loaded
   grep -n "Provider not loaded" ~/Downloads/Findr_health_APP/lib -r
   ```

2. **For Location Picker:**
   ```bash
   # Check API key
   grep -n "GOOGLE_MAPS\|places\|API_KEY" ~/Downloads/Findr_health_APP -r
   
   # Check location service
   cat ~/Downloads/Findr_health_APP/lib/services/location_service.dart
   ```

---

Ready to start implementing? Let me know which issue to tackle first!
