# FINDR HEALTH - OUTSTANDING ISSUES
## Version 15 | Updated: January 16, 2026 (Mid-Day)

**Document Purpose:** Accurate tracking of all outstanding issues and tasks  
**Mission:** Enable providers and users with transparency and ease in navigating healthcare  
**Methodology:** Maintain accuracy through rigorous verification and daily updates

---

## 📊 PROGRESS TRACKER

| Category | Status | Notes |
|----------|--------|-------|
| Google Calendar (Dashboard) | ✅ 100% | Complete |
| Microsoft Calendar (Dashboard) | ✅ 100% | Complete Jan 15 |
| Calendar Onboarding Step | ❌ 0% | Need StepCalendar.tsx |
| iCal/CalDAV Support | ❌ 0% | Planning needed |
| Request Booking Backend | ✅ 100% | **VERIFIED Jan 16** |
| Request Booking UX (Flutter) | ⚠️ 20% | Badge widget deployed |
| Request Booking UX (Portal) | ✅ 100% | **DEPLOYED Jan 16** |
| Request Booking UX (Admin) | ✅ 100% | **DEPLOYED Jan 16** |
| Admin Calendar Tab | ✅ 100% | **VERIFIED Jan 16** |
| Photo Upload Bug | 🔴 Investigation | Upload works, display broken |
| Pay a Bill Feature | ⏸️ Deferred | After calendar/booking/photos |

---

## ✅ COMPLETED TODAY (January 16, 2026)

### 1. Request Booking Backend - VERIFIED ✅
- **Status:** VERIFIED COMPLETE
- **Verified:** January 16, 2026
- **Evidence:** All V2 endpoints deployed and tested via curl

### 2. Admin Dashboard Calendar Tab - VERIFIED ✅
- **Status:** VERIFIED COMPLETE  
- **Verified:** January 16, 2026
- **Screenshot verified:** Pharmacy Test provider showing Microsoft Outlook connection
- **All features working:** OAuth health, sync diagnostics, booking integration health

### 3. Request Booking UX Documentation ✅
- **Created:** REQUEST_BOOKING_UX_RECOMMENDATION_v2.md (comprehensive guide)
- **Created:** deploy_request_booking.py (automation script)
- **Created:** REQUEST_BOOKING_COMMANDS.md (manual commands)
- **Contents:**
  - Complete state machine with all transitions
  - Stripe integration flow (hold/capture/cancel)
  - Flutter Consumer App specifications
  - Provider Portal specifications
  - Admin Dashboard specifications
  - Complete notification matrix
  - Testing strategy

### 4. Provider Portal - PendingRequestsWidget ✅
- **Status:** DEPLOYED
- **Component:** `src/components/PendingRequestsWidget.tsx`
- **Wired into:** `src/pages/Dashboard.tsx`
- **Features:**
  - Shows pending booking requests count
  - Confirm/Decline buttons
  - Auto-refresh every 30 seconds
  - Urgent booking highlighting
- **Deployed to:** Vercel (auto-deploy from main)

### 5. Admin Dashboard - BookingHealthDashboard ✅
- **Status:** DEPLOYED
- **Component:** `src/components/BookingHealthDashboard.jsx`
- **Wired into:** `src/components/Dashboard.jsx`
- **Features:**
  - Pending requests count
  - Confirmed bookings count
  - Completed bookings count
  - Revenue display
- **Deployed to:** Vercel (auto-deploy from main)

### 6. Flutter Consumer App - BookingModeBadge ✅
- **Status:** DEPLOYED (widget only)
- **Component:** `lib/widgets/booking_mode_badge.dart`
- **Features:**
  - Instant Book badge (green, bolt icon)
  - Request Booking badge (blue, schedule_send icon)
  - Response time display option
  - Compact mode for provider cards
- **Pushed to:** GitHub main branch
- **Remaining:** Wire into provider cards and detail screens

---

## 🟡 IN PROGRESS

### 7. Booking Modes UX in Consumer App (Flutter)
- **Status:** 20% COMPLETE
- **Priority:** P1

**Completed:**
- [x] BookingModeBadge widget created and pushed

**Remaining:**
- [ ] Wire badge into ProviderCard widget
- [ ] Wire badge into ProviderDetailScreen
- [ ] Update DateTimeSelectionScreen copy for request vs instant
- [ ] Create RescheduleResponseScreen (NEW)
- [ ] Add BookingStatusTimeline widget
- [ ] Branch BookingConfirmationScreen by booking type
- [ ] Update BookingsListScreen with status badges
- [ ] Implement deep linking from notifications
- [ ] Add offline queue handling

**Reference:** REQUEST_BOOKING_UX_RECOMMENDATION_v2.md

---

## 🟡 HIGH PRIORITY: Calendar Integration

### 8. Calendar Integration UX for NEW Provider Onboarding
- **Status:** NOT IMPLEMENTED
- **Priority:** P1

