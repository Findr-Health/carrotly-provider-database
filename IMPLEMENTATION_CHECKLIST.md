# Cancellation Policy Implementation Checklist

## Files Created

All files are in `/mnt/user-data/outputs/cancellation-implementation/`:

| File | Purpose |
|------|---------|
| `CANCELLATION_POLICY_SPEC.md` | Full specification document |
| `utils/cancellation.js` | Fee calculation logic |
| `services/stripeService.js` | Stripe payment handling |
| `routes/cancellation.js` | API endpoints |
| `components/CancellationPolicySelector.tsx` | Provider onboarding UI |
| `models/schema-updates.js` | Database schema additions |

---

## Implementation Steps

### Step 1: Backend - Schema Updates

**Update `backend/models/Provider.js`**

Add to schema:
```javascript
cancellationPolicy: {
  tier: {
    type: String,
    enum: ['standard', 'moderate'],
    default: 'standard'
  },
  allowFeeWaiver: {
    type: Boolean,
    default: true
  }
}
```

**Update `backend/models/Booking.js`**

Add payment and cancellation fields (see `models/schema-updates.js`)

---

### Step 2: Backend - Utilities & Services

```bash
# Copy to backend
cp utils/cancellation.js ~/Desktop/carrotly-provider-database/backend/utils/
cp services/stripeService.js ~/Desktop/carrotly-provider-database/backend/services/
```

---

### Step 3: Backend - API Routes

```bash
# Copy routes
cp routes/cancellation.js ~/Desktop/carrotly-provider-database/backend/routes/
```

**Update `backend/server.js`**

Add:
```javascript
const cancellationRoutes = require('./routes/cancellation');
app.use('/api/bookings', cancellationRoutes);
```

---

### Step 4: Provider Onboarding - Add Policy Selection

**Update `carrotly-provider-mvp/src/pages/onboarding/CompleteProfile.tsx`**

Add section after Provider Agreement:

```tsx
{/* Section: Cancellation Policy */}
<div className="border-t border-gray-200 pt-6 mt-6">
  <h2 className="text-xl font-semibold mb-4">Cancellation Policy</h2>
  <CancellationPolicySelector
    value={formData.cancellationPolicy || 'standard'}
    onChange={(tier) => setFormData({ ...formData, cancellationPolicy: tier })}
    allowFeeWaiver={formData.allowFeeWaiver ?? true}
    onAllowFeeWaiverChange={(allow) => setFormData({ ...formData, allowFeeWaiver: allow })}
  />
</div>
```

---

### Step 5: Provider Dashboard - Add Fee Waiver

Add waive fee button to booking detail view in provider dashboard.

---

### Step 6: Mobile App - User Cancellation Flow

Update booking detail screen to show:
1. Policy summary
2. Cancel button with fee preview
3. Cancellation confirmation modal

---

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/bookings/:id/cancellation-quote` | Preview fee before cancelling |
| POST | `/api/bookings/:id/cancel` | User cancels booking |
| POST | `/api/bookings/:id/provider-cancel` | Provider cancels (full refund) |
| POST | `/api/bookings/:id/no-show` | Mark as no-show |
| POST | `/api/bookings/:id/waive-fee` | Provider waives fee |
| GET | `/api/providers/:id/cancellation-policy` | Get provider's policy |
| PUT | `/api/providers/:id/cancellation-policy` | Update provider's policy |

---

## Testing Checklist

### Backend Tests
- [ ] Fee calculation returns correct amounts for each tier
- [ ] Free cancellation deadline is accurate
- [ ] Stripe authorization works
- [ ] Partial capture works for fees
- [ ] Full refund works for provider cancellation
- [ ] Fee waiver refunds correctly

### Provider Onboarding Tests
- [ ] Can select Standard policy
- [ ] Can select Moderate policy
- [ ] Can toggle fee waiver option
- [ ] Policy saves to database

### User App Tests
- [ ] Policy displays on booking confirmation
- [ ] Cancel button shows correct fee preview
- [ ] Cancellation processes correctly
- [ ] User receives confirmation email

### Provider Dashboard Tests
- [ ] Can view booking cancellations
- [ ] Can mark as no-show
- [ ] Can waive fee
- [ ] Fee waiver issues refund

---

## Deploy Order

1. Deploy backend schema updates first
2. Deploy backend routes/services
3. Deploy provider onboarding updates
4. Deploy provider dashboard updates
5. Deploy mobile app updates

---

## Environment Variables Required

Ensure these are set in Railway:

```
STRIPE_SECRET_KEY=sk_live_xxx (or sk_test_xxx for testing)
```

---

## Next Steps

1. Review the spec document
2. Copy files to appropriate locations
3. Update schemas
4. Test in development
5. Deploy to staging
6. Test full flow
7. Deploy to production
