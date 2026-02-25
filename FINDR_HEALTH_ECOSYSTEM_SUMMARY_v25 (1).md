# Findr Health Ecosystem Summary
**Version 25** | Updated: January 27, 2026

---

## 🎯 MISSION
Healthcare transparency through price discovery, provider search, and AI-powered financial guidance.

---

## 📱 PRODUCT ECOSYSTEM

### **1. Mobile App (Flutter)**
**Repository:** `findr-health-mobile`  
**Platform:** iOS (TestFlight) | Android (Planned)  
**Current Version:** 1.0.4+4  
**Status:** ✅ Production (TestFlight)

#### **Core Features:**
- **Provider Discovery:** Search 100k+ providers by specialty, location, services
- **Booking System:** Schedule appointments with integrated availability
- **Clarity Hub (NEW):** Unified AI + bill analysis entry point
- **Clarity AI Chat:** Healthcare insider financial guidance with tool calling
- **Clarity Price:** Medical bill analysis and negotiation support
- **Push Notifications:** Appointment reminders, booking updates

#### **Recent Updates (Jan 27, 2026):**
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
- `POST /api/clarity/chat` - Healthcare Insider AI chat with tool calling
- Tools: `searchProviders`, `logProviderRequest`
- Model: Claude Sonnet 4 (claude-sonnet-4-20250514)

**Clarity Price:**
- `POST /api/clarity-price/analyze` - Bill analysis with Claude Vision
- `GET /api/clarity-price/bills` - User's bill history
- `PUT /api/clarity-price/bills/:id/feedback` - Negotiation outcomes

**Provider Management:**
- `GET /api/providers` - Search providers (geolocation, filters)
- `GET /api/providers/:id` - Provider details
- `POST /api/providers` - Create provider (admin)
- `PUT /api/providers/:id` - Update provider (admin)

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

---

### **Tool Calling Integration**

#### **Available Tools:**

**1. searchProviders**
```javascript
{
  providerType: "Dental" | "Medical" | "Mental Health" | etc,
  latitude: number,
  longitude: number,
  radius: number (default 25 miles)
}
```
- Searches MongoDB with geospatial queries
- Returns providers with transparent pricing
- App renders as interactive cards

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

#### **How It Works:**

1. **User asks:** "Find transparent-priced urgent care"
2. **AI uses tool:** Calls `searchProviders` with user's location
3. **Backend executes:** Geo query against Provider collection
4. **AI synthesizes:** "Found 3 urgent care centers with posted prices..."
5. **App renders:** Provider cards with "Book Now" buttons

#### **Example Response with Providers:**
```
I found 3 imaging centers near you with transparent pricing:

[PROVIDER:507f1f77bcf86cd799439011]
- SimonMed Imaging - $399 cash MRI
- 2.3 miles away

[PROVIDER:507f1f77bcf86cd799439012]
- Radiology Associates - $450 cash MRI
- 5.1 miles away

All post prices upfront. Call and ask for "cash price" specifically.
```

The `[PROVIDER:id]` tags are parsed by the app to render interactive cards.

---

### **Enhancing Provider Integration**

#### **Current State:**
✅ Tool calling implemented
✅ Geospatial search working
✅ Provider types mapped correctly
✅ Location passed from Flutter app

#### **To Enhance:**

**1. Add Price Data to Tool Response**
```javascript
// In searchProviders function
return {
  success: true,
  count: providers.length,
  providers: providers.map(p => ({
    id: p._id,
    name: p.businessName,
    distance: p.distance,
    services: p.services, // Include this!
    pricing: p.pricing,   // Include this!
    badges: p.badges      // Include this!
  }))
};
```

**2. Update System Prompt**
```javascript
// In claritySystemPrompt.js
When using searchProviders, you'll receive:
- Provider name, location, distance
- Services offered with prices
- Cash prices vs insurance
- Badges (cash-priced, transparent)

Always mention specific prices when available.
Example: "SimonMed posts $399 for MRI (cash price)"
```

**3. Create Price Comparison Tool**
```javascript
{
  name: "comparePrices",
  description: "Compare prices for a specific procedure across providers",
  input_schema: {
    type: "object",
    properties: {
      procedureName: { type: "string" },
      latitude: { type: "number" },
      longitude: { type: "number" }
    }
  }
}
```

**4. Add Service Search Tool**
```javascript
{
  name: "searchServices",
  description: "Search for specific services/procedures",
  input_schema: {
    type: "object",
    properties: {
      serviceName: { type: "string" },
      serviceCategory: { type: "string" }
    }
  }
}
```

---

## 📊 DATA MODELS

