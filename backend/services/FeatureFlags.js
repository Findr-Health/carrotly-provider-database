/**
 * FeatureFlags Service
 * Findr Health Calendar-Optional Booking Flow
 * Created: January 15, 2026
 * 
 * Purpose: Control feature rollout, enable kill switches,
 * and allow gradual percentage-based deployments.
 */

// ==================== FLAG DEFINITIONS ====================
const FLAGS = {
  // ========== BOOKING MODE FLAGS ==========
  'booking.request_mode_enabled': {
    default: true,
    description: 'Enable request booking mode for providers without calendars',
    category: 'booking'
  },
  'booking.instant_mode_enabled': {
    default: true,
    description: 'Enable instant booking for providers with calendars',
    category: 'booking'
  },
  'booking.slot_reservation_enabled': {
    default: true,
    description: 'Enable slot reservation during checkout',
    category: 'booking'
  },
  
  // ========== PAYMENT FLAGS ==========
  'payment.holds_enabled': {
    default: true,
    description: 'Use payment holds for request bookings',
    category: 'payment'
  },
  'payment.auto_capture_on_confirm': {
    default: true,
    description: 'Automatically capture payment when provider confirms',
    category: 'payment'
  },
  
  // ========== NOTIFICATION FLAGS ==========
  'notification.expiration_warnings_enabled': {
    default: true,
    description: 'Send expiration warning notifications',
    category: 'notification'
  },
  'notification.sms_enabled': {
    default: false,
    description: 'Enable SMS notifications (requires Twilio)',
    category: 'notification'
  },
  
  // ========== ROLLOUT FLAGS ==========
  'rollout.request_mode_percentage': {
    default: 100,
    description: 'Percentage of providers to enable request mode',
    category: 'rollout',
    type: 'percentage'
  },
  'rollout.new_booking_flow_percentage': {
    default: 100,
    description: 'Percentage of bookings to use new flow',
    category: 'rollout',
    type: 'percentage'
  },
  
  // ========== KILL SWITCHES ==========
  'kill.all_bookings': {
    default: false,
    description: 'EMERGENCY: Disable all new bookings',
    category: 'kill',
    severity: 'critical'
  },
  'kill.payment_captures': {
    default: false,
    description: 'EMERGENCY: Stop all payment captures',
    category: 'kill',
    severity: 'critical'
  },
  'kill.calendar_sync': {
    default: false,
    description: 'EMERGENCY: Disable calendar sync',
    category: 'kill',
    severity: 'high'
  },
  'kill.notifications': {
    default: false,
    description: 'EMERGENCY: Disable all notifications',
    category: 'kill',
    severity: 'high'
  },
  
  // ========== EXPERIMENT FLAGS ==========
  'experiment.auto_confirm_enabled': {
    default: false,
    description: 'Allow providers to enable auto-confirm',
    category: 'experiment'
  },
  'experiment.realtime_updates': {
    default: true,
    description: 'Enable WebSocket real-time updates',
    category: 'experiment'
  }
};

// ==================== IN-MEMORY OVERRIDES ====================
// These can be set at runtime and take precedence over defaults
const runtimeOverrides = new Map();

// Provider-specific overrides (stored in DB, cached here)
const providerOverrides = new Map();

class FeatureFlags {
  
  /**
   * Check if a feature flag is enabled
   * @param {string} flagName - Name of the flag
   * @param {object} context - Context for evaluation (providerId, userId, etc.)
   * @returns {boolean|number} - Flag value
   */
  async isEnabled(flagName, context = {}) {
    const flag = FLAGS[flagName];
    
    if (!flag) {
      console.warn(`[FeatureFlags] Unknown flag: ${flagName}`);
      return false;
    }
    
    // 1. Check kill switches first
    if (this.isKillSwitchActive(flagName)) {
      return false;
    }
    
    // 2. Check runtime overrides
    if (runtimeOverrides.has(flagName)) {
      return runtimeOverrides.get(flagName);
    }
    
    // 3. Check provider-specific overrides
    if (context.providerId) {
      const providerValue = await this.getProviderOverride(flagName, context.providerId);
      if (providerValue !== null) {
        return providerValue;
      }
    }
    
    // 4. Check percentage rollout
    if (flag.type === 'percentage') {
      return this.checkPercentage(flagName, flag.default, context);
    }
    
    // 5. Return default value
    return flag.default;
  }
  
