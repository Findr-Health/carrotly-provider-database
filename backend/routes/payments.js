/**
 * Payment Routes for Findr Health
 */

const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

// Authentication middleware
const { authenticateToken } = require('../middleware/auth');

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// User model
const User = require('../models/User');

/**
 * POST /api/payments/setup-intent
 * Create a SetupIntent for adding a new payment method
 */
router.post('/setup-intent', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // ✅ CHECK: Does user already have Stripe customer?
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      // ✅ CREATE: Only if doesn't exist
      console.log(`[Payment] Creating new Stripe customer for: ${user.email}`);
      
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user._id.toString(),
        },
      });
      
      customerId = customer.id;
      
      // ✅ SAVE: Store customer ID in database
      user.stripeCustomerId = customerId;
      await user.save();
      
      console.log(`[Payment] ✅ Saved customer ID: ${customerId}`);
    } else {
      console.log(`[Payment] ✅ Reusing existing customer: ${customerId}`);
    }
    
    // ✅ USE: Persistent customer ID
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });
    
    res.json({
      success: true,
      clientSecret: setupIntent.client_secret,
      customerId: customerId,
    });
    
  } catch (error) {
    console.error('[Payment] Setup intent error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to initialize payment',
      message: error.message 
    });
  }
});

/**
 * GET /api/payments/methods
 * Get all payment methods for a user
 */
router.get('/methods', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.stripeCustomerId) {
      return res.json({ methods: [] });
    }
    
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });
    
    const customer = await stripe.customers.retrieve(user.stripeCustomerId);
    const defaultPaymentMethod = customer.invoice_settings?.default_payment_method;
    
    const methods = paymentMethods.data.map(pm => ({
      id: pm.id,
      card: {
        brand: pm.card.brand,
        last4: pm.card.last4,
        exp_month: pm.card.exp_month,
        exp_year: pm.card.exp_year,
      },
      isDefault: pm.id === defaultPaymentMethod
    }));
    
    res.json({ methods });
  } catch (error) {
    console.error('[Payment] Get methods error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/payments/methods/:id
 * Delete a payment method
 */
router.delete('/methods/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user.userId);
    
    if (!user?.stripeCustomerId) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const paymentMethod = await stripe.paymentMethods.retrieve(id);
    if (paymentMethod.customer !== user.stripeCustomerId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await stripe.paymentMethods.detach(id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Payment] Delete method error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payments/methods/:id/default
 * Set a payment method as default
 */
router.post('/methods/:id/default', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user.userId);
    
    if (!user?.stripeCustomerId) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const paymentMethod = await stripe.paymentMethods.retrieve(id);
    if (paymentMethod.customer !== user.stripeCustomerId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: id,
      },
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Payment] Set default error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payments/create-payment-intent
 * Create a PaymentIntent for booking
 */
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { 
      amount,
      paymentMethodId,
      bookingId,
      description 
    } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'amount is required' });
    }
    
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: { userId: user._id.toString() }
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }
    
    const paymentIntentData = {
      amount: Math.round(amount),
      currency: 'usd',
      customer: customerId,
      description: description || 'Findr Health booking',
      metadata: {
        userId: user._id.toString(),
        bookingId: bookingId || '',
      },
      capture_method: 'automatic',
    };
    
    if (paymentMethodId) {
      paymentIntentData.payment_method = paymentMethodId;
      paymentIntentData.confirm = true;
      paymentIntentData.return_url = 'findrhealth://payment-complete';
    }
    
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status
    });
  } catch (error) {
    console.error('[Payment] Payment intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payments/confirm
 * Confirm a payment
 */
router.post('/confirm', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId, paymentMethodId } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
      return_url: 'findrhealth://payment-complete',
    });
    
    res.json({
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('[Payment] Confirm error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payments/refund
 * Refund a payment
 */
router.post('/refund', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;
    
    const refundData = {
      payment_intent: paymentIntentId,
      reason: reason || 'requested_by_customer',
    };
    
    if (amount) {
      refundData.amount = Math.round(amount);
    }
    
    const refund = await stripe.refunds.create(refundData);
    
    res.json({
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount
    });
  } catch (error) {
    console.error('[Payment] Refund error:', error);
    res.status(500).json({ error: error.message });
  }
});


// TEMPORARY: Clear customer ID for current user
router.post('/clear-customer', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const oldCustomerId = user.stripeCustomerId;
    user.stripeCustomerId = undefined;
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Customer ID cleared',
      oldCustomerId: oldCustomerId,
      email: user.email
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
