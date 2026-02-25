# Findr Health Consumer App - Enhancement Plan

**Version:** 1.0  
**Date:** January 2025  
**Status:** Planning

---

## Overview

This document outlines the planned enhancements for the Findr Health consumer mobile app, organized by priority and complexity.

---

## 1. Search Enhancement

### Current State
- Frontend sends `search` query param to `/providers` endpoint
- Backend does basic filtering (likely on `name` field only)
- No service name search
- No fuzzy matching
- No relevance scoring

### Enhancement Plan

#### 1.1 Backend Improvements (Node.js/MongoDB)

**A. Full-Text Search Index**
```javascript
// Create text index on Provider collection
db.providers.createIndex({
  "businessName": "text",
  "description": "text",
  "services.name": "text",
  "services.description": "text",
  "type": "text",
  "city": "text",
  "state": "text"
}, {
  weights: {
    businessName: 10,
    "services.name": 8,
    type: 5,
    description: 3,
    city: 2
  },
  name: "provider_search_index"
});
```

**B. Enhanced Search Endpoint**
```javascript
// GET /api/providers/search
router.get('/search', async (req, res) => {
  const { 
    q,           // search query
    type,        // provider type filter
    service,     // service category filter
    lat, lng,    // location for distance
    radius,      // search radius in miles (default 25)
    minRating,   // minimum rating filter
    maxPrice,    // max price filter
    sort,        // relevance, distance, rating, price
    limit = 20,
    skip = 0
  } = req.query;

  const pipeline = [];

  // Text search with score
  if (q) {
    pipeline.push({
      $match: { $text: { $search: q } }
    });
    pipeline.push({
      $addFields: { searchScore: { $meta: "textScore" } }
    });
  }

  // Type filter
  if (type) {
    pipeline.push({ $match: { type: type } });
  }

  // Service filter
  if (service) {
    pipeline.push({ 
      $match: { "services.category": service } 
    });
  }

  // Geo filter (if location provided)
  if (lat && lng) {
    pipeline.push({
      $geoNear: {
        near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
        distanceField: "distance",
        maxDistance: (radius || 25) * 1609.34, // miles to meters
        spherical: true
      }
    });
  }

  // Rating filter
  if (minRating) {
    pipeline.push({ $match: { rating: { $gte: parseFloat(minRating) } } });
  }

  // Sort
  const sortOptions = {
    relevance: { searchScore: -1, rating: -1 },
    distance: { distance: 1 },
    rating: { rating: -1 },
    price: { "services.price": 1 }
  };
  pipeline.push({ $sort: sortOptions[sort] || sortOptions.relevance });

  // Pagination
  pipeline.push({ $skip: parseInt(skip) });
  pipeline.push({ $limit: parseInt(limit) });

  const results = await Provider.aggregate(pipeline);
  res.json({ providers: results, total: results.length });
});
```

**C. Autocomplete Endpoint**
```javascript
// GET /api/providers/autocomplete
router.get('/autocomplete', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ suggestions: [] });

  const suggestions = await Provider.aggregate([
    {
      $search: {
        autocomplete: {
          query: q,
          path: "businessName",
          fuzzy: { maxEdits: 1 }
        }
      }
    },
    { $limit: 5 },
    { $project: { businessName: 1, type: 1 } }
  ]);

  // Also search services
  const serviceSuggestions = await Provider.aggregate([
    { $unwind: "$services" },
    { $match: { "services.name": { $regex: q, $options: 'i' } } },
    { $group: { _id: "$services.name" } },
    { $limit: 5 }
  ]);

  res.json({
    providers: suggestions,
    services: serviceSuggestions.map(s => s._id)
  });
});
```

#### 1.2 Frontend Improvements (Flutter)

**A. Search with Autocomplete**
```dart
// Add autocomplete provider
final autocompleteProvider = FutureProvider.autoDispose.family<AutocompleteSuggestions, String>((ref, query) async {
  if (query.length < 2) return AutocompleteSuggestions.empty();
  final api = ref.watch(apiServiceProvider);
  final response = await api.get('/providers/autocomplete', queryParameters: {'q': query});
  return AutocompleteSuggestions.fromJson(response.data);
});
```

**B. Enhanced Search Filters**
- Price range slider
- Rating filter (4+ stars, 3+ stars)
- Distance radius
- Service category
- Availability (today, this week)
- Insurance accepted (future)

