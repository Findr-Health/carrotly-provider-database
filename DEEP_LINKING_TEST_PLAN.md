# DEEP LINKING - TEST PLAN
## Findr Health - Manual Testing Checklist

**Implementation Date:** January 17, 2026  
**Build Version:** iOS 67.6MB  
**Status:** ✅ READY FOR TESTING

---

## ✅ IMPLEMENTATION STATUS

All phases complete:
- ✅ Phase 1: Model has actionUrl field
- ✅ Phase 2: Router configured with /booking/:id
- ✅ Phase 3: Backend sends correct actionUrl
- ✅ Phase 4: Tap handler navigates and marks as read
- ✅ Phase 5: BookingDetailScreen fetches by ID
- ✅ Phase 6: flutter analyze = 0 errors, build successful

---

## 🧪 MANUAL TEST SCENARIOS

### Test 1: Booking Confirmed Notification → Booking Detail

**Setup:**
1. Create a booking request as user
2. Log into provider portal
3. Confirm the booking

**Test Steps:**
1. Open Flutter app
2. Tap notification bell icon
3. Verify new notification appears: "Booking Confirmed"
4. Tap the notification

**Expected Results:**
- ✅ Navigates to BookingDetailScreen
- ✅ Shows correct booking details (provider, service, date/time)
- ✅ Shows "Confirmed" status badge
- ✅ Notification marked as read (badge changes color)
- ✅ Back button returns to notifications screen
- ✅ Bell badge decrements by 1

**Pass/Fail:** ⬜

---

### Test 2: Reschedule Proposed → Booking Detail with Actions

**Setup:**
1. Have an existing confirmed booking
2. Provider proposes reschedule

**Test Steps:**
1. Receive "Reschedule Proposed" notification
2. Tap notification in notifications screen

**Expected Results:**
- ✅ Navigates to BookingDetailScreen
- ✅ Shows reschedule details
- ✅ Shows Accept/Decline buttons
- ✅ Notification marked as read

**Pass/Fail:** ⬜

---

### Test 3: Deleted Booking → Error Handling

**Setup:**
1. Create a booking
2. Delete it from database manually (or cancel)
3. Keep the notification

**Test Steps:**
1. Tap notification for deleted booking

**Expected Results:**
- ✅ Navigates to BookingDetailScreen
- ✅ Shows "Booking not found" message
- ✅ Does NOT crash
- ✅ Can navigate back
- ✅ Notification still marked as read

**Pass/Fail:** ⬜

---

### Test 4: Network Error → Retry

**Setup:**
1. Have a valid notification
2. Turn OFF WiFi/cellular

**Test Steps:**
1. Tap notification

**Expected Results:**
- ✅ Shows loading indicator
- ✅ Shows network error message
- ✅ Shows "Retry" button
- ✅ Turn ON network and tap retry
- ✅ Successfully loads booking

**Pass/Fail:** ⬜

---

### Test 5: Multiple Notification Types

**Test all notification types navigate correctly:**

| Notification Type | Expected Route | Status |
|-------------------|----------------|--------|
| Booking Request Created | /booking/:id | ⬜ |
| Booking Confirmed | /booking/:id | ⬜ |
| Booking Declined | /booking/:id | ⬜ |
| Reschedule Proposed | /booking/:id | ⬜ |
| Reschedule Accepted | /booking/:id | ⬜ |
| Reschedule Declined | /booking/:id | ⬜ |
| Booking Cancelled | /booking/:id | ⬜ |
| Booking Expired | /booking/:id | ⬜ |

**Pass/Fail:** ⬜

---

### Test 6: Already Read Notification

**Setup:**
1. Mark a notification as read manually
2. Tap it again

**Expected Results:**
- ✅ Still navigates to booking detail
- ✅ Doesn't duplicate "mark as read" API call
- ✅ Works smoothly

**Pass/Fail:** ⬜

---

### Test 7: Back Navigation

**Test Steps:**
1. From Home → Notifications → Tap notification → Booking Detail
2. Press back button

**Expected Results:**
- ✅ Returns to Notifications screen (not Home)
- ✅ Navigation stack preserved correctly

**Pass/Fail:** ⬜

---

### Test 8: Mark All as Read

**Test Steps:**
1. Have 5+ unread notifications
2. Tap "Mark all read" button
3. Tap any notification

**Expected Results:**
- ✅ All notifications show as read
- ✅ Still navigates correctly
- ✅ Bell badge shows 0

**Pass/Fail:** ⬜

---

## 🔧 DEBUGGING TIPS

### If navigation doesn't work:
1. Check Flutter console for errors
2. Verify actionUrl in notification: `print(notification.actionUrl)`
3. Check go_router logs (debugLogDiagnostics: true)

### If booking doesn't load:
1. Check network tab for API call to `/api/bookings/:id`
2. Verify bookingId is correct
3. Check backend logs for errors

### If notification doesn't mark as read:
1. Check API response from `/api/notifications/:id/read`
2. Verify provider state updates
3. Check if UI rebuilds

---

## 📊 SUCCESS CRITERIA

**All tests must pass:**
- ⬜ All 8 test scenarios pass
- ⬜ No crashes
- ⬜ No unhandled errors
- ⬜ Smooth user experience
- ⬜ Notifications marked as read correctly
- ⬜ Badge counts update correctly

**Performance:**
- ⬜ Navigation feels instant (<200ms)
- ⬜ Loading states show for >500ms loads
- ⬜ No lag or jank

**Edge Cases:**
- ⬜ Handles deleted bookings gracefully
- ⬜ Handles network errors gracefully
- ⬜ Handles invalid actionUrls gracefully

---

## 🐛 KNOWN ISSUES / NOTES

*(Document any issues found during testing)*

---

## ✅ SIGN-OFF

**Tester:** _________________  
**Date:** _________________  
**Build:** iOS 67.6MB  
**Result:** ⬜ PASS  ⬜ FAIL  

**Notes:**
____________________________________________
____________________________________________
____________________________________________

---

*Test Plan Version: 1.0*  
*Created: January 17, 2026*  
*Status: Ready for manual testing*
