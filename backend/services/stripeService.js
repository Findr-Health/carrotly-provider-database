/**
 * Findr Health Stripe Service
 * 
 * Handles:
 * - Customer management
 * - Payment method attachment
 * - Payment intent creation (authorize)
 * - Payment capture
 * - Refunds
 * - Connect payouts to providers
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { toCents, toDollars, calculateFees } = require('../utils/feeCalculation');

const stripeService = {
  
  // ==================== CUSTOMERS ====================
  
  /**
   * Create a Stripe customer
   * @param {Object} params - Customer details
   * @returns {Object} Stripe customer object
   */
  async createCustomer({ email, name, phone, metadata = {} }) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        phone,
        metadata: {
          ...metadata,
          platform: 'findr_health'
        }
      });
      
      console.log(`Created Stripe customer: ${customer.id}`);
      return customer;
    } catch (error) {
      console.error('Stripe createCustomer error:', error);
      throw error;
    }
  },
  
  /**
   * Get a Stripe customer
   * @param {string} customerId - Stripe customer ID
   * @returns {Object} Stripe customer object
   */
  async getCustomer(customerId) {
    try {
      return await stripe.customers.retrieve(customerId);
    } catch (error) {
      console.error('Stripe getCustomer error:', error);
      throw error;
    }
  },
  
  /**
   * Update a Stripe customer
   * @param {string} customerId - Stripe customer ID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated customer
   */
  async updateCustomer(customerId, updates) {
    try {
      return await stripe.customers.update(customerId, updates);
    } catch (error) {
      console.error('Stripe updateCustomer error:', error);
      throw error;
    }
  },
  
  // ==================== PAYMENT METHODS ====================
  
  /**
   * Attach a payment method to a customer
   * @param {string} paymentMethodId - Stripe payment method ID
   * @param {string} customerId - Stripe customer ID
   * @returns {Object} Payment method object
   */
  async attachPaymentMethod(paymentMethodId, customerId) {
    try {
      // Attach to customer
      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });
      
      // Set as default
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
      
      console.log(`Attached payment method ${paymentMethodId} to customer ${customerId}`);
      return paymentMethod;
    } catch (error) {
      console.error('Stripe attachPaymentMethod error:', error);
      throw error;
    }
  },
  
  /**
   * List customer's payment methods
   * @param {string} customerId - Stripe customer ID
   * @returns {Array} List of payment methods
   */
  async listPaymentMethods(customerId) {
    try {
      const methods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });
      
      return methods.data.map(pm => ({
        id: pm.id,
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
        isDefault: pm.id === pm.customer?.invoice_settings?.default_payment_method
      }));
    } catch (error) {
      console.error('Stripe listPaymentMethods error:', error);
      throw error;
    }
  },
  
  /**
   * Detach (remove) a payment method
   * @param {string} paymentMethodId - Stripe payment method ID
   * @returns {Object} Detached payment method
   */
  async detachPaymentMethod(paymentMethodId) {
    try {
      return await stripe.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      console.error('Stripe detachPaymentMethod error:', error);
      throw error;
    }
  },
  
  /**
   * Create a setup intent for saving a card without charging
   * @param {string} customerId - Stripe customer ID
   * @returns {Object} Setup intent with client secret
   */
  async createSetupIntent(customerId) {
    try {
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session' // Allow charging later without customer present
      });
      
      return {
        id: setupIntent.id,
        clientSecret: setupIntent.client_secret
      };
    } catch (error) {
      console.error('Stripe createSetupIntent error:', error);
      throw error;
    }
  },
  
  // ==================== PAYMENT INTENTS ====================
  
  /**
   * Create a payment intent (authorize only, don't capture)
   * @param {Object} params - Payment parameters
   * @returns {Object} Payment intent
   */
  async createPaymentIntent({
    amount,              // In dollars
    customerId,
    paymentMethodId,
    providerId,
    bookingId,
    serviceName,
    capture = false      // false = authorize only
  }) {
    try {
      const amountCents = toCents(amount);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId,
        capture_method: capture ? 'automatic' : 'manual',
        confirm: true,
        
        // Allow off-session payments if needed
        off_session: false,
        
        // Metadata for tracking
        metadata: {
          platform: 'findr_health',
          providerId: providerId?.toString(),
          bookingId: bookingId?.toString(),
          serviceName,
          amountDollars: amount.toString()
        },
        
        // For 3D Secure redirects
        return_url: `${process.env.APP_URL || 'https://findrhealth.com'}/booking/payment-complete`,
        
        // Description shown on statements
        statement_descriptor_suffix: 'FINDR HEALTH'
      });
      
      console.log(`Created payment intent: ${paymentIntent.id}, status: ${paymentIntent.status}`);
      
      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amount: toDollars(paymentIntent.amount),
        requiresAction: paymentIntent.status === 'requires_action',
        nextActionUrl: paymentIntent.next_action?.redirect_to_url?.url
      };
    } catch (error) {
      console.error('Stripe createPaymentIntent error:', error);
      throw error;
    }
  },
  
  /**
   * Capture an authorized payment
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @param {number} amount - Amount to capture in dollars (optional, defaults to full amount)
   * @returns {Object} Captured payment intent
   */
  async capturePaymentIntent(paymentIntentId, amount = null) {
    try {
      const params = {};
      if (amount !== null) {
        params.amount_to_capture = toCents(amount);
      }
      
      const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId, params);
      
      console.log(`Captured payment intent: ${paymentIntentId}, amount: ${toDollars(paymentIntent.amount_received)}`);
      
      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amountCaptured: toDollars(paymentIntent.amount_received)
      };
    } catch (error) {
      console.error('Stripe capturePaymentIntent error:', error);
      throw error;
    }
  },
  
  /**
   * Cancel a payment intent (release authorization)
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {Object} Cancelled payment intent
   */
  async cancelPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
      
      console.log(`Cancelled payment intent: ${paymentIntentId}`);
      
      return {
        id: paymentIntent.id,
        status: paymentIntent.status
      };
    } catch (error) {
      // If already cancelled or captured, that's ok
      if (error.code === 'payment_intent_unexpected_state') {
        console.log(`Payment intent ${paymentIntentId} already in final state`);
        return { id: paymentIntentId, status: 'cancelled' };
      }
      console.error('Stripe cancelPaymentIntent error:', error);
      throw error;
    }
  },
  
  /**
   * Get payment intent details
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {Object} Payment intent
   */
  async getPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: toDollars(paymentIntent.amount),
        amountCaptured: toDollars(paymentIntent.amount_received || 0),
        customerId: paymentIntent.customer,
        paymentMethodId: paymentIntent.payment_method,
        metadata: paymentIntent.metadata,
        createdAt: new Date(paymentIntent.created * 1000)
      };
    } catch (error) {
      console.error('Stripe getPaymentIntent error:', error);
      throw error;
    }
  },
  
  // ==================== REFUNDS ====================
  
  /**
   * Create a refund
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @param {number} amount - Amount to refund in dollars (optional, defaults to full amount)
   * @param {string} reason - Refund reason
   * @returns {Object} Refund object
   */
  async createRefund(paymentIntentId, amount = null, reason = 'requested_by_customer') {
    try {
      const params = {
        payment_intent: paymentIntentId,
        reason // 'duplicate', 'fraudulent', or 'requested_by_customer'
      };
      
      if (amount !== null) {
        params.amount = toCents(amount);
      }
      
      const refund = await stripe.refunds.create(params);
      
      console.log(`Created refund: ${refund.id}, amount: ${toDollars(refund.amount)}`);
      
      return {
        id: refund.id,
        status: refund.status,
        amount: toDollars(refund.amount)
      };
    } catch (error) {
      console.error('Stripe createRefund error:', error);
      throw error;
    }
  },
  
  // ==================== STRIPE CONNECT (Provider Payouts) ====================
  
  /**
   * Create a Connect account for a provider
   * @param {Object} params - Provider details
   * @returns {Object} Connect account
   */
  async createConnectAccount({ email, businessName, providerId }) {
    try {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        business_type: 'individual',
        business_profile: {
          name: businessName,
          product_description: 'Healthcare services via Findr Health'
        },
        metadata: {
          platform: 'findr_health',
          providerId: providerId?.toString()
        }
      });
      
      console.log(`Created Connect account: ${account.id}`);
      return account;
    } catch (error) {
      console.error('Stripe createConnectAccount error:', error);
      throw error;
    }
  },
  
  /**
   * Create an account link for Connect onboarding
   * @param {string} accountId - Stripe Connect account ID
   * @returns {Object} Account link with URL
   */
  async createConnectAccountLink(accountId) {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.PROVIDER_PORTAL_URL || 'https://findrhealth-provider.vercel.app'}/settings/payments/retry`,
        return_url: `${process.env.PROVIDER_PORTAL_URL || 'https://findrhealth-provider.vercel.app'}/settings/payments/complete`,
        type: 'account_onboarding'
      });
      
      return {
        url: accountLink.url,
        expiresAt: new Date(accountLink.expires_at * 1000)
      };
    } catch (error) {
      console.error('Stripe createConnectAccountLink error:', error);
      throw error;
    }
  },
  
  /**
   * Get Connect account status
   * @param {string} accountId - Stripe Connect account ID
   * @returns {Object} Account status details
   */
  async getConnectAccountStatus(accountId) {
    try {
      const account = await stripe.accounts.retrieve(accountId);
      
      return {
        id: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirements: {
          currentlyDue: account.requirements?.currently_due || [],
          pastDue: account.requirements?.past_due || [],
          errors: account.requirements?.errors || []
        }
      };
    } catch (error) {
      console.error('Stripe getConnectAccountStatus error:', error);
      throw error;
    }
  },
  
  /**
   * Create a transfer to a Connect account (provider payout)
   * @param {Object} params - Transfer details
   * @returns {Object} Transfer object
   */
  async createTransfer({ amount, destinationAccountId, bookingId, description }) {
    try {
      const transfer = await stripe.transfers.create({
        amount: toCents(amount),
        currency: 'usd',
        destination: destinationAccountId,
        description,
        metadata: {
          platform: 'findr_health',
          bookingId: bookingId?.toString()
        }
      });
      
      console.log(`Created transfer: ${transfer.id}, amount: ${toDollars(transfer.amount)}`);
      
      return {
        id: transfer.id,
        amount: toDollars(transfer.amount),
        destination: transfer.destination
      };
    } catch (error) {
      console.error('Stripe createTransfer error:', error);
      throw error;
    }
  },
  
  // ==================== WEBHOOKS ====================
  
  /**
   * Verify webhook signature
   * @param {string} payload - Raw request body
   * @param {string} signature - Stripe signature header
   * @returns {Object} Verified event
   */
  verifyWebhookSignature(payload, signature) {
    try {
      return stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error('Stripe webhook verification error:', error);
      throw error;
    }
  }
};

module.exports = stripeService;
