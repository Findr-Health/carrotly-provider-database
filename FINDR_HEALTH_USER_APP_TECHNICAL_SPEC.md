# Findr Health - User Mobile App Technical Specification
## Backend Integration & Architecture Reference

---

## Executive Summary

This document provides all technical context needed to build the Findr Health consumer mobile app. The app must integrate with an existing Node.js/MongoDB backend that already serves the Provider Portal and Admin Dashboard.

**Goal**: 10,000 users in 6 months
**Platform**: Mobile-first (iOS + Android)
**Recommended Stack**: Flutter (cross-platform) or React Native
**Backend**: Already exists - Node.js + MongoDB on Railway

---

## 1. Existing Infrastructure

### Backend API
| Component | Details |
|-----------|---------|
| **Platform** | Railway |
| **Runtime** | Node.js |
| **Database** | MongoDB Atlas |
| **Base URL** | `https://fearless-achievement-production.up.railway.app` |
| **Auth** | JWT tokens |
| **Payments** | Stripe (processing) + Stripe Connect (provider payouts) |
| **Email** | Resend API |

### Existing Platforms
| Platform | URL | Status |
|----------|-----|--------|
| Provider Onboarding | providers.findrhealth.com | ✅ Live |
| Provider Dashboard | providers.findrhealth.com/dashboard | ✅ Live |
| Admin Dashboard | carrotly-provider-database.vercel.app | ✅ Live |
| Consumer App | **TO BE BUILT** | 🔲 |

---

## 2. Database Schema Overview

