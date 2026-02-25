# FINDR HEALTH ECOSYSTEM - COMPREHENSIVE SUMMARY
## Version 12 | Updated: January 16, 2026 (Mid-Day)

**Document Purpose:** Comprehensive technical reference for the Findr Health platform  
**Mission:** Enable providers and users with transparency and ease in navigating healthcare  
**Accuracy Level:** Verified implementations only - gaps clearly identified

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
│   │ ✅ Date Picker   │     │ ❌ Calendar Step │     │ ✅ BookingHealth │   │
│   │ ✅ BookingBadge  │     │ ✅ PendingWidget │     │   Dashboard      │   │
│   └────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘   │
│            │                        │                        │              │
│            └────────────────────────┼────────────────────────┘              │
│                                     │                                        │
│                                     ▼                                        │
│                    ┌────────────────────────────────────────┐               │
│                    │         NODE.JS BACKEND                │               │
│                    │  (Railway: fearless-achievement)       │               │
│                    ├────────────────────────────────────────┤               │
│                    │ • /api/providers                       │               │
│                    │ • /api/bookings (+ request mode) ✅    │               │
│                    │ • /api/users (admin routes) ✅         │               │
│                    │ • /api/payments (Stripe)               │               │
│                    │ • /api/connect (Stripe Connect) ✅     │               │
│                    │ • /api/calendar (Google OAuth) ✅      │               │
│                    │ • /api/calendar (Microsoft) ✅         │               │
│                    │ • /api/upload (Cloudinary)             │               │
│                    │ • /api/admin/*                         │               │
│                    │ • jobs/expirationJob.js ✅             │               │
│                    │ • jobs/scheduler.js ✅                 │               │
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

| Service | URL | Platform |
|---------|-----|----------|
| Backend API | https://fearless-achievement-production.up.railway.app/api | Railway |
| Provider Portal | https://findrhealth-provider.vercel.app | Vercel |
| Admin Dashboard | https://admin-findrhealth-dashboard.vercel.app | Vercel |

---

## 💰 STRIPE CONNECT (Provider Payouts) ✅ COMPLETE

### Status: FULLY IMPLEMENTED (Jan 14, 2026)

### Account Type
- **Express Accounts** - Stripe handles all KYC/identity verification
- Provider clicks "Connect" → Stripe onboarding → Returns to portal

### Fee Structure
```
Platform Fee = min(price × 10% + $1.50, $35)
```

### Provider Portal Integration
- Dashboard "Payments" tab with balance display
- Connect/Disconnect functionality
- Payout history

---

## 📅 CALENDAR INTEGRATION ✅ COMPLETE

### Status Matrix

| Component | Status | Verified |
|-----------|--------|----------|
| **Google Calendar** | | |
| └─ Backend OAuth Routes | ✅ Complete | Jan 14 |
| └─ Provider Portal Dashboard Page | ✅ Complete | Jan 14 |
| └─ Provider Onboarding Step | ❌ NOT BUILT | - |
| **Microsoft Outlook** | | |
| └─ Backend OAuth Routes | ✅ Complete | Jan 15 |
| └─ Provider Portal Dashboard Page | ✅ Complete | Jan 15 |
| └─ Provider Onboarding Step | ❌ NOT BUILT | - |
| **Admin Dashboard** | | |
| └─ Calendar status tab | ✅ Complete | **Jan 16** |
| **iCal/CalDAV** | | |
| └─ All components | ❌ NOT BUILT | - |

### Admin Calendar Tab Features (Verified Jan 16)
- Calendar Integration status (Google/Microsoft)
- Connected email display
- Sync direction and buffer time
- OAuth Token Health (expiry, refresh status, failures)
- Sync Diagnostics (last sync, status, consecutive failures)
- Booking Integration Health (FreeBusy queries, Event creation stats)

---

## 📋 BOOKING SYSTEM ✅ BACKEND COMPLETE

### Booking Modes

| Mode | Description | Calendar Required | Status |
|------|-------------|-------------------|--------|
| **Instant Book** | Immediate confirmation | Yes | ✅ Complete |
| **Request Booking** | Provider confirms within 24-48hrs | No | ✅ Complete |

### Backend Status: VERIFIED COMPLETE (Jan 16, 2026)

Full CALENDAR_OPTIONAL_BOOKING_FLOW_v2 implementation deployed:
- `jobs/expirationJob.js` - Handles expired bookings
- `jobs/scheduler.js` - Cron job scheduler (5 min intervals)
- All endpoints in `routes/bookings.js`

### Booking API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/bookings` | POST | Create booking |
| `/api/bookings/:id` | GET | Get booking details |
| `/api/bookings/reserve-slot` | POST | Reserve slot (5 min TTL) |
| `/api/bookings/:id/confirm` | POST | Provider confirms |
| `/api/bookings/:id/decline` | POST | Provider declines |
| `/api/bookings/:id/reschedule` | POST | Propose new time |
| `/api/bookings/:id/accept-reschedule` | POST | Patient accepts |
| `/api/bookings/:id/decline-reschedule` | POST | Patient declines |
| `/api/bookings/provider/:id/pending` | GET | Provider's pending requests |

### UX Implementation Status (Jan 16)

| Platform | Component | Status |
|----------|-----------|--------|
| **Flutter App** | BookingModeBadge | ✅ Deployed |
| **Flutter App** | Wire into provider cards | ⏳ Pending |
| **Flutter App** | RescheduleResponseScreen | ⏳ Pending |
| **Flutter App** | BookingStatusTimeline | ⏳ Pending |
| **Provider Portal** | PendingRequestsWidget | ✅ **Deployed Jan 16** |
| **Provider Portal** | Wired into Dashboard | ✅ **Deployed Jan 16** |
| **Admin Dashboard** | BookingHealthDashboard | ✅ **Deployed Jan 16** |
| **Admin Dashboard** | Wired into Dashboard | ✅ **Deployed Jan 16** |

---

## 📱 FLUTTER APP - KEY DETAILS

### Request Booking Components (Added Jan 16)
| File | Purpose | Status |
|------|---------|--------|
| `lib/widgets/booking_mode_badge.dart` | Instant/Request badge | ✅ Deployed |

### Pending Flutter Work
| Component | Purpose | Status |
|-----------|---------|--------|
| Wire BookingModeBadge into ProviderCard | Show booking mode on search results | ⏳ Pending |
| Wire BookingModeBadge into ProviderDetailScreen | Show booking mode on detail | ⏳ Pending |
| RescheduleResponseScreen | Accept/decline reschedule | ⏳ Pending |
| BookingStatusTimeline | Visual booking progress | ⏳ Pending |

---

## 💻 PROVIDER PORTAL - KEY DETAILS

### Request Booking Components (Added Jan 16)
| File | Purpose | Status |
|------|---------|--------|
| `src/components/PendingRequestsWidget.tsx` | Dashboard pending requests | ✅ Deployed |
| `src/pages/Dashboard.tsx` | Wired in widget | ✅ Deployed |
| `src/pages/PendingRequestsPage.jsx` | Full page view | ✅ Already existed |

### PendingRequestsWidget Features
- Shows pending booking requests count
- Confirm/Decline buttons
- Auto-refresh every 30 seconds
- Urgent booking highlighting

---

## 🖥️ ADMIN DASHBOARD - KEY DETAILS

### Request Booking Components (Added Jan 16)
| File | Purpose | Status |
|------|---------|--------|
| `src/components/BookingHealthDashboard.jsx` | Booking health metrics | ✅ Deployed |
| `src/components/Dashboard.jsx` | Wired in widget | ✅ Deployed |

### BookingHealthDashboard Features
- Pending requests count
- Confirmed bookings count
- Completed bookings count
- Revenue display (from /admin/bookings/stats)

---

## 🔧 ENVIRONMENT VARIABLES (Railway)

```
MONGODB_URI
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
CLOUDINARY_URL
SENDGRID_API_KEY
GOOGLE_CALENDAR_CLIENT_ID
GOOGLE_CALENDAR_CLIENT_SECRET
MICROSOFT_CLIENT_ID              # Added Jan 15
MICROSOFT_CLIENT_SECRET          # Added Jan 15
MICROSOFT_TENANT_ID=common       # Added Jan 15
```

---

## 📚 RELATED DOCUMENTS

| Document | Version | Purpose |
|----------|---------|---------|
| OUTSTANDING_ISSUES | v15 | Bug/task tracking |
| CALENDAR_OPTIONAL_BOOKING_FLOW | v2 | Request booking system design |
| REQUEST_BOOKING_UX_RECOMMENDATION | v2 | Flutter/Portal/Admin implementation guide |
| REQUEST_BOOKING_COMMANDS | v1 | Deployment commands |
| INTEGRATION_GUIDE | v1 | Backend deployment guide |
| SESSION_PROTOCOL | v3 | Daily procedures |

---

## 🚦 FEATURE COMPLETION STATUS

### Fully Complete ✅
- Stripe Connect (provider payouts)
- Google Calendar OAuth (dashboard page)
- Microsoft Calendar OAuth (dashboard page) - Jan 15
- Request Booking Backend (all endpoints + jobs) - Jan 15, verified Jan 16
- Admin Dashboard Calendar Tab - **Verified Jan 16**
- Admin Dashboard BookingHealthDashboard - **Deployed Jan 16**
- Provider Portal PendingRequestsWidget - **Deployed Jan 16**
- Flutter BookingModeBadge widget - **Deployed Jan 16**
- AI Chat authentication requirement
- Admin dashboard user management
- Admin dashboard payments tab
- Admin dashboard policies tab
- iOS standalone app launch
- Calendar date picker UX (Flutter)
- Provider portal popup warning fix

### Partially Complete ⚠️
- Calendar onboarding step (backend done, UI needed)
- Request booking UX in Flutter (badge done, screens needed)

### Not Started ❌
- iCal/CalDAV support (Apple Calendar)
- StepCalendar.tsx for onboarding

### Deferred ⏸️
- Biometric login (future TestFlight)
- Pay a Bill feature

### Known Bugs 🐛
- Provider photo upload: Works in portal, doesn't display in app

---

## 🔄 VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 12.0 | Jan 16, 2026 Mid-Day | **Deployed Request Booking UX**: Provider Portal (PendingRequestsWidget), Admin Dashboard (BookingHealthDashboard), Flutter (BookingModeBadge). Admin Calendar Tab verified. |
| 11.0 | Jan 16, 2026 Start | Microsoft Calendar complete, iOS crash resolved, biometric deferred, Request Booking backend VERIFIED |
| 10.0 | Jan 15, 2026 | Clarified calendar integration gaps |
| 9.0 | Jan 14, 2026 | Added Stripe Connect, Google Calendar |
| 8.0 | Jan 13, 2026 | Removed Facebook/secure_storage |
| 7.0 | Jan 12, 2026 | Git migration, canonical paths |

---

*Document Version: 12.0 - January 16, 2026 (Mid-Day)*  
*Next Review: End of January 16 session*  
*Mission: Enable providers and users with transparency and ease in navigating healthcare*
