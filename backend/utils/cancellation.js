/**
 * Findr Health Cancellation Policy Utility
 * 
 * Two tiers:
 * - Standard (default): 24h free, 12-24h = 25%, <12h = 50%, no-show = 100%
 * - Moderate: 48h free, 24-48h = 25%, <24h = 50%, no-show = 100%
 * 
 * Rules:
 * - Provider cancels = Always full refund to user
 * - Provider can waive fees
 * - System auto-cancels expired requests (48h no response)
 */

const CANCELLATION_POLICIES = {
  standard: {
    name: 'Standard',
    description: 'Free cancellation up to 24 hours before',
    tiers: [
      { hoursMin: 24, hoursMax: Infinity, feePercent: 0, label: 'Free cancellation' },
      { hoursMin: 12, hoursMax: 24, feePercent: 25, label: '25% cancellation fee' },
      { hoursMin: 0, hoursMax: 12, feePercent: 50, label: '50% cancellation fee' }
    ],
    noShowPercent: 100,
    details: [
      'Cancel 24+ hours before: Full refund',
      'Cancel 12-24 hours before: 25% fee',
      'Cancel less than 12 hours: 50% fee',
      'No-show: 100% charge'
    ]
  },
  moderate: {
    name: 'Moderate',
    description: 'Free cancellation up to 48 hours before',
    tiers: [
      { hoursMin: 48, hoursMax: Infinity, feePercent: 0, label: 'Free cancellation' },
      { hoursMin: 24, hoursMax: 48, feePercent: 25, label: '25% cancellation fee' },
      { hoursMin: 0, hoursMax: 24, feePercent: 50, label: '50% cancellation fee' }
    ],
    noShowPercent: 100,
    details: [
      'Cancel 48+ hours before: Full refund',
      'Cancel 24-48 hours before: 25% fee',
      'Cancel less than 24 hours: 50% fee',
      'No-show: 100% charge'
    ]
  }
};

/**
 * Calculate cancellation fee
 * @param {Date} appointmentDate - The appointment date/time
 * @param {number} totalAmount - The booking total in dollars
 * @param {string} policyTier - 'standard' or 'moderate'
 * @returns {Object} Fee calculation result
 */
function calculateCancellationFee(appointmentDate, totalAmount, policyTier = 'standard') {
  const now = new Date();
  const appointment = new Date(appointmentDate);
  const msUntil = appointment - now;
  const hoursUntil = msUntil / (1000 * 60 * 60);
  
  const policy = CANCELLATION_POLICIES[policyTier] || CANCELLATION_POLICIES.standard;
  
  // If appointment is in the past, it's a no-show scenario
  if (hoursUntil <= 0) {
    return {
      hoursBeforeAppointment: 0,
      feePercent: policy.noShowPercent,
      feeAmount: totalAmount,
      refundAmount: 0,
      label: 'No-show - Full charge',
      isFree: false,
      isNoShow: true,
      policyTier
    };
  }
  
  // Find applicable tier
  const tier = policy.tiers.find(t => 
    hoursUntil >= t.hoursMin && hoursUntil < t.hoursMax
  );
  
  if (!tier) {
    // Fallback to highest fee if something goes wrong
    return {
      hoursBeforeAppointment: hoursUntil,
      feePercent: 50,
      feeAmount: Math.round(totalAmount * 0.5 * 100) / 100,
      refundAmount: Math.round(totalAmount * 0.5 * 100) / 100,
      label: '50% cancellation fee',
      isFree: false,
      isNoShow: false,
      policyTier
    };
  }
  
  const feeAmount = Math.round(totalAmount * (tier.feePercent / 100) * 100) / 100;
  const refundAmount = Math.round((totalAmount - feeAmount) * 100) / 100;
  
  return {
    hoursBeforeAppointment: Math.round(hoursUntil * 10) / 10,
    feePercent: tier.feePercent,
    feeAmount,
    refundAmount,
    label: tier.label,
    isFree: tier.feePercent === 0,
    isNoShow: false,
    policyTier
  };
}

/**
 * Get human-readable time until appointment
 * @param {Date} appointmentDate - The appointment date/time
 * @returns {string} Human-readable time string
 */
function getTimeUntilAppointment(appointmentDate) {
  const now = new Date();
  const appointment = new Date(appointmentDate);
  const msUntil = appointment - now;
  
  if (msUntil <= 0) {
    return 'Appointment has passed';
  }
  
  const hours = Math.floor(msUntil / (1000 * 60 * 60));
  const minutes = Math.floor((msUntil % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours >= 48) {
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} away`;
  } else if (hours >= 1) {
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes > 0 ? `${minutes} min` : ''} away`;
  } else {
    return `${minutes} minutes away`;
  }
}

/**
 * Get cancellation policy text for display
 * @param {string} policyTier - 'standard' or 'moderate'
 * @returns {Object} Policy text and details
 */
