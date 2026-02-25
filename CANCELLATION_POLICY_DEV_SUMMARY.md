# Carrotly Cancellation Policy - Developer Summary

**Quick Read:** 5 minutes  
**Complexity:** Medium  
**Tech Stack:** Stripe Payment Intents (manual capture), Cron jobs, MongoDB

---

## 🎯 What We're Building

A **delayed payment system** with progressive cancellation fees that protects provider revenue while being fair to patients.

---

## 📊 Policy at a Glance

| Timing | Fee | Action |
|--------|-----|--------|
| At Booking | $0 | Save card only (no charge) |
| 7 Days Before | $0 | Authorize card (hold funds) |
| Cancel 72+ hrs | $0 | Release hold, no charge |
| Cancel 24-72 hrs | 50% | Charge cancellation fee |
| Cancel <24 hrs | 75% | Charge cancellation fee |
| No-Show | 100% | Charge full amount |
| After Service | 100% + adjustments | Auto-capture 24hrs later |

---

## 🏗️ Technical Architecture

### Problem: Stripe authorizations expire in 7 days
**Solution:** Authorize just-in-time (7 days before appointment)

```
Booking (3 weeks out)
    ↓ Save payment method (SetupIntent)
    
7 Days Before
    ↓ Authorize card (PaymentIntent capture_method: manual)
    
Appointment Day
    ↓ Service rendered
    
24 Hours After
    ↓ Auto-capture payment (with optional adjustments)
```

---

## 🔧 What Needs to Be Built

### 1. **Stripe Integration**

```javascript
// At Booking - Save card
stripe.setupIntents.create({
  customer: customerId,
  payment_method_types: ['card'],
  usage: 'off_session'
})

// 7 Days Before - Authorize
stripe.paymentIntents.create({
  amount: 15000,
  capture_method: 'manual',  // KEY: Don't charge yet
  off_session: true,
  confirm: true
})

// 24hrs After - Capture
stripe.paymentIntents.capture(paymentIntentId)
```

**Key Points:**
- Use `capture_method: 'manual'` for all payment intents
- Store `paymentIntentId` on appointment document
- Adjustments allowed up to +15% before capture

---

### 2. **Database Schema Updates**

Add to Appointment model:

```javascript
{
  // Payment tracking
  paymentMethodId: String,
  paymentIntentId: String,
  paymentStatus: String, // 'card_saved' → 'authorized' → 'captured'
  
  // Amounts (cents)
  amount: Number,
  adjustedAmount: Number,
  finalAmount: Number,
  cancellationFee: Number,
  
  // Cancellation policy
  cancellationPolicy: {
    freeCancellationUntil: Date,
    lateCancellationFee: Number,    // 50%
    veryLateCancellationFee: Number, // 75%
    noShowFee: Number                // 100%
  },
  
  // Timestamps
  authorizedAt: Date,
  capturedAt: Date
}
```

---

### 3. **Three Cron Jobs Required**

#### Job 1: Authorize Cards (Daily at 3 AM)
```javascript
// Find appointments 7 days from now with status 'card_saved'
// Call stripe.paymentIntents.create() for each
// Update status to 'authorized'
// Notify patient of authorization
```

#### Job 2: Capture Payments (Every Hour)
```javascript
// Find appointments where:
//   - scheduledFor < 24 hours ago
//   - paymentStatus = 'authorized'
//   - status != cancelled/no_show
// Call stripe.paymentIntents.capture() for each
// Update status to 'captured'
// Send receipt to patient
```

#### Job 3: Process No-Shows (Every 15 Minutes)
```javascript
// 15 min after appointment:
//   - Mark as 'no_show_pending'
//   - Notify patient (2hr grace period)
// 2 hours later:
//   - Capture full amount
//   - Mark as 'no_show'
```

---

### 4. **API Endpoints to Add**

```javascript
// Booking
POST /api/appointments/book
- Save payment method
- Create appointment with cancellation deadlines
- NO charge yet

// Cancellation
POST /api/appointments/:id/cancel
- Calculate hours until appointment
- Apply appropriate fee (0%, 50%, 75%)
- Update or capture payment intent

// Provider adjustments
POST /api/appointments/:id/adjust
- Add additional services
- Max 15% increase from original amount
- Update payment intent before capture
```

---

### 5. **UI Components Needed**

#### User App (React)
- **BookingConfirmation**: Display cancellation policy clearly
- **PaymentMethodSetup**: Stripe Elements integration
- **CancellationModal**: Show fee before confirming cancellation
- **CreditOptionModal**: Offer credit instead of fee for 75% cancellations

#### Provider Portal (React)
- **ServiceAdjustmentForm**: Add services with quick-add buttons
- **PaymentTimeline**: Show payment status progression
- **AppointmentList**: Payment status badges

---

## 🎨 Key User Flows

### **Patient Books Appointment**
1. Select service, time
2. Enter credit card (Stripe Elements)
3. Card saved via SetupIntent → **No charge**
4. See cancellation policy: "Free cancellation until [72hrs before]"

