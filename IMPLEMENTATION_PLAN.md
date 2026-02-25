# 🚀 80/20 BINARY PAYMENT POLICY - IMPLEMENTATION PLAN

## **PROJECT OVERVIEW**

**Goal:** Implement 80% deposit + 48-hour binary cancellation policy across entire Findr Health ecosystem  
**Timeline:** 2 weeks (10 working days)  
**Systems:** Backend, Mobile App (Flutter), Provider Portal (React)  
**Complexity:** Medium  
**Risk:** Low (updating existing flows, not greenfield)

---

## 📊 **SPRINT BREAKDOWN**

### **Week 1: Backend + Mobile App**
- Days 1-2: Backend payment logic + Stripe integration
- Days 3-5: Mobile app checkout flow + cancellation

### **Week 2: Provider Portal + Testing**
- Days 6-8: Provider portal updates + onboarding
- Days 9-10: End-to-end testing + production deployment

---

## 🔧 **PHASE 1: BACKEND (Days 1-2)**

### **Day 1 Morning: Database Schema Updates**

**Files to modify:**
```
backend/models/Booking.js
backend/models/Provider.js
```

**Tasks:**
1. Add payment schema fields to Booking model
2. Add cancellation tracking to Provider model
3. Run migration script to update existing bookings
4. Test schema changes

**Deliverables:**
- ✅ Updated Booking model with payment fields
- ✅ Updated Provider model with cancellation tracking
- ✅ Migration script for existing data

---

### **Day 1 Afternoon: Payment Service**

**Files to create:**
```
backend/services/PaymentService.js
backend/utils/platformFee.js
```

**Tasks:**
1. Create PaymentService class with 5 core methods:
   - `chargeDeposit()` - Charge 80% at booking
   - `processCancellation()` - 48-hour binary refund logic
   - `chargeFinalPayment()` - Charge 20% after service
   - `transferToProvider()` - Payout to provider
   - `adjustServicePrice()` - Handle price adjustments
2. Create platformFee utility (10% + $1.50, cap $35)
3. Unit test all functions

**Deliverables:**
- ✅ PaymentService.js (300 lines)
- ✅ platformFee.js (100 lines)
- ✅ Unit tests passing

---

### **Day 2 Morning: Booking Routes**

**Files to modify:**
```
backend/routes/bookings.js
backend/routes/bookings_enhanced.js (if exists)
```

**Tasks:**
1. Update `POST /api/bookings` - charge 80% deposit
2. Update `POST /api/bookings/:id/cancel-patient` - 48hr logic
3. Update `POST /api/bookings/:id/cancel-provider` - always refund
4. Create `POST /api/bookings/:id/complete` - charge 20%
5. Create `GET /api/bookings/fee-breakdown/:amount` - helper
6. Test all endpoints with Postman

**Deliverables:**
- ✅ 5 updated/new endpoints
- ✅ Postman collection for testing
- ✅ Integration tests passing

---

### **Day 2 Afternoon: Cron Jobs + Webhooks**

**Files to create/modify:**
```
backend/cron/retryFailedPayments.js
backend/routes/webhooks.js
backend/server.js (add cron initialization)
```

**Tasks:**
1. Create retry failed payments cron (runs daily)
2. Create auto-complete bookings cron (runs hourly)
3. Add Stripe webhook handlers for disputes
4. Test cron jobs manually
5. Initialize crons in server.js

**Deliverables:**
- ✅ 2 cron jobs configured
- ✅ Webhook handlers for payment events
- ✅ Cron jobs tested

---

## 📱 **PHASE 2: MOBILE APP (Days 3-5)**

### **Day 3 Morning: Update Booking Model**

**Files to modify:**
```
lib/data/models/booking_model.dart
lib/data/repositories/booking_repository.dart
```

**Tasks:**
1. Add payment fields to BookingModel
2. Update `fromJson()` to parse new payment structure
3. Add helper methods for payment display
4. Update BookingRepository with new endpoints

**Deliverables:**
- ✅ Updated BookingModel with payment fields
- ✅ Helper methods: `getDepositAmount()`, `getFinalAmount()`, `getRefundAmount()`
- ✅ Repository methods for new endpoints

---

### **Day 3 Afternoon: Checkout Flow UI**

**Files to create/modify:**
```
lib/presentation/screens/booking/booking_review_screen.dart
lib/presentation/widgets/payment_breakdown_card.dart
lib/presentation/widgets/cancellation_policy_card.dart
```

**Tasks:**
1. Create PaymentBreakdownCard widget
   - Show 80% deposit charge
   - Show 20% final charge (after service)
   - Show platform fee
2. Create CancellationPolicyCard widget
   - 48-hour threshold explained
   - Refund amounts visualized
3. Update BookingReviewScreen to show both widgets
4. Add checkbox: "I agree to cancellation policy"

