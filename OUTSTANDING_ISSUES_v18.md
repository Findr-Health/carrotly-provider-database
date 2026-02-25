# FINDR HEALTH - OUTSTANDING ISSUES
## Version 18 | Updated: January 17, 2026 (Evening Session)

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
| Request Booking UX (Flutter) | 🟢 85% | Badges wired, screens updated |
| Request Booking UX (Portal) | ✅ 100% | **PendingRequestsPage DEPLOYED Jan 17** |
| Request Booking UX (Admin) | ✅ 100% | **DEPLOYED Jan 16** |
| Admin Calendar Tab | ✅ 100% | **VERIFIED Jan 16** |
| Calendar Skip Warning UX | ✅ 100% | **DEPLOYED Jan 17** |
| **Notification System** | ✅ 100% | **COMPLETE Jan 17 Evening** |
| Photo Upload Bug | 🔴 Investigation | Upload works, display broken |
| Pay a Bill Feature | ⏸️ Deferred | After calendar/booking/photos |
| Findr Scheduling App | 📋 Planning | **NEW - Jan 17** |

---

## ✅ ISSUE #1: Notification System (COMPLETE)

**Status:** ✅ IMPLEMENTED  
**Priority:** P0 - HIGHEST  
**Completed:** January 17, 2026 (Evening)

### What Was Built

**Backend (Railway):**
- ✅ `NotificationService.js` - Email templates for all booking events
- ✅ `Notification.js` model - MongoDB schema for in-app notifications
- ✅ `notifications.js` routes - API endpoints (registered in server.js)
- ✅ In-app notification creation - Every email also creates database record
- ✅ Deployed to Railway

**Flutter App:**
- ✅ `NotificationApiService` - API integration using existing Dio/AuthInterceptor
- ✅ `NotificationProvider` - Riverpod state management
- ✅ Bell icon with unread count badge on home screen
- ✅ `NotificationsScreen` - Real-time API data with pull-to-refresh
- ✅ Mark as read functionality (single and bulk)
- ✅ Deep linking to booking details from notifications

**Git Commits:**
- Backend: `3deb2b9`, `4283750`
- Flutter: `270c1c1`, `05dfa85`, `f4b666e`

### Notification Matrix Implemented

| Event | Provider | User | Stripe Action |
|-------|----------|------|---------------|
| Booking request created | ✅ Email | ✅ Confirmation | Hold created |
| Provider confirms | - | ✅ Email | Hold maintained |
| Provider declines | - | ✅ Email | **CANCEL hold** |
| Provider proposes reschedule | - | ✅ Email | Hold maintained |
| User accepts reschedule | ✅ Email | ✅ Confirmation | Hold maintained |
| User declines reschedule | ✅ Email | ✅ Refund notice | **CANCEL hold** |
| Provider cancels | - | ✅ Email+Refund | **CANCEL hold** |
| User cancels | ✅ Email | - | **CANCEL hold** |
| Booking expires (24hr) | ✅ Email | ✅ Email | **CANCEL hold** |

