/**
 * BookingStateMachine Service
 * Findr Health Calendar-Optional Booking Flow
 * Created: January 15, 2026
 * 
 * Purpose: Enforce valid state transitions for bookings.
 * Prevents invalid status changes and maintains data integrity.
 */

// ==================== VALID TRANSITIONS ====================
const VALID_TRANSITIONS = {
  // Initial states
  'slot_reserved': [
    'pending_payment',
    'cancelled_patient'  // User abandons checkout
  ],
  
  'pending_payment': [
    'confirmed',            // Instant book with successful payment
    'pending_confirmation', // Request book with successful payment hold
    'payment_failed',       // Payment failed
    'cancelled_patient'     // User cancels
  ],
  
  // Request flow states
  'pending_confirmation': [
    'confirmed',            // Provider confirmed
    'expired',              // Provider didn't respond in time
    'reschedule_proposed',  // Provider proposed different time
    'cancelled_patient',    // Patient cancelled
    'cancelled_provider'    // Provider declined
  ],
  
  'reschedule_proposed': [
    'confirmed',            // Patient accepted reschedule
    'cancelled_patient',    // Patient declined reschedule
    'expired'               // Patient didn't respond
  ],
  
  // Confirmed states
  'confirmed': [
    'checked_in',           // Patient arrived
    'cancelled_patient',    // Patient cancelled (may incur fee)
    'cancelled_provider',   // Provider cancelled
    'no_show'               // Patient didn't show up
  ],
  
  // Active states
  'checked_in': [
    'in_progress',          // Service started
    'no_show'               // Patient left before service
  ],
  
  'in_progress': [
    'completed',            // Service finished
    'no_show'               // Patient left during service (rare)
  ],
  
  // Payment recovery
  'payment_failed': [
    'pending_payment',      // Retry payment
    'cancelled_patient'     // Give up
  ],
  
  // Terminal states - no further transitions allowed
  'completed': [],
  'cancelled_patient': [],
  'cancelled_provider': [],
  'cancelled_admin': [],
  'expired': [],
  'no_show': []
};

// ==================== STATUS METADATA ====================
const STATUS_METADATA = {
  'slot_reserved': {
    displayName: 'Slot Reserved',
    color: '#F3F4F6',       // gray-100
    textColor: '#6B7280',   // gray-500
    icon: '🔒',
    isTerminal: false,
    requiresAction: false
  },
  'pending_payment': {
    displayName: 'Pending Payment',
    color: '#FEF3C7',       // amber-100
    textColor: '#92400E',   // amber-800
    icon: '💳',
    isTerminal: false,
    requiresAction: true,
    actionRequired: 'patient'
  },
  'pending_confirmation': {
    displayName: 'Awaiting Confirmation',
    color: '#FEF3C7',       // amber-100
    textColor: '#92400E',   // amber-800
    icon: '⏳',
    isTerminal: false,
    requiresAction: true,
    actionRequired: 'provider'
  },
  'reschedule_proposed': {
    displayName: 'Reschedule Proposed',
    color: '#DBEAFE',       // blue-100
    textColor: '#1E40AF',   // blue-800
    icon: '📅',
    isTerminal: false,
    requiresAction: true,
    actionRequired: 'patient'
  },
  'confirmed': {
    displayName: 'Confirmed',
    color: '#D1FAE5',       // green-100
    textColor: '#065F46',   // green-800
    icon: '✓',
    isTerminal: false,
    requiresAction: false
  },
  'checked_in': {
    displayName: 'Checked In',
    color: '#CFFAFE',       // cyan-100
    textColor: '#0E7490',   // cyan-700
    icon: '📍',
    isTerminal: false,
    requiresAction: false
  },
  'in_progress': {
    displayName: 'In Progress',
    color: '#C7D2FE',       // indigo-100
    textColor: '#3730A3',   // indigo-800
    icon: '🔄',
    isTerminal: false,
    requiresAction: false
  },
  'completed': {
    displayName: 'Completed',
    color: '#D1FAE5',       // green-100
    textColor: '#065F46',   // green-800
    icon: '✅',
    isTerminal: true,
    requiresAction: false
  },
  'cancelled_patient': {
    displayName: 'Cancelled by Patient',
    color: '#F3F4F6',       // gray-100
    textColor: '#6B7280',   // gray-500
    icon: '🚫',
    isTerminal: true,
    requiresAction: false
  },
  'cancelled_provider': {
    displayName: 'Cancelled by Provider',
    color: '#F3F4F6',       // gray-100
    textColor: '#6B7280',   // gray-500
    icon: '🚫',
    isTerminal: true,
    requiresAction: false
  },
  'cancelled_admin': {
    displayName: 'Cancelled by Admin',
    color: '#F3F4F6',       // gray-100
    textColor: '#6B7280',   // gray-500
    icon: '🛡️',
    isTerminal: true,
    requiresAction: false
  },
  'expired': {
    displayName: 'Expired',
    color: '#FEE2E2',       // red-100
    textColor: '#991B1B',   // red-800
    icon: '⏰',
    isTerminal: true,
    requiresAction: false
  },
  'no_show': {
    displayName: 'No Show',
    color: '#FEE2E2',       // red-100
    textColor: '#991B1B',   // red-800
    icon: '❌',
    isTerminal: true,
    requiresAction: false
  },
  'payment_failed': {
    displayName: 'Payment Failed',
    color: '#FEE2E2',       // red-100
    textColor: '#991B1B',   // red-800
    icon: '💳❌',
    isTerminal: false,
    requiresAction: true,
    actionRequired: 'patient'
  }
};

