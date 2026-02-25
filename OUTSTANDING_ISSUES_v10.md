# FINDR HEALTH - OUTSTANDING ISSUES
## Version 10 | Updated: January 13, 2026

---

## 🔴 CRITICAL (Blocking Release)

### 1. App Crashes on Standalone Launch
- **Status:** UNRESOLVED - Discovered Jan 12
- **Symptom:** White flash then crash when app opened from iPhone home screen
- **Works In:** Xcode debug mode (attached to debugger)
- **Fails In:** Standalone mode (opened from home screen after stopping debugger)

#### Root Cause Analysis

**Expected App Launch Sequence:**
```
1. main() runs → WidgetsFlutterBinding.ensureInitialized()
2. StorageService.init() → SharedPreferences.getInstance() (ASYNC)
3. runApp(ProviderScope(child: MyApp()))
4. Splash screen loads
5. _initializeApp() checks:
   - StorageService.isOnboardingComplete (SYNC getter)
   - StorageService.getAccessToken() (ASYNC)
   - StorageService.isBiometricEnabled (SYNC getter)
6. Route to appropriate screen
```

**Failure Point:**
```
StorageService.isOnboardingComplete  ← SYNC getter
StorageService.isBiometricEnabled    ← SYNC getter
```
These access `_prefs?.getBool()` where `_prefs` might be null if `init()` hasn't completed.

**Why It Works in Debug but Not Release:**
- Debug mode: Slower startup, more time for async init to complete
- Release mode: Faster startup, race condition more likely to trigger
- Debug mode: Better error handling/reporting
- Release mode: Crashes silently

**Required Investigation:**
```bash
cd ~/Development/findr-health/findr-health-mobile

# Check main.dart initialization order
cat lib/main.dart | head -50

# Check StorageService implementation
cat lib/core/services/storage_service.dart
```

**Probable Fix:**
```dart
// In main.dart - ensure init completes before runApp
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await StorageService.init();  // ← MUST await
  runApp(const ProviderScope(child: MyApp()));
}

// OR in StorageService - make sync getters null-safe
static bool get isBiometricEnabled {
  if (_prefs == null) return false;  // ← Guard against null
  return _prefs!.getBool(StorageKeys.biometricEnabled) ?? false;
}
```

---

### 2. Biometric Login Not Working
- **Status:** BLOCKED by Issue #1
- **Dependency:** Fix app crash first, then biometric can be tested

#### Biometric Feature Requirements

**For biometric to work, ALL of these must be true:**
1. ✅ User has logged in at least once (has stored token)
2. ✅ User has enabled biometric in Settings toggle
3. ✅ Device supports biometrics (Face ID/Touch ID)
4. ✅ User has enrolled biometrics on device
5. ❓ App can launch without crashing (BLOCKED)
6. ❓ StorageService can read `isBiometricEnabled` preference
7. ❓ Splash screen can prompt for biometric before routing

**Current Code Status:**
| Component | Status | Location |
|-----------|--------|----------|
| Settings toggle | ✅ Working | `settings_screen.dart:71-93` |
| Toggle saves preference | ✅ Working | `StorageService.setBiometricEnabled()` |
| Splash screen biometric check | ✅ Code exists | `splash_screen.dart:72-88` |
| LocalAuth integration | ✅ Implemented | `splash_screen.dart:91-140` |
| App launches standalone | ❌ CRASHES | Issue #1 |

**Correct Test Flow (after crash is fixed):**
1. Log in with gagi@findrhealth.com / Test1234!
2. Go to Settings → Enable Face ID toggle
3. Face ID prompts to verify (this confirms toggle works)
4. **DO NOT log out** (logout clears token)
5. Stop Xcode debugger (or install release build)
6. Open app from iPhone home screen
7. Should see Face ID prompt before home screen

**Why "Logout → Reopen" Won't Work:**
```
Logout clears token → No token stored → No biometric check needed
Biometric protects re-entry for EXISTING sessions, not new logins
```

