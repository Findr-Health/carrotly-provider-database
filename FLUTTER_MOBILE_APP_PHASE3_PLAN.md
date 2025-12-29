# Findr Health - Flutter Mobile App Development
## Phase 3: User-Facing Mobile Application

**Document Created:** December 28, 2025  
**Purpose:** Complete handoff for Flutter mobile app development  
**Prerequisite:** Phase 2 Complete (Clarity AI Platform)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Existing Infrastructure](#2-existing-infrastructure)
3. [Flutter MVP Requirements](#3-flutter-mvp-requirements)
4. [API Specifications](#4-api-specifications)
5. [Data Models](#5-data-models)
6. [Technical Architecture](#6-technical-architecture)
7. [Development Plan](#7-development-plan)
8. [Screen-by-Screen Specifications](#8-screen-by-screen-specifications)
9. [Integration Points](#9-integration-points)
10. [Developer Codebase Coordination](#10-developer-codebase-coordination)

---

## 1. Project Overview

### What We're Building

A mobile-first healthcare marketplace app that enables users to:
- Discover and search healthcare/wellness providers
- View provider profiles, services, and pricing
- Book appointments with real-time availability
- Process payments via Stripe
- Chat with Clarity AI for healthcare cost guidance
- Upload and analyze medical documents
- Track bookings and manage their profile

### Platform Strategy

| Component | Platform | Technology | Status |
|-----------|----------|------------|--------|
| User Mobile App | iOS + Android | Flutter | 🔄 Starting |
| Admin Dashboard | Web | React | ✅ Built |
| Provider Onboarding | Web | React | ✅ Built |
| Provider Dashboard | Web | React | 🔄 In Progress |
| AI Backend (Clarity) | API | Node.js/Express | ✅ Built |
| Main Backend | API | Django | ✅ Built (by developers) |

### Timeline

**Target:** 4 weeks to functional MVP with all features

| Week | Focus |
|------|-------|
| 1 | Foundation: Auth, Navigation, API Layer, Core Models |
| 2 | Discovery: Home, Search, Provider Details, Categories |
| 3 | Transactions: Booking Flow, Payments, Confirmations |
| 4 | AI + Polish: Clarity Chat, Documents, Testing, Bug Fixes |

---

## 2. Existing Infrastructure

### 2.1 Clarity AI Backend (Node.js/Express)

**Base URL:** `https://fearless-achievement-production.up.railway.app`

**What's Built:**
- ✅ AI Chat with conversation history
- ✅ Healthcare Financial Risk Calculator
- ✅ Document Analysis (bills, EOBs, lab results)
- ✅ Geolocation-aware responses
- ✅ User feedback system
- ✅ Research assistance with industry benchmarks

**Database:** MongoDB (Railway)

### 2.2 Django Backend (Developer Built)

**What's Built:**
- ✅ User authentication (Firebase tokens + Django)
- ✅ Provider database and profiles
- ✅ Service catalog
- ✅ Booking system
- ✅ Payment processing (Stripe)
- ✅ Review system

**Database:** PostgreSQL

### 2.3 Web Applications

| App | URL | Purpose |
|-----|-----|---------|
| Clarity Consumer | https://clarity.findrhealth.com | AI chat (React) |
| Admin Dashboard | https://admin.findrhealth.com | Admin tools (React) |
| Provider Onboarding | [Vercel URL] | Provider signup (React) |

---

## 3. Flutter MVP Requirements

### 3.1 Must-Have Features (Day 1)

#### Authentication & Profile
- [ ] Firebase Authentication (Google, Apple, Email)
- [ ] Django token exchange
- [ ] User profile creation/editing
- [ ] Profile photo upload
- [ ] Account settings
- [ ] Logout

#### Discovery & Search
- [ ] Home screen with featured providers
- [ ] Category browsing (Medical, Dental, Vision, Wellness, etc.)
- [ ] Search with filters (location, service type, price range)
- [ ] Search results list
- [ ] Map view of providers
- [ ] Provider detail screen
- [ ] Service list per provider
- [ ] Pricing display
- [ ] Provider photos/gallery
- [ ] Operating hours

#### Booking & Payments
- [ ] Service selection
- [ ] Date/time picker with availability
- [ ] Booking summary/review
- [ ] Stripe payment integration
- [ ] Payment confirmation
- [ ] Booking confirmation screen
- [ ] Email/SMS confirmation trigger

#### My Bookings
- [ ] Upcoming bookings list
- [ ] Past bookings list
- [ ] Booking detail view
- [ ] Cancel booking
- [ ] Reschedule booking
- [ ] Add to calendar

#### Clarity AI Integration
- [ ] Chat interface
- [ ] Message history
- [ ] Calculator flow
- [ ] Document upload
- [ ] Document analysis display
- [ ] Feedback buttons (thumbs up/down, copy, retry)

#### Reviews & Ratings
- [ ] View provider reviews
- [ ] Submit review after booking
- [ ] Star rating
- [ ] Review photos

#### Favorites
- [ ] Save/unsave providers
- [ ] Favorites list screen

#### Notifications
- [ ] Push notification setup (Firebase)
- [ ] Booking reminders
- [ ] Booking confirmations
- [ ] Promotional notifications

---

## 4. API Specifications

### 4.1 Clarity AI API (Node.js Backend)

**Base URL:** `https://fearless-achievement-production.up.railway.app`

#### Chat Endpoint

```
POST /api/clarity/chat
Content-Type: application/json

Request:
{
  "message": "string",
  "history": [
    {"role": "user", "content": "string"},
    {"role": "assistant", "content": "string"}
  ],
  "location": {
    "city": "string",
    "state": "string",
    "zip": "string"
  }
}

Response:
{
  "success": true,
  "message": "AI response text...",
  "triggers": {
    "calculatorMode": false,
    "documentAnalysis": false,
    "locationNeeded": false
  }
}
```

#### Document Analysis Endpoint

```
POST /api/clarity/analyze
Content-Type: multipart/form-data

Request:
- file: File (image/pdf)
- documentType: "bill" | "eob" | "lab" | "prescription" | "other"

Response:
{
  "success": true,
  "analysis": "Detailed analysis text...",
  "documentType": "detected type",
  "extractedData": {
    "totalAmount": 1234.56,
    "provider": "string",
    "date": "string",
    "lineItems": [...]
  }
}
```

#### Feedback Endpoint

```
POST /api/feedback
Content-Type: application/json

Request:
{
  "messageId": "string",
  "rating": "positive" | "negative",
  "aiResponse": "string",
  "userPrompt": "string",
  "sessionId": "string",
  "interactionType": "chat" | "document_analysis" | "calculator"
}

Response:
{
  "success": true,
  "message": "Feedback submitted successfully"
}
```

### 4.2 Django API (Main Backend)

**Base URL:** [Get from developers]

**Authentication Pattern:**
```
1. User signs in with Firebase
2. Get Firebase ID token
3. Exchange for Django token: POST /api/auth/firebase-token/
4. Use Django token for all subsequent requests
   Header: Authorization: Token <django_token>
```

#### Expected Endpoints (Confirm with developers)

```
# Authentication
POST   /api/auth/firebase-token/     # Exchange Firebase token
POST   /api/auth/logout/             # Logout

# User Profile
GET    /api/users/me/                # Get current user
PUT    /api/users/me/                # Update profile
POST   /api/users/me/photo/          # Upload photo

# Providers
GET    /api/providers/               # List providers (with filters)
GET    /api/providers/{id}/          # Provider detail
GET    /api/providers/{id}/services/ # Provider services
GET    /api/providers/{id}/reviews/  # Provider reviews
GET    /api/providers/{id}/availability/ # Available slots

# Categories
GET    /api/categories/              # List categories

# Bookings
GET    /api/bookings/                # My bookings
POST   /api/bookings/                # Create booking
GET    /api/bookings/{id}/           # Booking detail
PUT    /api/bookings/{id}/           # Update booking
DELETE /api/bookings/{id}/           # Cancel booking

# Payments
POST   /api/payments/create-intent/  # Create Stripe PaymentIntent
POST   /api/payments/confirm/        # Confirm payment

# Reviews
POST   /api/reviews/                 # Submit review
GET    /api/reviews/pending/         # Reviews I need to write

# Favorites
GET    /api/favorites/               # My favorites
POST   /api/favorites/               # Add favorite
DELETE /api/favorites/{id}/          # Remove favorite

# Notifications
GET    /api/notifications/           # My notifications
POST   /api/devices/                 # Register push token
```

---

## 5. Data Models

### 5.1 Clarity Models (For AI Features)

```dart
// lib/models/clarity/chat_message.dart
class ChatMessage {
  final String id;
  final String role; // 'user' | 'assistant'
  final String content;
  final DateTime timestamp;
  final ChatTriggers? triggers;
  final CalculatorAssessment? calculatorData;
  final bool isError;
  final bool isRetry;

  ChatMessage({
    required this.id,
    required this.role,
    required this.content,
    required this.timestamp,
    this.triggers,
    this.calculatorData,
    this.isError = false,
    this.isRetry = false,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json);
  Map<String, dynamic> toJson();
}

// lib/models/clarity/chat_triggers.dart
class ChatTriggers {
  final bool calculatorMode;
  final bool documentAnalysis;
  final bool locationNeeded;

  ChatTriggers({
    this.calculatorMode = false,
    this.documentAnalysis = false,
    this.locationNeeded = false,
  });

  factory ChatTriggers.fromJson(Map<String, dynamic> json);
}

// lib/models/clarity/calculator_assessment.dart
class CalculatorAssessment {
  final ProfileData profile;
  final CostComparison costs;
  final Map<String, PremiumOption> premiums;
  final RiskProbabilities probabilities;
  final String recommendation;
  final String? recommendedPlan;
  final String reasoning;
  final List<String> keyFactors;
  final List<CatastrophicExample> catastrophicExamples;

  // ... constructor, fromJson, toJson
}

class ProfileData {
  final int age;
  final String sex;
  final String state;
  final int? income;
  final List<String> conditions;
  final List<String> medications;
  final List<String> riskFactors;
  final String riskLevel;
}

class CostComparison {
  final YearCosts year1;
  final YearCosts year3;
}

class YearCosts {
  final int cashExpected;
  final int cashWorstCase;
  final int insuranceExpected;
  final int insuranceMax;
}

class PremiumOption {
  final int full;
  final int subsidy;
  final int net;
  final int deductible;
  final int oopMax;
}

class RiskProbabilities {
  final int majorExpense1yr;
  final int majorExpense3yr;
  final int catastrophic1yr;
  final int catastrophic3yr;
}

class CatastrophicExample {
  final String event;
  final String cost;
}

// lib/models/clarity/document_analysis.dart
class DocumentAnalysis {
  final String analysis;
  final String documentType;
  final ExtractedData? extractedData;
}

class ExtractedData {
  final double? totalAmount;
  final String? provider;
  final String? date;
  final List<LineItem>? lineItems;
}

// lib/models/clarity/feedback_request.dart
class FeedbackRequest {
  final String messageId;
  final String rating; // 'positive' | 'negative'
  final String aiResponse;
  final String? userPrompt;
  final String? sessionId;
  final String interactionType;

  Map<String, dynamic> toJson();
}
```

### 5.2 Core App Models (For Django Backend)

```dart
// lib/models/user.dart
class User {
  final String id;
  final String email;
  final String? firstName;
  final String? lastName;
  final String? phone;
  final String? photoUrl;
  final DateTime createdAt;

  String get fullName => '$firstName $lastName'.trim();
}

// lib/models/provider.dart
class Provider {
  final String id;
  final String name;
  final String? description;
  final String category;
  final String? photoUrl;
  final List<String> galleryUrls;
  final Location location;
  final double rating;
  final int reviewCount;
  final List<String> certifications;
  final OperatingHours hours;
  final bool isVerified;
}

class Location {
  final String address;
  final String city;
  final String state;
  final String zip;
  final double latitude;
  final double longitude;
}

class OperatingHours {
  final Map<String, DayHours> schedule;
}

class DayHours {
  final String? open;
  final String? close;
  final bool isClosed;
}

// lib/models/service.dart
class Service {
  final String id;
  final String providerId;
  final String name;
  final String? description;
  final double price;
  final int durationMinutes;
  final String category;
}

// lib/models/booking.dart
class Booking {
  final String id;
  final String providerId;
  final String serviceId;
  final String userId;
  final DateTime appointmentTime;
  final int durationMinutes;
  final double price;
  final String status; // 'pending' | 'confirmed' | 'completed' | 'cancelled'
  final DateTime createdAt;
  final Provider? provider;
  final Service? service;
}

// lib/models/review.dart
class Review {
  final String id;
  final String providerId;
  final String userId;
  final String? bookingId;
  final int rating;
  final String? comment;
  final List<String>? photoUrls;
  final DateTime createdAt;
  final User? user;
}

// lib/models/category.dart
class Category {
  final String id;
  final String name;
  final String? iconName;
  final String? imageUrl;
  final int providerCount;
}
```

---

## 6. Technical Architecture

### 6.1 Flutter Project Structure

```
lib/
├── main.dart
├── app.dart
│
├── config/
│   ├── constants.dart
│   ├── theme.dart
│   ├── routes.dart
│   └── environment.dart
│
├── models/
│   ├── user.dart
│   ├── provider.dart
│   ├── service.dart
│   ├── booking.dart
│   ├── review.dart
│   ├── category.dart
│   └── clarity/
│       ├── chat_message.dart
│       ├── chat_triggers.dart
│       ├── calculator_assessment.dart
│       ├── document_analysis.dart
│       └── feedback_request.dart
│
├── services/
│   ├── api/
│   │   ├── api_client.dart
│   │   ├── auth_api.dart
│   │   ├── provider_api.dart
│   │   ├── booking_api.dart
│   │   ├── review_api.dart
│   │   └── clarity_api.dart
│   ├── auth_service.dart
│   ├── storage_service.dart
│   ├── location_service.dart
│   ├── notification_service.dart
│   └── payment_service.dart
│
├── providers/  (or state/ if using different state management)
│   ├── auth_provider.dart
│   ├── user_provider.dart
│   ├── search_provider.dart
│   ├── booking_provider.dart
│   ├── favorites_provider.dart
│   └── clarity_provider.dart
│
├── screens/
│   ├── splash/
│   ├── auth/
│   │   ├── login_screen.dart
│   │   ├── register_screen.dart
│   │   └── forgot_password_screen.dart
│   ├── home/
│   │   ├── home_screen.dart
│   │   └── widgets/
│   ├── search/
│   │   ├── search_screen.dart
│   │   ├── search_results_screen.dart
│   │   └── widgets/
│   ├── provider/
│   │   ├── provider_detail_screen.dart
│   │   ├── provider_reviews_screen.dart
│   │   └── widgets/
│   ├── booking/
│   │   ├── service_selection_screen.dart
│   │   ├── datetime_selection_screen.dart
│   │   ├── booking_summary_screen.dart
│   │   ├── payment_screen.dart
│   │   └── confirmation_screen.dart
│   ├── bookings/
│   │   ├── my_bookings_screen.dart
│   │   ├── booking_detail_screen.dart
│   │   └── widgets/
│   ├── clarity/
│   │   ├── clarity_chat_screen.dart
│   │   ├── document_upload_screen.dart
│   │   └── widgets/
│   │       ├── chat_bubble.dart
│   │       ├── calculator_results_card.dart
│   │       ├── document_analysis_card.dart
│   │       └── feedback_buttons.dart
│   ├── favorites/
│   │   └── favorites_screen.dart
│   ├── profile/
│   │   ├── profile_screen.dart
│   │   ├── edit_profile_screen.dart
│   │   └── settings_screen.dart
│   └── reviews/
│       └── write_review_screen.dart
│
├── widgets/
│   ├── common/
│   │   ├── loading_indicator.dart
│   │   ├── error_widget.dart
│   │   ├── empty_state.dart
│   │   └── custom_button.dart
│   ├── provider_card.dart
│   ├── service_card.dart
│   ├── booking_card.dart
│   ├── review_card.dart
│   └── category_chip.dart
│
└── utils/
    ├── validators.dart
    ├── formatters.dart
    ├── date_utils.dart
    └── extensions.dart
```

### 6.2 State Management

**Recommended:** Provider (simple) or Riverpod (more scalable)

**Confirm with developer codebase** before implementing.

### 6.3 Dependencies (pubspec.yaml)

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # State Management (confirm with developers)
  provider: ^6.0.0
  # OR riverpod: ^2.0.0
  
  # Networking
  http: ^1.1.0
  dio: ^5.0.0
  
  # Firebase
  firebase_core: ^2.24.0
  firebase_auth: ^4.16.0
  firebase_messaging: ^14.7.0
  
  # Payments
  flutter_stripe: ^10.0.0
  
  # Storage
  shared_preferences: ^2.2.0
  flutter_secure_storage: ^9.0.0
  
  # Image Handling
  image_picker: ^1.0.0
  cached_network_image: ^3.3.0
  
  # Location
  geolocator: ^10.0.0
  geocoding: ^2.1.0
  
  # UI Components
  flutter_svg: ^2.0.0
  shimmer: ^3.0.0
  
  # Utils
  intl: ^0.18.0
  url_launcher: ^6.2.0
  
  # File Handling (for document upload)
  file_picker: ^6.0.0
  
  # Maps (optional)
  google_maps_flutter: ^2.5.0
```

---

## 7. Development Plan

### Week 1: Foundation (Days 1-7)

#### Day 1-2: Project Setup
- [ ] Create Flutter project
- [ ] Configure folder structure
- [ ] Add dependencies to pubspec.yaml
- [ ] Setup Firebase project
- [ ] Configure environment variables
- [ ] Setup theme and constants

#### Day 3-4: API Layer
- [ ] Create API client with interceptors
- [ ] Implement auth token handling
- [ ] Create ClarityService (all endpoints)
- [ ] Create Django API services (stubs)
- [ ] Test API connections

#### Day 5-6: Models
- [ ] Create all Clarity models
- [ ] Create all core app models
- [ ] Add JSON serialization
- [ ] Write unit tests for models

#### Day 7: Auth Flow
- [ ] Firebase Auth setup
- [ ] Login screen UI
- [ ] Register screen UI
- [ ] Firebase → Django token exchange
- [ ] Auth state management
- [ ] Protected route handling

### Week 2: Discovery (Days 8-14)

#### Day 8-9: Navigation & Home
- [ ] Bottom navigation setup
- [ ] Home screen layout
- [ ] Featured providers section
- [ ] Categories grid
- [ ] Home screen API integration

#### Day 10-11: Search
- [ ] Search screen UI
- [ ] Search bar with filters
- [ ] Filter bottom sheet
- [ ] Search results list
- [ ] Provider card widget
- [ ] Search API integration

#### Day 12-13: Provider Detail
- [ ] Provider detail screen
- [ ] Photo gallery
- [ ] Services list
- [ ] Reviews preview
- [ ] Operating hours
- [ ] Location/map
- [ ] "Book Now" button

#### Day 14: Categories & Polish
- [ ] Category browsing screen
- [ ] Category-filtered results
- [ ] Loading states
- [ ] Error handling
- [ ] Empty states

### Week 3: Transactions (Days 15-21)

#### Day 15-16: Booking Flow
- [ ] Service selection screen
- [ ] Date/time picker
- [ ] Availability API integration
- [ ] Time slot selection
- [ ] Booking summary screen

#### Day 17-18: Payments
- [ ] Stripe SDK setup
- [ ] Payment screen UI
- [ ] Create PaymentIntent
- [ ] Process payment
- [ ] Handle success/failure
- [ ] Confirmation screen

#### Day 19-20: My Bookings
- [ ] My bookings list screen
- [ ] Upcoming vs Past tabs
- [ ] Booking card widget
- [ ] Booking detail screen
- [ ] Cancel booking flow
- [ ] Reschedule flow (if time)

#### Day 21: Reviews & Favorites
- [ ] Reviews list on provider
- [ ] Write review screen
- [ ] Star rating input
- [ ] Favorite/unfavorite toggle
- [ ] Favorites screen

### Week 4: AI & Polish (Days 22-28)

#### Day 22-23: Clarity Chat
- [ ] Chat screen UI
- [ ] Message list
- [ ] Chat bubble widget
- [ ] Text input with send
- [ ] API integration
- [ ] Conversation history

#### Day 24-25: Clarity Features
- [ ] Calculator results card
- [ ] Document upload flow
- [ ] Document analysis display
- [ ] Feedback buttons
- [ ] Loading/typing indicator

#### Day 26-27: Notifications & Profile
- [ ] Push notification setup
- [ ] Notification permissions
- [ ] FCM token registration
- [ ] Profile screen
- [ ] Edit profile screen
- [ ] Settings screen

#### Day 28: Testing & Polish
- [ ] End-to-end testing
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] UI polish
- [ ] App store assets prep

---

## 8. Screen-by-Screen Specifications

### 8.1 Authentication Screens

#### Login Screen
```
┌─────────────────────────────┐
│                             │
│         [Logo]              │
│                             │
│   Welcome to Findr Health   │
│                             │
│  ┌───────────────────────┐  │
│  │ Email                 │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Password          👁  │  │
│  └───────────────────────┘  │
│                             │
│  [      Sign In        ]    │
│                             │
│        Forgot Password?     │
│                             │
│  ─────── or continue ────── │
│                             │
│  [G] Google   [🍎] Apple    │
│                             │
│  Don't have an account?     │
│        Sign Up              │
│                             │
└─────────────────────────────┘
```

#### Registration Screen
```
┌─────────────────────────────┐
│  ←  Create Account          │
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │ First Name            │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Last Name             │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Email                 │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Phone                 │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Password          👁  │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Confirm Password  👁  │  │
│  └───────────────────────┘  │
│                             │
│  ☐ I agree to Terms &       │
│    Privacy Policy           │
│                             │
│  [    Create Account    ]   │
│                             │
└─────────────────────────────┘
```

### 8.2 Home Screen

```
┌─────────────────────────────┐
│  📍 Davis, CA      [🔔][👤] │
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │ 🔍 Search providers   │  │
│  └───────────────────────┘  │
│                             │
│  Categories                 │
│  ┌─────┐┌─────┐┌─────┐      │
│  │ 🏥  ││ 🦷  ││ 👁  │      │
│  │Med- ││Dent-││Vis- │      │
│  │ical ││ al  ││ion  │      │
│  └─────┘└─────┘└─────┘      │
│  ┌─────┐┌─────┐┌─────┐      │
│  │ 💆  ││ 💪  ││ 🧠  │      │
│  │Well-││Fit- ││Ment-│      │
│  │ness ││ness ││al   │      │
│  └─────┘└─────┘└─────┘      │
│                             │
│  Featured Providers         │
│  ┌─────────────────────────┐│
│  │ [img] Dr. Smith Family  ││
│  │       ⭐ 4.8 (124)      ││
│  │       Davis, CA         ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ [img] Smile Dental      ││
│  │       ⭐ 4.9 (89)       ││
│  │       Sacramento, CA    ││
│  └─────────────────────────┘│
│                             │
├─────────────────────────────┤
│  🏠    🔍    💬    ❤️    👤  │
│ Home Search Clarity Fav Profile│
└─────────────────────────────┘
```

### 8.3 Provider Detail Screen

```
┌─────────────────────────────┐
│  ←                     ❤️   │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │    [Provider Photo]     │ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│  Smile Dental Clinic        │
│  ⭐ 4.9 (89 reviews)        │
│  📍 123 Main St, Davis CA   │
│  🕐 Open until 6:00 PM      │
│                             │
│  ─────────────────────────  │
│  Services                   │
│  ┌─────────────────────────┐│
│  │ Teeth Cleaning    $99   ││
│  │ 30 min                  ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ Whitening        $299   ││
│  │ 60 min                  ││
│  └─────────────────────────┘│
│                             │
│  Reviews                    │
│  ┌─────────────────────────┐│
│  │ ⭐⭐⭐⭐⭐ John D.      ││
│  │ "Great experience..."   ││
│  └─────────────────────────┘│
│  [See all 89 reviews →]     │
│                             │
│  ┌─────────────────────────┐│
│  │     [Book Now]          ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

### 8.4 Booking Flow

```
Step 1: Service Selection
┌─────────────────────────────┐
│  ← Select Service           │
├─────────────────────────────┤
│                             │
│  Smile Dental Clinic        │
│                             │
│  ○ Teeth Cleaning    $99    │
│    30 minutes               │
│                             │
│  ● Whitening        $299    │
│    60 minutes               │
│                             │
│  ○ Deep Cleaning    $199    │
│    45 minutes               │
│                             │
│                             │
│                             │
│  ┌─────────────────────────┐│
│  │   [Continue - $299]     ││
│  └─────────────────────────┘│
└─────────────────────────────┘

Step 2: Date/Time
┌─────────────────────────────┐
│  ← Select Date & Time       │
├─────────────────────────────┤
│                             │
│  December 2025              │
│  Su Mo Tu We Th Fr Sa       │
│     1  2  3  4  5  6        │
│   7  8  9 10 11 12 13       │
│  14 15 16 17 18 19 20       │
│  21 22 23 24 25 26 27       │
│  28[29]30 31                │
│                             │
│  Available Times            │
│  ┌────┐┌────┐┌────┐┌────┐   │
│  │9:00││9:30││10:00│10:30│  │
│  └────┘└────┘└────┘└────┘   │
│  ┌────┐┌────┐┌────┐┌────┐   │
│  │11:00│11:30│[2:00]│2:30│  │
│  └────┘└────┘└────┘└────┘   │
│                             │
│  ┌─────────────────────────┐│
│  │      [Continue]         ││
│  └─────────────────────────┘│
└─────────────────────────────┘

Step 3: Summary
┌─────────────────────────────┐
│  ← Booking Summary          │
├─────────────────────────────┤
│                             │
│  ┌─────────────────────────┐│
│  │ Smile Dental Clinic     ││
│  │ Whitening               ││
│  │ Dec 29, 2025 at 2:00 PM ││
│  │ 60 minutes              ││
│  └─────────────────────────┘│
│                             │
│  ─────────────────────────  │
│  Price Details              │
│                             │
│  Whitening            $299  │
│  Service Fee           $15  │
│  ─────────────────────────  │
│  Total                $314  │
│                             │
│  ─────────────────────────  │
│  Cancellation Policy        │
│  Free cancellation up to    │
│  24 hours before appt.      │
│                             │
│  ┌─────────────────────────┐│
│  │  [Proceed to Payment]   ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

### 8.5 Clarity Chat Screen

```
┌─────────────────────────────┐
│  ← Clarity AI          [📎] │
├─────────────────────────────┤
│                             │
│         [Findr Logo]        │
│                             │
│  Hi! I'm Clarity, your      │
│  healthcare cost guide.     │
│  How can I help?            │
│                             │
│  ┌────────────────────────┐ │
│  │How much should an MRI  │ │
│  │cost?                   │ │
│  └────────────────────────┘ │
│                             │
│  ┌────────────────────────┐ │
│  │MRI costs vary by       │ │
│  │location and facility:  │ │
│  │                        │ │
│  │• Hospital: $2,000-4,000│ │
│  │• Imaging center: $400- │ │
│  │  $800                  │ │
│  │                        │ │
│  │Always ask for imaging  │ │
│  │center referral...      │ │
│  │                        │ │
│  │  [📋] [👍] [👎] [🔄]  │ │
│  └────────────────────────┘ │
│                             │
│                             │
├─────────────────────────────┤
│ [+] │ Ask anything...    │🎤│
└─────────────────────────────┘
```

---

## 9. Integration Points

### 9.1 Firebase Configuration

```dart
// lib/config/firebase_options.dart
// Generate using FlutterFire CLI:
// flutterfire configure
```

### 9.2 Stripe Configuration

```dart
// lib/services/payment_service.dart
import 'package:flutter_stripe/flutter_stripe.dart';

class PaymentService {
  static Future<void> init() async {
    Stripe.publishableKey = 'pk_live_xxx'; // From env
  }
  
  static Future<bool> processPayment({
    required String clientSecret,
    required String bookingId,
  }) async {
    // Create payment method
    // Confirm payment
    // Handle 3D Secure if needed
  }
}
```

### 9.3 Clarity Integration

```dart
// lib/services/api/clarity_api.dart
class ClarityApi {
  static const baseUrl = 'https://fearless-achievement-production.up.railway.app';
  
  final Dio _dio;
  
  ClarityApi(this._dio);
  
  Future<ChatResponse> sendMessage(String message, List<ChatMessage> history) async {
    final response = await _dio.post(
      '$baseUrl/api/clarity/chat',
      data: {
        'message': message,
        'history': history.map((m) => m.toJson()).toList(),
      },
    );
    return ChatResponse.fromJson(response.data);
  }
  
  Future<DocumentAnalysis> analyzeDocument(File file) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(file.path),
    });
    final response = await _dio.post(
      '$baseUrl/api/clarity/analyze',
      data: formData,
    );
    return DocumentAnalysis.fromJson(response.data);
  }
  
  Future<void> submitFeedback(FeedbackRequest feedback) async {
    await _dio.post(
      '$baseUrl/api/feedback',
      data: feedback.toJson(),
    );
  }
}
```

---

## 10. Developer Codebase Coordination

### 10.1 Questions for Developers

Before starting, get answers to:

```
1. Repository access URL?
2. State management choice? (Provider / Riverpod / Bloc)
3. Current authentication status?
4. API base URL for Django backend?
5. Full endpoint documentation?
6. Stripe account credentials?
7. Firebase project details?
8. Design system / component library used?
9. Any existing reusable widgets?
10. Deployment pipeline setup?
```

### 10.2 Integration Checklist

When codebase is received:

- [ ] Clone and run locally
- [ ] Review folder structure
- [ ] Identify state management pattern
- [ ] Review existing API services
- [ ] Check auth flow implementation
- [ ] List completed screens
- [ ] List incomplete screens
- [ ] Identify integration points for our work
- [ ] Plan merge strategy

### 10.3 Parallel Development Strategy

**Safe to build now (won't conflict):**
- Clarity API service
- Clarity data models  
- Clarity chat widgets (self-contained)
- Calculator results widget
- Document analysis widget
- Feedback buttons widget

**Wait for codebase:**
- Navigation structure
- Global state setup
- Theme/styling
- Core app screens
- Auth flow integration

---

## Appendix A: Environment Configuration

```dart
// lib/config/environment.dart
class Environment {
  static const String djangoBaseUrl = String.fromEnvironment(
    'DJANGO_API_URL',
    defaultValue: 'https://api.findrhealth.com',
  );
  
  static const String clarityBaseUrl = String.fromEnvironment(
    'CLARITY_API_URL',
    defaultValue: 'https://fearless-achievement-production.up.railway.app',
  );
  
  static const String stripePublishableKey = String.fromEnvironment(
    'STRIPE_PUBLISHABLE_KEY',
    defaultValue: 'pk_test_xxx',
  );
}
```

---

## Appendix B: Testing Strategy

### Unit Tests
- All models (JSON serialization)
- API services (mock responses)
- Business logic utilities

### Widget Tests
- Individual widgets render correctly
- User interactions work
- State changes reflect in UI

### Integration Tests
- Auth flow end-to-end
- Booking flow end-to-end
- Payment flow end-to-end

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 28, 2025 | Initial creation |

---

**Next Steps:**
1. Save this document to project
2. Start new Claude conversation
3. Reference this document
4. Begin Flutter development with API layer + models
