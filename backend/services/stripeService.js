/**
 * Stripe Service
 * Handles payment authorization, capture, refunds, and cancellation fees
 */

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a customer in Stripe
 * @param {object} user - User object with email, name
 * @returns {object} Stripe customer
 */
const createCustomer = async (user) => {
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || user.firstName ? `${user.firstName} ${user.lastName}` : undefined,
    metadata: {
      userId: user._id?.toString() || user.id
    }
  });
  return customer;
};

/**
 * Get or create Stripe customer for user
 * @param {object} user - User object
 * @returns {string} Stripe customer ID
 */
const getOrCreateCustomer = async (user) => {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }
  
  const customer = await createCustomer(user);
  return customer.id;
};

/**
 * Create a SetupIntent to save a card for future use
 * @param {string} customerId - Stripe customer ID
 * @returns {object} SetupIntent with client_secret
 */
const createSetupIntent = async (customerId) => {
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
    usage: 'off_session'
  });
  
  return {
    clientSecret: setupIntent.client_secret,
    setupIntentId: setupIntent.id
  };
};

/**
 * Authorize (hold) payment for a booking
 * Does not capture - just holds the amount on the card
 * @param {object} params
 * @param {number} params.amount - Amount in dollars
 * @param {string} params.customerId - Stripe customer ID
 * @param {string} params.paymentMethodId - Stripe payment method ID
 * @param {object} params.metadata - Additional metadata
 * @returns {object} PaymentIntent
 */
const authorizePayment = async ({ amount, customerId, paymentMethodId, metadata = {} }) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    customer: customerId,
    payment_method: paymentMethodId,
    capture_method: 'manual', // Authorize only, don't capture
    confirm: true,
    off_session: true,
    metadata: {
      ...metadata,
      type: 'booking_authorization'
    }
  });
  
  return {
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status,
    amount: amount
  };
};

/**
 * Capture full authorized amount (service completed)
 * @param {string} paymentIntentId - Stripe PaymentIntent ID
 * @returns {object} Captured PaymentIntent
 */
const captureFullPayment = async (paymentIntentId) => {
  const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
  
  return {
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status,
    amountCaptured: paymentIntent.amount_received / 100
  };
};

/**
 * Capture partial amount (for cancellation fees)
 * @param {string} paymentIntentId - Stripe PaymentIntent ID
 * @param {number} amount - Amount to capture in dollars
 * @returns {object} Captured PaymentIntent
 */
const capturePartialPayment = async (paymentIntentId, amount) => {
  const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId, {
    amount_to_capture: Math.round(amount * 100) // Convert to cents
  });
  
  return {
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status,
    amountCaptured: paymentIntent.amount_received / 100,
    amountRefunded: (paymentIntent.amount - paymentIntent.amount_received) / 100
  };
};

/**
 * Cancel payment intent (full refund, no charge)
 * @param {string} paymentIntentId - Stripe PaymentIntent ID
 * @returns {object} Cancelled PaymentIntent
 */
const cancelPaymentIntent = async (paymentIntentId) => {
  const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
  
  return {
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status,
    cancelled: true
  };
};

/**
 * Process booking cancellation with appropriate fee
 * @param {object} params
 * @param {string} params.paymentIntentId - Stripe PaymentIntent ID
 * @param {number} params.totalAmount - Original booking amount
 * @param {number} params.feeAmount - Cancellation fee to charge
 * @param {string} params.cancelledBy - 'user' or 'provider'
 * @param {object} params.metadata - Additional metadata
 * @returns {object} Result with refund/charge details
 */
const processCancellation = async ({ paymentIntentId, totalAmount, feeAmount, cancelledBy, metadata = {} }) => {
  try {
    // Provider cancellation = always full refund
    if (cancelledBy === 'provider') {
      await cancelPaymentIntent(paymentIntentId);
      return {
        success: true,
        refundAmount: totalAmount,
        feeCharged: 0,
        action: 'full_refund'
      };
    }
    
    // No fee = cancel intent (full refund)
    if (feeAmount === 0) {
      await cancelPaymentIntent(paymentIntentId);
      return {
        success: true,
        refundAmount: totalAmount,
        feeCharged: 0,
        action: 'full_refund'
      };
    }
    
    // Full fee (no-show) = capture full amount
    if (feeAmount >= totalAmount) {
      const result = await captureFullPayment(paymentIntentId);
      return {
        success: true,
        refundAmount: 0,
        feeCharged: totalAmount,
        action: 'full_charge',
        chargeId: result.paymentIntentId
      };
    }
    
    // Partial fee = capture only the fee
    const result = await capturePartialPayment(paymentIntentId, feeAmount);
    return {
      success: true,
      refundAmount: totalAmount - feeAmount,
      feeCharged: feeAmount,
      action: 'partial_charge',
      chargeId: result.paymentIntentId
    };
    
  } catch (error) {
    console.error('Cancellation processing error:', error);
    throw error;
  }
};

/**
 * Issue refund for a captured payment (for fee waivers)
 * @param {string} paymentIntentId - Stripe PaymentIntent ID
 * @param {number} amount - Amount to refund in dollars (optional, full refund if not specified)
 * @param {string} reason - Reason for refund
 * @returns {object} Refund details
 */
const issueRefund = async (paymentIntentId, amount = null, reason = 'requested_by_customer') => {
  const refundParams = {
    payment_intent: paymentIntentId,
    reason
  };
  
  if (amount) {
    refundParams.amount = Math.round(amount * 100); // Convert to cents
  }
  
  const refund = await stripe.refunds.create(refundParams);
  
  return {
    refundId: refund.id,
    amount: refund.amount / 100,
    status: refund.status
  };
};

/**
 * Waive cancellation fee (refund the fee that was charged)
 * @param {object} params
 * @param {string} params.paymentIntentId - Original PaymentIntent ID
 * @param {number} params.feeAmount - Fee amount to refund
 * @param {string} params.waivedBy - Admin/provider ID who waived
 * @param {string} params.reason - Reason for waiver
 * @returns {object} Refund details
 */
const waiveCancellationFee = async ({ paymentIntentId, feeAmount, waivedBy, reason }) => {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: Math.round(feeAmount * 100),
    reason: 'requested_by_customer',
    metadata: {
      type: 'fee_waiver',
      waivedBy,
      waiverReason: reason
    }
  });
  
  return {
    refundId: refund.id,
    amount: refund.amount / 100,
    status: refund.status,
    waived: true
  };
};

/**
 * Get payment intent details
 * @param {string} paymentIntentId
 * @returns {object} PaymentIntent
 */
const getPaymentIntent = async (paymentIntentId) => {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
  return {
    id: paymentIntent.id,
    status: paymentIntent.status,
    amount: paymentIntent.amount / 100,
    amountReceived: paymentIntent.amount_received / 100,
    currency: paymentIntent.currency,
    metadata: paymentIntent.metadata
  };
};

/**
 * List customer's payment methods
 * @param {string} customerId
 * @returns {array} Payment methods
 */
const listPaymentMethods = async (customerId) => {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card'
  });
  
  return paymentMethods.data.map(pm => ({
    id: pm.id,
    brand: pm.card.brand,
    last4: pm.card.last4,
    expMonth: pm.card.exp_month,
    expYear: pm.card.exp_year
  }));
};

module.exports = {
  createCustomer,
  getOrCreateCustomer,
  createSetupIntent,
  authorizePayment,
  captureFullPayment,
  capturePartialPayment,
  cancelPaymentIntent,
  processCancellation,
  issueRefund,
  waiveCancellationFee,
  getPaymentIntent,
  listPaymentMethods
};
