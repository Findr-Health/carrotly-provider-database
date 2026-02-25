# FINDR HEALTH - OUTSTANDING ISSUES
## Version 16 | Updated: January 17, 2026 (End of Session)

**Document Purpose:** Accurate tracking of all outstanding issues and tasks  
**Mission:** Enable providers and users with transparency and ease in navigating healthcare  
**Methodology:** Maintain accuracy through rigorous verification and daily updates  
**Engineering Standard:** World-class, scalable, zero technical debt

---

## 📊 PROGRESS TRACKER

| Category | Status | Notes |
|----------|--------|-------|
| Google Calendar (Dashboard) | ✅ 100% | Complete |
| Microsoft Calendar (Dashboard) | ✅ 100% | Complete Jan 15 |
| Calendar Onboarding Step | ❌ 0% | Need StepCalendar.tsx |
| iCal/CalDAV Support | ❌ 0% | Planning needed |
| Request Booking Backend | ✅ 100% | **VERIFIED Jan 16** |
| Request Booking UX (Flutter) | 🟡 45% | Badges + screens deployed |
| Request Booking UX (Portal) | ✅ 100% | **PendingRequestsPage DEPLOYED Jan 17** |
| Request Booking UX (Admin) | ✅ 100% | **DEPLOYED Jan 16** |
| Admin Calendar Tab | ✅ 100% | **VERIFIED Jan 16** |
| Calendar Skip Warning UX | ✅ 100% | **DEPLOYED Jan 17** |
| Photo Upload Bug | 🔴 Investigation | Upload works, display broken |
| Pay a Bill Feature | ⏸️ Deferred | After calendar/booking/photos |
| Findr Scheduling App | 📋 Planning | **NEW - Jan 17** |

---

## ✅ COMPLETED THIS SESSION (January 17, 2026)

### 1. Provider Portal - PendingRequestsPage ✅
- **Status:** DEPLOYED TO VERCEL
- **Commit:** `10e3a9e` - "feat: add PendingRequestsPage and calendar skip warning UX"
- **Route:** `/bookings/pending`
- **Features:**
  - Full pending requests list with urgency indicators
  - Confirm booking functionality
  - Propose reschedule modal with date/time picker
  - Decline booking modal with reason selection
  - Auto-refresh every 30 seconds
  - Responsive design with action buttons

### 2. Provider Portal - Calendar Skip Warning UX ✅
- **Status:** DEPLOYED TO VERCEL
- **Component:** Enhanced Section 7 in `CompleteProfile.tsx`
- **Features:**
  - Benefits messaging ("3x more bookings")
  - Demoted skip option (small link instead of prominent text)
  - Skip warning modal with consequences
  - "I understand" confirmation required to proceed without calendar

### 3. Flutter App - Request Booking Components ✅
- **Status:** PUSHED TO GITHUB
- **Commit:** `711b171` - "feat: add request booking notification components"
- **Files Created:**
  - `lib/screens/reschedule_response_screen.dart` - Accept/decline reschedule
  - `lib/widgets/booking_status_badge.dart` - Status badges for all states
  - `lib/widgets/booking_timeline_widget.dart` - Visual progress timeline
- **Build:** iOS build successful (67.6MB)

---

## 🔴 CRITICAL: Notification System Implementation

### 4. Reschedule & Cancellation Notifications
- **Status:** NOT IMPLEMENTED
- **Priority:** P0 - CRITICAL
- **Added:** January 17, 2026

**Required Notification Routes:**
| Event | Provider Notification | User Notification | Stripe Action |
|-------|----------------------|-------------------|---------------|
| User requests reschedule | ✅ Push + Email | - | Hold maintained |
| Provider proposes reschedule | - | ✅ Push + Email | Hold maintained |
| User accepts reschedule | ✅ Push + Email | ✅ Confirmation | Hold maintained |
| User declines reschedule | ✅ Push + Email | ✅ Refund notice | **CANCEL hold** |
| Provider cancels booking | - | ✅ Push + Email + Refund | **CANCEL hold** |
| User cancels booking | ✅ Push + Email | - | **CANCEL hold** (if applicable) |
| Booking expires (24hr) | ✅ Email | ✅ Push + Email | **CANCEL hold** |

**Backend Implementation Needed:**
```javascript
// Required in backend/routes/bookings.js or new notifications.js
POST /api/notifications/send
POST /api/bookings/:id/notify-reschedule
POST /api/bookings/:id/notify-cancellation

// Stripe webhook handlers needed
payment_intent.canceled → Release hold, notify user
payment_intent.succeeded → Confirm capture, notify both
```

**Files to Create/Modify:**
- `backend/routes/notifications.js` (NEW)
- `backend/services/notificationService.js` (NEW)
- `backend/routes/bookings.js` (ADD notification triggers)
- `backend/routes/webhooks.js` (ADD Stripe event handlers)

---

## 📋 NEW: Findr Health Scheduling App

### 5. Provider Scheduling Module
- **Status:** PLANNING PHASE
- **Priority:** P2 (after notifications complete)
- **Added:** January 17, 2026

**Vision:**
A basic web-based scheduling module integrated into the Provider Portal MVP that providers can use to manage ALL their appointments - both Findr Health bookings and manually-added customers from other sources.

**Core Requirements:**
1. **Web-based** - Part of Provider Portal (carrotly-provider-mvp)
2. **Best practice UX** - Clean, intuitive scheduling interface
3. **Dual-source management:**
   - Auto-populated from Findr Health user app bookings
   - Manual entry for customers from other channels (phone, walk-ins, other platforms)
