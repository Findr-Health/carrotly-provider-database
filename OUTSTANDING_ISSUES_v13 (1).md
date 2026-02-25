# FINDR HEALTH - OUTSTANDING ISSUES
## Version 13 | Updated: January 15, 2026 (End of Day)

**Document Purpose:** Accurate tracking of all outstanding issues and tasks  
**Review Method:** Based on comprehensive conversation search across all sessions  
**Accuracy Level:** Only includes items verified through conversation history

---

## 🔴 CRITICAL (Blocking Release)

### 1. iOS App Crash on Standalone Launch
- **Status:** NEEDS VERIFICATION
- **First Reported:** January 12, 2026
- **Symptom:** White flash then crash when app opened from iPhone home screen
- **Works In:** Xcode debug mode (attached to debugger)
- **Fails In:** Standalone mode (opened from home screen after stopping debugger)

**Jan 13 Fixes Applied:**
- Removed `flutter_facebook_auth` package
- Removed `flutter_secure_storage` package  
- Rewrote `storage_service.dart` to use SharedPreferences only

**Session notes indicate:** "App works as of 1/15" but requires explicit verification test.

**Root Cause (if still occurring):**
```dart
// StorageService sync getters access _prefs before init() completes
static bool get isOnboardingComplete => _prefs?.getBool(...) // _prefs might be null
static bool get isBiometricEnabled => _prefs?.getBool(...)   // _prefs might be null
```

**Fix if needed:**
```dart
// Option A: Await init in main.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await StorageService.init();  // MUST await
  runApp(const ProviderScope(child: MyApp()));
}

// Option B: Null guards in getters
static bool get isBiometricEnabled {
  if (_prefs == null) return false;
  return _prefs!.getBool(StorageKeys.biometricEnabled) ?? false;
}
```

**Next Action:** Test standalone app launch from home screen (not via Xcode)

---

### 2. Biometric Login Not Working
- **Status:** BLOCKED by Issue #1
- **Dependency:** Must verify app crash is fixed before biometric can be tested
- **Test Flow:** Log in → Enable Face ID → Stop Xcode → Open from home screen → Should prompt

---

## 🟡 HIGH PRIORITY

### 3. Microsoft Outlook Calendar Integration
- **Status:** ❌ NOT STARTED
- **Priority:** P1 - Covers ~35% of providers
- **Estimated Effort:** 2-3 hours

**Required Steps:**
1. Register app in Azure Portal (Microsoft Identity Platform)
   - URL: portal.azure.com → Azure Active Directory → App registrations
   - Create new registration: "Findr Health Calendar"
   - Add redirect URI: `https://fearless-achievement-production.up.railway.app/api/calendar/microsoft/callback`

2. Add to Railway Environment Variables:
   ```
   MICROSOFT_CLIENT_ID=your_client_id
   MICROSOFT_CLIENT_SECRET=your_client_secret
   MICROSOFT_TENANT_ID=common
   ```

3. Install npm package:
   ```bash
   npm install @azure/msal-node
   ```

4. Add OAuth routes to `backend/routes/calendar.js`:
   - `GET /api/calendar/microsoft/auth/:providerId`
   - `GET /api/calendar/microsoft/callback`
   - Use Microsoft Graph API for FreeBusy and create-event

5. Add Microsoft button to `src/pages/Calendar.tsx` in Provider Portal

6. Test end-to-end OAuth flow

**Microsoft Graph API Scopes Needed:**
```
Calendars.ReadWrite
User.Read
```

**Documentation:** https://learn.microsoft.com/en-us/graph/api/resources/calendar

---

### 4. Calendar Step Missing from Provider Onboarding
- **Status:** ❌ NOT IMPLEMENTED
- **Priority:** P1 - Poor new provider experience
- **Impact:** New providers must manually find /calendar page after completing onboarding

**Background:**
- Designed in November 2025 as "Step 6.5: Calendar & Availability" or "Step 7"
- Full UI specification exists in PROVIDER_ONBOARDING_DESIGNER_SPEC.md
- Was planned but never built

**Current Provider Portal Onboarding:**
```
Step 1: Basics → Step 2: Location → Step 3: Photos → Step 4: Services → 
Step 5: Optional Details → Step 6: Payment Setup → Step 7: Team Members → 
Step 8: Review → Step 9: Agreement → Complete
```

**Required Change:**
```
Step 1: Basics → ... → Step 6: Payment → Step 7: Calendar (NEW) → 
Step 8: Team Members → Step 9: Review → Step 10: Agreement → Complete
```

