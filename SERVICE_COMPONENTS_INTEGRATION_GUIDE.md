# Findr Health - Service Category System Integration Guide

## Overview

This guide explains how to integrate the new modular service components into the provider portal. The components are designed to work in both the onboarding flow (`CompleteProfile.tsx`) and the dashboard (`EditProfile.tsx`).

---

## Architecture

```
src/
├── components/
│   └── services/
│       ├── index.ts              # Exports all components
│       ├── ServiceSelector.tsx   # Main selection UI (templates + custom)
│       ├── ServiceList.tsx       # Display services by category
│       └── ServiceEditor.tsx     # Edit modal with variants
│
├── hooks/
│   └── useServiceTemplates.ts    # API hook for templates
│
├── types/
│   └── services.ts               # TypeScript definitions
│
├── constants/
│   └── providerTypes.ts          # Provider types + category icons
│
└── migrations/
    └── normalizeProviderTypes.js # Database migration script
```

---

## Step 1: Run the Database Migration

Before updating the frontend, normalize provider type names in the database:

```bash
cd ~/Desktop/carrotly-provider-database/backend

# Copy the migration file
cp ~/Downloads/findr-refactor/migrations/normalizeProviderTypes.js migrations/

# Run the migration
MONGODB_URI="mongodb://mongo:JrpNqGLpSvCpisOVjgHqrCjSIyeNBFuG@shinkansen.proxy.rlwy.net:56018" node migrations/normalizeProviderTypes.js
```

This updates legacy names like `Skincare/Aesthetics` → `Skincare`.

---

## Step 2: Copy Files to Provider Portal

```bash
cd ~/Downloads/findr-refactor

# Copy to provider portal
cp -r components/services ~/Desktop/carrotly-provider-mvp/src/components/
cp -r hooks ~/Desktop/carrotly-provider-mvp/src/
cp types/services.ts ~/Desktop/carrotly-provider-mvp/src/types/
cp constants/providerTypes.ts ~/Desktop/carrotly-provider-mvp/src/constants/
```

---

## Step 3: Update CompleteProfile.tsx

### 3.1 Add Imports

At the top of `CompleteProfile.tsx`, add:

```tsx
// New imports for service components
import { ServiceSelector, ServiceList, Service } from '../components/services';
import { PROVIDER_TYPES, normalizeProviderTypes } from '../constants/providerTypes';
```

### 3.2 Replace Provider Types Definition

**Remove** the hardcoded `providerTypes` array (around line 18-28):

```tsx
// DELETE THIS:
const providerTypes = [
  { id: 'Medical', label: 'Medical', icon: '🏥' },
  { id: 'Urgent Care', label: 'Urgent Care', icon: '🚑' },
  // ... etc
];
```

**Replace with import:**

```tsx
import { PROVIDER_TYPES } from '../constants/providerTypes';

// Use PROVIDER_TYPES instead of providerTypes throughout the file
```

### 3.3 Update Service State

**Change** the service state from ID-based to object-based:

```tsx
// OLD:
const [selectedServices, setSelectedServices] = useState<string[]>([]);
const [customizedServices, setCustomizedServices] = useState<Record<string, { price: number; duration: number }>>({});

// NEW:
const [services, setServices] = useState<Service[]>([]);
```

### 3.4 Remove Hardcoded Services

**Delete** the entire `allServices` object (around lines 43-130):

```tsx
// DELETE THIS ENTIRE BLOCK:
const allServices: Record<string, Service[]> = {
  'Medical': [...],
  'Dental': [...],
  // ... all the hardcoded services
};
```

### 3.5 Replace Section 4 (Services)

Find the services section (around line 1070-1300) and replace it:

**OLD CODE (DELETE):**
```tsx
{/* SECTION 4: SERVICES */}
<div className="pb-8 border-b border-gray-200">
  <h2 className="text-2xl font-bold text-gray-900 mb-2">4. Services</h2>
  {/* ... all the old services UI ... */}
</div>
```

**NEW CODE (REPLACE WITH):**
```tsx
{/* SECTION 4: SERVICES */}
<div className="pb-8 border-b border-gray-200">
  <h2 className="text-2xl font-bold text-gray-900 mb-2">4. Services</h2>
  <p className="text-gray-600 mb-6">
    Select services you offer and customize pricing. Add from templates or create custom services.
  </p>
  
  <ServiceSelector
    providerTypes={selectedTypes}
    selectedServices={services}
    onServicesChange={setServices}
    mode="onboarding"
  />
  
  {services.length === 0 && (
    <p className="text-sm text-red-600 mt-2">Add at least one service to continue</p>
  )}
</div>
```

### 3.6 Update Submit Logic

In `handleSubmit` and `handleSubmitWithoutSignature`, update how services are formatted:

**OLD:**
```tsx
const servicesData = getAllServicesWithCustom()
  .filter(s => selectedServices.includes(s.id))
  .map(service => {
    const details = getServiceDetails(service);
    return {
      id: service.id,
      name: service.name,
      category: service.category,
      duration: details.duration,
      price: details.price
    };
  });
```

**NEW:**
```tsx
const servicesData = services.map(service => ({
  name: service.name,
  description: service.description,
  shortDescription: service.shortDescription,
  category: service.category,
  duration: service.duration,
  basePrice: service.basePrice,
  price: service.basePrice, // Legacy field support
  hasVariants: service.hasVariants,
  variants: service.variants,
  isActive: service.isActive
}));
```

