# FINDR HEALTH - OUTSTANDING ISSUES
## Updated: January 7, 2026

---

## ✅ COMPLETED ISSUES

### Issue 1: Book Button from Category Screen
**Status:** ✅ FIXED (Jan 7, 2026)

**Root Cause:** 
- `_loadProvider()` in `BookingFlowScreen` had a TODO placeholder that was never implemented
- When provider wasn't passed via `state.extra`, it showed error instead of fetching

**Solution Implemented (Option C - Service ID Lookup):**
```dart
// 1. Added preSelectedServiceId parameter to BookingFlowScreen
final String? preSelectedServiceId;

// 2. Updated _loadProvider() to lookup service after provider loads
if (widget.preSelectedServiceId != null && loadedProvider != null) {
  serviceToSelect = loadedProvider.services.firstWhere(
    (s) => s.id == widget.preSelectedServiceId,
  );
  if (serviceToSelect != null) {
    _selectedService = serviceToSelect;
    _currentStep = BookingStep.team;  // Skip to step 2
  }
}

// 3. CategoryServicesScreen passes serviceId via extra
onBook: () => context.push('/book/${offering.providerId}', 
  extra: {'serviceId': offering.serviceId})
```

**Files Modified:**
- `lib/presentation/screens/booking/booking_flow_screen.dart`
- `lib/core/router/app_router.dart`
- `lib/presentation/screens/category/category_services_screen.dart`

---

## 🔴 P0 - CRITICAL (None Remaining)

All critical issues resolved! ✅

---

## 🟡 P1 - HIGH PRIORITY

### Issue 2: Location Picker Issues
**Status:** ❌ NOT STARTED
**Effort:** 2-3 hours

**Current Problems:**
1. "Use current location" shows "Loading..." or wrong name
2. Search for "New York" returns nothing
3. Places API autocomplete not working

**Root Cause Investigation Needed:**
```bash
# Check API key
grep -n "GOOGLE_MAPS\|places\|API_KEY" ~/Downloads/Findr_health_APP -r

# Check location service
cat ~/Downloads/Findr_health_APP/lib/services/location_service.dart

# Test Places API directly
curl "https://maps.googleapis.com/maps/api/place/autocomplete/json?input=New%20York&key=YOUR_API_KEY"
```

**Files to Check:**
- `lib/presentation/widgets/location_picker.dart`
- `lib/services/location_service.dart`
- `android/app/src/main/AndroidManifest.xml`
- `ios/Runner/Info.plist`

---

### Issue 3: Favorites Feature
**Status:** ❌ NOT STARTED
**Effort:** 3-4 hours

**Requirements:**
- Heart icon on provider cards (filled = favorited)
- Tap to toggle favorite status
- Favorites screen shows all favorites
- Persist to backend

**Backend Changes:**
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

**Flutter Changes:**
```dart
// New provider for favorites state
final favoritesProvider = StateNotifierProvider<FavoritesNotifier, FavoritesState>

// Update provider_card.dart - add heart icon
// Add onFavoriteTap callback
// Optimistic update (instant UI change, sync in background)
```

---

### Issue 4: Settings Screen Buttons
**Status:** ❌ NOT STARTED
**Effort:** 3-4 hours

**Buttons Needing Implementation:**

| Button | Package/Method |
|--------|---------------|
| Biometric Login | `local_auth: ^2.1.0` |
| Push Notifications | Toggle FCM subscription |
| Email Notifications | Backend preference |
| SMS Notifications | Backend preference |
| Privacy Settings | Link to policy |
| Account Deletion | Confirmation + DELETE API |
| Dark Mode | Theme toggle |

**Biometric Login Implementation:**
```dart
final LocalAuthentication auth = LocalAuthentication();
final bool canAuthenticateWithBiometrics = await auth.canCheckBiometrics;
final bool didAuthenticate = await auth.authenticate(
  localizedReason: 'Please authenticate to continue',
);
```

---

## 🟢 P2 - MEDIUM PRIORITY

### Issue 5: Terms of Service in Profile
**Status:** ❌ NOT STARTED
**Effort:** 1 hour

**Requirements:**
- Show TOS document in profile/settings
- Link to current TOS version user accepted
- Display acceptance date

**Implementation:**
1. Create TOS viewer screen (WebView or Markdown)
2. Convert `Findr_Health_Patient_Terms_of_Service_v2_REVISED.docx` to HTML
3. Show acceptance timestamp from user record

---

### Issue 6: Notifications Feature
**Status:** ❌ NOT STARTED
**Effort:** 6-8 hours

**Architecture:**
```
Backend (triggers) → Firebase FCM → Flutter App (receives)
```

**Notification Types:**
- Booking confirmations
- Appointment reminders (24h, 1h before)
- Provider messages
- Promotional offers

**Implementation Phases:**
1. Firebase project setup + FCM configuration
2. Backend notification service
3. Flutter firebase_messaging integration
4. NotificationCenterScreen for history

---

## 📋 IMPLEMENTATION ORDER

### Session 1 (Next)
1. [ ] Location Picker Fix (2 hrs)
2. [ ] TOS in Profile (1 hr)

### Session 2
3. [ ] Favorites - Backend (2 hrs)
4. [ ] Favorites - Flutter (2 hrs)

### Session 3
5. [ ] Settings - Biometric Login (1.5 hrs)
6. [ ] Settings - Notification Toggles (1.5 hrs)

### Session 4+
7. [ ] Notifications - Firebase Setup
8. [ ] Notifications - Backend
9. [ ] Notifications - Flutter

---

## 🔍 DEBUGGING COMMANDS

```bash
# Flutter analyze
cd ~/Downloads/Findr_health_APP && flutter analyze lib/

# Check specific file
flutter analyze lib/presentation/screens/booking/booking_flow_screen.dart

# Run app
flutter run

# Backend logs
railway logs

# Test API endpoints
curl "https://fearless-achievement-production.up.railway.app/api/providers?search=labs"
curl "https://fearless-achievement-production.up.railway.app/api/providers/69360ad81eda41be998c8acb"
```

---

*Document Version: 2.0 - Updated Jan 7, 2026*
