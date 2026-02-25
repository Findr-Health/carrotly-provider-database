# Provider Details - Schema Alignment Document
**Version:** 1.0  
**Date:** January 28, 2026  
**Purpose:** Ensure provider data consistency across Database, Admin Dashboard, and Provider Portal MVP

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current Database Schema](#current-database-schema)
3. [Provider Portal MVP Requirements](#provider-portal-mvp-requirements)
4. [Admin Dashboard Requirements](#admin-dashboard-requirements)
5. [Schema Alignment Matrix](#schema-alignment-matrix)
6. [Missing Fields Analysis](#missing-fields-analysis)
7. [Data Validation Rules](#data-validation-rules)
8. [API Requirements](#api-requirements)
9. [Migration Plan](#migration-plan)
10. [Testing Checklist](#testing-checklist)

---

## Executive Summary

### Problem Statement
Provider data schema has been updated in the **Database** (January 28, 2026) but **Admin Dashboard** and **Provider Portal MVP** have not been synchronized. This creates risk of:
- Data loss during provider creation/updates
- Validation errors
- Feature incompatibility
- Poor user experience
- Blocked provider onboarding

### Critical Changes Made to Database
1. **Added:** `location` GeoJSON field (REQUIRED for geospatial search)
2. **Fixed:** Geospatial indexes (removed duplicates, kept only `location_2dsphere`)
3. **Updated:** `agreement` object structure
4. **Updated:** `calendar.provider` field
5. **Added:** `onboardingCompleted` and `onboardingStep` fields

### Impact
- ⚠️ **Admin Dashboard:** May fail to create/update providers correctly
- ⚠️ **Provider Portal MVP:** Cannot onboard new providers without schema alignment
- ✅ **Mobile App:** Working correctly (uses updated schema)
- ✅ **Clarity AI:** Working correctly (uses geospatial search)

### Immediate Actions Required
1. Audit Admin Dashboard code for schema compatibility (1 day)
2. Update Provider Portal MVP to use current schema (2 days)
3. Create data migration script for existing providers (1 day)
4. Add comprehensive schema validation tests (1 day)
5. Document all changes in code comments and README

---

## Current Database Schema

**Model:** `Provider` (Mongoose)  
**Location:** `backend/models/Provider.js`  
**Last Updated:** January 28, 2026

### Complete Schema Definition

```javascript
const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  
  // ==========================================
  // BASIC INFORMATION
  // ==========================================
  
  practiceName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  name: {
    type: String,  // Individual provider name (may differ from practice)
    trim: true
  },
  
  providerTypes: {
    type: [String],
    required: true,
    enum: [
      'Medical', 'Dental', 'Mental Health', 'Massage', 
      'Skincare/Aesthetics', 'Fitness', 'Yoga', 
      'Nutrition', 'Pharmacy', 'Urgent Care', 'Other'
    ],
    index: true
  },
  
  // ==========================================
  // LOCATION (CRITICAL - REQUIRED FOR SEARCH)
  // ==========================================
  
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],  // [longitude, latitude]
      required: true
    }
  },
  
  address: {
    street: { type: String, trim: true },
    suite: { type: String, trim: true },
    city: { type: String, trim: true, index: true },
    state: { type: String, trim: true, index: true },
    zip: { type: String, trim: true }
  },
  
  // ==========================================
  // CONTACT INFORMATION
  // ==========================================
  
  contactInfo: {
    email: { 
      type: String, 
      required: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/
    },
    phone: { 
      type: String,
      required: true,
      trim: true
    },
    website: { type: String, trim: true }
  },
  
  // Shorthand fields (for backward compatibility)
  email: { type: String },
  phone: { type: String },
  
  // ==========================================
  // SERVICES & PRICING
  // ==========================================
  
  services: [{
    name: { type: String, required: true },
    category: { type: String },
    description: { type: String },
    price: { type: Number },  // Base price
    duration: { type: Number },  // Minutes
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    
    // Pricing variants (e.g., 30min, 60min, 90min)
    hasVariants: { type: Boolean, default: false },
    variants: [{
      name: String,
      price: Number,
      duration: Number
    }]
  }],
  
  // ==========================================
  // TEAM MEMBERS
  // ==========================================
  
  team: [{
    name: { type: String, required: true },
    role: { type: String },  // e.g., "Dentist", "Hygienist"
    credentials: [String],  // e.g., ["DDS", "Board Certified"]
    bio: { type: String },
    photoUrl: { type: String },
    isActive: { type: Boolean, default: true }
  }],
  
  // ==========================================
  // CREDENTIALS & VERIFICATION
  // ==========================================
  
  credentials: {
    licenses: [String],
    certifications: [String],
    education: [String],
    insuranceAccepted: [String],
    languages: [String]
  },
  
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  
  verificationDocuments: [{
    type: { type: String },  // 'license', 'insurance', 'certification'
    url: { type: String },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    uploadedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date }
  }],
  
  // ==========================================
  // CALENDAR & AVAILABILITY
  // ==========================================
  
  calendar: {
    provider: { 
      type: String, 
      enum: ['acuity', 'manual', 'google', 'apple'],
      default: 'manual'
    },
    
    // For 'acuity' provider
    acuityUserId: { type: String },
    acuityCalendarId: { type: String },
    
    // For 'manual' provider
    businessHours: {
      monday: {
        enabled: { type: Boolean, default: false },
        start: { type: String },  // "09:00"
        end: { type: String }     // "17:00"
      },
      tuesday: {
        enabled: { type: Boolean, default: false },
        start: { type: String },
        end: { type: String }
      },
      wednesday: {
        enabled: { type: Boolean, default: false },
        start: { type: String },
        end: { type: String }
      },
      thursday: {
        enabled: { type: Boolean, default: false },
        start: { type: String },
        end: { type: String }
      },
      friday: {
        enabled: { type: Boolean, default: false },
        start: { type: String },
        end: { type: String }
      },
      saturday: {
        enabled: { type: Boolean, default: false },
        start: { type: String },
        end: { type: String }
      },
      sunday: {
        enabled: { type: Boolean, default: false },
        start: { type: String },
        end: { type: String }
      }
    },
    
    bufferMinutes: { type: Number, default: 0 },
    maxAdvanceBookingDays: { type: Number, default: 90 }
  },
  
  // ==========================================
  // MEDIA
  // ==========================================
  
  imageUrl: { type: String },  // Primary logo/photo
  
  photos: [{
    url: { type: String, required: true },
    caption: { type: String },
    isFeature: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 }
  }],
  
  // ==========================================
  // PAYMENT & BANKING
  // ==========================================
  
  payment: {
    stripeAccountId: { type: String },
    stripeOnboardingComplete: { type: Boolean, default: false },
    acceptsInsurance: { type: Boolean, default: false },
    acceptsCash: { type: Boolean, default: true },
    acceptsCard: { type: Boolean, default: true }
  },
  
  // ==========================================
  // ONBOARDING & STATUS
  // ==========================================
  
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'suspended'],
    default: 'draft',
    index: true
  },
  
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  
  onboardingStep: {
    type: Number,
    default: 0,
    min: 0,
    max: 10  // Steps: Basic Info, Location, Services, Calendar, Agreement, etc.
  },
  
  // ==========================================
  // AGREEMENT
  // ==========================================
  
  agreement: {
    signature: { type: String },  // Base64 or name
    title: { type: String },      // "Owner", "Manager", etc.
    agreedDate: { type: Date },
    ipAddress: { type: String },
    version: { type: String }     // Agreement version
  },
  
  // ==========================================
  // METADATA
  // ==========================================
  
  description: { type: String },
  specialties: [String],
  amenities: [String],  // "Parking", "Wheelchair Accessible", etc.
  
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  
  // ==========================================
  // TIMESTAMPS
  // ==========================================
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
  
}, {
  timestamps: true  // Automatically manages createdAt/updatedAt
});

// ==========================================
// INDEXES
// ==========================================

// CRITICAL: Geospatial index for location-based search
providerSchema.index({ location: '2dsphere' });

// Additional indexes for performance
providerSchema.index({ status: 1 });
providerSchema.index({ providerTypes: 1 });
providerSchema.index({ 'address.city': 1, 'address.state': 1 });
providerSchema.index({ practiceName: 'text', description: 'text' });

module.exports = mongoose.model('Provider', providerSchema);
```

### Schema Notes

**CRITICAL FIELDS (Must not be null/empty):**
1. `practiceName` - Cannot be empty
2. `providerTypes` - Must have at least one type
3. `location` - MUST be valid GeoJSON Point
4. `location.coordinates` - MUST be [longitude, latitude] (correct order!)
5. `contactInfo.email` - Required, must be valid email
6. `contactInfo.phone` - Required
7. `status` - Must be one of enum values

**COMMON MISTAKES:**
1. **Location coordinates reversed:** Should be `[lng, lat]` NOT `[lat, lng]`
2. **Location set to [0, 0]:** Default coordinates (middle of ocean) - INVALID
3. **Missing location field:** Old providers may not have this field
4. **Duplicate indexes:** Causes $geoNear failures
5. **Empty practiceName:** Validation should catch this but sometimes doesn't

---

## Provider Portal MVP Requirements

### User Journey

```
1. Provider signs up (email + password)
   ↓
2. Onboarding Flow (10 steps)
   ↓
3. Step 1: Basic Information
   - Practice name
   - Individual name (optional)
   - Provider types (checkboxes)
   - Description
   ↓
4. Step 2: Location
   - Address (street, suite, city, state, zip)
   - Geocode to get coordinates
   - Show map preview
   ↓
5. Step 3: Contact Information
   - Email (pre-filled from signup)
   - Phone
   - Website (optional)
   ↓
6. Step 4: Services & Pricing
   - Add services (name, category, description, price, duration)
   - Pricing variants (optional)
   - Set active/inactive
   ↓
7. Step 5: Team Members (optional)
   - Add team members (name, role, credentials, bio, photo)
   ↓
8. Step 6: Credentials & Verification
   - Upload license
   - Upload insurance
   - Add certifications
   - Select insurance accepted
   - Select languages spoken
   ↓
9. Step 7: Calendar Setup
   - Choose calendar provider (Manual, Acuity, Google)
   - Set business hours (if manual)
   - Set buffer time
   - Set max advance booking
   ↓
10. Step 8: Photos
    - Upload logo/primary photo
    - Upload additional photos (office, team, etc.)
    ↓
11. Step 9: Banking (for payments)
    - Stripe Connect onboarding
    - Bank account verification
    ↓
12. Step 10: Review & Agreement
    - Review all information
    - Sign provider agreement
    - Submit for approval
    ↓
13. Admin Reviews
    - Admin approves/rejects
    - Provider receives email notification
    ↓
14. Go Live!
    - status='approved'
    - Visible in mobile app
```

### Portal Screens Required

#### 1. Signup Screen
**Fields:**
- Email
- Password
- Confirm Password
- Practice Name
- "I agree to Terms & Conditions" checkbox

**Actions:**
- POST /api/auth/signup
- Create provider with status='draft', onboardingStep=0
- Redirect to onboarding

---

#### 2. Onboarding - Step 1: Basic Information
**Fields:**
- Practice Name (text, required, max 100 chars)
- Individual Name (text, optional, max 100 chars)
- Provider Types (multi-select checkboxes, required, min 1)
  - Medical, Dental, Mental Health, Massage, Skincare/Aesthetics, Fitness, Yoga, Nutrition, Pharmacy, Urgent Care, Other
- Description (textarea, optional, max 500 chars)
- Specialties (tags, optional)

**Validation:**
- Practice name: required, 3-100 chars
- Provider types: at least one selected
- Description: max 500 chars

**Actions:**
- Save progress: PATCH /api/providers/:id
- Next: increment onboardingStep to 1

---

#### 3. Onboarding - Step 2: Location
**Fields:**
- Street Address (text, required)
- Suite/Unit (text, optional)
- City (text, required)
- State (dropdown, required, US states)
- ZIP Code (text, required, format: XXXXX or XXXXX-XXXX)
- Map Preview (read-only, shows pin on map)

**Geocoding:**
```javascript
// On blur of city/state/zip, geocode address
const fullAddress = `${street}, ${city}, ${state} ${zip}`;
const coords = await geocode(fullAddress);

provider.location = {
  type: 'Point',
  coordinates: [coords.lng, coords.lat]  // CRITICAL: [lng, lat] order
};

provider.address = {
  street, suite, city, state, zip
};
```

**Validation:**
- All fields required except suite
- ZIP format: XXXXX or XXXXX-XXXX
- Geocoding must succeed (valid address)
- Coordinates cannot be [0, 0]

**Actions:**
- Geocode address on blur
- Show map preview with pin
- Save: PATCH /api/providers/:id with location + address
- Next: increment onboardingStep to 2

---

#### 4. Onboarding - Step 3: Contact Information
**Fields:**
- Email (text, pre-filled from signup, disabled)
- Phone (text, required, format: (XXX) XXX-XXXX)
- Website (text, optional, must be valid URL)

**Validation:**
- Phone: required, US phone format
- Website: optional, must start with http:// or https://

**Actions:**
- Save: PATCH /api/providers/:id
  ```json
  {
    "contactInfo": {
      "email": "...",
      "phone": "...",
      "website": "..."
    },
    "email": "...",  // Backward compatibility
    "phone": "..."   // Backward compatibility
  }
  ```
- Next: increment onboardingStep to 3

---

#### 5. Onboarding - Step 4: Services & Pricing
**UI:**
- List of added services (editable table)
- "Add Service" button

**Add/Edit Service Form:**
- Service Name (text, required, max 100 chars)
- Category (dropdown, optional)
  - Preventive, Diagnostic, Restorative, Cosmetic, Therapeutic, Relaxation, Consultation, etc.
- Description (textarea, optional, max 200 chars)
- Base Price (number, required, min 0, max 10000)
- Duration (number, optional, minutes)
- Active (toggle, default true)
- Has Variants (toggle)
  - If true, show variant editor
    - Variant Name, Variant Price, Variant Duration

**Validation:**
- Service name: required, 3-100 chars
- Base price: required, >= 0
- Duration: optional, >= 5 minutes if provided
- At least ONE service required before proceeding

**Actions:**
- Add service: push to services array
- Edit service: update in services array
- Delete service: remove from services array (or set isActive=false)
- Save: PATCH /api/providers/:id with services array
- Next: increment onboardingStep to 4

---

#### 6. Onboarding - Step 5: Team Members (Optional)
**UI:**
- List of team members (cards)
- "Add Team Member" button

**Add/Edit Team Member Form:**
- Name (text, required)
- Role (text, optional, e.g., "Dentist", "Hygienist")
- Credentials (tags, optional, e.g., "DDS", "Board Certified")
- Bio (textarea, optional, max 300 chars)
- Photo (file upload, optional, max 2MB, jpg/png)
- Active (toggle, default true)

**Validation:**
- Name: required, 2-100 chars
- Photo: max 2MB, jpg/png only
- Bio: max 300 chars

**Actions:**
- Upload photo: POST /api/providers/:id/team/photo (multipart)
- Add team member: push to team array
- Edit team member: update in team array
- Delete team member: set isActive=false
- Save: PATCH /api/providers/:id with team array
- Next: increment onboardingStep to 5

---

#### 7. Onboarding - Step 6: Credentials & Verification
**UI:**
- Upload Documents section
- Insurance & Languages section

**Upload Documents:**
- License (file upload, required, PDF/JPG/PNG, max 5MB)
- Insurance Certificate (file upload, optional, PDF/JPG/PNG, max 5MB)
- Certifications (file upload, multiple, optional)

**Insurance Accepted:**
- Multi-select checkboxes
  - Aetna, Blue Cross, Cigna, UnitedHealthcare, Medicare, Medicaid, Cash/Self-Pay, Other

**Languages Spoken:**
- Multi-select checkboxes
  - English, Spanish, French, Chinese, etc.

**Validation:**
- License: required
- File size: max 5MB per file
- File type: PDF, JPG, PNG only

**Actions:**
- Upload file: POST /api/providers/:id/documents (multipart)
  - Returns document URL
  - Creates verificationDocuments entry with status='pending'
- Save credentials: PATCH /api/providers/:id
  ```json
  {
    "credentials": {
      "insuranceAccepted": [...],
      "languages": [...]
    },
    "verificationDocuments": [...]
  }
  ```
- Next: increment onboardingStep to 6

---

#### 8. Onboarding - Step 7: Calendar Setup
**UI:**
- Calendar provider selection (radio buttons)
  - Manual (default)
  - Acuity Scheduling
  - Google Calendar (future)

**If Manual:**
- Business Hours Editor
  - For each day (Mon-Sun):
    - Enabled (checkbox)
    - Start Time (time picker, e.g., 09:00)
    - End Time (time picker, e.g., 17:00)
- Buffer Time (number, minutes, default 0)
- Max Advance Booking (number, days, default 90)

**If Acuity:**
- "Connect Acuity" button (OAuth flow)
- Shows connected calendars
- Select calendar to use

**Validation:**
- If enabled, start time must be before end time
- At least one day must be enabled
- Buffer time: 0-60 minutes
- Max advance booking: 1-365 days

**Actions:**
- Save: PATCH /api/providers/:id
  ```json
  {
    "calendar": {
      "provider": "manual",
      "businessHours": {...},
      "bufferMinutes": 15,
      "maxAdvanceBookingDays": 90
    }
  }
  ```
- Next: increment onboardingStep to 7

---

#### 9. Onboarding - Step 8: Photos
**UI:**
- Primary Photo/Logo (single upload)
- Additional Photos (multiple upload, max 10)
- Drag-to-reorder
- Delete button for each

**Validation:**
- Primary photo: required
- File size: max 5MB per photo
- File type: JPG, PNG only
- Max total photos: 10

**Actions:**
- Upload primary: POST /api/providers/:id/photos/primary (multipart)
  - Sets imageUrl
- Upload additional: POST /api/providers/:id/photos (multipart)
  - Adds to photos array with sortOrder
- Delete photo: DELETE /api/providers/:id/photos/:photoId
- Reorder: PATCH /api/providers/:id/photos/reorder with new sortOrder
- Next: increment onboardingStep to 8

---

#### 10. Onboarding - Step 9: Banking (Stripe Connect)
**UI:**
- "Connect Stripe" button
- Stripe Connect embedded form
- Shows connection status

**Flow:**
1. Click "Connect Stripe"
2. Redirect to Stripe Connect OAuth
3. Provider authorizes
4. Stripe redirects back with account ID
5. Save: PATCH /api/providers/:id
   ```json
   {
     "payment": {
       "stripeAccountId": "acct_...",
       "stripeOnboardingComplete": true
     }
   }
   ```
6. Next: increment onboardingStep to 9

**Validation:**
- Stripe onboarding must be complete before proceeding

---

#### 11. Onboarding - Step 10: Review & Agreement
**UI:**
- Summary of all entered information (read-only)
- Edit buttons for each section (go back to specific step)
- Provider Agreement (scrollable text)
- "I agree" checkbox (required)
- Signature field (text or signature pad)
- Title field (e.g., "Owner", "Manager")
- Submit button

**Agreement Text:**
```
FINDR HEALTH PROVIDER AGREEMENT

By signing below, you agree to:
1. Provide accurate pricing information
2. Honor quoted prices for 30 days
3. ...
[Full legal agreement text]
```

**Validation:**
- All previous steps must be complete
- "I agree" must be checked
- Signature required
- Title required

**Actions:**
- Sign: PATCH /api/providers/:id
  ```json
  {
    "agreement": {
      "signature": "John Doe",
      "title": "Owner",
      "agreedDate": "2026-01-28T...",
      "ipAddress": "1.2.3.4",
      "version": "1.0"
    },
    "status": "pending",
    "onboardingCompleted": true,
    "onboardingStep": 10
  }
  ```
- Redirect to "Pending Approval" screen

---

#### 12. Dashboard (Post-Onboarding)
**UI After Approval:**
- Provider profile summary
- Edit sections
- Manage services
- View bookings
- Calendar management
- Analytics

---

## Admin Dashboard Requirements

### Admin Actions Required

#### 1. Provider Review Queue
**Screen:** `/admin/providers/pending`

**UI:**
- List of providers with status='pending'
- Sort by submission date
- Filters: provider type, location

**Provider Card Shows:**
- Practice name
- Provider types
- Location (city, state)
- Submitted date
- "Review" button

---

#### 2. Provider Detail Review
**Screen:** `/admin/providers/:id/review`

**Sections:**
1. **Basic Information**
   - Practice name
   - Individual name
   - Provider types
   - Description

2. **Location**
   - Address
   - Map view with pin
   - Coordinates (verify not [0,0])

3. **Contact**
   - Email, phone, website

4. **Services** (editable table)
   - Name, category, price, duration
   - Admin can edit prices if needed

5. **Team**
   - List of team members with photos

6. **Credentials**
   - View uploaded documents
   - Approve/reject each document
   - Add admin notes

7. **Calendar**
   - Business hours
   - Calendar provider

8. **Photos**
   - View all photos
   - Flag inappropriate photos

9. **Agreement**
   - View signed agreement
   - Signature, title, date

**Actions:**
- **Approve:** 
  - Sets status='approved'
  - Sets isVerified=true
  - Sends approval email
- **Reject:**
  - Shows rejection reason form
  - Sets status='rejected'
  - Sends rejection email with reason
- **Request Changes:**
  - Sends email with specific requested changes
  - Keeps status='pending'

---

#### 3. Provider List (All)
**Screen:** `/admin/providers`

**Filters:**
- Status (all, draft, pending, approved, rejected, suspended)
- Provider type
- Location (city, state)
- Verified status

**Actions:**
- Edit provider
- Suspend provider
- Delete provider
- View bookings
- Impersonate (login as provider)

---

#### 4. Provider Edit
**Screen:** `/admin/providers/:id/edit`

**Capabilities:**
- Edit ANY field
- Override validations (with warning)
- Manually set location coordinates
- Manually approve documents
- Force status change

**Critical Actions:**
- Geocode address button (re-geocode if coordinates wrong)
- Reset onboarding (set onboardingStep back)
- Clear cached data

---

## Schema Alignment Matrix

| Field | Database | Provider Portal | Admin Dashboard | Mobile App | Notes |
|-------|----------|----------------|-----------------|------------|-------|
| **BASIC INFO** |
| practiceName | ✅ Required | ✅ Step 1 | ✅ Editable | ✅ Display | |
| name | ✅ Optional | ✅ Step 1 | ✅ Editable | ✅ Display | Individual name |
| providerTypes | ✅ Required | ✅ Step 1 | ✅ Editable | ✅ Filter | Array, min 1 |
| description | ✅ Optional | ✅ Step 1 | ✅ Editable | ✅ Display | |
| specialties | ✅ Optional | ✅ Step 1 | ✅ Editable | ❌ Hidden | |
| **LOCATION** |
| location | ✅ Required GeoJSON | ✅ Step 2 (geocoded) | ✅ Map editor | ✅ Search | CRITICAL |
| location.type | ✅ "Point" | ✅ Auto-set | ✅ Read-only | ✅ Used | Must be "Point" |
| location.coordinates | ✅ [lng, lat] | ✅ Geocoded | ✅ Editable | ✅ Search | Order matters! |
| address.street | ✅ Optional | ✅ Step 2 Required | ✅ Editable | ✅ Display | |
| address.suite | ✅ Optional | ✅ Step 2 Optional | ✅ Editable | ✅ Display | |
| address.city | ✅ Optional | ✅ Step 2 Required | ✅ Editable | ✅ Display | Indexed |
| address.state | ✅ Optional | ✅ Step 2 Required | ✅ Editable | ✅ Display | Indexed |
| address.zip | ✅ Optional | ✅ Step 2 Required | ✅ Editable | ✅ Display | |
| **CONTACT** |
| contactInfo.email | ✅ Required | ✅ Step 3 (pre-filled) | ✅ Editable | ✅ Display | |
| contactInfo.phone | ✅ Required | ✅ Step 3 | ✅ Editable | ✅ Display | |
| contactInfo.website | ✅ Optional | ✅ Step 3 | ✅ Editable | ✅ Display | |
| email (shorthand) | ✅ Optional | ✅ Auto-set | ✅ Auto-set | ✅ Fallback | Backward compat |
| phone (shorthand) | ✅ Optional | ✅ Auto-set | ✅ Auto-set | ✅ Fallback | Backward compat |
| **SERVICES** |
| services | ✅ Array | ✅ Step 4 | ✅ Editable table | ✅ Display list | Min 1 required |
| services[].name | ✅ Required | ✅ Required | ✅ Editable | ✅ Display | |
| services[].category | ✅ Optional | ✅ Dropdown | ✅ Editable | ✅ Filter | |
| services[].description | ✅ Optional | ✅ Optional | ✅ Editable | ✅ Display | |
| services[].price | ✅ Optional | ✅ Required | ✅ Editable | ✅ Display | |
| services[].duration | ✅ Optional | ✅ Optional | ✅ Editable | ✅ Display | Minutes |
| services[].isActive | ✅ Boolean | ✅ Toggle | ✅ Toggle | ✅ Filter | |
| services[].hasVariants | ✅ Boolean | ✅ Toggle | ✅ Read-only | ❌ Hidden | |
| services[].variants | ✅ Array | ✅ Editor | ✅ Editable | ✅ Display | If hasVariants |
| **TEAM** |
| team | ✅ Array | ✅ Step 5 (optional) | ✅ Editable | ✅ Display | |
| team[].name | ✅ Required | ✅ Required | ✅ Editable | ✅ Display | |
| team[].role | ✅ Optional | ✅ Optional | ✅ Editable | ✅ Display | |
| team[].credentials | ✅ Array | ✅ Tags | ✅ Editable | ✅ Display | |
| team[].bio | ✅ Optional | ✅ Textarea | ✅ Editable | ✅ Display | |
| team[].photoUrl | ✅ Optional | ✅ Upload | ✅ Editable | ✅ Display | |
| team[].isActive | ✅ Boolean | ✅ Toggle | ✅ Toggle | ✅ Filter | |
| **CREDENTIALS** |
| credentials.licenses | ✅ Array | ❌ Not editable | ✅ Editable | ❌ Hidden | |
| credentials.certifications | ✅ Array | ✅ Tags | ✅ Editable | ❌ Hidden | |
| credentials.education | ✅ Array | ❌ Missing | ⚠️ Check | ❌ Hidden | Portal needs? |
| credentials.insuranceAccepted | ✅ Array | ✅ Checkboxes | ✅ Editable | ✅ Filter | |
| credentials.languages | ✅ Array | ✅ Checkboxes | ✅ Editable | ✅ Filter | |
| isVerified | ✅ Boolean | ❌ Read-only | ✅ Editable | ✅ Badge | Admin sets |
| verificationDocuments | ✅ Array | ✅ Upload | ✅ Approve/Reject | ❌ Hidden | |
| **CALENDAR** |
| calendar.provider | ✅ Enum | ✅ Step 7 Radio | ✅ Dropdown | ❌ Hidden | manual/acuity/etc |
| calendar.businessHours | ✅ Object | ✅ Step 7 Editor | ✅ Editable | ✅ Booking | If manual |
| calendar.acuityUserId | ✅ Optional | ✅ OAuth | ✅ Editable | ❌ Hidden | If acuity |
| calendar.acuityCalendarId | ✅ Optional | ✅ Select | ✅ Editable | ❌ Hidden | If acuity |
| calendar.bufferMinutes | ✅ Number | ✅ Step 7 | ✅ Editable | ❌ Hidden | |
| calendar.maxAdvanceBookingDays | ✅ Number | ✅ Step 7 | ✅ Editable | ❌ Hidden | |
| **MEDIA** |
| imageUrl | ✅ Optional | ✅ Step 8 (primary) | ✅ Upload | ✅ Display | Primary photo |
| photos | ✅ Array | ✅ Step 8 | ✅ Manager | ✅ Gallery | Additional |
| photos[].url | ✅ Required | ✅ Upload result | ✅ Display | ✅ Display | |
| photos[].caption | ✅ Optional | ✅ Optional | ✅ Editable | ✅ Display | |
| photos[].isFeature | ✅ Boolean | ❌ Not exposed | ✅ Toggle | ✅ Featured | |
| photos[].sortOrder | ✅ Number | ✅ Drag-to-reorder | ✅ Editable | ✅ Order | |
| **PAYMENT** |
| payment.stripeAccountId | ✅ Optional | ✅ Step 9 OAuth | ✅ Display | ❌ Hidden | |
| payment.stripeOnboardingComplete | ✅ Boolean | ✅ Step 9 Status | ✅ Display | ❌ Hidden | |
| payment.acceptsInsurance | ✅ Boolean | ⚠️ Missing in portal? | ✅ Toggle | ✅ Filter | Add to portal |
| payment.acceptsCash | ✅ Boolean | ⚠️ Missing in portal? | ✅ Toggle | ✅ Filter | Add to portal |
| payment.acceptsCard | ✅ Boolean | ⚠️ Missing in portal? | ✅ Toggle | ✅ Filter | Add to portal |
| **STATUS** |
| status | ✅ Enum | ✅ Auto-managed | ✅ Dropdown | ✅ Filter | draft/pending/approved/rejected/suspended |
| onboardingCompleted | ✅ Boolean | ✅ Auto-set | ✅ Display | ❌ Hidden | Set on step 10 |
| onboardingStep | ✅ Number | ✅ Progress bar | ✅ Display | ❌ Hidden | 0-10 |
| **AGREEMENT** |
| agreement.signature | ✅ Optional | ✅ Step 10 Required | ✅ Display | ❌ Hidden | |
| agreement.title | ✅ Optional | ✅ Step 10 Required | ✅ Display | ❌ Hidden | |
| agreement.agreedDate | ✅ Date | ✅ Auto-set | ✅ Display | ❌ Hidden | |
| agreement.ipAddress | ✅ Optional | ✅ Auto-capture | ✅ Display | ❌ Hidden | |
| agreement.version | ✅ Optional | ✅ Auto-set | ✅ Display | ❌ Hidden | |
| **METADATA** |
| amenities | ✅ Array | ⚠️ Missing in portal? | ✅ Checkboxes | ✅ Filter | Add to portal? |
| rating | ✅ Number | ❌ Calculated | ❌ Read-only | ✅ Display | Auto-calculated |
| reviewCount | ✅ Number | ❌ Calculated | ❌ Read-only | ✅ Display | Auto-calculated |
| createdAt | ✅ Auto | ❌ Read-only | ✅ Display | ❌ Hidden | |
| updatedAt | ✅ Auto | ❌ Read-only | ✅ Display | ❌ Hidden | |

### Legend
- ✅ Implemented/Required
- ⚠️ Needs attention/verification
- ❌ Not present/Not needed

---

## Missing Fields Analysis

### Critical Missing (Portal Must Add)

1. **payment.acceptsInsurance**
   - **Where:** Provider Portal Step 6 or 9
   - **UI:** Checkbox "We accept insurance payments"
   - **Default:** false

2. **payment.acceptsCash**
   - **Where:** Provider Portal Step 9
   - **UI:** Checkbox "We accept cash payments"
   - **Default:** true

3. **payment.acceptsCard**
   - **Where:** Provider Portal Step 9
   - **UI:** Checkbox "We accept card payments"
   - **Default:** true

4. **amenities**
   - **Where:** Provider Portal Step 1 or 2
   - **UI:** Checkboxes
     - Parking Available
     - Wheelchair Accessible
     - WiFi Available
     - Waiting Room
     - Kids Friendly
     - Pet Friendly
   - **Default:** []

### Non-Critical Missing (Nice to Have)

5. **credentials.education**
   - **Where:** Provider Portal Step 6
   - **UI:** Tags input
   - **Example:** "Harvard Medical School", "Johns Hopkins"
   - **Default:** []

---

## Data Validation Rules

### Field-Level Validation

```javascript
// Validation rules for each field
const validationRules = {
  
  // Basic Info
  practiceName: {
    required: true,
    minLength: 3,
    maxLength: 100,
    trim: true,
    errorMessages: {
      required: "Practice name is required",
      minLength: "Practice name must be at least 3 characters",
      maxLength: "Practice name cannot exceed 100 characters"
    }
  },
  
  providerTypes: {
    required: true,
    minItems: 1,
    enum: ['Medical', 'Dental', 'Mental Health', 'Massage', 'Skincare/Aesthetics', 'Fitness', 'Yoga', 'Nutrition', 'Pharmacy', 'Urgent Care', 'Other'],
    errorMessages: {
      required: "Please select at least one provider type",
      enum: "Invalid provider type selected"
    }
  },
  
  // Location
  'location.type': {
    required: true,
    enum: ['Point'],
    errorMessages: {
      required: "Location type is required",
      enum: "Location type must be 'Point'"
    }
  },
  
  'location.coordinates': {
    required: true,
    validate: (coords) => {
      // Must be [lng, lat] NOT [lat, lng]
      if (!Array.isArray(coords) || coords.length !== 2) return false;
      const [lng, lat] = coords;
      // Longitude: -180 to 180, Latitude: -90 to 90
      if (lng < -180 || lng > 180) return false;
      if (lat < -90 || lat > 90) return false;
      // Cannot be [0, 0] (invalid default)
      if (lng === 0 && lat === 0) return false;
      return true;
    },
    errorMessages: {
      required: "Location coordinates are required",
      invalid: "Invalid coordinates. Must be [longitude, latitude] with valid ranges."
    }
  },
  
  'address.street': {
    required: true,
    minLength: 5,
    maxLength: 100,
    errorMessages: {
      required: "Street address is required",
      minLength: "Street address must be at least 5 characters"
    }
  },
  
  'address.city': {
    required: true,
    minLength: 2,
    maxLength: 50,
    errorMessages: {
      required: "City is required"
    }
  },
  
  'address.state': {
    required: true,
    enum: ['AL', 'AK', 'AZ', ...], // All US states
    errorMessages: {
      required: "State is required",
      enum: "Invalid state code"
    }
  },
  
  'address.zip': {
    required: true,
    pattern: /^\d{5}(-\d{4})?$/,
    errorMessages: {
      required: "ZIP code is required",
      pattern: "ZIP code must be in format XXXXX or XXXXX-XXXX"
    }
  },
  
  // Contact
  'contactInfo.email': {
    required: true,
    pattern: /^\S+@\S+\.\S+$/,
    lowercase: true,
    errorMessages: {
      required: "Email is required",
      pattern: "Invalid email format"
    }
  },
  
  'contactInfo.phone': {
    required: true,
    pattern: /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,
    errorMessages: {
      required: "Phone number is required",
      pattern: "Phone must be in format (XXX) XXX-XXXX"
    }
  },
  
  'contactInfo.website': {
    required: false,
    pattern: /^https?:\/\/.+/,
    errorMessages: {
      pattern: "Website must start with http:// or https://"
    }
  },
  
  // Services
  services: {
    required: true,
    minItems: 1,
    errorMessages: {
      required: "At least one service is required",
      minItems: "Please add at least one service"
    }
  },
  
  'services[].name': {
    required: true,
    minLength: 3,
    maxLength: 100,
    errorMessages: {
      required: "Service name is required",
      minLength: "Service name must be at least 3 characters"
    }
  },
  
  'services[].price': {
    required: true,
    min: 0,
    max: 100000,
    errorMessages: {
      required: "Service price is required",
      min: "Price cannot be negative",
      max: "Price cannot exceed $100,000"
    }
  },
  
  'services[].duration': {
    required: false,
    min: 5,
    max: 480,
    errorMessages: {
      min: "Duration must be at least 5 minutes",
      max: "Duration cannot exceed 8 hours (480 minutes)"
    }
  },
  
  // Calendar
  'calendar.bufferMinutes': {
    required: false,
    min: 0,
    max: 120,
    errorMessages: {
      min: "Buffer time cannot be negative",
      max: "Buffer time cannot exceed 2 hours (120 minutes)"
    }
  },
  
  'calendar.maxAdvanceBookingDays': {
    required: false,
    min: 1,
    max: 365,
    errorMessages: {
      min: "Must allow booking at least 1 day in advance",
      max: "Cannot allow booking more than 1 year (365 days) in advance"
    }
  },
  
  // Business Hours (if manual calendar)
  'calendar.businessHours.*.start': {
    required: (provider) => provider.calendar?.businessHours?.[day]?.enabled,
    pattern: /^([01]\d|2[0-3]):([0-5]\d)$/,
    errorMessages: {
      required: "Start time is required when day is enabled",
      pattern: "Time must be in HH:MM format (24-hour)"
    }
  },
  
  'calendar.businessHours.*.end': {
    required: (provider) => provider.calendar?.businessHours?.[day]?.enabled,
    pattern: /^([01]\d|2[0-3]):([0-5]\d)$/,
    validate: (end, provider, day) => {
      const start = provider.calendar?.businessHours?.[day]?.start;
      if (!start || !end) return true;
      return end > start; // End must be after start
    },
    errorMessages: {
      required: "End time is required when day is enabled",
      pattern: "Time must be in HH:MM format (24-hour)",
      invalid: "End time must be after start time"
    }
  },
  
  // Photos
  imageUrl: {
    required: true,
    pattern: /^https?:\/\/.+\.(jpg|jpeg|png)$/,
    errorMessages: {
      required: "Primary photo/logo is required",
      pattern: "Image URL must be a valid JPG or PNG image"
    }
  },
  
  // Agreement
  'agreement.signature': {
    required: (provider) => provider.onboardingStep === 10,
    minLength: 2,
    errorMessages: {
      required: "Signature is required to complete onboarding",
      minLength: "Signature must be at least 2 characters"
    }
  },
  
  'agreement.title': {
    required: (provider) => provider.onboardingStep === 10,
    errorMessages: {
      required: "Title is required (e.g., Owner, Manager)"
    }
  }
};
```

### Cross-Field Validation

```javascript
// Validation that requires checking multiple fields
const crossFieldValidation = {
  
  // Cannot proceed to step 10 without completing all fields
  canCompleteOnboarding: (provider) => {
    const errors = [];
    
    if (!provider.practiceName) errors.push("Practice name missing");
    if (!provider.providerTypes?.length) errors.push("Provider types missing");
    if (!provider.location?.coordinates) errors.push("Location missing");
    if (!provider.address?.city) errors.push("Address incomplete");
    if (!provider.contactInfo?.email) errors.push("Email missing");
    if (!provider.contactInfo?.phone) errors.push("Phone missing");
    if (!provider.services?.length) errors.push("Services missing");
    if (!provider.imageUrl) errors.push("Primary photo missing");
    if (!provider.calendar?.provider) errors.push("Calendar setup incomplete");
    if (!provider.payment?.stripeOnboardingComplete) errors.push("Payment setup incomplete");
    
    return errors;
  },
  
  // Location coordinates must match address
  locationMatchesAddress: async (provider) => {
    if (!provider.location?.coordinates || !provider.address?.city) return true;
    
    const [lng, lat] = provider.location.coordinates;
    const geocoded = await geocodeAddress(
      `${provider.address.street}, ${provider.address.city}, ${provider.address.state} ${provider.address.zip}`
    );
    
    // Allow 0.01 degree tolerance (~1km)
    const lngDiff = Math.abs(geocoded.lng - lng);
    const latDiff = Math.abs(geocoded.lat - lat);
    
    if (lngDiff > 0.01 || latDiff > 0.01) {
      return {
        valid: false,
        message: "Location coordinates don't match address. Please re-geocode."
      };
    }
    
    return { valid: true };
  },
  
  // Business hours: at least one day must be enabled
  hasBusinessHours: (provider) => {
    if (provider.calendar?.provider !== 'manual') return true;
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const hasEnabledDay = days.some(day => provider.calendar?.businessHours?.[day]?.enabled);
    
    if (!hasEnabledDay) {
      return {
        valid: false,
        message: "At least one day must be enabled in business hours"
      };
    }
    
    return { valid: true };
  }
};
```

---

## API Requirements

### Provider Portal APIs

#### 1. Signup
```
POST /api/auth/signup
Body: {
  email: string (required),
  password: string (required, min 8 chars),
  practiceName: string (required)
}
Response: {
  success: boolean,
  token: string (JWT),
  provider: {
    _id: string,
    email: string,
    practiceName: string,
    status: "draft",
    onboardingStep: 0,
    onboardingCompleted: false
  }
}
```

#### 2. Login
```
POST /api/auth/login
Body: {
  email: string,
  password: string
}
Response: {
  success: boolean,
  token: string (JWT),
  provider: {...}
}
```

#### 3. Get Provider Profile
```
GET /api/providers/me
Headers: Authorization: Bearer <token>
Response: {
  success: boolean,
  provider: {...}  // Full provider object
}
```

#### 4. Update Provider
```
PATCH /api/providers/:id
Headers: Authorization: Bearer <token>
Body: {
  // Any provider fields to update
  // Validates according to rules above
}
Response: {
  success: boolean,
  provider: {...},  // Updated provider
  errors: [...]     // Validation errors if any
}
```

#### 5. Upload Photo
```
POST /api/providers/:id/photos
Headers: 
  Authorization: Bearer <token>
  Content-Type: multipart/form-data
Body: FormData with 'photo' field
Response: {
  success: boolean,
  photoUrl: string,
  provider: {...}  // Updated provider with new photo
}
```

#### 6. Upload Document
```
POST /api/providers/:id/documents
Headers: 
  Authorization: Bearer <token>
  Content-Type: multipart/form-data
Body: FormData with 'document' field and 'type' field
Response: {
  success: boolean,
  documentUrl: string,
  verificationDocument: {
    _id: string,
    type: string,
    url: string,
    status: "pending",
    uploadedAt: Date
  }
}
```

#### 7. Geocode Address
```
POST /api/geocode
Body: {
  street: string,
  city: string,
  state: string,
  zip: string
}
Response: {
  success: boolean,
  coordinates: [lng, lat],
  formattedAddress: string
}
```

### Admin Dashboard APIs

#### 8. Get Pending Providers
```
GET /api/admin/providers/pending
Headers: Authorization: Bearer <admin-token>
Response: {
  success: boolean,
  providers: [...],
  count: number
}
```

#### 9. Review Provider
```
PATCH /api/admin/providers/:id/review
Headers: Authorization: Bearer <admin-token>
Body: {
  action: "approve" | "reject" | "request_changes",
  reason: string (required if reject),
  changes_requested: string (required if request_changes)
}
Response: {
  success: boolean,
  provider: {...},
  emailSent: boolean
}
```

#### 10. Update Provider (Admin)
```
PATCH /api/admin/providers/:id
Headers: Authorization: Bearer <admin-token>
Body: {
  // Any provider fields
  // Admin can override validations
}
Response: {
  success: boolean,
  provider: {...}
}
```

---

## Migration Plan

### Phase 1: Audit (1 day)
1. Check Admin Dashboard code
2. Identify all provider CRUD operations
3. List fields currently used
4. Compare with current database schema
5. Document gaps

### Phase 2: Database Migration (1 day)
1. Create migration script:
   ```javascript
   // scripts/migrate-providers.js
   
   async function migrateProviders() {
     const providers = await Provider.find({});
     
     for (const provider of providers) {
       let updated = false;
       
       // Fix location if coordinates are [0, 0]
       if (provider.location?.coordinates?.[0] === 0 && 
           provider.location?.coordinates?.[1] === 0) {
         
         // Try to geocode from address
         if (provider.address?.city && provider.address?.state) {
           const coords = await geocode(
             `${provider.address.street}, ${provider.address.city}, ${provider.address.state} ${provider.address.zip}`
           );
           
           provider.location = {
             type: 'Point',
             coordinates: [coords.lng, coords.lat]
           };
           updated = true;
         }
       }
       
       // Add missing fields with defaults
       if (!provider.onboardingCompleted) {
         provider.onboardingCompleted = provider.status === 'approved';
         updated = true;
       }
       
       if (!provider.onboardingStep) {
         provider.onboardingStep = provider.onboardingCompleted ? 10 : 0;
         updated = true;
       }
       
       // Ensure agreement version
       if (provider.agreement?.signature && !provider.agreement.version) {
         provider.agreement.version = '1.0';
         updated = true;
       }
       
       // Save if changed
       if (updated) {
         await provider.save();
         console.log(`Migrated provider: ${provider.practiceName}`);
       }
     }
   }
   ```

2. Test migration on staging
3. Run migration on production
4. Verify all providers have valid data

### Phase 3: Provider Portal Update (2 days)
1. Update all onboarding steps to use current schema
2. Add missing fields (payment options, amenities)
3. Add validation according to rules
4. Test complete onboarding flow
5. Deploy to staging
6. QA testing
7. Deploy to production

### Phase 4: Admin Dashboard Update (1 day)
1. Update provider edit forms
2. Add missing fields to UI
3. Update approval flow
4. Test CRUD operations
5. Deploy

### Phase 5: Testing & Documentation (1 day)
1. End-to-end onboarding test
2. Admin review test
3. Mobile app provider detail test
4. Clarity AI search test
5. Update documentation
6. Create video walkthrough

---

## Testing Checklist

### Provider Portal Onboarding

- [ ] **Step 1: Basic Info**
  - [ ] Practice name validation (required, 3-100 chars)
  - [ ] Provider types validation (min 1 selected)
  - [ ] Save and proceed to step 2

- [ ] **Step 2: Location**
  - [ ] Address validation (all required fields)
  - [ ] Geocoding works correctly
  - [ ] Coordinates are [lng, lat] (correct order)
  - [ ] Coordinates are not [0, 0]
  - [ ] Map shows correct pin location
  - [ ] Save and proceed to step 3

- [ ] **Step 3: Contact**
  - [ ] Email validation (format)
  - [ ] Phone validation (US format)
  - [ ] Website validation (optional, valid URL)
  - [ ] Save and proceed to step 4

- [ ] **Step 4: Services**
  - [ ] Can add service
  - [ ] Service validation (name, price required)
  - [ ] Can edit service
  - [ ] Can delete service
  - [ ] Cannot proceed without at least 1 service
  - [ ] Variants work if enabled
  - [ ] Save and proceed to step 5

- [ ] **Step 5: Team** (optional)
  - [ ] Can skip
  - [ ] Can add team member
  - [ ] Photo upload works
  - [ ] Can edit/delete team member
  - [ ] Save and proceed to step 6

- [ ] **Step 6: Credentials**
  - [ ] Can upload license (required)
  - [ ] Can upload insurance (optional)
  - [ ] Can upload certifications (optional)
  - [ ] File validation (size, type)
  - [ ] Insurance checkboxes work
  - [ ] Languages checkboxes work
  - [ ] Save and proceed to step 7

- [ ] **Step 7: Calendar**
  - [ ] Can select manual provider
  - [ ] Business hours editor works
  - [ ] Start time < end time validation
  - [ ] At least one day must be enabled
  - [ ] Buffer time validation
  - [ ] Max advance booking validation
  - [ ] Acuity OAuth works (if implemented)
  - [ ] Save and proceed to step 8

- [ ] **Step 8: Photos**
  - [ ] Can upload primary photo (required)
  - [ ] Can upload additional photos
  - [ ] Can delete photos
  - [ ] Can reorder photos
  - [ ] File validation works
  - [ ] Save and proceed to step 9

- [ ] **Step 9: Banking**
  - [ ] Stripe Connect button works
  - [ ] OAuth flow completes
  - [ ] stripeAccountId saved
  - [ ] stripeOnboardingComplete set to true
  - [ ] Cannot proceed without completing
  - [ ] Save and proceed to step 10

- [ ] **Step 10: Agreement**
  - [ ] All sections summary displayed correctly
  - [ ] Edit buttons work (go back to specific step)
  - [ ] Agreement text displayed
  - [ ] "I agree" checkbox required
  - [ ] Signature field required
  - [ ] Title field required
  - [ ] Submit sets status to 'pending'
  - [ ] Submit sets onboardingCompleted to true
  - [ ] Submit sets onboardingStep to 10
  - [ ] Redirects to pending approval screen

### Admin Dashboard

- [ ] **Provider Review Queue**
  - [ ] Pending providers list displays
  - [ ] Filters work (type, location)
  - [ ] Sort by date works
  - [ ] Review button navigates to detail

- [ ] **Provider Detail Review**
  - [ ] All sections display correctly
  - [ ] Documents are viewable
  - [ ] Map shows correct location
  - [ ] Coordinates verified (not [0,0])
  - [ ] Agreement signature visible
  - [ ] Approve button works
    - [ ] Sets status='approved'
    - [ ] Sets isVerified=true
    - [ ] Sends approval email
  - [ ] Reject button works
    - [ ] Shows reason form
    - [ ] Sets status='rejected'
    - [ ] Sends rejection email
  - [ ] Request changes works
    - [ ] Shows changes form
    - [ ] Sends email to provider
    - [ ] Keeps status='pending'

- [ ] **Provider Edit**
  - [ ] Can edit any field
  - [ ] Geocode button re-geocodes address
  - [ ] Validation warnings show
  - [ ] Save works
  - [ ] Changes reflected in mobile app

### Mobile App

- [ ] **Provider Search**
  - [ ] Geospatial search works
  - [ ] Distance calculated correctly
  - [ ] Only approved providers shown
  - [ ] Provider types filter works

- [ ] **Provider Detail**
  - [ ] All fields display correctly
  - [ ] Services list correct
  - [ ] Team members shown
  - [ ] Photos gallery works
  - [ ] Location map correct

- [ ] **Clarity AI**
  - [ ] Provider search works
  - [ ] Provider cards render
  - [ ] Distance shown correctly
  - [ ] Tapping card navigates to detail
  - [ ] Only shows providers within 100 miles
  - [ ] AI response is brief (2-3 sentences)

---

**Document Owner:** Engineering & Product Teams  
**Created:** January 28, 2026  
**Last Updated:** January 28, 2026  
**Status:** Active - Provider Portal MVP in development  
**Next Review:** February 5, 2026 (after Portal MVP completion)