### 3.7 Update Validation

In the validation section:

**OLD:**
```tsx
if (selectedServices.length < 2) newErrors.services = 'Select at least 2 services';
```

**NEW:**
```tsx
if (services.length < 1) newErrors.services = 'Add at least one service';
```

---

## Step 4: Update Provider Type Selection (Section 1)

Replace the provider types grid to use the imported constants:

```tsx
{/* Provider Types */}
<div>
  <label className="block text-sm font-semibold text-gray-700 mb-3">
    What type of services do you provide? *
  </label>
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
    {PROVIDER_TYPES.map(type => {
      const isSelected = selectedTypes.includes(type.id);
      return (
        <button
          key={type.id}
          type="button"
          onClick={() => {
            setSelectedTypes(prev =>
              prev.includes(type.id)
                ? prev.filter(t => t !== type.id)
                : [...prev, type.id]
            );
          }}
          className={`p-4 rounded-xl border-2 text-center transition-all ${
            isSelected
              ? 'border-teal-500 bg-teal-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-3xl block mb-2">{type.icon}</span>
          <span className="text-sm font-medium">{type.label}</span>
          {isSelected && (
            <span className="absolute top-2 right-2 text-teal-500">✓</span>
          )}
        </button>
      );
    })}
  </div>
</div>
```

---

## Step 5: Update EditProfile.tsx

Similar changes for the dashboard editing:

```tsx
import { ServiceSelector, ServiceList, ServiceEditor, Service } from '../components/services';
import { PROVIDER_TYPES } from '../constants/providerTypes';

// In your component:
const [services, setServices] = useState<Service[]>(provider?.services || []);
const [editingService, setEditingService] = useState<{ service: Service; index: number } | null>(null);

// In the render:
<ServiceList
  services={services}
  editable={true}
  showActions={true}
  onEdit={(service, index) => setEditingService({ service, index })}
  onDelete={(index) => {
    const updated = [...services];
    updated.splice(index, 1);
    setServices(updated);
  }}
  onToggleActive={(index) => {
    const updated = [...services];
    updated[index] = { ...updated[index], isActive: !updated[index].isActive };
    setServices(updated);
  }}
/>

{/* Add Services Button */}
<button onClick={() => setShowServiceSelector(true)}>
  + Add Services
</button>

{/* Service Editor Modal */}
{editingService && (
  <ServiceEditor
    service={editingService.service}
    categories={categories}
    onSave={(updated) => {
      const newServices = [...services];
      newServices[editingService.index] = updated;
      setServices(newServices);
      setEditingService(null);
    }}
    onCancel={() => setEditingService(null)}
    onDelete={() => {
      const updated = services.filter((_, i) => i !== editingService.index);
      setServices(updated);
      setEditingService(null);
    }}
  />
)}
```

---

## Step 6: Add Environment Variable

Ensure your `.env` file has:

```
VITE_API_URL=https://fearless-achievement-production.up.railway.app/api
```

---

## Component Props Reference

### ServiceSelector

```tsx
interface ServiceSelectorProps {
  providerTypes: string[];           // Selected provider types
  selectedServices: Service[];       // Current services array
  onServicesChange: (services: Service[]) => void;
  mode?: 'onboarding' | 'editing';   // Adjusts UI slightly
}
```

### ServiceList

```tsx
interface ServiceListProps {
  services: Service[];
  editable?: boolean;                // Show edit/delete buttons
  showActions?: boolean;             // Show action buttons
  onEdit?: (service: Service, index: number) => void;
  onDelete?: (index: number) => void;
  onToggleActive?: (index: number) => void;
}
```

### ServiceEditor

```tsx
interface ServiceEditorProps {
  service: Service;                  // Service to edit
  categories: string[];              // Available categories
  onSave: (service: Service) => void;
  onCancel: () => void;
  onDelete?: () => void;
}
```

---

## Service Data Structure

```typescript
interface Service {
  _id?: string;
  name: string;
  description: string;
  shortDescription?: string;
  category: string;
  basePrice: number;
  duration: number;
  hasVariants: boolean;
  variants: ServiceVariant[];
  isActive: boolean;
  sortOrder?: number;
}

interface ServiceVariant {
  _id?: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  isDefault: boolean;
}
```

---

## Testing Checklist

After integration:

- [ ] Provider types load correctly in Step 1
- [ ] Selecting types shows relevant templates in Step 4
- [ ] Quick Start tab shows popular templates
- [ ] Can customize prices before adding
- [ ] Browse All shows categories accordion
- [ ] Can create custom services with variants
- [ ] Added services appear in summary
- [ ] Can remove services from summary
- [ ] Services submit correctly to backend
- [ ] EditProfile loads existing services
- [ ] Can edit services with modal
- [ ] Can toggle active/inactive
- [ ] Changes save to backend

---

## Troubleshooting

### Templates not loading
- Check that provider types match exactly (case-sensitive)
- Verify VITE_API_URL is set correctly
- Check browser Network tab for API errors

### Categories empty
- Ensure backend has seeded templates
- Run the seeding script if needed

### Legacy services not displaying
- The `normalizeService` helper handles old format
- Check that services have `category` field

---

*Integration Guide v1.0 - January 2026*
