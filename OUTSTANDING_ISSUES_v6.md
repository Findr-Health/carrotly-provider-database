# FINDR HEALTH - OUTSTANDING ISSUES
## Updated: January 10, 2026 (Start of Session)

---

## 🚨 SECURITY ALERT - IMMEDIATE ACTION

### Google API Key Exposed
**Status:** 🔴 ACTION REQUIRED
**Alert Source:** GitGuardian
**Repository:** Findr-Health/carrotly-provider-database (PUBLIC)
**Pushed Date:** January 7, 2026

**Likely Exposed Key:** "Google maps key User app Jan 2026" (created Jan 5, 2026)

**Resolution Steps:**
1. [ ] Run diagnostic commands to confirm which key
2. [ ] Rotate key in Google Cloud Console
3. [ ] Update key in Flutter app (Info.plist, AndroidManifest.xml)
4. [ ] Move to environment variables
5. [ ] Add .env to .gitignore

**Diagnostic Commands:**
```bash
cd ~/Desktop/carrotly-provider-database
git log -p --since="2026-01-06" --until="2026-01-08" | grep -i "AIza"
grep -r "AIza" . --include="*.js" --include="*.json"
```

---

## 🔴 CRITICAL - TestFlight Blockers

### Issue 1: Calendar Date Picker UX
**Status:** 🔴 NOT FIXED
**Severity:** HIGH - Poor user experience
**Problems:**
1. Cannot scroll beyond ~1 week (limited date range)
2. No month indicator shown
3. Unclear what month dates belong to

**File:** `~/Downloads/Findr_health_APP/lib/presentation/screens/booking/datetime_selection_screen.dart`

**Solution:** Replace with monthly calendar view using `table_calendar` package
- Show month/year header
- Allow 60+ day booking range
- Previous/next month navigation

---

### Issue 2: Booking Review Payment UX
**Status:** 🔴 NOT FIXED  
**Severity:** HIGH - Confusing UX
**Problem:** 
- Shows "Select payment method" but requires selection to proceed
- Apple Pay/Google Pay shown but may not work in simulator
- No "Pay at Visit" option visible (backend supports it)

**Expected Behavior:**
- Show "Pay at Visit" as prominent option
- Show "Add Card" for prepay
- Apple/Google Pay only on real devices
- Clear indication of what's required

**File:** `~/Downloads/Findr_health_APP/lib/presentation/screens/booking/booking_review_screen.dart`

---

### Issue 3: Booking Confirmation Screen
**Status:** 🟡 FIX APPLIED - NEEDS TESTING
**Severity:** HIGH - Booking works but UI doesn't complete
**Problem:** After booking succeeds (API returns 201), screen shows spinner forever
**Root Cause:** BookingModel.fromJson was failing on object responses
**Fix Applied:** Updated fromJson to handle provider/service as objects
**Action:** Test full booking flow to verify fix works

---

## 🟡 MEDIUM PRIORITY

### Issue 4: Onboarding "Findr Health" Text
**Status:** 🟡 UNTESTED
**Change Made:** Added "Findr Health" text above logo on onboarding screens
**File:** `onboarding_screen.dart`
**To Test:** 
```bash
xcrun simctl uninstall booted com.findrhealth.app && flutter run
```

---

### Issue 5: Email Service Timeout
**Status:** 🟡 WORKAROUND IN PLACE
**Problem:** SMTP connection timeout when sending booking notifications
**Workaround:** Made email calls non-blocking (fire-and-forget)
**Impact:** Bookings work, but users may not receive email confirmations
**Future Fix:** Configure reliable email service (SendGrid, AWS SES)

---

### Issue 6: Provider Photos
**Status:** 🟡 NOT STARTED
**Problem:** Test providers use placeholder images
**Action:** Upload real photos via Provider Portal or Admin Dashboard
**Files:** Cloudinary integration ready in both portals

---

## 🟢 LOW PRIORITY / Future

### Issue 7: Location Picker
**Status:** ⏳ NOT STARTED
**Problems:**
- "Use current location" shows wrong name
- City search autocomplete not working
**Effort:** 2-3 hours

---

### Issue 8: Provider Dashboard
**Status:** ⏳ NOT STARTED
**Requirements:**
- Provider-facing view of their profile
- Analytics (bookings, revenue, ratings)
- Different from admin dashboard
**Effort:** 8-10 hours

---

### Issue 9: Push Notifications
**Status:** ⏳ NOT STARTED
**Requirements:**
- Firebase FCM setup
- Backend notification triggers
**Effort:** 6-8 hours

---

## ✅ COMPLETED

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
| Terms of Service | Full 16-section legal document |

---

## 📋 JAN 10 SESSION PRIORITIES

### 🚨 Security (Do First):
1. [ ] Rotate exposed Google API key
2. [ ] Move API keys to environment variables

### Must Fix (TestFlight Blockers):
3. [ ] **Calendar date picker** - Monthly view, 60-day range
4. [ ] **Payment method UX** - Add "Pay at Visit" prominently
5. [ ] **Test booking confirmation** - Verify spinner fix works

### Should Test:
6. [ ] My Bookings shows real bookings
7. [ ] Onboarding "Findr Health" text (fresh install)
8. [ ] Full booking flow end-to-end

### If Time Permits:
9. [ ] Upload provider photos
10. [ ] TestFlight build prep

---

## 🔧 DEBUGGING COMMANDS

```bash
# Test booking API directly
curl -X POST "https://fearless-achievement-production.up.railway.app/api/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "providerId": "PROVIDER_ID",
    "service": {"serviceId": "test", "name": "Test", "category": "Medical", "duration": 30, "price": 100},
    "appointmentDate": "2026-02-05",
    "appointmentTime": "10:00 AM",
    "chargeType": "at_visit"
  }'

# Check user's bookings
curl -s "https://fearless-achievement-production.up.railway.app/api/bookings/user/USER_ID"

# Flutter analyze
cd ~/Downloads/Findr_health_APP && flutter analyze

# Fresh install (to test onboarding)
xcrun simctl uninstall booted com.findrhealth.app && flutter run

# Find exposed API keys
cd ~/Desktop/carrotly-provider-database
git log -p --since="2026-01-06" --until="2026-01-08" | grep -i "AIza"
```

---

## 📊 STATUS SUMMARY

| Category | Status |
|----------|--------|
| **Security** | 🔴 API key exposed - rotate NOW |
| Booking API | ✅ Working (at_visit mode) |
| My Bookings Screen | ✅ Fetches real data |
| Provider Type Filters | ✅ Fixed |
| Calendar Date Picker | 🔴 Needs work |
| Payment UX | 🔴 Needs work |
| Confirmation Screen | 🟡 Fix applied, needs test |
| Email Notifications | 🟡 Non-blocking workaround |
| TestFlight Ready | ⏳ Pending above fixes |

---

*Document Version: 6.0 - January 10, 2026*
