# Findr Health - Booking Flow Implementation Plan

**Version:** 1.0  
**Date:** January 4, 2026  
**Status:** Ready for Implementation

---

## Overview

This plan covers the complete implementation of the Provider Detail → Service Selection → Booking flow across:
- Backend (MongoDB/Node.js)
- Provider Portal (React)
- Consumer App (Flutter)

---

## Part 1: Backend Updates

### 1.1 Update Provider Schema - Services

**File:** `backend/models/Provider.js`

**Current:**
```javascript
services: [{
  name: { type: String, required: true },
  category: String,
  duration: Number,
  price: Number,
  description: String,
  isActive: { type: Boolean, default: true }
}]
```

**Updated:**
```javascript
services: [{
  name: { type: String, required: true },
  category: String,
  description: String,
  shortDescription: String,        // NEW: Max 100 chars for tiles
  duration: Number,                // Base duration in minutes
  price: Number,                   // Base price (for simple services)
  basePrice: Number,               // NEW: Starting price (for "from $X")
  hasVariants: { type: Boolean, default: false },  // NEW
  variants: [{                     // NEW
    name: String,
    description: String,
    price: Number,
    duration: Number,
    isDefault: { type: Boolean, default: false }
  }],
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }  // NEW
}]
```

### 1.2 Update Provider Schema - Team Members

**File:** `backend/models/Provider.js`

**Current:**
```javascript
teamMembers: [{
  name: { type: String, required: true },
  title: String,
  credentials: String,
  bio: String,
  photo: String,
  specialties: [String],
  yearsExperience: Number,
  acceptsBookings: { type: Boolean, default: true },
  calendarConnected: { type: Boolean, default: false }
}]
```

**Updated:**
```javascript
teamMembers: [{
  name: { type: String, required: true },
  title: String,
  credentials: String,
  bio: String,
  photo: String,
  specialties: [String],
  yearsExperience: Number,
  rating: Number,                  // NEW: Average rating
  reviewCount: Number,             // NEW: Number of reviews
  acceptsBookings: { type: Boolean, default: true },
  calendarConnected: { type: Boolean, default: false },
  serviceIds: [String]             // NEW: IDs of services this member can perform
}]
```

### 1.3 New API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/providers/:id/services/grouped` | Services grouped by category |
| PUT | `/api/providers/:id/team/:memberId/services` | Update team member's service links |
| GET | `/api/providers/:id/team/:memberId/availability` | Team member specific availability (future) |

### 1.4 Backend Tasks

| Task | Priority | Effort | Status |
|------|----------|--------|--------|
| Update Provider schema (services) | P0 | 30 min | ⬜ |
| Update Provider schema (team members) | P0 | 30 min | ⬜ |
| Add grouped services endpoint | P1 | 1 hr | ⬜ |
| Add team-service linking endpoint | P1 | 1 hr | ⬜ |
| Migration script for existing data | P1 | 1 hr | ⬜ |

---

## Part 2: Provider Portal Updates

### 2.1 Team-Service Linking UI

**Location:** Provider Portal → Edit Profile → Team Members tab

**New Feature:** When viewing/editing a team member, provider can select which services that team member can perform.

**UI Design:**
```
┌─────────────────────────────────────────────────────────────┐
│  Edit Team Member                                      [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Photo]  John Smith                                        │
│           Dental Hygienist                                  │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Services This Team Member Can Perform:                     │
│                                                             │
│  ☑ Dental Cleaning                                          │
│  ☑ Teeth Whitening                                          │
│  ☐ Root Canal                                               │
│  ☐ Tooth Extraction                                         │
│  ☑ Fluoride Treatment                                       │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [Cancel]                                    [Save Changes]  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Provider Portal Tasks

| Task | Priority | Effort | Status |
|------|----------|--------|--------|
| Add service selection to team member edit modal | P1 | 2 hrs | ⬜ |
| Add service selection to team member add modal | P1 | 1 hr | ⬜ |
| Display linked services on team member cards | P2 | 1 hr | ⬜ |
| Test and validate | P1 | 1 hr | ⬜ |

---

## Part 3: Flutter App Updates

### 3.1 Data Models

#### 3.1.1 Update ProviderModel

**File:** `lib/data/models/provider_model.dart`

```dart
class ProviderModel {
  // ... existing fields ...
  
