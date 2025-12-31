const express = require('express');
const router = express.Router();
const Provider = require('../models/Provider');

// ============================================
// GOOGLE PLACES BUSINESS SEARCH (for onboarding)
// ============================================

/**
 * Search for a business using Google Places API
 * POST /api/search/business
 */
router.post('/business', async (req, res) => {
  try {
    const { businessName, zipCode } = req.body;
    
    if (!businessName) {
      return res.status(400).json({ error: 'Business name is required' });
    }
    
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY not configured');
      return res.status(500).json({ error: 'Google Places API not configured' });
    }
    
    // Build search query
    let query = businessName;
    if (zipCode) {
      query += ` ${zipCode}`;
    }
    
    // Use Google Places Text Search API
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=establishment&key=${apiKey}`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.status === 'REQUEST_DENIED') {
      console.error('Google Places API error:', data.error_message);
      return res.status(500).json({ error: 'Google Places API error' });
    }
    
    // Transform results
    const results = (data.results || []).slice(0, 10).map(place => ({
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      types: place.types,
      location: place.geometry?.location,
      photos: place.photos?.map(p => ({
        reference: p.photo_reference,
        width: p.width,
        height: p.height
      })) || []
    }));
    
    res.json({ 
      results,
      status: data.status 
    });
    
  } catch (error) {
    console.error('Business search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * Get place details from Google Places API
 * GET /api/search/place/:placeId
 */
router.get('/place/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    
    if (!placeId) {
      return res.status(400).json({ error: 'Place ID is required' });
    }
    
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY not configured');
      return res.status(500).json({ error: 'Google Places API not configured' });
    }
    
    // Get place details
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,photos,geometry,address_components,rating,user_ratings_total,types&key=${apiKey}`;
    
    const response = await fetch(detailsUrl);
    const data = await response.json();
    
    if (data.status === 'REQUEST_DENIED') {
      console.error('Google Places API error:', data.error_message);
      return res.status(500).json({ error: 'Google Places API error' });
    }
    
    if (data.status !== 'OK' || !data.result) {
      return res.status(404).json({ error: 'Place not found' });
    }
    
    const place = data.result;
    
    // Parse address components
    const addressComponents = {};
    (place.address_components || []).forEach(component => {
      if (component.types.includes('street_number')) {
        addressComponents.streetNumber = component.long_name;
      }
      if (component.types.includes('route')) {
        addressComponents.street = component.long_name;
      }
      if (component.types.includes('locality')) {
        addressComponents.city = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        addressComponents.state = component.short_name;
      }
      if (component.types.includes('postal_code')) {
        addressComponents.zip = component.long_name;
      }
    });
    
    // Build street address
    const streetAddress = addressComponents.streetNumber && addressComponents.street
      ? `${addressComponents.streetNumber} ${addressComponents.street}`
      : place.formatted_address?.split(',')[0] || '';
    
    // Get photo URLs
    const photos = (place.photos || []).slice(0, 5).map(photo => ({
      url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${apiKey}`,
      reference: photo.photo_reference
    }));
    
    res.json({
      placeId,
      name: place.name,
      address: {
        street: streetAddress,
        city: addressComponents.city || '',
        state: addressComponents.state || '',
        zip: addressComponents.zip || '',
        full: place.formatted_address
      },
      phone: place.formatted_phone_number || '',
      website: place.website || '',
      location: place.geometry?.location,
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      hours: place.opening_hours?.weekday_text || [],
      photos,
      types: place.types
    });
    
  } catch (error) {
    console.error('Place details error:', error);
    res.status(500).json({ error: 'Failed to get place details' });
  }
});


// ============================================
// PROVIDER DATABASE SEARCH (for consumer app)
// ============================================

// Search providers with geo support
router.get('/providers', async (req, res) => {
  try {
    const {
      query,
      lat,
      lng,
      radius = 25,
      types,
      minRating,
      verified,
      featured,
      page = 1,
      limit = 20,
      sort = 'name'
    } = req.query;
    
    // Base query - only approved providers
    const filter = { status: 'approved' };
    
    // Text search
    if (query) {
      filter.$or = [
        { practiceName: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { 'services.name': { $regex: query, $options: 'i' } },
        { providerTypes: { $regex: query, $options: 'i' } }
      ];
    }
    
    // Category filter
    if (types) {
      const typeArray = types.split(',').map(t => t.trim());
      filter.providerTypes = { $in: typeArray };
    }
    
    // Rating filter
    if (minRating) {
      filter.rating = { $gte: parseFloat(minRating) };
    }
    
    // Verified filter
    if (verified === 'true') {
      filter.isVerified = true;
    }
    
    // Featured filter
    if (featured === 'true') {
      filter.isFeatured = true;
    }
    
    let providers;
    let total;
    
    // Check if any providers have geo coordinates
    const hasGeoProviders = await Provider.findOne({ 
      'location.coordinates.0': { $exists: true },
      status: 'approved'
    });
    
    // Geo search if coordinates provided AND providers have coordinates
    if (lat && lng && hasGeoProviders) {
      const radiusInMeters = parseFloat(radius) * 1609.34;
      
      const pipeline = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            distanceField: 'distanceMeters',
            maxDistance: radiusInMeters,
            spherical: true,
            query: filter
          }
        },
        {
          $addFields: {
            distance: { $round: [{ $divide: ['$distanceMeters', 1609.34] }, 1] }
          }
        }
      ];
      
      // Sort
      if (sort === 'rating') {
        pipeline.push({ $sort: { rating: -1, distance: 1 } });
      } else if (sort === 'name') {
        pipeline.push({ $sort: { practiceName: 1 } });
      } else {
        pipeline.push({ $sort: { distance: 1 } });
      }
      
      // Count total
      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await Provider.aggregate(countPipeline);
      total = countResult[0]?.total || 0;
      
      // Pagination
      pipeline.push({ $skip: (parseInt(page) - 1) * parseInt(limit) });
      pipeline.push({ $limit: parseInt(limit) });
      
      // Select fields
      pipeline.push({
        $project: {
          practiceName: 1,
          providerTypes: 1,
          description: 1,
          address: 1,
          photos: 1,
          rating: 1,
          reviewCount: 1,
          isVerified: 1,
          isFeatured: 1,
          services: 1,
          distance: 1,
          contactInfo: 1,
          phone: 1
        }
      });
      
      providers = await Provider.aggregate(pipeline);
      
    } else {
      // Non-geo search (fallback)
      total = await Provider.countDocuments(filter);
      
      let sortOption = { practiceName: 1 };
      if (sort === 'rating') sortOption = { rating: -1 };
      if (featured === 'true') sortOption = { featuredOrder: 1 };
      
      providers = await Provider.find(filter)
        .select('practiceName providerTypes description address photos rating reviewCount isVerified isFeatured services contactInfo phone')
        .sort(sortOption)
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));
    }
    
    res.json({
      providers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get featured providers (for home screen)
router.get('/featured', async (req, res) => {
  try {
    const { lat, lng, limit = 10 } = req.query;
    
    // Check if geo data exists
    const hasGeoProviders = await Provider.findOne({ 
      'location.coordinates.0': { $exists: true },
      status: 'approved',
      isFeatured: true
    });
    
    let providers;
    
    if (lat && lng && hasGeoProviders) {
      providers = await Provider.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            distanceField: 'distanceMeters',
            maxDistance: 80467,
            spherical: true,
            query: { status: 'approved', isFeatured: true }
          }
        },
        {
          $addFields: {
            distance: { $round: [{ $divide: ['$distanceMeters', 1609.34] }, 1] }
          }
        },
        { $sort: { featuredOrder: 1, distance: 1 } },
        { $limit: parseInt(limit) },
        {
          $project: {
            practiceName: 1,
            providerTypes: 1,
            address: 1,
            photos: 1,
            rating: 1,
            reviewCount: 1,
            isVerified: 1,
            distance: 1
          }
        }
      ]);
    } else {
      providers = await Provider.find({ status: 'approved', isFeatured: true })
        .select('practiceName providerTypes address photos rating reviewCount isVerified')
        .sort({ featuredOrder: 1 })
        .limit(parseInt(limit));
    }
    
    res.json(providers);
  } catch (error) {
    console.error('Featured error:', error);
    res.status(500).json({ error: 'Failed to get featured providers' });
  }
});

// Get provider types for filter dropdown
router.get('/types', async (req, res) => {
  try {
    const types = await Provider.distinct('providerTypes', { status: 'approved' });
    
    const normalizedTypes = [...new Set(
      types.map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase().replace('-', ' '))
    )].sort();
    
    res.json({ types: normalizedTypes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get types' });
  }
});

// Autocomplete search
router.get('/autocomplete', async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }
    
    const providers = await Provider.find({
      status: 'approved',
      practiceName: { $regex: q, $options: 'i' }
    })
    .select('practiceName providerTypes address.city')
    .limit(parseInt(limit));
    
    const services = await Provider.aggregate([
      { $match: { status: 'approved' } },
      { $unwind: '$services' },
      { $match: { 'services.name': { $regex: q, $options: 'i' } } },
      { $group: { _id: '$services.name' } },
      { $limit: parseInt(limit) }
    ]);
    
    res.json({
      providers: providers.map(p => ({
        type: 'provider',
        name: p.practiceName,
        city: p.address?.city,
        category: p.providerTypes?.[0]
      })),
      services: services.map(s => ({
        type: 'service',
        name: s._id
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Autocomplete failed' });
  }
});

module.exports = router;
