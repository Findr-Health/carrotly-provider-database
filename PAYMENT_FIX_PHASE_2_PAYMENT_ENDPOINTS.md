# 🎯 PAYMENT SYSTEM FIX - PHASE 2: PAYMENT ENDPOINTS

## PREREQUISITE: Phase 1 Complete ✅
- User model has stripe fields
- Migration ran successfully
- API returns stripe data

---

## 🔍 WHAT WE'RE FIXING

**Current Payment Flow (BROKEN):**
```
1. User taps "Add Credit Card"
2. Backend: Create NEW Stripe customer (customer_ABC)
3. User enters card details in Stripe sheet
4. Card attached to customer_ABC
5. Backend API called again
6. Backend: Create ANOTHER Stripe customer (customer_XYZ)
7. Try to use payment method from customer_ABC with customer_XYZ
8. ERROR: "PaymentMethod doesn't belong to Customer"
```

**Fixed Payment Flow:**
```
1. User taps "Add Credit Card"
2. Backend: Check if user.stripe.customerId exists
3. IF EXISTS → Reuse existing customer
   IF NOT → Create new customer AND save to user.stripe.customerId
4. User enters card details in Stripe sheet
5. Card attached to correct customer
6. Backend API called
7. Backend: Use SAME customer ID from database
8. SUCCESS: Payment method works ✅
```

---

## 📂 FILE 1: Payment Setup Endpoint

### File: `backend/routes/payments.js`

### FIND: POST /setup-intent endpoint (or create if doesn't exist)

### CURRENT CODE (BROKEN):
```javascript
router.post('/setup-intent', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    // ❌ PROBLEM: Creates new customer EVERY TIME
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        userId: user._id.toString(),
      },
    });
    
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
    });
    
    res.json({
      clientSecret: setupIntent.client_secret,
    });
  } catch (error) {
    console.error('Setup intent error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### REPLACE WITH (FIXED):
```javascript
router.post('/setup-intent', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // ✅ STEP 1: Check if user already has Stripe customer
    let customerId = user.stripe?.customerId;
    
    if (!customerId) {
      console.log(`[Payment] Creating new Stripe customer for user: ${user.email}`);
      
      // ✅ STEP 2: Create NEW customer only if doesn't exist
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user._id.toString(),
          createdBy: 'findr-health-app',
        },
      });
      
      customerId = customer.id;
      
      // ✅ STEP 3: SAVE customer ID to database
      user.stripe = user.stripe || {};
      user.stripe.customerId = customerId;
      user.stripe.customerCreatedAt = new Date();
      await user.save();
      
      console.log(`[Payment] ✅ Saved customer ID to database: ${customerId}`);
    } else {
      console.log(`[Payment] ✅ Reusing existing customer: ${customerId}`);
    }
    
    // ✅ STEP 4: Create setup intent with PERSISTENT customer ID
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      metadata: {
        userId: user._id.toString(),
      },
    });
    
    console.log(`[Payment] ✅ Created setup intent: ${setupIntent.id}`);
    
    res.json({
      success: true,
      clientSecret: setupIntent.client_secret,
      customerId: customerId, // ✅ Return to mobile app
    });
    
  } catch (error) {
    console.error('[Payment] Setup intent error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to initialize payment setup',
      message: error.message 
    });
  }
});
```

---

## 📂 FILE 2: List Payment Methods Endpoint

### Add this NEW endpoint to `backend/routes/payments.js`:

```javascript
/**
 * GET /api/payments/payment-methods
 * List all payment methods for the current user
 */
