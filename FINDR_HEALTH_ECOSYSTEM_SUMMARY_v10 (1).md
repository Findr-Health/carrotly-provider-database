# FINDR HEALTH ECOSYSTEM - COMPREHENSIVE SUMMARY
## Version 10 | Updated: January 15, 2026 (End of Day)

**Document Purpose:** Comprehensive technical reference for the Findr Health platform  
**Review Method:** Based on thorough conversation search across all sessions  
**Accuracy Level:** Only includes verified implementations and identified gaps

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
│   │ • My Bookings    │     │ ✅ Calendar Page │     │ ❌ Calendar Tab  │   │
│   │ • Biometric Auth │     │ ❌ Calendar Step │     │                  │   │
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
│                    │ • /api/calendar (Microsoft) ❌         │               │
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

Calendar integration enables providers to sync their external calendars with Findr Health to prevent double-booking. This section documents what's implemented and what gaps exist.

### Implementation Status Matrix

| Component | Status | Notes |
|-----------|--------|-------|
| **Google Calendar** | | |
| └─ Backend OAuth Routes | ✅ Complete | `backend/routes/calendar.js` |
| └─ Provider Portal Dashboard Page | ✅ Complete | `src/pages/Calendar.tsx` |
| └─ Provider Onboarding Step | ❌ NOT BUILT | Designed Nov 2025, never implemented |
| └─ FreeBusy API | ✅ Complete | Exists but not integrated with booking |
| └─ Create Event API | ✅ Complete | Can create bookings on calendar |
| **Microsoft Outlook** | | |
| └─ Azure Portal Registration | ❌ NOT STARTED | Required first step |
| └─ Backend OAuth Routes | ❌ NOT STARTED | Need @azure/msal-node |
| └─ Provider Portal UI | ❌ NOT STARTED | Add button to Calendar.tsx |
| **Booking Integration** | | |
| └─ FreeBusy in slot calculation | ❌ NOT STARTED | Critical gap - double-booking possible |
| **Admin Dashboard** | | |
| └─ Calendar status tab | ❌ NOT STARTED | Can't see provider calendar status |

### Market Coverage

| Platform | Market Share | Status |
|----------|--------------|--------|
| Google Calendar | ~50% | ✅ Partial (dashboard only) |
| Microsoft Outlook | ~35% | ❌ Not started |
| Apple iCloud | ~10% | 🔜 Future |
| Other/Manual | ~5% | ✅ Supported via business hours |

**Current Coverage: ~50% (dashboard only)**  
**After Microsoft: ~85%**

---

### GOOGLE CALENDAR INTEGRATION ✅ PARTIAL

**What Works:**
- Established providers can connect Google Calendar from dashboard (`/calendar` page)
- OAuth flow complete with token refresh
- FreeBusy API available to check busy times
- Create Event API can add bookings to calendar

**What's Missing:**
- New providers during onboarding cannot connect calendar
- FreeBusy not integrated into booking slot calculation
- Admin cannot see calendar connection status

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

### API Routes (Google - Implemented)
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
- **Test Users:** wetherillt@gmail.com

---

### MICROSOFT OUTLOOK INTEGRATION ❌ NOT STARTED

**Required Steps to Implement:**

1. **Azure Portal Setup:**
   - Go to: portal.azure.com → Azure Active Directory → App registrations
   - Create new registration: "Findr Health Calendar"
   - Application type: Web
   - Redirect URI: `https://fearless-achievement-production.up.railway.app/api/calendar/microsoft/callback`
   - Generate client secret

2. **Railway Environment Variables:**
   ```
   MICROSOFT_CLIENT_ID=your_application_client_id
   MICROSOFT_CLIENT_SECRET=your_client_secret
   MICROSOFT_TENANT_ID=common
   ```

3. **Backend Implementation:**
   ```bash
   npm install @azure/msal-node
   ```
   
   Add routes to `backend/routes/calendar.js`:
   - `GET /api/calendar/microsoft/auth/:providerId`
   - `GET /api/calendar/microsoft/callback`
   - FreeBusy via Microsoft Graph API
   - Create event via Microsoft Graph API

4. **Provider Portal:**
   - Add "Connect Microsoft Outlook" button to `src/pages/Calendar.tsx`
   - Same UI pattern as Google button

**Microsoft Graph API Scopes:**
```
Calendars.ReadWrite
User.Read
```

**Documentation:** https://learn.microsoft.com/en-us/graph/api/resources/calendar

---

### CALENDAR ONBOARDING STEP ❌ NOT IMPLEMENTED

**Background:**
- Designed in November 2025 as "Step 6.5: Calendar & Availability" or "Step 7"
- Full UI specification exists in conversation history
- Was planned to be between Payment Setup and Team Members
- Never built into the onboarding flow

**Current Onboarding Steps:**
```
1. Basics → 2. Location → 3. Photos → 4. Services → 
5. Optional Details → 6. Review → 7. Agreement → Complete
```

