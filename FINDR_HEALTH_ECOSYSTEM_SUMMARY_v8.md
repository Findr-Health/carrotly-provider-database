# FINDR HEALTH ECOSYSTEM - COMPREHENSIVE SUMMARY
## Version 8 | Updated: January 13, 2026

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
│   │ • Clarity AI     │     │ • Policies       │     │                  │   │
│   │ • Map Search     │     │                  │     │                  │   │
│   │ • My Bookings    │     │ 🔜 Stripe Connect│     │ 🔜 Field Alignment│  │
│   │ • Biometric Auth │     │ 🔜 Calendar Sync │     │ 🔜 Stripe Status │   │
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
│                    │ • /api/users & /api/auth               │               │
│                    │ • /api/payments (Stripe)               │               │
│                    │ • /api/upload (Cloudinary)             │               │
│                    │ • /api/admin/*                         │               │
│                    │ • /api/search/featured                 │               │
│                    │ • /api/search/verified                 │               │
│                    └────────────────┬───────────────────────┘               │
│                                     │                                        │
│                                     ▼                                        │
│                    ┌────────────────────────────────────────┐               │
│                    │         MONGODB ATLAS                  │               │
│                    ├────────────────────────────────────────┤               │
│                    │ • providers (17 total)                 │               │
│                    │ • users                                │               │
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

## 📱 FLUTTER APP - KEY DETAILS

### Removed Dependencies (Jan 13, 2026)
| Package | Reason Removed |
|---------|----------------|
| `flutter_facebook_auth` | Crashed on iOS standalone launch |
| `flutter_secure_storage` | Required Keychain entitlements incompatible with iOS 26.1 beta |

### Current Auth Methods
- ✅ Email/Password
- ✅ Google Sign-In
- ✅ Apple Sign-In
- ❌ Facebook (removed)

### Storage
- All data now uses `SharedPreferences`
- Tokens stored in SharedPreferences (acceptable for MVP)
- Biometric preference stored in SharedPreferences

### Key Files
```
lib/
├── core/
│   ├── services/storage_service.dart    # Rewritten Jan 13 - SharedPreferences only
│   └── router/app_router.dart
├── data/models/
│   ├── provider_model.dart              # Includes isVerified, isFeatured
│   └── booking_model.dart
├── presentation/screens/
│   ├── auth/login_screen.dart           # Facebook removed
│   ├── booking/
│   │   └── datetime_selection_screen.dart  # Monthly calendar view
│   └── splash/splash_screen.dart        # Biometric check
└── services/
    └── social_auth_service.dart         # Facebook methods removed
```

---

## 💳 PAYMENT SYSTEM

### Booking chargeType Options
| Type | Behavior | Status |
|------|----------|--------|
| `prepay` | Immediate Stripe charge | ✅ Implemented |
| `at_visit` | No charge, pay at appointment | ✅ Default |
| `card_on_file` | Save card, charge after | 🔜 Future |

### Fee Structure
- Platform fee: 10% + $1.50 per booking
- Cap: $35 maximum

### Stripe Connect (Planned)
- **Account Type:** Express (Stripe handles KYC)
- **Flow:** Provider clicks "Connect" → Stripe onboarding → Returns
- **Data:** `stripeConnectedAccountId` in Provider model

---

## 📅 CALENDAR INTEGRATION (Planned)

### Approach: Two-Way with Google/Microsoft (85% coverage)

| Platform | API | Coverage |
|----------|-----|----------|
| Google Calendar | FreeBusy API | ~50% |
| Microsoft Outlook | Graph API | ~35% |

### Features
- **Read:** Provider's busy times (privacy-friendly)
- **Calculate:** Available slots from business hours minus busy
- **Write:** Push bookings to provider's calendar

### Provider Schema Addition (Planned)
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

## 📊 DATABASE STATE

### Provider Statistics
- **Total Providers:** 17
- **Test Providers:** 10 (all categories)
- **With Photos:** 3
- **Verified:** 12
- **Featured:** 12

### Test Providers
| Provider | Type | Services | Verified | Featured |
|----------|------|----------|----------|----------|
| Medical Test | Medical | 34 | ✅ | ✅ |
| Urgent Care Test | Urgent Care | 36 | ✅ | ✅ |
| Dental Test | Dental | 14 | ✅ | ✅ |
| Mental Health Test | Mental Health | 15 | ✅ | ✅ |
| Skincare Test | Skincare | 21 | ✅ | ✅ |
| Massage Test | Massage | 13 | ✅ | ✅ |
| Fitness Test | Fitness | 11 | ✅ | ✅ |
| Yoga Test | Yoga | 9 | ✅ | ✅ |
| Nutrition Test | Nutrition | 12 | ✅ | ✅ |
| Pharmacy Test | Pharmacy | 17 | ✅ | ✅ |

### Service Templates: 149 total
Medical: 34 | Urgent Care: 36 | Dental: 14 | Skincare: 21 | Mental Health: 15 | Nutrition: 12 | Pharmacy: 17 | Massage: 13 | Fitness: 11 | Yoga: 9

---

## 🧪 TEST ACCOUNTS

| Type | Email | Password | Purpose |
|------|-------|----------|---------|
| Consumer | gagi@findrhealth.com | Test1234! | Primary testing |
| Consumer | tim@findrhealth.com | Test1234! | Developer testing |

---

## 🐛 KNOWN ISSUES

| Issue | Status | Workaround |
|-------|--------|------------|
| iOS 26.1 blocks Release installs | Active | Use TestFlight |
| Biometric untested | Blocked | Awaiting TestFlight |
| Email SMTP timeout | Workaround | Non-blocking (fire-and-forget) |

---

## 📋 USEFUL COMMANDS

### Flutter
```bash
# Run app
cd ~/Development/findr-health/findr-health-mobile && flutter run

# Clean rebuild
flutter clean && flutter pub get && flutter run

# Archive for TestFlight
flutter build ios --release
# Then: Xcode → Product → Archive → Distribute
```

### Backend
```bash
# Test API
curl https://fearless-achievement-production.up.railway.app/api/health

# Get providers
curl https://fearless-achievement-production.up.railway.app/api/providers

# Get featured
curl https://fearless-achievement-production.up.railway.app/api/search/featured
```

### Git
```bash
# Add SSH key (every session)
ssh-add ~/.ssh/id_ed25519_findr

# Status check
git status && git log -1 --oneline
```

---

## 📚 RELATED DOCUMENTS

| Document | Version | Purpose |
|----------|---------|---------|
| SESSION_PROTOCOL | v3 | Daily procedures |
| OUTSTANDING_ISSUES | v11 | Bug/task tracking |
| DEVELOPER_HANDOFF | v1 | Technical onboarding |

---

## 🔄 VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 8.0 | Jan 13, 2026 | Removed Facebook/secure_storage, added calendar integration plan |
| 7.0 | Jan 12, 2026 | Git migration, canonical paths |
| 6.0 | Jan 10, 2026 | Payment system, test providers |

---

*Document Version: 8.0 - January 13, 2026*
