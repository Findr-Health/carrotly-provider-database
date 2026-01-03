# Service Category System - Integration Guide

## Overview

This guide explains how to integrate the new service category system into your existing Findr Health backend.

---

## Files Created

| File | Purpose |
|------|---------|
| `models/ServiceTemplate.js` | MongoDB model for service templates |
| `models/serviceSchema.js` | Updated service schema for providers |
| `routes/serviceTemplates.js` | API routes for service templates |
| `routes/providerServices.js` | Updated provider service CRUD routes |
| `seeds/seedServiceTemplates.js` | Seed script for all service templates |
| `migrations/migrateProviderServices.js` | Migration for existing providers |

---

## Integration Steps

### Step 1: Add Files to Your Backend

Copy these files to your `carrotly-provider-database/backend/` directory:

```bash
# From the files I created, copy to your backend:
models/ServiceTemplate.js
models/serviceSchema.js
routes/serviceTemplates.js
routes/providerServices.js
seeds/seedServiceTemplates.js
migrations/migrateProviderServices.js
```

### Step 2: Register Routes in server.js

Add these lines to your `server.js`:

```javascript
// At the top with other requires
const serviceTemplateRoutes = require('./routes/serviceTemplates');
const providerServiceRoutes = require('./routes/providerServices');

// With your other app.use() statements
app.use('/api/service-templates', serviceTemplateRoutes);
app.use('/api/providers', providerServiceRoutes);
```

### Step 3: Run the Seed Script

This creates all the service templates in your database:

```bash
cd backend
node seeds/seedServiceTemplates.js
```

**Expected output:**
```
Connected to MongoDB
Cleared existing service templates
Successfully seeded 127 service templates

Templates by provider type:
  Dental: 14 templates
  Medical: 13 templates
  Urgent Care: 14 templates
  Mental Health: 12 templates
  Skincare: 14 templates
  Massage: 14 templates
  Fitness: 11 templates
  Yoga/Pilates: 9 templates
  Nutrition: 10 templates
  Pharmacy/Rx: 16 templates

Database disconnected. Seeding complete!
```

### Step 4: Migrate Existing Providers

This updates existing provider services to the new format:

```bash
cd backend
node migrations/migrateProviderServices.js
```

**Expected output:**
```
Connected to MongoDB
Found 26 providers to process
  ✓ Updated Test waiver: 3 services
  ✓ Updated Summit Health Partners MT: 5 services
  ...

========================================
Migration Summary:
  Total providers: 26
  Updated: 20
  Skipped: 6
  Errors: 0
========================================

Database disconnected. Migration complete!
```

### Step 5: Deploy to Railway

Push your changes to GitHub:

```bash
git add .
git commit -m "Add service category system"
git push origin main
```

Railway will automatically redeploy.

---

## API Endpoints Added

### Service Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/service-templates?providerType=Dental` | Get templates for provider type |
| GET | `/api/service-templates/categories?providerType=Dental` | Get allowed categories |
| GET | `/api/service-templates/grouped?providerType=Dental` | Get templates grouped by category |
| GET | `/api/service-templates/popular?providerType=Dental` | Get popular templates |
| POST | `/api/service-templates/bulk-create-services` | Convert templates to services |

### Provider Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/providers/:id/services` | Get all services |
| GET | `/api/providers/:id/services/grouped` | Get services grouped by category |
| GET | `/api/providers/:id/services/:serviceId` | Get single service |
| POST | `/api/providers/:id/services` | Add a service |
| POST | `/api/providers/:id/services/bulk` | Add multiple services |
| PUT | `/api/providers/:id/services/:serviceId` | Update a service |
| DELETE | `/api/providers/:id/services/:serviceId` | Delete a service |
| POST | `/api/providers/:id/services/:serviceId/variants` | Add variant |
| PUT | `/api/providers/:id/services/:serviceId/variants/:variantId` | Update variant |
| DELETE | `/api/providers/:id/services/:serviceId/variants/:variantId` | Delete variant |
| PUT | `/api/providers/:id/services/reorder` | Reorder services |

---

## Testing the Integration

