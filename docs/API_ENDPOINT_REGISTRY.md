# FINDR HEALTH - API ENDPOINT REGISTRY
## Complete Catalog of All Backend API Endpoints

**Purpose:** Prevent breaking changes and track endpoint dependencies  
**Created:** January 21, 2026  
**Status:** Living Document - Update on every API change  
**Backend URL:** https://fearless-achievement-production.up.railway.app

---

## ⚠️ CRITICAL RULES

1. **NEVER delete an endpoint without checking this registry first**
2. **UPDATE this document immediately when adding/modifying endpoints**
3. **CHECK "Consumers" before making breaking changes**
4. **TEST all consumers after endpoint changes**

---

## 📊 ENDPOINT SUMMARY

| Category | Endpoints | Status |
|----------|-----------|--------|
| Providers | 5 | ✅ Active |
| Admin | 2 | ✅ Active |
| Bookings | 6 | ✅ Active |
| Auth | 4 | ✅ Active |
| Users | 3 | ✅ Active |
| Places | 1 | ✅ Active |
| **TOTAL** | **21** | **All Active** |

---

## 🔍 PROVIDERS ENDPOINTS

### GET /api/providers
**Purpose:** Search and filter providers  
**Authentication:** None (public)  
**Added:** Initial release  
**Last Modified:** January 18, 2026 (added text search)

**Query Parameters:**
```javascript
{
  search: String,        // Text search across multiple fields
  providerType: String,  // Filter by type (medical, dental, etc)
  lat: Number,          // Latitude for location search
  lng: Number,          // Longitude for location search
  radius: Number,       // Search radius in miles (default: 25)
  verified: Boolean,    // Filter verified providers
  featured: Boolean,    // Filter featured providers
  limit: Number,        // Results per page (default: 20)
  skip: Number          // Pagination offset
}
```

**Response:**
```javascript
{
  success: Boolean,
  providers: Array,
  total: Number,
  message: String
}
```

**Consumers:**
- ✅ Mobile App (Search Screen)
- ✅ Mobile App (Home Screen - Near You, Top Rated)
- ✅ Provider Portal (Provider Discovery)

**Dependencies:**
- MongoDB text search index (text_search_idx)
- Geospatial queries require location coordinates

**Breaking Changes:**
- None yet

---

### GET /api/providers/:id
**Purpose:** Get single provider details  
**Authentication:** None (public)  
**Added:** Initial release

**URL Parameters:**
- `id` - MongoDB ObjectId of provider

**Response:**
```javascript
{
  success: Boolean,
  provider: Object,
  message: String
}
```

**Consumers:**
- ✅ Mobile App (Provider Detail Screen)
- ✅ Mobile App (Booking Flow)
- ✅ Admin Dashboard (Provider Edit)

**Breaking Changes:**
- None yet

---

### POST /api/providers
**Purpose:** Create new provider  
**Authentication:** Required (provider/admin)  
**Added:** Initial release

**Request Body:**
```javascript
{
  practiceName: String (required),
  email: String (required),
  phone: String (required),
  providerTypes: Array (required),
  address: Object (required),
  photos: Array,
  services: Array,
  // ... see Provider model for full schema
}
```

**Response:**
```javascript
{
  success: Boolean,
  provider: Object,
  message: String
}
```

**Consumers:**
- ✅ Provider Portal (Onboarding)
- ✅ Admin Dashboard (Manual Provider Creation)

**Breaking Changes:**
- None yet

---

### PUT /api/providers/:id
**Purpose:** Update provider details  
**Authentication:** Required (provider/admin)  
**Added:** Initial release

**URL Parameters:**
- `id` - MongoDB ObjectId of provider

**Request Body:** Same as POST, all fields optional

**Response:**
```javascript
{
  success: Boolean,
  provider: Object,
  message: String
}
```

**Consumers:**
- ✅ Provider Portal (Profile Updates)
- ✅ Admin Dashboard (Provider Management)