**Deliverables:**
- ✅ PaymentBreakdownCard widget
- ✅ CancellationPolicyCard widget
- ✅ Updated checkout screen with policy display
- ✅ Required policy checkbox

---

### **Day 4 Morning: Cancellation Flow**

**Files to create/modify:**
```
lib/presentation/screens/my_bookings/cancel_booking_modal.dart
lib/presentation/screens/my_bookings/booking_detail_screen.dart
```

**Tasks:**
1. Create CancelBookingModal:
   - Calculate hours until appointment
   - Show refund amount (binary: 100% or 0%)
   - Display warning if <48 hours
   - Require cancellation reason
2. Wire cancel button in BookingDetailScreen
3. Handle cancellation response
4. Show success/failure messages

**Deliverables:**
- ✅ CancelBookingModal with 48hr logic
- ✅ Real-time refund calculation
- ✅ Cancel button integrated
- ✅ Success/error handling

---

### **Day 4 Afternoon: Booking Confirmation Screen**

**Files to modify:**
```
lib/presentation/screens/booking/booking_confirmation_screen.dart
lib/presentation/widgets/booking_summary_card.dart
```

**Tasks:**
1. Update confirmation screen to show:
   - Deposit charged: $X
   - Final payment due: $Y (after appointment)
   - Total: $Z
2. Show cancellation policy recap
3. Add "View Receipt" button (links to deposit receipt)
4. Test booking flow end-to-end

**Deliverables:**
- ✅ Updated confirmation screen
- ✅ Payment summary display
- ✅ Policy recap
- ✅ End-to-end booking works

---

### **Day 5: Terms of Service + Polish**

**Files to create/modify:**
```
lib/presentation/screens/legal/terms_of_service_screen.dart
lib/presentation/screens/legal/cancellation_policy_screen.dart
assets/legal/terms_of_service.md
assets/legal/cancellation_policy.md
```

**Tasks:**
1. Create standalone Cancellation Policy screen
2. Update Terms of Service with payment policy
3. Add links from settings
4. Add link from checkout flow
5. Polish UI/UX
6. QA testing on real device

**Deliverables:**
- ✅ Cancellation policy screen
- ✅ Updated ToS
- ✅ Navigation links
- ✅ Mobile app ready for TestFlight

---

## 🖥️ **PHASE 3: PROVIDER PORTAL (Days 6-8)**

### **Day 6 Morning: Update Onboarding**

**Files to modify:**
```
src/pages/onboarding/PaymentSetup.tsx
src/pages/onboarding/ReviewAndSubmit.tsx
src/components/onboarding/PolicyAgreement.tsx
```

**Tasks:**
1. Update PaymentSetup page to explain:
   - 80/20 payment structure
   - Platform fee (10% + $1.50, cap $35)
   - Payout timeline (2-5 days)
2. Create PolicyAgreement component:
   - Provider cancellation policy
   - Penalties for multiple cancellations
3. Add to ReviewAndSubmit page
4. Require checkbox: "I agree to payment terms"

**Deliverables:**
- ✅ Updated onboarding flow
- ✅ Payment policy explained
- ✅ Policy agreement checkbox
- ✅ Provider Terms PDF updated

---

### **Day 6 Afternoon: Dashboard Payment Display**

**Files to create:**
```
src/components/dashboard/PaymentPolicyCard.tsx
src/components/dashboard/EarningsBreakdown.tsx
```

**Tasks:**
1. Create PaymentPolicyCard:
   - How you get paid (80% + 20%)
   - Fee structure
   - Cancellation protection rules
2. Create EarningsBreakdown:
   - Show upcoming bookings value
   - Show pending payouts
   - Show completed payouts
3. Add to dashboard home

**Deliverables:**
- ✅ PaymentPolicyCard component
- ✅ EarningsBreakdown component
- ✅ Dashboard displays policy

---

### **Day 7: Booking Management**

**Files to modify:**
```
src/components/appointments/UpcomingBookingCard.tsx
src/components/appointments/BookingDetailModal.tsx
src/components/appointments/CancelModal.tsx (update existing)
```

**Tasks:**
1. Update UpcomingBookingCard to show:
   - Deposit received: $X
   - Final payment pending: $Y
2. Update BookingDetailModal with payment timeline
3. Update CancelModal to show:
   - Patient gets full refund
   - You receive $0
   - Cancellation count warning
4. Add "Mark as Complete" button
5. Wire up complete endpoint

**Deliverables:**
- ✅ Payment info in booking cards
- ✅ Updated cancel modal with warnings
- ✅ Mark as Complete functionality
- ✅ Payment timeline visualization

---

### **Day 8: Payout Dashboard**

**Files to create:**
```
src/pages/payouts/PayoutsPage.tsx
src/components/payouts/PayoutHistoryTable.tsx
src/components/payouts/PayoutDetailsModal.tsx
```