class BookingStateMachine {
  
  /**
   * Check if a transition is valid
   * @param {string} currentStatus - Current booking status
   * @param {string} newStatus - Proposed new status
   * @param {boolean} isAdmin - Admin override allowed
   * @returns {boolean}
   */
  canTransition(currentStatus, newStatus, isAdmin = false) {
    // Admins can force any transition
    if (isAdmin) {
      return true;
    }
    
    // Check if current status exists
    const allowedTransitions = VALID_TRANSITIONS[currentStatus];
    if (!allowedTransitions) {
      console.error(`[StateMachine] Unknown status: ${currentStatus}`);
      return false;
    }
    
    // Check if new status is in allowed list
    return allowedTransitions.includes(newStatus);
  }
  
  /**
   * Get all valid next statuses for a booking
   * @param {string} currentStatus - Current booking status
   * @returns {string[]}
   */
  getValidTransitions(currentStatus) {
    return VALID_TRANSITIONS[currentStatus] || [];
  }
  
  /**
   * Check if a status is terminal (no further changes)
   * @param {string} status - Status to check
   * @returns {boolean}
   */
  isTerminal(status) {
    return STATUS_METADATA[status]?.isTerminal || false;
  }
  
  /**
   * Check if a status requires action
   * @param {string} status - Status to check
   * @returns {object|null} - Action details or null
   */
  getRequiredAction(status) {
    const meta = STATUS_METADATA[status];
    if (!meta?.requiresAction) return null;
    
    return {
      requiredBy: meta.actionRequired,
      status,
      displayName: meta.displayName
    };
  }
  
  /**
   * Get metadata for a status
   * @param {string} status - Status to look up
   * @returns {object}
   */
  getStatusMetadata(status) {
    return STATUS_METADATA[status] || {
      displayName: status,
      color: '#F3F4F6',
      textColor: '#6B7280',
      icon: '❓',
      isTerminal: false,
      requiresAction: false
    };
  }
  
  /**
   * Validate a transition and return detailed result
   * @param {string} currentStatus
   * @param {string} newStatus
   * @param {boolean} isAdmin
   * @returns {object}
   */
  validateTransition(currentStatus, newStatus, isAdmin = false) {
    const canTransition = this.canTransition(currentStatus, newStatus, isAdmin);
    
    return {
      valid: canTransition,
      currentStatus,
      newStatus,
      isAdminOverride: isAdmin && !VALID_TRANSITIONS[currentStatus]?.includes(newStatus),
      currentMeta: this.getStatusMetadata(currentStatus),
      newMeta: this.getStatusMetadata(newStatus),
      validTransitions: this.getValidTransitions(currentStatus),
      error: canTransition ? null : `Invalid transition from '${currentStatus}' to '${newStatus}'`
    };
  }
  
  /**
   * Get all statuses that require provider action
   * @returns {string[]}
   */
  getProviderActionStatuses() {
    return Object.entries(STATUS_METADATA)
      .filter(([_, meta]) => meta.actionRequired === 'provider')
      .map(([status]) => status);
  }
  
  /**
   * Get all statuses that require patient action
   * @returns {string[]}
   */
  getPatientActionStatuses() {
    return Object.entries(STATUS_METADATA)
      .filter(([_, meta]) => meta.actionRequired === 'patient')
      .map(([status]) => status);
  }
  
  /**
   * Get all terminal statuses
   * @returns {string[]}
   */
  getTerminalStatuses() {
    return Object.entries(STATUS_METADATA)
      .filter(([_, meta]) => meta.isTerminal)
      .map(([status]) => status);
  }
  
  /**
   * Get all active (non-terminal) statuses
   * @returns {string[]}
   */
  getActiveStatuses() {
    return Object.entries(STATUS_METADATA)
      .filter(([_, meta]) => !meta.isTerminal)
      .map(([status]) => status);
  }
  
  /**
   * Format status for display
   * @param {string} status
   * @returns {object}
   */
  formatForDisplay(status) {
    const meta = this.getStatusMetadata(status);
    return {
      status,
      label: meta.displayName,
      icon: meta.icon,
      backgroundColor: meta.color,
      textColor: meta.textColor
    };
  }
  
  /**
   * Get all statuses with metadata
   * @returns {object}
   */
  getAllStatuses() {
    return STATUS_METADATA;
  }
}

// Export singleton instance
const stateMachine = new BookingStateMachine();
module.exports = stateMachine;

// Also export constants for direct access
module.exports.VALID_TRANSITIONS = VALID_TRANSITIONS;
module.exports.STATUS_METADATA = STATUS_METADATA;
