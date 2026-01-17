# FINDR HEALTH - OUTSTANDING ISSUES
## Version 20 | Updated: January 17, 2026 (Evening - Audit Complete)

**Document Purpose:** Accurate tracking of all outstanding issues and tasks  
**Mission:** Enable providers and users with transparency and ease in navigating healthcare  
**Engineering Standard:** World-class, scalable, zero technical debt

---

## �� PROGRESS TRACKER

| Category | Status | Notes |
|----------|--------|-------|
| Google Calendar (Dashboard) | ✅ 100% | Complete |
| Microsoft Calendar (Dashboard) | ✅ 100% | Complete Jan 15 |
| **Calendar Onboarding** | ✅ **100%** | **Already exists in CompleteProfile.tsx!** |
| Request Booking Backend | ✅ 100% | Verified Jan 16 |
| Request Booking UX (Flutter) | ✅ 100% | Complete Jan 17 |
| Request Booking UX (Portal) | ✅ 100% | Complete |
| Notification System | ✅ 100% | Complete Jan 17 |
| Photo Upload Bug | 🔴 Investigation | **NEXT PRIORITY** |
| Demo Providers | ✅ Complete | User confirmed deployed |

---

## ✅ DISCOVERED: Calendar Onboarding Already Complete!

**Status:** ✅ ALREADY IMPLEMENTED  
**Location:** `carrotly-provider-mvp/src/pages/onboarding/CompleteProfile.tsx` (lines 1456-1700)

### What Exists
- ✅ Google Calendar OAuth button (`connectGoogleCalendar()` at line 435)
- ✅ Microsoft Outlook OAuth button (`connectMicrosoftCalendar()` at line 460)
- ✅ Skip warning modal with persuasive messaging
- ✅ Benefits explanation ("3x more bookings", "zero manual work")
- ✅ Sync settings (direction, buffer time, privacy options)
- ✅ Connected status display with disconnect option

### Discovery Notes
- Initially thought StepCalendar.tsx was needed
- Discovered Step*.tsx components aren't used (onboarding is single-page)
- CompleteProfile.tsx already has complete calendar integration
- **No work needed** - marking as ✅ COMPLETE

---

## ✅ COMPLETED SYSTEMS (Jan 17 Evening)

### Notification System (100%)
- Backend: NotificationService, routes, MongoDB model
- Flutter: Bell badge, notification center, API integration
- Commits: `3deb2b9`, `4283750`, `f4b666e`

### Request Booking UX (100%)
- All booking mode badges wired
- DateTimeSelectionScreen UX updated
- BookingConfirmationScreen branched
- MyBookingsScreen status badges
- Commits: `270c1c1`, `05dfa85`, `4710163`, `5e2f3bb`, `f24dbd3`

### Stripe Reschedule Flow
- ✅ Verified payment holds managed correctly
- Provider proposes → hold stays active
- User accepts → hold captured
- User declines → hold cancelled

---

## 🔴 ISSUE #1: Photo Upload Bug (NEXT PRIORITY)

**Priority:** P1 - HIGH  
**Symptom:** Photos upload successfully in portal but don't display in consumer app

### Investigation Steps
1. [ ] Check Cloudinary dashboard for saved photos
2. [ ] Verify backend API returns photo URLs
3. [ ] Check Flutter image display logic
4. [ ] Verify URL format compatibility
5. [ ] Test with specific provider ID

### Files to Check
- Portal: Photo upload in CompleteProfile.tsx
- Backend: `/routes/upload.js`, `Provider.js` model
- Flutter: Provider card/detail photo display
- Cloudinary: URL generation and transforms

---

## 🎯 NEXT PRIORITIES

1. **Photo Upload Bug** - Investigation & fix (30 min - 2 hours)
2. **Deep Linking** - From notifications to booking details
3. **TestFlight Prep** - End-to-end testing

---

## 📋 SESSION SUMMARY (Jan 17 Evening)

**Major Achievements:**
- ✅ Notification System: 100% complete
- ✅ Request Booking UX: 100% complete
- ✅ Calendar Onboarding: Discovered already complete
- ✅ Stripe Flow: Verified production-ready
- ✅ Documentation: Cleaned up and consolidated

**Code Metrics:**
- 7 Flutter commits, all builds successful
- 2 backend commits
- ~1,500+ lines of code
- 0 technical debt added
- 0 errors in flutter analyze

**Next Session:**
- Photo upload bug investigation
- Deep linking implementation
- TestFlight preparation

---

*Version 20 | January 17, 2026*  
*Status: Ready for photo bug investigation*
