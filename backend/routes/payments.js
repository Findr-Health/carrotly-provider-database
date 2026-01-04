/**
 * Findr Health Payments Routes
 * 
 * Endpoints:
 * POST   /api/payments/setup-intent         - Create setup intent for saving card
 * GET    /api/payments/methods/:userId      - Get user's payment methods
 * POST   /api/payments/methods              - Add payment method
 * DELETE /api/payments/methods/:id          - Remove payment method
 * POST   /api/payments/methods/:id/default  - Set as default
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const stripeService = require('../services/stripeService');

// ==================== CREATE SETUP INTENT ====================
// Used to save a card without charging it

router.post('/setup-intent', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripeService.createCustomer({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        phone: user.phone,
        metadata: { userId: userId.toString() }
      });
      stripeCustomerId = customer.id;
      
      // Save to user
      await User.findByIdAndUpdate(userId, { stripeCustomerId });
    }

    // Create setup intent
    const setupIntent = await stripeService.createSetupIntent(stripeCustomerId);

    res.json({
      success: true,
      clientSecret: setupIntent.clientSecret,
      setupIntentId: setupIntent.id
    });

  } catch (error) {
    console.error('Create setup intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== GET PAYMENT METHODS ====================

router.get('/methods/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.stripeCustomerId) {
      return res.json({
        success: true,
        paymentMethods: [],
        defaultMethodId: null
      });
    }

    // Get payment methods from Stripe
    const methods = await stripeService.listPaymentMethods(user.stripeCustomerId);
    
    // Get default from customer
    const customer = await stripeService.getCustomer(user.stripeCustomerId);
    const defaultMethodId = customer.invoice_settings?.default_payment_method;

    res.json({
      success: true,
      paymentMethods: methods.map(m => ({
        id: m.id,
        brand: capitalizeFirst(m.brand),
        last4: m.last4,
        expMonth: m.expMonth,
        expYear: m.expYear,
        isDefault: m.id === defaultMethodId,
        displayName: `${capitalizeFirst(m.brand)} •••• ${m.last4}`
      })),
      defaultMethodId
    });

  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADD PAYMENT METHOD ====================

router.post('/methods', async (req, res) => {
  try {
    const { userId, paymentMethodId, setAsDefault = true } = req.body;

    if (!userId || !paymentMethodId) {
      return res.status(400).json({ error: 'User ID and payment method ID are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripeService.createCustomer({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        phone: user.phone,
        metadata: { userId: userId.toString() }
      });
      stripeCustomerId = customer.id;
      
      await User.findByIdAndUpdate(userId, { stripeCustomerId });
    }

    // Attach payment method
    const paymentMethod = await stripeService.attachPaymentMethod(
      paymentMethodId, 
      stripeCustomerId
    );

    // Set as default if requested
    if (setAsDefault) {
      await stripeService.updateCustomer(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
    }

    res.json({
      success: true,
      paymentMethod: {
        id: paymentMethod.id,
        brand: capitalizeFirst(paymentMethod.card.brand),
        last4: paymentMethod.card.last4,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year,
        isDefault: setAsDefault
      },
      message: 'Payment method added successfully'
    });

  } catch (error) {
    console.error('Add payment method error:', error);
    
    // Handle specific Stripe errors
    if (error.code === 'card_declined') {
      return res.status(400).json({ error: 'Card was declined' });
    }
    if (error.code === 'incorrect_cvc') {
      return res.status(400).json({ error: 'Incorrect CVC' });
    }
    if (error.code === 'expired_card') {
      return res.status(400).json({ error: 'Card has expired' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// ==================== REMOVE PAYMENT METHOD ====================

router.delete('/methods/:paymentMethodId', async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Detach from Stripe
    await stripeService.detachPaymentMethod(paymentMethodId);

    res.json({
      success: true,
      message: 'Payment method removed'
    });

  } catch (error) {
    console.error('Remove payment method error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== SET DEFAULT PAYMENT METHOD ====================

router.post('/methods/:paymentMethodId/default', async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: 'No payment methods on file' });
    }

    // Update default in Stripe
    await stripeService.updateCustomer(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    res.json({
      success: true,
      message: 'Default payment method updated'
    });

  } catch (error) {
    console.error('Set default payment method error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== HELPER FUNCTIONS ====================

function capitalizeFirst(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

module.exports = router;
