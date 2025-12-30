const express = require('express');
const router = express.Router();
const Provider = require('../models/Provider');

// Search providers with geo support
router.get('/providers', async (req, res) => {
  try {
    const {
      query,
      lat,
      lng,
      radius = 25,  // miles
      types,
      minRating,
      verified,
      featured,
      page = 1,
      limit = 20,
      sort = 'distance'  // distance, rating, name
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
    
    // Geo search if coordinates provided
    if (lat && lng) {
      const radiusInMeters = parseFloat(radius) * 1609.34;
      
      // Use aggregation for geo queries with distance calculation
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
            distance: { $round: [{ $divide: ['$distanceMeters', 1609.34] }, 1] }  // Convert to miles
          }
        }
      ];
      
      // Sort
      if (sort === 'rating') {
        pipeline.push({ $sort: { rating: -1, distance: 1 } });
      } else if (sort === 'name') {
        pipeline.push({ $sort: { practiceName: 1 } });
      } else {
        pipeline.push({ $sort: { distance: 1 } });  // Default: nearest first
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
      // Non-geo search
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
    
    let providers;
    
    if (lat && lng) {
      // Get featured near user
      providers = await Provider.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            distanceField: 'distanceMeters',
            maxDistance: 80467,  // 50 miles
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
    
    // Normalize and dedupe (handle case variations)
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