**Task:** Create `StepCalendar.tsx` in `carrotly-provider-mvp/src/components/onboarding/`

**Requirements:**
- Show ALL calendar integration options:
  - ✅ Google Calendar (backend complete)
  - ✅ Microsoft Outlook (backend complete)
  - 📜 iCal/CalDAV (Apple Calendar, etc.) - future
- Include "I'll manage manually" skip option
- Reuse OAuth logic from existing `src/pages/Calendar.tsx`

---

### 9. Additional Calendar Integrations - Planning Required
- **Status:** PLANNING NEEDED
- **Priority:** P2

**9a. iCal/CalDAV Support (Apple Calendar, etc.)**
- Research CalDAV protocol implementation
- Determine feasibility and effort estimate
- Create implementation plan

**9b. Simple Findr Booking Platform**
- Built-in booking calendar for providers without external calendars
- Manual availability entry
- Simple calendar UI in Provider Portal

---

## 🟢 MEDIUM PRIORITY

### 10. Provider Photo Upload - Investigation Required
- **Status:** BUG - Photos upload but don't display
- **Symptom:** Photos upload successfully in portal but don't appear in consumer app
- **Investigation Needed:**
  1. Check Cloudinary dashboard for saved photos
  2. Verify backend returns photo URLs in provider API response
  3. Check Flutter app photo display logic

---

### 11. Pay a Bill Feature - Deferred
- **Status:** DEFERRED until calendar/booking/photo issues resolved
- **Planned Features:**
  - Upload document or take photo
  - OCR scanning
  - AI analysis via Clarity
  - Suggest best prompt pay price

---

## ✅ PREVIOUSLY RESOLVED

| Issue | Resolved Date | Notes |
|-------|---------------|-------|
| iOS App Crash on Standalone Launch | Jan 15 | Removed problematic packages |
| Microsoft Calendar Integration | Jan 15 | Azure OAuth complete |
| Google Calendar Integration | Jan 14 | Dashboard page complete |
| Provider Portal Popup Warning | Jan 15 | justSavedRef fix |
| Calendar Date Picker UX | Jan 15 | Month indicator added |
| Stripe Connect Integration | Jan 14 | Fee structure complete |
| AI Chat Auth Required | Jan 14 | Guest sign-in screen |
| Admin Dashboard User List | Jan 14 | PCI compliant |
| Biometric Login | Deferred | Future TestFlight |

---

## 📅 CALENDAR INTEGRATION - STATUS MATRIX

| Component | Status | Notes |
|-----------|--------|-------|
| **Google Calendar** | | |
| └─ Backend OAuth Routes | ✅ Complete | Deployed |
| └─ Provider Portal Dashboard Page | ✅ Complete | `Calendar.tsx` |
| └─ Provider Onboarding Step | ❌ NOT BUILT | Need `StepCalendar.tsx` |
| **Microsoft Outlook** | | |
| └─ Backend OAuth Routes | ✅ Complete | Deployed Jan 15 |
| └─ Provider Portal Dashboard Page | ✅ Complete | `Calendar.tsx` |
| └─ Provider Onboarding Step | ❌ NOT BUILT | Need `StepCalendar.tsx` |
| **Admin Dashboard** | | |
| └─ Calendar status tab | ✅ Complete | Verified Jan 16 |
| **iCal/CalDAV** | | |
| └─ All components | ❌ NOT BUILT | Future planning |

---

## 🎯 NEXT PRIORITIES

### Immediate (Today)
1. **Wire BookingModeBadge into Flutter provider cards** - Continue Request Booking UX
2. **Investigate photo upload bug** - Check Cloudinary and API responses

### This Week
3. **Complete Flutter Request Booking UX** - All screens per spec
4. **Create StepCalendar.tsx** - Onboarding calendar integration
5. **Prepare TestFlight build** - Demo-ready app

---

## 📋 SESSION CONTINUITY

**Last Updated:** January 16, 2026, Mid-Day  
**Session Focus:** Request Booking UX deployment across all platforms  
**Key Files Created/Modified:**
- `findr-health-mobile/lib/widgets/booking_mode_badge.dart` (NEW)
- `carrotly-provider-mvp/src/components/PendingRequestsWidget.tsx` (NEW)
- `carrotly-provider-mvp/src/pages/Dashboard.tsx` (MODIFIED)
- `carrotly-provider-database/admin-dashboard/src/components/BookingHealthDashboard.jsx` (NEW)
- `carrotly-provider-database/admin-dashboard/src/components/Dashboard.jsx` (MODIFIED)

**Next Session:**
- Continue Flutter Request Booking UX implementation
- Wire BookingModeBadge into provider cards/detail screens
- Create RescheduleResponseScreen
- Create BookingStatusTimeline widget

---

*Version 15 | January 16, 2026*
