# FINDR HEALTH - OUTSTANDING ISSUES
## Version 12 | Updated: January 14, 2026

---

## 🟡 HIGH PRIORITY (Previously Critical - Needs Verification)

### 1. App Crash on Standalone Launch
- **Status:** LIKELY RESOLVED - App worked on 1/15 after Jan 13 fixes
- **Jan 13 Fixes Applied:**
  - Removed `flutter_facebook_auth`
  - Removed `flutter_secure_storage`
  - Rewrote `storage_service.dart` to use SharedPreferences only
- **Verification Needed:** Test standalone launch from home screen (not via Xcode)
- **If Still Crashes:** Apply null guards to sync getters

### 2. Biometric Login Not Working
- **Status:** READY TO TEST (was blocked by crash)
- **Test Flow:** Log in → Enable Face ID → Stop Xcode → Open from home screen → Should prompt

---

## 🟡 HIGH PRIORITY

### 3. Admin Dashboard - Calendar Tab Missing
- **Status:** NEW - Discovered Jan 14
- **Issue:** Provider calendar connection status not visible in admin dashboard
- **Task:** Add Calendar tab to ProviderDetail.jsx showing:
  - Connection status (connected/not connected)
  - Provider type (Google/Microsoft)
  - Connected email
  - connectedAt timestamp
- **File:** `admin-dashboard/src/components/ProviderDetail.jsx`

### 4. Microsoft Outlook Calendar Integration
- **Status:** NOT STARTED
- **Priority:** High - covers ~35% additional users
- **Tasks:**
  1. Register app in Azure Portal (Microsoft Identity Platform)
  2. Create OAuth routes in `backend/routes/calendar.js`
  3. Add Microsoft button to Provider Portal Calendar page
  4. Test end-to-end OAuth flow
- **Estimated:** 2-3 hours

### 5. Integrate Calendar with Booking Flow
- **Status:** NOT STARTED
- **Task:** Use FreeBusy API when calculating available slots
- **Flow:**
  1. User selects date in booking flow
  2. Backend calls `/api/calendar/freebusy/:providerId`
  3. Combine business hours with busy times
  4. Return only truly available slots
- **Files:**
  - Backend: `backend/routes/bookings.js`
  - Flutter: `datetime_selection_screen.dart`

---

## 🟢 MEDIUM PRIORITY

### 6. Provider Portal Popup - Needs Verification
- **Status:** Fix deployed Jan 12, not yet verified
- **Fix Applied:** Added `!justSavedRef.current` check in `handleCancel()`
- **File:** `carrotly-provider-mvp/src/pages/EditProfile.tsx`

### 7. Demo Providers Need Creation
- **Status:** Not started
- **Task:** Create 1 test provider per category with complete profiles
- **Categories:** Medical, Urgent Care, Dental, Vision, Mental Health, Fitness, Cosmetic

### 8. Calendar Date Picker UX
- **Status:** Not started
- **Issue:** No month indicator when scrolling through dates
- **File:** `datetime_selection_screen.dart`

### 9. Provider Photo Upload
- **Status:** Feature exists, needs testing
- **Test:** Upload photo in provider portal → verify shows in consumer app

---

## ✅ RESOLVED (January 14, 2026)

### Stripe Connect Integration
- **Resolved:** Complete OAuth flow implemented
- **Routes:** create-account, onboarding-link, dashboard-link, status, disconnect
- **Portal:** New Payments page with Stripe Connect UI
- **Admin:** Payments tab shows Stripe Connect status

### Google Calendar Integration
- **Resolved:** Complete OAuth flow implemented
- **Routes:** google/auth, google/callback, status, disconnect, freebusy, create-event
- **Portal:** New Calendar page with Google OAuth UI
- **Tested:** Successfully connects with test user

### AI Chat Auth Required
- **Resolved:** Clarity AI now requires authentication
- **Guests:** See "Sign in to use Clarity" screen
- **File:** `chat_screen.dart`

### Admin Dashboard User List
- **Resolved:** Added `/api/users` route for admin
- **Features:** List all users, search, filter by status
- **Payment Methods:** Now fetches from Stripe API (best practice)

---

## 🔧 ENVIRONMENT CONFIGURATION

### Railway Variables (Current)
```
ANTHROPIC_API_KEY=*****
APP_URL=*****
CLOUDINARY_API_KEY=*****
CLOUDINARY_API_SECRET=*****
CLOUDINARY_CLOUD_NAME=*****
FROM_EMAIL=*****
GMAIL_APP_PASSWORD=*****
GMAIL_USER=*****
GOOGLE_PLACES_API_KEY=*****
JWT_SECRET=*****
MONGODB_URI=*****
RESEND_API_KEY=*****
SENDGRID_API_KEY=*****
STRIPE_PUBLISHABLE_KEY=*****
STRIPE_SECRET_KEY=*****
NODE_ENV=production
GOOGLE_CALENDAR_CLIENT_ID=*****
GOOGLE_CALENDAR_CLIENT_SECRET=*****
```

### Google Cloud Console
- **Project:** Findr Health
- **APIs Enabled:** Google Calendar API, Google Places API
- **OAuth Clients:**
  - Findr Health iOS - Google Sign In (iOS)
  - Findr Health Calendar (Web)
- **Test Users:** wetherillt@gmail.com

---

## 📊 Progress Tracker

| Category | Done | Remaining |
|----------|------|-----------|
| Core Features | 98% | Biometric verification |
| Bug Fixes | 95% | Verify crash fix |
| Stripe Connect | ✅ 100% | - |
| Google Calendar | ✅ 100% | - |
| Microsoft Calendar | 0% | Full implementation |
| Testing | 70% | Biometric, portal popup |
| Demo Content | 0% | 7 demo providers |

---

## 📅 Tomorrow's Priorities (Jan 15)

1. **Verify App Crash Fixed** - Standalone launch test
2. **Test Biometric Login** - Now unblocked
3. **Add Calendar Tab** - Admin Dashboard provider calendar status
4. **Microsoft Outlook** - OAuth integration for calendar
5. **TestFlight Build 28** - Ready to deploy!

---

*Last Updated: January 14, 2026 - End of Session*
