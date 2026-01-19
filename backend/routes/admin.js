const express = require('express');
const router = express.Router();
const Provider = require('../models/Provider');

// Admin endpoint to create search index
router.post('/create-search-index', async (req, res) => {
  try {
    const db = Provider.db;
    const providers = db.collection('providers');
    
    // Check if text index exists
    const indexes = await providers.indexes();
    const hasTextIndex = indexes.some(idx => idx.key && idx.key._fts === 'text');
    
    if (hasTextIndex) {
      await providers.dropIndex('text_search_idx').catch(() => {});
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