**Tasks:**
1. Create PayoutsPage:
   - List all payouts
   - Filter by date range
   - Search by booking number
2. Create PayoutHistoryTable:
   - Show booking number, service, amount, date
   - Click to see breakdown
3. Create PayoutDetailsModal:
   - Show deposit + final payment breakdown
   - Show platform fee calculation
   - Show net payout
4. Add navigation link to sidebar

**Deliverables:**
- ✅ Full payouts dashboard
- ✅ Payout history table
- ✅ Payout details modal
- ✅ Provider can track earnings

---

## 🧪 **PHASE 4: TESTING & DEPLOYMENT (Days 9-10)**

### **Day 9: End-to-End Testing**

**Test Scenarios:**

#### **Scenario 1: Happy Path**
```
1. Patient books $150 service
   ✓ Charged $120 deposit
   ✓ Email sent with payment breakdown
2. Patient views booking
   ✓ Shows "Deposit: $120, Final: $30"
3. Service completed
   ✓ Final $30 charged automatically
   ✓ Provider receives $133.50 ($150 - $16.50 fee)
4. Patient receives receipt
   ✓ Shows total $150 paid
```

#### **Scenario 2: Early Cancellation (>48hrs)**
```
1. Patient books $150 service
   ✓ Charged $120 deposit
2. Patient cancels 72 hours before
   ✓ Refunded $120
   ✓ Provider receives $0
   ✓ Booking removed from both apps
```

#### **Scenario 3: Late Cancellation (<48hrs)**
```
1. Patient books $150 service
   ✓ Charged $120 deposit
2. Patient cancels 30 hours before
   ✓ Refunded $0
   ✓ Provider keeps $120 - $13.50 fee = $106.50
   ✓ Email: "No refund - late cancellation"
```

#### **Scenario 4: Provider Cancellation**
```
1. Patient books $150 service
   ✓ Charged $120 deposit
2. Provider cancels 6 hours before
   ✓ Patient refunded $120
   ✓ Patient receives $20 credit
   ✓ Provider flagged (cancellation #1)
   ✓ Warning issued at cancellation #2
```

#### **Scenario 5: Failed Final Payment**
```
1. Service completed
2. Final payment fails (expired card)
   ✓ Booking marked "final_payment_failed"
   ✓ Email to patient: Update card
   ✓ Cron retries daily for 7 days
   ✓ After 7 days: Sent to collections
```

#### **Scenario 6: Service Adjustment**
```
1. Provider adds $15 lab test (10% increase)
   ✓ Allowed (under 15% limit)
   ✓ Final payment: $30 + $15 = $45
2. Provider tries to add $30 test (20% increase)
   ✓ Rejected (over 15% limit)
   ✓ Error: "Requires patient authorization"
```

**Test Matrix:**

| Component | Test Type | Status |
|-----------|-----------|--------|
| Backend API | Unit tests | ☐ |
| Backend API | Integration tests | ☐ |
| PaymentService | Unit tests | ☐ |
| Stripe integration | Manual test | ☐ |
| Mobile app | Unit tests | ☐ |
| Mobile app | E2E tests | ☐ |
| Provider portal | Unit tests | ☐ |
| Provider portal | E2E tests | ☐ |
| Email templates | Manual review | ☐ |
| Legal docs | Legal review | ☐ |

---

### **Day 10 Morning: Production Deployment**

**Deployment Checklist:**

#### **Backend (Railway)**
```bash
# 1. Merge feature branch
git checkout main
git merge feature/80-20-payment-policy
git push origin main

# 2. Verify environment variables
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- DATABASE_URL

# 3. Run migrations
npm run migrate

# 4. Deploy
# Railway auto-deploys on push to main

# 5. Verify deployment
curl https://api.findrhealth.com/health
```

#### **Mobile App (TestFlight)**
```bash
# 1. Update version number
flutter pub get
flutter build ios --release

# 2. Upload to App Store Connect
# Via Xcode or Transporter

# 3. Submit to TestFlight
# Internal testing first, then external

# 4. Send to beta testers
# Include release notes explaining new payment policy
```

#### **Provider Portal (Vercel)**
```bash
# 1. Merge feature branch
git checkout main
git merge feature/80-20-payment-policy
git push origin main

# 2. Vercel auto-deploys

# 3. Verify deployment
curl https://provider.findrhealth.com/health
```

---

### **Day 10 Afternoon: Monitoring & Rollout**

**Monitoring Setup:**

1. **Stripe Dashboard Alerts:**
   - Failed payments
   - Chargebacks
   - Refund volume

2. **Application Metrics:**
   - Booking creation rate
   - Cancellation rate (before/after 48hrs)
   - Failed final payment rate
   - Provider payout success rate

3. **Customer Support:**
   - Train on new policy
   - Provide scripts (from source document)
   - Monitor ticket volume

