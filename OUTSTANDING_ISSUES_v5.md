# FINDR HEALTH - OUTSTANDING ISSUES
## Updated: January 9, 2026 (End of Session)

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
**Solution Needed:** Implement scrollable month calendar with clear month/year header, allow booking 30+ days out

---

### Issue 2: Booking Review Payment UX
**Status:** 🔴 NOT FIXED
**Severity:** HIGH - Confusing UX
**Problem:** Shows "Google Pay" as default payment method even when no actual payment is configured
**Expected Behavior:** 
- If no payment method selected, show "Pay at Visit" or "Select Payment Method"
- Make it clear whether payment is required or optional
- Don't show fake payment methods
**File:** `~/Downloads/Findr_health_APP/lib/presentation/screens/booking/booking_review_screen.dart`

---

### Issue 3: Booking Confirmation Screen Not Showing
**Status:** 🟡 PARTIALLY FIXED
**Severity:** HIGH - Booking works but UI doesn't complete
**Problem:** After booking succeeds (API returns 201), screen shows spinner forever
**Root Cause:** BookingModel.fromJson was failing on object responses
**Fix Applied:** Updated fromJson to handle provider/service as objects
**Needs Testing:** Verify the fix works - spinner should clear and show confirmation

---

## 🟡 MEDIUM PRIORITY

### Issue 4: Onboarding "Findr Health" Text
**Status:** 🟡 UNTESTED
**Change Made:** Added "Findr Health" text above logo on onboarding screens
**File:** `~/Downloads/Findr_health_APP/lib/presentation/screens/onboarding/onboarding_screen.dart`
**To Test:** Uninstall app (`xcrun simctl uninstall booted com.findrhealth.app`) then reinstall

---

### Issue 5: Email Service Timeout
**Status:** 🟡 WORKAROUND IN PLACE
**Problem:** SMTP connection timeout when sending booking notifications
**Workaround:** Made email calls non-blocking (fire-and-forget)
**Impact:** Bookings work, but users may not receive email confirmations
**Future Fix:** Configure reliable email service (SendGrid, AWS SES, etc.)

---

### Issue 6: Provider Photos
**Status:** 🟡 NOT STARTED
**Problem:** Test providers use placeholder images
**Action:** Upload real photos via Provider Portal for demo

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

## ✅ FIXED JAN 9, 2026

| Issue | Status | Solution |
|-------|--------|----------|
| Booking API not called | ✅ FIXED | Uncommented TODO, implemented chargeType |
| My Bookings hardcoded | ✅ FIXED | Complete rewrite to fetch real data |
| Provider type filters broken | ✅ FIXED | Title Case IDs |
| My Bookings back button | ✅ FIXED | Navigate to home |
| Search tiles hard to read | ✅ FIXED | Soft tint style |
| Location permission overflow | ✅ FIXED | Made scrollable |
| Help & Support crash | ✅ FIXED | Removed Clarity chat button |
| Stripe 'cash' error | ✅ FIXED | Use chargeType: 'at_visit' |
| Email blocking booking | ✅ FIXED | Made non-blocking |

---

## 📋 JAN 10 SESSION PRIORITIES

### Must Fix (TestFlight Blockers):
1. [ ] **Test booking confirmation screen** - Verify BookingModel fix works
2. [ ] **Calendar date picker** - Add month display, extend date range
3. [ ] **Payment method UX** - Show "Pay at Visit" instead of fake Google Pay

### Should Test:
4. [ ] My Bookings shows real bookings
5. [ ] Onboarding "Findr Health" text (fresh install)
6. [ ] Full booking flow end-to-end

### If Time Permits:
7. [ ] Upload provider photos
8. [ ] TestFlight build

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
```

---

## 📊 STATUS SUMMARY

| Category | Status |
|----------|--------|
| Booking API | ✅ Working (at_visit mode) |
| My Bookings Screen | ✅ Fetches real data |
| Provider Type Filters | ✅ Fixed |
| Calendar Date Picker | 🔴 Needs work |
| Payment UX | 🔴 Needs work |
| Confirmation Screen | 🟡 Fix applied, needs test |
| Email Notifications | 🟡 Non-blocking workaround |
| TestFlight Ready | ⏳ Pending above fixes |

---

*Document Version: 5.0 - Updated Jan 9, 2026*