**Breaking Changes:**
- None yet

---

### DELETE /api/providers/:id
**Purpose:** Delete provider (soft delete)  
**Authentication:** Required (admin only)  
**Added:** Initial release

**URL Parameters:**
- `id` - MongoDB ObjectId of provider

**Response:**
```javascript
{
  success: Boolean,
  message: String
}
```

**Consumers:**
- ✅ Admin Dashboard (Provider Management)

**Breaking Changes:**
- None yet

---

## 👤 ADMIN ENDPOINTS

### GET /api/admin/providers
**Purpose:** Get provider list for admin dashboard  
**Authentication:** Required (admin)  
**Added:** January 21, 2026  
**Status:** ✅ CRITICAL - Admin dashboard depends on this

**Query Parameters:**
```javascript
{
  limit: Number,        // Default: 1000
  skip: Number,         // Default: 0
  search: String,       // Text search
  status: String,       // Filter by status
  type: String,         // Filter by provider type
  verified: Boolean,    // Filter verified
  featured: Boolean     // Filter featured
}
```

**Response:**
```javascript
{
  success: Boolean,
  providers: Array,
  total: Number,
  limit: Number,
  skip: Number
}
```

**Consumers:**
- ✅ Admin Dashboard (Provider List - CRITICAL DEPENDENCY)

**INCIDENT LOG:**
- **2026-01-21:** Endpoint was missing, caused admin dashboard 404 error
- **Resolution:** Added endpoint, documented here to prevent recurrence

**Breaking Changes:**
- None yet

---

### POST /api/admin/create-search-index
**Purpose:** Manually create/recreate text search index  
**Authentication:** Required (admin)  
**Added:** January 18, 2026

**Request Body:** None

**Response:**
```javascript
{
  success: Boolean,
  message: String,
  weights: Object
}
```

**Consumers:**
- ✅ Admin Dashboard (Database Utilities)
- ✅ Manual via Postman/curl for maintenance

**Breaking Changes:**
- None yet

---

## 📅 BOOKINGS ENDPOINTS

### GET /api/bookings
**Purpose:** Get all bookings (admin view)  
**Authentication:** Required (admin)  
**Added:** Initial release

**Query Parameters:**
```javascript
{
  status: String,       // Filter by status
  providerId: String,   // Filter by provider
  userId: String,       // Filter by user
  limit: Number,
  skip: Number
}
```

**Response:**
```javascript
{
  success: Boolean,
  bookings: Array,
  total: Number
}
```

**Consumers:**
- ✅ Admin Dashboard (Bookings Management)

---

### GET /api/bookings/:id
**Purpose:** Get single booking details  
**Authentication:** Required (user must own booking or be provider/admin)  
**Added:** Initial release  
**Last Modified:** January 17, 2026 (deep linking support)

**URL Parameters:**
- `id` - MongoDB ObjectId of booking

**Response:**
```javascript
{
  success: Boolean,
  booking: Object
}
```

**Consumers:**
- ✅ Mobile App (Booking Detail Screen)
- ✅ Mobile App (Deep Linking from Notifications)
- ✅ Provider Portal (Booking Management)

**Breaking Changes:**
- None yet

---

### POST /api/bookings
**Purpose:** Create new booking  
**Authentication:** Required (user)  
**Added:** Initial release

**Request Body:**
```javascript
{
  providerId: String (required),
  userId: String (required),
  serviceId: String (required),
  requestedDate: String (required),
  requestedTime: String (required),
  paymentType: String,  // 'at_visit', 'prepay', 'card_on_file'
  notes: String
}
```

**Response:**
```javascript
{
  success: Boolean,
  booking: Object,
  message: String
}
```

**Consumers:**
- ✅ Mobile App (Booking Flow)

**Breaking Changes:**
- None yet

---

### PUT /api/bookings/:id/confirm
**Purpose:** Provider confirms booking  
**Authentication:** Required (provider or admin)  
**Added:** Initial release

