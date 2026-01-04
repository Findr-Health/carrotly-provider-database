/**
 * Findr Health Fee Calculation Utility
 * 
 * Fee Formula: MIN( (Service Price × 10%) + $1.50, $35.00 )
 * 
 * - Platform Fee: 10% + $1.50 fixed, capped at $35
 * - Stripe Fee: ~2.9% + $0.30 (passed through to provider)
 * - User pays: Service price only (no added fees)
 * - Provider receives: Service price - Platform fee - Stripe fee
 */

const FEE_CONFIG = {
  // Platform fee
  percentageRate: 0.10,    // 10%
  fixedFee: 1.50,          // $1.50
  maxPlatformFee: 35.00,   // $35 cap
  
  // Stripe fee (approximate)
  stripePercentage: 0.029, // 2.9%
  stripeFixed: 0.30,       // $0.30
  maxStripeFee: 35.00      // $35 cap (for Stripe Connect)
};

/**
 * Calculate all fees for a booking
 * @param {number} servicePrice - The service price in dollars
 * @returns {Object} Fee breakdown
 */
function calculateFees(servicePrice) {
  if (servicePrice <= 0) {
    throw new Error('Service price must be greater than 0');
  }
  
  // Platform fee: MIN( (price × 10%) + $1.50, $35.00 )
  const rawPlatformFee = (servicePrice * FEE_CONFIG.percentageRate) + FEE_CONFIG.fixedFee;
  const platformFee = Math.min(rawPlatformFee, FEE_CONFIG.maxPlatformFee);
  
  // Stripe fee: ~2.9% + $0.30 (capped at $35)
  const rawStripeFee = (servicePrice * FEE_CONFIG.stripePercentage) + FEE_CONFIG.stripeFixed;
  const stripeFee = Math.min(rawStripeFee, FEE_CONFIG.maxStripeFee);
  
  // Total fees deducted from provider payout
  const totalFees = platformFee + stripeFee;
  
  // Provider receives
  const providerPayout = servicePrice - totalFees;
  
  // Provider percentage (what they keep)
  const providerPercentage = (providerPayout / servicePrice) * 100;
  
  return {
    servicePrice: round(servicePrice),
    platformFee: round(platformFee),
    stripeFee: round(stripeFee),
    totalFees: round(totalFees),
    providerPayout: round(providerPayout),
    providerPercentage: round(providerPercentage, 1),
    
    // User pays service price only
    userTotal: round(servicePrice),
    
    // For display
    breakdown: {
      servicePrice: formatCurrency(servicePrice),
      platformFee: formatCurrency(platformFee),
      stripeFee: formatCurrency(stripeFee),
      providerPayout: formatCurrency(providerPayout)
    }
  };
}

/**
 * Calculate platform fee only (without Stripe)
 * @param {number} servicePrice - The service price in dollars
 * @returns {number} Platform fee in dollars
 */
function calculatePlatformFee(servicePrice) {
  if (servicePrice <= 0) return 0;
  
  const rawFee = (servicePrice * FEE_CONFIG.percentageRate) + FEE_CONFIG.fixedFee;
  return round(Math.min(rawFee, FEE_CONFIG.maxPlatformFee));
}

/**
 * Calculate estimated Stripe fee
 * @param {number} amount - The charge amount in dollars
 * @returns {number} Estimated Stripe fee in dollars
 */
function calculateStripeFee(amount) {
  if (amount <= 0) return 0;
  
  const rawFee = (amount * FEE_CONFIG.stripePercentage) + FEE_CONFIG.stripeFixed;
  return round(Math.min(rawFee, FEE_CONFIG.maxStripeFee));
}

/**
 * Calculate provider payout after all fees
 * @param {number} servicePrice - The service price in dollars
 * @returns {number} Provider payout in dollars
 */
function calculateProviderPayout(servicePrice) {
  const fees = calculateFees(servicePrice);
  return fees.providerPayout;
}

/**
 * Generate fee breakdown for display in provider dashboard
 * @param {number} servicePrice - The service price in dollars
 * @returns {Object} Formatted fee breakdown
 */
function getFeeBreakdownForDisplay(servicePrice) {
  const fees = calculateFees(servicePrice);
  
  return {
    lines: [
      { label: 'Service Revenue', amount: fees.breakdown.servicePrice, type: 'revenue' },
      { label: 'Platform Fee (10% + $1.50)', amount: `-${fees.breakdown.platformFee}`, type: 'fee' },
      { label: 'Payment Processing', amount: `-${fees.breakdown.stripeFee}`, type: 'fee' },
      { label: 'Your Payout', amount: fees.breakdown.providerPayout, type: 'payout', bold: true }
    ],
    summary: {
      revenue: fees.breakdown.servicePrice,
      fees: formatCurrency(fees.totalFees),
      payout: fees.breakdown.providerPayout,
      keepPercentage: `${fees.providerPercentage}%`
    }
  };
}

/**
 * Validate service price is within acceptable range
 * @param {number} price - The service price
 * @returns {Object} Validation result
 */
function validateServicePrice(price) {
  const MIN_PRICE = 5;    // $5 minimum
  const MAX_PRICE = 50000; // $50,000 maximum
  
  if (typeof price !== 'number' || isNaN(price)) {
    return { valid: false, error: 'Price must be a number' };
  }
  
  if (price < MIN_PRICE) {
    return { valid: false, error: `Minimum service price is $${MIN_PRICE}` };
  }
  
  if (price > MAX_PRICE) {
    return { valid: false, error: `Maximum service price is $${MAX_PRICE.toLocaleString()}` };
  }
  
  return { valid: true };
}

/**
 * Round to specified decimal places
 */
function round(value, decimals = 2) {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Format as currency string
 */
function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

/**
 * Convert dollars to cents for Stripe
 */
function toCents(dollars) {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars
 */
function toDollars(cents) {
  return cents / 100;
}

module.exports = {
  calculateFees,
  calculatePlatformFee,
  calculateStripeFee,
  calculateProviderPayout,
  getFeeBreakdownForDisplay,
  validateServicePrice,
  toCents,
  toDollars,
  FEE_CONFIG
};