**C. Search Results Improvements**
- Show match highlights
- Display distance from user
- Show "why matched" (service name, description, etc.)
- Recent searches saved locally

---

## 2. Clarity AI Integration

### Current State
- Chat screen exists but likely uses placeholder/mock responses
- Need to connect to your LLM backend

### Implementation Plan

#### 2.1 Backend: Clarity API Endpoint

```javascript
// POST /api/clarity/chat
router.post('/chat', authenticate, async (req, res) => {
  const { message, conversationId, context } = req.body;
  const userId = req.user.id;

  // Get or create conversation
  let conversation = conversationId 
    ? await Conversation.findById(conversationId)
    : new Conversation({ user: userId });

  // Build context from conversation history
  const history = conversation.messages.slice(-10).map(m => ({
    role: m.role,
    content: m.content
  }));

  // Add user context
  const userContext = {
    location: req.user.location,
    recentSearches: await getRecentSearches(userId),
    upcomingBookings: await getUpcomingBookings(userId)
  };

  // Call your LLM (Claude API, OpenAI, or custom)
  const response = await callClarityLLM({
    systemPrompt: CLARITY_SYSTEM_PROMPT,
    messages: [...history, { role: 'user', content: message }],
    userContext,
    tools: [
      { name: 'search_providers', description: 'Search for healthcare providers' },
      { name: 'get_provider_details', description: 'Get details about a specific provider' },
      { name: 'check_availability', description: 'Check provider availability' },
      { name: 'estimate_cost', description: 'Estimate cost for a service' }
    ]
  });

  // Save messages
  conversation.messages.push(
    { role: 'user', content: message },
    { role: 'assistant', content: response.content }
  );
  await conversation.save();

  res.json({
    conversationId: conversation._id,
    response: response.content,
    actions: response.actions // e.g., suggested providers, booking links
  });
});
```

#### 2.2 Clarity System Prompt

```javascript
const CLARITY_SYSTEM_PROMPT = `You are Clarity, an AI healthcare navigation assistant for Findr Health.

Your role is to help users:
- Find the right healthcare providers for their needs
- Understand healthcare costs and compare options
- Navigate between insurance and cash-pay options
- Book appointments easily
- Answer questions about health services

Guidelines:
- Be warm, helpful, and conversational
- Ask clarifying questions when needed
- Provide cost transparency when discussing services
- Suggest relevant providers from the Findr Health marketplace
- Never provide medical diagnoses or treatment recommendations
- Always encourage users to consult healthcare professionals for medical advice

You have access to:
- Provider search (by type, location, service, price)
- Provider details (services, prices, availability)
- Cost estimation tools
- Booking functionality

Current user context will be provided with each message.`;
```

#### 2.3 Flutter Chat Integration

```dart
// lib/services/clarity_service.dart
class ClarityService {
  final ApiService _api;
  String? _conversationId;

  Future<ClarityResponse> sendMessage(String message) async {
    final response = await _api.post('/clarity/chat', data: {
      'message': message,
      'conversationId': _conversationId,
    });

    _conversationId = response.data['conversationId'];
    
    return ClarityResponse(
      message: response.data['response'],
      actions: (response.data['actions'] as List?)
          ?.map((a) => ClarityAction.fromJson(a))
          .toList() ?? [],
    );
  }

  void startNewConversation() {
    _conversationId = null;
  }
}

// Action types Clarity can suggest
class ClarityAction {
  final String type; // 'view_provider', 'book', 'search', 'call'
  final String label;
  final Map<String, dynamic> data;
}
```

#### 2.4 Chat UI Enhancements

- Rich message bubbles (markdown support)
- Action buttons in responses (View Provider, Book Now, Call)
- Typing indicators
- Conversation history persistence
- Quick action chips ("Find a dentist", "Compare costs", "Book appointment")

---

## 3. Payment UI/UX

### 3.1 Payment Methods Screen

**Location:** Profile → Payment

```dart
// lib/presentation/screens/payment/payment_methods_screen.dart
class PaymentMethodsScreen extends ConsumerWidget {
  // Features:
  // - List saved cards
  // - Add new card (Stripe Elements)
  // - Set default card
  // - Delete card
  // - Link to Stripe Customer Portal for more options
}
```

**UI Components:**
- Card list with card brand icons (Visa, Mastercard, Amex)
- Last 4 digits display
- Expiry date
- Default badge
- Add card button → Stripe payment sheet

### 3.2 Add Card Flow (Stripe)

