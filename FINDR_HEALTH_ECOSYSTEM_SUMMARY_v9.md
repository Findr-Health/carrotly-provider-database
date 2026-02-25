# FINDR HEALTH ECOSYSTEM - COMPREHENSIVE SUMMARY
## Version 9 | Updated: January 14, 2026

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
│   │ • My Bookings    │     │ ✅ Calendar Sync │     │ 🔜 Calendar Tab  │   │
│   │ • Biometric Auth │     │                  │     │                  │   │
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
│                    │ • /api/bookings (chargeType)           │               │
│                    │ • /api/users (admin routes) ✅         │               │
│                    │ • /api/payments (Stripe)               │               │
│                    │ • /api/connect (Stripe Connect) ✅     │               │
│                    │ • /api/calendar (Google OAuth) ✅      │               │
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

## 💰 STRIPE CONNECT (Provider Payouts) ✅ NEW

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

## 📅 GOOGLE CALENDAR INTEGRATION ✅ NEW

### Status: FULLY IMPLEMENTED (Jan 14, 2026)

### Coverage
| Platform | Status | Coverage |
|----------|--------|----------|
| Google Calendar | ✅ Complete | ~50% |
| Microsoft Outlook | 🔜 Planned | ~35% |

### Provider Schema
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

### API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/calendar/google/auth/:providerId` | GET | Initiate Google OAuth |
| `/api/calendar/google/callback` | GET | Handle OAuth callback |
| `/api/calendar/status/:providerId` | GET | Get connection status |
| `/api/calendar/disconnect/:providerId` | POST | Disconnect calendar |
| `/api/calendar/freebusy/:providerId` | GET | Get busy times |
| `/api/calendar/create-event/:providerId` | POST | Create booking event |

### Google Cloud Console Setup
- **Project:** Findr Health
- **APIs Enabled:** Google Calendar API
- **OAuth 2.0 Client:** Findr Health Calendar (Web)
- **Redirect URIs:**
  - Production: `https://fearless-achievement-production.up.railway.app/api/calendar/google/callback`
  - Local: `http://localhost:3000/api/calendar/google/callback`
- **Scopes:**
  - `https://www.googleapis.com/auth/userinfo.email`
  - `https://www.googleapis.com/auth/calendar.readonly`
  - `https://www.googleapis.com/auth/calendar.events`

---

## 💳 PAYMENT SYSTEM

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

### AI Clarity Chat (Updated Jan 14)
- ✅ Requires authentication
- Guests see "Sign in to use Clarity" prompt
- Protects AI usage costs

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
GOOGLE_CALENDAR_CLIENT_ID          # NEW Jan 14
GOOGLE_CALENDAR_CLIENT_SECRET      # NEW Jan 14
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

### Stripe Connect Routes (NEW)
```
POST /api/connect/create-account/:providerId
POST /api/connect/onboarding-link/:providerId
POST /api/connect/dashboard-link/:providerId
GET  /api/connect/status/:providerId
GET  /api/connect/balance/:providerId
POST /api/connect/disconnect/:providerId
```

### Calendar Routes (NEW)
```
GET  /api/calendar/google/auth/:providerId
GET  /api/calendar/google/callback
GET  /api/calendar/status/:providerId
POST /api/calendar/disconnect/:providerId
GET  /api/calendar/freebusy/:providerId
POST /api/calendar/create-event/:providerId
```

---

## 📚 RELATED DOCUMENTS

| Document | Version | Purpose |
|----------|---------|---------|
| SESSION_PROTOCOL | v3 | Daily procedures |
| OUTSTANDING_ISSUES | v12 | Bug/task tracking |
| DEVELOPER_HANDOFF | v1 | Technical onboarding |

---

## 🔄 VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 9.0 | Jan 14, 2026 | Added Stripe Connect, Google Calendar, admin user routes |
| 8.0 | Jan 13, 2026 | Removed Facebook/secure_storage, added calendar integration plan |
| 7.0 | Jan 12, 2026 | Git migration, canonical paths |
| 6.0 | Jan 10, 2026 | Payment system, test providers |

---

*Document Version: 9.0 - January 14, 2026*
