# REQUEST BOOKING UX - BUILD, DEPLOY & TEST COMMANDS
## Manual Execution Guide

**Created:** January 16, 2026  
**Purpose:** Step-by-step commands for deploying Request Booking UX

---

## 🚀 QUICK START - Run Python Script

```bash
# Download and run the deployment script
cd ~/Development/findr-health
python3 deploy_request_booking.py --phase all

# Or run individual phases
python3 deploy_request_booking.py --phase flutter
python3 deploy_request_booking.py --phase portal
python3 deploy_request_booking.py --phase admin
python3 deploy_request_booking.py --phase test
```

---

## 📱 PHASE 1: FLUTTER CONSUMER APP

### Step 1.1: Navigate to Flutter project
```bash
cd ~/Development/findr-health/findr-health-mobile
```

### Step 1.2: Create widgets directory
```bash
mkdir -p lib/widgets
```

### Step 1.3: Create BookingModeBadge widget
```bash
cat > lib/widgets/booking_mode_badge.dart << 'DART'
import 'package:flutter/material.dart';

class BookingModeBadge extends StatelessWidget {
  final bool isInstantBook;
  final int? avgResponseMinutes;
  final bool showResponseTime;
  final bool compact;
  
  const BookingModeBadge({
    Key? key,
    required this.isInstantBook,
    this.avgResponseMinutes,
    this.showResponseTime = false,
    this.compact = false,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 8 : 10,
        vertical: compact ? 3 : 5,
      ),
      decoration: BoxDecoration(
        color: isInstantBook 
            ? const Color(0xFFDCFCE7)
            : const Color(0xFFDBEAFE),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isInstantBook ? Icons.bolt : Icons.schedule_send,
            size: compact ? 12 : 14,
            color: isInstantBook
                ? const Color(0xFF15803D)
                : const Color(0xFF1D4ED8),
          ),
          const SizedBox(width: 4),
          Text(
            isInstantBook ? 'Instant Book' : 'Request',
            style: TextStyle(
              color: isInstantBook
                  ? const Color(0xFF15803D)
                  : const Color(0xFF1D4ED8),
              fontSize: compact ? 10 : 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
DART
```

### Step 1.4: Run Flutter analyze
```bash
flutter analyze --no-fatal-infos
```

### Step 1.5: Test Flutter build
```bash
flutter build ios --debug --no-codesign
```

### Step 1.6: Commit and push
```bash
git add -A
git commit -m "feat: add BookingModeBadge widget for request booking UX"
git push origin main
```

### Step 1.7: Run on device
```bash
flutter run
```

---

## 💻 PHASE 2: PROVIDER PORTAL

### Step 2.1: Navigate to Provider Portal
```bash
cd ~/Development/findr-health/carrotly-provider-mvp
```

