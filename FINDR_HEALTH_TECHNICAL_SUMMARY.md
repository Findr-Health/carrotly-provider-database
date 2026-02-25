# Findr Health - Technical Architecture & Development Summary

**Document Version:** 1.0  
**Date:** January 4, 2025  
**Purpose:** Complete system overview for development continuity

---

## Executive Summary

Findr Health is a healthcare cost transparency marketplace connecting patients with independent healthcare providers. The platform consists of three primary components working in concert:

1. **Provider Portal** (Web) - Provider onboarding and profile management
2. **Consumer Mobile App** (Flutter) - Patient-facing booking and discovery
3. **Backend API** (Node.js/MongoDB) - Centralized data and business logic

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FINDR HEALTH ECOSYSTEM                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   ┌──────────────────┐     ┌──────────────────┐     ┌──────────────┐ │
│   │  Provider Portal │     │   Flutter App    │     │ Admin Panel  │ │
│   │  (React/Vite)    │     │   (Consumer)     │     │  (React)     │ │
│   │                  │     │                  │     │              │ │
│   │  • Onboarding    │     │  • Discovery     │     │  • Analytics │ │
│   │  • Edit Profile  │     │  • Booking       │     │  • Providers │ │
│   │  • Team Mgmt     │     │  • Payments      │     │  • Bookings  │ │
│   │  • Services      │     │  • AI Assistant  │     │  • Users     │ │
│   └────────┬─────────┘     └────────┬─────────┘     └──────┬───────┘ │
│            │                        │                       │         │
│            └────────────────────────┼───────────────────────┘         │
│                                     │                                 │
│                          ┌──────────▼──────────┐                      │
│                          │   Backend API       │                      │
│                          │   (Node.js/Express) │                      │
│                          │                     │                      │
│                          │  • REST Endpoints   │                      │
│                          │  • Stripe Connect   │                      │
│                          │  • Booking Logic    │                      │
│                          │  • Cancellation     │                      │
│                          └──────────┬──────────┘                      │
│                                     │                                 │
│                          ┌──────────▼──────────┐                      │
│                          │     MongoDB         │                      │
│                          │   (Atlas Cloud)     │                      │
│                          └─────────────────────┘                      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Provider Portal

**Location:** `~/Desktop/carrotly-provider-mvp`  
**Deployment:** Vercel → `findrhealth-provider.vercel.app`  
**Stack:** React + TypeScript + Vite + Tailwind CSS

#### Key Files
| File | Purpose |
|------|---------|
| `src/pages/EditProfile.tsx` | Main profile editing (tabs: Basic Info, Location, Hours, Services, Team, Photos, Credentials, Policies) |
| `src/pages/onboarding/CompleteProfile.tsx` | 10-step onboarding wizard |
| `src/hooks/useProviderData.ts` | Provider data fetching/updating hook |
| `src/components/ServiceSelector.tsx` | 120 service templates by provider type |
| `src/types/index.ts` | TypeScript interfaces |

#### Features Implemented
- ✅ 10-step provider onboarding
- ✅ Service management with 120 templates
- ✅ Team member management
- ✅ **Team-service linking** (team members assigned to specific services)
- ✅ Photo upload
- ✅ Business hours configuration
- ✅ Cancellation policy selection
- ✅ Stripe Connect Express integration
- ✅ Calendar OAuth (Google/Microsoft/Apple)
- ✅ Legal agreement signing

#### Team-Service Linking (Built This Session)
Team members can be linked to specific services they can perform:
- `serviceIds: undefined` → Can perform ALL services
- `serviceIds: []` → Specific mode enabled, none selected
- `serviceIds: ['id1', 'id2']` → Can only perform listed services

UI includes "All Services" checkbox that toggles between modes.

---

### 2. Backend API

**Location:** `~/Desktop/carrotly-provider-database/backend`  
**Deployment:** Railway → `fearless-achievement-production.up.railway.app`  
**Stack:** Node.js + Express + MongoDB (Mongoose)

#### Key Files
| File | Purpose |
|------|---------|
| `models/Provider.js` | Provider schema with services, team, calendar |
| `models/Booking.js` | Booking schema with payment, cancellation |
| `models/User.js` | Patient/user schema |
| `routes/providers.js` | Provider CRUD endpoints |
| `routes/bookings.js` | Booking lifecycle endpoints |
| `routes/providerServices.js` | Service template endpoints |

