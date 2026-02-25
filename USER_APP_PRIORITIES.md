# Findr Health User App - Immediate Priorities

**Date:** January 3, 2026  
**Platform:** Flutter (iOS + Android)  
**Status:** Under construction in separate conversation  

---

## MVP Features (Required for Launch)

### P0 - Core Features (~80-110 hours total)

| Feature | Description | Effort | Status |
|---------|-------------|--------|--------|
| **Navigation Shell** | Bottom nav, routing structure | 4-6 hrs | 🔄 |
| **Authentication** | Firebase + Django token flow | 12-16 hrs | 🔄 |
| **Home/Discovery** | Browse providers, categories, featured | 8-12 hrs | 🔄 |
| **Search & Filters** | Find providers by service/location/type | 8-12 hrs | 🔄 |
| **Provider Detail** | View provider info, services, pricing, photos | 8-10 hrs | 🔄 |
| **Booking Flow** | Select service → date/time → payment → confirm | 16-20 hrs | 🔄 |
| **Stripe Payments** | Process transactions, hold authorizations | 12-16 hrs | ⏳ |
| **User Profile** | Account settings, personal info | 6-8 hrs | 🔄 |
| **My Bookings** | View upcoming/past appointments | 6-8 hrs | ⏳ |

---

## What Can Wait (Post-MVP)

| Feature | Why It Can Wait | Temporary Alternative |
|---------|-----------------|----------------------|
| **Clarity AI Chat** | Not core to booking | WebView embed or link to web |
| **Document Analysis** | Enhancement, not core | Link to web version |
| **Push Notifications** | Can use email initially | Email notifications |
| **Favorites/Saved** | Nice-to-have | Browser bookmarks |
| **Reviews System** | Need bookings first | Defer until post-launch |
| **Insurance Verification** | Complex integration | Manual process initially |

---

## Backend API Status

### Existing (Ready to Use) ✅
- `GET /api/providers` - List all providers
- `GET /api/providers/:id` - Provider detail
- `GET /api/providers/search` - Search providers
- `GET /api/service-templates/categories` - Service categories
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/:id` - User profile

### Needs Building 🔲
- `POST /api/bookings` - Create booking
- `GET /api/bookings/user/:userId` - User's bookings
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `POST /api/payments/create-intent` - Stripe payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/providers/:id/availability` - Provider availability slots

---

## Key Integration Points

### Provider Data Flow
```
Provider Portal (onboarding) → MongoDB → API → Flutter App
```

### Service Templates
- 120 templates across 10 provider types
- Categories: Preventive, Cosmetic, Therapeutic, Specialty, etc.
- Each service has: name, description, duration, price, category

### Cancellation Policy Logic
```javascript
// Already implemented in backend
const tiers = {
  'flexible': { free: 24, partial: 12 },    // 24h free, 12-24h = 25%
  'standard': { free: 24, partial: 12 },    // 24h free, 12-24h = 25%, <12h = 50%
  'strict': { free: 48, partial: 24 }       // 48h free, 24-48h = 25%, <24h = 50%
};
```

---

## Flutter Technical Stack

```yaml
dependencies:
  # State Management
  flutter_riverpod: ^2.4.9
  
  # Navigation
  go_router: ^13.0.0
  
  # Network
  dio: ^5.4.0
  
  # Local Storage
  hive: ^2.2.3
  flutter_secure_storage: ^9.0.0
  
  # UI
  flutter_svg: ^2.0.9
  cached_network_image: ^3.3.0
  shimmer: ^3.0.0
  
  # Maps & Location
  google_maps_flutter: ^2.5.0
  geolocator: ^10.1.0
  
  # Payments
  flutter_stripe: ^10.0.0
  
  # Firebase
  firebase_core: ^2.24.0
  firebase_auth: ^4.16.0
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| App Store Rating | 4.5+ stars |
| Crash-free Rate | 99.5%+ |
| API Response Time | < 200ms |
| App Launch Time | < 3 seconds |
| Booking Conversion | 15%+ |

---

## Next Steps

1. **Continue Flutter development** in separate conversation
2. **Build booking API endpoints** when Flutter reaches booking flow
3. **Integrate Stripe** when payment flow is ready
4. **Test end-to-end** provider onboarding → consumer booking → provider dashboard

---

*This document syncs with User App development conversation.*
