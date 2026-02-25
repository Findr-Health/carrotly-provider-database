# Findr Health - Complete Project Overview
## Legal Document Reference Guide

---

## Executive Summary

**Findr Health** is a healthcare cost transparency platform that connects patients with healthcare providers while providing clear, upfront pricing information. The platform eliminates the uncertainty of healthcare costs by showing cash-pay prices before appointments are booked.

**Mission**: Make healthcare pricing as transparent and predictable as booking a hotel or restaurant.

**Target Market**: 
- Self-pay patients
- High-deductible health plan members
- Patients seeking elective/cosmetic procedures
- Anyone wanting to compare healthcare prices

---

## Platform Components

### 1. Consumer Mobile App (Flutter)
- **Purpose**: Allow patients to discover providers, compare prices, and book appointments
- **Platform**: iOS and Android
- **Key Features**:
  - Provider search by location, specialty, service
  - Price comparison across providers
  - AI-powered cost calculator (Morgan)
  - Appointment booking
  - Saved favorites
  - Booking history

### 2. Provider Onboarding Portal
- **URL**: providers.findrhealth.com
- **Purpose**: Allow healthcare providers to join the platform
- **Key Features**:
  - Business information collection
  - Service and pricing setup
  - Photo uploads
  - Team member management
  - Credential verification
  - Business hours configuration
  - Cancellation policy selection
  - Provider agreement acceptance
  - Password/account creation

### 3. Provider Dashboard
- **URL**: providers.findrhealth.com/dashboard
- **Purpose**: Allow providers to manage their listing and view analytics
- **Key Features**:
  - Profile editing (all onboarding fields)
  - Analytics dashboard (views, inquiries, bookings, revenue)
  - Service management
  - Team member management
  - Photo management
  - Cancellation policy management
  - Profile preview (patient view)

### 4. Admin Dashboard
- **URL**: carrotly-provider-database.vercel.app
- **Purpose**: Internal tool for Findr Health staff to manage the platform
- **Key Features**:
  - Provider approval/rejection
  - Provider verification badges
  - Featured provider management
  - User management
  - Booking oversight
  - Review moderation
  - Inquiry management
  - Analytics overview
  - Role-based access control (RBAC)

### 5. Backend API
- **Platform**: Railway (Node.js + MongoDB)
- **Purpose**: Central API serving all frontend applications
- **Key Endpoints**:
  - Provider CRUD operations
  - User authentication
  - Booking management
  - Search functionality
  - Analytics data
  - Admin operations

---

## User Types & Roles

### Patients (Consumers)
- Browse providers without account
- Must create account to book appointments
- Can save favorites, leave reviews
- Receive booking confirmations via email/push
- Subject to provider cancellation policies

### Healthcare Providers
- Must complete onboarding and be approved
- Set their own prices for services
- Choose cancellation policy (Standard or Moderate)
- Receive 85% of booking amount (15% platform fee)
- Can waive cancellation fees on case-by-case basis
- Responsible for their own licensing, insurance, HIPAA compliance

### Admin Users (Findr Health Staff)
- **Super Admin**: Full access to all features
- **Admin**: Provider management, user management
- **Moderator**: Review moderation, content management
- **Support**: Read-only access, can respond to inquiries
- **Analyst**: Analytics access only

---

## Provider Types Supported

| Category | Examples |
|----------|----------|
| Medical | Primary care, specialists, urgent care |
| Dental | General dentistry, orthodontics, oral surgery |
| Mental Health | Therapy, psychiatry, counseling |
| Skincare/Aesthetics | Med spas, dermatology, cosmetic procedures |
| Massage/Bodywork | Massage therapy, chiropractic, physical therapy |
| Fitness/Training | Personal training, fitness assessments |
| Yoga/Pilates | Studios, private sessions |
| Nutrition/Wellness | Dietitians, wellness coaching |
| Pharmacy/RX | Prescription services |

---

## Financial Model

### For Providers
- **Platform Fee**: 15% of each transaction
- **Stripe Processing**: ~2.9% + $0.30 per transaction
- **Net to Provider**: ~82% of booking amount
- **Payout Schedule**: Configurable (daily, weekly, monthly)

### For Patients
- **Service Fee**: May apply (displayed at checkout)
- **Payment**: Credit/debit card via Stripe
- **Cancellation Fees**: Based on provider's policy

### Cancellation Policy Structure

**Standard Policy (Recommended)**
| Timeframe | Patient Receives | Fee Charged |
|-----------|------------------|-------------|
| 24+ hours before | 100% refund | None |
| 12-24 hours before | 75% refund | 25% |
| Under 12 hours | 50% refund | 50% |
| No-show | No refund | 100% |

**Moderate Policy (Specialists)**
| Timeframe | Patient Receives | Fee Charged |
|-----------|------------------|-------------|
| 48+ hours before | 100% refund | None |
| 24-48 hours before | 75% refund | 25% |
| Under 24 hours | 50% refund | 50% |
| No-show | No refund | 100% |

**Provider Cancellation**: Always results in 100% refund to patient

---

## Data Collected

### From Providers
- Business name and type
- Contact information (phone, email, website)
- Physical address
- Business hours
- Service offerings with prices and durations
- Team member information
- Photos of facility
- Credentials (license, NPI, education)
- Insurance accepted
- Cancellation policy preference
- Bank/payout information (via Stripe Connect)

