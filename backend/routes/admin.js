const express = require('express');
const router = express.Router();
const Provider = require('../models/Provider');

// GET /api/admin/providers - Get all providers with filters
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

    const total = await Provider.countDocuments(query);

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

// GET /api/admin/providers/:id - Get single provider
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

// PUT /api/admin/providers/:id - Update provider
router.put('/providers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be directly updated
    delete updates._id;
    delete updates.createdAt;
    
    const provider = await Provider.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    res.json({
      success: true,
      provider,
      message: 'Provider updated successfully'
    });
  } catch (error) {
    console.error('Error updating provider:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update provider',
      error: error.message
    });
  }
});

// PATCH /api/admin/providers/:id/verified - Toggle verified status
router.patch('/providers/:id/verified', async (req, res) => {
  try {
    const { id } = req.params;
    
    const provider = await Provider.findById(id);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Toggle verified status
    provider.verified = !provider.verified;
    await provider.save();

    res.json({
      success: true,
      provider,
      message: `Provider ${provider.verified ? 'verified' : 'unverified'} successfully`
    });
  } catch (error) {
    console.error('Error toggling verification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle verification',
      error: error.message
    });
  }
});

// PATCH /api/admin/providers/:id/featured - Toggle featured status
router.patch('/providers/:id/featured', async (req, res) => {
  try {
    const { id } = req.params;
    
    const provider = await Provider.findById(id);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Toggle featured status
    provider.featured = !provider.featured;
    await provider.save();

    res.json({
      success: true,
      provider,
      message: `Provider ${provider.featured ? 'featured' : 'unfeatured'} successfully`
    });
  } catch (error) {
    console.error('Error toggling featured status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle featured status',
      error: error.message
    });
  }
});

// POST /api/admin/providers/:id/photos - Upload photos
router.post('/providers/:id/photos', async (req, res) => {
  try {
    const { id } = req.params;
    const { photos } = req.body; // Array of photo URLs or base64

    if (!photos || !Array.isArray(photos)) {
      return res.status(400).json({
        success: false,
        message: 'Photos array is required'
      });
    }

    const provider = await Provider.findById(id);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Add new photos to existing photos array
    provider.photos = provider.photos || [];
    provider.photos.push(...photos);

    await provider.save();

    res.json({
      success: true,
      provider,
      message: 'Photos uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading photos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload photos',
      error: error.message
    });
  }
});

// DELETE /api/admin/providers/:id/photos/:photoIndex - Delete photo
router.delete('/providers/:id/photos/:photoIndex', async (req, res) => {
  try {
    const { id, photoIndex } = req.params;

    const provider = await Provider.findById(id);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    if (!provider.photos || provider.photos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provider has no photos'
      });
    }

    const index = parseInt(photoIndex);
    if (index < 0 || index >= provider.photos.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid photo index'
      });
    }

    provider.photos.splice(index, 1);
    await provider.save();

    res.json({
      success: true,
      provider,
      message: 'Photo deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete photo',
      error: error.message
    });
  }
});

// DELETE /api/admin/providers/:id - Delete provider
router.delete('/providers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const provider = await Provider.findByIdAndDelete(id);

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    res.json({
      success: true,
      message: 'Provider deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting provider:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete provider',
      error: error.message
    });
  }
});

// POST /api/admin/create-search-index - Create/recreate search index
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