**Desired Onboarding Steps:**
```
1. Basics → 2. Location → 3. Photos → 4. Services → 
5. Optional Details → 6. Payment → 7. Calendar (NEW) →
8. Team Members → 9. Review → 10. Agreement → Complete
```

**Files to Create:**
- `src/pages/onboarding/StepCalendar.tsx`

**Files to Modify:**
- `src/pages/onboarding/CompleteProfile.tsx` (update step count)
- Navigation/routing to include new step

**UI Design (from November 2025 spec):**
```
┌─────────────────────────────────────────┐
│ Step 7 of 10: Calendar & Availability   │
│ [Skip for now →]                        │
├─────────────────────────────────────────┤
│                                         │
│ Connect Your Calendar                   │
│ Two-way sync keeps availability updated │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │  📅  Connect Google Calendar        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │  📧  Connect Microsoft Outlook      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [I'll manage manually →]                │
│                                         │
├─────────────────────────────────────────┤
│ Set Your Business Hours                 │
│ Mon [✓] [9:00 AM▼] to [5:00 PM▼]       │
│ ...                                     │
├─────────────────────────────────────────┤
│ [← Back]              [Continue →]      │
└─────────────────────────────────────────┘
```

---

### CALENDAR-BOOKING INTEGRATION ❌ NOT IMPLEMENTED

**Critical Gap:** Even when a provider connects their calendar, the booking flow doesn't use this information. Double-bookings are currently possible.

**Current Flow (Broken):**
```
1. Patient selects date in booking flow
2. Backend returns provider's business hours only
3. Patient sees ALL slots within business hours
4. Provider's actual calendar events are IGNORED
5. Double-booking can occur!
```

**Required Flow:**
```
1. Patient selects date in booking flow
2. Backend calls /api/calendar/freebusy/:providerId
3. Backend combines business hours with calendar busy times
4. Backend subtracts busy times from available slots
5. Patient sees only TRULY available slots
```

**Files to Modify:**
- Backend: `backend/routes/bookings.js` or availability endpoint
- Flutter: `lib/presentation/screens/booking/datetime_selection_screen.dart`

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

### Known Issues
- **iOS Standalone Launch:** May crash - needs verification (Jan 13 fix applied)
- **Biometric Login:** Blocked until app crash verified fixed
- **Calendar Date Picker:** No month indicator when scrolling

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
GOOGLE_CALENDAR_CLIENT_ID          # Added Jan 14
GOOGLE_CALENDAR_CLIENT_SECRET      # Added Jan 14
```

### Required for Microsoft Calendar (Not Yet Added)
```
MICROSOFT_CLIENT_ID
MICROSOFT_CLIENT_SECRET
MICROSOFT_TENANT_ID=common
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

### Calendar Routes (Google Only)
```
GET  /api/calendar/google/auth/:providerId
GET  /api/calendar/google/callback
GET  /api/calendar/status/:providerId
POST /api/calendar/disconnect/:providerId
GET  /api/calendar/freebusy/:providerId
POST /api/calendar/create-event/:providerId
```

### Calendar Routes (Microsoft - Not Yet Implemented)
```
GET  /api/calendar/microsoft/auth/:providerId     # PLANNED
GET  /api/calendar/microsoft/callback             # PLANNED
```

---

## 📚 RELATED DOCUMENTS

| Document | Version | Purpose |
|----------|---------|---------|
| SESSION_PROTOCOL | v3 | Daily procedures |
| OUTSTANDING_ISSUES | v13 | Bug/task tracking |
| DEVELOPER_HANDOFF | v1 | Technical onboarding |
| PROVIDER_ONBOARDING_DESIGNER_SPEC | v1 | UI specification (7 steps, Oct 2025) |

---

## 🚦 FEATURE COMPLETION STATUS

### Fully Complete ✅
- Stripe Connect (provider payouts)
- Google Calendar OAuth (dashboard page)
- AI Chat authentication requirement
- Admin dashboard user management
- Admin dashboard payments tab
- Admin dashboard policies tab

### Partially Complete ⚠️
- Google Calendar (no onboarding step, no booking integration)
- iOS standalone app (fix applied, needs verification)

### Not Started ❌
- Microsoft Outlook calendar integration
- Calendar onboarding step for new providers
- Calendar-booking integration (FreeBusy in slot calculation)
- Admin dashboard calendar tab
- Biometric login (blocked by app crash verification)

---

## 🔄 VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 10.0 | Jan 15, 2026 | Clarified calendar integration gaps, Microsoft not started, added detailed status matrix |
| 9.0 | Jan 14, 2026 | Added Stripe Connect, Google Calendar, admin user routes |
| 8.0 | Jan 13, 2026 | Removed Facebook/secure_storage, added calendar integration plan |
| 7.0 | Jan 12, 2026 | Git migration, canonical paths |
| 6.0 | Jan 10, 2026 | Payment system, test providers |

---

*Document Version: 10.0 - January 15, 2026 (End of Day)*  
*Review Method: Comprehensive conversation search*  
*Accuracy: Verified implementations only*
