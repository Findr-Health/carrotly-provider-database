# FINDR HEALTH - OUTSTANDING ISSUES
## Version 11 | Updated: January 13, 2026 (End of Day)

---

## 🔴 CRITICAL (Blocking Release)

### 1. iOS 26.1 Beta Blocking Direct Install
- **Status:** IDENTIFIED - No code fix possible
- **Problem:** Cannot install Release builds directly to iOS 26.1 beta device
- **Error:** "Attempted to install a Beta profile without the proper entitlement"
- **Impact:** Must use TestFlight for all Release testing
- **Solution:** Archive → Upload to App Store Connect → TestFlight

### 2. Biometric Login Testing
- **Status:** BLOCKED by Issue #1
- **Code Status:** ✅ Complete and ready
- **Dependency:** Requires TestFlight build to test on real device
- **Test Flow:**
  1. Install via TestFlight
  2. Log in with gagi@findrhealth.com / Test1234!
  3. Settings → Enable Face ID
  4. Close app (don't logout)
  5. Reopen → Should prompt Face ID

---

## 🟡 HIGH PRIORITY

### 3. TestFlight Build 28
- **Status:** Ready to build
- **Changes Included:**
  - ✅ Facebook auth removed
  - ✅ flutter_secure_storage replaced with SharedPreferences
  - ✅ Provider portal popup fixed
- **Action:** Archive in Xcode → Upload → Distribute via TestFlight

### 4. Stripe Connect Integration (Provider Portal)
- **Status:** Design complete, not built
- **Recommendation:** Stripe Connect Express
- **UX:** Provider clicks "Connect Stripe" → Stripe hosted onboarding → Returns
- **Data:** Store `stripeConnectedAccountId` in Provider model
- **Estimate:** 3-4 days

### 5. Calendar Integration (Real-time Availability)
- **Status:** Design complete, not built
- **Approach:** Google Calendar + Microsoft Outlook (85% coverage)
- **Method:** FreeBusy API (privacy-friendly - only sees busy times)
- **Features:**
  - Read provider's busy times
  - Calculate available slots
  - Push bookings to provider's calendar
- **Estimate:** 5-6 days

---

## 🟢 MEDIUM PRIORITY

### 6. Admin Dashboard Alignment
- **Status:** Not started
- **Task:** Match profile fields between admin and provider portal
- **Missing in Admin:**
  - Location tab (full address editing)
  - Policies tab (cancellation)
  - Stripe connection status
  - Calendar connection status

### 7. Provider Scheduling System (Built-in)
- **Status:** Design phase
- **Purpose:** For providers without existing scheduling software
- **Features:**
  - View all Findr bookings
  - Manually add appointments
  - Block time slots
  - Export to ICS
- **Priority:** Future phase (after calendar integration)

### 8. Provider Photo Uploads
- **Status:** 3 of 17 providers have photos
- **Task:** Upload photos for remaining test providers
- **Providers needing photos:**
  - Medical Test, Urgent Care Test, Dental Test
  - Mental Health Test, Skincare Test, Massage Test
  - Fitness Test, Yoga Test, Nutrition Test

---

## ✅ RESOLVED

### January 13, 2026

#### ~~App Crashes on Standalone Launch~~
- **Root Cause 1:** `flutter_facebook_auth` plugin crash during registration
- **Root Cause 2:** `flutter_secure_storage` requires Keychain entitlements
- **Fix:** Removed both plugins, replaced secure storage with SharedPreferences
- **Status:** Code fixed, awaiting TestFlight verification

#### ~~Provider Portal Unsaved Changes Popup~~
- **Issue:** Popup appeared even after saving
- **Root Cause:** 31 `markChanged()` calls + async React race conditions
- **Fix:** Disabled popup entirely
- **Commit:** Deployed to Vercel, verified working

### January 12, 2026

#### ~~Git Repository Migration~~
- All repos now in `~/Development/findr-health/`
- SSH keys configured
- 100 files synced

#### ~~Terms of Service~~
- Fixed duplicate class issue
- 16 sections now display correctly

### January 9-10, 2026

#### ~~Booking Flow~~
- Implemented full booking with durable payment system

#### ~~SMTP Email Timeout~~
- Made notifications non-blocking

#### ~~Calendar Month Indicator~~
- Monthly navigation implemented
- 60-day booking range

#### ~~Demo Providers~~
- 10 test providers created (all categories)
- All verified and featured

#### ~~Verified/Featured Badges~~
- Backend API working
- Flutter model updated
- Admin dashboard toggles working

---

## 📊 Feature Status

| Feature | Code | Tested | Production |
|---------|------|--------|------------|
| Booking Flow | ✅ | ✅ | ✅ |
| Payment (at_visit) | ✅ | ✅ | ✅ |
| Search/Browse | ✅ | ✅ | ✅ |
| Provider Detail | ✅ | ✅ | ✅ |
| Map Search | ✅ | ✅ | ✅ |
| Biometric Login | ✅ | 🟡 Blocked | ❌ |
| Calendar Integration | ❌ | ❌ | ❌ |
| Stripe Connect | ❌ | ❌ | ❌ |

---

## 🧪 Test Accounts

| Email | Password | Purpose |
|-------|----------|---------|
| gagi@findrhealth.com | Test1234! | Primary test |
| tim@findrhealth.com | Test1234! | Developer |

---

## 📁 Reference Paths

```
~/Development/findr-health/findr-health-mobile/        # Flutter app
~/Development/findr-health/carrotly-provider-database/ # Backend + Admin
~/Development/findr-health/carrotly-provider-mvp/      # Provider Portal
```

---

## 📋 Next Session Checklist

1. [ ] Create TestFlight Build 28
2. [ ] Test biometric login via TestFlight
3. [ ] Begin Stripe Connect implementation
4. [ ] Begin Google Calendar integration

---

*Last Updated: January 13, 2026 - End of Session*
