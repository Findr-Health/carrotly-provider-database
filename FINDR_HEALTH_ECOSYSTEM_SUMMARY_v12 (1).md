# FINDR HEALTH ECOSYSTEM - COMPREHENSIVE SUMMARY
## Version 12 | Updated: January 17, 2026 (End of Session)

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
│                    │ • ❌ /api/notifications (NEEDED)       │               │
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
| Backend API | https://fearless-achievement-production.up.railway.app/api | Railway | Jan 16 |
| Provider Portal | https://findrhealth-provider.vercel.app | Vercel | **Jan 17** |
| Admin Dashboard | https://admin-findrhealth-dashboard.vercel.app | Vercel | Jan 16 |

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
| └─ BookingModeBadge | Instant vs Request indicator | ✅ Jan 16 |
| └─ BookingStatusBadge | All booking states | ✅ Jan 17 |
| └─ BookingTimelineWidget | Visual progress | ✅ Jan 17 |
| └─ RescheduleResponseScreen | Accept/decline proposed time | ✅ Jan 17 |
| └─ Wire into ProviderCard | Pending | ❌ |
| └─ Wire into ProviderDetail | Pending | ❌ |
| └─ Deep linking | Pending | ❌ |

---

## 💰 STRIPE CONNECT (Provider Payouts) ✅ COMPLETE

### Status: FULLY IMPLEMENTED (Jan 14, 2026)

### Account Type
- **Express Accounts** - Stripe handles all KYC/identity verification
- Provider clicks "Connect" → Stripe onboarding → Returns to portal

### Provider Schema
```javascript
stripeConnect: {
  accountId: String,           // acct_xxx
  accountStatus: String,       // 'pending', 'active', 'restricted', 'disabled'
  payoutsEnabled: Boolean,
  chargesEnabled: Boolean,
  detailsSubmitted: Boolean,
  connectedAt: Date,
  lastUpdated: Date
}
```

### Fee Structure
- Platform fee: **10% + $1.50** per booking
- Cap: **$35 maximum**
- Competitive advantage vs Zocdoc ($35-110 per new patient)

---

## 📅 CALENDAR INTEGRATION - DETAILED STATUS

### Implementation Status Matrix

| Component | Status | Notes |
|-----------|--------|-------|
| **Google Calendar** | | |
| └─ Backend OAuth Routes | ✅ Complete | `backend/routes/calendar.js` |
| └─ Provider Portal Dashboard Page | ✅ Complete | `src/pages/Calendar.tsx` |
| └─ Provider Onboarding Step | ❌ NOT BUILT | Need `StepCalendar.tsx` |
| └─ FreeBusy API | ✅ Complete | Integrated with booking flow |
| └─ Create Event API | ✅ Complete | Creates bookings on calendar |
| **Microsoft Outlook** | | |
| └─ Azure Portal Registration | ✅ Complete | Jan 15, 2026 |
| └─ Backend OAuth Routes | ✅ Complete | Jan 15, 2026 |
| └─ Provider Portal Dashboard Page | ✅ Complete | Jan 15, 2026 |
| └─ Provider Onboarding Step | ❌ NOT BUILT | Need in `StepCalendar.tsx` |
| **iCal/CalDAV (Apple Calendar)** | | |
| └─ All components | ❌ NOT STARTED | Planning phase |
| **Admin Dashboard** | | |
| └─ Calendar status tab | ✅ Complete | Verified Jan 16 |

### Market Coverage

| Platform | Market Share | Status |
|----------|--------------|--------|
| Google Calendar | ~50% | ✅ Complete |
| Microsoft Outlook | ~35% | ✅ Complete |
| Apple iCloud | ~10% | ❌ Planning |
| Other/Manual | ~5% | ✅ Business hours |

**Current Coverage: ~85% (Google + Microsoft)**

### Provider Schema (Calendar)
```javascript
calendar: {
  provider: String,           // 'google', 'microsoft', 'manual'
  calendarId: String,
  calendarEmail: String,
  accessToken: String,
  refreshToken: String,
  tokenExpiry: Date,
  connectedAt: Date,
  syncDirection: String,      // 'two-way', 'one-way'
  syncBusyOnly: Boolean,
  bufferMinutes: Number,
  businessHours: { /* day-by-day config */ }
}
calendarConnected: Boolean
```

---

## 📋 NEW: FINDR SCHEDULING APP (Planning Phase)

### Status: DESIGN PHASE - Added January 17, 2026

### Vision
A web-based scheduling module integrated into the Provider Portal that serves as a comprehensive appointment management system for providers.

