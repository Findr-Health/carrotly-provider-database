# FINDR HEALTH ECOSYSTEM - COMPREHENSIVE SUMMARY
## Version 11 | Updated: January 16, 2026 (Start of Day)

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
│   │ • My Bookings    │     │ ✅ Calendar Page │     │ ⚠️ Calendar Tab  │   │
│   │ ✅ Date Picker   │     │ ❌ Calendar Step │     │   (verify backend)│   │
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
│                    │ • /api/bookings (+ request mode?)      │               │
│                    │ • /api/users (admin routes) ✅         │               │
│                    │ • /api/payments (Stripe)               │               │
│                    │ • /api/connect (Stripe Connect) ✅     │               │
│                    │ • /api/calendar (Google OAuth) ✅      │               │
│                    │ • /api/calendar (Microsoft) ✅         │               │
│                    │ • /api/upload (Cloudinary)             │               │
│                    │ • /api/admin/*                         │               │
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

### API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/connect/create-account/:providerId` | POST | Create Stripe Connect account |
| `/api/connect/onboarding-link/:providerId` | POST | Generate onboarding URL |
| `/api/connect/dashboard-link/:providerId` | POST | Generate Stripe Dashboard URL |
| `/api/connect/status/:providerId` | GET | Get connection status |
| `/api/connect/balance/:providerId` | GET | Get account balance |
| `/api/connect/disconnect/:providerId` | POST | Disconnect account |

### Fee Structure
- Platform fee: **10% + $1.50** per booking
- Cap: **$35 maximum**
- Calculated in: `backend/routes/stripeConnect.js`

---

## 📅 CALENDAR INTEGRATION - DETAILED STATUS

### Overview

Calendar integration enables providers to sync their external calendars with Findr Health to prevent double-booking and enable instant booking.

### Implementation Status Matrix

| Component | Status | Notes |
|-----------|--------|-------|
| **Google Calendar** | | |
| └─ Backend OAuth Routes | ✅ Complete | `backend/routes/calendar.js` |
| └─ Provider Portal Dashboard Page | ✅ Complete | `src/pages/Calendar.tsx` |
| └─ Provider Onboarding Step | ❌ NOT BUILT | Need `StepCalendar.tsx` |
| └─ FreeBusy API | ✅ Complete | Needs verification with booking flow |
| └─ Create Event API | ✅ Complete | Can create bookings on calendar |
| **Microsoft Outlook** | | |
| └─ Azure Portal Registration | ✅ Complete | Jan 15, 2026 |
| └─ Backend OAuth Routes | ✅ Complete | Jan 15, 2026 |
| └─ Provider Portal Dashboard Page | ✅ Complete | Jan 15, 2026 |
| └─ Provider Onboarding Step | ❌ NOT BUILT | Need in `StepCalendar.tsx` |
| **iCal/CalDAV (Apple Calendar)** | | |
| └─ All components | ❌ NOT STARTED | Planning phase |
| **Admin Dashboard** | | |
| └─ Calendar status tab | ⚠️ UI Created | Backend verification needed |

### Market Coverage

| Platform | Market Share | Status |
|----------|--------------|--------|
| Google Calendar | ~50% | ✅ Complete (dashboard) |
| Microsoft Outlook | ~35% | ✅ Complete (dashboard) - Jan 15 |
| Apple iCloud | ~10% | ❌ Planning needed |
| Other/Manual | ~5% | ✅ Business hours support |

**Current Coverage: ~85% (Google + Microsoft)**

---

### GOOGLE CALENDAR INTEGRATION ✅ COMPLETE (Dashboard)

**What Works:**
- Established providers can connect Google Calendar from dashboard (`/calendar` page)
- OAuth flow complete with token refresh
- FreeBusy API available to check busy times
- Create Event API can add bookings to calendar

**What's Missing:**
- New providers during onboarding cannot connect calendar (need StepCalendar.tsx)

### MICROSOFT OUTLOOK INTEGRATION ✅ COMPLETE (Dashboard)

**Implemented:** January 15, 2026

**What Works:**
- Azure Portal app registration complete
- Backend OAuth routes in `calendar.js`
- Provider Portal UI with Microsoft button in `Calendar.tsx`
- Environment variables configured in Railway

**What's Missing:**
- New providers during onboarding cannot connect calendar (need StepCalendar.tsx)

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

### API Routes (Calendar)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/calendar/google/auth/:providerId` | GET | Initiate Google OAuth |
| `/api/calendar/google/callback` | GET | Handle Google OAuth callback |
| `/api/calendar/microsoft/auth/:providerId` | GET | Initiate Microsoft OAuth |
| `/api/calendar/microsoft/callback` | GET | Handle Microsoft OAuth callback |
| `/api/calendar/status/:providerId` | GET | Get connection status |
| `/api/calendar/disconnect/:providerId` | POST | Disconnect calendar |
| `/api/calendar/freebusy/:providerId` | GET | Get busy times |
| `/api/calendar/create-event/:providerId` | POST | Create booking event |

### Google Cloud Console Setup
- **Project:** Findr Health
- **APIs Enabled:** Google Calendar API
- **OAuth 2.0 Client:** Findr Health Calendar (Web)
- **Redirect URI:** `https://fearless-achievement-production.up.railway.app/api/calendar/google/callback`
- **Test Users:** wetherillt@gmail.com

### Azure Portal Setup (Microsoft)
- **App Registration:** Findr Health Calendar
- **Redirect URI:** `https://fearless-achievement-production.up.railway.app/api/calendar/microsoft/callback`
- **Scopes:** Calendars.ReadWrite, User.Read

---

## 📋 BOOKING SYSTEM

### Booking Modes

| Mode | Description | Calendar Required | Status |
|------|-------------|-------------------|--------|
| **Instant Book** | Immediate confirmation | Yes | ⚠️ Verify |
| **Request Booking** | Provider confirms within 48hrs | No | ⚠️ Verify |

### Verification Needed
Evidence suggests Request Booking backend may be deployed:
- Cron jobs scheduled: `[CRON] Booking cron jobs scheduled`
- Test returned: `"isRequest":true, "message":"Provider will confirm within 48 hours"`

**Action:** Verify if full CALENDAR_OPTIONAL_BOOKING_FLOW_v2 implementation is deployed

### Booking chargeType Options
| Type | Behavior | Status |
|------|----------|--------|
| `prepay` | Immediate Stripe charge | ✅ Implemented |
| `at_visit` | No charge, pay at appointment | ✅ Default |
| `card_on_file` | Save card, charge after | 🔜 Future |

### User Payment Methods
- Only `stripeCustomerId` stored in database
- Card details remain in Stripe (PCI compliant)
- Admin can view card brand/last4 via Stripe API

---

## 📱 FLUTTER APP - KEY DETAILS

### Removed Dependencies (Jan 13, 2026)
| Package | Reason Removed |
|---------|----------------|
| `flutter_facebook_auth` | Crashed on iOS standalone launch |
| `flutter_secure_storage` | Required Keychain entitlements incompatible |

### Current Auth Methods
- ✅ Email/Password
- ✅ Google Sign-In
- ✅ Apple Sign-In
- ❌ Facebook (removed)

### AI Clarity Chat
- ✅ Requires authentication
- Guests see "Sign in to use Clarity" prompt
- Protects AI usage costs

### Recent Fixes
- ✅ iOS Standalone Launch - RESOLVED (Jan 15)
- ✅ Calendar Date Picker UX - RESOLVED (Jan 15) - Month indicator added

### Deferred
- Biometric Login - Will test on future TestFlight build

---

## 📊 DATABASE STATE

### Provider Statistics
- **Total Providers:** 33
- **Verified:** 11
- **Featured:** 12

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

## 📋 API ROUTES REFERENCE

### Core Routes
```
GET  /api/health
GET  /api/providers
GET  /api/providers/:id
POST /api/bookings
GET  /api/users (admin)
GET  /api/users/:id (admin)
```

### Stripe Connect Routes
```
POST /api/connect/create-account/:providerId
POST /api/connect/onboarding-link/:providerId
POST /api/connect/dashboard-link/:providerId
GET  /api/connect/status/:providerId
GET  /api/connect/balance/:providerId
POST /api/connect/disconnect/:providerId
```

### Calendar Routes (Google + Microsoft)
```
GET  /api/calendar/google/auth/:providerId
GET  /api/calendar/google/callback
GET  /api/calendar/microsoft/auth/:providerId
GET  /api/calendar/microsoft/callback
GET  /api/calendar/status/:providerId
POST /api/calendar/disconnect/:providerId
GET  /api/calendar/freebusy/:providerId
POST /api/calendar/create-event/:providerId
```

### Booking Routes (Verify Implementation)
```
POST /api/bookings                           # Create booking
GET  /api/bookings/:id                       # Get booking details
POST /api/bookings/reserve-slot              # Reserve slot (5 min TTL) - VERIFY
POST /api/bookings/:id/confirm               # Provider confirms - VERIFY
POST /api/bookings/:id/decline               # Provider declines - VERIFY
POST /api/bookings/:id/reschedule            # Propose new time - VERIFY
```

---

## 📚 RELATED DOCUMENTS

| Document | Version | Purpose |
|----------|---------|---------|
| OUTSTANDING_ISSUES | v14 | Bug/task tracking |
| CALENDAR_OPTIONAL_BOOKING_FLOW | v2 | Request booking system design |
| INTEGRATION_GUIDE | v1 | Backend deployment guide |
| SESSION_PROTOCOL | v3 | Daily procedures |
| DEVELOPER_HANDOFF | v1 | Technical onboarding |

---

## 🚦 FEATURE COMPLETION STATUS

### Fully Complete ✅
- Stripe Connect (provider payouts)
- Google Calendar OAuth (dashboard page)
- Microsoft Calendar OAuth (dashboard page) - Jan 15
- AI Chat authentication requirement
- Admin dashboard user management
- Admin dashboard payments tab
- Admin dashboard policies tab
- iOS standalone app launch
- Calendar date picker UX (Flutter)
- Provider portal popup warning fix

### Partially Complete ⚠️
- Calendar onboarding step (backend done, UI needed)
- Admin calendar tab (UI done, backend verification needed)
- Request booking system (verify deployment status)

### Not Started ❌
- iCal/CalDAV support (Apple Calendar)
- Request booking UX in Flutter app
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
| 11.0 | Jan 16, 2026 | Microsoft Calendar complete, iOS crash resolved, biometric deferred, added booking verification task |
| 10.0 | Jan 15, 2026 | Clarified calendar integration gaps |
| 9.0 | Jan 14, 2026 | Added Stripe Connect, Google Calendar |
| 8.0 | Jan 13, 2026 | Removed Facebook/secure_storage |
| 7.0 | Jan 12, 2026 | Git migration, canonical paths |

---

*Document Version: 11.0 - January 16, 2026 (Start of Day)*  
*Next Review: End of January 16 session*  
*Mission: Enable providers and users with transparency and ease in navigating healthcare*
