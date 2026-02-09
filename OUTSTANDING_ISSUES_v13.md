# FINDR HEALTH - OUTSTANDING ISSUES
## Version 13 | Updated: January 15, 2026

---

## ✅ COMPLETED TODAY (Jan 15)

### Provider Portal - Booking Management UI
- **Status:** ✅ DEPLOYED
- **New Routes:** `/bookings`, `/bookings/pending`
- **Components Added:**
  - PendingRequestsPage - Full booking request management
  - BookingsPage - All bookings with search/filter
  - ConfirmationModal, DeclineModal, RescheduleModal
  - useBookings hook with API integration
- **Tested:** Confirm booking action works end-to-end
- **Commits:** 
  - `56d4613` (carrotly-provider-mvp)
  - `f40b99b` (carrotly-provider-database - CORS fix)

---

## 🔴 CRITICAL (Blocking Release)

### 1. App Crashes on Standalone Launch
- **Status:** UNRESOLVED - Discovered Jan 12
- **Symptom:** White flash then crash when app opened from iPhone home screen
- **Works In:** Xcode debug mode (attached to debugger)
- **Fails In:** Standalone mode (opened from home screen after stopping debugger)

#### Root Cause Analysis
StorageService sync getters access `_prefs` before `init()` completes.

**Fix Required:**
```dart
// In main.dart - ensure init completes before runApp
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await StorageService.init();  // ← MUST await
  runApp(const ProviderScope(child: MyApp()));
}
```

---

### 2. Biometric Login Not Working
- **Status:** BLOCKED by Issue #1
- **Dependency:** Fix app crash first, then biometric can be tested

---

## 🟡 HIGH PRIORITY

### 3. Admin Dashboard - Calendar Tab Missing
- **Status:** NEW - Discovered Jan 14
- **Issue:** Provider calendar connection status not visible in admin dashboard
- **Task:** Add Calendar tab to ProviderDetail.jsx
- **File:** `admin-dashboard/src/components/ProviderDetail.jsx`

### 4. Microsoft Outlook Calendar Integration
- **Status:** NOT STARTED
- **Priority:** High - covers ~35% additional users
- **Estimated:** 2-3 hours

### 5. Integrate Calendar with Booking Flow
- **Status:** NOT STARTED
- **Task:** Use FreeBusy API when calculating available slots

### 6. Provider Portal - Dashboard Integration
- **Status:** NEW - Components ready, need integration
- **Tasks:**
  - Add "Bookings" link to Dashboard sidebar/nav
  - Integrate PendingRequestsWidget on Dashboard homepage
  - Show pending booking count in header

---

## 🟢 MEDIUM PRIORITY

### 7. Provider Portal - Booking Detail Page
- **Status:** Not started
- **Task:** Create `/bookings/:id` route for full booking details
- **Current:** "View →" button shows alert placeholder

### 8. Provider Portal Popup - Needs Verification
- **Status:** Fix deployed Jan 12, not yet verified
- **File:** `carrotly-provider-mvp/src/pages/EditProfile.tsx`

### 9. Demo Providers Need Creation
- **Status:** Not started
- **Task:** Create 1 test provider per category with complete profiles

### 10. Calendar Date Picker UX
- **Status:** Not started
- **Issue:** No month indicator when scrolling through dates
- **File:** `datetime_selection_screen.dart`

### 11. Provider Photo Upload
- **Status:** Feature exists, needs testing

---

## ✅ RESOLVED (January 14-15, 2026)

| Feature | Date | Status |
|---------|------|--------|
| Provider Portal Booking Management UI | Jan 15 | ✅ Deployed |
| CORS headers for x-provider-id | Jan 15 | ✅ Deployed |
| Stripe Connect Integration | Jan 14 | ✅ Complete |
| Google Calendar Integration | Jan 14 | ✅ Complete |
| AI Chat Auth Required | Jan 14 | ✅ Complete |
| Admin Dashboard User List | Jan 14 | ✅ Complete |

---

## 📊 Progress Tracker

| Category | Done | Remaining |
|----------|------|-----------|
| Core Features | 95% | Biometric, Calendar-Booking integration |
| Provider Portal | 98% | Dashboard widget integration |
| Bug Fixes | 85% | App crash |
| Stripe Connect | ✅ 100% | - |
| Google Calendar | ✅ 100% | - |
| Microsoft Calendar | 0% | Full implementation |
| Booking Management | ✅ 95% | Detail page |
| Testing | 60% | Biometric, portal popup |
| Demo Content | 0% | 7 demo providers |

---

## 🔜 NEXT SESSION PRIORITIES

1. **Fix App Crash** - StorageService init race condition
2. **Dashboard Integration** - Add bookings widget & nav link
3. **TestFlight Build 28** - Deploy and test all changes
4. **Microsoft Calendar** - OAuth integration
5. **Booking Detail Page** - Full booking view

---

*Last Updated: January 15, 2026 - End of Session*
