/**
 * Clarity API Service
 * Findr Health - Consumer App
 * 
 * Handles all API calls to the Clarity backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fearless-achievement-production.up.railway.app';

// Store user location
let userLocation = null;

/**
 * Get or request user location
 */
export async function getUserLocation() {
  // Return cached location if available
  if (userLocation) return userLocation;
  
  // Try to get from localStorage
  const stored = localStorage.getItem('clarityUserLocation');
  if (stored) {
    userLocation = JSON.parse(stored);
    return userLocation;
  }
  
  // Request browser geolocation
  if ('geolocation' in navigator) {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          maximumAge: 300000 // 5 minutes
        });
      });
      
      // Reverse geocode to get city/state
      const { latitude, longitude } = position.coords;
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      const geoData = await geoResponse.json();
      
      userLocation = {
        city: geoData.address?.city || geoData.address?.town || geoData.address?.village,
        state: geoData.address?.state,
        zip: geoData.address?.postcode,
        country: geoData.address?.country
      };
      
      localStorage.setItem('clarityUserLocation', JSON.stringify(userLocation));
      return userLocation;
      
    } catch (err) {
      console.log('Geolocation not available:', err.message);
      return null;
    }
  }
  
  return null;
}

/**
 * Set user location manually
 */
export function setUserLocation(location) {
  userLocation = location;
  localStorage.setItem('clarityUserLocation', JSON.stringify(location));
}

/**
 * Parse location from user input
 */
export function parseLocationInput(input) {
  if (!input) return null;
  
  // Check for zip code
  const zipMatch = input.match(/\b(\d{5})\b/);
  if (zipMatch) {
    return { zip: zipMatch[1] };
  }
  
  // Check for city, state format
  const cityStateMatch = input.match(/([a-zA-Z\s]+),?\s*([A-Z]{2})/i);
  if (cityStateMatch) {
    return {
      city: cityStateMatch[1].trim(),
      state: cityStateMatch[2].toUpperCase()
    };
  }
  
  // Just return as city
  return { city: input.trim() };
}

/**
 * Send a chat message to Clarity
 */
export async function sendChatMessage(message, history = []) {
  const location = await getUserLocation();
  
  const response = await fetch(`${API_BASE_URL}/api/clarity/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      history,
      location
    })
  });
  
  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Analyze an uploaded document
 */
export async function analyzeDocument(file, documentType = null, question = null) {
  const location = await getUserLocation();
  
  const formData = new FormData();
  formData.append('file', file);
  if (documentType) formData.append('documentType', documentType);
  if (question) formData.append('question', question);
  if (location) formData.append('location', JSON.stringify(location));
  
  const response = await fetch(`${API_BASE_URL}/api/clarity/analyze`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`Document analysis failed: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Submit feedback for an AI response
 */
export async function submitFeedback(feedbackData) {
  const response = await fetch(`${API_BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(feedbackData)
  });
  
  if (!response.ok) {
    throw new Error(`Feedback submission failed: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Check API health
 */
export async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/api/clarity/health`);
  return response.json();
}

// Generate session ID on load
if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem('claritySessionId')) {
  sessionStorage.setItem('claritySessionId', `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
}

export default {
  sendChatMessage,
  analyzeDocument,
  submitFeedback,
  getUserLocation,
  setUserLocation,
  parseLocationInput,
  checkHealth
};