router.get('/payment-methods', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user has Stripe customer
    if (!user.stripe?.customerId) {
      return res.json({
        success: true,
        paymentMethods: [],
        defaultPaymentMethod: null,
      });
    }
    
    // Fetch payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripe.customerId,
      type: 'card',
    });
    
    console.log(`[Payment] Found ${paymentMethods.data.length} payment methods`);
    
    // Transform to simpler format
    const methods = paymentMethods.data.map(pm => ({
      id: pm.id,
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
      isDefault: pm.id === user.stripe.defaultPaymentMethod,
    }));
    
    res.json({
      success: true,
      paymentMethods: methods,
      defaultPaymentMethod: user.stripe.defaultPaymentMethod,
    });
    
  } catch (error) {
    console.error('[Payment] List payment methods error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch payment methods',
      message: error.message 
    });
  }
});
```

---

## 📂 FILE 3: Attach Payment Method Endpoint

### Add this NEW endpoint to `backend/routes/payments.js`:

```javascript
/**
 * POST /api/payments/attach-payment-method
 * Attach a payment method to user's Stripe customer
 * Called after successful card entry in mobile app
 */
router.post('/attach-payment-method', authenticate, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    
    if (!paymentMethodId) {
      return res.status(400).json({ 
        success: false,
        error: 'Payment method ID is required' 
      });
    }
    
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Ensure user has customer ID
    if (!user.stripe?.customerId) {
      return res.status(400).json({ 
        success: false,
        error: 'No Stripe customer found for user' 
      });
    }
    
    console.log(`[Payment] Attaching payment method ${paymentMethodId} to customer ${user.stripe.customerId}`);
    
    // ✅ Attach payment method to customer
    const paymentMethod = await stripe.paymentMethods.attach(
      paymentMethodId,
      { customer: user.stripe.customerId }
    );
    
    console.log(`[Payment] ✅ Payment method attached successfully`);
    
    // ✅ Update user's payment methods array
    if (!user.stripe.paymentMethods.includes(paymentMethodId)) {
      user.stripe.paymentMethods.push(paymentMethodId);
    }
    
    // ✅ Set as default if no default exists
    if (!user.stripe.defaultPaymentMethod) {
      user.stripe.defaultPaymentMethod = paymentMethodId;
      console.log(`[Payment] ✅ Set as default payment method`);
    }
    
    await user.save();
    
    res.json({
      success: true,
      paymentMethod: {
        id: paymentMethod.id,
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year,
      },
      isDefault: paymentMethodId === user.stripe.defaultPaymentMethod,
    });
    
  } catch (error) {
    console.error('[Payment] Attach payment method error:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid payment method',
        message: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to attach payment method',
      message: error.message 
    });
  }
});
```

---

## 📂 FILE 4: Set Default Payment Method

### Add this NEW endpoint to `backend/routes/payments.js`:

```javascript
/**
 * POST /api/payments/set-default
 * Set a payment method as the default
 */
router.post('/set-default', authenticate, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    
    if (!paymentMethodId) {
      return res.status(400).json({ 
        success: false,
        error: 'Payment method ID is required' 
      });
    }
    
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify payment method belongs to user
    if (!user.stripe?.paymentMethods.includes(paymentMethodId)) {
      return res.status(403).json({ 
        success: false,
        error: 'Payment method not found' 
      });
    }
    
    console.log(`[Payment] Setting default payment method: ${paymentMethodId}`);
    
    // Update default in Stripe
    await stripe.customers.update(user.stripe.customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
    
    // Update in database
    user.stripe.defaultPaymentMethod = paymentMethodId;
    await user.save();
    
    console.log(`[Payment] ✅ Default payment method updated`);
    
    res.json({
      success: true,
      defaultPaymentMethod: paymentMethodId,
    });
    
  } catch (error) {
    console.error('[Payment] Set default error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to set default payment method',
      message: error.message 
    });
  }
});
```

---

## 📂 FILE 5: Delete Payment Method

### Add this NEW endpoint to `backend/routes/payments.js`:

```javascript
/**
 * DELETE /api/payments/payment-methods/:id
 * Remove a payment method
 */