### Core Concept
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FINDR SCHEDULING APP                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌───────────────────────────────────────────────────────────────────┐    │
│   │                    UNIFIED APPOINTMENT VIEW                        │    │
│   │   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │    │
│   │   │  FINDR HEALTH │  │    MANUAL     │  │   SYNCED FROM │        │    │
│   │   │   BOOKINGS    │  │    ENTRIES    │  │   GOOGLE/MSFT │        │    │
│   │   │   (auto)      │  │  (phone/walk) │  │   (read-only) │        │    │
│   │   └───────────────┘  └───────────────┘  └───────────────┘        │    │
│   │                              │                                     │    │
│   │                              ▼                                     │    │
│   │   ┌─────────────────────────────────────────────────────────────┐│    │
│   │   │              CALENDAR VIEW (Day / Week / Month)             ││    │
│   │   │  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐               ││    │
│   │   │  │ Sun │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │               ││    │
│   │   │  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤               ││    │
│   │   │  │     │ 9am │     │10am │     │ 2pm │     │               ││    │
│   │   │  │     │Findr│     │Phone│     │Findr│     │               ││    │
│   │   │  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘               ││    │
│   │   └─────────────────────────────────────────────────────────────┘│    │
│   └───────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│   Features:                                                                  │
│   • Auto-populated Findr bookings                                           │
│   • Manual customer entry (name, phone, service, time)                      │
│   • Conflict detection across all sources                                   │
│   • Color-coded by source                                                   │
│   • Mobile-responsive                                                       │
│   • Customer database (all patients, not just Findr)                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Design Discussion Needed
- [ ] Full UX wireframes
- [ ] Data model for non-Findr customers
- [ ] Sync strategy with external calendars
- [ ] Notification preferences
- [ ] Reporting/analytics

### Implementation: Deferred until notification system complete

---

## ❌ CRITICAL GAP: Notification System

### Status: NOT IMPLEMENTED

### Required Implementation
```javascript
// Backend: backend/routes/notifications.js (NEW)
POST /api/notifications/send

// Integration points
- Booking confirmed → Notify user
- Booking declined → Notify user + release Stripe hold
- Reschedule proposed → Notify user
- Reschedule accepted → Notify provider
- Reschedule declined → Notify provider + cancel booking
- Booking cancelled (by user) → Notify provider
- Booking cancelled (by provider) → Notify user + refund
- Booking expired (24hr) → Notify both + release hold
```

### Stripe Webhook Handlers Needed
```javascript
// backend/routes/webhooks.js
payment_intent.canceled → Release hold, notify user
payment_intent.succeeded → Confirm capture, notify both
```

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
| BookingModeBadge | `lib/widgets/booking_mode_badge.dart` | ✅ Created |
| BookingStatusBadge | `lib/widgets/booking_status_badge.dart` | ✅ Created |
| BookingTimelineWidget | `lib/widgets/booking_timeline_widget.dart` | ✅ Created |
| RescheduleResponseScreen | `lib/screens/reschedule_response_screen.dart` | ✅ Created |
| BookingApiExtensions | `lib/services/booking_api_extensions.dart` | ✅ Exists |

### Removed Dependencies (Jan 13, 2026)
| Package | Reason Removed |
|---------|----------------|
| `flutter_facebook_auth` | Crashed on iOS standalone launch |
| `flutter_secure_storage` | Required Keychain entitlements incompatible |

### Recent Builds
- iOS: ✅ Built successfully Jan 17 (67.6MB)
- `flutter analyze`: ✅ No errors

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
- Flutter BookingStatusBadge widget
- Flutter BookingTimelineWidget
- Flutter RescheduleResponseScreen

### Partially Complete ⚠️
- Calendar onboarding step (backend done, UI needed)
- Request booking UX in Flutter app (45% - components done, wiring needed)

### Not Started ❌
- Notification system (critical gap)
- iCal/CalDAV support (Apple Calendar)
- StepCalendar.tsx for onboarding
- Findr Scheduling App

### Deferred ⏸️
- Biometric login (future TestFlight)
- Pay a Bill feature

### Known Bugs 🐛
- Provider photo upload: Works in portal, doesn't display in app

---

## 🔄 VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 12.0 | Jan 17, 2026 | PendingRequestsPage, Calendar Skip UX, Flutter Request Booking components, Scheduling App planning, Notification system gap identified |
| 11.0 | Jan 16, 2026 | Microsoft Calendar complete, iOS crash resolved, biometric deferred |
| 10.0 | Jan 15, 2026 | Clarified calendar integration gaps |
| 9.0 | Jan 14, 2026 | Added Stripe Connect, Google Calendar |
| 8.0 | Jan 13, 2026 | Removed Facebook/secure_storage |
| 7.0 | Jan 12, 2026 | Git migration, canonical paths |

---

## 📚 RELATED DOCUMENTS

| Document | Version | Purpose |
|----------|---------|---------|
| OUTSTANDING_ISSUES | v16 | Bug/task tracking |
| CALENDAR_OPTIONAL_BOOKING_FLOW | v2 | Request booking system design |
| REQUEST_BOOKING_UX_RECOMMENDATION | v1 | Flutter UX spec |
| INTEGRATION_GUIDE | v1 | Backend deployment guide |
| SESSION_PROTOCOL | v3 | Daily procedures |
| DEVELOPER_HANDOFF | v1 | Technical onboarding |

---

*Document Version: 12.0 - January 17, 2026 (End of Session)*  
*Engineering Lead Oversight: Active*  
*Next Review: January 18, 2026*  
*Mission: Enable providers and users with transparency and ease in navigating healthcare*
