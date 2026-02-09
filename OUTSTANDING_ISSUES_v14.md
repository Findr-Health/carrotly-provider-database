# FINDR HEALTH - OUTSTANDING ISSUES
## Version 14 | Updated: January 15, 2026 (End of Day)

**Document Author:** Engineering Team  
**Review Frequency:** Daily  
**Last Comprehensive Review:** January 15, 2026

---

## 📊 EXECUTIVE SUMMARY

| Category | Status | Items |
|----------|--------|-------|
| 🔴 Critical | 1 | App crash on standalone launch |
| 🟡 High Priority | 6 | Calendar gaps, Microsoft OAuth, admin tab, etc. |
| 🟢 Medium Priority | 6 | UI polish, demo content, testing |
| ✅ Resolved (48hrs) | 8 | Booking UI, Stripe Connect, Google Calendar, etc. |

---

## ✅ COMPLETED (January 14-15, 2026)

### January 15, 2026

#### Provider Portal - Booking Management UI ✅
**Status:** DEPLOYED to Vercel  
**Commits:** `56d4613` (carrotly-provider-mvp), `f40b99b` (backend CORS fix)

| Component | File | Purpose |
|-----------|------|---------|
| Pending Requests Page | `src/pages/PendingRequestsPage.jsx` | Full-page booking request management |
| All Bookings Page | `src/pages/BookingsPage.jsx` | List with search, filter, pagination |
| Confirmation Modal | `src/components/bookings/ConfirmationModal.jsx` | Confirm booking dialog |
| Decline Modal | `src/components/bookings/DeclineModal.jsx` | Decline with reason |
| Reschedule Modal | `src/components/bookings/RescheduleModal.jsx` | Propose new time |
| Dashboard Widget | `src/components/bookings/PendingRequestsWidget.jsx` | Ready for dashboard integration |
| Bookings Hook | `src/hooks/useBookings.ts` | API integration hook |
| API Functions | `src/services/api.ts` | bookingsAPI added |
| Routes | `src/App.tsx` | `/bookings`, `/bookings/pending` |

**Tested & Verified:**
- ✅ Pending requests page loads and displays data
- ✅ All bookings page with filters works
- ✅ Confirm booking action works (tested live with real booking)
- ✅ Status badges display correctly (Pending, Confirmed, Expired, Cancelled)

#### Backend CORS Fix ✅
- Added `x-provider-id`, `x-user-id`, `x-timezone` to allowed headers
- File: `backend/server.js` line 40
- Deployed to Railway

---

### January 14, 2026

#### Stripe Connect (Provider Payouts) ✅
**Status:** FULLY IMPLEMENTED

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/connect/create-account/:providerId` | POST | Create Stripe Express account |
| `/api/connect/onboarding-link/:providerId` | POST | Generate onboarding URL |
| `/api/connect/dashboard-link/:providerId` | POST | Generate Stripe Dashboard URL |
| `/api/connect/status/:providerId` | GET | Get connection status |
| `/api/connect/balance/:providerId` | GET | Get account balance |
| `/api/connect/disconnect/:providerId` | POST | Disconnect account |

**Files:** 
- Backend: `backend/routes/stripeConnect.js`
- Portal: `src/pages/Payments.tsx`
- Admin: Payments tab in ProviderDetail

#### Google Calendar Integration (Established Providers) ✅
**Status:** FULLY IMPLEMENTED  
**Scope:** For providers who have completed onboarding

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/calendar/google/auth/:providerId` | GET | Initiate OAuth flow |
| `/api/calendar/google/callback` | GET | Handle OAuth callback |
| `/api/calendar/status/:providerId` | GET | Get connection status |
| `/api/calendar/disconnect/:providerId` | POST | Disconnect calendar |
| `/api/calendar/freebusy/:providerId` | GET | Get busy times |
| `/api/calendar/create-event/:providerId` | POST | Create booking event |

**Files:**
- Backend: `backend/routes/calendar.js`
- Portal: `src/pages/Calendar.tsx`

**Google Cloud Console:**
- Project: Findr Health
- OAuth Client: Findr Health Calendar (Web)
- Test Users: wetherillt@gmail.com
- Scopes: userinfo.email, calendar.readonly, calendar.events

#### AI Chat Auth Required ✅
- Clarity AI now requires authentication
- Guests see "Sign in to use Clarity" prompt
- File: `chat_screen.dart`

#### Admin Dashboard User List ✅
- Added `/api/users` route for admin
- Payment methods fetched from Stripe API (not stored locally)

---

## 🔴 CRITICAL (Blocking Release)

### 1. iOS App Crashes on Standalone Launch
**Status:** UNRESOLVED - Discovered Jan 12  
**Severity:** P0 - Blocks TestFlight distribution  
**Symptom:** White flash then crash when app opened from iPhone home screen  
**Works In:** Xcode debug mode (attached to debugger)  
**Fails In:** Standalone mode (opened from home screen after stopping debugger)

