# FINDR HEALTH ECOSYSTEM - COMPREHENSIVE SUMMARY
## Version 10 | Updated: January 15, 2026 (End of Day)

**Document Purpose:** Single source of truth for all Findr Health technical architecture, integrations, and current state.  
**Audience:** Developers, AI assistants, stakeholders  
**Update Frequency:** End of each development session

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
│   │ • Booking Flow   │     │ • Team Members   │     │ • User Mgmt ✅   │   │
│   │ • Payments       │     │ • Photos         │     │ • Verified/Featured│ │
│   │ • Profile/Auth   │     │ • Credentials    │     │ • Hours Tab      │   │
│   │ • Clarity AI ✅  │     │ • Policies       │     │ • Policies Tab ✅│   │
│   │ • Map Search     │     │ ✅ Stripe Connect│     │ • Payments Tab ✅│   │
│   │ • My Bookings    │     │ ✅ Calendar Sync │     │ 🔜 Calendar Tab  │   │
│   │ • Biometric Auth │     │ ✅ Booking Mgmt  │     │                  │   │
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
│                    │ • /api/bookings (+ provider endpoints) │ ✅ Jan 15    │
│                    │ • /api/users (admin routes) ✅         │               │
│                    │ • /api/payments (Stripe)               │               │
│                    │ • /api/connect (Stripe Connect) ✅     │ Jan 14       │
│                    │ • /api/calendar (Google OAuth) ✅      │ Jan 14       │
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
| `Findr-Health/carrotly-provider-database` | **PUBLIC** | JS/Node | Backend API + Admin Dashboard | `~/Development/findr-health/carrotly-provider-database` |
| `Findr-Health/carrotly-provider-mvp` | **PUBLIC** | TypeScript | Provider Onboarding Portal | `~/Development/findr-health/carrotly-provider-mvp` |
| `Findr-Health/findr-health-mobile` | **PRIVATE** | Dart | Flutter Consumer App | `~/Development/findr-health/findr-health-mobile` |

### ⚠️ Security Note
`carrotly-provider-database` is PUBLIC. Never commit API keys, secrets, or .env files.

---

## 🔗 LIVE DEPLOYMENTS

| Service | URL | Platform | Last Deploy |
|---------|-----|----------|-------------|
| Backend API | https://fearless-achievement-production.up.railway.app/api | Railway | Jan 15 |
| Provider Portal | https://findrhealth-provider.vercel.app | Vercel | Jan 15 |
| Admin Dashboard | https://admin-findrhealth-dashboard.vercel.app | Vercel | Jan 14 |
| Mobile App | TestFlight Build 27 | Apple | Jan 12 |

---

## 💰 STRIPE CONNECT (Provider Payouts) ✅

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

## 📅 CALENDAR INTEGRATION

### Status Summary
| Component | Established Providers | Provider Onboarding | Booking Flow |
|-----------|----------------------|---------------------|--------------|
| Google Calendar | ✅ Complete | ❌ No step | ❌ Not integrated |
| Microsoft Outlook | ❌ Planned | ❌ Planned | ❌ Planned |

### Google Calendar ✅ (Jan 14, 2026)

#### Provider Schema
```javascript
calendar: {
  provider: String,           // 'google', 'microsoft', 'manual'
  calendarId: String,
  calendarEmail: String,
  accessToken: String,        // Encrypted
  refreshToken: String,       // Encrypted
  tokenExpiry: Date,
  connectedAt: Date,
  syncDirection: String,      // 'two-way', 'one-way'
  syncBusyOnly: Boolean,
  bufferMinutes: Number,
  businessHours: { /* day-by-day config */ }
}
calendarConnected: Boolean
```