### 1. Test Service Templates

```bash
# Get templates for Dental providers
curl "https://fearless-achievement-production.up.railway.app/api/service-templates?providerType=Dental"

# Get categories for Dental
curl "https://fearless-achievement-production.up.railway.app/api/service-templates/categories?providerType=Dental"

# Get popular templates for quick onboarding
curl "https://fearless-achievement-production.up.railway.app/api/service-templates/popular?providerType=Dental"
```

### 2. Test Provider Services

```bash
# Get services for a provider
curl "https://fearless-achievement-production.up.railway.app/api/providers/PROVIDER_ID/services"

# Get services grouped by category
curl "https://fearless-achievement-production.up.railway.app/api/providers/PROVIDER_ID/services/grouped"
```

### 3. Test Adding Service from Template

```bash
curl -X POST "https://fearless-achievement-production.up.railway.app/api/providers/PROVIDER_ID/services" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dental Cleaning",
    "description": "Professional teeth cleaning",
    "category": "Preventive",
    "basePrice": 100,
    "duration": 45
  }'
```

---

## Provider Portal Updates Needed

After backend integration, update the provider onboarding to use the new system:

### Current Step 4 (Services)

Replace the current service form with:

1. **Quick Start Section**
   - Fetch templates: `GET /api/service-templates/popular?providerType={type}`
   - Show checkboxes with editable prices
   - "Add Selected" button calls `POST /api/providers/:id/services/bulk`

2. **Custom Service Form**
   - Category dropdown populated from `GET /api/service-templates/categories?providerType={type}`
   - Standard name, description, price, duration fields
   - Optional "Add pricing tiers" checkbox for variants

### Example React Implementation

```jsx
// Fetch templates on load
useEffect(() => {
  const fetchTemplates = async () => {
    const res = await api.get(`/service-templates/popular?providerType=${providerType}`);
    setTemplates(res.data.templates);
  };
  fetchTemplates();
}, [providerType]);

// Quick add selected templates
const handleQuickAdd = async () => {
  const selectedServices = templates
    .filter(t => selectedIds.includes(t._id))
    .map(t => ({
      name: t.name,
      description: t.description,
      shortDescription: t.shortDescription,
      category: t.category,
      basePrice: customPrices[t._id] || t.suggestedPriceMin,
      duration: t.suggestedDuration,
      hasVariants: t.suggestedVariants?.length > 0,
      variants: t.suggestedVariants?.map(v => ({
        name: v.name,
        description: v.description,
        price: (customPrices[t._id] || t.suggestedPriceMin) + v.priceModifier,
        duration: t.suggestedDuration + v.durationModifier
      }))
    }));

  await api.post(`/providers/${providerId}/services/bulk`, { services: selectedServices });
};
```

---

## Mobile App Updates Needed

After backend is updated, the mobile app will automatically receive:

1. **Services with Categories** - Services now have a `category` field
2. **Variants Support** - Services may have `variants` array with pricing options
3. **Grouped Endpoint** - Use `/services/grouped` for category tabs

### Example: Updating Provider Detail Screen

```dart
// Fetch grouped services
final response = await api.get('/providers/$id/services/grouped');

// Response structure:
// {
//   "categories": ["Preventive", "Restorative", "Cosmetic", "Surgical"],
//   "grouped": {
//     "Preventive": [{ service1 }, { service2 }],
//     "Restorative": [{ service3 }],
//     ...
//   }
// }

// Build tabs from categories
TabBar(
  tabs: categories.map((c) => Tab(text: c)).toList(),
)

// Show services for selected category
ListView.builder(
  itemCount: grouped[selectedCategory].length,
  itemBuilder: (context, index) {
    final service = grouped[selectedCategory][index];
    return ServiceTile(service: service);
  },
)
```

---

## Summary

1. ✅ Copy files to backend
2. ✅ Register routes in server.js
3. ✅ Run seed script
4. ✅ Run migration script
5. ✅ Deploy to Railway
6. ⏳ Update provider portal (next step)
7. ⏳ Update mobile app (after portal)

---

*Integration Guide v1.0*
*January 3, 2026*
