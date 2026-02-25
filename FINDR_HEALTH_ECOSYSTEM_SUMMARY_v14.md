# FINDR HEALTH ECOSYSTEM - COMPREHENSIVE SUMMARY
## Version 14 | Updated: January 17, 2026 (Evening Session)

**Document Purpose:** Comprehensive technical reference for the Findr Health platform  
**Mission:** Enable providers and users with transparency and ease in navigating healthcare  
**Accuracy Level:** Verified implementations only - gaps clearly identified  
**Engineering Standard:** World-class, scalable, zero technical debt

---

## 🏗️ SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FINDR HEALTH ECOSYSTEM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐   │
│   │   FLUTTER APP    │     │  PROVIDER PORTAL │     │ ADMIN DASHBOARD  │   │
│   │   (Consumer)     │     │  (carrotly-mvp)  │     │                  │   │
│   ├──────────────────┤     ├──────────────────┤     ├──────────────────┤   │
│   │ • Home/Browse    │     │ • Onboarding     │     │ • Provider Mgmt  │   │
│   │ • Search Overlay │     │ • Edit Profile   │     │ • Service Admin  │   │
│   │ • Category Browse│     │ • Services       │     │ • Analytics      │   │
│   │ • Provider Detail│     │ • Hours/Calendar │     │ • Approvals      │   │
│   │ • Booking Flow   │     │ • Team Members   │     │ • User Mgmt      │   │
│   │ • Payments       │     │ • Photos         │     │ • Verified/Featured│  │
│   │ • Profile/Auth   │     │ • Credentials    │     │ • Hours Tab      │   │
│   │ • Clarity AI ✅  │     │ • Policies       │     │ • Policies Tab ✅│   │
│   │ • Map Search     │     │ ✅ Stripe Connect│     │ • Payments Tab ✅│   │
│   │ • My Bookings    │     │ ✅ Calendar Page │     │ ✅ Calendar Tab  │   │
│   │ ✅ Date Picker   │     │ ✅ Skip Warning  │     │ ✅ BookingHealth │   │
│   │ ✅ Status Badges │     │ ✅ PendingReqs   │     │                  │   │
│   │ ✅ Reschedule    │     │ ❌ Calendar Step │     │                  │   │
│   │ ✅ Timeline      │     │ 📋 Scheduling App│     │                  │   │
│   │ ✅ Notifications │     │                  │     │                  │   │
│   │ ✅ Bell w/Badge  │     │                  │     │                  │   │
│   └────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘   │
│            │                        │                        │              │
│            └────────────────────────┼────────────────────────┘              │
│                                     │                                        │
│                                     ▼                                        │
│                    ┌────────────────────────────────────────┐               │
│                    │         NODE.JS BACKEND                │               │
│                    │  (Railway: fearless-achievement)       │               │
│                    ├────────────────────────────────────────┤               │
│                    │ • /api/providers ✅                    │               │
│                    │ • /api/bookings (v2 request mode) ✅   │               │
│                    │ • /api/users (admin routes) ✅         │               │
│                    │ • /api/payments (Stripe) ✅            │               │
│                    │ • /api/connect (Stripe Connect) ✅     │               │
│                    │ • /api/calendar (Google OAuth) ✅      │               │
│                    │ • /api/calendar (Microsoft) ✅         │               │
│                    │ • /api/upload (Cloudinary) ✅          │               │
│                    │ • /api/admin/* ✅                      │               │
│                    │ • ✅ /api/notifications (DEPLOYED)     │               │
│                    └────────────────┬───────────────────────┘               │
│                                     │                                        │
│                                     ▼                                        │
│                    ┌────────────────────────────────────────┐               │
│                    │         MONGODB ATLAS                  │               │
│                    ├────────────────────────────────────────┤               │
│                    │ • providers (33 total)                 │               │
│                    │ • users (10 records)                   │               │
│                    │ • bookings                             │               │
│                    │ • reviews                              │               │
│                    │ • servicetemplates (149 records)       │               │
│                    │ • ✅ notifications (NEW)               │               │
│                    └────────────────────────────────────────┘               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 GITHUB REPOSITORIES

| Repository | Visibility | Language | Purpose | Local Path |
|------------|------------|----------|---------|------------|
| `Findr-Health/carrotly-provider-database` | **PUBLIC** | Python/JS | Backend API + Admin Dashboard | `~/Development/findr-health/carrotly-provider-database` |
| `Findr-Health/carrotly-provider-mvp` | **PUBLIC** | TypeScript | Provider Onboarding Portal | `~/Development/findr-health/carrotly-provider-mvp` |
| `Findr-Health/findr-health-mobile` | **PRIVATE** | Dart | Flutter Consumer App | `~/Development/findr-health/findr-health-mobile` |

### ⚠️ Security Note
`carrotly-provider-database` is PUBLIC. Never commit API keys, secrets, or .env files.

---

## 🔗 LIVE DEPLOYMENTS

| Service | URL | Platform | Last Deploy |
|---------|-----|----------|-------------|
| Backend API | https://fearless-achievement-production.up.railway.app/api | Railway | **Jan 17 Evening** |
| Provider Portal | https://findrhealth-provider.vercel.app | Vercel | Jan 17 |
| Admin Dashboard | https://admin-findrhealth-dashboard.vercel.app | Vercel | Jan 16 |

---

## 🔔 NOTIFICATION SYSTEM ✅ COMPLETE

### Status: FULLY IMPLEMENTED (January 17, 2026 - Evening)

### Architecture
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      NOTIFICATION SYSTEM ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────┐                                                        │
│   │  Booking Event  │  (confirm, decline, reschedule, cancel, expire)       │
│   └────────┬────────┘                                                        │
│            │                                                                 │
│            ▼                                                                 │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │              NotificationService (Orchestrator)                  │       │
│   │  • Determines recipients (user, provider, or both)              │       │
│   │  • Renders email templates with booking data                    │       │
│   │  • Creates in-app notification record in MongoDB                │       │
│   │  • Logs all notifications for audit                             │       │
│   └────────┬────────────────┬────────────────────────────────────────┘       │
│            │                │                                                │
│            ▼                ▼                                                │
│   ┌──────────────┐  ┌──────────────┐                                        │
│   │    Email     │  │   In-App     │                                        │
│   │  (Gmail/SG)  │  │  (MongoDB)   │                                        │
│   │  ✅ Ready    │  │  ✅ Ready    │                                        │
│   └──────────────┘  └──────────────┘                                        │
│                                                                              │
│   Push Notifications (Firebase) - Future Phase                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Backend Components ✅

| Component | File | Status |
|-----------|------|--------|
| Notification Service | `backend/services/NotificationService.js` | ✅ Complete |
| Notification Model | `backend/models/Notification.js` | ✅ Complete |
| Notification Routes | `backend/routes/notifications.js` | ✅ Complete |
| Server Integration | `backend/server.js` | ✅ Routes registered |

### Flutter Components ✅

| Component | File | Status |
|-----------|------|--------|
| Notification Service | `lib/services/notification_service.dart` | ✅ Complete |
| Notification Provider | `lib/providers/notification_provider.dart` | ✅ Complete |
| Notifications Screen | `lib/presentation/screens/notifications/` | ✅ Updated |
| Bell Icon Badge | `lib/presentation/screens/home/home_screen.dart` | ✅ Complete |

### API Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/notifications/booking-created` | POST | Trigger booking notifications | ✅ |
| `/api/notifications/booking-confirmed` | POST | Trigger confirmation | ✅ |
| `/api/notifications/booking-declined` | POST | Trigger decline | ✅ |
| `/api/notifications/reschedule-proposed` | POST | Trigger reschedule | ✅ |
| `/api/notifications/user/:userId` | GET | Get user notifications | ✅ |
| `/api/notifications/provider/:providerId` | GET | Get provider notifications | ✅ |
| `/api/notifications/unread-count/:type/:id` | GET | Get unread count | ✅ |
| `/api/notifications/:id/read` | PATCH | Mark as read | ✅ |
| `/api/notifications/read-all/:type/:id` | PATCH | Mark all read | ✅ |

### Notification Events

| Event | Provider Email | User Email | In-App | Stripe |
|-------|---------------|-----------|--------|--------|
| Booking request created | ✅ | ✅ | ✅ | Hold created |
| Provider confirms | - | ✅ | ✅ | Hold maintained |
| Provider declines | - | ✅ | ✅ | Hold cancelled |
| Provider proposes reschedule | - | ✅ | ✅ | Hold maintained |
| User accepts reschedule | ✅ | ✅ | ✅ | Hold maintained |
| User declines reschedule | ✅ | ✅ | ✅ | Hold cancelled |
| Provider cancels | - | ✅ | ✅ | Hold cancelled |
| User cancels | ✅ | - | ✅ | Hold cancelled |
| Booking expires (24hr) | ✅ | ✅ | ✅ | Hold cancelled |

---

## 📅 REQUEST BOOKING SYSTEM ✅ VERIFIED

### Status: BACKEND COMPLETE (Verified Jan 16, 2026)

### Booking Modes

| Mode | Description | Calendar Required | Status |
|------|-------------|-------------------|--------|
| **Instant Book** | Immediate confirmation | Yes (Google/Microsoft) | ✅ Complete |
| **Request Booking** | Provider confirms within 48hrs | No | ✅ Complete |

### State Machine
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      REQUEST BOOKING STATE MACHINE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  slot_reserved → pending_payment → pending_confirmation                     │
│                                           │                                 │
│                     ┌─────────────────────┼─────────────────────┐          │
│                     │                     │                     │          │
│                     ▼                     ▼                     ▼          │
│               confirmed         reschedule_proposed         declined       │
│                     │                     │                     │          │
│                     │              ┌──────┴──────┐              │          │
│                     │              │             │              │          │
│                     │              ▼             ▼              │          │
│                     │         accepted      declined            │          │
│                     │              │             │              │          │
│                     └──────────────┼─────────────┘              │          │
│                                    │                            │          │
│                                    ▼                            ▼          │
│                    ┌─────────────────────────────┐      ┌──────────────┐  │
│                    │         completed           │      │   expired    │  │
│                    │       (payment captured)    │      │ (24hr timeout)│  │
│                    └─────────────────────────────┘      └──────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### API Endpoints (V2) ✅

| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/bookings` | POST | Create booking | ✅ |
| `/api/bookings/:id` | GET | Get booking details | ✅ |
| `/api/bookings/reserve-slot` | POST | Reserve slot (5 min TTL) | ✅ |
| `/api/bookings/provider/:id/pending` | GET | Get pending requests | ✅ |
| `/api/bookings/:id/confirm` | POST | Provider confirms | ✅ |
| `/api/bookings/:id/decline` | POST | Provider declines | ✅ |
| `/api/bookings/:id/reschedule` | POST | Propose new time | ✅ |
| `/api/bookings/:id/accept-reschedule` | POST | User accepts | ✅ |
| `/api/bookings/:id/decline-reschedule` | POST | User declines | ✅ |

### Stripe Payment Flow

| Action | Stripe API | Status |
|--------|-----------|--------|
| Create hold | `paymentIntents.create({ capture_method: 'manual' })` | ✅ |
| Capture on completion | `paymentIntents.capture()` | ✅ |
| Cancel on decline/expire | `paymentIntents.cancel()` | ✅ |
| 24hr expiration job | Cron job scheduled | ✅ |

### Frontend Implementation Status

| Platform | Component | Status |
|----------|-----------|--------|
| **Provider Portal** | | |
| └─ PendingRequestsPage | Full page with confirm/decline/reschedule | ✅ Jan 17 |
| └─ PendingRequestsWidget | Dashboard widget | ✅ Jan 16 |
| └─ Calendar Skip Warning | UX to encourage calendar adoption | ✅ Jan 17 |
| **Admin Dashboard** | | |
| └─ BookingHealthDashboard | Analytics widget | ✅ Jan 16 |
| **Flutter App** | | |
| └─ BookingModeBadge | Instant vs Request indicator widget | ✅ Wired |
| └─ BookingStatusBadge | All booking states widget | ✅ Created |
| └─ BookingTimelineWidget | Visual progress widget | ✅ Created |
| └─ RescheduleResponseScreen | Accept/decline proposed time | ✅ Created |
| └─ NotificationCenter | In-app notifications with badge | ✅ Complete |
| └─ Provider Card Integration | Badges in search/browse | ✅ Wired |
| └─ Provider Detail Integration | Badge in detail screen | ✅ Wired |
| └─ DateTimeSelectionScreen | Copy updates for request mode | ⚠️ Pending |
| └─ BookingConfirmationScreen | Branch by booking type | ⚠️ Pending |
| └─ Deep linking | From notifications | ⚠️ Pending |

---

## 💰 STRIPE CONNECT (Provider Payouts) ✅ COMPLETE

### Status: DEPLOYED (January 14, 2026)

| Component | Status |
|-----------|--------|
| Stripe Connect Express Onboarding | ✅ Complete |
| Provider Dashboard Link | ✅ Working |
| Fee Structure (10% + $1.50, cap $35) | ✅ Implemented |
| Admin Approval Required | ✅ Enforced |
| Payout Management | ✅ Functional |

### Fee Structure
```javascript
const calculatePlatformFee = (amount) => {
  const percentageFee = amount * 0.10;  // 10%
  const flatFee = 1.50;                 // $1.50
  const totalFee = percentageFee + flatFee;
  return Math.min(totalFee, 35.00);     // Capped at $35
};
```

---

## 📅 CALENDAR INTEGRATION

### Google Calendar ✅ COMPLETE
- OAuth 2.0 flow implemented
- Real-time availability sync
- Dashboard management page
- Admin oversight tab

### Microsoft Outlook ✅ COMPLETE
- Azure AD OAuth implemented (Jan 15)
- Calendar sync functional
- Integrated into same dashboard page
- Admin monitoring available

### Missing Components
- ❌ `StepCalendar.tsx` - Onboarding step for new providers
- ❌ iCal/CalDAV support - Apple Calendar integration

---

## 🤖 AI CHAT ASSISTANT (CLARITY) ✅ COMPLETE

### Features
- ✅ Booking assistance
- ✅ Provider search
- ✅ Healthcare question answering
- ✅ Deep linking to providers
- ✅ Authentication required (Jan 14)
- ✅ Guest sign-in flow

### Backend
- Claude 3.5 Sonnet via Anthropic API
- Contextual awareness of user state
- Integration with provider/booking data

---

## 📋 FINDR SCHEDULING APP (PLANNING)

### Vision
A comprehensive scheduling module integrated into the Provider Portal that allows providers to manage:
- Findr Health bookings (auto-populated)
- Manual appointments from other sources
- All-in-one calendar view
- Customer database for all patients

### Status: Planning Phase
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FINDR SCHEDULING APP (FUTURE)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌───────────────────────────────────────────────────────────────────┐    │
│   │                    PROVIDER PORTAL MODULE                          │    │
│   ├───────────────────────────────────────────────────────────────────┤    │
│   │                                                                    │    │
│   │   ┌──────────────────────────────────────────────────────────┐   │    │
│   │   │            Unified Calendar View                          │   │    │
│   │   │  • Day / Week / Month views                              │   │    │
│   │   │  • Findr bookings (auto-populated) ✅                    │   │    │
│   │   │  • Manual appointments (provider-added) 📋               │   │    │
│   │   │  • Color-coded by source                                 │   │    │
│   │   └──────────────────────────────────────────────────────────┘   │    │
│   │                                                                    │    │
│   │   ┌──────────────────────────────────────────────────────────┐   │    │
│   │   │         Appointment Management                            │   │    │
│   │   │  • Create new appointments                                │   │    │
│   │   │  • Edit/Reschedule                                        │   │    │
│   │   │  • Cancel with reason                                     │   │    │
│   │   │  • No-show tracking                                       │   │    │
│   │   └──────────────────────────────────────────────────────────┘   │    │
│   │                                                                    │    │
│   │   ┌──────────────────────────────────────────────────────────┐   │    │
│   │   │         Customer Database                                 │   │    │
│   │   │  • All patients (Findr + non-Findr)                      │   │    │
│   │   │  • Contact information                                    │   │    │
│   │   │  • Appointment history                                    │   │    │
│   │   │  • Notes/preferences                                      │   │    │
│   │   └──────────────────────────────────────────────────────────┘   │    │
│   │                                                                    │    │
│   │   ┌──────────────────────────────────────────────────────────┐   │    │
│   │   │         Integrations                                      │   │    │
│   │   │  • Google/Microsoft Calendar Sync                         │   │    │
│   │   │  • Conflict Detection                                     │   │    │
│   │   │  • Real-time Findr booking updates                        │   │    │
│   │   └──────────────────────────────────────────────────────────┘   │    │
│   └────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Requirements
1. Web-based (Part of Provider Portal)
2. Dual-source appointment management
3. Calendar views: Day, Week, Month
4. Customer database for all patients
5. Real-time updates for Findr bookings

### Design Decisions Pending
- [ ] Full UX wireframes
- [ ] Non-Findr customer data model
- [ ] External calendar sync strategy
- [ ] Notification preferences
- [ ] Analytics requirements

---

## 📱 FLUTTER APP - KEY DETAILS

### Current Auth Methods
- ✅ Email/Password
- ✅ Google Sign-In
- ✅ Apple Sign-In
- ❌ Facebook (removed)

### Request Booking Components (Jan 17)

| Component | File | Status |
|-----------|------|--------|
| BookingModeBadge | `lib/widgets/booking_mode_badge.dart` | ✅ Wired |
| BookingStatusBadge | `lib/widgets/booking_status_badge.dart` | ✅ Created |
| BookingTimelineWidget | `lib/widgets/booking_timeline_widget.dart` | ✅ Created |
| RescheduleResponseScreen | `lib/screens/reschedule_response_screen.dart` | ✅ Created |
| NotificationService | `lib/services/notification_service.dart` | ✅ Complete |
| NotificationProvider | `lib/providers/notification_provider.dart` | ✅ Complete |
| NotificationsScreen | `lib/presentation/screens/notifications/` | ✅ Updated |
| Bell Icon Badge | Home screen header | ✅ Complete |

### Removed Dependencies (Jan 13, 2026)
| Package | Reason Removed |
|---------|----------------|
| `flutter_facebook_auth` | Crashed on iOS standalone launch |
| `flutter_secure_storage` | Required Keychain entitlements incompatible |

### Recent Builds
- iOS: ✅ Built successfully Jan 17 Evening (67.6MB)
- `flutter analyze`: ✅ No errors (verified Jan 17 Evening)

---

## 📊 DATABASE STATE

### Provider Statistics
- **Total Providers:** 33
- **Verified:** 11
- **Featured:** 12
- **With Calendar Connected:** TBD (verify count)

### User Statistics
- **Total Users:** 10
- **With Stripe Customer:** 2

### Service Templates: 149 total
Medical: 34 | Urgent Care: 36 | Dental: 14 | Skincare: 21 | Mental Health: 15 | Nutrition: 12 | Pharmacy: 17 | Massage: 13 | Fitness: 11 | Yoga: 9

### Notifications (NEW)
- **Collection:** `notifications`
- **Indexes:** recipientId, recipientType, read status, TTL for expiration

---

## 🧪 TEST ACCOUNTS

| Type | Email | Password | Purpose |
|------|-------|----------|---------|
| Consumer | gagi@findrhealth.com | Test1234! | Primary testing |
| Consumer | tim@findrhealth.com | Test1234! | Developer testing |
| Google Test | wetherillt@gmail.com | - | Calendar OAuth testing |

---

## 🔧 ENVIRONMENT VARIABLES (Railway)

### Currently Configured
```
ANTHROPIC_API_KEY
APP_URL
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLOUDINARY_CLOUD_NAME
FROM_EMAIL
GMAIL_APP_PASSWORD
GMAIL_USER
GOOGLE_PLACES_API_KEY
JWT_SECRET
MONGODB_URI
NODE_ENV=production
RESEND_API_KEY
SENDGRID_API_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
GOOGLE_CALENDAR_CLIENT_ID
GOOGLE_CALENDAR_CLIENT_SECRET
MICROSOFT_CLIENT_ID              # Added Jan 15
MICROSOFT_CLIENT_SECRET          # Added Jan 15
MICROSOFT_TENANT_ID=common       # Added Jan 15
```

---

## 🚦 FEATURE COMPLETION STATUS

### Fully Complete ✅
- **Notification System** - Email + In-App (Jan 17 Evening)
- Stripe Connect (provider payouts)
- Google Calendar OAuth (dashboard page)
- Microsoft Calendar OAuth (dashboard page)
- Request Booking Backend (V2 endpoints)
- AI Chat authentication requirement
- Admin dashboard user management
- Admin dashboard payments tab
- Admin dashboard policies tab
- Admin dashboard calendar tab
- Admin BookingHealthDashboard
- iOS standalone app launch
- Calendar date picker UX (Flutter)
- Provider portal popup warning fix
- Provider portal PendingRequestsPage
- Provider portal Calendar Skip Warning UX
- Flutter BookingModeBadge (wired into UI)
- Flutter BookingStatusBadge widget
- Flutter BookingTimelineWidget
- Flutter RescheduleResponseScreen
- Flutter NotificationCenter with badge

### Partially Complete ⚠️
- Calendar onboarding step (backend done, StepCalendar.tsx needed)
- Request booking UX in Flutter app (85% - DateTimeSelectionScreen + BookingConfirmationScreen pending)

### Not Started ❌
- iCal/CalDAV support (Apple Calendar)
- Findr Scheduling App (planning)

### Deferred ⏸️
- Biometric login (future TestFlight)
- Pay a Bill feature
- Firebase Push Notifications (Phase 2)

### Known Bugs 🐛
- Provider photo upload: Works in portal, doesn't display in app

---

## 🔄 VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 14.0 | Jan 17, 2026 Evening | Notification system complete, badges wired |
| 13.0 | Jan 17, 2026 | New session assessment, updated completion status |
| 12.0 | Jan 17, 2026 | PendingRequestsPage, Calendar Skip UX, Flutter components |
| 11.0 | Jan 16, 2026 | Microsoft Calendar complete, iOS crash resolved |
| 10.0 | Jan 15, 2026 | Clarified calendar integration gaps |
| 9.0 | Jan 14, 2026 | Added Stripe Connect, Google Calendar |
| 8.0 | Jan 13, 2026 | Removed Facebook/secure_storage |
| 7.0 | Jan 12, 2026 | Git migration, canonical paths |

---

## 📚 RELATED DOCUMENTS

| Document | Version | Purpose |
|----------|---------|---------|
| OUTSTANDING_ISSUES | v18 | Bug/task tracking (Updated Jan 17 Evening) |
| CALENDAR_OPTIONAL_BOOKING_FLOW | v2 | Request booking system design |
| REQUEST_BOOKING_UX_RECOMMENDATION | v1 | Flutter UX spec |
| INTEGRATION_GUIDE | v1 | Backend deployment guide |
| SESSION_PROTOCOL | v3 | Daily procedures |
| DEVELOPER_HANDOFF | v1 | Technical onboarding |

---

*Document Version: 14.0 - January 17, 2026 (Evening Session)*  
*Engineering Lead Oversight: Active*  
*Next Review: Session End*  
*Mission: Enable providers and users with transparency and ease in navigating healthcare*
