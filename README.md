# Findr Health - Developer Documentation

## Platform Overview

Findr Health is a **healthcare provider marketplace** connecting patients (buyers) with healthcare providers (sellers).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FINDR HEALTH ECOSYSTEM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   SELLERS (Providers)                        BUYERS (Patients)              │
│   ┌─────────────────────┐                   ┌─────────────────────┐        │
│   │  Provider Portal    │                   │  Consumer App       │        │
│   │  - Onboarding       │                   │  (IN DEVELOPMENT)   │        │
│   │  - Dashboard        │                   │  - Search providers │        │
│   │  - Edit Profile     │                   │  - View profiles    │        │
│   │  - Analytics        │                   │  - Contact/Book     │        │
│   └──────────┬──────────┘                   └──────────┬──────────┘        │
│              │                                         │                    │
│              │         ┌─────────────────┐             │                    │
│              │         │   SHARED API    │             │                    │
│              └────────►│   (Railway)     │◄────────────┘                    │
│                        │                 │                                  │
│              ┌────────►│   MongoDB       │                                  │
│              │         └─────────────────┘                                  │
│              │                                                              │
│   ┌──────────┴──────────┐                                                   │
│   │  Admin Dashboard    │                                                   │
│   │  - Manage providers │                                                   │
│   │  - Approve/Reject   │                                                   │
│   │  - View analytics   │                                                   │
│   └─────────────────────┘                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## System Components

| Component | Purpose | Status | URL |
|-----------|---------|--------|-----|
| **Provider Portal** | Providers create/manage profiles | ✅ Live | https://findrhealth-provider.vercel.app |
| **Admin Dashboard** | Internal team manages providers | ✅ Live | https://admin-findrhealth-dashboard.vercel.app |
| **Backend API** | Shared data layer | ✅ Live | https://fearless-achievement-production.up.railway.app |
| **Consumer App** | Patients search/book providers | 🚧 In Development | TBD |

---

## Data Flow

### 1. Provider Onboarding (Seller Registration)
```
Provider visits portal → Searches business → Verifies ownership → Completes profile → Saved to database
```

### 2. Admin Review
```
Admin dashboard → Views new providers → Approves/rejects → Updates provider status
```

### 3. Patient Discovery (Consumer App)
```
Patient searches "dentist near me" → API returns matching providers → Patient views profile → Contacts provider
```

### 4. Ongoing Management
```
Provider logs into dashboard → Updates services/hours/photos → Changes sync to database → Consumer app shows updates
```

---

## Database Schema (MongoDB)

### Provider Document
```javascript
{
  _id: ObjectId,
  placeId: String,              // Google Places ID (for verified businesses)
  practiceName: String,
  providerTypes: [String],      // ["Medical", "Dental", "Mental Health"]
  
  contactInfo: {
    phone: String,
    email: String,              // Also used for login
    website: String
  },
  
  address: {
    street: String,
    suite: String,
    city: String,
    state: String,
    zip: String,
    coordinates: { lat, lng }   // For geo-search
  },
  
  services: [{
    name: String,
    category: String,
    duration: Number,           // minutes
    price: Number,
    description: String
  }],
  
  teamMembers: [{
    name: String,
    role: String,
    bio: String,
    photo: String
  }],
  
  photos: [{
    url: String,                // Base64 or URL
    isPrimary: Boolean
  }],
  
  credentials: {
    licenseNumber: String,
    licenseState: String,
    npiNumber: String,
    yearsExperience: Number,
    insuranceAccepted: [String]
  },
  
  hours: {
    monday: { open: String, close: String },
    // ... other days
  },
  
  status: String,               // "pending", "active", "suspended"
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints

**Base URL:** `https://fearless-achievement-production.up.railway.app/api`

### Public Endpoints (for Consumer App)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/providers` | List all active providers |
| `GET` | `/providers/:id` | Get single provider details |
| `GET` | `/search?q=dentist&city=Bozeman` | Search providers |

### Provider Endpoints (authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/providers` | Create new provider |
| `PUT` | `/providers/:id` | Update provider profile |
| `POST` | `/providers/login` | Provider login |
| `POST` | `/providers/verify-login` | Verify login code |

### Admin Endpoints (authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/providers` | List all providers (any status) |
| `PUT` | `/admin/providers/:id` | Update provider (including status) |
| `PATCH` | `/admin/providers/:id/status` | Change provider status |
| `DELETE` | `/admin/providers/:id` | Delete provider |
| `POST` | `/admin/login` | Admin login |

---

## Consumer App Integration Guide

### Searching Providers