### From Patients
- Name and contact information
- Account credentials
- Location (for search)
- Saved providers/favorites
- Booking history
- Payment methods (via Stripe)
- Reviews and ratings

### From Bookings
- Service selected
- Date/time
- Provider and patient
- Amount paid
- Cancellation status and fees
- Notes/special requests

---

## Third-Party Integrations

| Service | Purpose | Data Shared |
|---------|---------|-------------|
| **Stripe** | Payment processing | Payment info, transaction data |
| **Stripe Connect** | Provider payouts | Bank info, earnings |
| **Google Places** | Business search during onboarding | Business name, address |
| **OpenStreetMap** | Geolocation, maps | Location coordinates |
| **Resend** | Transactional email | Email addresses, booking info |
| **MongoDB Atlas** | Database | All platform data |
| **Railway** | Backend hosting | All API data |
| **Vercel** | Frontend hosting | None (static hosting) |
| **Apple/Google** | App distribution | App metadata |

---

## Compliance Considerations

### HIPAA
- Findr Health facilitates booking but does not store Protected Health Information (PHI)
- Medical records remain with providers
- Providers are responsible for their own HIPAA compliance
- Platform stores only scheduling and payment data

### State Licensing
- Providers must maintain valid licenses in their state
- Platform verifies license information during onboarding
- Providers self-attest to license validity

### Insurance Requirements
- Providers must carry professional liability insurance ($1M/$3M minimum)
- Providers self-attest to insurance coverage

### Payment Card Industry (PCI)
- All payment processing through Stripe (PCI compliant)
- Findr Health never stores full card numbers

---

## Dispute Resolution

### Patient-Provider Disputes
1. Patients may report issues through app
2. Findr Health support reviews complaint
3. Mediation attempted between parties
4. Binding arbitration for unresolved disputes

### Cancellation Disputes
1. System automatically calculates fee based on policy
2. Providers can waive fees at discretion
3. Disputed fees reviewed by Findr Health support
4. Final decision at Findr Health discretion

---

## Key Legal Documents Needed

### 1. Provider Participation Agreement
**Purpose**: Contract between Findr Health and healthcare providers
**Key Sections**:
- Platform access and listing terms
- Fee structure (15% platform fee)
- Cancellation policy obligations
- Insurance requirements ($1M/$3M)
- HIPAA compliance responsibility
- Accurate pricing/listing requirements
- Independent contractor status
- Intellectual property rights
- Indemnification
- Termination (30-day notice)
- Binding arbitration clause
- Governing law (Montana)

### 2. Patient Terms of Service
**Purpose**: Terms for patients using the platform
**Key Sections**:
- Account creation and responsibilities
- Booking and cancellation terms
- Payment authorization
- No medical advice disclaimer
- Provider relationship (independent, not Findr employees)
- Privacy and data use
- Dispute resolution
- Limitation of liability
- Arbitration agreement
- User conduct requirements

### 3. Privacy Policy
**Purpose**: How data is collected, used, and protected
**Key Sections**:
- Data collection (what we collect)
- Data use (how we use it)
- Data sharing (third parties)
- Data retention
- User rights (access, deletion)
- Security measures
- Cookie policy
- Children's privacy (no users under 18)
- California/state-specific rights
- Contact information

### 4. Provider Cancellation Policy Disclosure
**Purpose**: Clear explanation of cancellation terms for patients
**Key Sections**:
- Policy tier explanation (Standard/Moderate)
- Fee calculation
- No-show policy
- Provider cancellation rights
- Dispute process

### 5. Waiver/Release of Liability
**Purpose**: Protect Findr Health from claims arising from provider services
**Key Sections**:
- Findr Health is a marketplace, not a healthcare provider
- No guarantee of service quality
- Provider credentials are self-reported
- Patient assumes risk of healthcare services
- Findr Health not liable for provider actions/negligence

---

## Company Information

**Company**: Findr Health (operated by [Legal Entity TBD])
**Location**: Montana, USA
**Governing Law**: State of Montana
**Contact**: [To be determined]

---

## Platform URLs

| Platform | URL |
|----------|-----|
| Consumer App | iOS App Store / Google Play |
| Provider Portal | providers.findrhealth.com |
| Admin Dashboard | carrotly-provider-database.vercel.app |
| Marketing Site | [TBD] |
| Support | [TBD] |

---

## Technical Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        FINDR HEALTH                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ Consumer App  │  │   Provider    │  │    Admin      │       │
│  │   (Flutter)   │  │    Portal     │  │  Dashboard    │       │
│  │  iOS/Android  │  │    (React)    │  │   (React)     │       │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘       │
│          │                  │                  │                │
│          └──────────────────┼──────────────────┘                │
│                             │                                   │
│                             ▼                                   │
│                    ┌───────────────┐                           │
│                    │  Backend API  │                           │
│                    │   (Node.js)   │                           │
│                    │   Railway     │                           │
│                    └───────┬───────┘                           │
│                            │                                    │
│              ┌─────────────┼─────────────┐                     │
│              ▼             ▼             ▼                     │
│      ┌───────────┐  ┌───────────┐  ┌───────────┐              │
│      │  MongoDB  │  │  Stripe   │  │  Resend   │              │
│      │   Atlas   │  │ Payments  │  │   Email   │              │
│      └───────────┘  └───────────┘  └───────────┘              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 31, 2025 | Claude/Tim | Initial document |