### Step 2.2: Create PendingRequestsWidget
```bash
cat > src/components/PendingRequestsWidget.tsx << 'TSX'
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface PendingBooking {
  _id: string;
  bookingNumber: string;
  patient: { firstName: string; lastName: string };
  service: { name: string; price: number };
  dateTime: { requestedStart: string };
  confirmation: { expiresAt: string };
}

export default function PendingRequestsWidget() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<PendingBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingBookings();
    const interval = setInterval(loadPendingBookings, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPendingBookings = async () => {
    try {
      const providerId = localStorage.getItem('providerId');
      if (!providerId) return;
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/provider/${providerId}/pending`
      );
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Failed to load pending bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      const providerId = localStorage.getItem('providerId');
      await fetch(`${import.meta.env.VITE_API_URL}/bookings/${id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-provider-id': providerId || '',
        },
      });
      setBookings(prev => prev.filter(b => b._id !== id));
      alert('Booking confirmed!');
    } catch (error) {
      alert('Failed to confirm booking');
    }
  };

  const handleDecline = async (id: string) => {
    if (!window.confirm('Decline this booking request?')) return;
    try {
      const providerId = localStorage.getItem('providerId');
      await fetch(`${import.meta.env.VITE_API_URL}/bookings/${id}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-provider-id': providerId || '',
        },
        body: JSON.stringify({ reason: 'Provider declined' }),
      });
      setBookings(prev => prev.filter(b => b._id !== id));
      alert('Booking declined');
    } catch (error) {
      alert('Failed to decline booking');
    }
  };

  if (loading || bookings.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
          <span className="text-xl">⏳</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-amber-900">
            Pending Booking Requests
          </h2>
          <p className="text-sm text-amber-700">
            {bookings.length} request{bookings.length !== 1 ? 's' : ''} need your response
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {bookings.slice(0, 3).map((booking) => (
          <div key={booking._id} className="bg-white rounded-lg p-4 border border-amber-100">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">
                  {booking.patient?.firstName} {booking.patient?.lastName}
                </div>
                <p className="text-sm text-gray-600">
                  {booking.service?.name} • ${((booking.service?.price || 0) / 100).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(booking.dateTime?.requestedStart).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleConfirm(booking._id)}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                >
                  Confirm
                </button>
                <button
                  onClick={() => handleDecline(booking._id)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
TSX
```

### Step 2.3: Add widget to Dashboard.tsx
```bash
# First, check current Dashboard imports
head -30 src/pages/Dashboard.tsx

# Then add import and component (manual edit required)
# Add to imports: import PendingRequestsWidget from '../components/PendingRequestsWidget';
# Add after return statement opening: <PendingRequestsWidget />
```

### Step 2.4: Build and test locally
```bash
npm run build
npm run dev
```

### Step 2.5: Commit and deploy
```bash
git add -A
git commit -m "feat: add PendingRequestsWidget for request booking management"
git push origin main
```

### Step 2.6: Verify deployment
```bash
# Wait 1-2 minutes for Vercel deployment
open https://findrhealth-provider.vercel.app
```

---

## 🖥️ PHASE 3: ADMIN DASHBOARD

### Step 3.1: Navigate to Admin Dashboard
```bash
cd ~/Development/findr-health/carrotly-provider-database/admin-dashboard
```

### Step 3.2: Create BookingHealthDashboard component
```bash
cat > src/components/BookingHealthDashboard.jsx << 'JSX'
import React, { useState, useEffect } from 'react';

export default function BookingHealthDashboard() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadHealth = async () => {
    try {
      // Calculate from actual bookings
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/bookings?status=pending_confirmation`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const data = await response.json();
      const pendingBookings = data.bookings || [];
      
      const now = new Date();
      const expiringSoon = pendingBookings.filter(b => {
        if (!b.confirmation?.expiresAt) return false;
        const expires = new Date(b.confirmation.expiresAt);
        return (expires - now) < 4 * 60 * 60 * 1000;
      });
      
      setHealth({
        pendingCount: pendingBookings.length,
        expiringSoonCount: expiringSoon.length,
      });
    } catch (error) {
      console.error('Failed to load health:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse h-20 bg-gray-100 rounded" />;

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="text-2xl font-bold text-amber-900">{health?.pendingCount || 0}</div>
        <div className="text-sm text-amber-700">Pending Requests</div>
        {(health?.expiringSoonCount || 0) > 0 && (
          <div className="text-xs text-red-600 mt-1">
            ⚠️ {health?.expiringSoonCount} expiring soon
          </div>
        )}
      </div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="text-2xl font-bold text-green-900">Active</div>
        <div className="text-sm text-green-700">Booking System</div>
      </div>
    </div>
  );
}
JSX
```

### Step 3.3: Build and test
```bash
npm run build
npm run dev
```

### Step 3.4: Commit and deploy
```bash
cd ~/Development/findr-health/carrotly-provider-database
git add -A
git commit -m "feat: add BookingHealthDashboard for admin monitoring"
git push origin main
```

### Step 3.5: Verify deployment
```bash
open https://admin-findrhealth-dashboard.vercel.app
```

---

## 🧪 PHASE 4: TESTING

### Test 1: API Health Check
```bash
curl -s "https://fearless-achievement-production.up.railway.app/api/health"
```

### Test 2: Create Request Booking (provider without calendar)
```bash
curl -X POST "https://fearless-achievement-production.up.railway.app/api/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "6961103fef927c3f05b10d47",
    "patientId": "YOUR_PATIENT_ID",
    "serviceName": "Test Consultation",
    "servicePrice": 15000,
    "serviceDuration": 30,
    "startTime": "2026-01-25T14:00:00Z"
  }'

# Expected: isRequest: true, status: pending_confirmation
```

### Test 3: Get Pending Bookings
```bash
curl -s "https://fearless-achievement-production.up.railway.app/api/bookings/provider/6961103fef927c3f05b10d47/pending"
```

### Test 4: Confirm Booking
```bash
curl -X POST "https://fearless-achievement-production.up.railway.app/api/bookings/BOOKING_ID/confirm" \
  -H "Content-Type: application/json" \
  -H "x-provider-id: 6961103fef927c3f05b10d47"

# Expected: status: confirmed
```

### Test 5: Propose Reschedule
```bash
curl -X POST "https://fearless-achievement-production.up.railway.app/api/bookings/BOOKING_ID/reschedule" \
  -H "Content-Type: application/json" \
  -H "x-provider-id: PROVIDER_ID" \
  -d '{
    "proposedStart": "2026-01-26T10:00:00Z",
    "message": "Can we do this time instead?"
  }'

# Expected: status: reschedule_proposed
```

### Test 6: Accept Reschedule
```bash
curl -X POST "https://fearless-achievement-production.up.railway.app/api/bookings/BOOKING_ID/accept-reschedule" \
  -H "Content-Type: application/json" \
  -H "x-patient-id: PATIENT_ID"

# Expected: status: confirmed
```

### Test 7: Decline Booking
```bash
curl -X POST "https://fearless-achievement-production.up.railway.app/api/bookings/BOOKING_ID/decline" \
  -H "Content-Type: application/json" \
  -H "x-provider-id: PROVIDER_ID" \
  -d '{"reason": "Not available"}'

# Expected: status: cancelled_provider
```

### Test 8: Patient Cancel
```bash
curl -X POST "https://fearless-achievement-production.up.railway.app/api/bookings/BOOKING_ID/cancel" \
  -H "Content-Type: application/json" \
  -H "x-patient-id: PATIENT_ID" \
  -d '{"reason": "Changed plans"}'

# Expected: status: cancelled_patient
```

### Test 9: Check Expiration Job Running
```bash
# Check Railway logs for "[CRON]" messages
# Or manually trigger:
curl -X POST "https://fearless-achievement-production.up.railway.app/api/admin/run-expiration-job" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Test 10: Full End-to-End Test Script
```bash
#!/bin/bash
API_URL="https://fearless-achievement-production.up.railway.app/api"

echo "🧪 Running Request Booking E2E Tests..."

# Test 1: Health
echo -e "\n1. Health Check..."
curl -s "$API_URL/health" | jq .

# Test 2: List providers
echo -e "\n2. List Providers..."
curl -s "$API_URL/providers?limit=3" | jq '.providers[].practiceName'

# Test 3: Get provider calendar status
echo -e "\n3. Calendar Status..."
curl -s "$API_URL/calendar/status/6961103fef927c3f05b10d47" | jq .

echo -e "\n✅ Basic tests complete!"
```

---

## 📋 VERIFICATION CHECKLIST

After deployment, verify each item:

### Flutter App
- [ ] BookingModeBadge widget renders correctly
- [ ] Badge shows on provider cards
- [ ] Badge shows on provider detail screen
- [ ] Request booking confirmation screen shows "Request Sent"
- [ ] Booking detail shows status timeline

### Provider Portal
- [ ] PendingRequestsWidget appears on dashboard
- [ ] Widget shows pending booking count
- [ ] Confirm button works
- [ ] Decline button works
- [ ] Widget updates after actions

### Admin Dashboard
- [ ] BookingHealthDashboard shows pending count
- [ ] Dashboard shows expiring soon warning
- [ ] Can view individual booking details
- [ ] Admin override actions work

### Backend API
- [ ] POST /bookings creates request booking
- [ ] POST /:id/confirm works
- [ ] POST /:id/decline works
- [ ] POST /:id/reschedule works
- [ ] POST /:id/accept-reschedule works
- [ ] POST /:id/decline-reschedule works
- [ ] Expiration job runs every 5 minutes

### Stripe Integration
- [ ] Payment hold created on booking
- [ ] Hold released on decline/expire
- [ ] Hold captured on completion
- [ ] Fee calculation correct (10% + $1.50, max $35)

---

## 🔄 ROLLBACK COMMANDS

If something goes wrong:

### Revert Flutter
```bash
cd ~/Development/findr-health/findr-health-mobile
git revert HEAD
git push origin main
```

### Revert Provider Portal
```bash
cd ~/Development/findr-health/carrotly-provider-mvp
git revert HEAD
git push origin main
```

### Revert Admin Dashboard
```bash
cd ~/Development/findr-health/carrotly-provider-database
git revert HEAD
git push origin main
```

---

*Commands Document Version: 1.0 - January 16, 2026*