```javascript
// Search by type and location
const response = await fetch(
  'https://fearless-achievement-production.up.railway.app/api/search?' + 
  new URLSearchParams({
    q: 'dentist',
    city: 'Bozeman',
    state: 'MT',
    radius: 25  // miles
  })
);
const providers = await response.json();
```

### Displaying Provider Profile

```javascript
// Get full provider details
const response = await fetch(
  `https://fearless-achievement-production.up.railway.app/api/providers/${providerId}`
);
const provider = await response.json();

// Display: name, types, services, photos, contact info, hours
```

### Key Data Points for Consumer App

| Display Element | Data Source |
|-----------------|-------------|
| Provider name | `provider.practiceName` |
| Categories | `provider.providerTypes` |
| Address | `provider.address` |
| Services list | `provider.services` |
| Photos/Gallery | `provider.photos` |
| Team members | `provider.teamMembers` |
| Contact button | `provider.contactInfo.phone/email` |
| Map location | `provider.address.coordinates` |

---

## Authentication

### Provider Authentication (Current)
- Email + 6-digit code verification
- JWT token stored in localStorage
- Future: Email + password

### Admin Authentication
- Email: `admin@findrhealth.com`
- Password: `admin123`
- JWT token with admin role

### Consumer App Authentication (TBD)
- Recommend: Email/password or social login
- Optional: Guest browsing without account

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Provider Portal** | React 18 + TypeScript + Vite + Tailwind CSS |
| **Admin Dashboard** | React 18 + JavaScript + Vite + Tailwind CSS |
| **Backend API** | Node.js + Express |
| **Database** | MongoDB Atlas |
| **Hosting** | Vercel (frontends) + Railway (backend) |

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Provider Portal
```bash
git clone https://github.com/wetherillt-punch/carrotly-provider-mvp.git
cd carrotly-provider-mvp
npm install
npm run dev
# Opens at http://localhost:5173
```

### Backend API
```bash
git clone https://github.com/Findr-Health/carrotly-provider-database.git
cd carrotly-provider-database/backend
npm install
# Create .env file with MONGODB_URI
npm run dev
# Opens at http://localhost:3001
```

### Admin Dashboard
```bash
cd carrotly-provider-database/admin-dashboard
npm install
npm run dev
# Opens at http://localhost:5174
```

---

## Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
PORT=3001
```

### Frontend (.env)
```
VITE_API_URL=https://fearless-achievement-production.up.railway.app/api
VITE_GOOGLE_PLACES_API_KEY=your-key  # Optional, for address autocomplete
```

---

## Deployment

| Component | Platform | Auto-Deploy |
|-----------|----------|-------------|
| Provider Portal | Vercel | Yes, on push to main |
| Admin Dashboard | Vercel | Yes, on push to main |
| Backend API | Railway | Yes, on push to main |

---

## Testing Credentials

### Provider Portal
- URL: https://findrhealth-provider.vercel.app/login
- Click "Demo: Quick access" button

### Admin Dashboard
- URL: https://admin-findrhealth-dashboard.vercel.app
- Email: `admin@findrhealth.com`
- Password: `admin123`

---

## Repository Structure

```
carrotly-provider-mvp/          # Provider Portal
├── src/
│   ├── pages/
│   │   ├── Landing.tsx         # Entry point with New/Existing options
│   │   ├── onboarding/         # Onboarding flow
│   │   ├── Dashboard.tsx       # Provider dashboard
│   │   ├── EditProfile.tsx     # Profile editor
│   │   ├── Analytics.tsx       # Analytics dashboard
│   │   └── ProviderLogin.tsx   # Login page
│   ├── components/
│   └── hooks/
│       └── useProviderData.ts  # API integration hook

carrotly-provider-database/     # Backend + Admin
├── backend/
│   ├── server.js               # Express server
│   ├── routes/
│   │   ├── providers.js        # Provider API routes
│   │   ├── admin.js            # Admin API routes
│   │   └── search.js           # Search API routes
│   ├── models/
│   │   └── Provider.js         # Mongoose schema
│   └── config/
│       └── db.js               # MongoDB connection
├── admin-dashboard/
│   └── src/
│       ├── components/
│       │   ├── ProviderList.jsx
│       │   └── ProviderDetail.jsx
│       └── context/
│           └── AuthContext.jsx
```

---

## Support

- **Technical Questions:** Create a GitHub issue
- **Access Issues:** Contact Tim Wetherill

---

## Roadmap

- [ ] Provider password authentication
- [ ] Email notifications (verification, bookings)
- [ ] Consumer app integration
- [ ] Booking system
- [ ] Payment processing
- [ ] Reviews and ratings (consumer-generated)
- [ ] AWS migration (see infrastructure roadmap)