  // ADD these fields:
  final List<TeamMemberModel> teamMembers;
  final Map<String, dynamic>? businessHours;
  final String? cancellationPolicy;
  
  // Update services to use new ServiceModel
  final List<ServiceModel> services;
}

class TeamMemberModel {
  final String id;
  final String name;
  final String? title;
  final String? credentials;
  final String? bio;
  final String? photo;
  final List<String> specialties;
  final int? yearsExperience;
  final double? rating;
  final int? reviewCount;
  final bool acceptsBookings;
  final List<String> serviceIds;  // Services this member can perform
  
  TeamMemberModel({...});
  factory TeamMemberModel.fromJson(Map<String, dynamic> json);
}
```

#### 3.1.2 Update ServiceModel

**File:** `lib/data/models/provider_model.dart`

```dart
class ServiceModel {
  final String id;
  final String name;
  final String? description;
  final String? shortDescription;
  final String? category;
  final double price;
  final double? basePrice;
  final int durationMinutes;
  final bool hasVariants;
  final List<ServiceVariant> variants;
  final bool isActive;
  final int sortOrder;
  
  ServiceModel({...});
  factory ServiceModel.fromJson(Map<String, dynamic> json);
  
  // Computed properties
  String get displayPrice => hasVariants 
      ? 'From \$${(basePrice ?? price).toStringAsFixed(0)}'
      : '\$${price.toStringAsFixed(0)}';
  
  String get formattedDuration => '$durationMinutes min';
  
  ServiceVariant? get defaultVariant => 
      variants.firstWhere((v) => v.isDefault, orElse: () => variants.first);
}

class ServiceVariant {
  final String id;
  final String name;
  final String? description;
  final double price;
  final int duration;
  final bool isDefault;
  
  ServiceVariant({...});
  factory ServiceVariant.fromJson(Map<String, dynamic> json);
  
  String get formattedPrice => '\$${price.toStringAsFixed(0)}';
  String get formattedDuration => '$duration min';
}
```

#### 3.1.3 Update BookingState

**File:** `lib/providers/booking_provider.dart`

```dart
class CreateBookingState {
  // Provider info
  final String? providerId;
  final String? providerName;
  final String? providerImage;
  final String? providerAddress;
  
  // Service info
  final String? serviceId;
  final String? serviceName;
  final String? serviceCategory;
  final double? servicePrice;
  final int? serviceDuration;
  final String? variantId;           // NEW: Selected variant ID
  final String? variantName;         // NEW: Selected variant name
  
  // Team member info
  final String? teamMemberId;        // NEW: null = "Any Available"
  final String? teamMemberName;      // NEW
  final String? teamMemberPhoto;     // NEW
  
  // Date/Time
  final DateTime? selectedDate;
  final String? selectedTime;
  final String? selectedEndTime;
  
  // Payment
  final String? paymentMethodId;     // NEW
  final String? paymentMethodLast4;  // NEW
  final String? paymentMethodBrand;  // NEW
  
  // Notes
  final String? notes;
  final String? promoCode;           // NEW
  
  // Status
  final bool isLoading;
  final String? error;
  final BookingModel? result;
  
  // Computed
  bool get hasService => serviceId != null;
  bool get hasDateTime => selectedDate != null && selectedTime != null;
  bool get hasPayment => paymentMethodId != null;
  bool get canProceedToTeam => hasService;
  bool get canProceedToDateTime => hasService;  // Team is optional
  bool get canProceedToReview => hasService && hasDateTime;
  bool get canConfirm => canProceedToReview && hasPayment;
  