---

## 🟡 HIGH PRIORITY

### 3. Provider Portal Popup - Needs Verification
- **Status:** Fix deployed Jan 12, not yet verified
- **Fix Applied:** Added `!justSavedRef.current` check in `handleCancel()`
- **File:** `carrotly-provider-mvp/src/pages/EditProfile.tsx`
- **Commit:** `02e7c1c`
- **Test Steps:**
  1. Go to https://findrhealth-provider.vercel.app
  2. Log in as a provider
  3. Go to Edit Profile
  4. Add a team member (or make any change)
  5. Click Save
  6. Click back arrow
  7. **Expected:** Navigate back without popup
  8. **Bug (if still present):** "You have unsaved changes" popup appears

---

## 🟢 MEDIUM PRIORITY

### 4. Demo Providers Need Creation
- **Status:** Not started
- **Task:** Create 1 test provider per category with complete profiles
- **Categories:**
  - Medical (Primary Care)
  - Urgent Care
  - Dental
  - Vision
  - Mental Health
  - Fitness
  - Cosmetic
- **Each Provider Needs:**
  - Professional photo
  - Complete service menu (from templates)
  - Business hours
  - Location
  - About text

### 5. Calendar Date Picker UX
- **Status:** Not started
- **Issue:** No month indicator when scrolling through dates
- **File:** `datetime_selection_screen.dart`
- **Enhancement:** Add sticky month header or month tabs

### 6. Provider Photo Upload
- **Status:** Feature exists, needs testing
- **Test:** Upload photo in provider portal → verify shows in consumer app

### 7. Admin/Provider Portal UX Alignment
- **Status:** Not started
- **Task:** Ensure profile fields match between admin dashboard and provider portal

---

## ✅ RESOLVED

### Jan 12, 2026

#### ~~Git Repository Not Connected~~
- **Resolved:** Full migration to `~/Development/findr-health/`
- **All repos cloned via SSH**
- **100 files synced to GitHub**
- **Deprecated paths deleted**

#### ~~Terms of Service Showing Abbreviated Version~~
- **Resolved:** Two `TermsOfServiceScreen` classes existed
- **Fix:** Removed old class from `settings_screens.dart` (lines 235-338)
- **Fix:** Added correct import in `app_router.dart`
- **Result:** 16 sections now display correctly

#### ~~Provider Portal Unsaved Changes Popup~~
- **Resolved:** Added `justSavedRef.current` check
- **Needs verification** after Vercel redeploy

### Jan 9-10, 2026

#### ~~Booking Flow Not Implemented~~
- **Resolved:** API call was commented out as TODO
- **Fix:** Implemented full booking creation with durable payment system

#### ~~SMTP Email Timeout~~
- **Resolved:** Booking confirmations timing out
- **Fix:** Made email notifications non-blocking

#### ~~BookingModel Parse Error~~
- **Resolved:** Expected strings, received objects
- **Fix:** Updated model to handle object responses

---

## 📁 Reference Paths

```
~/Development/findr-health/findr-health-mobile/     # Flutter app
~/Development/findr-health/carrotly-provider-database/  # Backend + Admin
~/Development/findr-health/carrotly-provider-mvp/   # Provider Portal
```

---

## 🧪 Test Accounts

| Email | Password | Status |
|-------|----------|--------|
| gagi@findrhealth.com | Test1234! | ✅ Primary test |
| tim@findrhealth.com | Test1234! | ✅ Developer |

---

## 📊 Progress Tracker

| Category | Done | Remaining |
|----------|------|-----------|
| Core Features | 90% | Biometric |
| Bug Fixes | 85% | App crash |
| Testing | 60% | Biometric, portal popup, provider photos |
| Documentation | 100% | - |
| Git Setup | 100% | - |
| Demo Content | 0% | 7 demo providers |

---

*Last Updated: January 13, 2026 - Start of Session*
