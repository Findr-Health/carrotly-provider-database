# FINDR HEALTH - OUTSTANDING ISSUES
## Version 17 | Updated: January 17, 2026 (New Session)

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
| Request Booking UX (Flutter) | 🟡 45% | Badges + screens created, wiring pending |
| Request Booking UX (Portal) | ✅ 100% | **PendingRequestsPage DEPLOYED Jan 17** |
| Request Booking UX (Admin) | ✅ 100% | **DEPLOYED Jan 16** |
| Admin Calendar Tab | ✅ 100% | **VERIFIED Jan 16** |
| Calendar Skip Warning UX | ✅ 100% | **DEPLOYED Jan 17** |
| Notification System | 🔴 0% | **CRITICAL GAP** |
| Photo Upload Bug | 🔴 Investigation | Upload works, display broken |
| Pay a Bill Feature | ⏸️ Deferred | After calendar/booking/photos |
| Findr Scheduling App | 📋 Planning | **NEW - Jan 17** |

---

## 🔴 ISSUE #1: Notification System (CRITICAL)

**Status:** NOT IMPLEMENTED  
**Priority:** P0 - HIGHEST  
**Impact:** Booking flow incomplete without notifications  
**Added:** January 17, 2026

### Problem Statement
The booking system backend is complete, but no notifications are sent when booking events occur. Users and providers have no visibility into booking status changes.

### Required Implementation

**Backend Files to Create:**
- `backend/services/NotificationService.js` - Email + Push notification service
- `backend/routes/notifications.js` - API endpoints for triggering notifications

**Backend Files to Modify:**
- `backend/routes/webhooks.js` - Add Stripe event handlers
- `backend/routes/bookings.js` - Trigger notifications on status changes

### Notification Matrix

| Event | Provider | User | Stripe Action |
|-------|----------|------|---------------|
| Booking request created | ✅ Email+Push | ✅ Confirmation | Hold created |
| Provider confirms | - | ✅ Email+Push | Hold maintained |
| Provider declines | - | ✅ Email+Push | **CANCEL hold** |
| Provider proposes reschedule | - | ✅ Email+Push | Hold maintained |
| User accepts reschedule | ✅ Email | ✅ Confirmation | Hold maintained |
| User declines reschedule | ✅ Email | ✅ Refund notice | **CANCEL hold** |
| Provider cancels | - | ✅ Email+Push+Refund | **CANCEL hold** |
| User cancels | ✅ Email+Push | - | **CANCEL hold** |
| Booking expires (24hr) | ✅ Email | ✅ Email+Push | **CANCEL hold** |

### Implementation Script
Available at: `findr_priority_implementation.py`
- Creates NotificationService.js (~600 lines)
- Creates notifications.js routes (~350 lines)
- Creates webhook guide for manual integration

### Next Steps
1. Run the implementation script
2. Register notification routes in server.js
3. Add webhook handlers to webhooks.js
4. Test notification flow
5. Deploy to Railway

---

## 🔴 ISSUE #2: Flutter Badge Wiring

**Status:** 45% COMPLETE  
**Priority:** P1  
**Impact:** Users can't see booking mode (instant vs request) in the app

### Completed
- [x] BookingModeBadge widget (`lib/widgets/booking_mode_badge.dart`)
- [x] BookingStatusBadge widget (`lib/widgets/booking_status_badge.dart`)
- [x] BookingTimelineWidget (`lib/widgets/booking_timeline_widget.dart`)
- [x] RescheduleResponseScreen (`lib/screens/reschedule_response_screen.dart`)
- [x] BookingApiExtensions (`lib/services/booking_api_extensions.dart`)

### Remaining
- [ ] Wire BookingModeBadge into `provider_card.dart`
- [ ] Wire BookingModeBadge into `provider_detail_screen.dart`
- [ ] Update `DateTimeSelectionScreen` copy for request vs instant
- [ ] Branch `BookingConfirmationScreen` by booking type
- [ ] Update `BookingsListScreen` with status badges
- [ ] Implement deep linking from notifications
- [ ] Add offline queue handling

### Files to Modify
```
lib/presentation/widgets/cards/provider_card.dart
lib/presentation/screens/provider_detail/provider_detail_screen.dart
lib/presentation/screens/booking/date_time_selection_screen.dart
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
**Priority:** P2 (after notifications complete)  
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

**Deferred Until:** Notification system complete (Issue #1)

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

## ✅ PREVIOUSLY RESOLVED

| Issue | Resolved Date | Notes |
|-------|---------------|-------|
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

### Immediate (This Session)
1. **Implement Notification System** (Issue #1)
   - Run findr_priority_implementation.py
   - Complete backend integration
   - Test notification flow
   - Deploy to Railway

2. **Wire Flutter Badges** (Issue #2)
   - Integrate BookingModeBadge into provider_card.dart
   - Integrate BookingModeBadge into provider_detail_screen.dart
   - Run flutter analyze
   - Build and push

### This Week
3. **Complete Flutter Request Booking UX** - All remaining screens
4. **Create StepCalendar.tsx** - Onboarding calendar integration
5. **Investigate Photo Upload Bug** - Cloudinary + API check

### Next Week
6. **Design Findr Scheduling App** - Full UX/technical spec
7. **Prepare TestFlight Build** - Demo-ready app

---

## 📋 SESSION CONTINUITY

**Previous Session (Jan 17):**
- Deployed PendingRequestsPage to Provider Portal
- Deployed Calendar Skip Warning UX
- Created Flutter components (StatusBadge, Timeline, RescheduleScreen)
- Created findr_priority_implementation.py script
- Completed backend integration manual steps

**Current Session Priority:**
- Notification system implementation
- Flutter badge wiring into provider UI

**Git Commits (Last Session):**
- `carrotly-provider-mvp`: `10e3a9e` (main)
- `findr-health-mobile`: `711b171` (main)

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

*Version 17 | January 17, 2026 (New Session)*  
*Engineering Lead Oversight: Active*  
*Next Review: Session End*  
*Mission: Enable providers and users with transparency and ease in navigating healthcare*
