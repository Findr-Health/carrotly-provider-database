/**
 * Stripe Connect Routes for Provider Payouts
 * 
 * File: backend/routes/stripeConnect.js
 * 
 * Handles:
 * - Creating Connect Express accounts for providers
 * - Generating onboarding links
 * - Dashboard access links
 * - Account status checks
 * - Payouts to providers
 */

const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const Provider = require('../models/Provider');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Platform fee: 10% + $1.50, capped at $35
const PLATFORM_FEE_PERCENT = 0.10;
const PLATFORM_FEE_FLAT = 150; // cents
const PLATFORM_FEE_CAP = 3500; // cents

/**
 * POST /api/connect/create-account
 * Create a Stripe Connect Express account for a provider
 */
router.post('/create-account', async (req, res) => {
  try {
    const { providerId } = req.body;
    
    if (!providerId) {
      return res.status(400).json({ error: 'providerId is required' });
    }
    
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Check if already has account
    if (provider.payment?.stripeAccountId) {
      return res.json({ 
        accountId: provider.payment.stripeAccountId,
        message: 'Account already exists'
      });
    }
    
    // Create Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: provider.contactInfo?.email || provider.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        providerId: providerId.toString(),
        practiceName: provider.practiceName
      }
    });
    
    // Save to provider
    if (!provider.payment) {
      provider.payment = {};
    }
    provider.payment.stripeAccountId = account.id;
    provider.payment.method = 'stripe';
    provider.payment.stripeOnboardingComplete = false;
    await provider.save();
    
    res.json({
      accountId: account.id,
      message: 'Stripe Connect account created'
    });
  } catch (error) {
    console.error('Create Connect account error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/connect/onboarding-link
 * Generate an onboarding link for provider to complete Stripe setup
 */
router.post('/onboarding-link', async (req, res) => {
  try {
    const { providerId, returnUrl, refreshUrl } = req.body;
    
    if (!providerId) {
      return res.status(400).json({ error: 'providerId is required' });
    }
    
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    let accountId = provider.payment?.stripeAccountId;
    
    // Create account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: provider.contactInfo?.email || provider.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          providerId: providerId.toString(),
          practiceName: provider.practiceName
        }
      });
      
      if (!provider.payment) {
        provider.payment = {};
      }
      provider.payment.stripeAccountId = account.id;
      provider.payment.method = 'stripe';
      await provider.save();
      
      accountId = account.id;
    }
    
    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl || 'https://findrhealth-provider.vercel.app/dashboard?stripe=refresh',
      return_url: returnUrl || 'https://findrhealth-provider.vercel.app/dashboard?stripe=complete',
      type: 'account_onboarding',
    });
    
    res.json({
      url: accountLink.url,
      accountId: accountId
    });
  } catch (error) {
    console.error('Onboarding link error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/connect/dashboard-link
 * Generate a link to Stripe Express Dashboard for provider
 */
router.post('/dashboard-link', async (req, res) => {
  try {
    const { providerId } = req.body;
    
    if (!providerId) {
      return res.status(400).json({ error: 'providerId is required' });
    }
    
    const provider = await Provider.findById(providerId);
    if (!provider?.payment?.stripeAccountId) {
      return res.status(404).json({ error: 'No Stripe account connected' });
    }
    
    const loginLink = await stripe.accounts.createLoginLink(
      provider.payment.stripeAccountId
    );
    
    res.json({ url: loginLink.url });
  } catch (error) {
    console.error('Dashboard link error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/connect/status/:providerId
 * Get Stripe Connect account status for a provider
 */
router.get('/status/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    if (!provider.payment?.stripeAccountId) {
      return res.json({
        connected: false,
        onboardingComplete: false,
        accountId: null
      });
    }
    
    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(provider.payment.stripeAccountId);
    
    const isComplete = account.details_submitted && 
                       account.charges_enabled && 
                       account.payouts_enabled;
    
    // Update provider if status changed
    if (provider.payment.stripeOnboardingComplete !== isComplete) {
      provider.payment.stripeOnboardingComplete = isComplete;
      await provider.save();
    }
    
    res.json({
      connected: true,
      onboardingComplete: isComplete,
      accountId: provider.payment.stripeAccountId,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      email: account.email
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/connect/create-payout
 * Transfer funds to provider after booking completion
 */
router.post('/create-payout', async (req, res) => {
  try {
    const { providerId, bookingId, amount, description } = req.body;
    
    if (!providerId || !amount) {
      return res.status(400).json({ error: 'providerId and amount required' });
    }
    
    const provider = await Provider.findById(providerId);
    if (!provider?.payment?.stripeAccountId) {
      return res.status(404).json({ error: 'Provider has no connected Stripe account' });
    }
    
    if (!provider.payment.stripeOnboardingComplete) {
      return res.status(400).json({ error: 'Provider Stripe onboarding not complete' });
    }
    
    // Calculate platform fee
    let platformFee = Math.round(amount * PLATFORM_FEE_PERCENT) + PLATFORM_FEE_FLAT;
    platformFee = Math.min(platformFee, PLATFORM_FEE_CAP);
    
    const providerAmount = amount - platformFee;
    
    // Create transfer to connected account
    const transfer = await stripe.transfers.create({
      amount: providerAmount,
      currency: 'usd',
      destination: provider.payment.stripeAccountId,
      description: description || `Payout for booking ${bookingId}`,
      metadata: {
        providerId: providerId.toString(),
        bookingId: bookingId || '',
        originalAmount: amount,
        platformFee: platformFee
      }
    });
    
    res.json({
      transferId: transfer.id,
      amount: providerAmount,
      platformFee: platformFee,
      status: transfer.status || 'pending'
    });
  } catch (error) {
    console.error('Create payout error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/connect/balance/:providerId
 * Get provider's Stripe balance
 */
router.get('/balance/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    
    const provider = await Provider.findById(providerId);
    if (!provider?.payment?.stripeAccountId) {
      return res.status(404).json({ error: 'No Stripe account connected' });
    }
    
    const balance = await stripe.balance.retrieve({
      stripeAccount: provider.payment.stripeAccountId
    });
    
    res.json({
      available: balance.available,
      pending: balance.pending
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/connect/disconnect
 * Disconnect provider's Stripe account
 */
router.post('/disconnect', async (req, res) => {
  try {
    const { providerId } = req.body;
    
    if (!providerId) {
      return res.status(400).json({ error: 'providerId is required' });
    }
    
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Clear Stripe fields
    if (provider.payment) {
      provider.payment.stripeAccountId = undefined;
      provider.payment.stripeEmail = undefined;
      provider.payment.stripeOnboardingComplete = false;
    }
    await provider.save();
    
    res.json({ success: true, message: 'Stripe account disconnected' });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
