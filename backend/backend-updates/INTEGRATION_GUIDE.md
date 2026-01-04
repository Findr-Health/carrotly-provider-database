# Backend Updates - Integration Guide

## Files to Update

### 1. Replace `models/Provider.js`

Copy the new Provider.js to replace your existing one:

```bash
# In your backend directory
cp /path/to/backend-updates/models/Provider.js ./models/Provider.js
```

**Changes made:**
- Services now support `shortDescription`, `basePrice`, `hasVariants`, `variants[]`, `sortOrder`
- Team members now support `rating`, `reviewCount`, `serviceIds[]`
- Added provider-level `rating`, `reviewCount`
- Added `cancellationPolicy` field
- Added geospatial index for location queries
- Added text index for search

---

### 2. Add New Routes to `server.js`

Add these lines to your server.js:

```javascript
// Add after existing route imports
const providerServicesRoutes = require('./routes/providerServices');

// Add after existing route registrations
app.use('/api/providers', providerServicesRoutes);
```

Or merge the routes into your existing `routes/providers.js`.

---

### 3. Run Migration Script

```bash
# Make sure you have dotenv installed
npm install dotenv

# Run migration
node migrations/addServiceAndTeamFields.js
```

This updates all existing providers with the new fields.

---

## New API Endpoints

### Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/providers/:id/services/grouped` | Services grouped by category |
| PUT | `/api/providers/:id/services/:serviceId` | Update a service |
| POST | `/api/providers/:id/services/:serviceId/variants` | Add variant |
| DELETE | `/api/providers/:id/services/:serviceId/variants/:variantId` | Remove variant |

### Team-Service Linking

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/providers/:id/team/for-service/:serviceId` | Team members for a service |
| GET | `/api/providers/:id/team/:memberId/services` | Services a member can perform |
| PUT | `/api/providers/:id/team/:memberId/services` | Update member's services |

---

## Example API Calls

### Get Grouped Services

```bash
curl https://your-api.railway.app/api/providers/PROVIDER_ID/services/grouped
```

**Response:**
```json
{
  "providerId": "...",
  "totalServices": 5,
  "categories": [
    {
      "name": "Preventive",
      "serviceCount": 2,
      "services": [
        {
          "id": "...",
          "name": "Dental Cleaning",
          "shortDescription": "Professional cleaning...",
          "duration": 45,
          "basePrice": 80,
          "hasVariants": true,
          "variants": [
            { "name": "Standard", "price": 80, "duration": 45 },
            { "name": "Deep Clean", "price": 120, "duration": 60 }
          ]
        }
      ]
    }
  ]
}
```

### Get Team Members for a Service

```bash
curl https://your-api.railway.app/api/providers/PROVIDER_ID/team/for-service/SERVICE_ID
```

**Response:**
```json
{
  "providerId": "...",
  "serviceId": "...",
  "teamMembers": [
    {
      "id": "...",
      "name": "Dr. John Smith",
      "title": "Dentist",
      "photo": "https://...",
      "rating": 4.8,
      "reviewCount": 42
    }
  ],
  "totalCount": 1
}
```

### Link Team Member to Services

```bash
curl -X PUT https://your-api.railway.app/api/providers/PROVIDER_ID/team/MEMBER_ID/services \
  -H "Content-Type: application/json" \
  -d '{"serviceIds": ["SERVICE_ID_1", "SERVICE_ID_2"]}'
```

**Response:**
```json
{
  "success": true,
  "teamMember": {
    "id": "...",
    "name": "Dr. John Smith",
    "serviceIds": ["SERVICE_ID_1", "SERVICE_ID_2"]
  }
}
```

### Add Service Variant

```bash
curl -X POST https://your-api.railway.app/api/providers/PROVIDER_ID/services/SERVICE_ID/variants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Cleaning",
    "description": "Includes whitening touch-up",
    "price": 150,
    "duration": 60,
    "isDefault": false
  }'
```

---

## Testing Checklist

After deployment, verify:

- [ ] `GET /api/providers/:id` returns new fields (rating, teamMembers with serviceIds)
- [ ] `GET /api/providers/:id/services/grouped` returns categories
- [ ] `PUT /api/providers/:id/team/:memberId/services` updates serviceIds
- [ ] `GET /api/providers/:id/team/for-service/:serviceId` filters correctly
- [ ] Migration script runs without errors
- [ ] Existing provider data preserved

---

## Rollback Plan

If issues occur:

1. Keep backup of original Provider.js
2. Migration only adds fields, doesn't remove data
3. New routes are additive - removing them won't break existing functionality

```bash
# Restore original schema if needed
cp ./models/Provider.js.backup ./models/Provider.js
```