4. **Calendar views:** Day, Week, Month
5. **Appointment management:** Create, edit, reschedule, cancel
6. **Customer database:** Track all patients, not just Findr users

**Technical Considerations:**
- Integrate with existing calendar OAuth (Google/Microsoft) for sync
- Consider conflict detection across all appointment sources
- Mobile-responsive design for providers on-the-go
- Real-time updates when Findr bookings come in

**Design Discussion Needed:**
- [ ] Full UX wireframes
- [ ] Data model for non-Findr customers
- [ ] Sync strategy with external calendars
- [ ] Notification preferences for manual vs Findr bookings
- [ ] Reporting/analytics requirements

**Deferred Until:** Notification system complete (Issue #4)

---

## 🟡 IN PROGRESS

### 6. Booking Modes UX in Consumer App (Flutter)
- **Status:** 45% COMPLETE
- **Priority:** P1

**Completed:**
- [x] BookingModeBadge widget created and pushed
- [x] BookingStatusBadge widget created and pushed
- [x] BookingTimelineWidget created and pushed
- [x] RescheduleResponseScreen created and pushed

**Remaining:**
- [ ] Wire BookingModeBadge into ProviderCard widget
- [ ] Wire BookingModeBadge into ProviderDetailScreen
- [ ] Update DateTimeSelectionScreen copy for request vs instant
- [ ] Branch BookingConfirmationScreen by booking type
- [ ] Update BookingsListScreen with status badges
- [ ] Implement deep linking from notifications
- [ ] Add offline queue handling

**Reference:** REQUEST_BOOKING_UX_RECOMMENDATION.md

---

## 🟡 HIGH PRIORITY: Calendar Integration

### 7. Calendar Integration UX for NEW Provider Onboarding
- **Status:** NOT IMPLEMENTED
- **Priority:** P1

**Task:** Create `StepCalendar.tsx` in `carrotly-provider-mvp/src/components/onboarding/`

**Requirements:**
- Show ALL calendar integration options:
  - ✅ Google Calendar (backend complete)
  - ✅ Microsoft Outlook (backend complete)
  - 📜 iCal/CalDAV (Apple Calendar, etc.) - future
- Include "I'll manage manually" skip option with warning modal
- Reuse OAuth logic from existing `src/pages/Calendar.tsx`

**Note:** Skip warning UX pattern already implemented in CompleteProfile.tsx - can reuse

---

### 8. Additional Calendar Integrations - Planning Required
- **Status:** PLANNING NEEDED
- **Priority:** P2

**8a. iCal/CalDAV Support (Apple Calendar, etc.)**
- Research CalDAV protocol implementation
- Determine feasibility and effort estimate
- Create implementation plan

**8b. Simple Findr Booking Platform**
- See Issue #5 - Now elevated to standalone Scheduling App
- Built-in booking calendar for providers without external calendars

---

## 🟢 MEDIUM PRIORITY

### 9. Provider Photo Upload - Investigation Required
- **Status:** BUG - Photos upload but don't display
- **Symptom:** Photos upload successfully in portal but don't appear in consumer app
- **Investigation Needed:**
  1. Check Cloudinary dashboard for saved photos
  2. Verify backend returns photo URLs in provider API response
  3. Check Flutter app photo display logic

---

### 10. Pay a Bill Feature - Deferred
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
| Request Booking Backend | Jan 16 | V2 endpoints verified |
| Admin Dashboard Calendar Tab | Jan 16 | Full functionality verified |
| Provider Portal PendingRequestsWidget | Jan 16 | Dashboard widget deployed |
| Admin BookingHealthDashboard | Jan 16 | Analytics widget deployed |
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

### Immediate (Next Session)
1. **Implement Notification System** (Issue #4) - CRITICAL for complete booking flow
2. **Wire BookingModeBadge into Flutter provider cards** - Continue Request Booking UX

### This Week
3. **Complete Flutter Request Booking UX** - All remaining screens per spec
4. **Create StepCalendar.tsx** - Onboarding calendar integration
5. **Investigate photo upload bug** - Check Cloudinary and API responses

### Next Week
6. **Design Findr Scheduling App** - Full UX/technical spec
7. **Prepare TestFlight build** - Demo-ready app

---

## 📋 SESSION CONTINUITY

**Last Updated:** January 17, 2026, End of Session  
**Session Focus:** Request Booking UX deployment across Provider Portal and Flutter App

**Key Deployments This Session:**
- Provider Portal: PendingRequestsPage + Calendar Skip Warning → Vercel
- Flutter: RescheduleResponseScreen + Status Badges + Timeline → GitHub

**Git Commits:**
- `carrotly-provider-mvp`: `10e3a9e` (main)
- `findr-health-mobile`: `711b171` (main)

**Next Session Priority:**
- Notification system implementation (backend routes + Stripe webhooks)
- Wire Flutter badges into existing provider screens

---

## 🔧 ENGINEERING NOTES

**Code Quality Checklist:**
- [ ] All new components have error handling
- [ ] API calls include loading states
- [ ] Responsive design verified
- [ ] No hardcoded values
- [ ] TypeScript types complete (Portal)
- [ ] Flutter analyze passes

**Technical Debt Status:** ✅ MINIMAL
- Clean component architecture
- Proper separation of concerns
- Consistent naming conventions
- Documentation maintained

---

*Version 16 | January 17, 2026*  
*Engineering Lead Oversight: Active*  
*Next Review: January 18, 2026*