### Provider Model (Existing)
```javascript
{
  _id: ObjectId,
  practiceName: String,
  description: String,                    // About Us text
  providerTypes: [String],                // ['Medical', 'Dental', etc.]
  
  // Contact
  email: String,
  phone: String,
  contactInfo: {
    email: String,
    phone: String,
    website: String
  },
  
  // Location
  address: {
    street: String,
    suite: String,
    city: String,
    state: String,
    zip: String
  },
  coordinates: {
    lat: Number,
    lng: Number
  },
  
  // Services
  services: [{
    id: String,
    name: String,
    description: String,
    category: String,
    duration: Number,         // minutes
    price: Number             // dollars
  }],
  
  // Team
  teamMembers: [{
    id: String,
    name: String,
    title: String,
    bio: String,
    photo: String
  }],
  
  // Media
  photos: [{
    url: String,
    isPrimary: Boolean
  }],
  
  // Credentials
  credentials: {
    licenseNumber: String,
    licenseState: String,
    licenseExpiry: String,
    npiNumber: String,
    yearsExperience: String,
    education: String,
    certifications: String,
    insuranceAccepted: String    // newline-separated list
  },
  
  // Calendar & Hours
  calendar: {
    businessHours: {
      monday: { enabled: Boolean, start: String, end: String },
      tuesday: { enabled: Boolean, start: String, end: String },
      // ... all 7 days
    }
  },
  
  // Policies
  cancellationPolicy: {
    tier: String,              // 'standard' | 'moderate'
    allowFeeWaiver: Boolean
  },
  
  // Status
  status: String,              // 'pending' | 'approved' | 'rejected'
  verificationBadge: Boolean,
  featured: Boolean,
  featuredOrder: Number,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### User Model (Needs Enhancement for Consumer App)
```javascript
{
  _id: ObjectId,
  email: String,
  password: String,           // hashed
  name: String,
  phone: String,
  
  // Location (for search)
  location: {
    city: String,
    state: String,
    zip: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Preferences
  savedProviders: [ObjectId],  // favorites
  recentSearches: [String],
  
  // Payment
  stripeCustomerId: String,
  paymentMethods: [{
    id: String,
    last4: String,
    brand: String,
    isDefault: Boolean
  }],
  
  // Settings
  notificationPreferences: {
    email: Boolean,
    push: Boolean,
    sms: Boolean
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

### Booking Model (Existing)
```javascript
{
  _id: ObjectId,
  
  // Parties
  userId: ObjectId,
  providerId: ObjectId,
  
  // Service Details
  serviceId: String,
  serviceName: String,
  servicePrice: Number,
  serviceDuration: Number,
  
  // Scheduling
  appointmentDate: Date,
  appointmentTime: String,
  
  // Status
  status: String,              // 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  
  // Payment
  amount: Number,
  platformFee: Number,
  providerPayout: Number,
  stripePaymentIntentId: String,
  stripeCustomerId: String,
  stripePaymentMethodId: String,
  paidAt: Date,
  refundedAt: Date,
  
  // Cancellation
  cancellationPolicy: {
    tierApplied: String,
    hoursBeforeAppointment: Number,
    feePercent: Number,
    feeAmount: Number,
    feeWaived: Boolean,
    feeWaivedBy: ObjectId,
    feeWaivedReason: String,
    feeWaivedAt: Date
  },
  cancelledAt: Date,
  cancelledBy: String,         // 'user' | 'provider'
  cancellationReason: String,
  
  // Notes
  patientNotes: String,
  providerNotes: String,
  
  createdAt: Date,
  updatedAt: Date
}
```

### Review Model (Existing/Needs Implementation)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  providerId: ObjectId,
  bookingId: ObjectId,
  
  rating: Number,              // 1-5
  title: String,
  text: String,
  
  // Moderation
  status: String,              // 'pending' | 'approved' | 'rejected'
  moderatedBy: ObjectId,
  moderatedAt: Date,
  
  // Provider Response
  providerResponse: String,
  providerRespondedAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## 3. API Endpoints (Existing & Required)

### Authentication
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| POST | `/api/auth/register` | Create user account | 🔲 Build |
| POST | `/api/auth/login` | User login | 🔲 Build |
| POST | `/api/auth/logout` | Invalidate token | 🔲 Build |
| POST | `/api/auth/forgot-password` | Password reset email | 🔲 Build |
| POST | `/api/auth/reset-password` | Set new password | 🔲 Build |
| GET | `/api/auth/me` | Get current user | 🔲 Build |

### Providers (Search & View)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/providers` | List providers (paginated) | ✅ Exists |
| GET | `/api/providers/:id` | Get provider details | ✅ Exists |
| GET | `/api/providers/search` | Search with filters | ⚠️ Enhance |
| GET | `/api/providers/featured` | Get featured providers | ✅ Exists |
| GET | `/api/providers/nearby` | Geo-based search | 🔲 Build |

### Services
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/services/categories` | List service categories | 🔲 Build |
| GET | `/api/services/search` | Search services | 🔲 Build |
| GET | `/api/providers/:id/services` | Provider's services | ✅ Exists (embedded) |

### Bookings
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| POST | `/api/bookings` | Create booking | 🔲 Build |
| GET | `/api/bookings/user` | User's bookings | 🔲 Build |
| GET | `/api/bookings/:id` | Booking details | ✅ Exists |
| POST | `/api/bookings/:id/cancel` | Cancel booking | ✅ Exists |
| GET | `/api/bookings/:id/cancellation-quote` | Get fee preview | ✅ Exists |

### Payments
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| POST | `/api/payments/setup-intent` | Add payment method | 🔲 Build |
| GET | `/api/payments/methods` | List saved methods | 🔲 Build |
| DELETE | `/api/payments/methods/:id` | Remove method | 🔲 Build |
| POST | `/api/payments/charge` | Process payment | 🔲 Build |

### User Profile
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/users/profile` | Get profile | 🔲 Build |
| PUT | `/api/users/profile` | Update profile | 🔲 Build |
| GET | `/api/users/favorites` | Saved providers | 🔲 Build |
| POST | `/api/users/favorites/:providerId` | Add favorite | 🔲 Build |
| DELETE | `/api/users/favorites/:providerId` | Remove favorite | 🔲 Build |

### Reviews
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/api/providers/:id/reviews` | Provider reviews | 🔲 Build |
| POST | `/api/reviews` | Submit review | 🔲 Build |
| PUT | `/api/reviews/:id` | Edit review | 🔲 Build |
| DELETE | `/api/reviews/:id` | Delete review | 🔲 Build |

### AI Assistant (Morgan)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| POST | `/api/ai/chat` | Send message to Morgan | ⚠️ Enhance |
| GET | `/api/ai/conversations` | Get chat history | 🔲 Build |
| POST | `/api/ai/analyze-document` | Analyze uploaded doc | 🔲 Build |

---

## 4. Cancellation Policy Logic

The user app must display and enforce cancellation policies:

### Standard Policy (24-hour)
```javascript
function calculateFee(hoursBeforeAppointment, servicePrice) {
  if (hoursBeforeAppointment >= 24) return 0;           // Free
  if (hoursBeforeAppointment >= 12) return servicePrice * 0.25;  // 25%
  if (hoursBeforeAppointment > 0) return servicePrice * 0.50;   // 50%
  return servicePrice;  // No-show: 100%
}
```

### Moderate Policy (48-hour)
```javascript
function calculateFee(hoursBeforeAppointment, servicePrice) {
  if (hoursBeforeAppointment >= 48) return 0;           // Free
  if (hoursBeforeAppointment >= 24) return servicePrice * 0.25;  // 25%
  if (hoursBeforeAppointment > 0) return servicePrice * 0.50;   // 50%
  return servicePrice;  // No-show: 100%
}
```

### Display Requirements
- Show policy tier on provider profile
- Show fee calculation before confirming cancellation
- Show "Free cancellation until [datetime]" on booking confirmation

---

## 5. Provider Types & Service Categories

### Provider Types
```javascript
const PROVIDER_TYPES = [
  { id: 'Medical', label: 'Medical', icon: '🏥' },
  { id: 'Urgent Care', label: 'Urgent Care', icon: '🚑' },
  { id: 'Dental', label: 'Dental', icon: '🦷' },
  { id: 'Mental Health', label: 'Mental Health', icon: '🧠' },
  { id: 'Skincare/Aesthetics', label: 'Skincare/Aesthetics', icon: '✨' },
  { id: 'Massage/Bodywork', label: 'Massage/Bodywork', icon: '💆' },
  { id: 'Fitness/Training', label: 'Fitness/Training', icon: '💪' },
  { id: 'Yoga/Pilates', label: 'Yoga/Pilates', icon: '🧘' },
  { id: 'Nutrition/Wellness', label: 'Nutrition/Wellness', icon: '🥗' },
  { id: 'Pharmacy/RX', label: 'Pharmacy/RX', icon: '💊' },
];
```

### Service Categories
```javascript
const SERVICE_CATEGORIES = [
  "Preventive", "Acute Care", "Chronic Care", "Vaccinations", "Virtual",
  "Urgent Care", "Minor Procedures", "Diagnostic", "Testing", "IV Therapy",
  "Restorative", "Cosmetic", "Emergency", "Evaluation", "Therapy",
  "Psychiatry", "Facials", "Injectables", "Laser", "Consultation",
  "Massage", "Chiropractic", "Physical Therapy", "Personal Training",
  "Group Fitness", "Wellness", "Nutrition", "Weight Management", 
  "Primary Care", "General"
];
```

---

## 6. User App Features (From Figma)

### Core Screens
1. **Splash/Onboarding** - App intro, value proposition
2. **Login/Register** - Email + password, social auth (future)
3. **Home** - Featured providers, search bar, categories
4. **Search Results** - Filtered provider list, map view
5. **Provider Detail** - Full profile, services, reviews, booking
6. **Service Selection** - Choose service, see price/duration
7. **Date/Time Picker** - Calendar, available slots
8. **Payment** - Card entry, saved methods
9. **Booking Confirmation** - Summary, cancellation policy
10. **My Bookings** - Upcoming, past, cancelled
11. **Booking Detail** - Full details, cancel/reschedule
12. **Profile** - User info, settings
13. **Favorites** - Saved providers
14. **AI Chat (Morgan)** - Cost calculator, document analysis
15. **Notifications** - Booking reminders, updates

### Key User Flows
1. **Discovery → Booking**: Home → Search → Provider → Service → Time → Pay → Confirm
2. **Direct Booking**: Provider Profile → Book → Service → Time → Pay → Confirm
3. **Cancellation**: My Bookings → Booking → Cancel → Fee Preview → Confirm
4. **Review**: Completed Booking → Leave Review → Submit

---

## 7. Technical Requirements

### Performance Targets (10K Users)
- **API Response**: < 200ms average
- **Search Results**: < 500ms
- **App Launch**: < 3 seconds
- **Image Loading**: Lazy load, thumbnails first

### Scalability Considerations
- Implement pagination on all list endpoints
- Use cursor-based pagination for infinite scroll
- Cache provider data locally (stale-while-revalidate)
- Implement search debouncing (300ms)
- Use WebSockets for real-time booking updates (future)

### Security Requirements
- JWT token storage in secure keychain
- Certificate pinning (production)
- Input validation (client + server)
- Rate limiting on auth endpoints
- PCI compliance (Stripe handles card data)

### Offline Capabilities
- Cache user profile
- Cache recent bookings
- Cache favorite providers
- Queue actions when offline, sync when online

---

## 8. Third-Party SDKs Required

| SDK | Purpose | Platform |
|-----|---------|----------|
| **Stripe** | Payment processing | iOS + Android |
| **Firebase** | Push notifications, analytics | iOS + Android |
| **Google Maps / MapKit** | Location services, maps | iOS + Android |
| **Sentry** | Crash reporting | iOS + Android |
| **Amplitude / Mixpanel** | User analytics | iOS + Android |

---

## 9. Environment Configuration

### Development
```
API_BASE_URL=http://localhost:5000
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### Staging
```
API_BASE_URL=https://fearless-achievement-staging.up.railway.app
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### Production
```
API_BASE_URL=https://fearless-achievement-production.up.railway.app
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

---

## 10. Recommended Development Phases

### Phase 1: Foundation (Weeks 1-2)
- Project setup (Flutter/React Native)
- Navigation structure
- Authentication (register, login, logout)
- Basic user profile

### Phase 2: Discovery (Weeks 3-4)
- Home screen with featured providers
- Search with filters
- Provider detail screen
- Service listing

### Phase 3: Booking (Weeks 5-6)
- Service selection
- Date/time picker
- Stripe payment integration
- Booking confirmation
- My bookings list

### Phase 4: Engagement (Weeks 7-8)
- Favorites
- Push notifications
- Booking reminders
- Review system

### Phase 5: AI Features (Weeks 9-10)
- Morgan chat interface
- Cost calculator
- Document upload/analysis

### Phase 6: Polish (Weeks 11-12)
- Performance optimization
- Offline support
- Analytics integration
- Beta testing
- App Store submission

---

## 11. Testing Strategy

### Unit Tests
- Cancellation fee calculations
- Date/time formatting
- Search filter logic

### Integration Tests
- Auth flow
- Booking flow
- Payment flow

### E2E Tests
- Complete booking journey
- Cancellation journey
- Review submission

### Device Testing
- iOS: iPhone 12, 13, 14, 15 (various sizes)
- Android: Pixel 6/7, Samsung S22/S23
- Tablets: iPad, Android tablets (responsive)

---

## 12. App Store Requirements

### iOS (App Store)
- Screenshots: 6.7", 6.5", 5.5" iPhones
- App icon: 1024x1024
- Privacy policy URL
- Support URL
- Age rating: 4+ (healthcare content)
- HealthKit: NOT required (no health data storage)

### Android (Play Store)
- Screenshots: Phone + 7" + 10" tablets
- Feature graphic: 1024x500
- App icon: 512x512
- Privacy policy URL
- Content rating: Everyone
- Data safety section required

---

## Appendix: Existing Code References

### Provider Search (Current Implementation)
```javascript
// GET /api/providers?type=Medical&city=Bozeman&state=MT
router.get('/', async (req, res) => {
  const { type, city, state, minPrice, maxPrice, page = 1, limit = 20 } = req.query;
  
  const filter = { status: 'approved' };
  if (type) filter.providerTypes = type;
  if (city) filter['address.city'] = new RegExp(city, 'i');
  if (state) filter['address.state'] = state;
  
  const providers = await Provider
    .find(filter)
    .skip((page - 1) * limit)
    .limit(limit)
    .select('practiceName providerTypes address photos services');
    
  res.json(providers);
});
```

### Cancellation Quote (Current Implementation)
```javascript
// GET /api/bookings/:id/cancellation-quote
router.get('/:id/cancellation-quote', async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('providerId');
  
  const appointmentDateTime = new Date(booking.appointmentDate);
  const now = new Date();
  const hoursUntil = (appointmentDateTime - now) / (1000 * 60 * 60);
  
  const policy = booking.providerId.cancellationPolicy?.tier || 'standard';
  let feePercent = 0;
  
  if (policy === 'standard') {
    if (hoursUntil < 12) feePercent = 50;
    else if (hoursUntil < 24) feePercent = 25;
  } else if (policy === 'moderate') {
    if (hoursUntil < 24) feePercent = 50;
    else if (hoursUntil < 48) feePercent = 25;
  }
  
  const feeAmount = (booking.amount * feePercent) / 100;
  
  res.json({
    hoursUntilAppointment: Math.max(0, hoursUntil),
    policyTier: policy,
    feePercent,
    feeAmount,
    refundAmount: booking.amount - feeAmount
  });
});
```

---

*Document Version: 1.0*
*Created: December 31, 2025*
*For: Consumer Mobile App Development*
