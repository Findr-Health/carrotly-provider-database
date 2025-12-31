/**
 * Cancellation Policy Utility Functions
 * Handles fee calculation and policy rules
 */

// Policy definitions
const POLICIES = {
  standard: {
    name: 'Standard',
    description: 'Free cancellation up to 24 hours before appointment',
    rules: [
      { hoursMin: 24, hoursMax: Infinity, feePercent: 0, label: '24+ hours: Free cancellation' },
      { hoursMin: 12, hoursMax: 24, feePercent: 25, label: '12-24 hours: 25% fee' },
      { hoursMin: 0, hoursMax: 12, feePercent: 50, label: 'Under 12 hours: 50% fee' },
      { hoursMin: -Infinity, hoursMax: 0, feePercent: 100, label: 'No-show: Full charge' }
    ],
    freeCancellationHours: 24
  },
  moderate: {
    name: 'Moderate',
    description: 'Free cancellation up to 48 hours before appointment',
    rules: [
      { hoursMin: 48, hoursMax: Infinity, feePercent: 0, label: '48+ hours: Free cancellation' },
      { hoursMin: 24, hoursMax: 48, feePercent: 25, label: '24-48 hours: 25% fee' },
      { hoursMin: 0, hoursMax: 24, feePercent: 50, label: 'Under 24 hours: 50% fee' },
      { hoursMin: -Infinity, hoursMax: 0, feePercent: 100, label: 'No-show: Full charge' }
    ],
    freeCancellationHours: 48
  }
};

/**
 * Get policy details
 * @param {string} tier - 'standard' or 'moderate'
 * @returns {object} Policy details
 */
const getPolicy = (tier = 'standard') => {
  return POLICIES[tier] || POLICIES.standard;
};

/**
 * Calculate hours until appointment
 * @param {Date} appointmentDate
 * @returns {number} Hours until appointment (negative if past)
 */
const hoursUntilAppointment = (appointmentDate) => {
  const now = new Date();
  const appointment = new Date(appointmentDate);
  return (appointment - now) / (1000 * 60 * 60);
};

/**
 * Calculate cancellation fee
 * @param {object} params
 * @param {Date} params.appointmentDate - Appointment date/time
 * @param {number} params.amount - Booking amount in dollars
 * @param {string} params.policyTier - 'standard' or 'moderate'
 * @param {boolean} params.isNoShow - Is this a no-show?
 * @returns {object} Fee calculation result
 */
const calculateCancellationFee = ({ appointmentDate, amount, policyTier = 'standard', isNoShow = false }) => {
  const policy = getPolicy(policyTier);
  const hoursUntil = isNoShow ? -1 : hoursUntilAppointment(appointmentDate);
  
  // Find applicable rule
  let applicableRule = policy.rules[policy.rules.length - 1]; // Default to last rule (no-show)
  
  for (const rule of policy.rules) {
    if (hoursUntil >= rule.hoursMin && hoursUntil < rule.hoursMax) {
      applicableRule = rule;
      break;
    }
  }
  
  const feePercent = applicableRule.feePercent;
  const feeAmount = Math.round(amount * (feePercent / 100) * 100) / 100; // Round to cents
  const refundAmount = Math.round((amount - feeAmount) * 100) / 100;
  
  // Calculate free cancellation deadline
  const appointmentTime = new Date(appointmentDate);
  const freeCancellationDeadline = new Date(
    appointmentTime.getTime() - (policy.freeCancellationHours * 60 * 60 * 1000)
  );
  
  return {
    policyTier,
    policyName: policy.name,
    hoursUntilAppointment: Math.max(0, Math.round(hoursUntil * 10) / 10),
    feePercent,
    feeAmount,
    refundAmount,
    totalAmount: amount,
    ruleApplied: applicableRule.label,
    freeCancellationDeadline,
    isFreeCancellation: feePercent === 0,
    isNoShow: hoursUntil < 0 || isNoShow
  };
};

/**
 * Get user-friendly policy summary for display
 * @param {string} tier - Policy tier
 * @param {number} amount - Booking amount
 * @returns {object} Display-ready policy info
 */
const getPolicySummary = (tier = 'standard', amount = 0) => {
  const policy = getPolicy(tier);
  
  return {
    name: policy.name,
    description: policy.description,
    freeCancellationHours: policy.freeCancellationHours,
    rules: policy.rules.map(rule => ({
      label: rule.label,
      feePercent: rule.feePercent,
      feeAmount: amount > 0 ? Math.round(amount * (rule.feePercent / 100) * 100) / 100 : null
    })).filter(r => r.feePercent < 100) // Don't show no-show in summary
  };
};

/**
 * Check if cancellation is free
 * @param {Date} appointmentDate
 * @param {string} policyTier
 * @returns {boolean}
 */
const isFreeCancellation = (appointmentDate, policyTier = 'standard') => {
  const policy = getPolicy(policyTier);
  const hoursUntil = hoursUntilAppointment(appointmentDate);
  return hoursUntil >= policy.freeCancellationHours;
};

/**
 * Get time remaining for free cancellation
 * @param {Date} appointmentDate
 * @param {string} policyTier
 * @returns {object} Time remaining info
 */
const getFreeCancellationTimeRemaining = (appointmentDate, policyTier = 'standard') => {
  const policy = getPolicy(policyTier);
  const appointmentTime = new Date(appointmentDate);
  const deadline = new Date(
    appointmentTime.getTime() - (policy.freeCancellationHours * 60 * 60 * 1000)
  );
  
  const now = new Date();
  const msRemaining = deadline - now;
  
  if (msRemaining <= 0) {
    return {
      expired: true,
      deadline,
      hoursRemaining: 0,
      minutesRemaining: 0
    };
  }
  
  const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    expired: false,
    deadline,
    hoursRemaining,
    minutesRemaining,
    displayText: hoursRemaining > 0 
      ? `${hoursRemaining}h ${minutesRemaining}m remaining`
      : `${minutesRemaining} minutes remaining`
  };
};

module.exports = {
  POLICIES,
  getPolicy,
  calculateCancellationFee,
  getPolicySummary,
  isFreeCancellation,
  getFreeCancellationTimeRemaining,
  hoursUntilAppointment
};