  /**
   * Check if any kill switch blocks this flag
   */
  isKillSwitchActive(flagName) {
    // If checking a booking flag, check booking kill switch
    if (flagName.startsWith('booking.') && runtimeOverrides.get('kill.all_bookings')) {
      return true;
    }
    
    // If checking a payment flag, check payment kill switch
    if (flagName.startsWith('payment.') && runtimeOverrides.get('kill.payment_captures')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check percentage-based rollout
   * Uses deterministic hashing for consistent behavior
   */
  checkPercentage(flagName, percentage, context) {
    if (percentage >= 100) return true;
    if (percentage <= 0) return false;
    
    // Use provider ID or user ID for deterministic bucketing
    const identifier = context.providerId || context.userId || context.sessionId || '';
    const hash = this.hashString(identifier + flagName);
    const bucket = hash % 100;
    
    return bucket < percentage;
  }
  
  /**
   * Simple string hash for bucketing
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  /**
   * Get provider-specific override
   */
  async getProviderOverride(flagName, providerId) {
    const key = `${providerId}:${flagName}`;
    
    // Check cache first
    if (providerOverrides.has(key)) {
      return providerOverrides.get(key);
    }
    
    // Could query database here for persistent overrides
    // For now, return null (no override)
    return null;
  }
  
  /**
   * Set runtime override (admin use)
   */
  setOverride(flagName, value) {
    if (!FLAGS[flagName]) {
      throw new Error(`Unknown flag: ${flagName}`);
    }
    runtimeOverrides.set(flagName, value);
    console.log(`[FeatureFlags] Override set: ${flagName} = ${value}`);
  }
  
  /**
   * Remove runtime override
   */
  clearOverride(flagName) {
    runtimeOverrides.delete(flagName);
    console.log(`[FeatureFlags] Override cleared: ${flagName}`);
  }
  
  /**
   * Set provider-specific override
   */
  async setProviderOverride(providerId, flagName, value) {
    if (!FLAGS[flagName]) {
      throw new Error(`Unknown flag: ${flagName}`);
    }
    
    const key = `${providerId}:${flagName}`;
    providerOverrides.set(key, value);
    
    // Could persist to database here
    console.log(`[FeatureFlags] Provider override set: ${key} = ${value}`);
  }
  
  /**
   * Get all flags with current values for admin dashboard
   */
  async getAllFlags(context = {}) {
    const result = {};
    
    for (const [flagName, flag] of Object.entries(FLAGS)) {
      result[flagName] = {
        ...flag,
        currentValue: await this.isEnabled(flagName, context),
        hasOverride: runtimeOverrides.has(flagName)
      };
    }
    
    return result;
  }
  
  /**
   * Get flags by category
   */
  getFlagsByCategory(category) {
    return Object.entries(FLAGS)
      .filter(([_, flag]) => flag.category === category)
      .reduce((acc, [name, flag]) => {
        acc[name] = flag;
        return acc;
      }, {});
  }
  
  /**
   * Activate emergency kill switch
   */
  activateKillSwitch(switchName) {
    const flagName = `kill.${switchName}`;
    if (!FLAGS[flagName]) {
      throw new Error(`Unknown kill switch: ${switchName}`);
    }
    
    this.setOverride(flagName, true);
    console.error(`[FeatureFlags] ⚠️ KILL SWITCH ACTIVATED: ${switchName}`);
    
    // Could trigger alerts here
    return true;
  }
  
  /**
   * Deactivate emergency kill switch
   */
  deactivateKillSwitch(switchName) {
    const flagName = `kill.${switchName}`;
    if (!FLAGS[flagName]) {
      throw new Error(`Unknown kill switch: ${switchName}`);
    }
    
    this.clearOverride(flagName);
    console.log(`[FeatureFlags] Kill switch deactivated: ${switchName}`);
    
    return true;
  }
  
  /**
   * Get status of all kill switches
   */
  getKillSwitchStatus() {
    const switches = this.getFlagsByCategory('kill');
    const status = {};
    
    for (const [name, flag] of Object.entries(switches)) {
      status[name] = {
        active: runtimeOverrides.get(name) || false,
        severity: flag.severity,
        description: flag.description
      };
    }
    
    return status;
  }
}

// Export singleton instance
module.exports = new FeatureFlags();

// Also export FLAGS for reference
module.exports.FLAGS = FLAGS;
