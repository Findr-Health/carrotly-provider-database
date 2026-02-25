# User App Development - Conversation Starter Guide

---

## Before Starting the New Conversation

### 1. Gather These Files

**Documents to Upload:**
- [ ] `FINDR_HEALTH_USER_APP_TECHNICAL_SPEC.md` (just created)
- [ ] `FINDR_HEALTH_PROJECT_OVERVIEW.md` (created earlier)
- [ ] Figma export screenshots (key screens)

**Figma Screens to Export (PNG or PDF):**
- [ ] Home / Landing screen
- [ ] Search results screen
- [ ] Provider detail screen
- [ ] Service selection screen
- [ ] Date/time picker screen
- [ ] Payment screen
- [ ] Booking confirmation screen
- [ ] My bookings list screen
- [ ] User profile screen
- [ ] AI Chat (Morgan) screen

### 2. Decisions to Make Before Starting

| Decision | Options | Recommendation |
|----------|---------|----------------|
| **Framework** | Flutter vs React Native | **Flutter** - better performance, single codebase, growing ecosystem |
| **State Management** | Provider, Riverpod, BLoC (Flutter) | **Riverpod** - modern, testable, scalable |
| **Navigation** | GoRouter, AutoRoute (Flutter) | **GoRouter** - official, simple, deep linking |
| **API Client** | Dio, http (Flutter) | **Dio** - interceptors, retry logic |
| **Local Storage** | SharedPreferences, Hive, Drift | **Hive** - fast, no native dependencies |

### 3. Development Environment Setup

Before starting, ensure you have:
- [ ] Flutter SDK installed (3.16+)
- [ ] Android Studio with emulators
- [ ] Xcode with iOS simulators (Mac only)
- [ ] VS Code with Flutter extensions
- [ ] Git configured
- [ ] Stripe test account
- [ ] Firebase project created

---

## Prompt for New Conversation

Copy and paste this into a new Claude conversation:

---

I'm building a consumer mobile app for Findr Health, a healthcare cost transparency marketplace. I need you to act as a senior mobile developer and technical architect with 10+ years of experience building production healthcare and marketplace apps.

## Project Context

**Findr Health** connects patients with healthcare providers, showing upfront cash-pay prices. The backend (Node.js/MongoDB) and provider portal already exist and are in production.

**Goal**: Build the consumer mobile app to achieve 10,000 users in 6 months.

**Technical Decisions Made:**
- Framework: Flutter (cross-platform iOS + Android)
- State Management: Riverpod
- Navigation: GoRouter
- API Client: Dio
- Local Storage: Hive
- Backend: Existing Node.js API on Railway

## What Already Exists

1. **Backend API** - Node.js + MongoDB on Railway
   - Provider CRUD, search, featured
   - Booking management
   - Cancellation policy system
   - Stripe Connect for provider payouts

2. **Provider Portal** - React (Vercel)
   - Onboarding flow (8 sections)
   - Dashboard with profile editing
   - Analytics page
   - Hours, services, team, photos management

3. **Admin Dashboard** - React (Vercel)
   - Provider approval workflow
   - User management
   - Booking oversight
   - Role-based access control

## What We're Building

A mobile app for patients/consumers to:
1. Discover healthcare providers by location, type, service
2. View provider profiles (services, prices, hours, reviews)
3. Book appointments with upfront pricing
4. Pay securely via Stripe
5. Manage bookings (view, cancel, reschedule)
6. Save favorite providers
7. Chat with Morgan (AI cost calculator)
8. Leave reviews after appointments

## Key Integration Points

- Must use existing Provider data exactly as stored
- Must enforce cancellation policies (Standard 24hr / Moderate 48hr)
- Must integrate with Stripe for payments
- Must work with existing booking schema

## Deliverables Needed

1. **Project Setup** - Flutter project structure, dependencies, architecture
2. **Core Screens** - All major screens with navigation
3. **API Integration** - Services to connect to backend
4. **State Management** - Riverpod providers for app state
5. **Payment Flow** - Stripe integration
6. **Push Notifications** - Firebase Cloud Messaging
7. **App Store Prep** - Assets, metadata, submission guide

## Development Approach

Please help me build this systematically:
1. Start with project architecture and folder structure
2. Build authentication flow first
3. Then discovery/search features
4. Then booking flow
5. Then engagement features (favorites, reviews)
6. Finally AI features (Morgan)

I'm uploading:
1. Technical specification with database schemas and API endpoints
2. Project overview with business context
3. Figma screenshots of key screens

