# Findr Health: Service Category System Design

## Overview

This document defines the simplified service category system for Findr Health, designed to minimize provider decision fatigue during onboarding while creating a clean, intuitive experience for consumers.

---

## Design Principles

1. **Provider-Type Driven** - Categories are automatically determined by provider type
2. **Smart Defaults** - Pre-populate common services to reduce manual entry
3. **Progressive Complexity** - Start simple, allow customization if needed
4. **Consumer Clarity** - Categories should be immediately understandable to patients

---

## Part 1: Service Category Structure

### Category Hierarchy

```
Provider Type (auto-assigned at signup)
  └── Service Category (based on provider type)
       └── Service (provider creates/selects)
            └── Variant (optional pricing tiers)
```

### Categories by Provider Type

| Provider Type | Service Categories |
|---------------|-------------------|
| **Medical** | Consultation, Preventive, Diagnostic, Treatment, Procedures |
| **Urgent Care** | Walk-in Visit, Diagnostic, Treatment, Minor Procedures |
| **Dental** | Preventive, Restorative, Cosmetic, Surgical |
| **Mental Health** | Assessment, Individual Therapy, Couples/Family, Group, Psychiatry |
| **Skincare** | Facials, Anti-Aging, Acne Treatment, Body Treatment |
| **Massage** | Relaxation, Therapeutic, Sports, Specialty |
| **Fitness** | Personal Training, Group Class, Assessment |
| **Yoga/Pilates** | Group Class, Private Session, Workshop |
| **Nutrition** | Consultation, Meal Planning, Program |
| **Pharmacy/Rx** | Consultation, Compounding, Immunization |

---

## Part 2: Backend Schema Updates

### MongoDB Schema: Service

```javascript
// services subdocument within Provider
{
  services: [{
    _id: ObjectId,
    
    // Basic Info
    name: String,                    // "Dental Cleaning"
    description: String,             // Full description
    shortDescription: String,        // Max 100 chars for tiles
    
    // Categorization
    category: String,                // "Preventive" - from allowed list based on providerType
    
    // Pricing & Duration
    basePrice: Number,               // Starting price (for "from $X" display)
    duration: Number,                // Minutes
    
    // Variants (optional - for tiered pricing)
    hasVariants: Boolean,            // Default: false
    variants: [{
      _id: ObjectId,
      name: String,                  // "Standard Cleaning"
      description: String,
      price: Number,                 // Actual price
      duration: Number,              // Can override base duration
      isDefault: Boolean             // Pre-selected option
    }],
    
    // Display
    isActive: Boolean,               // Show/hide service
    sortOrder: Number,               // Display order within category
    
    // Metadata
    createdAt: Date,
    updatedAt: Date
  }]
}
```

### MongoDB Schema: Service Templates (New Collection)

```javascript
// serviceTemplates collection - Pre-built services for quick onboarding
{
  _id: ObjectId,
  providerType: String,              // "Dental", "Medical", etc.
  category: String,                  // "Preventive"
  name: String,                      // "Dental Cleaning"
  description: String,
  shortDescription: String,
  suggestedPrice: Number,            // Market average
  suggestedDuration: Number,
  
  // Common variants for this service type
  suggestedVariants: [{
    name: String,                    // "Standard", "Deep Cleaning"
    priceModifier: Number,           // +0, +20, +50
    durationModifier: Number         // +0, +15, +30
  }],
  
  isPopular: Boolean,                // Show in "Quick Add" section
  sortOrder: Number
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/service-templates?providerType=Dental` | Get templates for provider type |
| GET | `/api/service-categories?providerType=Dental` | Get allowed categories |
| POST | `/api/providers/:id/services` | Create service |
| PUT | `/api/providers/:id/services/:serviceId` | Update service |
| POST | `/api/providers/:id/services/:serviceId/variants` | Add variant |

---

## Part 3: Provider Onboarding UX

### Design Goals
- Complete service setup in under 5 minutes
- No decision paralysis
- Accommodate both "quick setup" and "custom setup" users