**URL Parameters:**
- `id` - MongoDB ObjectId of booking

**Request Body:**
```javascript
{
  confirmedDate: String,
  confirmedTime: String
}
```

**Response:**
```javascript
{
  success: Boolean,
  booking: Object
}
```

**Consumers:**
- ✅ Provider Portal (Booking Management)

---

### PUT /api/bookings/:id/decline
**Purpose:** Provider declines booking  
**Authentication:** Required (provider or admin)  
**Added:** Initial release

**URL Parameters:**
- `id` - MongoDB ObjectId of booking

**Request Body:**
```javascript
{
  reason: String
}
```

**Response:**
```javascript
{
  success: Boolean,
  booking: Object
}
```

**Consumers:**
- ✅ Provider Portal (Booking Management)

---

### PUT /api/bookings/:id/cancel
**Purpose:** User or provider cancels booking  
**Authentication:** Required (user, provider, or admin)  
**Added:** Initial release

**URL Parameters:**
- `id` - MongoDB ObjectId of booking

**Request Body:**
```javascript
{
  cancelledBy: String,  // 'user' or 'provider'
  reason: String
}
```

**Response:**
```javascript
{
  success: Boolean,
  booking: Object
}
```

**Consumers:**
- ✅ Mobile App (Cancel Booking Flow)
- ✅ Provider Portal (Cancel Booking)

---

## 🔐 AUTH ENDPOINTS

### POST /api/auth/register
**Purpose:** User registration  
**Authentication:** None  
**Added:** Initial release

**Request Body:**
```javascript
{
  email: String (required),
  password: String (required),
  firstName: String (required),
  lastName: String (required),
  phone: String
}
```

**Response:**
```javascript
{
  success: Boolean,
  token: String,
  user: Object
}
```

**Consumers:**
- ✅ Mobile App (Registration Screen)

---

### POST /api/auth/login
**Purpose:** User login  
**Authentication:** None  
**Added:** Initial release

**Request Body:**
```javascript
{
  email: String (required),
  password: String (required)
}
```

**Response:**
```javascript
{
  success: Boolean,
  token: String,
  user: Object
}
```

**Consumers:**
- ✅ Mobile App (Login Screen)
- ✅ Provider Portal (Login Screen)

---

### POST /api/auth/refresh
**Purpose:** Refresh JWT token  
**Authentication:** Required (valid refresh token)  
**Added:** Initial release

**Request Body:**
```javascript
{
  refreshToken: String (required)
}
```

**Response:**
```javascript
{
  success: Boolean,
  token: String
}
```

**Consumers:**
- ✅ Mobile App (Background token refresh)

---

### POST /api/auth/logout
**Purpose:** User logout (invalidate token)  
**Authentication:** Required  
**Added:** Initial release

**Request Body:** None

**Response:**
```javascript
{
  success: Boolean,
  message: String
}
```

**Consumers:**
- ✅ Mobile App (Logout)
- ✅ Provider Portal (Logout)

---

## 👥 USERS ENDPOINTS

### GET /api/users/me
**Purpose:** Get current user profile  
**Authentication:** Required  
**Added:** Initial release  
**Last Modified:** January 18, 2026 (fixed route conflict)

**Response:**
```javascript
{
  success: Boolean,
  user: Object
}
```

**Consumers:**
- ✅ Mobile App (Profile Screen)
- ✅ Mobile App (App Initialization)

**INCIDENT LOG:**
- **2026-01-18:** Route conflict with /users/:id fixed by reordering routes

---

### GET /api/users/:id/bookings
**Purpose:** Get user's booking history  
**Authentication:** Required (user must match or be admin)  
**Added:** Initial release  
**Last Modified:** January 18, 2026 (fixed populate fields)

**URL Parameters:**
- `id` - User ID

**Query Parameters:**
```javascript
{
  status: String,       // Filter by status
  upcoming: Boolean     // Only upcoming bookings
}
```

