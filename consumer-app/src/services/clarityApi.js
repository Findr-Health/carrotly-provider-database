/**
 * Clarity API Service
 * Findr Health - Consumer App
 * 
 * Handles communication with the Clarity backend API including:
 * - Chat with Cost Navigator
 * - Document analysis
 * - Geolocation handling
 * - Conversation history management
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fearless-achievement-production.up.railway.app';

/**
 * User location state (session only, not persisted)
 */
let userLocation = null;

/**
 * Get user's location using browser geolocation API
 * Falls back to null if denied or unavailable
 * @returns {Promise<Object|null>} Location object or null
 */
export async function getUserLocation() {
  // Return cached location if available
  if (userLocation) {
    return userLocation;
  }
  
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      resolve(null);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Reverse geocode to get city/state
          const { latitude, longitude } = position.coords;
          const location = await reverseGeocode(latitude, longitude);
          userLocation = location;
          resolve(location);
        } catch (error) {
          console.log('Reverse geocoding failed:', error);
          resolve(null);
        }
      },
      (error) => {
        console.log('Geolocation denied or failed:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  });
}

/**
 * Reverse geocode coordinates to city/state
 * Uses free Nominatim API (OpenStreetMap)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Location object
 */
async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          'User-Agent': 'FindrHealth/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }
    
    const data = await response.json();
    
    return {
      city: data.address?.city || data.address?.town || data.address?.village,
      state: data.address?.state,
      zip: data.address?.postcode,
      country: data.address?.country || 'US'
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Manually set user location (fallback when geolocation denied)
 * @param {Object} location - {city, state, zip}
 */
export function setUserLocation(location) {
  userLocation = location;
}

/**
 * Get current location (cached)
 * @returns {Object|null} Current location or null
 */
export function getCurrentLocation() {
  return userLocation;
}

/**
 * Clear cached location
 */
export function clearLocation() {
  userLocation = null;
}

/**
 * Send chat message to Cost Navigator
 * @param {string} message - User's message
 * @param {Array} history - Previous messages [{role: 'user'|'assistant', content: string}]
 * @returns {Promise<Object>} Response with message, triggers, etc.
 */
export async function sendChatMessage(message, history = []) {
  try {
    // Try to get location if not already available
    const location = userLocation || await getUserLocation();
    
    const response = await fetch(`${API_BASE_URL}/api/clarity/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history: formatHistoryForAPI(history),
        location
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      message: data.message,
      triggers: data.triggers || {},
      usage: data.usage
    };
    
  } catch (error) {
    console.error('Chat API error:', error);
    return {
      success: false,
      message: getFallbackMessage('chat'),
      error: error.message
    };
  }
}

/**
 * Upload and analyze a document
 * @param {File} file - The document file
 * @param {string} question - Optional specific question about the document
 * @returns {Promise<Object>} Analysis result
 */
export async function analyzeDocument(file, question = null) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    if (question) {
      formData.append('question', question);
    }
    
    // Add location if available
    const location = userLocation || await getUserLocation();
    if (location) {
      formData.append('location', JSON.stringify(location));
    }
    
    const response = await fetch(`${API_BASE_URL}/api/clarity/analyze`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      analysis: data.analysis,
      documentType: data.documentType,
      triggers: data.triggers || {},
      usage: data.usage
    };
    
  } catch (error) {
    console.error('Document analysis error:', error);
    return {
      success: false,
      analysis: getFallbackMessage('document'),
      error: error.message
    };
  }
}

/**
 * Check API health
 * @returns {Promise<Object>} Health status
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clarity/health`);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Health check error:', error);
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

// ============ Helper Functions ============

/**
 * Format conversation history for API
 * Ensures only role and content are sent
 * @param {Array} history - Full message history from state
 * @returns {Array} Cleaned history for API
 */
function formatHistoryForAPI(history) {
  if (!history || !Array.isArray(history)) {
    return [];
  }
  
  return history
    .filter(msg => msg.role && msg.content)
    .map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : msg.content.text || ''
    }));
}

/**
 * Get fallback message when API fails
 * @param {string} type - 'chat' or 'document'
 * @returns {string} Fallback message
 */
function getFallbackMessage(type) {
  if (type === 'document') {
    return "I'm having trouble analyzing this document right now. Please try again in a moment, or try uploading a clearer image.\n\nIn the meantime, here are some general tips:\n\n1. Always request an itemized bill\n2. Check that dates and services match what you received\n3. Compare charges to Healthcare Bluebook for fair prices";
  }
  
  return "I'm having trouble connecting right now. Please try again in a moment.\n\nIn the meantime, here are some helpful tips:\n\n1. You have the right to an itemized bill\n2. Most hospital bills can be negotiated\n3. Cash prices are often 40-60% less than insurance rates\n4. Medical debt under $500 doesn't affect credit";
}

/**
 * Parse location from user input (city, state or zip)
 * @param {string} input - User's location input
 * @returns {Object} Parsed location object
 */
export function parseLocationInput(input) {
  if (!input) return null;
  
  const trimmed = input.trim();
  
  // Check if it's a zip code (5 digits)
  if (/^\d{5}$/.test(trimmed)) {
    return { zip: trimmed };
  }
  
  // Check for "City, State" format
  const cityStateMatch = trimmed.match(/^([^,]+),\s*([A-Za-z]{2})$/);
  if (cityStateMatch) {
    return {
      city: cityStateMatch[1].trim(),
      state: cityStateMatch[2].toUpperCase()
    };
  }
  
  // Check for "City, Full State Name" format
  const cityFullStateMatch = trimmed.match(/^([^,]+),\s*(.+)$/);
  if (cityFullStateMatch) {
    return {
      city: cityFullStateMatch[1].trim(),
      state: cityFullStateMatch[2].trim()
    };
  }
  
  // Just a city name
  return { city: trimmed };
}

export default {
  sendChatMessage,
  analyzeDocument,
  checkHealth,
  getUserLocation,
  setUserLocation,
  getCurrentLocation,
  clearLocation,
  parseLocationInput
};
