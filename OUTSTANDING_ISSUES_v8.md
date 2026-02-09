# FINDR HEALTH - OUTSTANDING ISSUES
## Updated: January 12, 2026

---

## 🚨 CRITICAL: GIT MIGRATION REQUIRED

**Status:** 🔴 BLOCKING - Must complete before other work

**Problem Discovered:**
- Flutter app folder `~/Downloads/findr_health_app` has NO `.git` folder
- Changes made in last 72 hours are not version controlled
- Risk of losing work if folder deleted or overwritten

**Required Actions:**
1. [ ] Configure SSH key for GitHub
2. [ ] Create `~/Development/findr-health/` folder structure
3. [ ] Clone all repos from GitHub to correct locations
4. [ ] Identify changes made in last 72 hours (home_screen.dart, etc.)
5. [ ] Merge local changes into proper git repo
6. [ ] Delete orphan folders in Downloads
7. [ ] Verify all repos have clean git status
8. [ ] Push all changes to GitHub

**Files with Recent Changes (Must Preserve):**
| File | Changes | Date |
|------|---------|------|
| home_screen.dart | Logo size (38), search text, location pill | Jan 11-12 |
| terms_of_service_screen.dart | May have regressed - needs verification | Unknown |

---

## ✅ TESTFLIGHT STATUS

**Build 27 is LIVE on TestFlight**
- App: Findr Health
- Bundle ID: com.findrhealth.app
- Internal Testers: Tim Wetherill, A. Gagi
- Status: Testing (expires in 90 days)

---

## 🟢 COMPLETED (Jan 11-12)

### UI/UX Fixes
- [x] Search box text overflow - shortened to "Search providers..."
- [x] Search placeholder updated to "Search providers or services" (font 14)
- [x] Logo height increased to 38px
- [x] Location pill balanced (icon 14, text 13, padding adjusted)
- [x] Header visual balance achieved

### TestFlight Setup
- [x] Developer Mode enabled on iPhone
- [x] Device paired with Xcode
- [x] Device registered in Apple Developer account
- [x] Debug signing configured (Automatic)
- [x] App runs on physical device via Xcode

---

## 🔴 HIGH PRIORITY

### Issue 1: Git Repository Migration
**Status:** 🔴 CRITICAL - BLOCKING
**See:** Critical section at top of document

---

### Issue 2: Terms of Service Regression
**Status:** 🔴 NEEDS INVESTIGATION
**Problem:** Full 21-page Terms of Service may have regressed to older version
**Evidence:** 
- File shows "Version 2.0" header but may only have summary content
- Full document has 16 sections across 21 pages
**File:** `terms_of_service_screen.dart`
**Action:** Compare current file to `Findr_Health_Patient_Terms_of_Service_v2.pdf` and update

---

### Issue 3: Auth Flow Investigation
**Status:** 🟡 NEEDS VERIFICATION
**Problem:** User signed up but was limited to guest functions
**Symptoms:**
- Google login indicated success
- User remained in guest mode
- Signup with tim@findrhealth.com created account in DB
- Login works, signup state unclear
**Action:** Test fresh signup flow after git migration

---

## 🟡 MEDIUM PRIORITY

### Issue 4: Calendar Date Picker UX
**Status:** 🟡 IMPROVED BUT COULD BE BETTER
**Current State:** 12-month range available
**Remaining Issues:**
- Limited scrolling UX (week view only)
- No month indicator visible
- Could benefit from monthly calendar view
**File:** `datetime_selection_screen.dart`

---

### Issue 5: Payment Method Selection
**Status:** 🟡 NEEDS REFINEMENT
**Problem:** Shows misleading defaults when no payment method configured
**Current State:** "Select payment method" with card-required messaging
**Recommendation:** Clear indication when no card is on file
**File:** `booking_review_screen.dart`

---

### Issue 6: Provider Photos
**Status:** 🟡 NOT STARTED
**Problem:** Test providers use placeholder images
**Action:** Upload real photos via Provider Portal or Admin Dashboard

---

### Issue 7: Email Service
**Status:** 🟡 WORKAROUND IN PLACE
**Problem:** SMTP connection timeout on booking notifications
**Workaround:** Made email calls non-blocking (fire-and-forget)
**Future Fix:** Configure reliable email service (SendGrid, AWS SES)

---

## 🟢 LOW PRIORITY / Future

### Issue 8: Location Picker
**Status:** ⏳ NOT STARTED
**Problems:**
- "Use current location" shows wrong name
- City search autocomplete not working
**Effort:** 2-3 hours

---

### Issue 9: Push Notifications
**Status:** ⏳ NOT STARTED
**Requirements:**
- Firebase FCM setup
- Backend notification triggers
**Effort:** 6-8 hours