function getCancellationPolicyText(policyTier = 'standard') {
  const policy = CANCELLATION_POLICIES[policyTier] || CANCELLATION_POLICIES.standard;
  
  return {
    name: policy.name,
    summary: policy.description,
    details: policy.details
  };
}

/**
 * Check if cancellation is free at current time
 * @param {Date} appointmentDate - The appointment date/time
 * @param {string} policyTier - 'standard' or 'moderate'
 * @returns {boolean} True if cancellation would be free
 */
function isCancellationFree(appointmentDate, policyTier = 'standard') {
  const fee = calculateCancellationFee(appointmentDate, 100, policyTier);
  return fee.isFree;
}

/**
 * Get the free cancellation deadline
 * @param {Date} appointmentDate - The appointment date/time
 * @param {string} policyTier - 'standard' or 'moderate'
 * @returns {Date} Deadline for free cancellation
 */
function getFreeCancellationDeadline(appointmentDate, policyTier = 'standard') {
  const policy = CANCELLATION_POLICIES[policyTier] || CANCELLATION_POLICIES.standard;
  const freeTier = policy.tiers.find(t => t.feePercent === 0);
  
  if (!freeTier) return null;
  
  const appointment = new Date(appointmentDate);
  const deadline = new Date(appointment.getTime() - (freeTier.hoursMin * 60 * 60 * 1000));
  
  return deadline;
}

/**
 * Format deadline for display
 * @param {Date} deadline - The deadline date
 * @returns {string} Formatted deadline string
 */
function formatDeadline(deadline) {
  const options = { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric', 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true
  };
  return new Date(deadline).toLocaleDateString('en-US', options);
}

/**
 * Generate cancellation quote for user display
 * @param {Date} appointmentDate - The appointment date/time
 * @param {number} totalAmount - The booking total
 * @param {string} policyTier - 'standard' or 'moderate'
 * @returns {Object} Quote for display
 */
function getCancellationQuote(appointmentDate, totalAmount, policyTier = 'standard') {
  const fee = calculateCancellationFee(appointmentDate, totalAmount, policyTier);
  const timeUntil = getTimeUntilAppointment(appointmentDate);
  const deadline = getFreeCancellationDeadline(appointmentDate, policyTier);
  
  return {
    ...fee,
    timeUntilAppointment: timeUntil,
    appointmentDate: new Date(appointmentDate).toISOString(),
    freeCancellationDeadline: deadline ? formatDeadline(deadline) : null,
    isPastDeadline: !fee.isFree,
    
    // For display
    display: {
      feeAmount: fee.feeAmount > 0 ? `$${fee.feeAmount.toFixed(2)}` : 'Free',
      refundAmount: `$${fee.refundAmount.toFixed(2)}`,
      message: fee.isFree 
        ? 'You can cancel for free!' 
        : `A ${fee.feePercent}% cancellation fee ($${fee.feeAmount.toFixed(2)}) will apply.`
    }
  };
}

// Booking request timeout settings
const REQUEST_TIMEOUTS = {
  reminderAfterHours: 24,      // Send reminder after 24h
  expireAfterHours: 48,        // Auto-cancel after 48h
  counterOfferValidHours: 24   // Counter offer valid for 24h
};

/**
 * Check if a booking request has expired
 * @param {Date} requestedAt - When the request was made
 * @returns {boolean} True if expired
 */
function isRequestExpired(requestedAt) {
  const now = new Date();
  const requested = new Date(requestedAt);
  const hoursSince = (now - requested) / (1000 * 60 * 60);
  
  return hoursSince >= REQUEST_TIMEOUTS.expireAfterHours;
}

/**
 * Check if reminder should be sent
 * @param {Date} requestedAt - When the request was made
 * @param {Date} reminderSentAt - When reminder was sent (null if not sent)
 * @returns {boolean} True if reminder should be sent
 */
function shouldSendReminder(requestedAt, reminderSentAt) {
  if (reminderSentAt) return false;
  
  const now = new Date();
  const requested = new Date(requestedAt);
  const hoursSince = (now - requested) / (1000 * 60 * 60);
  
  return hoursSince >= REQUEST_TIMEOUTS.reminderAfterHours && 
         hoursSince < REQUEST_TIMEOUTS.expireAfterHours;
}

/**
 * Get request expiration date
 * @param {Date} requestedAt - When the request was made
 * @returns {Date} Expiration date
 */
function getRequestExpirationDate(requestedAt) {
  const requested = new Date(requestedAt);
  return new Date(requested.getTime() + (REQUEST_TIMEOUTS.expireAfterHours * 60 * 60 * 1000));
}

module.exports = {
  calculateCancellationFee,
  getTimeUntilAppointment,
  getCancellationPolicyText,
  isCancellationFree,
  getFreeCancellationDeadline,
  getCancellationQuote,
  isRequestExpired,
  shouldSendReminder,
  getRequestExpirationDate,
  CANCELLATION_POLICIES,
  REQUEST_TIMEOUTS
};
