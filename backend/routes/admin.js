const express = require('express');
const router = express.Router();
const Provider = require('../models/Provider');

// GET /api/admin/providers - Get all providers with filters for admin dashboard
router.get('/providers', async (req, res) => {
  try {
    const {
      limit = 1000,
      skip = 0,
      search,
      status,
      type,
      verified,
      featured
    } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.providerTypes = type;
    }
    
    if (verified !== undefined) {
      query.verified = verified === 'true';
    }
    
    if (featured !== undefined) {
      query.featured = featured === 'true';
    }

    // Get total count
    const total = await Provider.countDocuments(query);

    // Get providers with pagination
    const providers = await Provider.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      providers,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
  } catch (error) {
    console.error('Error fetching admin providers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch providers',
      error: error.message
    });
  }
});

// GET /api/admin/providers/:id - Get single provider for admin
router.get('/providers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const provider = await Provider.findById(id);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }
    
    res.json({
      success: true,
      provider
    });
  } catch (error) {
    console.error('Error fetching admin provider detail:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch provider',
      error: error.message
    });
  }
});

// Admin endpoint to create search index
router.post('/create-search-index', async (req, res) => {
  try {
    const db = Provider.db;
    const providers = db.collection('providers');
    
    // Drop ALL text indexes first
    const indexes = await providers.indexes();
    const textIndexes = indexes.filter(idx => idx.key && idx.key._fts === 'text');
    
    for (const idx of textIndexes) {
      console.log(`Dropping old text index: ${idx.name}`);
      await providers.dropIndex(idx.name).catch(e => {
        console.log(`Could not drop ${idx.name}:`, e.message);
      });
    }
    
    // Create weighted text index
    await providers.createIndex(
      {
        'services.name': 'text',
        'services.category': 'text',
        'providerTypes': 'text',
        'practiceName': 'text',
        'description': 'text',
        'address.city': 'text',
        'address.state': 'text'
      },
      {
        name: 'text_search_idx',
        weights: {
          'services.name': 10,
          'services.category': 8,
          'providerTypes': 7,
          'practiceName': 6,
          'address.city': 5,
          'address.state': 5,
          'description': 2
        },
        default_language: 'english'
      }
    );
    
    res.json({ 
      success: true, 
      message: 'Search index created successfully',
      weights: {
        'services.name': 10,
        'services.category': 8,
        'providerTypes': 7,
        'practiceName': 6,
        'location': 5,
        'description': 2
      }
    });
    
  } catch (error) {
    console.error('Create index error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