```dart
// Using stripe_flutter package
Future<void> addPaymentMethod() async {
  // 1. Create SetupIntent on backend
  final setupIntent = await api.post('/payments/setup-intent');
  
  // 2. Present Stripe payment sheet
  await Stripe.instance.initPaymentSheet(
    paymentSheetParameters: SetupPaymentSheetParameters(
      setupIntentClientSecret: setupIntent.data['clientSecret'],
      merchantDisplayName: 'Findr Health',
      customerId: setupIntent.data['customerId'],
      customerEphemeralKeySecret: setupIntent.data['ephemeralKey'],
    ),
  );
  
  await Stripe.instance.presentPaymentSheet();
  
  // 3. Refresh payment methods
  ref.invalidate(paymentMethodsProvider);
}
```

### 3.3 Backend Endpoints

```javascript
// POST /api/payments/setup-intent
router.post('/setup-intent', authenticate, async (req, res) => {
  let customer = await getOrCreateStripeCustomer(req.user);
  
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customer.id },
    { apiVersion: '2023-10-16' }
  );
  
  const setupIntent = await stripe.setupIntents.create({
    customer: customer.id,
    payment_method_types: ['card'],
  });
  
  res.json({
    clientSecret: setupIntent.client_secret,
    customerId: customer.id,
    ephemeralKey: ephemeralKey.secret,
  });
});

// GET /api/payments/methods
router.get('/methods', authenticate, async (req, res) => {
  const customer = await getStripeCustomer(req.user);
  if (!customer) return res.json({ methods: [] });
  
  const methods = await stripe.paymentMethods.list({
    customer: customer.stripeCustomerId,
    type: 'card',
  });
  
  res.json({ 
    methods: methods.data,
    defaultMethodId: customer.defaultPaymentMethod 
  });
});

// DELETE /api/payments/methods/:id
// POST /api/payments/methods/:id/default
```

### 3.4 Booking Payment Flow

```dart
// In booking review screen
Future<void> confirmBooking() async {
  // 1. Get saved payment method (or prompt to add)
  final paymentMethod = await selectPaymentMethod();
  
  // 2. Create booking with payment
  final response = await api.post('/bookings', data: {
    ...bookingData,
    paymentMethodId: paymentMethod.id,
  });
  
  // 3. If requires confirmation (3D Secure)
  if (response.data['requiresAction']) {
    await Stripe.instance.handleNextAction(
      response.data['clientSecret']
    );
  }
  
  // 4. Navigate to confirmation
  context.go('/booking/${response.data['bookingId']}/confirmation');
}
```

---

## 4. Profile Page Enhancements

### 4.1 Tile Actions

| Tile | Current | Action Needed |
|------|---------|---------------|
| Edit Profile | Empty | Create EditProfileScreen |
| Favorites | Working ✅ | - |
| Pay Bill | Empty | Create BillsScreen or link to payment |
| Rewards | Empty | Create RewardsScreen (future feature) |
| Payment | Empty | PaymentMethodsScreen |
| Bookings | Working ✅ | - |

### 4.2 Menu Item Actions

| Item | Current | Action Needed |
|------|---------|---------------|
| Settings | Working ✅ | - |
| Help & Support | Empty | Create HelpScreen or link to website |
| Terms of Service | Empty | Open web URL or in-app WebView |
| Privacy Policy | Empty | Open web URL or in-app WebView |
| Log Out | Empty | Implement logout with confirmation |

### 4.3 New Screens Needed

**A. Edit Profile Screen**
```dart
class EditProfileScreen extends StatefulWidget {
  // Fields:
  // - Profile photo upload
  // - First name, Last name
  // - Email (read-only or with verification)
  // - Phone number
  // - Date of birth
  // - Address (for location-based search)
  // - Emergency contact (optional)
}
```

**B. Payment Methods Screen** (covered in section 3)

**C. Help & Support Screen**
```dart
class HelpSupportScreen extends StatelessWidget {
  // Features:
  // - FAQ accordion
  // - Contact support (email, chat)
  // - Report a problem
  // - App version info
}
```

**D. Bills/Transactions Screen**
```dart
class BillsScreen extends ConsumerWidget {
  // Features:
  // - List of past transactions
  // - Payment status (paid, pending, failed)
  // - Receipt download
  // - Dispute option
}
```

### 4.4 Logout Implementation

