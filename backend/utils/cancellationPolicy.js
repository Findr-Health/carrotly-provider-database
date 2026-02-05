/**
 * Findr Health Cancellation Policy Utility
 * Single Standard 24-Hour Policy for All Providers
 * 
 * Standard Policy:
 * - 24+ hours: 100% refund
 * - 12-24 hours: 75% refund (25% fee)
 * - <12 hours: 50% refund (50% fee)
 * - No-show: 100% fee (0% refund)
 */

const STANDARD_POLICY = {
  name: 'Standard 24-Hour Policy',
  description: 'Free cancellation up to 24 hours before appointment',
  tiers: [
    { hoursMin: 24, hoursMax: Infinity, feePercent: 0, refundPercent: 100, label: 'Full refund' },
    { hoursMin: 12, hoursMax: 24, feePercent: 25, refundPercent: 75, label: '75% refund (25% fee)' },
    { hoursMin: 0, hoursMax: 12, feePercent: 50, refundPercent: 50, label: '50% refund (50% fee)' }
  ],
  noShowFeePercent: 100,
  noShowRefundPercent: 0
};

/**
 * Calculate refund for cancellation
 * @param {Date} appointmentTime - Scheduled appointment time
 * @param {number} totalAmount - Booking amount in dollars
 * @param {Date} cancellationTime - When cancelled (default: now)
 * @returns {Object} Refund calculation
 */
function calculateRefund(appointmentTime, totalAmount, cancellationTime = new Date()) {
  const appointment = new Date(appointmentTime);
  const cancelled = new Date(cancellationTime);
  const msUntil = appointment - cancelled;
  const hoursUntil = msUntil / (1000 * 60 * 60);
  
  // No-show scenario (appointment time passed)
  if (hoursUntil <= 0) {
    return {
      hoursUntilAppointment: 0,
      refundPercentage: STANDARD_POLICY.noShowRefundPercent,
      refundAmount: round(totalAmount * (STANDARD_POLICY.noShowRefundPercent / 100)),
      feePercentage: STANDARD_POLICY.noShowFeePercent,
      feeAmount: round(totalAmount * (STANDARD_POLICY.noShowFeePercent / 100)),
      policyDescription: 'No-show - Full charge',
      isNoShow: true
    };
  }
  
  // Find applicable tier
  const tier = STANDARD_POLICY.tiers.find(t => 
    hoursUntil >= t.hoursMin && hoursUntil < t.hoursMax
  );
  
  if (!tier) {
    // Fallback (shouldn't happen)
    console.error('No tier found for hours:', hoursUntil);
    return {
      hoursUntilAppointment: hoursUntil,
      refundPercentage: 50,
      refundAmount: round(totalAmount * 0.5),
      feePercentage: 50,
      feeAmount: round(totalAmount * 0.5),
      policyDescription: '50% refund (fallback)',
      isNoShow: false
    };
  }
  
  const refundAmount = round(totalAmount * (tier.refundPercent / 100));
  const feeAmount = round(totalAmount * (tier.feePercent / 100));
  
  return {
    hoursUntilAppointment: round(hoursUntil, 1),
    refundPercentage: tier.refundPercent,
    refundAmount,
    feePercentage: tier.feePercent,
    feeAmount,
    policyDescription: tier.label,
    isNoShow: false
  };
}

/**
 * Get policy details for display
 * @returns {Object} Policy information
 */
function getPolicyDetails() {
  return {
    name: STANDARD_POLICY.name,
    summary: STANDARD_POLICY.description,
    tiers: [
      { hours: '24+', refund: '100%', description: 'Full refund' },
      { hours: '12-24', refund: '75%', description: '25% cancellation fee' },
      { hours: '<12', refund: '50%', description: '50% cancellation fee' },
      { hours: 'No-show', refund: '0%', description: 'Full charge' }
    ]
  };
}

/**
 * Round to decimal places
 */
function round(value, decimals = 2) {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

module.exports = {
  calculateRefund,
  getPolicyDetails,
  STANDARD_POLICY
};
