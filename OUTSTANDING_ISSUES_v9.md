# FINDR HEALTH - OUTSTANDING ISSUES
## Version 9 | Updated: January 12, 2026

---

## 🔴 CRITICAL (Blocking Release)

### 1. App Crashes on Standalone Launch
- **Status:** NEW - Discovered Jan 12
- **Symptom:** White flash then crash when app opened from iPhone home screen
- **Works:** In Xcode debug mode
- **Likely Cause:** StorageService SharedPreferences not initialized before sync getters called
- **Files:** `splash_screen.dart`, `storage_service.dart`, `main.dart`
- **Impact:** Blocks biometric testing, TestFlight builds, App Store release
- **Investigation:**
  ```bash
  cat lib/main.dart
  grep -n -A10 "init\|_prefs" lib/core/services/storage_service.dart
  ```
- **Probable Fix:** Ensure `StorageService.init()` is awaited in `main()` before `runApp()`

---

## 🟡 HIGH PRIORITY

### 2. Biometric Login Not Functional
- **Status:** BLOCKED by Issue #1
- **Code:** Complete in `splash_screen.dart`
- **Settings Toggle:** Working (saves to SharedPreferences)
- **Test Flow:** Log in → Enable Face ID → Close app → Reopen → Should prompt
- **Dependency:** Fix app crash first

### 3. Provider Portal Popup - Needs Verification
- **Status:** Fix deployed, not verified
- **Fix Applied:** Added `!justSavedRef.current` check in `handleCancel()`
- **File:** `carrotly-provider-mvp/src/pages/EditProfile.tsx`
- **Commit:** `02e7c1c`
- **Test:** Add team member → Save → Click back → Should NOT show popup

---

## 🟢 MEDIUM PRIORITY

### 4. Demo Providers Need Creation
- **Status:** Not started
- **Task:** Create 1 test provider per type with all services from templates
- **Types:** Medical, Urgent Care, Dental, Vision, Mental Health, Fitness, Cosmetic
- **Include:** Photos, full service menus, hours

### 5. Calendar Date Picker UX
- **Status:** Not started
- **Issue:** No month indicator when scrolling through dates
- **File:** `datetime_selection_screen.dart`
- **Enhancement:** Add sticky month header or month selector

### 6. API Keys in Environment Variables
- **Status:** Partially done
- **Remaining:** Google Maps API key still in code
- **Risk:** Low (key is restricted to bundle ID)
- **Files:** Check `AndroidManifest.xml`, `Info.plist`

---

## ✅ RESOLVED (Jan 12)

### ~~Git Repository Missing~~
- **Resolved:** Full migration to `~/Development/findr-health/`
- **All repos cloned via SSH**
- **100 files synced to GitHub**

### ~~Terms of Service Showing Abbreviated Version~~
- **Resolved:** Removed duplicate class from `settings_screens.dart`
- **Added correct import in `app_router.dart`
- **16 sections now display correctly

### ~~Provider Portal Unsaved Changes Popup~~
- **Resolved:** Added `justSavedRef.current` check
- **Needs verification after Vercel redeploy

---

## 📁 Canonical Paths

```
~/Development/findr-health/findr-health-mobile/     # Flutter app
~/Development/findr-health/carrotly-provider-database/  # Backend + Admin
~/Development/findr-health/carrotly-provider-mvp/   # Provider Portal
~/Development/findr-health/docs/                    # Documentation
```

---

## 🔗 Quick Reference

| Resource | URL |
|----------|-----|
| Backend API | https://fearless-achievement-production.up.railway.app/api |
| Provider Portal | https://findrhealth-provider.vercel.app |
| Admin Dashboard | https://admin-findrhealth-dashboard.vercel.app |
| Test Account | tim@findrhealth.com / Test1234! |

---

## 📊 Progress Tracker

| Category | Done | Remaining |
|----------|------|-----------|
| Core Features | 95% | Biometric |
| Bug Fixes | 90% | App crash |
| Testing | 70% | Biometric, portal popup |
| Documentation | 100% | - |
| Git Setup | 100% | - |

---

*Last Updated: January 12, 2026 - End of Session*