Let's start with the Flutter project setup and architecture. Create a scalable folder structure and list all the dependencies we'll need in pubspec.yaml.

---

**AFTER PASTING:**

1. Upload `FINDR_HEALTH_USER_APP_TECHNICAL_SPEC.md`
2. Upload `FINDR_HEALTH_PROJECT_OVERVIEW.md`
3. Upload Figma screenshots (home, search, provider detail, booking flow)

---

## Recommended Folder Structure (Reference)

This is what we'll likely end up with:

```
lib/
├── main.dart
├── app.dart
│
├── core/
│   ├── constants/
│   │   ├── api_constants.dart
│   │   ├── app_colors.dart
│   │   └── app_strings.dart
│   ├── errors/
│   │   └── exceptions.dart
│   ├── network/
│   │   ├── api_client.dart
│   │   └── api_interceptor.dart
│   ├── router/
│   │   └── app_router.dart
│   └── utils/
│       ├── date_utils.dart
│       └── validators.dart
│
├── data/
│   ├── models/
│   │   ├── user.dart
│   │   ├── provider.dart
│   │   ├── service.dart
│   │   ├── booking.dart
│   │   └── review.dart
│   ├── repositories/
│   │   ├── auth_repository.dart
│   │   ├── provider_repository.dart
│   │   ├── booking_repository.dart
│   │   └── user_repository.dart
│   └── services/
│       ├── auth_service.dart
│       ├── storage_service.dart
│       └── notification_service.dart
│
├── providers/
│   ├── auth_provider.dart
│   ├── user_provider.dart
│   ├── provider_provider.dart
│   ├── booking_provider.dart
│   └── search_provider.dart
│
├── presentation/
│   ├── screens/
│   │   ├── splash/
│   │   ├── auth/
│   │   ├── home/
│   │   ├── search/
│   │   ├── provider_detail/
│   │   ├── booking/
│   │   ├── my_bookings/
│   │   ├── profile/
│   │   ├── favorites/
│   │   └── chat/
│   ├── widgets/
│   │   ├── common/
│   │   ├── provider_card.dart
│   │   ├── service_card.dart
│   │   └── booking_card.dart
│   └── theme/
│       └── app_theme.dart
│
└── l10n/                    # Localization (future)
    └── app_en.arb
```

---

## Key Dependencies (pubspec.yaml reference)

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  flutter_riverpod: ^2.4.9
  riverpod_annotation: ^2.3.3
  
  # Navigation
  go_router: ^13.0.0
  
  # Network
  dio: ^5.4.0
  
  # Local Storage
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  
  # Payments
  flutter_stripe: ^10.1.0
  
  # Firebase
  firebase_core: ^2.24.2
  firebase_messaging: ^14.7.9
  firebase_analytics: ^10.7.4
  
  # Maps & Location
  google_maps_flutter: ^2.5.0
  geolocator: ^10.1.0
  geocoding: ^2.1.1
  
  # UI
  cached_network_image: ^3.3.1
  shimmer: ^3.0.0
  flutter_svg: ^2.0.9
  
  # Utils
  intl: ^0.18.1
  url_launcher: ^6.2.2
  share_plus: ^7.2.1
  
  # Auth
  flutter_secure_storage: ^9.0.0
  
dev_dependencies:
  flutter_test:
    sdk: flutter
  
  # Code Generation
  build_runner: ^2.4.8
  riverpod_generator: ^2.3.9
  json_serializable: ^6.7.1
  hive_generator: ^2.0.1
  
  # Linting
  flutter_lints: ^3.0.1
```

---

## Timeline Estimate

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Setup & Auth | 2 weeks | Project structure, login, register, profile |
| Discovery | 2 weeks | Home, search, filters, provider detail |
| Booking | 2 weeks | Service selection, calendar, payment, confirmation |
| Engagement | 2 weeks | Favorites, reviews, notifications |
| AI & Polish | 2 weeks | Morgan chat, offline support, optimization |
| Testing & Launch | 2 weeks | QA, beta testing, app store submission |

**Total: 12 weeks to production launch**

---

## Success Metrics

| Metric | Target |
|--------|--------|
| App Store Rating | 4.5+ stars |
| Crash-free Rate | 99.5%+ |
| API Response Time | < 200ms |
| App Launch Time | < 3 seconds |
| User Retention (D7) | 40%+ |
| Booking Conversion | 15%+ |

---

*Ready to start building! Begin the new conversation with the prompt above.*
