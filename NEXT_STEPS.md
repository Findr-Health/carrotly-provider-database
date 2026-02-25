# 🚀 IMMEDIATE NEXT STEPS

## **Day 1 Morning (2-3 hours)**

### **1. Backend Setup**

```bash
cd ~/Development/findr-health/carrotly-provider-database/backend

# Create new branch
git checkout -b feature/80-20-payment-policy

# Create directories
mkdir -p services utils cron templates

# Copy files
# (Download from Claude outputs and place in appropriate directories)

# Install dependencies (if not already installed)
npm install stripe node-cron date-fns-tz

# Update Booking model
# Open models/Booking.js and add payment + cancellation schemas from booking_model_updates.js
```

### **2. Integrate PaymentService**

```bash
# Add PaymentService.js to services/
# Add platformFee.js to utils/
# Add retryFailedPayments.js to cron/
# Add emailTemplates.js to templates/

# Update server.js to initialize cron jobs:
```

```javascript
// In server.js, add after mongoose connection:
const { startRetryFailedPaymentsCron, startAutoCompleteBookingsCron } = require('./cron/retryFailedPayments');

mongoose.connection.once('open', () => {
  console.log('✅ MongoDB Connected');
  
  // Start cron jobs
  startRetryFailedPaymentsCron();
  startAutoCompleteBookingsCron();
});
```

### **3. Update Booking Routes**

```bash
# Open routes/bookings.js
# Replace/update endpoints with code from bookings_routes_updated.js

# Key endpoints to update:
# - POST /api/bookings (add deposit charge)
# - POST /api/bookings/:id/cancel-patient (add 48hr logic)
# - POST /api/bookings/:id/cancel-provider (always refund)
# - POST /api/bookings/:id/complete (new endpoint)
```

### **4. Test Locally**

```bash
# Use Stripe test keys
export STRIPE_SECRET_KEY="sk_test_..."

# Start server
npm run dev

# Test with Postman/curl
curl -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "...",
    "serviceId": "...",
    "startTime": "2026-02-10T14:00:00",
    "paymentMethodId": "pm_card_visa"
  }'
```

---

## **Day 1 Afternoon (2-3 hours)**

### **5. Mobile App Updates**

```bash
cd ~/Development/findr-health/findr-health-mobile

# Create new branch
git checkout -b feature/80-20-payment-policy

# Update booking model
# Open lib/data/models/booking_model.dart
# Add payment fields from implementation plan

# Create new widgets
mkdir -p lib/presentation/widgets/payment

# Create:
# - lib/presentation/widgets/payment/payment_breakdown_card.dart
# - lib/presentation/widgets/payment/cancellation_policy_card.dart
# - lib/presentation/screens/my_bookings/cancel_booking_modal.dart
```

### **6. Provider Portal Updates**

```bash
cd ~/Development/findr-health/carrotly-provider-mvp

# Create new branch
git checkout -b feature/80-20-payment-policy

# Update onboarding
# - src/pages/onboarding/PaymentSetup.tsx
# - src/components/onboarding/PolicyAgreement.tsx (new)

# Update dashboard
# - src/components/dashboard/PaymentPolicyCard.tsx (new)
# - src/components/appointments/BookingDetailModal.tsx
```

---

## **Day 2 (Testing)**

### **7. Integration Testing**

Test all scenarios from IMPLEMENTATION_PLAN.md:
- ✅ Scenario 1: Happy path (book → complete → payout)
- ✅ Scenario 2: Early cancel (>48hrs → full refund)
- ✅ Scenario 3: Late cancel (<48hrs → no refund)
- ✅ Scenario 4: Provider cancel (refund + credit)
- ✅ Scenario 5: Failed final payment (retry logic)
- ✅ Scenario 6: Service adjustment (15% limit)

### **8. Deploy to Staging**

```bash
# Backend
git push origin feature/80-20-payment-policy
# Create PR, review, merge to main
# Railway auto-deploys

# Mobile
flutter build ios --release
# Upload to TestFlight (internal testing)

# Provider Portal
git push origin feature/80-20-payment-policy
# Vercel auto-deploys preview
```

---

## **Week 2 (Full Rollout)**

Follow the detailed day-by-day plan in IMPLEMENTATION_PLAN.md

