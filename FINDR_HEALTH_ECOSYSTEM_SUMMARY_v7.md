# FINDR HEALTH ECOSYSTEM - COMPREHENSIVE SUMMARY
## Updated: January 12, 2026

---

## ⚠️ CRITICAL: ENGINEERING STANDARDS

**Before ANY development work, verify:**
1. ✅ All repos cloned to `~/Development/findr-health/`
2. ✅ `git status` returns clean for all repos
3. ✅ SSH key configured: `ssh -T git@github.com`
4. ✅ Read ENGINEERING_STANDARDS.md

**NEVER work on code outside `~/Development/findr-health/`**

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
│   │ • Payments       │     │ • Photos ☁️      │     │ • Reports        │   │
│   │ • Profile/Auth   │     │ • Legal Docs     │     │ • Photos ☁️      │   │
│   │ • Clarity AI     │     │ • Dashboard      │     │ • Hours Tab      │   │
│   │ • Map Search     │     │                  │     │ • Verified/Featured│  │
│   │ • My Bookings    │     │                  │     │                  │   │
│   └────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘   │
│            │                        │                        │              │
│            └────────────────────────┼────────────────────────┘              │
│                                     │                                        │
│                                     ▼                                        │
│                    ┌────────────────────────────────┐                       │
│                    │         NODE.JS BACKEND        │                       │
│                    │  (Railway: fearless-achieve)   │                       │
│                    ├────────────────────────────────┤                       │
│                    │ • /api/providers               │                       │
│                    │ • /api/bookings (chargeType)   │                       │
│                    │ • /api/users & /api/auth       │                       │
│                    │ • /api/payments (Stripe)       │                       │
│                    │ • /api/upload (Cloudinary)     │                       │
│                    │ • /api/admin/*                 │                       │
│                    └────────────────┬───────────────┘                       │
│                                     │                                        │
│                                     ▼                                        │
│                    ┌────────────────────────────────┐                       │
│                    │         MONGODB ATLAS          │                       │
│                    ├────────────────────────────────┤                       │
│                    │ • providers (17 total)         │                       │
│                    │ • users                        │                       │
│                    │ • bookings                     │                       │
│                    │ • reviews                      │                       │
│                    │ • servicetemplates (149 recs)  │                       │
│                    └────────────────────────────────┘                       │
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

### ⚠️ Security Notes
- `carrotly-provider-database` is PUBLIC. Never commit API keys, secrets, or .env files.
- `findr-health-mobile` is PRIVATE. Contains app source code.

### 📁 Canonical Folder Structure
```
~/Development/findr-health/              ← ROOT (all projects here)
├── findr-health-mobile/                 ← Flutter consumer app
│   ├── .git/                            ← MUST EXIST
│   ├── lib/
│   ├── ios/
│   ├── android/
│   └── docs/
├── carrotly-provider-database/          ← Backend + Admin Dashboard
│   ├── .git/                            ← MUST EXIST
│   ├── backend/
│   └── admin-dashboard/
├── carrotly-provider-mvp/               ← Provider Portal
│   ├── .git/                            ← MUST EXIST
│   └── src/
└── docs/                                ← Shared documentation
    ├── ECOSYSTEM_SUMMARY.md
    ├── OUTSTANDING_ISSUES.md
    ├── SESSION_PROTOCOL.md
    └── ENGINEERING_STANDARDS.md
```

### ❌ DEPRECATED PATHS (Do Not Use)
These paths are obsolete and should NOT be used:
- `~/Downloads/findr_health_app` ← OLD, no git
- `~/Downloads/Findr_health_APP` ← OLD, inconsistent naming
- `~/Downloads/findr_health_flutter` ← OLD copy
- `~/Downloads/findr-health-mobile` ← OLD, may be stale

---

## 🔗 LIVE DEPLOYMENTS

| Service | URL | Platform |
|---------|-----|----------|
| Backend API | https://fearless-achievement-production.up.railway.app/api | Railway |
| Provider Portal | https://findrhealth-provider.vercel.app | Vercel |
| Admin Dashboard | https://admin-findrhealth-dashboard.vercel.app | Vercel |

---

## 🔐 SECURITY & CREDENTIALS

### Google Cloud API Keys
| Key Name | Created | Purpose | Status |
|----------|---------|---------|--------|
| Google maps key User app Jan 2026 | Jan 10, 2026 | Flutter Maps/Places | ✅ Rotated |
| Carrotly Agent - Server Side | Nov 25, 2025 | Backend geocoding | ✅ Restricted |
| Carrotly Provider Platform - Restricted | Nov 21, 2025 | Provider Portal | ✅ HTTP referrer restricted |

### API Key Locations (Target State)
| Key | Should Be In | Status |
|-----|--------------|--------|
| Google Maps (iOS) | Xcode Environment Variables | 🟡 PENDING - still in Info.plist |
| Google Maps (Android) | local.properties / Gradle | 🟡 PENDING - still in AndroidManifest |
| Stripe Keys | Railway Environment Variables | ✅ Correct |
| Cloudinary | Railway Environment Variables | ✅ Correct |
| MongoDB | Railway Environment Variables | ✅ Correct |

### OAuth 2.0 Clients
| Name | Type | Client ID |
|------|------|-----------|
| Findr Health iOS | iOS | 215654569321-ssh1... |

### Stripe Configuration
- **Mode:** Test (pk_test_...)
- **Connect:** Express accounts for providers
- **Webhooks:** Configured in Railway

---

## 📱 APP STORE STATUS

| Platform | Status | Bundle/Package |
|----------|--------|----------------|
| Apple Developer | Active | com.findrhealth.app |
| TestFlight | ✅ Build 27 Live | Internal testing |
| Google Play | Not yet configured | com.findrhealth.app |

---

## 🧪 TEST ACCOUNTS

| Type | Email | Password | Purpose |
|------|-------|----------|---------|
| Consumer | tim@findrhealth.com | Test1234! | Primary test account |
| Consumer | Gagi@findrhealth.com | Test1234! | Secondary test account |
| Provider | [TBD] | [TBD] | Testing provider portal |
| Admin | [TBD] | [TBD] | Testing admin dashboard |

---

## 📊 DATABASE STATE

### Provider Count: 17
- 7 original providers
- 10 test providers (all service types)

### Test Providers with Full Service Catalogs
| Provider | Type | Services | MongoDB ID |
|----------|------|----------|------------|
| Medical Test | Medical | 34 | 6961103bef927c3f05b10c87 |
| Urgent Care Test | Urgent Care | 36 | 6961103bef927c3f05b10cac |
| Dental Test | Dental | 14 | 6961103cef927c3f05b10cd3 |
| Mental Health Test | Mental Health | 15 | 6961103def927c3f05b10ce4 |
| Skincare Test | Skincare | 21 | 6961103def927c3f05b10cf6 |
| Massage Test | Massage | 13 | 6961103eef927c3f05b10d0e |
| Fitness Test | Fitness | 11 | 6961103eef927c3f05b10d1e |
| Yoga Test | Yoga | 9 | 6961103fef927c3f05b10d2c |
| Nutrition Test | Nutrition | 12 | 6961103fef927c3f05b10d38 |
| Pharmacy Test | Pharmacy | 17 | 6961103fef927c3f05b10d47 |

### Service Templates: 149 total
- Medical: 34 | Urgent Care: 36 | Dental: 14
- Skincare: 21 | Mental Health: 15 | Nutrition: 12
- Pharmacy/Rx: 17 | Massage: 13 | Fitness: 11 | Yoga: 9

---

## 💳 PAYMENT SYSTEM

### Booking chargeType Options
| Type | Behavior | When Used |
|------|----------|-----------|
| `prepay` | Immediate Stripe charge | Require payment upfront |
| `at_visit` | No charge, pay at appointment | MVP default |
| `card_on_file` | Save card, charge after service | Future |

### payment.method Enum
`['card', 'apple_pay', 'google_pay', 'at_visit', 'cash']`

### Fee Structure
- Platform fee: 10% + $1.50 per booking
- Cap: $35 maximum

---

## 🔧 DEVELOPMENT ENVIRONMENT

### Required Tools
| Tool | Version | Check Command | Required |
|------|---------|---------------|----------|
| Git | 2.x+ | `git --version` | ✅ Yes |
| SSH Key | - | `ssh -T git@github.com` | ✅ Yes |
| Flutter | 3.x.x | `flutter --version` | ✅ Yes |
| Dart | 3.x.x | `dart --version` | ✅ Yes |
| Node.js | 18+ | `node --version` | ✅ Yes |
| Xcode | 15+ | `xcodebuild -version` | ✅ Yes (iOS) |

### Key Flutter Packages
- `flutter_stripe` - Payment integration
- `dio` - HTTP client
- `flutter_riverpod` - State management
- `go_router` - Navigation
- `lucide_icons` - Icon set

---

## 📁 KEY FILE LOCATIONS

### Flutter App (`~/Development/findr-health/findr-health-mobile`)
```
lib/
├── core/
│   ├── constants/app_colors.dart
│   └── router/app_router.dart
├── data/
│   ├── models/
│   │   ├── provider_model.dart
│   │   └── booking_model.dart
│   └── repositories/
│       └── booking_repository.dart
├── presentation/
│   └── screens/
│       ├── booking/
│       │   ├── booking_flow_screen.dart
│       │   ├── datetime_selection_screen.dart
│       │   └── booking_review_screen.dart
│       ├── home/
│       │   └── home_screen.dart
│       ├── settings/
│       │   └── terms_of_service_screen.dart
│       └── auth/
└── providers/
    └── auth_provider.dart
```

### Backend (`~/Development/findr-health/carrotly-provider-database/backend`)
```
routes/
├── bookings.js      # Booking API with chargeType
├── providers.js     # Provider CRUD
├── payments.js      # Stripe integration
└── upload.js        # Cloudinary uploads

models/
├── Booking.js       # chargeType field added
├── Provider.js
└── User.js
```

---

## 🐛 KNOWN ISSUES & WORKAROUNDS

| Issue | Status | Workaround |
|-------|--------|------------|
| Email SMTP timeout | 🟡 Workaround | Made non-blocking (fire-and-forget) |
| Terms of Service regression | 🔴 Needs fix | Full 21-page doc needs to be re-added |
| Provider photos placeholder | 🟡 Acceptable | Using default images |
| Google Maps keys hardcoded | 🟡 Pending | Move to environment variables |

---

## 📋 USEFUL COMMANDS

### Git Health Check (Run Daily)
```bash
# Verify all repos are properly configured
cd ~/Development/findr-health

echo "=== findr-health-mobile ===" && \
cd findr-health-mobile && git status && git log -1 --oneline && cd ..

echo "=== carrotly-provider-database ===" && \
cd carrotly-provider-database && git status && git log -1 --oneline && cd ..

echo "=== carrotly-provider-mvp ===" && \
cd carrotly-provider-mvp && git status && git log -1 --oneline && cd ..
```

### Flutter
```bash
# Run app
cd ~/Development/findr-health/findr-health-mobile && flutter run

# Analyze code
flutter analyze

# Fresh install (test onboarding)
xcrun simctl uninstall booted com.findrhealth.app && flutter run

# Build iOS
flutter build ios --release
```

### Backend
```bash
# Test API health
curl https://fearless-achievement-production.up.railway.app/api/health

# Get providers
curl https://fearless-achievement-production.up.railway.app/api/providers
```

### Security Audit
```bash
# Check for exposed secrets
grep -r "AIza" . --include="*.js" --include="*.json" --include="*.dart"
grep -r "pk_live\|sk_live" . --include="*.js" --include="*.dart"
```

---

## 📚 RELATED DOCUMENTS

| Document | Purpose | Version |
|----------|---------|---------|
| `OUTSTANDING_ISSUES.md` | Current bugs and priorities | v8 |
| `SESSION_PROTOCOL.md` | Daily start/end procedures | v2 |
| `ENGINEERING_STANDARDS.md` | Git workflow, folder structure | v1 |
| `DEVELOPER_HANDOFF.md` | Technical onboarding | - |
| `MOBILE_APP_INTEGRATION_GUIDE.md` | API integration details | - |

---

*Document Version: 7.0 - January 12, 2026*
*Next Review: After git migration complete*
