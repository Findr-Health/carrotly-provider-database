# COMPREHENSIVE CONVERSATION SUMMARY
## Carrotly Provider Onboarding - Complete Project Context

**Date:** November 3, 2025  
**Project:** Carrotly Provider MVP  
**Status:** Design specification updated with new features  

---

## 🎯 PROJECT OVERVIEW

### What is Carrotly?
- Healthcare/wellness marketplace platform
- Connects patients with providers (medical, dental, cosmetic, fitness, mental health, etc.)
- Providers can list services and accept bookings
- Payments processed through Stripe

### Tech Stack
- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Deployment:** Vercel (auto-deploy on push to main)
- **State Management:** React hooks + localStorage
- **Icons:** Lucide React

---

## 📋 WHAT WE ACCOMPLISHED IN THIS CONVERSATION

### Initial State (Before This Conversation)
The provider onboarding flow had **7 steps**:
1. The Basics
2. Location
3. Photos
4. Services
5. Optional Details
6. Review
7. Legal Agreement

### What We Added (Version 2.0)
We expanded the onboarding to **10 steps** by adding:

#### 1. **Step 6: Payment & Payout** (NEW - REQUIRED)
- How providers receive payments from bookings
- Two options:
  - **Stripe Connect Express** (Recommended)
    - OAuth flow to connect Stripe account
    - Automatic payouts
    - Handles tax forms (1099-K)
    - PCI compliant
  - **Direct Bank Transfer**
    - Manual entry of bank details
    - Routing number, account number
    - Takes 3-5 business days
- Payout schedule (Daily/Weekly/Monthly)
- Tax information collection
  - Business type selection
  - Tax ID (SSN last 4 or EIN)
- Payment terms agreement checkbox
- Platform fees disclosed: 15% + Stripe fees (2.9% + $0.30)

#### 2. **Step 7: Calendar & Availability** (NEW - OPTIONAL)
- Calendar integration to prevent double-bookings
- Supported providers:
  - Google Calendar (OAuth)
  - Microsoft Outlook (OAuth)
  - Apple iCloud Calendar
  - Manual (no integration)
- Sync settings:
  - Two-way sync (recommended): Carrotly ↔ Provider calendar
  - One-way sync: Carrotly → Provider calendar only
  - Buffer time between appointments (0-60 minutes)
- Business hours configuration:
  - Weekly schedule grid (Mon-Sun)
  - Start/end times (15-minute increments)
  - Break times
  - Quick presets (Standard 9-5, Extended 8-7, etc.)
- Team member calendar connections (if applicable)
- Can be skipped - optional step

#### 3. **Step 8: Team Members** (NEW - OPTIONAL)
- Add team member profiles to build trust
- Can add up to 20 team members
- For each team member:
  - **Photo** (required) - headshot, circular display, max 2MB
  - **Full name** (required)
  - **Title/role** (required) - e.g., "Nurse Practitioner"
  - **Credentials** (optional) - e.g., "MD, RN, DPT"
  - **Years of experience** (optional)
  - **Short bio** (optional, 300 char max)
  - **Specialties** (optional) - tag chips
  - **Can accept bookings** checkbox
  - Calendar connection option per member
- Empty state encourages adding team
- Can be skipped - optional step

### Updated Steps
- **Step 9: Review** - Now includes summaries of Payment, Calendar, and Team Members
- **Step 10: Legal Agreement** - Renumbered from Step 7 (no changes to content)

---

## 🔑 KEY DECISIONS MADE

### Payment & Payout
- **Chose Stripe Connect Express** as recommended method
  - Less liability for platform
  - Better UX (hosted onboarding)
  - Automatic tax compliance
  - Fraud protection