#### API Routes
| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/calendar/google/auth/:providerId` | GET | Initiate Google OAuth | ✅ |
| `/api/calendar/google/callback` | GET | Handle OAuth callback | ✅ |
| `/api/calendar/status/:providerId` | GET | Get connection status | ✅ |
| `/api/calendar/disconnect/:providerId` | POST | Disconnect calendar | ✅ |
| `/api/calendar/freebusy/:providerId` | GET | Get busy times | ✅ |
| `/api/calendar/create-event/:providerId` | POST | Create booking event | ✅ |

#### Google Cloud Console Setup
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
- **Test Users:** wetherillt@gmail.com

### Microsoft Outlook 🔜 (Planned)

**Not yet implemented.** Required steps:
1. Register app in Azure Portal (Microsoft Identity Platform)
2. Add OAuth routes to `backend/routes/calendar.js`
3. Add Microsoft button to Calendar.tsx
4. Test end-to-end

**Scopes needed:**
```
Calendars.ReadWrite
User.Read
```

### Calendar Integration Gaps 🔴

#### Gap 1: Provider Onboarding
- **Issue:** No calendar step in 10-step onboarding
- **Impact:** New providers must manually find /calendar page
- **Solution:** Add "Step 7: Calendar & Availability" to onboarding wizard

#### Gap 2: Booking Flow Integration
- **Issue:** FreeBusy API exists but not used in availability calculation
- **Impact:** Double-booking possible
- **Solution:** Integrate `/api/calendar/freebusy` into booking slot generation

---

## 📋 BOOKING MANAGEMENT (Provider Portal) ✅ NEW

### Status: FULLY IMPLEMENTED (Jan 15, 2026)

### Routes Added
| Route | Component | Purpose |
|-------|-----------|---------|
| `/bookings` | BookingsPage.jsx | All bookings with search/filter |
| `/bookings/pending` | PendingRequestsPage.jsx | Pending requests management |

### Components
| Component | File | Description |
|-----------|------|-------------|
| PendingRequestsPage | `src/pages/PendingRequestsPage.jsx` | Full-page booking request view |
| BookingsPage | `src/pages/BookingsPage.jsx` | All bookings list with filters |
| ConfirmationModal | `src/components/bookings/ConfirmationModal.jsx` | Confirm booking dialog |
| DeclineModal | `src/components/bookings/DeclineModal.jsx` | Decline with reason selection |
| RescheduleModal | `src/components/bookings/RescheduleModal.jsx` | Propose alternative time |
| PendingRequestsWidget | `src/components/bookings/PendingRequestsWidget.jsx` | Dashboard widget (ready) |

### API Functions (bookingsAPI)
```javascript
bookingsAPI.getPending(providerId)           // Get pending requests
bookingsAPI.getAll(providerId, params)       // Get all bookings with filters
bookingsAPI.getById(bookingId)               // Get single booking
bookingsAPI.confirm(bookingId, providerId)   // Confirm booking
bookingsAPI.decline(bookingId, providerId, reason)  // Decline booking
bookingsAPI.reschedule(bookingId, providerId, proposedStart, message)  // Reschedule
bookingsAPI.getHistory(bookingId)            // Get audit trail
```

### Backend Endpoints
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/bookings/provider/:providerId/pending` | GET | Get pending bookings |
| `/api/bookings/provider/:providerId` | GET | Get all provider bookings |
| `/api/bookings/:id` | GET | Get single booking |
| `/api/bookings/:id/confirm` | POST | Confirm booking |
| `/api/bookings/:id/decline` | POST | Decline booking |
| `/api/bookings/:id/reschedule` | POST | Propose new time |
| `/api/bookings/:id/history` | GET | Get booking history |

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

### Known Issue: App Crash
- **Status:** UNRESOLVED
- **Symptom:** White flash then crash on standalone launch
- **Root Cause:** StorageService sync getters access null `_prefs`
- **Fix:** Add null guards or await init() before runApp()

---

## 📊 DATABASE STATE

### Provider Statistics
| Metric | Count |
|--------|-------|
| Total Providers | 33 |
| Verified | 11 |
| Featured | 12 |
| Calendar Connected | 1+ |
| Stripe Connected | 1+ |

### User Statistics
| Metric | Count |
|--------|-------|
| Total Users | 10 |
| With Stripe Customer | 2 |

### Service Templates: 149 total
| Category | Count |
|----------|-------|
| Medical | 34 |
| Urgent Care | 36 |
| Dental | 14 |
| Skincare | 21 |
| Mental Health | 15 |
| Nutrition | 12 |
| Pharmacy | 17 |
| Massage | 13 |
| Fitness | 11 |
| Yoga | 9 |

---

## 🧪 TEST ACCOUNTS

| Type | Email | Password | Purpose |
|------|-------|----------|---------|
| Consumer | gagi@findrhealth.com | Test1234! | Primary testing |
| Consumer | tim@findrhealth.com | Test1234! | Developer testing |
| Google Test | wetherillt@gmail.com | - | Calendar OAuth testing |
| Provider Test | demo-pharmacy@findrhealth.com | - | Provider portal testing |

---

## 🔧 ENVIRONMENT VARIABLES (Railway)