---

### Issue 10: Face Recognition / Biometric Login
**Status:** ⏳ DEFERRED
**Problem:** Settings toggle exists but functionality untested
**Dependency:** Requires real device (not simulator)
**Action:** Test after git migration complete

---

## 🔒 SECURITY STATUS

| Item | Status | Notes |
|------|--------|-------|
| Google API Keys | ✅ ROTATED | 3 new restricted keys created (Jan 10) |
| Stripe Keys | ✅ SECURE | In Railway env vars |
| MongoDB | ✅ SECURE | In Railway env vars |
| Cloudinary | ✅ SECURE | In Railway env vars |

### Pending Security Work
- [ ] Move Google Maps key to environment variables (iOS)
- [ ] Move Google Maps key to environment variables (Android)
- [ ] Audit all repos for remaining hardcoded secrets

---

## ✅ COMPLETED (Previous Sessions)

### Jan 10, 2026
| Issue | Solution |
|-------|----------|
| TestFlight deployment | Build 27 uploaded, internal testing active |
| App icons | Findr logo with white background |
| API key exposure | 3 keys rotated |
| Calendar range | Extended to 12 months |
| Auth prompt | Shows on app launch |
| Booking detail | Fetches real data |
| My Bookings nav | Added bottom navigation bar |
| Payment UX | Updated card-required messaging |

### Jan 9, 2026
| Issue | Solution |
|-------|----------|
| Booking API not called | Uncommented TODO, implemented chargeType |
| My Bookings hardcoded | Complete rewrite to fetch real data |
| Provider type filters broken | Title Case IDs |
| My Bookings back button | Navigate to home |
| Search tiles hard to read | Soft tint style |
| Location permission overflow | Made scrollable |
| Help & Support crash | Removed Clarity chat button |
| Stripe 'cash' error | Use chargeType: 'at_visit' |
| Email blocking booking | Made non-blocking |

### Jan 8, 2026
| Issue | Solution |
|-------|----------|
| Cloudinary photo upload | Created /api/upload/image endpoint |
| Hours of Operation display | Added to provider detail screen |
| Admin Hours tab | Full edit capability |
| Notifications screen | Bell icon opens notifications |
| Terms of Service | Full 16-section legal document (may have regressed) |

---

## 📋 NEXT SESSION PRIORITIES

### MUST DO (Blocking)
1. [ ] **Complete Git Migration** - Follow ENGINEERING_STANDARDS.md
2. [ ] **Verify Terms of Service** - Check for regression, update if needed
3. [ ] **Push all code to GitHub** - Ensure nothing is lost

### SHOULD DO (After Migration)
4. [ ] Test fresh signup flow end-to-end
5. [ ] Upload provider photos for demo
6. [ ] Test biometric login on real device

### IF TIME PERMITS
7. [ ] Refine calendar date picker UX
8. [ ] Improve payment method selection UI
9. [ ] Move API keys to environment variables

---

## 📊 STATUS SUMMARY

| Category | Status |
|----------|--------|
| **Git Migration** | 🔴 CRITICAL - BLOCKING |
| **TestFlight** | ✅ LIVE - Build 27 |
| **Security** | ✅ Keys rotated |
| Home Screen UI | ✅ Fixed (logo, search, balance) |
| Terms of Service | 🔴 Needs verification |
| Auth Flow | 🟡 Needs testing |
| Booking API | ✅ Working |
| My Bookings Screen | ✅ Real data |
| Calendar Range | ✅ 12 months |
| Calendar UX | 🟡 Could improve |
| Payment UX | 🟡 Could improve |
| Provider Photos | 🟡 Placeholder |
| Email Notifications | 🟡 Non-blocking |

---

## 🔧 USEFUL COMMANDS

### Git Migration Commands
```bash
# Create folder structure
mkdir -p ~/Development/findr-health

# Test SSH
ssh -T git@github.com

# Clone repos (after SSH configured)
cd ~/Development/findr-health
git clone git@github.com:Findr-Health/findr-health-mobile.git
git clone git@github.com:Findr-Health/carrotly-provider-database.git
git clone git@github.com:Findr-Health/carrotly-provider-mvp.git
```

### Compare Local Changes
```bash
# Check what changed in last 72 hours
find ~/Downloads/findr_health_app -name "*.dart" -mtime -3 -type f
```

### Flutter Commands (After Migration)
```bash
# Run app from correct location
cd ~/Development/findr-health/findr-health-mobile && flutter run
```

---

*Document Version: 8.0 - January 12, 2026*
*Previous Version: 7.0 - January 10, 2026*
