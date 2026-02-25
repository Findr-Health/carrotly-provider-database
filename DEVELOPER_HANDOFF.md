# Findr Health - Developer Handoff Document

**Last Updated:** December 22, 2025  
**Status:** Ready for Consumer App Development

---

## Table of Contents
1. [Platform Overview](#platform-overview)
2. [Architecture](#architecture)
3. [Repositories & Deployments](#repositories--deployments)
4. [Backend API](#backend-api)
5. [Database Schemas](#database-schemas)
6. [Authentication](#authentication)
7. [Email System](#email-system)
8. [Features Built](#features-built)
9. [Pending Items for Dev Team](#pending-items-for-dev-team)
10. [Environment Variables](#environment-variables)
11. [Testing Credentials](#testing-credentials)

---

## Platform Overview

Findr Health is a healthcare provider marketplace connecting patients with healthcare providers in Montana. The platform consists of:

| Component | Purpose | Status |
|-----------|---------|--------|
| **Consumer App** | Patient-facing search & booking | 🔴 Pending (Dev Team) |
| **Provider Portal** | Provider dashboard & onboarding | ✅ Complete |
| **Admin Dashboard** | Admin management interface | ✅ Complete |
| **Backend API** | REST API for all clients | ✅ Complete |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Consumer App   │  Provider Portal │    Admin Dashboard          │
│  (Pending)      │  (Vercel)        │    (Vercel)                 │
│                 │                  │                              │
│  findrhealth.com│  findrhealth-   │  admin-findrhealth-         │
│                 │  provider.vercel │  dashboard.vercel.app       │
│                 │  .app            │                              │
└────────┬────────┴────────┬─────────┴──────────┬──────────────────┘
         │                 │                     │
         └─────────────────┼─────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API                                 │
│              Railway (Node.js/Express)                          │
│     https://fearless-achievement-production.up.railway.app      │
└─────────────────────────────┬───────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐    ┌──────────┐
        │ MongoDB  │   │ SendGrid │    │ Google   │
        │ Atlas    │   │ Email    │    │ Places   │
        └──────────┘   └──────────┘    └──────────┘
```

---

## Repositories & Deployments

### GitHub Repositories

| Repository | Purpose | Branch |
|------------|---------|--------|
| `Findr-Health/carrotly-provider-database` | Backend API + Admin Dashboard | main |
| `Findr-Health/carrotly-provider-mvp` | Provider Portal | main |

### Live Deployments

| Service | URL | Platform |
|---------|-----|----------|
| Backend API | https://fearless-achievement-production.up.railway.app/api | Railway |
| Provider Portal | https://findrhealth-provider.vercel.app | Vercel |
| Admin Dashboard | https://admin-findrhealth-dashboard.vercel.app | Vercel |
| Consumer Site | https://findrhealth.com | Pending |

---

## Backend API

### Base URL
```
https://fearless-achievement-production.up.railway.app/api
```

### Provider Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/providers` | No | List all providers |
| GET | `/providers/:id` | No | Get single provider |
| POST | `/providers` | No | Register new provider (onboarding) |
| PUT | `/providers/:id` | JWT | Update provider |
| DELETE | `/providers/:id` | JWT | Delete provider |
| POST | `/providers/login` | No | Provider login |
| POST | `/providers/set-password` | No | Set/change password |
| POST | `/providers/check-auth` | No | Check if provider has password |

### User Endpoints (Consumer App)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users` | Admin | List all users |
| GET | `/users/:id` | JWT | Get single user |
| POST | `/users/register` | No | Register new user |
| POST | `/users/login` | No | User login |
| PUT | `/users/:id` | JWT | Update user |
| DELETE | `/users/:id` | JWT | Soft delete user |
| POST | `/users/forgot-password` | No | Request password reset |
| POST | `/users/reset-password` | No | Reset password with token |
| POST | `/users/change-password` | JWT | Change password |
| PATCH | `/users/:id/status` | Admin | Change user status |

### Admin Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/admin/login` | No | Admin login |
| GET | `/admin/stats` | JWT | Dashboard statistics |
| GET | `/admin/providers` | JWT | List providers (admin view) |
| GET | `/admin/providers/:id` | JWT | Get provider detail |
| PATCH | `/admin/providers/:id/status` | JWT | Update provider status (sends email) |
| DELETE | `/admin/providers/:id` | JWT | Delete provider |

### Search Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/search` | No | Search providers by location/type |
| GET | `/search/nearby` | No | Find nearby providers |

---

## Database Schemas

### Provider Schema

```javascript
{
  placeId: String,              // Google Places ID
  practiceName: String,         // Required
  providerTypes: [String],      // ['Medical', 'Dental', 'Mental Health', etc.]
  password: String,             // Hashed with bcrypt
  
  contactInfo: {
    phone: String,
    email: String,              // Login credential
    website: String
  },
  
  address: {
    street: String,
    suite: String,
    city: String,
    state: String,
    zip: String,
    coordinates: { lat: Number, lng: Number }
  },
  
  photos: [{
    url: String,
    isPrimary: Boolean
  }],
  
  services: [{
    serviceId: String,
    name: String,
    category: String,
    duration: Number,
    price: Number,
    description: String
  }],
  
  teamMembers: [{
    name: String,
    title: String,
    photo: String,
    bio: String
  }],
  
  credentials: {
    licenseNumber: String,
    licenseState: String,
    licenseExpiration: Date,
    certifications: [String],
    yearsExperience: Number,
    education: String
  },
  
  agreement: {
    signed: Boolean,
    signedAt: Date,
    signature: String,
    version: String
  },
  
  status: String,               // 'pending', 'approved', 'rejected'
  visibility: String,           // 'public', 'hidden'
  
  createdAt: Date,
  updatedAt: Date
}
```

### User Schema (Consumer)

```javascript
{
  firstName: String,            // Required
  lastName: String,             // Required
  email: String,                // Required, unique, login credential
  password: String,             // Required, hashed with bcrypt
  phone: String,                // Required
  dateOfBirth: Date,            // Required
  gender: String,               // 'male', 'female', 'other', 'prefer-not-to-say'
  
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    coordinates: { lat: Number, lng: Number }
  },
  
  insurance: {
    hasInsurance: Boolean,
    provider: String,
    memberId: String,
    groupNumber: String,
    insurancePhone: String,
    primaryInsured: String,
    relationship: String        // 'self', 'spouse', 'child', 'other'
  },
  
  paymentMethods: [{
    type: String,               // 'credit', 'debit', 'hsa', 'fsa', 'bank'
    lastFour: String,
    expiryMonth: Number,
    expiryYear: Number,
    isDefault: Boolean,
    nickname: String,
    stripePaymentMethodId: String
  }],
  
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  
  preferences: {
    language: String,
    notifications: {
      email: Boolean,
      sms: Boolean,
      marketing: Boolean
    },
    searchRadius: Number        // miles
  },
  
  savedProviders: [ObjectId],   // References to Provider
  profilePhoto: String,
  
  agreement: {
    signed: Boolean,            // Required
    signedAt: Date,             // Required
    version: String,            // Required
    ipAddress: String,
    userAgent: String,
    agreementUrl: String,
    contentHash: String
  },
  
  agreementHistory: [{
    version: String,
    signedAt: Date,
    ipAddress: String,
    agreementUrl: String
  }],
  
  status: String,               // 'active', 'suspended', 'deleted', 'pending'
  emailVerified: Boolean,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Security
  failedLoginAttempts: Number,
  lockUntil: Date,
  lastPasswordChange: Date,
  
  // Metadata
  lastLogin: Date,
  lastLoginIp: String,
  loginCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Authentication

### JWT Token Structure

```javascript
// Provider Token
{
  providerId: "...",
  email: "provider@example.com",
  iat: timestamp,
  exp: timestamp  // 7 days
}

// User Token
{
  userId: "...",
  email: "user@example.com",
  iat: timestamp,
  exp: timestamp  // 7 days
}

// Admin Token
{
  id: "...",
  email: "admin@findrhealth.com",
  role: "super_admin",
  iat: timestamp,
  exp: timestamp  // 24 hours
}
```

### Password Security
- Hashed with bcrypt (10 salt rounds)
- Minimum 8 characters required
- Failed login lockout: 5 attempts → 2 hour lock

---

## Email System

### Provider: SendGrid
- **Domain:** findrhealth.com (authenticated)
- **From:** noreply@findrhealth.com

### Email Templates Implemented

| Email | Trigger | Recipient |
|-------|---------|-----------|
| User Welcome | User registration | User |
| User Password Reset | Forgot password request | User |
| Provider Welcome | Provider registration | Provider |
| Provider Approved | Admin approves provider | Provider |
| Provider Rejected | Admin rejects provider | Provider |

### Email Service Location
```
backend/services/emailService.js
```

---

## Features Built

### Provider Portal (Complete)

- [x] Provider onboarding flow (multi-step form)
- [x] Password creation during onboarding
- [x] Provider login (email + password)
- [x] Provider dashboard with stats
- [x] Edit profile (all sections)
- [x] Team member management (add/edit/delete)
- [x] Services management (add/edit/delete with categories)
- [x] Photo upload (base64)
- [x] Profile preview
- [x] Analytics page (mock data, ready for real)
- [x] Reviews page
- [x] Settings page with password change
- [x] Cancellation policy management

### Admin Dashboard (Complete)

- [x] Admin login
- [x] Dashboard with provider stats
- [x] Dashboard with user stats
- [x] Provider list with filters
- [x] Provider detail view
- [x] Provider status management (approve/reject/pending)
- [x] Confirmation dialog for status changes
- [x] Provider edit
- [x] Services CRUD
- [x] User list with filters
- [x] User detail view (tabs: Overview, Insurance, Payment, Security, Activity)
- [x] User status management (activate/suspend)
- [x] Admin password reset for users
- [x] Export functionality

### Backend API (Complete)

- [x] All CRUD operations for providers
- [x] All CRUD operations for users
- [x] Authentication (JWT)
- [x] Password hashing (bcrypt)
- [x] Password reset flow (token-based)
- [x] Email notifications (SendGrid)
- [x] Search endpoints
- [x] Admin endpoints

---

## Pending Items for Dev Team

### Consumer App (New Build Required)

The consumer-facing app at findrhealth.com needs to be built. It should include:

#### Pages Needed

| Page | Priority | Description |
|------|----------|-------------|
| Home/Landing | High | Search bar, featured providers |
| Search Results | High | Provider list with filters |
| Provider Detail | High | Full provider profile view |
| User Registration | High | Use `/api/users/register` |
| User Login | High | Use `/api/users/login` |
| User Dashboard | Medium | Profile, saved providers, appointments |
| Password Reset | High | Use `/api/users/reset-password` |
| Booking Flow | Medium | Appointment scheduling |

#### Password Reset Page

**Critical:** The password reset email currently links to:
```
https://findrhealth.com/reset-password?token=...
```

This page needs to:
1. Read the `token` from URL query params
2. Show a form for new password + confirm password
3. POST to `/api/users/reset-password` with `{ token, newPassword }`
4. Show success/error message
5. Redirect to login on success

#### API Integration Notes

All API endpoints are ready. Example user registration:

```javascript
const response = await fetch('https://fearless-achievement-production.up.railway.app/api/users/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'SecurePass123',
    phone: '(406) 555-1234',
    dateOfBirth: '1990-01-15',
    gender: 'male',
    address: {
      street: '123 Main St',
      city: 'Bozeman',
      state: 'MT',
      zip: '59715'
    },
    agreement: {
      signed: true,
      version: '2025-v1',
      documents: ['terms-v1', 'privacy-v1']
    }
  })
});

const data = await response.json();
// Returns: { success, token, userId, user }
```

---

## Environment Variables

### Backend (Railway)

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `SENDGRID_API_KEY` | SendGrid API key (starts with SG.) |
| `FROM_EMAIL` | noreply@findrhealth.com |
| `APP_URL` | https://findrhealth.com |
| `GOOGLE_PLACES_API_KEY` | Google Places API key |

### Frontend (Vercel)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | https://fearless-achievement-production.up.railway.app/api |

---

## Testing Credentials

### Admin Dashboard
- **URL:** https://admin-findrhealth-dashboard.vercel.app
- **Email:** admin@findrhealth.com
- **Password:** admin123

### Provider Portal (Demo)
- **URL:** https://findrhealth-provider.vercel.app
- **Demo Button:** Click "Demo" for test provider

### Test Users in Database

| Name | Email | Password | Type |
|------|-------|----------|------|
| Tim Wetherill | wetherillt@gmail.com | (reset as needed) | User |
| John Smith | john.smith@test.com | TestPass456 | User |
| Sarah Johnson | sarah.johnson@test.com | Test1234 | User |
| Summit Health Partners MT | info@summithealthmt.com | (demo provider) | Provider |

---

## Local Development

### Backend
```bash
cd carrotly-provider-database/backend
npm install
# Create .env with variables above
npm start
# Runs on http://localhost:8080
```

### Provider Portal
```bash
cd carrotly-provider-mvp
npm install
npm run dev
# Runs on http://localhost:5173
```

### Admin Dashboard
```bash
cd carrotly-provider-database/admin-dashboard
npm install
npm run dev
# Runs on http://localhost:5174
```

---

## Contact

For questions about this codebase, contact the project owner or review the conversation transcripts in this project.

---

*Document generated: December 22, 2025*