**Rollout Strategy:**

**Phase 1 (Days 1-3): Internal Testing**
- Use test Stripe keys
- Internal team creates bookings
- Test all scenarios
- Fix any bugs

**Phase 2 (Days 4-7): Beta Users**
- Switch to live Stripe keys
- Enable for 10-20 beta users
- Monitor closely
- Gather feedback

**Phase 3 (Week 2): Full Rollout**
- Enable for all users
- Announce policy via email
- Update marketing materials
- Monitor metrics

---

## 📋 **IMPLEMENTATION CHECKLIST**

### **Backend**
- [ ] Update Booking model schema
- [ ] Update Provider model schema
- [ ] Create PaymentService class
- [ ] Create platformFee utility
- [ ] Update booking routes (create, cancel, complete)
- [ ] Create cron jobs (retry, auto-complete)
- [ ] Add Stripe webhook handlers
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Deploy to Railway

### **Mobile App**
- [ ] Update BookingModel
- [ ] Update BookingRepository
- [ ] Create PaymentBreakdownCard widget
- [ ] Create CancellationPolicyCard widget
- [ ] Update checkout flow
- [ ] Create CancelBookingModal
- [ ] Update booking confirmation
- [ ] Create cancellation policy screen
- [ ] Update Terms of Service
- [ ] Write tests
- [ ] Submit to TestFlight

### **Provider Portal**
- [ ] Update onboarding flow
- [ ] Create PaymentPolicyCard
- [ ] Create EarningsBreakdown
- [ ] Update booking management
- [ ] Create payouts dashboard
- [ ] Update provider agreement
- [ ] Write tests
- [ ] Deploy to Vercel

### **Legal & Compliance**
- [ ] Update Terms of Service
- [ ] Update Privacy Policy
- [ ] Update Provider Agreement
- [ ] Create Cancellation Policy document
- [ ] Get legal review
- [ ] Update FAQ

### **Marketing & Communication**
- [ ] Email to existing providers
- [ ] Email to existing patients
- [ ] Update website copy
- [ ] Update help docs
- [ ] Create support scripts
- [ ] Train customer support

---

## 🚨 **RISK MITIGATION**

### **Risk 1: Stripe Integration Failures**

**Mitigation:**
- Test with Stripe test mode extensively
- Implement retry logic for transient errors
- Add detailed error logging
- Monitor Stripe dashboard daily
- Have Stripe support contact ready

### **Risk 2: Customer Confusion**

**Mitigation:**
- Clear policy display at checkout
- Email confirmation with breakdown
- FAQ section
- Support team training
- Offer to waive fees in genuine emergencies

### **Risk 3: Provider Pushback**

**Mitigation:**
- Emphasize no-show protection
- Show fee comparison with competitors
- Highlight no monthly fees
- Offer grace period for first cancellation
- Direct feedback channel

### **Risk 4: High Chargeback Rate**

**Mitigation:**
- Clear policy acceptance checkbox
- Save policy acceptance timestamp
- Provide evidence to Stripe for disputes
- Track chargeback rate metrics
- Adjust policy if rate >2%

---

## 📊 **SUCCESS METRICS**

**Week 1 Targets:**
- [ ] No-show rate <5% (vs current baseline)
- [ ] Late cancellation rate <10%
- [ ] Chargeback rate <1%
- [ ] Failed final payment rate <3%
- [ ] Provider cancellation rate <2%

**Week 2-4 Targets:**
- [ ] 90%+ policy awareness (survey)
- [ ] <10 support tickets per 100 bookings
- [ ] Average refund processing <5 days
- [ ] Provider satisfaction >8/10
- [ ] Patient satisfaction >8/10

---

## 🎯 **POST-LAUNCH OPTIMIZATION**

### **Week 2-3: Gather Feedback**
- Survey patients on policy clarity
- Survey providers on protection adequacy
- Analyze cancellation patterns
- Review support tickets

### **Week 4: Iterate**
- Adjust policy if needed (e.g., 48hrs → 24hrs)
- Improve UI based on feedback
- Optimize email templates
- Refine cron job timing

### **Month 2: Advanced Features**
- Automated cancellation fee waivers (emergencies)
- Provider-set custom policies (within limits)
- Loyalty program (reduced fees for regulars)
- Insurance integration

---

## 📞 **SUPPORT & ESCALATION**

**During Implementation:**
- Daily standup (15 min)
- Slack channel: #80-20-payment-policy
- Blocker escalation: Immediate Slack ping
- Code review: Same day
- QA issues: Fix within 24 hours

**Post-Launch:**
- Weekly metrics review
- Monthly policy review
- Quarterly optimization sprint

---

**Ready to begin implementation!** 🚀

Start with Day 1 backend work - download the 5 files above and integrate into your codebase.
