// backend/utils/platformFee.js
// Platform fee calculation: 10% + $1.50 (capped at $35)

/**
 * Calculate platform fee for a booking
 * Formula: MIN((amount * 10%) + $1.50, $35)
 * 
 * @param {Number} amount - Service amount in dollars
 * @returns {Number} Platform fee in dollars
 */
function calculatePlatformFee(amount) {
  if (typeof amount !== 'number' || amount < 0) {
    throw new Error('Amount must be a positive number');
  }
  
  const FEE_PERCENT = 0.10; // 10%
  const FEE_FLAT = 1.50;    // $1.50
  const FEE_CAP = 35.00;    // $35 maximum
  
  const calculatedFee = (amount * FEE_PERCENT) + FEE_FLAT;
  const finalFee = Math.min(calculatedFee, FEE_CAP);
  
  // Round to 2 decimal places
  return Math.round(finalFee * 100) / 100;
}

/**
 * Calculate provider payout (amount - platform fee)
 * 
 * @param {Number} amount - Service amount in dollars
 * @returns {Object} {platformFee, providerPayout}
 */
function calculateProviderPayout(amount) {
  const platformFee = calculatePlatformFee(amount);
  const providerPayout = amount - platformFee;
  
  return {
    platformFee: Math.round(platformFee * 100) / 100,
    providerPayout: Math.round(providerPayout * 100) / 100
  };
}

/**
 * Get effective fee rate (for display purposes)
 * 
 * @param {Number} amount - Service amount in dollars
 * @returns {String} Effective rate as percentage (e.g., "11.5%")
 */
function getEffectiveFeeRate(amount) {
  const fee = calculatePlatformFee(amount);
  const rate = (fee / amount) * 100;
  
  return `${rate.toFixed(1)}%`;
}

/**
 * Generate fee breakdown for customer display
 * 
 * @param {Number} amount - Service amount in dollars
 * @returns {Object} Fee breakdown
 */
function generateFeeBreakdown(amount) {
  const platformFee = calculatePlatformFee(amount);
  const providerPayout = amount - platformFee;
  const depositAmount = amount * 0.80;
  const finalAmount = amount * 0.20;
  
  return {
    serviceAmount: amount,
    depositAmount: Math.round(depositAmount * 100) / 100,
    finalAmount: Math.round(finalAmount * 100) / 100,
    platformFee: Math.round(platformFee * 100) / 100,
    providerReceives: Math.round(providerPayout * 100) / 100,
    effectiveRate: getEffectiveFeeRate(amount)
  };
}

module.exports = {
  calculatePlatformFee,
  calculateProviderPayout,
  getEffectiveFeeRate,
  generateFeeBreakdown
};