router.delete('/payment-methods/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify ownership
    if (!user.stripe?.paymentMethods.includes(id)) {
      return res.status(403).json({ 
        success: false,
        error: 'Payment method not found' 
      });
    }
    
    console.log(`[Payment] Detaching payment method: ${id}`);
    
    // Detach from Stripe
    await stripe.paymentMethods.detach(id);
    
    // Remove from database
    user.stripe.paymentMethods = user.stripe.paymentMethods.filter(
      pm => pm !== id
    );
    
    // If this was the default, clear it
    if (user.stripe.defaultPaymentMethod === id) {
      user.stripe.defaultPaymentMethod = null;
      
      // Set a new default if other methods exist
      if (user.stripe.paymentMethods.length > 0) {
        user.stripe.defaultPaymentMethod = user.stripe.paymentMethods[0];
      }
    }
    
    await user.save();
    
    console.log(`[Payment] ✅ Payment method removed`);
    
    res.json({
      success: true,
      message: 'Payment method removed',
    });
    
  } catch (error) {
    console.error('[Payment] Delete payment method error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to remove payment method',
      message: error.message 
    });
  }
});
```

---

## 🧪 TESTING PHASE 2

### Step 1: Update Routes File
```bash
cd ~/Development/findr-health/findr-health-backend
code backend/routes/payments.js

# Update setup-intent endpoint
# Add new endpoints (list, attach, set-default, delete)
```

### Step 2: Restart Backend
```bash
cd backend
npm run dev

# Watch for errors in terminal
```

### Step 3: Test with cURL

#### Test A: Setup Intent
```bash
# Get auth token first
TOKEN="your_jwt_token"

# Test setup intent
curl -X POST http://localhost:5000/api/payments/setup-intent \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Expected response:
# {
#   "success": true,
#   "clientSecret": "seti_...",
#   "customerId": "cus_..."
# }

# VERIFY: Check that customerId is saved to user in database
```

#### Test B: List Payment Methods
```bash
curl -X GET http://localhost:5000/api/payments/payment-methods \
  -H "Authorization: Bearer $TOKEN"

# Expected response:
# {
#   "success": true,
#   "paymentMethods": [],
#   "defaultPaymentMethod": null
# }
```

### Step 4: Check Database
```bash
# MongoDB query to verify customer ID saved
db.users.findOne(
  { email: "test@example.com" },
  { stripe: 1 }
)

# Should show:
# {
#   stripe: {
#     customerId: "cus_...",
#     paymentMethods: [],
#     defaultPaymentMethod: null,
#     customerCreatedAt: ISODate("...")
#   }
# }
```

### Step 5: Test Reuse Logic
```bash
# Call setup-intent AGAIN with same user
curl -X POST http://localhost:5000/api/payments/setup-intent \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Expected in logs:
# [Payment] ✅ Reusing existing customer: cus_...

# VERIFY: Same customerId returned (not a new one)
```

---

## ✅ PHASE 2 CHECKLIST

- [ ] Updated setup-intent endpoint (customer reuse logic)
- [ ] Added list payment methods endpoint
- [ ] Added attach payment method endpoint
- [ ] Added set default endpoint
- [ ] Added delete payment method endpoint
- [ ] Backend restarted successfully
- [ ] Tested setup-intent with cURL
- [ ] Verified customer ID saved to database
- [ ] Tested setup-intent AGAIN (reuse logic works)
- [ ] Tested list payment methods endpoint
- [ ] No errors in backend logs

---

## 🚨 COMMON ISSUES & SOLUTIONS

### Issue: "stripe is not defined"
```javascript
// Make sure Stripe is initialized at top of payments.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
```

### Issue: "Cannot read property 'customerId' of undefined"
```javascript
// Add null check
if (!user.stripe) {
  user.stripe = {
    customerId: null,
    paymentMethods: [],
    defaultPaymentMethod: null,
  };
}
```

### Issue: Customer ID not saving
```javascript
// Make sure to call user.save()
await user.save();

// And check it worked
console.log('Saved customer ID:', user.stripe.customerId);
```

---

## ⏭️ NEXT: PHASE 3

After Phase 2 is complete and tested:

**PHASE 3: FLUTTER INTEGRATION**
- Update payment service to handle customer IDs
- Properly call attach endpoint after card entry
- Display payment methods list
- Handle errors gracefully

**Estimated Phase 2 Time:** 2-3 hours  
**Difficulty:** High (core payment logic)  
**Risk:** Medium (test thoroughly)

---

**Ready for Phase 3? Complete Phase 2 verification first!** 🚀