#### Root Cause Analysis
```
StorageService sync getters access _prefs before init() completes:
- isOnboardingComplete → _prefs?.getBool() where _prefs might be null
- isBiometricEnabled → Same issue
```

#### Required Fix
```dart
// Option A: In main.dart - ensure init completes before runApp
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await StorageService.init();  // ← MUST await
  runApp(const ProviderScope(child: MyApp()));
}

// Option B: In StorageService - make sync getters null-safe
static bool get isBiometricEnabled {
  if (_prefs == null) return false;  // ← Guard against null
  return _prefs!.getBool(StorageKeys.biometricEnabled) ?? false;
}
```

**Files:** `lib/services/storage_service.dart`, `lib/main.dart`  
**Next Action:** Test fix in release mode on physical device

---

## 🟡 HIGH PRIORITY

### 2. Calendar Integration - Provider Onboarding Gap
**Status:** 🔴 NOT IMPLEMENTED  
**Severity:** P1 - Poor onboarding UX  
**Impact:** New providers must manually navigate to /calendar after onboarding

#### Current State
| Context | Calendar Integration | Status |
|---------|---------------------|--------|
| Established Providers | `/calendar` page in dashboard | ✅ Complete |
| New Provider Onboarding | Step 6.5/7 in onboarding flow | ❌ Missing |

#### What Exists
- Google Calendar OAuth backend routes
- Calendar.tsx page for established providers
- Provider schema supports calendar object

#### What's Missing
- **No calendar step in 10-step onboarding wizard**
- Original plan: Add "Step 6.5: Calendar & Availability" between Payment and Team Members
- New providers complete onboarding without calendar setup
- Must manually discover /calendar page later

#### Required Implementation
```
Current Flow:
Step 1: Basics → Step 2: Location → ... → Step 6: Payment → Step 7: Team → Step 8: Review → Step 9: Agreement

Required Flow:
Step 1: Basics → ... → Step 6: Payment → Step 7: Calendar & Availability (NEW) → Step 8: Team → Step 9: Review → Step 10: Agreement
```

**Files to Create/Modify:**
- `src/pages/onboarding/StepCalendar.tsx` (NEW)
- `src/pages/onboarding/CompleteProfile.tsx` (update step count)
- `src/components/onboarding/OnboardingWizard.tsx` (add step)

**UX Design (from original spec):**
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

**Estimated Effort:** 4-6 hours

---

### 3. Microsoft Outlook Calendar Integration
**Status:** NOT STARTED  
**Severity:** P1 - Covers ~35% of providers  
**Estimated Effort:** 2-3 hours

#### Required Steps
1. Register app in Azure Portal (Microsoft Identity Platform)
2. Create OAuth routes in `backend/routes/calendar.js`:
   - `GET /api/calendar/microsoft/auth/:providerId`
   - `GET /api/calendar/microsoft/callback`
3. Add Microsoft button to Provider Portal Calendar page
4. Test end-to-end OAuth flow

#### API Scopes Needed
```
Calendars.ReadWrite
User.Read
```

**Documentation:** https://learn.microsoft.com/en-us/graph/api/resources/calendar

---

### 4. Calendar-Booking Integration
**Status:** NOT STARTED  
**Severity:** P1 - Core functionality gap  
**Impact:** Provider calendar not used when calculating available slots

#### Current Flow (Broken)
```
1. Patient selects date in booking flow
2. Backend returns provider's business hours
3. Patient sees ALL business hour slots (ignoring provider's actual calendar)
4. Double-booking possible!
```

#### Required Flow
```
1. Patient selects date in booking flow
2. Backend calls /api/calendar/freebusy/:providerId
3. Combine business hours with busy times
4. Return only TRULY available slots
```

**Files:**
- Backend: `backend/routes/bookings.js` (availability calculation)
- Flutter: `datetime_selection_screen.dart`

---

### 5. Admin Dashboard - Calendar Tab Missing
**Status:** NOT STARTED  
**Severity:** P2  
**Task:** Add Calendar tab to ProviderDetail.jsx showing:
- Connection status (connected/not connected)
- Provider type (Google/Microsoft)
- Connected email
- connectedAt timestamp
- Disconnect action

**File:** `admin-dashboard/src/components/ProviderDetail.jsx`

---

### 6. Provider Portal - Dashboard Integration
**Status:** Components ready, integration pending  
**Severity:** P2

**Tasks:**
- Add "Bookings" link to Dashboard sidebar/nav
- Integrate PendingRequestsWidget on Dashboard homepage
- Show pending booking count badge in header

**Files:**
- `src/pages/Dashboard.tsx` (add widget)
- Navigation component (add link)

---

### 7. Biometric Login Not Working
**Status:** BLOCKED by Issue #1  
**Dependency:** Fix app crash first, then biometric can be tested

---

## 🟢 MEDIUM PRIORITY

### 8. Provider Portal - Booking Detail Page
**Status:** Not started  
**Task:** Create `/bookings/:id` route for full booking details  
**Current:** "View →" button shows alert placeholder