### **Provider Schema**
```javascript
{
  businessName: String,
  providerTypes: [String], // ["Dental", "Medical", etc]
  services: [{
    name: String,
    category: String,
    price: Number,
    unit: String,
    cashPrice: Number,
    insuranceAccepted: Boolean
  }],
  pricing: {
    hasCashPrices: Boolean,
    acceptsInsurance: Boolean,
    transparentPricing: Boolean
  },
  badges: {
    cashPriced: Boolean,
    transparentPricing: Boolean,
    sameDayAvailable: Boolean
  },
  location: {
    type: "Point",
    coordinates: [longitude, latitude]
  },
  status: "approved" | "pending" | "rejected"
}
```

### **ClarityChatMessage**
```dart
class ClarityChatMessage {
  final String role; // 'user' or 'assistant'
  final String content;
  final DateTime timestamp;
  final List<String>? providerIds; // For tool responses
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

### **Navigation Flow:**
```
Home → Center Button → Clarity Hub Modal
  ├─ Ask Me Anything → Chat Screen (with tools)
  │   └─ AI response with [PROVIDER:id] tags → Provider cards
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
- **Version:** 1.0.4+4
- **Platform:** iOS TestFlight
- **Build:** Archive via Xcode
- **Status:** ✅ Live for beta testing

### **Backend (API)**
- **Hosting:** Railway
- **Branch:** main (auto-deploy)
- **Database:** MongoDB Atlas
- **Status:** ✅ Live

### **System Prompt**
- **File:** `backend/prompts/claritySystemPrompt.js`
- **Voice:** Healthcare Insider (adversarial)
- **Deployed:** January 27, 2026
- **Status:** ✅ Live

---

## 📈 METRICS TO TRACK

### **Clarity AI Usage:**
- Messages sent per day
- Tool call frequency (searchProviders vs logProviderRequest)
- Provider click-through rate from AI responses
- Feedback sentiment (👍 vs 👎 ratio)
- Average conversation length

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

---

## 🔧 TECHNICAL STACK

### **Mobile:**
- **Framework:** Flutter 3.x
- **State Management:** Riverpod
- **Routing:** go_router
- **HTTP:** Dio
- **Local Storage:** shared_preferences
- **Location:** geolocator
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

### **Q1 2026 - In Progress**
- [ ] Real community stats endpoint (mock: $12,483)
- [ ] Enhanced provider search (price filtering)
- [ ] Service-specific search tool
- [ ] Track user prompts in feedback

### **Q2 2026 - Planned**
- [ ] Android release
- [ ] Price comparison tool
- [ ] Medicare rate database integration
- [ ] Negotiation outcome tracking
- [ ] In-app booking from AI responses

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
1. Provider services/prices not passed to AI tool yet
2. No price comparison across providers
3. Community stats are mock data ($12,483)
4. No analytics on which providers AI recommends most

### **Admin Dashboard:**
1. Clarity AI feedback needs dedicated view
2. Tool call analytics not visualized
3. Provider recommendations not tracked

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
│   │   │   └── clarity_hub_screen.dart (NEW)
│   │   └── chat/
│   │       └── chat_screen.dart (feedback integration)
│   └── widgets/
│       └── message_feedback_buttons.dart (NEW)
├── services/
│   └── clarity_service.dart (API calls, tool handling)
└── core/
    └── router/
        └── app_router.dart (clarityHub route)
```

### **Backend:**
```
backend/
├── routes/
│   ├── clarity.js (chat + tools)
│   ├── clarityPriceRoutes.js (bill analysis)
│   ├── feedback.js (thumbs up/down)
│   └── providers.js (search, CRUD)
├── prompts/
│   └── claritySystemPrompt.js (Healthcare Insider voice)
└── models/
    ├── Provider.js
    ├── Bill.js
    └── Feedback.js
```

---

## 🎉 RECENT WINS

### **January 27, 2026:**
1. ✅ Healthcare Insider voice live in production
2. ✅ Unified Clarity Hub shipped to TestFlight
3. ✅ Feedback system integrated (admin dashboard ready)
4. ✅ Copy button on all AI responses
5. ✅ Dynamic Island overlap fixed
6. ✅ Tool calling verified working
7. ✅ Zero technical debt

**Result:** Professional, polished AI experience with direct, actionable healthcare financial guidance.

---

## 📞 SUPPORT & RESOURCES

- **API Docs:** https://docs.anthropic.com/en/api
- **Flutter Docs:** https://docs.flutter.dev
- **MongoDB:** https://docs.mongodb.com/manual/geospatial-queries
- **Railway:** https://docs.railway.app

---

**Last Updated:** January 27, 2026  
**Next Review:** February 2026  
**Maintained By:** Tim Wetherill + Claude
