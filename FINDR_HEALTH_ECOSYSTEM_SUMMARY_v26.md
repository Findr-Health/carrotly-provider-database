# Findr Health Ecosystem Summary
**Version 26** | Updated: January 28, 2026

---

## 🎯 MISSION
Healthcare transparency through price discovery, provider search, and AI-powered financial guidance.

---

## 📱 PRODUCT ECOSYSTEM

### **1. Mobile App (Flutter)**
**Repository:** `findr-health-mobile`  
**Platform:** iOS (TestFlight) | Android (Planned)  
**Current Version:** 1.0.5+11  
**Status:** ✅ Production (TestFlight)

#### **Core Features:**
- **Provider Discovery:** Search 100k+ providers by specialty, location, services
- **Booking System:** Schedule appointments with integrated availability
- **Clarity Hub (NEW):** Unified AI + bill analysis entry point
- **Clarity AI Chat:** Healthcare insider financial guidance with **provider cards** ✨
- **Clarity Price:** Medical bill analysis and negotiation support
- **Push Notifications:** Appointment reminders, booking updates

#### **Recent Updates (Jan 28, 2026):**
✅ **Provider cards in Clarity AI** - Shows providers below AI responses with distance, prices, booking CTA
✅ **Shared location service** - Home screen and chat use same location (synced)
✅ **Geospatial search fixed** - 100-mile radius, proper coordinate order [lng, lat]
✅ **NYC test providers** - 10 realistic providers for team testing (Darien, CT area)
✅ **Distance calculation** - Real-time distance from user to provider on cards

#### **Previous Updates (Jan 27, 2026):**
✅ Healthcare Insider rebrand complete
✅ Unified Clarity Hub modal interface
✅ Feedback buttons (👍👎) + copy feature
✅ Dynamic Island safe area spacing
✅ Adversarial AI voice live in production

---

