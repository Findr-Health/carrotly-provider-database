const express = require('express');
const router = express.Router();
const axios = require('axios');

// Google Places API Key - stored securely on server
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || 'AIzaSyBNcg9u0nPypQXFOupFA5lD6FmJ-KCAekQ';
const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// Simple in-memory cache (consider Redis for production)
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours for city data

/**
 * GET /api/places/autocomplete
 * Proxy for Google Places Autocomplete API
 * 
 * Query params:
 * - input: Search query (required)
 * - types: Place types (default: '(cities)')
 * - components: Country restriction (default: 'country:us')
 */
router.get('/autocomplete', async (req, res) => {
  try {
    const { input, types = '(cities)', components = 'country:us' } = req.query;

    if (!input || input.trim().length < 2) {
      return res.json({ predictions: [], status: 'OK' });
    }

    // Check cache
    const cacheKey = `autocomplete:${input.toLowerCase()}:${types}:${components}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    // Call Google Places API
    const response = await axios.get(`${GOOGLE_PLACES_BASE_URL}/autocomplete/json`, {
      params: {
        input: input.trim(),
        types,
        components,
        key: GOOGLE_PLACES_API_KEY,
      },
      timeout: 5000,
    });

    const data = response.data;

    // Transform response to only include needed fields (reduce payload size)
    const result = {
      status: data.status,
      predictions: (data.predictions || []).map(p => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting?.main_text || p.description,
        secondaryText: p.structured_formatting?.secondary_text || '',
      })),
    };

    // Cache successful responses
    if (data.status === 'OK') {
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
    }

    res.json(result);
  } catch (error) {
    console.error('Places autocomplete error:', error.message);
    
    // Return empty results instead of error (better UX)
    res.json({ 
      predictions: [], 
      status: 'ERROR',
      error: 'Search temporarily unavailable'
    });
  }
});

/**
 * GET /api/places/details/:placeId
 * Proxy for Google Places Details API
 * 
 * Returns city, state, latitude, longitude
 */
router.get('/details/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;

    if (!placeId) {
      return res.status(400).json({ error: 'Place ID is required' });
    }

    // Check cache
    const cacheKey = `details:${placeId}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    // Call Google Places API
    const response = await axios.get(`${GOOGLE_PLACES_BASE_URL}/details/json`, {
      params: {
        place_id: placeId,
        fields: 'geometry,address_components,formatted_address',
        key: GOOGLE_PLACES_API_KEY,
      },
      timeout: 5000,
    });

    const data = response.data;

    if (data.status !== 'OK' || !data.result) {
      return res.status(404).json({ 
        error: 'Place not found',
        status: data.status 
      });
    }

    const result = data.result;
    const geometry = result.geometry?.location || {};
    const components = result.address_components || [];

    // Extract city and state from address components
    let city = '';
    let state = '';
    let stateShort = '';

    for (const component of components) {
      const types = component.types || [];
      
      if (types.includes('locality')) {
        city = component.long_name;
      } else if (types.includes('sublocality_level_1') && !city) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        state = component.long_name;
        stateShort = component.short_name;
      }
    }

    const responseData = {
      status: 'OK',
      city: city || 'Unknown',
      state: stateShort || state,
      stateFull: state,
      latitude: geometry.lat,
      longitude: geometry.lng,
      formattedAddress: result.formatted_address,
    };

    // Cache the result
    cache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    res.json(responseData);
  } catch (error) {
    console.error('Places details error:', error.message);
    res.status(500).json({ 
      error: 'Failed to get place details',
      status: 'ERROR'
    });
  }
});

/**
 * GET /api/places/reverse-geocode
 * Reverse geocode coordinates to city/state
 * 
 * Query params:
 * - lat: Latitude (required)
 * - lng: Longitude (required)
 */
router.get('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Check cache (round to 3 decimal places for nearby locations)
    const roundedLat = parseFloat(lat).toFixed(3);
    const roundedLng = parseFloat(lng).toFixed(3);
    const cacheKey = `reverse:${roundedLat}:${roundedLng}`;
    
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    // Call Google Geocoding API
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        latlng: `${lat},${lng}`,
        result_type: 'locality|administrative_area_level_1',
        key: GOOGLE_PLACES_API_KEY,
      },
      timeout: 5000,
    });

    const data = response.data;

    if (data.status !== 'OK' || !data.results?.length) {
      return res.json({
        status: 'OK',
        city: 'Unknown',
        state: '',
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
      });
    }

    // Parse the first result
    const result = data.results[0];
    const components = result.address_components || [];

    let city = '';
    let state = '';

    for (const component of components) {
      const types = component.types || [];
      
      if (types.includes('locality')) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        state = component.short_name;
      }
    }

    const responseData = {
      status: 'OK',
      city: city || 'Your Location',
      state: state,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
    };

    // Cache the result
    cache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    res.json(responseData);
  } catch (error) {
    console.error('Reverse geocode error:', error.message);
    res.json({
      status: 'OK',
      city: 'Your Location',
      state: '',
      latitude: parseFloat(req.query.lat),
      longitude: parseFloat(req.query.lng),
    });
  }
});

// Clear old cache entries periodically (every hour)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, 60 * 60 * 1000);

module.exports = router;