### 9. Provider Portal Popup - Needs Verification
**Status:** Fix deployed Jan 12, not yet verified  
**Fix Applied:** Added `!justSavedRef.current` check in `handleCancel()`  
**File:** `carrotly-provider-mvp/src/pages/EditProfile.tsx`

### 10. Demo Providers Need Creation
**Status:** Not started  
**Task:** Create 1 test provider per category with complete profiles  
**Categories:** Medical, Urgent Care, Dental, Vision, Mental Health, Fitness, Cosmetic

### 11. Calendar Date Picker UX
**Status:** Not started  
**Issue:** No month indicator when scrolling through dates  
**File:** `datetime_selection_screen.dart`

### 12. Provider Photo Upload Testing
**Status:** Feature exists, needs testing  
**Test:** Upload photo in provider portal → verify shows in consumer app

### 13. Calendar-Optional Booking Flow
**Status:** Planning complete, implementation pending  
**Document:** `CALENDAR_OPTIONAL_BOOKING_FLOW_v2.md`  
**Summary:** Support two booking modes:
- **Instant Book** - Providers with connected calendars
- **Request Booking** - Providers without calendars (24hr confirmation)

---

## 📅 CALENDAR INTEGRATION - COMPLETE STATUS

| Component | Established Providers | New Onboarding | Status |
|-----------|----------------------|----------------|--------|
| Google OAuth Backend | ✅ Complete | ✅ Shared | Deployed |
| Google OAuth Frontend | ✅ Calendar.tsx | ❌ No onboarding step | Gap |
| Microsoft OAuth Backend | ❌ Not started | ❌ Not started | Planned |
| Microsoft OAuth Frontend | ❌ Not started | ❌ Not started | Planned |
| FreeBusy API | ✅ Endpoint exists | ✅ Shared | Not integrated |
| Booking Integration | ❌ Not started | N/A | Gap |
| Admin Calendar Tab | ❌ Not started | N/A | Planned |

---

## 🔧 ENVIRONMENT CONFIGURATION

### Railway Variables
```
ANTHROPIC_API_KEY
APP_URL
CLOUDINARY_API_KEY / API_SECRET / CLOUD_NAME
FROM_EMAIL
GMAIL_APP_PASSWORD / GMAIL_USER
GOOGLE_PLACES_API_KEY
JWT_SECRET
MONGODB_URI
NODE_ENV=production
RESEND_API_KEY
SENDGRID_API_KEY
STRIPE_PUBLISHABLE_KEY / STRIPE_SECRET_KEY
GOOGLE_CALENDAR_CLIENT_ID          # Added Jan 14
GOOGLE_CALENDAR_CLIENT_SECRET      # Added Jan 14
# MICROSOFT_CLIENT_ID              # Needed for Outlook
# MICROSOFT_CLIENT_SECRET          # Needed for Outlook
```

### Google Cloud Console
- **Project:** Findr Health
- **APIs Enabled:** Google Calendar API, Google Places API
- **OAuth Clients:**
  - Findr Health iOS - Google Sign In (iOS)
  - Findr Health Calendar (Web)
- **Test Users:** wetherillt@gmail.com

---

## 📊 PROGRESS TRACKER

| Category | Done | Remaining | % |
|----------|------|-----------|---|
| Core Features | 95% | Biometric, Calendar-Booking | 95% |
| Provider Portal | 98% | Dashboard widget, Onboarding calendar | 98% |
| Booking Management | 95% | Detail page | 95% |
| Stripe Connect | ✅ 100% | - | 100% |
| Google Calendar | 80% | Onboarding step, Booking integration | 80% |
| Microsoft Calendar | 0% | Full implementation | 0% |
| Admin Dashboard | 85% | Calendar tab | 85% |
| Bug Fixes | 80% | App crash | 80% |
| Testing | 60% | Biometric, portal popup | 60% |
| Demo Content | 0% | 7 demo providers | 0% |

---

## 🔜 NEXT SESSION PRIORITIES

### Priority 1: Fix App Crash
- Apply StorageService null guards
- Test in release mode
- Prepare TestFlight Build 28

### Priority 2: Calendar Onboarding Step
- Create StepCalendar.tsx component
- Integrate into onboarding wizard
- Enable Google Calendar during onboarding

### Priority 3: Dashboard Integration
- Add Bookings nav link
- Add PendingRequestsWidget to Dashboard

### Priority 4: Calendar-Booking Integration
- Use FreeBusy API in availability calculation
- Prevent double-booking

### Priority 5: Microsoft Outlook
- Azure Portal app registration
- OAuth routes implementation

---

## 📝 COMMITS THIS SESSION

### carrotly-provider-mvp (Provider Portal)
| Hash | Message | Files |
|------|---------|-------|
| `56d4613` | feat: add booking management UI | 12 files, +1,658 lines |

### carrotly-provider-database (Backend)
| Hash | Message | Files |
|------|---------|-------|
| `f40b99b` | fix: add x-provider-id to CORS | server.js |

---

*Document Version: 14.0 - January 15, 2026 (End of Day)*  
*Next Review: January 16, 2026*