### **2. Backend API (Node.js + Express)**
**Repository:** `carrotly-provider-database`  
**Hosting:** Railway (https://fearless-achievement-production.up.railway.app)  
**Database:** MongoDB Atlas  
**Status:** ✅ Production

#### **Key Endpoints:**

**Clarity AI:**
- `POST /api/clarity/chat` - Healthcare Insider AI chat with **pre-search** ✨
- Tools: `searchProviders`, `logProviderRequest`
- Model: Claude Sonnet 4 (claude-sonnet-4-20250514)
- **NEW:** Pre-searches providers BEFORE calling Claude, includes in system prompt

**Provider Management:**
- `GET /api/providers` - Search providers (geolocation, filters, **100-mile radius**)
- `GET /api/providers/:id` - Provider details
- `POST /api/providers/admin/create-test-provider` - Admin bypass for testing ✨
- `PUT /api/providers/:id` - Update provider (admin)

**Clarity Price:**
- `POST /api/clarity-price/analyze` - Bill analysis with Claude Vision
- `GET /api/clarity-price/bills` - User's bill history
- `PUT /api/clarity-price/bills/:id/feedback` - Negotiation outcomes

**Booking:**
- `POST /api/bookings` - Create booking
- `GET /api/bookings/user` - User's bookings
- `PUT /api/bookings/:id` - Update booking status

**Feedback & Analytics:**
- `POST /api/feedback` - Submit AI feedback (thumbs up/down)
- `GET /api/clarity-admin/feedback` - Admin feedback dashboard
- `GET /api/analytics` - Usage analytics

---

### **3. Admin Dashboard (React)**
**Repository:** `carrotly-provider-database/admin-dashboard`  
**Access:** https://fearless-achievement-production.up.railway.app/admin  
**Status:** ✅ Production

#### **Features:**
- Provider management (CRUD operations)
- Booking queue and status updates
- Feedback dashboard (AI response ratings)
- Analytics dashboard (usage metrics)
- Badge system (cash-priced, transparent)

---

## 🤖 CLARITY AI ARCHITECTURE

### **Healthcare Insider Voice**
**System Prompt:** `backend/prompts/claritySystemPrompt.js`  
**Deployed:** January 27, 2026  
**Updated:** January 28, 2026 (brevity rules)

#### **Positioning:**
- **Identity:** Healthcare insider working for patients
- **Tone:** Direct, adversarial (against system), actionable
- **Examples:**
  - ❌ "Healthcare costs can vary..."
  - ✅ "That $580 bill? 5x Medicare rates. Fair: $115-175."

#### **Response Structure:**
1. Validate suspicion (if user thinks overcharged)
2. Give insider context (why it's overpriced)
3. Provide fair range (Medicare baseline)
4. Action steps (exact negotiation scripts)

**NEW (Jan 28):** Response must be **2-3 sentences max**, end with "Tap the card below to view services and book"

---

### **Tool Calling Integration**

#### **Available Tools:**

**1. searchProviders**
```javascript
{
  providerType: "Dental" | "Medical" | "Mental Health" | etc,
  latitude: number,
  longitude: number,
  radius: number (default 100 miles) // Changed from 25!
}
```
- Searches MongoDB with geospatial queries
- Returns providers with transparent pricing
- **App renders as provider cards** ✨

**2. logProviderRequest**
```javascript
{
  providerType: string,
  userMessage: string,
  latitude: number,
  longitude: number,
  city: string,
  state: string
}
```
- Logs when no providers found
- Helps team prioritize expansion areas

#### **How It Works (Updated Jan 28):**

1. **User asks:** "I need a dentist"
2. **Backend PRE-SEARCHES:** Runs geospatial query BEFORE calling Claude
3. **System prompt includes providers:** "FOUND PROVIDERS: Brooklyn Heights Dental (1.4 mi)..."
4. **AI synthesizes:** "I found 2 dental practices near you. Brooklyn Heights Dental is just 1.4 miles away..."
5. **Backend extracts provider IDs:** From pre-search results
6. **App renders:** Provider cards below AI message with distance, top services, prices

#### **Provider Cards Design:**
```
┌─────────────────────────────────────┐
│ 🏢  Brooklyn Heights Dental ✅      │
│ Brooklyn, NY • 1.4 mi               │
├─────────────────────────────────────┤
│ • Dental Cleaning             $105  │
│ • Dental Exam                  $85  │
├─────────────────────────────────────┤
│   View Services & Book    →         │
└─────────────────────────────────────┘
```

**NEW Implementation:**
- Widget: `ClarityProviderCard` (lib/presentation/screens/chat/widgets/)
- Service layer: `fetchProvider()`, `fetchProviders()` in ClarityService
- Distance calc: Uses Geolocator.distanceBetween() with shared location
- Taps navigate to `/provider/:id`

---

### **Location Service (NEW - Jan 28)**

#### **Shared State Architecture:**
**File:** `lib/services/location_service.dart`

```dart
class LocationState {
  final Position? position; // GPS coordinates
  final String cityName;    // "New York"
  final String stateName;   // "NY"
  final bool isLoading;
  
  double? get latitude => position?.latitude;
  double? get longitude => position?.longitude;
  String get displayName => '$cityName, $stateName';
}

final locationProvider = StateNotifierProvider<LocationNotifier, LocationState>(...);
```

**Usage:**
- **Home screen:** Watches locationProvider for provider search
- **Clarity AI chat:** Reads locationProvider for message location
- **Provider cards:** Calculates distance from locationProvider position
- **Location picker:** Updates locationProvider (syncs across app)

**Benefits:**
- Single source of truth for location
- No duplicate GPS calls
- Consistent location across features
- Manual selection persists

---

### **Geospatial Search (Updated Jan 28)**

#### **Provider Schema - CRITICAL CHANGE:**
```javascript
{
  // ... other fields ...
  
  // REQUIRED: GeoJSON Point for geospatial search
  location: {
    type: "Point",
    coordinates: [longitude, latitude] // Order matters!
  },
  
  address: {
    street: String,
    city: String,
    state: String,
    zip: String
  }
}
```

**Database Indexes:**
```javascript
// Single 2dsphere index (removed duplicates Jan 28)
db.providers.createIndex({ "location": "2dsphere" })
```

**Search Query:**
```javascript
const providers = await Provider.aggregate([
  {
    $geoNear: {
      near: { type: 'Point', coordinates: [lng, lat] },
      distanceField: 'distance',
      maxDistance: 160934, // 100 miles in meters
      spherical: true,
      query: { status: 'approved', 'location.coordinates': { $exists: true } }
    }
  },
  { $limit: 10 }
]);
```

**Key Changes (Jan 28):**
1. ✅ Search radius: 25 miles → **100 miles** (rural Montana support)
2. ✅ Search services field instead of just providerTypes
3. ✅ Fixed duplicate index issue ($geoNear errors)
4. ✅ Coordinates validated: cannot be [0, 0]

---

## 📊 DATA MODELS

### **Provider Schema (Updated Jan 28)**
```javascript
{
  practiceName: String,  // Was businessName
  name: String,          // Individual provider name
  providerTypes: [String], // ["Dental", "Medical", etc]
  
  // CRITICAL: Location for geospatial search
  location: {
    type: "Point",
    coordinates: [longitude, latitude] // [lng, lat] order!
  },
  
  address: {
    street: String,
    suite: String,
    city: String,
    state: String,
    zip: String
  },
  
  contactInfo: {
    email: String,
    phone: String,
    website: String
  },
  
  services: [{
    name: String,
    category: String,
    description: String,
    price: Number,
    duration: Number, // minutes
    isActive: Boolean,
    hasVariants: Boolean,
    variants: [{ name, price, duration }]
  }],
  
  team: [{
    name: String,
    role: String,
    credentials: [String],
    bio: String,
    photoUrl: String,
    isActive: Boolean
  }],
  
  calendar: {
    provider: String, // 'acuity', 'manual', 'google'
    businessHours: { /* days with start/end times */ },
    bufferMinutes: Number,
    maxAdvanceBookingDays: Number
  },
  
  agreement: {
    signature: String,
    title: String,
    agreedDate: Date,
    version: String
  },
  
  status: String, // 'draft', 'pending', 'approved', 'rejected'
  isVerified: Boolean,
  onboardingCompleted: Boolean,
  onboardingStep: Number,
  
  createdAt: Date,
  updatedAt: Date
}
```

### **ClarityChatMessage (Updated Jan 28)**
```dart
class ClarityChatMessage {
  final String role; // 'user' or 'assistant'
  final String content;
  final DateTime timestamp;
  final List<String>? providerIds; // NEW: For rendering provider cards
}
```

### **Feedback Schema**
```javascript
{
  messageId: String, // ISO timestamp
  rating: "positive" | "negative",
  aiResponse: String,
  userPrompt: String,
  sessionId: String,
  timestamp: Date,
  interactionType: "chat" | "upload" | "document"
}
```

---

## 🎨 CLARITY HUB UX

### **Design System:**
- **Hero Quote:** "They bet you won't question your bill. We give you the proof to fight back."
- **Tagline:** "Your Healthcare Insider"
- **Colors:** Teal gradient (AppColors.primary)
- **Layout:** Modal overlay (no navigation stack)
- **Components:**
  - Drag handle (4px gray bar)
  - Icon + title
  - Hero quote card (bordered)
  - Two gradient CTAs
  - Community stats card

### **Navigation Flow (Updated Jan 28):**
```
Home → Center Button → Clarity Hub Modal
  ├─ Ask Me Anything → Chat Screen (with tools)
  │   ├─ AI response with providerIds array
  │   └─ Provider cards render below message ✨
  │       └─ Tap card → Navigate to /provider/:id
  └─ Analyze Your Bill → Clarity Price Flow
      └─ Upload → Processing → Results → Feedback
```

### **Feedback Buttons:**
- **Copy (📋):** Copies AI response to clipboard
- **Thumbs Up (👍):** Positive feedback
- **Thumbs Down (👎):** Negative feedback
- **State:** Shows "Thanks for your feedback!" after selection
- **Tracking:** Sent to `/api/feedback` for admin dashboard

---

## 🚀 DEPLOYMENT STATUS

### **Frontend (Mobile)**
- **Version:** 1.0.5+11 ✨ (was 1.0.4+4)
- **Platform:** iOS TestFlight
- **Build:** Archive via Xcode
- **Status:** ✅ Live for beta testing
- **Deployed:** January 28, 2026

### **Backend (API)**
- **Hosting:** Railway
- **Branch:** main (auto-deploy)
- **Database:** MongoDB Atlas
- **Status:** ✅ Live
- **Last Deploy:** January 28, 2026 (search radius fix)

### **System Prompt**
- **File:** `backend/prompts/claritySystemPrompt.js`
- **Voice:** Healthcare Insider (adversarial)
- **Deployed:** January 27, 2026
- **Updated:** January 28, 2026 (brevity, provider cards)
- **Status:** ✅ Live

---

## 📈 METRICS TO TRACK

### **Clarity AI Usage:**
- Messages sent per day
- Tool call frequency (searchProviders vs logProviderRequest)
- **Provider card click-through rate** ✨
- Provider booking conversion from AI chat ✨
- Feedback sentiment (👍 vs 👎 ratio)
- Average conversation length
- Distance of providers recommended ✨

### **Clarity Price:**
- Bills analyzed per day
- Average bill amount
- Average overcharge detected
- Negotiation attempt rate
- Negotiation success rate

### **Provider Discovery:**
- Searches per day
- Booking conversion rate
- Most searched provider types
- Geographic coverage gaps (from logProviderRequest)
- **Location changes per session** ✨

---

## 🔧 TECHNICAL STACK

### **Mobile:**
- **Framework:** Flutter 3.x
- **State Management:** Riverpod
- **Routing:** go_router
- **HTTP:** Dio
- **Local Storage:** shared_preferences
- **Location:** geolocator ✨
- **Notifications:** firebase_messaging

### **Backend:**
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **AI:** Anthropic Claude API
- **Vision:** Claude Vision (bill analysis)
- **Auth:** JWT tokens
- **Hosting:** Railway

### **Admin Dashboard:**
- **Framework:** React + Vite
- **UI:** Custom components
- **Charts:** Chart.js
- **HTTP:** Fetch API
- **Routing:** React Router

---

## 🎯 ROADMAP

### **Q1 2026 - Completed ✅**
- [x] Healthcare Insider rebrand
- [x] Unified Clarity Hub
- [x] Feedback + copy buttons
- [x] TestFlight deployment (1.0.4+4)
- [x] Tool calling integration
- [x] **Provider cards in Clarity AI** ✨
- [x] **Shared location service** ✨
- [x] **Geospatial search optimization** ✨

### **Q1 2026 - In Progress**
- [ ] Real community stats endpoint (mock: $12,483)
- [ ] Enhanced provider search (price filtering)
- [ ] Service-specific search tool
- [ ] Track user prompts in feedback
- [ ] **Provider schema alignment** (Admin Dashboard + Provider Portal) ⚠️

### **Q2 2026 - Planned**
- [ ] Android release
- [ ] Price comparison tool
- [ ] Medicare rate database integration
- [ ] Negotiation outcome tracking
- [ ] In-app booking from AI responses (partially done with cards)

### **Q3 2026 - Future**
- [ ] Insurance plan comparison
- [ ] FSA/HSA optimization guidance
- [ ] Provider network adequacy analysis
- [ ] Claim denial assistance

---

## 📝 OUTSTANDING ISSUES

### **Minor Polish:**
1. "Tools & Resources" title on home screen (empty string)
2. Welcome message could be even shorter
3. Chat could show user's previous question in context

### **Feature Gaps:**
1. ~~Provider services/prices not passed to AI tool yet~~ ✅ DONE (Jan 28)
2. No price comparison across providers
3. Community stats are mock data ($12,483)
4. No analytics on which providers AI recommends most
5. **Reverse geocoding for "Use Current Location"** ⚠️ (shows coords but not city name)

### **Admin Dashboard:**
1. Clarity AI feedback needs dedicated view
2. Tool call analytics not visualized
3. Provider recommendations not tracked

### **Critical Schema Issues:**
1. **Provider schema misalignment** ⚠️ (Database updated, Admin/Portal pending)
2. Admin Dashboard may fail on provider CRUD
3. Provider Portal MVP needs schema sync

---

## 🔐 SECURITY & COMPLIANCE

### **Data Protection:**
- JWT authentication for all user endpoints
- Bill images encrypted at rest
- PHI not stored in chat logs
- Rate limiting on all endpoints

### **HIPAA Considerations:**
- Bills analyzed, not stored long-term
- No PII in AI training data
- Feedback anonymized for analytics
- Admin access logged

---

## 📚 KEY FILES

### **Frontend:**
```
lib/
├── presentation/
│   ├── screens/
│   │   ├── clarity/
│   │   │   └── clarity_hub_screen.dart
│   │   └── chat/
│   │       ├── chat_screen.dart (provider cards integration) ✨
│   │       └── widgets/
│   │           ├── clarity_provider_card.dart (NEW) ✨
│   │           └── message_feedback_buttons.dart
│   └── widgets/
│       └── location_picker.dart (updated to use shared location) ✨
├── services/
│   ├── clarity_service.dart (fetchProvider, fetchProviders) ✨
│   └── location_service.dart (NEW - shared state) ✨
└── core/
    └── router/
        └── app_router.dart (clarityHub route)
```

### **Backend:**
```
backend/
├── routes/
│   ├── clarity.js (pre-search + provider ID extraction) ✨
│   ├── clarityPriceRoutes.js (bill analysis)
│   ├── feedback.js (thumbs up/down)
│   └── providers.js (search, CRUD, admin test endpoint) ✨
├── prompts/
│   └── claritySystemPrompt.js (updated brevity rules) ✨
├── models/
│   ├── Provider.js (location GeoJSON field) ✨
│   ├── Bill.js
│   └── Feedback.js
└── scripts/
    ├── fix_test_provider_locations.js (Montana coords) ✨
    └── create_nyc_providers.js (NYC test data) ✨
```

---

## 🧪 TEST DATA

### **Montana Providers (Production Test)**
Created: January 28, 2026

1. **Bozeman Family Dental**
   - ID: 697a80ac37ac7a5c114e3a23
   - Location: 321 E Main St, Bozeman, MT (45.6797, -111.0429)
   - Services: Dental Cleaning ($95), Dental Exam ($75), Cavity Filling ($185)

2. **Mountain View Massage Therapy**
   - ID: 697a80ad37ac7a5c114e3a28
   - Location: 415 N 7th Ave, Bozeman, MT (45.6833, -111.0368)
   - Services: Swedish Massage ($85), Deep Tissue ($95), Sports Massage ($100)

3. **Bridger Creek Medical Clinic**
   - ID: 697a80ad37ac7a5c114e3a2d
   - Location: 86 E Kagy Blvd, Bozeman, MT (45.6650, -111.0385)
   - Services: Office Visit ($125), Annual Physical ($150)

### **NYC Providers (Team Testing - Darien, CT Area)**
Created: January 28, 2026  
Purpose: Testing for team in Connecticut (all within 50 miles of Darien)

10 providers across all boroughs:
1. Union Square Family Medicine (Manhattan Medical)
2. Brooklyn Heights Dental Care (Brooklyn Dental)
3. Chelsea Counseling Group (Manhattan Mental Health)
4. Astoria Wellness & Massage (Queens Massage)
5. Riverdale Urgent Care Center (Bronx Urgent Care)
6. SoHo Skin & Laser Center (Manhattan Skincare)
7. Midtown Fitness & Training (Manhattan Fitness)
8. Park Slope Chiropractic (Brooklyn Chiropractic)
9. Upper East Side Dental Studio (Manhattan Dental)
10. Long Island City Physical Therapy (Queens Medical)

---

## 🎉 RECENT WINS

### **January 28, 2026:**
1. ✅ Provider cards shipped to TestFlight (1.0.5+11)
2. ✅ Shared location service working across app
3. ✅ Geospatial search fixed (100-mile radius)
4. ✅ 10 NYC test providers created for team
5. ✅ Distance calculation accurate
6. ✅ Pre-search optimization (providers found before Claude call)
7. ✅ Provider schema location field fixed
8. ✅ Zero critical bugs

### **January 27, 2026:**
1. ✅ Healthcare Insider voice live in production
2. ✅ Unified Clarity Hub shipped to TestFlight
3. ✅ Feedback system integrated (admin dashboard ready)
4. ✅ Copy button on all AI responses
5. ✅ Dynamic Island overlap fixed
6. ✅ Tool calling verified working
7. ✅ Zero technical debt

**Result:** AI-powered provider discovery with actionable recommendations, distance-aware search, and seamless booking flow.

---

## 📞 SUPPORT & RESOURCES

- **API Docs:** https://docs.anthropic.com/en/api
- **Flutter Docs:** https://docs.flutter.dev
- **MongoDB:** https://docs.mongodb.com/manual/geospatial-queries
- **Railway:** https://docs.railway.app
- **Geolocator:** https://pub.dev/packages/geolocator

---

**Last Updated:** January 28, 2026  
**Next Review:** February 2026  
**Maintained By:** Tim Wetherill + Claude