- Bank transfer available as alternative
- Required step (can't skip)
- Collects minimum info needed for compliance

### Calendar Integration
- **Two-way sync as default** to prevent double-bookings
- **Optional step** - doesn't block onboarding
- OAuth flow keeps credentials secure
- Real-time webhook syncing
- Supports multiple calendar providers
- Business hours can be set without calendar connection

### Team Members
- **Completely optional** - solo practitioners can skip
- Photos are circular (professional headshot style)
- Limited to 20 members (reasonable cap)
- Can designate bookable vs. display-only members
- Increases trust and booking rates per user research

---

## 📄 DOCUMENTS CREATED

### 1. PROVIDER_ONBOARDING_DESIGNER_SPEC.md (UPDATED)
**Purpose:** Complete UI/UX specification for designers  
**Location:** `/mnt/user-data/outputs/`  
**Size:** ~3000+ lines  
**Version:** 2.0  

**Contents:**
- All 10 steps fully documented
- Every field, label, placeholder, validation rule
- Visual states (default, hover, error, success)
- Exact colors (hex codes)
- Typography specs
- Spacing measurements
- Mobile responsive breakpoints
- Icon references
- Animation details
- Data structure
- Accessibility requirements

**Key Sections:**
- Global elements (header, progress bar, navigation)
- Step 1-10 (complete specifications)
- Completion page
- Form validation summary
- Responsive breakpoints
- Color palette
- Typography system
- Spacing scale
- Icon library
- Animations
- Accessibility
- Data persistence

### 2. CONVERSATION_SUMMARY.md (ORIGINAL)
**Purpose:** Summary of previous conversation about legal agreement  
**Note:** This is now superseded by current conversation

---

## 🎨 DESIGN SYSTEM SUMMARY

### Colors
- **Primary Blue:** #3B82F6
- **Success Green:** #10B981
- **Error Red:** #EF4444
- **Warning Yellow:** #F59E0B
- **Stripe Blue:** #635BFF
- **Gray Scale:** 50-900 (Tailwind standard)

### Typography
- **Font Family:** Inter, system-ui, sans-serif
- **Monospace:** Menlo, Monaco (for initials)
- **Serif:** Georgia (for signatures)
- **Sizes:** xs (12px) to 4xl (36px)

### Spacing
- Tailwind scale (4px increments)
- Consistent padding/margins throughout

### Icons
- **Library:** Lucide React
- Common: Check, X, ChevronDown, Camera, Upload, Calendar, Users, Lock, DollarSign

---

## 💾 DATA STRUCTURE

### localStorage Key
`carrotlyProviderData`

### Complete Provider Object
```javascript
{
  // Step 1: Basics
  practiceName: string,
  providerTypes: string[], // ["medical", "dental", ...]
  phone: string,
  email: string,
  
  // Step 2: Location
  address: {
    street: string,
    suite?: string,
    city: string,
    state: string,
    zip: string
  },
  website?: string,
  
  // Step 3: Photos
  photos: {
    primary: string, // base64
    gallery: string[] // base64 array
  },
  
  // Step 4: Services
  services: string[], // service IDs
  
  // Step 5: Optional Details
  optionalInfo?: {
    licenseNumber?: string,
    licenseState?: string,
    licenseExpiration?: string,
    certifications?: string[],
    insuranceAccepted?: string[],
    yearsExperience?: number,
    education?: string,
    languagesSpoken?: string[]
  },
  
  // Step 6: Payment & Payout ⭐ NEW
  payment: {
    method: "stripe" | "bank",
    stripeAccountId?: string,
    stripeEmail?: string,
    bankDetails?: {
      bankName: string,
      accountHolder: string,
      routingNumber: string, // encrypted
      accountNumber: string, // encrypted
      accountType: "checking" | "savings"
    },
    payoutSchedule: "daily" | "weekly" | "monthly",
    taxInfo: {
      businessType: string,
      taxId: string // encrypted
    }
  },
  
  // Step 7: Calendar & Availability ⭐ NEW
  calendar?: {
    provider: "google" | "microsoft" | "apple" | "manual",
    accessToken?: string, // encrypted
    refreshToken?: string, // encrypted
    calendarId?: string,
    calendarEmail?: string,
    syncDirection: "two-way" | "one-way",
    syncBusyOnly: boolean,
    bufferMinutes: number,
    businessHours: {
      monday: { enabled: boolean, start: string, end: string, breaks: string[] },
      // ... all 7 days
    }
  },
  
  // Step 8: Team Members ⭐ NEW
  teamMembers?: [{
    id: string,
    photo: string, // base64
    name: string,
    title: string,
    credentials?: string,
    yearsExperience?: number,
    bio?: string,
    specialties?: string[],
    acceptsBookings: boolean,
    calendarConnected?: boolean
  }],
  
  // Step 10: Agreement
  agreement: {
    initials: Record<number, string>, // {1: "JS", 2: "JS", ...}
    signature: string,
    title?: string,
    agreedDate: string,
    version: string
  },
  
  // Metadata
  id: string,
  createdAt: string,
  completedAt?: string,
  status: "draft" | "pending" | "approved"
}
```

---

## 🔧 TECHNICAL REQUIREMENTS FOR DEVELOPERS

### APIs to Integrate

#### 1. Stripe Connect Express
- **Setup:** Create Stripe Connect account in dashboard
- **OAuth Flow:** 
  - Redirect to Stripe hosted onboarding
  - Receive authorization code
  - Exchange for access/refresh tokens
- **Scopes Needed:** 
  - Account management
  - Payment processing
- **Webhook Events:**
  - `account.updated`
  - `payout.paid`
  - `payout.failed`

#### 2. Google Calendar API
- **OAuth 2.0 Setup:** Google Cloud Console
- **Scopes:**
  - `https://www.googleapis.com/auth/calendar.events`
  - `https://www.googleapis.com/auth/calendar.readonly`
- **Webhooks:** Push notifications for calendar changes
- **API Calls:**
  - List events
  - Create event
  - Update event
  - Delete event

#### 3. Microsoft Graph API (Calendar)
- **OAuth 2.0 Setup:** Azure AD
- **Scopes:**
  - `Calendars.ReadWrite`
  - `User.Read`
- **Webhooks:** Change notifications
- **Endpoints:**
  - `/me/calendar/events`
  - `/me/calendars`

#### 4. Apple Calendar (CalDAV)
- **Protocol:** CalDAV
- **Authentication:** OAuth or app-specific password
- **Less common - consider Phase 2**

---

## ✅ VALIDATION RULES SUMMARY

### Required Fields
**Step 1:**
- Practice name
- At least 1 provider type
- Phone
- Email (valid format)

**Step 2:**
- Street address
- City
- State
- ZIP code

**Step 3:**
- At least 1 photo (max 5)
- Each photo max 5MB

**Step 4:**
- At least 2 services selected

**Step 5:**
- All optional (can skip)

**Step 6:**
- Payment method selected
- If Stripe: Account connected
- If Bank: All bank fields valid
- Payout schedule selected
- Tax information complete
- Payment terms agreed

**Step 7:**
- All optional (can skip)
- If calendar connected, must select sync settings

**Step 8:**
- All optional (can skip)
- If adding member: Photo, name, title required

**Step 9:**
- Review only (no new data)

**Step 10:**
- All 16 sections initialed (2-4 characters each)
- Signature provided (3+ characters)

---

## 📊 PROJECT STATISTICS

### Before (v1.0)
- **Total Steps:** 7
- **Required Fields:** 12
- **Optional Fields:** 25+
- **Completion Time:** 10-15 minutes

### After (v2.0)
- **Total Steps:** 10
- **Required Fields:** ~20
- **Optional Fields:** 40+
- **Completion Time:** 15-20 minutes
- **New Features:** 3 major additions

---

## 🎯 USER FLOW SUMMARY

1. **Basics** - Name, type, contact (2 min)
2. **Location** - Address, website (1 min)
3. **Photos** - Upload 1-5 photos (2 min)
4. **Services** - Select offerings (3 min)
5. **Optional Details** - Credentials, insurance (2 min - can skip)
6. **Payment** - Connect Stripe or bank (3 min)
7. **Calendar** - Connect calendar, set hours (3 min - can skip)
8. **Team** - Add team members (2 min - can skip)
9. **Review** - Verify all info (1 min)
10. **Agreement** - Initial & sign 16 sections (3 min)
11. **Complete** - Success page, next steps

---

## 🚀 NEXT STEPS FOR IMPLEMENTATION

### Immediate (Phase 1)
1. ✅ Update designer spec (DONE)
2. Update React components:
   - Create `StepPayment.tsx`
   - Create `StepCalendar.tsx`
   - Create `StepTeamMembers.tsx`
   - Update `StepReview.tsx`
   - Update `OnboardingWizard.tsx` (step count, routing)
3. Update TypeScript interfaces in `types/index.ts`
4. Implement Stripe Connect OAuth flow
5. Implement Google Calendar OAuth flow
6. Update localStorage schema
7. Add validation logic for new fields

### Phase 2 (Post-MVP)
- Microsoft Calendar integration
- Apple Calendar integration
- Advanced team member features
- Multiple calendars per provider
- Timezone handling
- Recurring availability patterns
- Team scheduling view

---

## 📝 IMPORTANT NOTES

### Security Considerations
- All sensitive data must be encrypted:
  - Bank account numbers
  - Routing numbers
  - Tax IDs (SSN/EIN)
  - OAuth tokens
- Use HTTPS everywhere
- PCI compliance for payment data
- HIPAA compliance for PHI
- Stripe handles most payment security

### Legal/Compliance
- Tax forms required for $600+ earnings
- 1099-K sent annually
- Provider agreement has 16 sections
- Independent contractor relationship
- Insurance requirements ($1M/$3M)
- HIPAA BAA if PHI exchanged

### User Experience
- Optional steps can be skipped
- All data persists in localStorage
- Can return to onboarding anytime
- Mobile-responsive throughout
- Accessibility WCAG 2.1 AA compliant
- Clear progress indication

---

## 🔗 FILE LOCATIONS

### In Project Repository
```
carrotly-provider-mvp/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   └── index.tsx
│   │   └── onboarding/
│   │       ├── StepBasics.tsx
│   │       ├── StepLocation.tsx
│   │       ├── StepPhotos.tsx
│   │       ├── StepServices.tsx
│   │       ├── StepOptionalDetails.tsx
│   │       ├── StepPayment.tsx (TO CREATE)
│   │       ├── StepCalendar.tsx (TO CREATE)
│   │       ├── StepTeamMembers.tsx (TO CREATE)
│   │       ├── StepReview.tsx (TO UPDATE)
│   │       └── StepAgreement.tsx
│   ├── pages/
│   │   ├── OnboardingWizard.tsx (TO UPDATE)
│   │   ├── Complete.tsx
│   │   ├── Dashboard.tsx
│   │   └── ProfilePreview.tsx
│   ├── types/
│   │   └── index.ts (TO UPDATE)
│   ├── data/
│   │   └── providerData.ts
│   └── hooks/
│       └── useProviderData.ts
└── public/
    └── [PDF agreements]
```

---

## 💡 QUESTIONS TO RESOLVE (Future)

### Payment
- What's the exact platform fee percentage? (Currently: 15%)
- Minimum payout threshold?
- International provider support?
- Multi-currency support?

### Calendar
- Should we support calendar templates?
- How to handle timezone differences?
- PTO/vacation blocking?
- Recurring unavailability patterns?

### Team Members
- Can team members log into the portal?
- Individual permissions per member?
- Should patients select specific team members when booking?
- Team-wide vs. individual calendars?

### General
- Email verification required?
- SMS verification for phone?
- Background check integration?
- Credential verification process?
- Approval workflow details?

---

## 🎓 CONTEXT FOR NEXT CONVERSATION

### What to Share with New Claude:
1. This entire summary document
2. The updated `PROVIDER_ONBOARDING_DESIGNER_SPEC.md` file
3. Mention that this is a working project on Vercel
4. React + TypeScript + Vite + Tailwind stack
5. Currently updating from v1.0 (7 steps) to v2.0 (10 steps)

### Current Task Status:
- ✅ Design specification complete
- ✅ All new steps documented
- ⏳ Implementation pending
- ⏳ Component creation needed
- ⏳ OAuth integrations needed

### Key Context Points:
- Healthcare/wellness marketplace
- Providers list services, patients book appointments
- Payment flows: Patient → Stripe → Platform → Provider
- Calendar integration prevents double-bookings
- Team members build trust with patients
- Legal agreement is 16 sections with initials + signature
- All data stored in localStorage (temp, needs backend eventually)

---

## 📞 SUPPORT RESOURCES

### Stripe Documentation
- https://stripe.com/docs/connect
- https://stripe.com/docs/connect/express-accounts
- https://stripe.com/docs/connect/enable-payment-acceptance-guide

### Google Calendar API
- https://developers.google.com/calendar/api/v3/reference
- https://developers.google.com/calendar/api/guides/overview

### Microsoft Graph API
- https://learn.microsoft.com/en-us/graph/api/resources/calendar
- https://learn.microsoft.com/en-us/graph/api/resources/event

### React + TypeScript
- https://react.dev/
- https://www.typescriptlang.org/docs/

---

## ✨ SUCCESS METRICS

Once implemented, track:
- Onboarding completion rate
- Average time to complete
- Drop-off points (which steps lose users?)
- Stripe connection success rate
- Calendar connection rate
- Team member addition rate
- Payment method preference (Stripe vs Bank)
- Calendar provider distribution (Google vs Microsoft)

---

**END OF SUMMARY**

This document contains everything needed to continue work on the Carrotly Provider Onboarding feature in a new conversation. Share this entire document plus the updated PROVIDER_ONBOARDING_DESIGNER_SPEC.md with the next Claude instance for full context.