**Files to Create/Modify:**
- `src/pages/onboarding/StepCalendar.tsx` (NEW)
- `src/pages/onboarding/CompleteProfile.tsx` (update step count)
- `src/components/onboarding/OnboardingWizard.tsx` (add step to flow)

**UI Design (from original spec):**
```
┌─────────────────────────────────────────┐
│ Step 7 of 10: Calendar & Availability   │
│ [Skip for now →]                        │
├─────────────────────────────────────────┤
│ Connect Your Calendar                   │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │  📅  Connect Google Calendar        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │  📧  Connect Microsoft Outlook      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [I'll manage manually →]                │
└─────────────────────────────────────────┘
```

**Note:** Can reuse OAuth logic from existing `Calendar.tsx` page

---

### 5. Admin Dashboard - Calendar Tab Missing
- **Status:** NOT STARTED
- **First Noted:** January 14, 2026
- **Issue:** Provider calendar connection status not visible in admin dashboard

**Task:** Add Calendar tab to ProviderDetail.jsx showing:
- Connection status (connected/not connected)
- Calendar provider type (Google/Microsoft/Manual)
- Connected email address
- `connectedAt` timestamp
- Disconnect action (admin override)

**File:** `admin-dashboard/src/components/ProviderDetail.jsx`

---

### 6. Calendar-Booking Integration
- **Status:** NOT STARTED
- **Priority:** P1 - Core functionality gap
- **Impact:** Double-booking currently possible

**Current Flow (Broken):**
```
1. Patient selects date in booking flow
2. Backend returns provider's business hours
3. Patient sees ALL business hour slots (ignores provider's actual calendar)
4. Double-booking possible!
```

**Required Flow:**
```
1. Patient selects date in booking flow
2. Backend calls /api/calendar/freebusy/:providerId
3. Combine business hours with busy times from calendar
4. Return only TRULY available slots
```

**Files to Modify:**
- Backend: `backend/routes/bookings.js` (availability calculation)
- Flutter: `lib/presentation/screens/booking/datetime_selection_screen.dart`

**Note:** FreeBusy endpoint already exists (`GET /api/calendar/freebusy/:providerId`) - just needs integration

---

## 🟢 MEDIUM PRIORITY

### 7. Provider Portal Popup - Needs Verification
- **Status:** Fix deployed Jan 12, not yet verified
- **Fix Applied:** Added `!justSavedRef.current` check in `handleCancel()`
- **File:** `carrotly-provider-mvp/src/pages/EditProfile.tsx`
- **Test:** Edit profile → Make changes → Click Cancel → Should NOT show warning if just saved

---

### 8. Demo Providers Need Creation
- **Status:** Not started
- **Task:** Create 1 test provider per category with complete profiles
- **Categories:** Medical, Urgent Care, Dental, Vision, Mental Health, Fitness, Cosmetic
- **Purpose:** Demonstrate all provider types for investors/demos

---

### 9. Calendar Date Picker UX
- **Status:** Not started
- **Issue:** No month indicator when scrolling through dates in booking flow
- **File:** `lib/presentation/screens/booking/datetime_selection_screen.dart`
- **Desired:** Show current month name, allow scrolling beyond 1 week

---

### 10. Provider Photo Upload - Needs Testing
- **Status:** Feature exists, needs testing
- **Test:** Upload photo in provider portal → verify shows in consumer app
- **Files:** Provider Portal photos section, Flutter provider detail screen

---

## ✅ RESOLVED (January 14, 2026)

### Stripe Connect Integration ✅
- **Resolved:** Complete OAuth flow implemented
- **Routes:** create-account, onboarding-link, dashboard-link, status, balance, disconnect
- **Portal:** New Payments page with Stripe Connect UI
- **Admin:** Payments tab shows Stripe Connect status
- **Fee Structure:** 10% + $1.50 per booking (capped at $35)

### Google Calendar Integration (Established Providers) ✅
- **Resolved:** Complete OAuth flow implemented
- **Routes:** google/auth, google/callback, status, disconnect, freebusy, create-event
- **Portal:** New Calendar page with Google OAuth UI (`Calendar.tsx`)
- **Tested:** Successfully connects with test user (wetherillt@gmail.com)
- **Scope:** Works for established providers via dashboard, NOT in onboarding

