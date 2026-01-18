# DEEP LINKING - TEST PLAN
## Manual Testing Checklist

**Build:** iOS 67.6MB  
**Status:** Ready for testing

---

## 📋 TEST SCENARIOS

### Test 1: Booking Confirmed → Detail Screen
1. Create booking request
2. Provider confirms
3. Tap notification in app
**Expected:** Navigate to booking detail, mark as read
**Pass/Fail:** ⬜

### Test 2: Reschedule Proposed → Actions
1. Provider proposes reschedule
2. Tap notification
**Expected:** Shows Accept/Decline buttons
**Pass/Fail:** ⬜

### Test 3: Deleted Booking → Error Handling
1. Delete booking from DB
2. Tap notification
**Expected:** "Booking not found" message, no crash
**Pass/Fail:** ⬜

### Test 4: Network Error → Retry
1. Turn off WiFi
2. Tap notification
**Expected:** Shows error, retry button works
**Pass/Fail:** ⬜

### Test 5: All Notification Types
Test each type navigates correctly:
- ⬜ Booking Request Created
- ⬜ Booking Confirmed
- ⬜ Booking Declined
- ⬜ Reschedule Proposed
- ⬜ Reschedule Accepted
- ⬜ Reschedule Declined
- ⬜ Booking Cancelled
- ⬜ Booking Expired

### Test 6: Already Read Notification
**Expected:** Still navigates, no duplicate API call
**Pass/Fail:** ⬜

### Test 7: Back Navigation
**Expected:** Returns to notifications screen
**Pass/Fail:** ⬜

### Test 8: Mark All as Read
**Expected:** All marked read, still navigate correctly
**Pass/Fail:** ⬜

---

## ✅ SUCCESS CRITERIA
- ⬜ All 8 tests pass
- ⬜ No crashes
- ⬜ Notifications marked as read
- ⬜ Badge counts update

---

*Full test plan: See complete DEEP_LINKING_TEST_PLAN.md in repository*