#### Provider Schema (Current)
```javascript
{
  practiceName: String,
  providerTypes: [String],  // ['medical', 'dental', 'cosmetic', etc.]
  description: String,
  contactInfo: { email, phone, website },
  address: { street, suite, city, state, zip },
  location: { type: 'Point', coordinates: [lng, lat] },
  
  // Services with variant support
  services: [{
    name: String,
    category: String,
    description: String,
    shortDescription: String,  // Max 100 chars for tiles
    duration: Number,          // Base duration in minutes
    price: Number,             // Base price
    basePrice: Number,         // "From $X" display
    hasVariants: Boolean,
    variants: [{
      name: String,
      description: String,
      price: Number,
      duration: Number,
      isDefault: Boolean
    }],
    isActive: Boolean,
    sortOrder: Number
  }],
  
  // Team members with service linking
  teamMembers: [{
    name: String,
    title: String,
    bio: String,
    photo: String,
    serviceIds: [String],      // Services this member can perform
    rating: Number,
    reviewCount: Number,
    acceptsBookings: Boolean
  }],
  
  // Calendar & availability
  calendar: {
    provider: String,  // 'google', 'microsoft', 'apple', 'manual'
    businessHours: {
      monday: { isOpen: Boolean, open: String, close: String },
      // ... same for all days
    }
  },
  
  // Cancellation policy
  cancellationPolicy: String,  // 'flexible', 'standard', 'moderate', 'strict'
  
  // Other fields...
  photos: [{ url, isPrimary, caption }],
  credentials: { licenseNumber, education, certifications, etc. },
  payment: { stripeAccountId, stripeOnboardingComplete, etc. },
  agreement: { signature, agreedDate, version },
  status: String  // 'draft', 'pending', 'approved'
}
```

#### Key Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/providers/:id` | Get provider details |
| PUT | `/api/providers/:id` | Update provider profile |
| GET | `/api/providers/:id/availability` | Get available time slots |
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/:id/cancellation-quote` | Get cancellation fee preview |
| POST | `/api/bookings/:id/cancel` | Cancel booking |
| GET | `/api/provider-services/templates` | Get service templates |

---

### 3. Flutter Consumer App

**Location:** `~/Downloads/Findr_health_APP`  
**Stack:** Flutter + Dart + Dio + GoRouter

#### Current Structure
```
lib/
├── core/
│   ├── constants/
│   │   ├── app_colors.dart
│   │   └── provider_types.dart
│   └── router/
│       └── app_router.dart
├── data/
│   ├── models/
│   │   ├── provider_model.dart    ← NEEDS UPDATE
│   │   ├── booking_model.dart
│   │   └── user_model.dart
│   └── repositories/
│       └── provider_repository.dart
├── models/
│   ├── booking.dart              (comprehensive booking model)
│   ├── availability.dart
│   └── payment_review.dart
├── presentation/
│   ├── screens/
│   │   ├── booking/
│   │   │   ├── service_selection_screen.dart  ← NEEDS UPDATE
│   │   │   ├── datetime_selection_screen.dart ← NEEDS UPDATE
│   │   │   └── booking_confirmation_screen.dart
│   │   └── provider_detail/
│   │       └── provider_detail_screen.dart
│   └── widgets/
└── services/
    └── booking_service.dart
```

#### What Exists
- ✅ Provider discovery and search
- ✅ Provider detail screen
- ✅ Basic booking models
- ✅ Dio-based API services
- ✅ GoRouter navigation
- ✅ AI assistant (Clarity) integration

#### What's Being Added (This Session)
New booking flow with 4 steps:
1. **Service Selection** - With variant support
2. **Team Selection** - Filtered by service capability
3. **DateTime Selection** - Calendar + time slots
4. **Review & Confirm** - Price breakdown, cancellation policy

---

## What Was Built This Session

### 1. Provider Portal - Team-Service Linking

**Problem:** Team members couldn't be assigned to specific services.

**Solution:** 
- Updated `TeamMember` interface with `serviceIds?: string[]`
- Added checkbox UI in EditProfile.tsx team section
- "All Services" toggle for universal capability
- Individual service checkboxes for specific assignment

**Code Location:** `EditProfile.tsx` lines 757-810

### 2. Backend Schema Updates

**Changes:**
- Added `serviceIds: [String]` to teamMembers
- Added `rating`, `reviewCount` to teamMembers
- Added `variants[]` array to services
- Added `hasVariants`, `basePrice`, `shortDescription` to services

**Migration:** Already executed on production database

### 3. Save Functionality Fixes

**Issues Fixed:**
- `cancellationPolicy` was sending object, backend expects string
- `businessHours` field name mismatches (enabled→isOpen, start→open, end→close)
- `fetch` syntax errors in useProviderData.ts

**Current Status:** Basic save works, but some edge cases remain (see bugs below)

### 4. Flutter Booking Flow Screens

**Files Created:**
| File | Purpose |
|------|---------|
| `provider_model.dart` | Updated model with variants, team linking |
| `booking_state.dart` | State management for booking flow |
| `service_selection_screen.dart` | Step 1 with variant support |
| `team_selection_screen.dart` | Step 2 with service filtering |
| `datetime_selection_screen.dart` | Step 3 with calendar |
| `booking_review_screen.dart` | Step 4 with price breakdown |
| `booking_flow_screen.dart` | Main coordinator |
| `INTEGRATION_GUIDE.md` | Integration instructions |

**Location:** `~/Downloads/Findr_health_APP/flutter-updates/`

---

## Outstanding Bugs

### Bug 1: "Unsaved Changes" Popup After Saving (Provider Portal)

**Symptom:** After saving changes and clicking back arrow, popup shows "You have unsaved changes" even though save succeeded.

**Root Cause:** Race condition - `setHasChanges(false)` is called, but the `useEffect([provider])` re-runs when updated provider data returns, potentially re-triggering state changes.

**What Was Tried:**
1. Added `successMessage` check to handleCancel
2. Added `justSavedRef` React ref

**Recommended Fix:** Compare form state to original provider data instead of using a boolean flag, or add debounced state comparison.

**Files:** `EditProfile.tsx` lines 167-175 (handleCancel), 218-232 (handleSave)

### Bug 2: Cancellation Policy Not Saving

**Symptom:** Changing cancellation policy doesn't persist after refresh.

**Root Cause:** Schema mismatch - Frontend uses "moderate" but backend enum only has: `['flexible', 'standard', 'strict']`

**Fix Required:** Update backend schema to include 'moderate':
```javascript
// In Provider.js line 154
cancellationPolicy: {
  type: String,
  enum: ['flexible', 'standard', 'moderate', 'strict'],
  default: 'standard'
}
```

---

## Immediate Next Steps

### 1. Flutter Integration (Priority)
The booking flow screens are ready but not integrated:

```bash
# Files to copy
cp ~/Downloads/Findr_health_APP/flutter-updates/provider_model.dart \
   ~/Downloads/Findr_health_APP/lib/data/models/

