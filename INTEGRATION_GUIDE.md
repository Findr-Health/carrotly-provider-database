# Calendar-Optional Booking Flow - Integration Guide

## Quick Start

### 1. Copy Files to Backend

```bash
# From the findr-booking-update directory
cp routes/bookings.js ~/Development/findr-health/carrotly-provider-database/backend/routes/
cp jobs/expirationJob.js ~/Development/findr-health/carrotly-provider-database/backend/jobs/
cp jobs/scheduler.js ~/Development/findr-health/carrotly-provider-database/backend/jobs/
```

### 2. Install Dependencies (if not already installed)

```bash
cd ~/Development/findr-health/carrotly-provider-database/backend
npm install node-cron --save
```

### 3. Update server.js / app.js

Add these lines to your main server file:

```javascript
// Near the top with other requires
const bookingRoutes = require('./routes/bookings');

// With your other route registrations
app.use('/api/bookings', bookingRoutes);

// After mongoose.connect() or where you start your server
if (process.env.NODE_ENV !== 'test') {
  require('./jobs/scheduler').init();
}
```

### 4. Create jobs directory (if it doesn't exist)

```bash
mkdir -p ~/Development/findr-health/carrotly-provider-database/backend/jobs
```

### 5. Deploy

```bash
cd ~/Development/findr-health/carrotly-provider-database
git add -A
git commit -m "feat: add calendar-optional booking API endpoints and jobs"
git push origin main
```

---

## API Endpoints Summary

### Slot Reservation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings/reserve-slot` | Reserve slot for 5 min |
| DELETE | `/api/bookings/reserve-slot/:id` | Release reservation |

### Booking CRUD
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/:id` | Get booking details |
| GET | `/api/bookings/:id/history` | Get audit trail |

### Patient Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings/patient/:patientId` | List patient bookings |
| POST | `/api/bookings/:id/accept-reschedule` | Accept reschedule |
| POST | `/api/bookings/:id/decline-reschedule` | Decline reschedule |
| POST | `/api/bookings/:id/cancel` | Cancel booking |

### Provider Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings/provider/:providerId` | List provider bookings |
| GET | `/api/bookings/provider/:providerId/pending` | Pending confirmations |
| POST | `/api/bookings/:id/confirm` | Confirm booking |
| POST | `/api/bookings/:id/decline` | Decline booking |
| POST | `/api/bookings/:id/reschedule` | Propose new time |

---

## Testing the API

### 1. Create a Request Booking

```bash
curl -X POST https://fearless-achievement-production.up.railway.app/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "YOUR_PROVIDER_ID",
    "patientId": "YOUR_PATIENT_ID",
    "serviceName": "General Consultation",
    "servicePrice": 15000,
    "serviceDuration": 30,
    "startTime": "2026-01-22T14:00:00Z"
  }'
```

### 2. Get Pending Bookings (Provider)

```bash
curl https://fearless-achievement-production.up.railway.app/api/bookings/provider/YOUR_PROVIDER_ID/pending
```

### 3. Confirm a Booking

```bash
curl -X POST https://fearless-achievement-production.up.railway.app/api/bookings/BOOKING_ID/confirm \
  -H "Content-Type: application/json" \
  -H "x-provider-id: YOUR_PROVIDER_ID"
```

### 4. Propose Reschedule

```bash
curl -X POST https://fearless-achievement-production.up.railway.app/api/bookings/BOOKING_ID/reschedule \
  -H "Content-Type: application/json" \
  -H "x-provider-id: YOUR_PROVIDER_ID" \
  -d '{
    "proposedStart": "2026-01-23T15:00:00Z",
    "message": "Can we do this time instead?"
  }'
```

---

## Background Jobs

Jobs run automatically when the server starts:

| Job | Schedule | Purpose |
|-----|----------|---------|
| `processExpiredBookings` | Every 5 min | Expire unconfirmed bookings, release holds |
| `sendExpirationWarnings` | Every 30 min | Warn providers of expiring requests |
| `cleanupSlotReservations` | Every 1 min | Backup cleanup for TTL |
| `updateProviderStats` | Every 6 hours | Recalculate provider metrics |

### Manual Job Execution

```bash
# Run expiration job manually
MONGODB_URI="your-uri" node jobs/expirationJob.js expire

# Run all jobs
MONGODB_URI="your-uri" node jobs/expirationJob.js all
```

---

## Environment Variables

Ensure these are set in Railway:

```
MONGODB_URI=mongodb://...
STRIPE_SECRET_KEY=sk_live_...  # or sk_test_...
```

---

## What's Next

After deploying:

1. **Test the booking flow** with the curl commands above
2. **Update Provider Portal** to show pending requests
3. **Update Consumer App** to handle request booking UX
4. **Add email notifications** (SendGrid integration)