### Recommended Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     SERVICES SETUP                               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  🚀 Quick Start                                          │    │
│  │                                                          │    │
│  │  Add popular services for Dental practices:              │    │
│  │                                                          │    │
│  │  ☑️ Dental Cleaning         $80-150    45 min           │    │
│  │  ☑️ Exam & X-rays           $75-125    30 min           │    │
│  │  ☐ Teeth Whitening          $200-400   60 min           │    │
│  │  ☐ Filling                  $150-300   45 min           │    │
│  │  ☐ Extraction               $150-350   60 min           │    │
│  │                                                          │    │
│  │  [Add Selected Services]                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│                         ─── or ───                               │
│                                                                  │
│  [+ Create Custom Service]                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Step-by-Step Provider Experience

#### Step 1: Quick Start (Recommended Path)

1. System detects provider type (e.g., "Dental")
2. Shows pre-built service templates with:
   - Checkbox selection
   - Editable price range (with market suggestions)
   - Editable duration
3. Provider checks boxes for services they offer
4. One click: "Add Selected Services"

**UX Benefits:**
- No typing required
- Market-rate pricing guidance
- Services pre-categorized correctly
- Can add 5-10 services in 30 seconds

#### Step 2: Customize (Optional)

After quick-add, provider can:
- Edit any service details
- Add variants (pricing tiers)
- Reorder services
- Add custom services not in templates

#### Step 3: Custom Service Creation

When provider clicks "+ Create Custom Service":

```
┌─────────────────────────────────────────────────────────────────┐
│  Create Service                                            [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Category *                                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Preventive                                           ▼  │    │
│  └─────────────────────────────────────────────────────────┘    │
│  (Only shows categories valid for this provider type)           │
│                                                                  │
│  Service Name *                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ e.g., "Deep Cleaning"                                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Short Description (shown on service cards)                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Max 100 characters                                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Full Description                                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │ Price *          │    │ Duration *       │                   │
│  │ $ [    120    ]  │    │ [  45  ] min     │                   │
│  └──────────────────┘    └──────────────────┘                   │
│                                                                  │
│  ☐ This service has multiple pricing options                     │
│    (e.g., Standard vs Premium)                                   │
│                                                                  │
│                                        [Cancel]  [Save Service]  │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 4: Adding Variants (When Checkbox Selected)

```
┌─────────────────────────────────────────────────────────────────┐
│  Pricing Options for "Dental Cleaning"                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Customers will choose from these options:                       │
│                                                                  │
│  Option 1 (Default)                                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Name: [Standard Cleaning        ]  Price: $[80 ]        │    │
│  │ Duration: [45] min                                       │    │
│  │ Description: [Basic cleaning with polish              ]  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Option 2                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Name: [Deep Cleaning            ]  Price: $[150]        │    │
│  │ Duration: [60] min                                       │    │
│  │ Description: [Includes scaling and root planing       ]  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [+ Add Another Option]                                          │
│                                                                  │
│                                        [Cancel]  [Save Options]  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 4: Consumer Mobile App UX

### Service Display on Provider Detail

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Bright Smile Dental                              ♡    ↗     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ⭐ 4.8 (234 reviews)                                           │
│  📍 123 Main St, Bozeman, MT                                    │
│  🟢 Open · Closes 6pm                                           │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  Services                                                        │
│                                                                  │
│  [Preventive] [Restorative] [Cosmetic] [Surgical]  ← Tabs       │
│  ──────────────                                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Dental Cleaning                              [Book]     │    │
│  │ from $80 · 45 min                                       │    │
│  │ Professional cleaning to remove plaque...               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                  ↑                              ↑                 │
│         Tap = Show details            Tap = Start booking        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Exam & X-rays                                [Book]     │    │
│  │ $75 · 30 min                                            │    │
│  │ Comprehensive dental exam with digital...               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  Team                                                            │
│  ┌────┐ ┌────┐ ┌────┐                                          │
│  │ 😀 │ │ 😀 │ │ 😀 │  Dr. Smith, Dr. Jones, Sarah RDH        │
│  └────┘ └────┘ └────┘                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
│           [ Book Appointment ]                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Service Detail Bottom Sheet (Tap on Service Tile)

