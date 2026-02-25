# FINDR HEALTH - OUTSTANDING ISSUES
## Version 11 | Updated: January 13, 2026 (End of Day)

---

## 🔴 CRITICAL (Blocking Release)

### 1. iOS 26.1 Beta Blocking Direct Install
- **Status:** IDENTIFIED - No code fix possible
- **Problem:** Cannot install Release builds directly to iOS 26.1 beta device
- **Error:** "Attempted to install a Beta profile without the proper entitlement"
- **Impact:** Must use TestFlight for all Release testing
- **Solution:** Archive → Upload to App Store Connect → TestFlight

### 2. Biometric Login Testing
- **Status:** BLOCKED by Issue #1
- **Code Status:** ✅ Complete and ready
- **Dependency:** Requires TestFlight build to test on real device
- **Test Flow:**
  1. Install via TestFlight
  2. Log in with gagi@findrhealth.com / Test1234!
  3. Settings → Enable Face ID
  4. Close app (don't logout)
  5. Reopen → Should prompt Face ID

---

## 🟡 HIGH PRIORITY

### 3. TestFlight Build 28
- **Status:** Ready to build
- **Changes Included:**
  - ✅ Facebook auth removed
  - ✅ flutter_secure_storage replaced with SharedPreferences
  - ✅ Provider portal popup fixed
- **Action:** Archive in Xcode → Upload → Distribute via TestFlight

### 4. Stripe Connect Integration (Provider Portal)
- **Status:** Design complete, not built
- **Priority:** HIGH - Enables provider payments
- **Estimate:** 3-4 days

#### Recommended Approach: Stripe Connect Express
| Aspect | Detail |
|--------|--------|
| Account Type | Express - Stripe handles KYC, compliance, tax forms |
| Flow | Provider clicks "Connect Stripe" → Stripe hosted onboarding → Returns |
| Data Stored | `stripeConnectedAccountId` in Provider model |
| Payouts | Automatic to provider's bank (configurable: instant, daily, weekly) |
| Platform Fee | 10% + $1.50 (capped $35) - already defined |

#### Provider Portal UI (Payments Tab)
```
┌─────────────────────────────────────────┐
│ 💳 Payment Setup                        │
│                                         │
│ Status: ⚠️ Not Connected                │
│                                         │
│ [Connect with Stripe]                   │
│                                         │
│ Connect your bank account to receive    │
│ payments from patient bookings.         │
└─────────────────────────────────────────┘

After connected:
┌─────────────────────────────────────────┐
│ 💳 Payment Setup                        │
│                                         │
│ Status: ✅ Connected                    │
│ Account: ****4242                       │
│ Payouts: Weekly (Fridays)               │
│                                         │
│ [View Stripe Dashboard] [Disconnect]    │
└─────────────────────────────────────────┘
```

### 5. Calendar Integration (Real-time Availability)
- **Status:** Design complete, not built
- **Priority:** HIGH - Critical for booking accuracy
- **Estimate:** 5-6 days

#### Approach: Google + Microsoft (85% coverage)
| Platform | Coverage | API |
|----------|----------|-----|
| Google Calendar | ~50% | FreeBusy API |
| Microsoft Outlook | ~35% | Graph API |

#### How It Works
```
1. Provider connects Google/Outlook via OAuth
2. Patient selects booking date
3. Findr queries provider's calendar for busy times
4. Available slots = Business hours - Busy times - Existing bookings
5. After booking: Event pushed to provider's calendar
```

#### Privacy Note
- FreeBusy API only returns WHEN provider is busy
- Does NOT expose appointment details (HIPAA-friendly)

#### Provider Portal UI (Calendar Tab)
```
┌─────────────────────────────────────────┐
│ 📆 Calendar Integration                 │
│                                         │
│ Sync your calendar for real-time        │
│ availability:                           │
│                                         │
│ [🔵 Connect Google Calendar]            │
│ [🔷 Connect Microsoft Outlook]          │
│                                         │
│ ✓ We only see when you're busy          │
│ ✓ Bookings auto-added to your calendar  │
└─────────────────────────────────────────┘
```

#### Database Schema Addition
```javascript
calendarIntegration: {
  google: {
    connected: Boolean,
    accessToken: String,      // encrypted
    refreshToken: String,     // encrypted
    calendarId: String,
    email: String
  },
  microsoft: {
    connected: Boolean,
    accessToken: String,
    refreshToken: String,
    email: String
  }
}
```

---

## 🟢 MEDIUM PRIORITY

### 6. Admin Dashboard Field Alignment
- **Status:** Not started
- **Task:** Admin provider detail must match provider portal fields
- **Estimate:** 1-2 days

#### Current Admin Tabs
Overview | Photos | Services | Credentials | Team | Hours | Agreement

#### Current Provider Portal Tabs
Basic Info | Location | Hours | Services | Team | Photos | Credentials | Policies

#### Missing in Admin Dashboard
| Field/Section | Priority |
|---------------|----------|
| Location (full address editing) | High |
| Policies (cancellation tier) | High |
| Stripe Connection Status | High (new) |
| Calendar Connection Status | High (new) |

#### Proposed Admin Provider Detail Tabs
```
Overview | Location | Hours | Services | Team | Photos | Credentials | Policies | Payments | Calendar
```

### 7. Provider Built-in Scheduling System
- **Status:** Design phase
- **Priority:** Medium - For providers without existing scheduling software
- **Estimate:** 5-7 days (future phase)

#### Features
- View all Findr bookings in calendar view
- Manually add appointments (walk-ins, phone bookings)
- Block time slots (lunch, meetings, PTO)
- Export to ICS for any calendar app
- Webhook/API for office management integration

#### UI Concept
```
┌─────────────────────────────────────────────────────────────┐
│ 📅 My Schedule                            [+ Block Time]    │
├─────────────────────────────────────────────────────────────┤
│ ◀ January 2026 ▶                                            │
│ ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐                │
│ │ Sun │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │                │
│ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                │
│ │     │  13 │  14 │  15 │  16 │  17 │  18 │                │
│ │     │ ●●  │ ●   │ ●●● │     │ ●   │     │                │
│ └─────┴─────┴─────┴─────┴─────┴─────┴─────┘                │
│                                                             │
│ Today: Monday, Jan 13                                       │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 9:00 AM  │ John Smith - Dental Cleaning      [View]     ││
│ │ 10:30 AM │ Jane Doe - Teeth Whitening        [View]     ││
│ │ 2:00 PM  │ ░░░░░░░░ Available ░░░░░░░░                  ││
│ │ 3:30 PM  │ Bob Wilson - Consultation         [View]     ││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 8. Provider Photo Uploads
- **Status:** 3 of 17 providers have photos
- **Task:** Upload photos for remaining test providers

---

## ✅ RESOLVED

### January 13, 2026

#### ~~App Crashes on Standalone Launch~~
- **Root Cause 1:** `flutter_facebook_auth` plugin crash during registration
- **Root Cause 2:** `flutter_secure_storage` requires Keychain entitlements
- **Fix:** Removed both plugins, replaced secure storage with SharedPreferences
- **Status:** Code fixed, awaiting TestFlight verification

#### ~~Provider Portal Unsaved Changes Popup~~
- **Issue:** Popup appeared even after saving
- **Root Cause:** 31 `markChanged()` calls + async React race conditions
- **Fix:** Disabled popup entirely
- **Commit:** Deployed to Vercel, verified working

### January 12, 2026

#### ~~Git Repository Migration~~
- All repos now in `~/Development/findr-health/`

#### ~~Terms of Service~~
- 16 sections now display correctly

### January 9-10, 2026

#### ~~Booking Flow~~ | ~~SMTP Email~~ | ~~Calendar Month Indicator~~ | ~~Demo Providers~~ | ~~Verified/Featured Badges~~

---

## 📊 Development Roadmap

### Phase 1: TestFlight & Verification (1-2 days)
- [ ] Build 28 to TestFlight
- [ ] Verify biometric login
- [ ] Verify app doesn't crash

### Phase 2: Provider Payments (3-4 days)
- [ ] Stripe Connect Express backend routes
- [ ] Provider Portal Payments tab UI
- [ ] Admin Dashboard Payments status
- [ ] Webhook handling for account updates

### Phase 3: Calendar Integration (5-6 days)
- [ ] Google OAuth implementation
- [ ] Microsoft OAuth implementation
- [ ] FreeBusy API integration
- [ ] Slot calculation logic
- [ ] Event push on booking
- [ ] Provider Portal Calendar tab UI

### Phase 4: Admin Alignment (1-2 days)
- [ ] Add Location tab
- [ ] Add Policies tab
- [ ] Add Payments status
- [ ] Add Calendar status

### Phase 5: Built-in Scheduling (Future)
- [ ] Calendar view component
- [ ] Manual booking creation
- [ ] Time blocking
- [ ] ICS export

---

## 🧪 Test Accounts

| Email | Password | Purpose |
|-------|----------|---------|
| gagi@findrhealth.com | Test1234! | Primary test |
| tim@findrhealth.com | Test1234! | Developer |

---

## 📁 Reference Paths

```
~/Development/findr-health/findr-health-mobile/        # Flutter app
~/Development/findr-health/carrotly-provider-database/ # Backend + Admin
~/Development/findr-health/carrotly-provider-mvp/      # Provider Portal
```

---

## 📋 Next Session Checklist

1. [ ] Create TestFlight Build 28
2. [ ] Test biometric login via TestFlight
3. [ ] Begin Stripe Connect implementation
4. [ ] Begin Google Calendar integration

---

*Last Updated: January 13, 2026 - End of Session*