### AI Chat Auth Required ✅
- **Resolved:** Clarity AI now requires authentication
- **Guests:** See "Sign in to use Clarity" screen
- **File:** `chat_screen.dart`

### Admin Dashboard User List ✅
- **Resolved:** Added `/api/users` route for admin
- **Features:** List all users, search, filter by status
- **Payment Methods:** Now fetches from Stripe API (best practice - PCI compliant)

---

## 📅 CALENDAR INTEGRATION - COMPLETE STATUS MATRIX

| Component | Established Providers | New Provider Onboarding | Status |
|-----------|----------------------|------------------------|--------|
| **Google Calendar** | | | |
| - Backend OAuth Routes | ✅ Complete | ✅ Shared | Deployed |
| - Frontend UI (Calendar.tsx) | ✅ Complete | ❌ No onboarding step | Gap |
| - FreeBusy API | ✅ Complete | ✅ Shared | Not integrated with booking |
| - Create Event API | ✅ Complete | ✅ Shared | Deployed |
| **Microsoft Calendar** | | | |
| - Backend OAuth Routes | ❌ Not started | ❌ Not started | Planned |
| - Frontend UI | ❌ Not started | ❌ Not started | Planned |
| - Azure Registration | ❌ Not started | N/A | Required first |
| **Booking Integration** | | | |
| - FreeBusy in slot calc | ❌ Not started | N/A | Critical gap |
| **Admin Dashboard** | | | |
| - Calendar status tab | ❌ Not started | N/A | Planned |

---

## 🔧 ENVIRONMENT CONFIGURATION

### Railway Variables (Current)
```
ANTHROPIC_API_KEY
APP_URL
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLOUDINARY_CLOUD_NAME
FROM_EMAIL
GMAIL_APP_PASSWORD
GMAIL_USER
GOOGLE_PLACES_API_KEY
JWT_SECRET
MONGODB_URI
NODE_ENV=production
RESEND_API_KEY
SENDGRID_API_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
GOOGLE_CALENDAR_CLIENT_ID          # Added Jan 14
GOOGLE_CALENDAR_CLIENT_SECRET      # Added Jan 14
# MICROSOFT_CLIENT_ID              # Needed for Outlook
# MICROSOFT_CLIENT_SECRET          # Needed for Outlook
# MICROSOFT_TENANT_ID              # Needed for Outlook
```

### Google Cloud Console
- **Project:** Findr Health
- **APIs Enabled:** Google Calendar API, Google Places API
- **OAuth Clients:**
  - Findr Health iOS - Google Sign In (iOS)
  - Findr Health Calendar (Web)
- **Test Users:** wetherillt@gmail.com

### Azure Portal (Required for Microsoft)
- **Not yet configured**
- Need: App registration, Client ID, Client Secret, Redirect URI

---

## 📊 PROGRESS TRACKER

| Category | Complete | Remaining | % |
|----------|----------|-----------|---|
| Core Features | 95% | Biometric verification | 95% |
| Stripe Connect | ✅ 100% | - | 100% |
| Google Calendar (Established) | ✅ 100% | - | 100% |
| Google Calendar (Onboarding) | 0% | StepCalendar component | 0% |
| Microsoft Calendar | 0% | Full implementation | 0% |
| Calendar-Booking Integration | 0% | FreeBusy in slot calc | 0% |
| Admin Calendar Tab | 0% | UI addition | 0% |
| Bug Fixes | 80% | App crash verification | 80% |
| Testing | 60% | Biometric, portal popup | 60% |
| Demo Content | 0% | 7 demo providers | 0% |

---

## 🔜 NEXT SESSION PRIORITIES

### Priority 1: Verify App Crash Fix
- Test standalone launch from home screen
- If fixed, proceed to biometric testing
- If not fixed, apply null guards to StorageService

### Priority 2: Microsoft Calendar Integration
- Azure Portal app registration
- Backend OAuth routes
- Provider Portal UI button
- Test end-to-end

### Priority 3: Calendar Onboarding Step
- Create StepCalendar.tsx component
- Integrate into onboarding wizard
- Reuse existing OAuth logic

### Priority 4: Calendar-Booking Integration
- Integrate FreeBusy API into slot calculation
- Update booking flow to show truly available times

### Priority 5: Admin Calendar Tab
- Add tab to ProviderDetail.jsx
- Show connection status and details

---

*Document Version: 13.0 - January 15, 2026 (End of Day)*  
*Review Method: Comprehensive conversation search*  
*Last Verified: January 15, 2026*
