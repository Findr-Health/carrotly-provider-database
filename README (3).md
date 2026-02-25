# Backend Database Updates - Deployment Guide

**Date:** December 30, 2024  
**Purpose:** Add missing fields and collections for mobile app integration

---

## Summary of Changes

### Updated Models
1. **Provider.js** - Added: `description`, `location.coordinates`, `rating`, `reviewCount`, `isVerified`, `isFeatured`
2. **User.js** - Added: `favorites[]`, `notificationPreferences`, `deviceTokens`

### New Models
3. **Review.js** - User reviews for providers
4. **Booking.js** - Appointment bookings

### New Routes
5. **users.js** - Registration, login, profile, favorites
6. **reviews.js** - CRUD for reviews
7. **bookings.js** - CRUD for bookings
8. **search.js** - Enhanced search with geo queries
9. **providerAdmin.js** - Admin endpoints for verified badge toggle

---

## Deployment Steps

### Step 1: Copy Model Files

```bash
cd ~/Desktop/carrotly-provider-database/backend

# Backup existing Provider model
cp models/Provider.js models/Provider.js.backup

# Copy new/updated models
cp ~/Downloads/backend-updates/models/Provider.js models/
cp ~/Downloads/backend-updates/models/User.js models/
cp ~/Downloads/backend-updates/models/Review.js models/
cp ~/Downloads/backend-updates/models/Booking.js models/
```

### Step 2: Copy Route Files

```bash
cp ~/Downloads/backend-updates/routes/users.js routes/
cp ~/Downloads/backend-updates/routes/reviews.js routes/
cp ~/Downloads/backend-updates/routes/bookings.js routes/
cp ~/Downloads/backend-updates/routes/search.js routes/
cp ~/Downloads/backend-updates/routes/providerAdmin.js routes/
```

### Step 3: Update server.js

Add these imports at the top with other route imports:

```javascript
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');
const bookingRoutes = require('./routes/bookings');
const searchRoutes = require('./routes/search');
const providerAdminRoutes = require('./routes/providerAdmin');
```

Add these route mounts (after existing app.use statements):

```javascript
// User routes
app.use('/api/users', userRoutes);

// Review routes  
app.use('/api/reviews', reviewRoutes);

// Booking routes
app.use('/api/bookings', bookingRoutes);

// Search routes (enhanced)
app.use('/api/search', searchRoutes);

// Admin provider management
app.use('/api/admin/providers', providerAdminRoutes);
```

### Step 4: Deploy

```bash
cd ~/Desktop/carrotly-provider-database
git add .
git commit -m "Add user, review, booking models and routes for mobile app"
git push
```

Railway will auto-deploy.

---

## New API Endpoints

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | Register new user |
| POST | `/api/users/login` | Login user |
| GET | `/api/users/profile` | Get user profile (auth) |
| PUT | `/api/users/profile` | Update profile (auth) |
| PUT | `/api/users/password` | Change password (auth) |
| GET | `/api/users/favorites` | Get favorites (auth) |
| POST | `/api/users/favorites/:providerId` | Add favorite (auth) |
| DELETE | `/api/users/favorites/:providerId` | Remove favorite (auth) |

### Review Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews/provider/:providerId` | Get provider reviews |
| POST | `/api/reviews` | Submit review (auth) |
| PUT | `/api/reviews/:reviewId` | Update review (auth) |
| DELETE | `/api/reviews/:reviewId` | Delete review (auth) |
| POST | `/api/reviews/:reviewId/helpful` | Mark helpful (auth) |
| GET | `/api/reviews/pending/mine` | Get pending reviews (auth) |

### Booking Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | Get user bookings (auth) |
| GET | `/api/bookings/upcoming` | Get upcoming bookings (auth) |
| GET | `/api/bookings/past` | Get past bookings (auth) |
| GET | `/api/bookings/:bookingId` | Get booking detail (auth) |
| POST | `/api/bookings` | Create booking (auth) |
| PUT | `/api/bookings/:bookingId` | Reschedule (auth) |
| POST | `/api/bookings/:bookingId/cancel` | Cancel booking (auth) |
| POST | `/api/bookings/:bookingId/confirm` | Confirm booking (auth) |

### Enhanced Search Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search/providers` | Search with geo, filters |
| GET | `/api/search/featured` | Get featured providers |
| GET | `/api/search/types` | Get provider type list |
| GET | `/api/search/autocomplete` | Search autocomplete |

### Admin Provider Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/api/admin/providers/:id/verified` | Toggle verified badge |
| PATCH | `/api/admin/providers/:id/featured` | Toggle featured status |
| PATCH | `/api/admin/providers/:id/coordinates` | Set lat/lng |
| GET | `/api/admin/providers/verified` | List verified providers |
| GET | `/api/admin/providers/featured` | List featured providers |

---

## Admin Dashboard Updates Needed

After deploying, update the admin dashboard to add:

### Provider Detail Page - Add Toggle Buttons

```jsx
// In ProviderDetail.jsx, add toggle buttons:

<div className="flex items-center gap-4">
  <label className="flex items-center gap-2">
    <input 
      type="checkbox" 
      checked={provider.isVerified}
      onChange={(e) => toggleVerified(provider._id, e.target.checked)}
    />
    <span>Verified Badge</span>
  </label>
  
  <label className="flex items-center gap-2">
    <input 
      type="checkbox" 
      checked={provider.isFeatured}
      onChange={(e) => toggleFeatured(provider._id, e.target.checked)}
    />
    <span>Featured</span>
  </label>
</div>
```

### API Functions

```javascript
// In api.js, add:

toggleVerified: (providerId, isVerified) => 
  api.patch(`/admin/providers/${providerId}/verified`, { isVerified }),

toggleFeatured: (providerId, isFeatured) => 
  api.patch(`/admin/providers/${providerId}/featured`, { isFeatured }),
```

---

## Testing After Deploy

### Test User Registration
```bash
curl -X POST "https://fearless-achievement-production.up.railway.app/api/users/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'
```

### Test Provider Search
```bash
curl "https://fearless-achievement-production.up.railway.app/api/search/providers?lat=45.677&lng=-111.042&radius=50"
```

### Test Verified Toggle (Admin)
```bash
curl -X PATCH "https://fearless-achievement-production.up.railway.app/api/admin/providers/PROVIDER_ID/verified" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isVerified": true}'
```

---

## Populate Coordinates for Existing Providers

After deploy, you'll need to add coordinates to existing providers for geo search to work.

Option 1: Manual via API
```bash
curl -X PATCH "https://fearless-achievement-production.up.railway.app/api/admin/providers/PROVIDER_ID/coordinates" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 45.6770, "longitude": -111.0429}'
```

Option 2: Geocoding script (use Google Maps or OpenStreetMap API to convert addresses to coordinates)

---

## Files Included

```
backend-updates/
├── models/
│   ├── Provider.js    (updated)
│   ├── User.js        (updated)
│   ├── Review.js      (new)
│   └── Booking.js     (new)
├── routes/
│   ├── users.js       (new)
│   ├── reviews.js     (new)
│   ├── bookings.js    (new)
│   ├── search.js      (new)
│   └── providerAdmin.js (new)
└── README.md
```