```dart
void _handleLogout(BuildContext context, WidgetRef ref) {
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Log Out'),
      content: const Text('Are you sure you want to log out?'),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        TextButton(
          onPressed: () async {
            await ref.read(authProvider.notifier).logout();
            context.go('/login');
          },
          style: TextButton.styleFrom(foregroundColor: AppColors.error),
          child: const Text('Log Out'),
        ),
      ],
    ),
  );
}
```

---

## 5. Map Search Integration

### 5.1 Overview

Add a map view to search results showing provider locations.

### 5.2 Implementation Options

| Option | Pros | Cons |
|--------|------|------|
| Google Maps | Best data, familiar | Expensive at scale, API key management |
| Apple Maps (MapKit) | Free on iOS, native feel | iOS only |
| Mapbox | Cheaper, customizable | Less POI data |
| OpenStreetMap | Free, open source | Less polished, manual tile hosting |

**Recommendation:** Google Maps for MVP (better UX), consider Mapbox for cost optimization later.

### 5.3 Flutter Implementation

```dart
// pubspec.yaml
dependencies:
  google_maps_flutter: ^2.5.0
  geolocator: ^10.1.0

// Map search screen
class MapSearchScreen extends ConsumerStatefulWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Map layer
          GoogleMap(
            initialCameraPosition: CameraPosition(
              target: userLocation,
              zoom: 12,
            ),
            markers: providers.map((p) => Marker(
              markerId: MarkerId(p.id),
              position: LatLng(p.latitude, p.longitude),
              infoWindow: InfoWindow(
                title: p.name,
                snippet: '${p.type} • ${p.rating}⭐',
                onTap: () => context.push('/provider/${p.id}'),
              ),
            )).toSet(),
            onCameraMove: _onCameraMove,
            onCameraIdle: _searchInBounds,
          ),
          
          // Search bar overlay
          Positioned(
            top: 50,
            left: 16,
            right: 16,
            child: SearchBar(...),
          ),
          
          // Provider cards at bottom
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: ProviderCardCarousel(providers: visibleProviders),
          ),
        ],
      ),
    );
  }
}
```

### 5.4 Backend: Geo Search

Already partially implemented. Ensure Provider model has:

```javascript
// Provider schema
location: {
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: [Number] // [longitude, latitude]
}

// Index
providerSchema.index({ location: '2dsphere' });
```

---

## 6. Implementation Priority

### Phase 1 (Next 2 weeks)
1. ✅ Service detail sheet fix (completed)
2. ✅ Home search bar fix (completed)
3. Profile page - enable all tiles with placeholder screens
4. Payment methods UI (Stripe integration)
5. Logout functionality

### Phase 2 (Weeks 3-4)
1. Search backend improvements (full-text index)
2. Search filters (price, rating, distance)
3. Edit profile screen
4. Help & support screen

### Phase 3 (Weeks 5-6)
1. Clarity AI integration
2. Conversation history
3. Action buttons in chat

### Phase 4 (Weeks 7-8)
1. Map search view
2. Location-based search
3. Search radius control

---

## 7. Technical Requirements

### Dependencies to Add

```yaml
# pubspec.yaml additions
dependencies:
  flutter_stripe: ^10.1.0      # Payments
  google_maps_flutter: ^2.5.0  # Maps
  geolocator: ^10.1.0          # Location
  flutter_markdown: ^0.6.18    # Chat formatting
  cached_network_image: ^3.3.0 # Image caching (if not present)
```

### Backend Endpoints Needed

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/providers/search` | GET | Enhanced search with filters |
| `/providers/autocomplete` | GET | Search suggestions |
| `/clarity/chat` | POST | AI chat messages |
| `/clarity/conversations` | GET | Chat history |
| `/payments/setup-intent` | POST | Add card |
| `/payments/methods` | GET | List cards |
| `/payments/methods/:id` | DELETE | Remove card |
| `/payments/methods/:id/default` | POST | Set default |
| `/users/profile` | PUT | Update profile |

---

## 8. Success Metrics

| Feature | Metric | Target |
|---------|--------|--------|
| Search | Results relevance | 80%+ users find provider in top 5 |
| Search | Autocomplete usage | 40%+ searches use suggestions |
| Clarity | Session completion | 70%+ conversations lead to action |
| Payments | Card save rate | 60%+ users save a card |
| Map | Usage rate | 30%+ searches use map view |

---

*Document maintained by: Tim Wetherill*  
*Last updated: January 2025*
