#!/usr/bin/env python3
"""Update OUTSTANDING_ISSUES with TestFlight bugs"""

OUTSTANDING_ISSUES_V25 = """# FINDR HEALTH - OUTSTANDING ISSUES
## Version 25 | Updated: January 18, 2026 (TestFlight Testing - Critical Bugs Found)

**Document Purpose:** Accurate tracking of all outstanding issues and tasks  
**Mission:** Enable providers and users with transparency and ease in navigating healthcare  
**Engineering Standard:** World-class, scalable, zero technical debt

**⚠️ TESTFLIGHT BUILD 2 STATUS: CRITICAL BUGS - DO NOT DISTRIBUTE**

---

## 🚨 CRITICAL BUGS (TestFlight Build 2)

### BUG #1: My Bookings - "Error Loading Bookings" ❌
**Status:** INVESTIGATING  
**Priority:** P0 - BLOCKER  
**Found:** January 18, 2026 (TestFlight testing)

**Symptom:**
- My Bookings tab shows "Error loading bookings"
- Persists after /api/users/me fix deployed

**Investigation:**
- ✅ Fixed /api/users/me endpoint (commit `5605546`)
- ❌ Error still persists
- ⏳ Need to identify actual API endpoint being called

**Root Cause:** TBD - investigating Flutter API call
**Fix ETA:** 1-2 hours

---

### BUG #2: Booking Submission Fails ❌
**Status:** NOT STARTED  
**Priority:** P0 - BLOCKER  
**Found:** January 18, 2026 (TestFlight testing)

**Symptom:**
- User completes booking flow
- Final "Submit" step fails
- No booking created

**Root Cause:** TBD - need device error logs
**Fix ETA:** 1-2 hours after investigation

---

### BUG #3: Biometric Login Broken ❌
**Status:** NOT STARTED  
**Priority:** P1 - HIGH  
**Found:** January 18, 2026 (TestFlight testing)

**Symptom:**
- Biometric login enabled in settings
- When swiping up to close app, prompts for passcode
- Biometric (Face ID/Touch ID) doesn't work
- Forces re-login

**Root Cause:** TBD
**Possible Causes:**
- Keychain/secure storage issue
- Session token not persisting
- Biometric integration broken

**Fix ETA:** 2-3 hours

---

### BUG #4: Search - "massage" Shows Dentists ❌
**Status:** NOT STARTED  
**Priority:** P2 - MEDIUM  
**Found:** January 18, 2026 (TestFlight testing)

**Symptom:**
- User searches "massage"
- Results show dental providers
- Search matching too broad

**Root Cause:** Multi-field search includes description field
- Dentists likely have "massage" in description text
- Need smarter ranking/prioritization

**Fix:**
- Add search result ranking by field match type
- Prioritize: service name > category > provider type > description

**Fix ETA:** 1-2 hours

---

### BUG #5: Location Search UI Misaligned ❌
**Status:** NOT STARTED  
**Priority:** P2 - MEDIUM  
**Found:** January 18, 2026 (TestFlight testing)

**Symptom:**
- Search by location (e.g., "San Francisco")
- Results display but UI alignment broken

**Root Cause:** CSS/layout issue
**Fix ETA:** 30 minutes

---

### BUG #6: Category Page 404 Error ❌
**Status:** NOT STARTED  
**Priority:** P2 - MEDIUM  
**Found:** January 18, 2026 (TestFlight testing)

**Symptom:**
- User searches "labs"
- Results show correctly
- Taps "Browse all lab services" button under Categories
- Gets "Page not found" error

**Root Cause:** Route doesn't exist for category browsing
**Fix:** Create category browse screen or remove button
**Fix ETA:** 1 hour

---

## 📊 PROGRESS TRACKER

| Category | Status | Notes |
|----------|--------|-------|
| UX Improvements | ✅ 100% | Complete Jan 18 |
| **My Bookings Tab** | 🔴 **BROKEN** | **P0 - Error loading** |
| **Booking Submission** | 🔴 **BROKEN** | **P0 - Cannot submit** |
| **Biometric Login** | 🔴 **BROKEN** | **P1 - Forces re-login** |
| Search Quality | 🟡 Issues | P2 - Works but inaccurate |
| TestFlight Build 2 | 🔴 **NOT READY** | Critical bugs found |

---

## 🎯 IMMEDIATE PRIORITIES (In Order)

### Priority 0 - BLOCKERS (Must fix before TestFlight distribution)

1. **Fix My Bookings Error** (1-2 hours)
   - Investigate actual API endpoint being called
   - Check Flutter bookings service
   - Verify backend /api/bookings/user/:userId endpoint
   - Test fix thoroughly

2. **Fix Booking Submission** (1-2 hours)
   - Get device error logs
   - Check Stripe integration
   - Verify payment flow
   - Test complete booking flow

3. **Fix Biometric Login** (2-3 hours)
   - Investigate secure storage
   - Check session persistence
   - Test biometric re-authentication
   - Verify keychain integration

### Priority 1 - HIGH (Should fix before distribution)

4. **Fix Search Quality** (1-2 hours)
   - Implement search result ranking
   - Prioritize service name matches
   - Test "massage", "therapy", etc.

5. **Fix UI/UX Issues** (1-2 hours)
   - Location search alignment
   - Category page 404 error
   - General polish

---

## 📋 TESTFLIGHT BUILD STATUS

**Build 2 (1.0.0+2):**
- ✅ UX improvements successful
- ✅ Deployed to TestFlight
- 🔴 **CRITICAL BUGS FOUND**
- ⚠️ **DO NOT DISTRIBUTE TO EXTERNAL TESTERS**

**Next Build (1.0.0+3):**
- Will include all bug fixes
- Full testing required before distribution
- Estimated: 8-12 hours of work

---

## 📈 ENGINEERING NOTES

**Today's Session (Jan 18):**
- ✅ Completed all 3 UX improvement phases
- ✅ Built and uploaded to TestFlight
- 🔴 TestFlight testing revealed critical bugs
- Status: Reverting to bug fixing mode

**Quality Assessment:**
- UX improvements: ⭐⭐⭐⭐⭐ (successful)
- Build stability: ⚠️⚠️ (critical bugs found)
- Next: Systematic bug fixing required

---

*Version 25 | January 18, 2026*  
*Status: TestFlight Build 2 - Critical Bugs Found*  
*Next: Fix P0 blockers before external testing*  
*Mission: Enable providers and users with transparency and ease in navigating healthcare*
"""

with open('OUTSTANDING_ISSUES.md', 'w') as f:
    f.write(OUTSTANDING_ISSUES_V25)

print("✅ Updated OUTSTANDING_ISSUES.md to v25")
print()
print("📋 Documented 6 critical bugs:")
print("   P0 BLOCKERS:")
print("   - Bug #1: My Bookings error")
print("   - Bug #2: Booking submission fails")
print("   - Bug #3: Biometric login broken")
print("   P2 MEDIUM:")
print("   - Bug #4: Search shows wrong results")
print("   - Bug #5: Location search UI issues")
print("   - Bug #6: Category page 404")
print()
print("⚠️  Build 2 marked as NOT READY for external testing")
print()