**Response:**
```javascript
{
  success: Boolean,
  bookings: Array
}
```

**Consumers:**
- ✅ Mobile App (Home Screen - Next Appointment)
- ✅ Mobile App (Bookings Screen)

**INCIDENT LOG:**
- **2026-01-18:** Fixed populate field names (provider → providerId)

---

### PUT /api/users/:id
**Purpose:** Update user profile  
**Authentication:** Required (user must match or be admin)  
**Added:** Initial release

**URL Parameters:**
- `id` - User ID

**Request Body:** All fields optional
```javascript
{
  firstName: String,
  lastName: String,
  phone: String,
  email: String,
  address: Object,
  preferences: Object
}
```

**Response:**
```javascript
{
  success: Boolean,
  user: Object
}
```

**Consumers:**
- ✅ Mobile App (Profile Edit Screen)

---

## 📍 PLACES ENDPOINTS

### GET /api/places/autocomplete
**Purpose:** Google Places autocomplete for address entry  
**Authentication:** None  
**Added:** Initial release

**Query Parameters:**
```javascript
{
  input: String (required),  // User's input text
  types: String              // Optional: restrict to certain place types
}
```

**Response:**
```javascript
{
  success: Boolean,
  predictions: Array
}
```

**Consumers:**
- ✅ Mobile App (Address Entry)
- ✅ Provider Portal (Address Entry)

**External Dependencies:**
- Google Places API (requires API key)
- Costs money per request

---

## 🚨 BREAKING CHANGE PROTOCOL

When making breaking changes to any endpoint:

### Step 1: Check Consumers
Look up the endpoint in this document and identify all consumers.

### Step 2: Notify Stakeholders
- Mobile app team
- Admin dashboard team
- Provider portal team

### Step 3: Version or Deprecate
- **Option A:** Create new versioned endpoint (e.g., /api/v2/providers)
- **Option B:** Add deprecation warning, set sunset date

### Step 4: Update Consumers
Ensure all consumers updated before removing old endpoint.

### Step 5: Document Change
Update this registry with:
- Date of change
- What changed
- Migration path
- Deprecation date (if applicable)

---

## 📝 CHANGE LOG

### January 21, 2026
- **ADDED:** `GET /api/admin/providers` - Admin dashboard provider list
- **INCIDENT:** Endpoint was missing, causing admin dashboard 404
- **RESOLUTION:** Added endpoint and documented to prevent recurrence

### January 18, 2026
- **MODIFIED:** `GET /api/providers` - Added text search capability
- **ADDED:** `POST /api/admin/create-search-index` - Manual index creation
- **FIXED:** `GET /api/users/:id/bookings` - Corrected populate field names
- **FIXED:** `GET /api/users/me` - Fixed route ordering conflict

### January 17, 2026
- **MODIFIED:** `GET /api/bookings/:id` - Enhanced for deep linking support

---

## 🔄 MAINTENANCE SCHEDULE

**Weekly:**
- [ ] Review this document for accuracy
- [ ] Check for undocumented endpoints
- [ ] Verify all consumers still active

**Monthly:**
- [ ] Audit deprecated endpoints
- [ ] Review breaking change schedule
- [ ] Update consumer list

**Per Deployment:**
- [ ] Update this document if API changed
- [ ] Test all documented consumers
- [ ] Verify no breaking changes

---

## 📞 CONTACT

**Questions about endpoints?**
- Engineering Lead: Tim Wetherill
- Backend Repo: carrotly-provider-database
- API Base URL: https://fearless-achievement-production.up.railway.app

**Before deleting or breaking an endpoint:**
- Check this document
- Verify no consumers
- Get approval from engineering lead

---

*Last Updated: January 21, 2026*  
*Version: 1.0*  
*Status: Living Document*  
*Total Endpoints: 21*  
*Critical Endpoints: 5 (providers, admin/providers, bookings/:id, users/me, users/:id/bookings)*