### API Endpoints Live
- `GET /api/notifications/user/:userId`
- `GET /api/notifications/provider/:providerId`
- `GET /api/notifications/unread-count/:recipientType/:recipientId`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all/:recipientType/:recipientId`
- `DELETE /api/notifications/:id`

---

## 🟢 ISSUE #2: Flutter Badge Wiring (85% COMPLETE)

**Status:** 85% COMPLETE  
**Priority:** P1  
**Updated:** January 17, 2026 (Evening)

### Completed ✅
- [x] BookingModeBadge widget (`lib/widgets/booking_mode_badge.dart`)
- [x] BookingStatusBadge widget (`lib/widgets/booking_status_badge.dart`)
- [x] BookingTimelineWidget (`lib/widgets/booking_timeline_widget.dart`)
- [x] RescheduleResponseScreen (`lib/screens/reschedule_response_screen.dart`)
- [x] Wire BookingModeBadge into `provider_card.dart`
- [x] Wire BookingModeBadge into `provider_detail_screen.dart`
- [x] Wire BookingModeBadge into `map_search_screen.dart`
- [x] NotificationProvider and NotificationApiService
- [x] NotificationsScreen updated to use API

### Remaining 🔲
- [ ] Update `DateTimeSelectionScreen` copy for request vs instant
- [ ] Branch `BookingConfirmationScreen` by booking type
- [ ] Update `BookingsListScreen` with status badges
- [ ] Implement deep linking from notifications
- [ ] Add offline queue handling

### Files to Modify
```
lib/presentation/screens/booking/date_time_selection_screen.dart  ← NEXT
lib/presentation/screens/booking/booking_confirmation_screen.dart
lib/presentation/screens/my_bookings/my_bookings_screen.dart
```

### Reference Document
REQUEST_BOOKING_UX_RECOMMENDATION.md

---

## 🟡 ISSUE #3: Calendar Onboarding Step

**Status:** NOT IMPLEMENTED  
**Priority:** P1  
**Impact:** New providers don't see calendar integration during onboarding

### Task
Create `StepCalendar.tsx` in `carrotly-provider-mvp/src/components/onboarding/`

### Requirements
- Show Google Calendar OAuth button
- Show Microsoft Outlook OAuth button
- Include "I'll manage manually" skip option with warning modal
- Reuse OAuth logic from existing `src/pages/Calendar.tsx`
- Apply skip warning pattern already implemented in `CompleteProfile.tsx`

### Backend Status
- ✅ Google Calendar OAuth routes complete
- ✅ Microsoft Calendar OAuth routes complete
- ✅ Skip warning UX pattern exists

---

## 📋 ISSUE #4: Findr Health Scheduling App (NEW)

**Status:** PLANNING PHASE  
**Priority:** P2 (after DateTimeSelectionScreen UX)  
**Added:** January 17, 2026

### Vision
A basic web-based scheduling module integrated into the Provider Portal MVP that providers can use to manage ALL appointments - both Findr Health bookings and manually-added customers from other sources.

### Core Requirements
1. **Web-based** - Part of Provider Portal (carrotly-provider-mvp)
2. **Best practice UX** - Clean, intuitive scheduling interface
3. **Dual-source management:**
   - Auto-populated from Findr Health user app bookings
   - Manual entry for customers from other channels (phone, walk-ins, other platforms)
4. **Calendar views:** Day, Week, Month
5. **Appointment management:** Create, edit, reschedule, cancel
6. **Customer database:** Track all patients, not just Findr users

### Technical Considerations
- Integrate with existing calendar OAuth (Google/Microsoft) for sync
- Consider conflict detection across all appointment sources
- Mobile-responsive design for providers on-the-go
- Real-time updates when Findr bookings come in

### Design Decisions Needed
- [ ] Full UX wireframes
- [ ] Data model for non-Findr customers
- [ ] Sync strategy with external calendars
- [ ] Notification preferences for manual vs Findr bookings
- [ ] Reporting/analytics requirements

**Deferred Until:** DateTimeSelectionScreen UX complete (Issue #2)

---

## 🟢 ISSUE #5: Photo Upload Bug

**Status:** INVESTIGATION NEEDED  
**Priority:** P2  
**Symptom:** Photos upload successfully in portal but don't appear in consumer app

### Investigation Checklist
1. [ ] Check Cloudinary dashboard for saved photos
2. [ ] Verify backend returns photo URLs in provider API response
3. [ ] Check Flutter app photo display logic
4. [ ] Test with specific provider ID

---

## ⏸️ ISSUE #6: Pay a Bill Feature (Deferred)

**Status:** DEFERRED  
**Planned After:** Calendar/booking/photo issues resolved

### Planned Features
- Upload document or take photo
- OCR scanning
- AI analysis via Clarity
- Suggest best prompt pay price

---

## ⚠️ ISSUE #7: Stripe Reschedule Flow Verification (NEW)

**Status:** VERIFICATION NEEDED  
**Priority:** P0 - CRITICAL  
**Added:** January 17, 2026 (Evening)

### Verification Required
When a provider proposes a reschedule for a request booking:
- [ ] Verify Stripe hold remains ACTIVE (not captured)
- [ ] Verify hold is captured when user accepts reschedule
- [ ] Verify hold is cancelled when user declines reschedule
- [ ] Test full flow with real Stripe test account

### Expected Behavior
1. User requests time → Stripe creates hold
2. Provider proposes new time → Hold **stays active**
3. User accepts → Hold **captured** (payment processed)
4. User declines → Hold **cancelled** (refund issued)

### Files to Check
- `backend/routes/bookings.js` - reschedule endpoints
- `backend/services/BookingStateMachine.js` - state transitions
- `backend/routes/webhooks.js` - Stripe webhook handlers

---

## ✅ PREVIOUSLY RESOLVED

| Issue | Resolved Date | Notes |
|-------|---------------|-------|
| Notification System | **Jan 17 Evening** | Backend + Flutter complete |
| Flutter Badge Wiring (partial) | **Jan 17 Evening** | 85% complete |
| Request Booking Backend | Jan 16 | V2 endpoints verified |
| Admin Dashboard Calendar Tab | Jan 16 | Full functionality verified |
| Provider Portal PendingRequestsWidget | Jan 16 | Dashboard widget deployed |
| Admin BookingHealthDashboard | Jan 16 | Analytics widget deployed |
| Provider Portal PendingRequestsPage | Jan 17 | Full page with actions |
| Calendar Skip Warning UX | Jan 17 | Benefits messaging + modal |
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

## 📅 CALENDAR INTEGRATION STATUS MATRIX

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

## 🎯 PRIORITIZED ACTION PLAN

### Immediate (This Session Continued)
1. **✅ DONE: Notification System** (Issue #1)
   - ✅ Backend complete
   - ✅ Flutter complete
   - ✅ Deployed and tested

2. **Verify Stripe Reschedule Flow** (Issue #7 - NEW)
   - Check reschedule endpoint Stripe handling
   - Verify hold management on accept/decline
   - Test with Stripe test account

3. **Complete DateTimeSelectionScreen UX** (Issue #2)
   - Update copy: "Request Your Preferred Time" vs "Select Time"
   - Add booking mode context to screen
   - Test UI flow

### This Week
4. **Branch BookingConfirmationScreen** - Different UI for instant vs request
5. **Update BookingsListScreen** - Add status badges for all booking states
6. **Create StepCalendar.tsx** - Onboarding calendar integration
7. **Investigate Photo Upload Bug** - Cloudinary + API check

### Next Week
8. **Design Findr Scheduling App** - Full UX/technical spec
9. **Prepare TestFlight Build** - Demo-ready app with test providers

---

## 📋 SESSION CONTINUITY

**Current Session (Jan 17 Evening):**
- ✅ Fixed duplicate bell icon code in home_screen.dart
- ✅ Implemented complete notification system (backend + Flutter)
- ✅ Wired badges into provider cards/detail screens
- ✅ Updated notifications screen to use API
- ✅ Tested and deployed all changes
- 🔄 IN PROGRESS: Verify Stripe reschedule flow
- 🔜 NEXT: DateTimeSelectionScreen UX updates

**Git Commits (Current Session):**
- Backend: `3deb2b9` (notification routes), `4283750` (in-app notifications)
- Flutter: `270c1c1` (badges in cards), `05dfa85` (badge in detail), `f4b666e` (notification system)

---

## 🔧 ENGINEERING NOTES

**Code Quality Checklist:**
- [x] All new components have error handling
- [x] API calls include loading states
- [x] Responsive design verified
- [x] No hardcoded values
- [x] TypeScript types complete (Portal)
- [x] Flutter analyze passes (0 errors)

**Technical Debt Status:** ✅ MINIMAL
- Clean component architecture
- Proper separation of concerns
- Consistent naming conventions
- Documentation maintained
- Notification system uses existing patterns (Dio, AuthInterceptor)

---

## 🔗 QUICK REFERENCE

### Live URLs
| Service | URL |
|---------|-----|
| Backend API | https://fearless-achievement-production.up.railway.app/api |
| Provider Portal | https://findrhealth-provider.vercel.app |
| Admin Dashboard | https://admin-findrhealth-dashboard.vercel.app |

### Local Paths
```
~/Development/findr-health/
├── findr-health-mobile/          ← Flutter consumer app
├── carrotly-provider-database/   ← Backend + Admin Dashboard
├── carrotly-provider-mvp/        ← Provider Portal
└── docs/                         ← Documentation
```

### Test Account
- Email: `gagi@findrhealth.com`
- Password: `Test1234!`

---

*Version 18 | January 17, 2026 (Evening Session)*  
*Engineering Lead Oversight: Active*  
*Next Review: Session End*  
*Mission: Enable providers and users with transparency and ease in navigating healthcare*
