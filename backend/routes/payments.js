/**
 * Payment Routes for Findr Health
 * 
 * File: backend/routes/payments.js
 * 
 * Handles:
 * - Setup intents for adding cards
 * - Payment methods CRUD
 * - Payment intents for bookings
 */

const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

// Initialize Stripe with secret key from environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// User model (for storing Stripe customer ID)
const User = require('../models/User');

/**
 * Get or create Stripe customer for user
 */
async function getOrCreateCustomer(userId, email) {
  let user = await User.findById(userId);
  
  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }
  
  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: email || `user_${userId}@findrhealth.com`,
    metadata: { userId: userId.toString() }
  });
  
  // Save customer ID to user
  if (user) {
    user.stripeCustomerId = customer.id;
    await user.save();
  }
  
  return customer.id;
}

/**
 * POST /api/payments/setup-intent
 * Create a SetupIntent for adding a new payment method
 */
router.post('/setup-intent', async (req, res) => {
  try {
    const { userId, email } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const customerId = await getOrCreateCustomer(userId, email);
    
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      metadata: { userId: userId.toString() }
    });
    
    res.json({
      clientSecret: setupIntent.client_secret,
      customerId: customerId
    });
  } catch (error) {
    console.error('Setup intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/payments/methods
 * Get all payment methods for a user
 */
router.get('/methods', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const user = await User.findById(userId);
    
    if (!user?.stripeCustomerId) {
      return res.json({ methods: [] });
    }
    
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });
    
    // Get default payment method
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
    console.error('Get methods error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/payments/methods/:id
 * Delete a payment method
 */
router.delete('/methods/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await stripe.paymentMethods.detach(id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete method error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payments/methods/:id/default
 * Set a payment method as default
 */
router.post('/methods/:id/default', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const user = await User.findById(userId);
    
    if (!user?.stripeCustomerId) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: id,
      },
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Set default error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payments/create-payment-intent
 * Create a PaymentIntent for booking
 */
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { 
      userId, 
      amount, // in cents
      paymentMethodId,
      bookingId,
      description 
    } = req.body;
    
    if (!userId || !amount) {
      return res.status(400).json({ error: 'userId and amount are required' });
    }
    
    const customerId = await getOrCreateCustomer(userId);
    
    const paymentIntentData = {
      amount: Math.round(amount), // Ensure integer
      currency: 'usd',
      customer: customerId,
      description: description || 'Findr Health booking',
      metadata: {
        userId: userId.toString(),
        bookingId: bookingId || '',
      },
      // Capture immediately (Option C)
      capture_method: 'automatic',
    };
    
    // If specific payment method provided, use it
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
    console.error('Payment intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payments/confirm
 * Confirm a payment (if not auto-confirmed)
 */
router.post('/confirm', async (req, res) => {
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
    console.error('Confirm error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payments/refund
 * Refund a payment (for cancellations)
 */
router.post('/refund', async (req, res) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;
    
    const refundData = {
      payment_intent: paymentIntentId,
      reason: reason || 'requested_by_customer',
    };
    
    // Partial refund if amount specified
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
    console.error('Refund error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


// =============================================================================
// ADD TO backend/index.js or backend/server.js
// =============================================================================
// 
// Add this line with other route imports:
// const paymentsRoutes = require('./routes/payments');
//
// Add this line with other app.use() statements:
// app.use('/api/payments', paymentsRoutes);
//
// =============================================================================


// =============================================================================
// ADD stripeCustomerId TO User model if not exists
// =============================================================================
//
// In backend/models/User.js, add to schema:
//
// stripeCustomerId: {
//   type: String,
//   default: null
// },
//
// =============================================================================
