# FINDR HEALTH ECOSYSTEM - COMPREHENSIVE SUMMARY
## Updated: January 10, 2026

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
| `Findr-Health/carrotly-provider-database` | **PUBLIC** | Python/JS | Backend API + Admin Dashboard | `~/Desktop/carrotly-provider-database` |
| `Findr-Health/carrotly-provider-mvp` | **PUBLIC** | TypeScript | Provider Onboarding Portal | `~/Desktop/carrotly-provider-mvp` |
| `Findr-Health/findr-health-mobile` | **PRIVATE** | Dart | Flutter Consumer App | `~/Downloads/Findr_health_APP` |

### ⚠️ Security Note
`carrotly-provider-database` is PUBLIC. Never commit API keys, secrets, or .env files to this repo.

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
| Google maps key User app Jan 2026 | Jan 5, 2026 | Flutter Maps/Places | ⚠️ EXPOSED - ROTATE |
| Carrotly Agent - Server Side | Nov 25, 2025 | Backend geocoding | ✅ Check restrictions |
| Carrotly Provider Platform - Restricted | Nov 21, 2025 | Provider Portal | ✅ HTTP referrer restricted |

### API Key Locations (Target State)
| Key | Should Be In | NOT In Code |
|-----|--------------|-------------|
| Google Maps (iOS) | Xcode Environment Variables | ❌ Info.plist hardcoded |
| Google Maps (Android) | local.properties / Gradle | ❌ AndroidManifest hardcoded |
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

| Platform | Status | Account |
|----------|--------|---------|
| Apple Developer | Active | [Your Apple ID] |
| TestFlight | Not yet submitted | Bundle: com.findrhealth.app |
| Google Play | Not yet configured | Package: com.findrhealth.app |

---

## 🧪 TEST ACCOUNTS

| Type | Email | Password | Purpose |
|------|-------|----------|---------|
| Consumer | Gagi@findrhealth.com | Test1234! | Testing booking flow |
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

### Required Versions
| Tool | Version | Check Command |
|------|---------|---------------|
| Flutter | 3.x.x | `flutter --version` |
| Dart | 3.x.x | `dart --version` |
| Node.js | 18+ | `node --version` |
| Xcode | 15+ | `xcodebuild -version` |

### Key Flutter Packages
- `flutter_stripe` - Payment integration
- `dio` - HTTP client
- `flutter_riverpod` - State management
- `go_router` - Navigation
- `lucide_icons` - Icon set

---

## 📁 KEY FILE LOCATIONS

### Flutter App (`~/Downloads/Findr_health_APP`)
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
│       └── provider/
└── providers/
    └── auth_provider.dart
```

### Backend (`~/Desktop/carrotly-provider-database/backend`)
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
| Calendar limited to 1 week | 🔴 Needs fix | None - priority fix |
| Payment shows "Google Pay" falsely | 🔴 Needs fix | None - priority fix |
| Provider photos placeholder | 🟡 Acceptable | Using default images |

---

## 📋 USEFUL COMMANDS

### Flutter
```bash
# Run app
cd ~/Downloads/Findr_health_APP && flutter run

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

# Test booking
curl -X POST "https://fearless-achievement-production.up.railway.app/api/bookings" \
  -H "Content-Type: application/json" \
  -d '{"userId":"ID","providerId":"ID","service":{"name":"Test"},"appointmentDate":"2026-02-01","appointmentTime":"10:00 AM","chargeType":"at_visit"}'
```

### Git
```bash
# Check for exposed secrets
grep -r "AIza" . --include="*.js" --include="*.json"
git log -p | grep -i "api.*key\|AIza\|secret"
```

---

## 📚 RELATED DOCUMENTS

| Document | Purpose |
|----------|---------|
| `OUTSTANDING_ISSUES_v6.md` | Current bugs and priorities |
| `SESSION_PROTOCOL.md` | Daily start/end procedures |
| `DEVELOPER_HANDOFF.md` | Technical onboarding |
| `MOBILE_APP_INTEGRATION_GUIDE.md` | API integration details |

---

*Document Version: 6.0 - January 10, 2026*