```bash
# Core
MONGODB_URI
JWT_SECRET
NODE_ENV=production
APP_URL

# Email
FROM_EMAIL
GMAIL_APP_PASSWORD
GMAIL_USER
RESEND_API_KEY
SENDGRID_API_KEY

# Stripe
STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY

# Google
GOOGLE_PLACES_API_KEY
GOOGLE_CALENDAR_CLIENT_ID          # Added Jan 14
GOOGLE_CALENDAR_CLIENT_SECRET      # Added Jan 14

# Microsoft (Planned)
# MICROSOFT_CLIENT_ID
# MICROSOFT_CLIENT_SECRET

# AI
ANTHROPIC_API_KEY

# Media
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLOUDINARY_CLOUD_NAME
```

---

## 📋 API ROUTES REFERENCE

### Core Routes
```
GET  /api/health
GET  /api/providers
GET  /api/providers/:id
POST /api/providers
PUT  /api/providers/:id
```

### Booking Routes (Updated Jan 15)
```
POST /api/bookings
GET  /api/bookings/:id
GET  /api/bookings/:id/history
GET  /api/bookings/provider/:providerId
GET  /api/bookings/provider/:providerId/pending
POST /api/bookings/:id/confirm
POST /api/bookings/:id/decline
POST /api/bookings/:id/reschedule
```

### User Routes (Admin)
```
GET  /api/users
GET  /api/users/:id
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

### Calendar Routes
```
GET  /api/calendar/google/auth/:providerId
GET  /api/calendar/google/callback
GET  /api/calendar/status/:providerId
POST /api/calendar/disconnect/:providerId
GET  /api/calendar/freebusy/:providerId
POST /api/calendar/create-event/:providerId
```

---

## 🚀 PROVIDER PORTAL ROUTES

| Route | Page | Status |
|-------|------|--------|
| `/` | Landing | ✅ |
| `/login` | Provider Login | ✅ |
| `/dashboard` | Dashboard | ✅ |
| `/bookings` | All Bookings | ✅ NEW Jan 15 |
| `/bookings/pending` | Pending Requests | ✅ NEW Jan 15 |
| `/edit-profile` | Edit Profile | ✅ |
| `/calendar` | Calendar Settings | ✅ |
| `/payments` | Payments/Stripe | ✅ |
| `/analytics` | Analytics | ✅ |
| `/reviews` | Reviews | ✅ |
| `/settings` | Settings | ✅ |
| `/preview` | Profile Preview | ✅ |
| `/onboarding/*` | Onboarding Flow | ✅ |

---

## 📚 RELATED DOCUMENTS

| Document | Version | Purpose | Updated |
|----------|---------|---------|---------|
| OUTSTANDING_ISSUES | v14 | Bug/task tracking | Jan 15 |
| SESSION_PROTOCOL | v3 | Daily procedures | Jan 13 |
| DEVELOPER_HANDOFF | v1 | Technical onboarding | Jan 8 |
| CALENDAR_OPTIONAL_BOOKING_FLOW | v2 | Future booking architecture | Jan 15 |
| ENGINEERING_STANDARDS | v1 | Code standards | Jan 12 |

---

## 🔄 VERSION HISTORY

| Version | Date | Key Changes |
|---------|------|-------------|
| **10.0** | **Jan 15, 2026** | **Provider Portal booking management UI, CORS fix, calendar gap analysis** |
| 9.0 | Jan 14, 2026 | Stripe Connect, Google Calendar, admin user routes |
| 8.0 | Jan 13, 2026 | Removed Facebook/secure_storage, calendar planning |
| 7.0 | Jan 12, 2026 | Git migration, canonical paths |
| 6.0 | Jan 10, 2026 | Payment system, test providers |

---

## 🎯 DEVELOPMENT PRIORITIES

### Immediate (Next Session)
1. **Fix iOS App Crash** - StorageService race condition
2. **Calendar Onboarding Step** - Add to provider wizard
3. **Dashboard Widget Integration** - Add bookings to Dashboard

### Short-Term (This Week)
4. Calendar-Booking Integration (FreeBusy)
5. Microsoft Outlook OAuth
6. Admin Calendar Tab
7. TestFlight Build 28

### Medium-Term
8. Calendar-Optional Booking Flow (instant vs request)
9. Demo providers creation
10. Booking detail page

---

*Document Version: 10.0 - January 15, 2026 (End of Day)*  
*Next Scheduled Update: January 16, 2026*