  double get displayPrice => servicePrice ?? 0;
  int get displayDuration => serviceDuration ?? 0;
}
```

### 3.2 Screen Specifications

#### Screen 1: Provider Detail (Enhanced Services Section)

**Route:** `/provider/:id`  
**File:** `lib/presentation/screens/provider_detail/provider_detail_screen.dart`

**Changes:**
- Add horizontal category tabs above services
- Group services by category
- Service cards show: name, short description, "X options" if variants
- Tapping card opens Service Detail Sheet
- Tapping "Book" button opens Service Variant Sheet (if variants) or goes to Team Selection

**Components:**
- `ServiceCategoryTabs` - Horizontal scrolling tabs
- `ServiceCard` - Card with name, description, Book button
- `ServiceDetailSheet` - Bottom sheet with full description
- `ServiceVariantSheet` - Bottom sheet for variant selection

#### Screen 2: Service Detail Sheet (Bottom Sheet)

**Trigger:** Tap service card (not the Book button)

**Content:**
- Service name (large)
- Full description
- Duration
- Price or "From $X"
- Category badge
- [Book This Service] button

**Height:** 40% of screen, draggable to expand

#### Screen 3: Service Variant Sheet (Bottom Sheet)

**Trigger:** Tap "Book" on service with variants

**Content:**
- Service name
- Short description
- Radio list of variants:
  - Variant name
  - Duration
  - Price
- [Select] button

**Height:** Auto-fit content, max 60%

#### Screen 4: Select Professional

**Route:** `/provider/:id/team`  
**File:** `lib/presentation/screens/booking/select_professional_screen.dart`

**Content:**
- Header: "Select Professional"
- "Any Available" option (default, highlighted)
- Grid of team members (2 columns):
  - Circular photo
  - Name
  - Rating (stars + number)
- Only show team members who can perform selected service
- Bottom bar: `$30 · Standard Cleaning · 45min [Continue]`

**Logic:**
- Filter team members by `serviceIds.contains(selectedServiceId)`
- If no team members, skip this screen
- If only 1 team member, auto-select and skip

#### Screen 5: Select Date & Time

**Route:** `/provider/:id/schedule`  
**File:** `lib/presentation/screens/booking/datetime_selection_screen.dart`

**Content:**
- Header: "Book Appointment"
- Calendar widget (month view)
  - Dots under dates with availability
  - Grayed out past dates and unavailable dates
  - Selected date highlighted (teal)
- Time slots section:
  - "Morning" header + chips
  - "Afternoon" header + chips
  - "Evening" header + chips (if applicable)
- Bottom bar: `$30 · Standard Cleaning · 45min [Continue]`

**API Call:** `GET /api/availability/provider/:id?startDate=...&endDate=...&serviceDuration=...`

#### Screen 6: Review Summary

**Route:** `/provider/:id/review`  
**File:** `lib/presentation/screens/booking/review_summary_screen.dart`

**Content:**
- Header: "Review Summary"
- Provider card (image, name, location, rating)
- Details section:
  - Date & Hour: Jan 7, 2026 | 10:00 AM
  - Service: Standard Cleaning
  - Professional: Tommy (or "Any Available")
  - Duration: 45 minutes
- Price section:
  - Service name + price
  - Divider
  - Total
- Discount Code: [Add] link
- Payment Method: Card display + [Change] link
- Cancellation Policy: Summary + [View] link
- [Confirm Booking] button

**On Confirm:**
1. Show loading state
2. Call `POST /api/bookings`
3. On success → Show Success Modal
4. On error → Show inline error, keep form

#### Screen 7: Success Modal

**Type:** Modal overlay (not navigation)

**Content:**
- Teal checkmark with confetti dots
- "Congratulations!"
- "Appointment successfully booked."
- Confirmation code: FH-XXXXXX
- [Add to Calendar] button (teal outline)
- [View Appointment] button (teal outline)
- [Done] button (black filled)

**Actions:**
- Add to Calendar → Native calendar intent
- View Appointment → Navigate to `/booking/:id`
- Done → Navigate to Home

### 3.3 Component Library

| Component | Description | File |
|-----------|-------------|------|
| `ServiceCategoryTabs` | Horizontal scrolling category tabs | `widgets/service_category_tabs.dart` |
| `ServiceCard` | Service display card | `widgets/service_card.dart` |
| `ServiceDetailSheet` | Full service info bottom sheet | `widgets/service_detail_sheet.dart` |
| `ServiceVariantSheet` | Variant selection bottom sheet | `widgets/service_variant_sheet.dart` |
| `TeamMemberCard` | Team member grid item | `widgets/team_member_card.dart` |
| `AvailabilityCalendar` | Calendar with availability dots | `widgets/availability_calendar.dart` |
| `TimeSlotChips` | Time slot selection chips | `widgets/time_slot_chips.dart` |
| `BookingSummaryCard` | Provider info card for review | `widgets/booking_summary_card.dart` |
| `BookingBottomBar` | Sticky bottom bar with summary | `widgets/booking_bottom_bar.dart` |
| `PaymentMethodRow` | Payment method display/change | `widgets/payment_method_row.dart` |
| `SuccessModal` | Booking success overlay | `widgets/success_modal.dart` |

### 3.4 Flutter Tasks

| Task | Priority | Effort | Status |
|------|----------|--------|--------|
| **Data Models** | | | |
| Update ProviderModel with teamMembers | P0 | 1 hr | ⬜ |
| Update ServiceModel with variants | P0 | 1 hr | ⬜ |
| Create TeamMemberModel | P0 | 30 min | ⬜ |
| Create ServiceVariant model | P0 | 30 min | ⬜ |
| Extend CreateBookingState | P0 | 1 hr | ⬜ |
| Update CreateBookingNotifier | P0 | 1 hr | ⬜ |
| **Provider Detail Enhancements** | | | |
| ServiceCategoryTabs widget | P0 | 2 hrs | ⬜ |
| ServiceCard widget (updated) | P0 | 1 hr | ⬜ |
| ServiceDetailSheet | P1 | 2 hrs | ⬜ |
| ServiceVariantSheet | P0 | 2 hrs | ⬜ |
| Integrate into provider_detail_screen | P0 | 2 hrs | ⬜ |
| **New Booking Screens** | | | |
| SelectProfessionalScreen | P0 | 3 hrs | ⬜ |
| TeamMemberCard widget | P0 | 1 hr | ⬜ |
| Update DateTimeSelectionScreen | P0 | 3 hrs | ⬜ |
| AvailabilityCalendar widget | P0 | 3 hrs | ⬜ |
| TimeSlotChips widget | P0 | 1 hr | ⬜ |
| Update ReviewSummaryScreen | P0 | 3 hrs | ⬜ |
| BookingSummaryCard widget | P1 | 1 hr | ⬜ |
| PaymentMethodRow widget | P1 | 1 hr | ⬜ |
| SuccessModal | P0 | 2 hrs | ⬜ |
| **Bottom Bar** | | | |
| BookingBottomBar widget | P0 | 2 hrs | ⬜ |
| Integrate across all screens | P0 | 1 hr | ⬜ |
| **Navigation** | | | |
| Add /provider/:id/team route | P0 | 30 min | ⬜ |
| Update route extras for state passing | P0 | 1 hr | ⬜ |
| **API Integration** | | | |
| Connect to availability API | P0 | 2 hrs | ⬜ |
| Connect to booking creation API | P0 | 2 hrs | ⬜ |
| Connect to payment methods API | P1 | 2 hrs | ⬜ |
| **Testing** | | | |
| Unit tests for booking state | P1 | 2 hrs | ⬜ |
| Widget tests for components | P2 | 3 hrs | ⬜ |
| End-to-end flow testing | P1 | 2 hrs | ⬜ |

---

## Part 4: File Structure

### Backend
```
backend/
├── models/
│   └── Provider.js          # UPDATE: services & teamMembers schema
├── routes/
│   ├── providers.js         # UPDATE: grouped services endpoint
│   └── admin.js             # UPDATE: team-service linking
```

### Provider Portal
```
provider-portal/src/
├── components/
│   └── team/
│       └── TeamMemberModal.jsx    # UPDATE: add service selection
```

### Flutter App
```
lib/
├── data/
│   └── models/
│       ├── provider_model.dart    # UPDATE: full rewrite
│       └── booking_model.dart     # Keep as-is
├── providers/
│   └── booking_provider.dart      # UPDATE: extend state
├── presentation/
│   ├── screens/
│   │   ├── provider_detail/
│   │   │   └── provider_detail_screen.dart  # UPDATE
│   │   └── booking/
│   │       ├── select_professional_screen.dart   # NEW
│   │       ├── datetime_selection_screen.dart    # UPDATE
│   │       ├── review_summary_screen.dart        # UPDATE
│   │       └── booking_confirmation_screen.dart  # Keep
│   └── widgets/
│       └── booking/
│           ├── service_category_tabs.dart    # NEW
│           ├── service_card.dart             # NEW
│           ├── service_detail_sheet.dart     # NEW
│           ├── service_variant_sheet.dart    # NEW
│           ├── team_member_card.dart         # NEW
│           ├── availability_calendar.dart    # NEW
│           ├── time_slot_chips.dart          # NEW
│           ├── booking_summary_card.dart     # NEW
│           ├── booking_bottom_bar.dart       # NEW
│           ├── payment_method_row.dart       # NEW
│           └── success_modal.dart            # NEW
├── services/
│   ├── booking_service.dart      # Already created (Dio)
│   ├── payment_service.dart      # Already created (Dio)
│   └── review_service.dart       # Already created (Dio)
```

---

## Part 5: Implementation Order

### Phase 1: Backend Foundation (Day 1)
1. ⬜ Update Provider.js schema (services + team members)
2. ⬜ Add grouped services endpoint
3. ⬜ Add team-service linking endpoint
4. ⬜ Deploy to Railway
5. ⬜ Test endpoints with curl/Postman

### Phase 2: Provider Portal (Day 1-2)
6. ⬜ Add service checkboxes to TeamMemberModal
7. ⬜ Wire up to new API endpoint
8. ⬜ Test: Add team member → Select services → Save
9. ⬜ Deploy to Vercel

### Phase 3: Flutter Data Layer (Day 2)
10. ⬜ Rewrite provider_model.dart with TeamMemberModel
11. ⬜ Update ServiceModel with variants
12. ⬜ Extend CreateBookingState
13. ⬜ Update CreateBookingNotifier with new methods
14. ⬜ Test: Fetch provider, verify models parse correctly

### Phase 4: Flutter Provider Detail (Day 2-3)
15. ⬜ Create ServiceCategoryTabs widget
16. ⬜ Create ServiceCard widget
17. ⬜ Create ServiceDetailSheet
18. ⬜ Create ServiceVariantSheet
19. ⬜ Update provider_detail_screen.dart
20. ⬜ Test: View provider → See categories → Tap service → See details

### Phase 5: Flutter Booking Screens (Day 3-4)
21. ⬜ Create TeamMemberCard widget
22. ⬜ Create SelectProfessionalScreen
23. ⬜ Create BookingBottomBar widget
24. ⬜ Create AvailabilityCalendar widget
25. ⬜ Create TimeSlotChips widget
26. ⬜ Update DateTimeSelectionScreen
27. ⬜ Create BookingSummaryCard widget
28. ⬜ Create PaymentMethodRow widget
29. ⬜ Update ReviewSummaryScreen
30. ⬜ Create SuccessModal
31. ⬜ Add navigation routes

### Phase 6: Integration & Testing (Day 4-5)
32. ⬜ Connect all screens to BookingState
33. ⬜ Connect to availability API
34. ⬜ Connect to booking creation API
35. ⬜ Test full flow: Provider → Service → Team → DateTime → Review → Confirm
36. ⬜ Edge case testing (no team, no variants, etc.)
37. ⬜ Build iOS and test on device

---

## Part 6: Acceptance Criteria

### Must Work
- [ ] User can browse services by category tabs
- [ ] User can tap service to see full details
- [ ] User can select service variant (if applicable)
- [ ] User can select team member (or "Any Available")
- [ ] User can pick date from calendar with availability indicators
- [ ] User can pick time slot
- [ ] User can review booking summary
- [ ] User can select/add payment method
- [ ] User can confirm booking
- [ ] User sees success modal with confirmation code
- [ ] Booking appears in "My Bookings"

### Edge Cases Handled
- [ ] Provider with no team members → Skip team selection
- [ ] Service with no variants → Go directly to team/datetime
- [ ] No availability for selected date → Show "No slots" message
- [ ] Payment declined → Show error, keep form state
- [ ] Network error → Show retry option

---

## Part 7: Dependencies

### Existing (Already Integrated)
- `flutter_stripe: ^11.5.0` - Payment UI
- `dio: ^5.4.0` - HTTP client
- `flutter_riverpod: ^2.6.1` - State management
- `go_router: ^17.0.1` - Navigation
- `cached_network_image` - Image loading

### May Need to Add
- `table_calendar` or custom calendar widget
- None expected

---

## Summary

| Area | Tasks | Effort |
|------|-------|--------|
| Backend | 5 tasks | ~4 hours |
| Provider Portal | 4 tasks | ~5 hours |
| Flutter Data | 6 tasks | ~5 hours |
| Flutter UI | 25 tasks | ~35 hours |
| Testing | 3 tasks | ~7 hours |
| **Total** | **43 tasks** | **~56 hours** |

---

*Plan Version 1.0 - Ready for Implementation*