```
┌─────────────────────────────────────────────────────────────────┐
│  ─────                                                          │
│                                                                  │
│  Dental Cleaning                                                 │
│  from $80 · 45-60 min                                           │
│                                                                  │
│  Professional teeth cleaning to remove plaque and tartar        │
│  buildup. Includes polishing and fluoride treatment.            │
│                                                                  │
│  What's included:                                                │
│  • Plaque and tartar removal                                    │
│  • Teeth polishing                                              │
│  • Fluoride treatment                                           │
│  • Oral health assessment                                       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │               [ Book This Service ]                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Variant Selection Bottom Sheet (After Tap "Book")

*Only shows if service has variants*

```
┌─────────────────────────────────────────────────────────────────┐
│  ─────                                                          │
│                                                                  │
│  Dental Cleaning                                                 │
│  Select an option                                                │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ○  Standard Cleaning                           $80      │    │
│  │    45 min · Basic cleaning with polish                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ●  Deep Cleaning                              $150      │    │
│  │    60 min · Includes scaling and root planing           │    │ ← Selected
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │               [ Continue - $150 ]                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### "Add Another Service?" Prompt

*Shows after service/variant selection*

**Recommendation: Bottom Sheet Prompt**

```
┌─────────────────────────────────────────────────────────────────┐
│  ─────                                                          │
│                                                                  │
│  ✓ Deep Cleaning added                                          │
│    $150 · 60 min                                                │
│                                                                  │
│  Would you like to add another service?                         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │          [ + Add Another Service ]                       │    │ → Returns to provider detail
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │          [ Continue to Booking ]                         │    │ → Next step
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Why this approach:**
- Non-intrusive (easy to dismiss)
- Clear binary choice
- Shows what was added (confirmation)
- "Continue to Booking" is visually prominent (primary action)

---

## Part 5: Implementation Plan

### Phase 1: Backend (Do First)

1. Update Provider schema with new service structure
2. Create ServiceTemplate collection
3. Seed templates for all 10 provider types
4. Create/update API endpoints
5. Update provider portal onboarding

### Phase 2: Provider Portal Updates

1. Implement "Quick Start" service selection
2. Update custom service creation form
3. Add variant management UI
4. Add category filtering in service list

### Phase 3: Mobile App Updates

1. Update service model to handle categories/variants
2. Add category tabs to provider detail
3. Implement service detail bottom sheet
4. Implement variant selection bottom sheet
5. Implement "Add another service?" flow
6. Add professional selection screen (optional step)

---

## Part 6: Service Templates (Seed Data)

### Dental Templates

| Category | Service | Suggested Price | Duration |
|----------|---------|-----------------|----------|
| Preventive | Dental Cleaning | $80-150 | 45 min |
| Preventive | Exam & X-rays | $75-125 | 30 min |
| Preventive | Fluoride Treatment | $25-50 | 15 min |
| Restorative | Tooth Filling | $150-300 | 45 min |
| Restorative | Crown | $800-1500 | 90 min |
| Restorative | Root Canal | $700-1200 | 90 min |
| Cosmetic | Teeth Whitening | $200-500 | 60 min |
| Cosmetic | Veneer (per tooth) | $800-2000 | 60 min |
| Surgical | Tooth Extraction | $150-350 | 45 min |
| Surgical | Wisdom Tooth Removal | $250-600 | 60 min |

### Medical Templates

| Category | Service | Suggested Price | Duration |
|----------|---------|-----------------|----------|
| Consultation | New Patient Visit | $150-250 | 45 min |
| Consultation | Follow-up Visit | $75-150 | 20 min |
| Preventive | Annual Physical | $150-300 | 45 min |
| Preventive | Wellness Checkup | $100-200 | 30 min |
| Diagnostic | Blood Work Panel | $50-150 | 15 min |
| Diagnostic | EKG | $50-150 | 20 min |
| Treatment | Sick Visit | $100-175 | 20 min |
| Procedures | Minor Procedure | $150-400 | 30 min |

### Skincare Templates

| Category | Service | Suggested Price | Duration |
|----------|---------|-----------------|----------|
| Facials | Basic Facial | $75-125 | 60 min |
| Facials | Deep Cleansing Facial | $100-175 | 75 min |
| Anti-Aging | Microdermabrasion | $100-200 | 45 min |
| Anti-Aging | Chemical Peel | $150-300 | 45 min |
| Anti-Aging | Microneedling | $200-400 | 60 min |
| Acne Treatment | Acne Facial | $100-175 | 60 min |
| Acne Treatment | Extraction Treatment | $75-150 | 45 min |
| Body Treatment | Body Wrap | $100-200 | 60 min |

### Mental Health Templates

| Category | Service | Suggested Price | Duration |
|----------|---------|-----------------|----------|
| Assessment | Initial Assessment | $150-250 | 60 min |
| Individual Therapy | Therapy Session | $100-200 | 50 min |
| Individual Therapy | Extended Session | $150-275 | 80 min |
| Couples/Family | Couples Therapy | $150-250 | 60 min |
| Couples/Family | Family Therapy | $175-300 | 75 min |
| Group | Group Therapy Session | $40-80 | 90 min |
| Psychiatry | Medication Evaluation | $200-350 | 45 min |
| Psychiatry | Medication Follow-up | $100-175 | 20 min |

### Massage Templates

| Category | Service | Suggested Price | Duration |
|----------|---------|-----------------|----------|
| Relaxation | Swedish Massage | $80-130 | 60 min |
| Relaxation | Aromatherapy Massage | $90-150 | 60 min |
| Therapeutic | Deep Tissue Massage | $100-160 | 60 min |
| Therapeutic | Trigger Point Therapy | $100-160 | 60 min |
| Sports | Sports Massage | $100-160 | 60 min |
| Sports | Pre-Event Massage | $60-100 | 30 min |
| Specialty | Hot Stone Massage | $120-180 | 75 min |
| Specialty | Prenatal Massage | $90-140 | 60 min |

### Urgent Care Templates

| Category | Service | Suggested Price | Duration |
|----------|---------|-----------------|----------|
| Walk-in Visit | Basic Visit | $125-175 | 20 min |
| Walk-in Visit | Visit + X-ray | $175-250 | 35 min |
| Walk-in Visit | Visit + Lab Work | $150-225 | 30 min |
| Diagnostic | X-ray | $75-150 | 15 min |
| Diagnostic | Lab Panel | $50-125 | 15 min |
| Treatment | Laceration Repair | $200-400 | 45 min |
| Treatment | Splint/Cast | $150-300 | 30 min |
| Minor Procedures | IV Fluids | $150-250 | 45 min |

### Fitness Templates

| Category | Service | Suggested Price | Duration |
|----------|---------|-----------------|----------|
| Personal Training | Single Session | $60-100 | 60 min |
| Personal Training | 5-Session Package | $250-450 | 60 min |
| Personal Training | 10-Session Package | $450-800 | 60 min |
| Group Class | Group Fitness Class | $15-30 | 45 min |
| Group Class | Bootcamp | $20-40 | 60 min |
| Assessment | Fitness Assessment | $75-150 | 60 min |
| Assessment | Body Composition | $50-100 | 30 min |

### Yoga/Pilates Templates

| Category | Service | Suggested Price | Duration |
|----------|---------|-----------------|----------|
| Group Class | Drop-in Class | $15-25 | 60 min |
| Group Class | 5-Class Pack | $60-100 | 60 min |
| Group Class | Monthly Unlimited | $100-175 | - |
| Private Session | Private Yoga | $75-125 | 60 min |
| Private Session | Private Pilates | $80-140 | 60 min |
| Workshop | Specialty Workshop | $40-75 | 120 min |

### Nutrition Templates

| Category | Service | Suggested Price | Duration |
|----------|---------|-----------------|----------|
| Consultation | Initial Consultation | $100-200 | 60 min |
| Consultation | Follow-up | $60-100 | 30 min |
| Meal Planning | Custom Meal Plan | $75-150 | 45 min |
| Meal Planning | Weekly Planning | $50-100 | 30 min |
| Program | 4-Week Program | $300-500 | - |
| Program | 12-Week Program | $600-1000 | - |

### Pharmacy/Rx Templates

| Category | Service | Suggested Price | Duration |
|----------|---------|-----------------|----------|
| Consultation | Medication Review | $25-50 | 20 min |
| Consultation | Health Consultation | $30-60 | 30 min |
| Compounding | Custom Compound | $50-200 | - |
| Immunization | Flu Shot | $25-50 | 10 min |
| Immunization | COVID Vaccine | $0-50 | 15 min |
| Immunization | Travel Vaccines | $75-200 | 20 min |

---

## Summary

This system:
1. **Reduces provider onboarding time** from 20+ minutes to under 5 minutes
2. **Eliminates category confusion** by auto-assigning based on provider type
3. **Provides pricing guidance** to help providers set competitive rates
4. **Creates consistent consumer experience** with predictable category names
5. **Supports flexibility** for custom services and pricing variants

### Next Steps

1. Review and approve this design
2. Implement backend schema changes
3. Create seed data for service templates
4. Update provider portal
5. Update mobile app

---

*Document Version: 1.0*
*Created: January 3, 2026*