### **Patient Cancels**
1. Click "Cancel Appointment"
2. Modal shows: "Cancelling now = $X fee (Y%)"
3. If 75% fee → offer credit option
4. Confirm → charge appropriate amount

### **Provider Adds Services**
1. View appointment details
2. Click "Adjust Charges"
3. Quick-add common services (Strep Test +$25, etc.)
4. Max increase: 15% of original
5. Patient notified automatically

---

## ⚙️ Configuration

### Environment Variables
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLATFORM_FEE_PERCENT=15
```

### Stripe Webhook Events to Handle
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`

---

## 🚨 Important Edge Cases

### **1. Card Declined at Authorization (7 days before)**
- Notify patient immediately
- Give option to update payment method
- Don't cancel appointment automatically

### **2. Adjustment Exceeds 15% Limit**
- Provider sees error message
- Must contact support for manual processing
- Or split into multiple charges

### **3. First-Time Cancellation Forgiveness**
- Check patient's cancellation history
- If zero prior late cancellations → waive fee
- Show message: "Courtesy waiver this time"

### **4. Emergency Waiver Requests**
- Patient can request fee waiver
- Admin reviews within 48 hours
- Common reasons: medical emergency, weather, accident

---

## 📦 Dependencies to Install

```bash
npm install stripe          # Stripe SDK
npm install node-cron       # Cron job scheduler
```

---

## 🔐 Security Considerations

- Never store full card numbers (use Stripe tokens)
- Encrypt sensitive data: `paymentMethodId`, `customerId`
- Use `off_session: true` for automated charges
- Verify webhook signatures
- PCI compliance via Stripe (they handle card data)

---

## 📈 Success Metrics

Track these after implementation:
- Authorization success rate (should be >95%)
- Capture success rate (should be >99%)
- No-show rate (should decrease)
- Late cancellation rate
- Average time to provider payout

---

## ⏱️ Implementation Timeline

**Phase 1 (Week 1):**
- [ ] Stripe integration (setup, authorize, capture)
- [ ] Database schema updates
- [ ] Cancel appointment endpoint

**Phase 2 (Week 2):**
- [ ] Three cron jobs
- [ ] Provider adjustment endpoint
- [ ] Webhook handlers

**Phase 3 (Week 3):**
- [ ] User app UI components
- [ ] Provider portal UI components
- [ ] Testing & bug fixes

**Phase 4 (Week 4):**
- [ ] Edge case handling
- [ ] First-time forgiveness logic
- [ ] Credit/waiver system
- [ ] Production deployment

---

## 🧪 Testing Checklist

### Critical Paths
- [ ] Book appointment → card saved (no charge)
- [ ] 7 days before → card authorized
- [ ] Cancel 72+ hrs → no fee charged
- [ ] Cancel 24-72 hrs → 50% fee charged
- [ ] Cancel <24 hrs → 75% fee charged
- [ ] No-show → 100% fee charged
- [ ] Service complete → auto-capture after 24hrs
- [ ] Provider adjustment → payment updated

### Stripe Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
```

---

## 💡 Quick Start for Developers

1. **Read full implementation doc**: `CANCELLATION_POLICY_IMPLEMENTATION.md` (includes all code)
2. **Set up Stripe test account**: Get API keys
3. **Install dependencies**: `npm install stripe node-cron`
4. **Create database migrations**: Add new fields to Appointment model
5. **Build Stripe service**: Start with `savePaymentMethod()` function
6. **Build cron jobs**: Start with authorization job
7. **Test locally**: Use Stripe test mode

---

## 📚 Resources

- **Full Implementation Guide**: `CANCELLATION_POLICY_IMPLEMENTATION.md` (80 pages, all code included)
- **Stripe Docs**: https://stripe.com/docs/payments/payment-intents
- **Manual Capture Guide**: https://stripe.com/docs/payments/place-a-hold-on-a-payment-method

---

## ❓ Questions?

**Q: Why not charge upfront?**  
A: Healthcare industry standard. Reduces booking friction, builds trust.

**Q: Why 7-day authorization window?**  
A: Stripe authorization max is 7 days. We schedule authorization to happen just-in-time.

**Q: What if patient books 2 days before appointment?**  
A: Authorize immediately (same flow, just timing is different).

**Q: Can providers adjust prices after authorization?**  
A: Yes, up to +15% before capture. Larger adjustments need manual processing.

**Q: What happens if capture fails?**  
A: Alert admin, flag appointment for manual review.

---

## 🎯 TL;DR for PM

**In Plain English:**
Patient books appointment 3 weeks out. We save their card but don't charge anything. One week before appointment, we put a temporary hold on their card (like a hotel does). If they cancel with 3+ days notice, we release the hold and charge nothing. If they cancel late, we charge 50-75% depending on timing. If they show up, we automatically charge them 24 hours after the appointment (gives time for disputes). Provider can add extra services up to 15% more.

**Why This Matters:**
- Reduces no-shows by 80% (industry data)
- Fair to patients (free cancellation window)
- Protects provider revenue
- Fully automated (no manual processing)
- Industry-standard approach

---

**Need clarification on anything? Check the full implementation guide or ping the team!** 🚀