cp ~/Downloads/Findr_health_APP/flutter-updates/booking_state.dart \
   ~/Downloads/Findr_health_APP/lib/models/

cp ~/Downloads/Findr_health_APP/flutter-updates/*_screen.dart \
   ~/Downloads/Findr_health_APP/lib/presentation/screens/booking/
```

Then:
1. Update router with `/booking/:providerId` route
2. Update provider detail "Book Now" button
3. Test the flow end-to-end

### 2. Backend Updates
- Add 'moderate' to cancellationPolicy enum
- Deploy: `cd ~/Desktop/carrotly-provider-database && git add . && git commit -m "Add moderate cancellation policy" && git push`

### 3. Provider Portal Bugs
- Fix unsaved changes popup
- Verify all fields save correctly

---

## Environment & Deployment

### URLs
| Component | URL |
|-----------|-----|
| Backend API | https://fearless-achievement-production.up.railway.app |
| Provider Portal | https://findrhealth-provider.vercel.app |
| Admin Dashboard | (Vercel - check deployment) |

### Deployment Commands

**Provider Portal:**
```bash
cd ~/Desktop/carrotly-provider-mvp
npm run build
git add . && git commit -m "message" && git push
# Auto-deploys via Vercel
```

**Backend:**
```bash
cd ~/Desktop/carrotly-provider-database
git add . && git commit -m "message" && git push
# Auto-deploys via Railway
```

**Flutter App:**
```bash
cd ~/Downloads/Findr_health_APP
flutter build ios  # or flutter build apk
```

### Test Provider
- ID: `6959b75e8b1d9aac97d0b76f`
- Name: "Test Update Only"

---

## Key Technical Decisions

1. **Service Variants:** Services can have multiple pricing tiers (e.g., "Teeth Whitening" → Basic $150, Premium $250)

2. **Team-Service Linking:** Optional feature - `serviceIds: undefined` means member can do ALL services, empty array means specific mode with none selected

3. **Cancellation Policies:** 
   - Flexible: Free up to 4 hours
   - Standard: Free up to 24 hours
   - Moderate: 50% fee within 24 hours
   - Strict: 50% within 48 hours, no refund within 24

4. **Business Hours Format:**
   - Backend: `{ isOpen, open, close }`
   - Frontend: `{ enabled, start, end }` (transformed on save)

5. **Platform Fee:** 10% added to service price

---

## File Locations Summary

```
~/Desktop/
├── carrotly-provider-mvp/          # Provider Portal (React)
│   └── src/
│       ├── pages/EditProfile.tsx
│       ├── hooks/useProviderData.ts
│       └── types/index.ts
│
├── carrotly-provider-database/     # Backend (Node.js)
│   └── backend/
│       ├── models/Provider.js
│       ├── models/Booking.js
│       └── routes/providers.js
│
└── (Admin dashboard location)

~/Downloads/
└── Findr_health_APP/               # Flutter App
    ├── lib/
    │   ├── data/models/
    │   ├── presentation/screens/booking/
    │   └── services/
    └── flutter-updates/            # NEW FILES TO INTEGRATE
        ├── provider_model.dart
        ├── booking_state.dart
        ├── service_selection_screen.dart
        ├── team_selection_screen.dart
        ├── datetime_selection_screen.dart
        ├── booking_review_screen.dart
        ├── booking_flow_screen.dart
        └── INTEGRATION_GUIDE.md
```

---

## Contact & Resources

- **Bug Tracking:** `provider-portal-bugs.md` (in project files)
- **Integration Guide:** `~/Downloads/Findr_health_APP/flutter-updates/INTEGRATION_GUIDE.md`
- **Backend Health Check:** `curl https://fearless-achievement-production.up.railway.app/health`

---

*Document generated January 4, 2025*
