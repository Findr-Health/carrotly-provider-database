const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Provider = require('../models/Provider');

const JWT_SECRET = process.env.JWT_SECRET || 'findr-health-admin-secret-2025';

// Admin auth middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = decoded.id || decoded.adminId;  // Support both token formats
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// ==================== PROVIDER MANAGEMENT ====================

// Toggle verified badge
router.patch('/:providerId/verified', adminAuth, async (req, res) => {
  try {
    const { providerId } = req.params;
    const { isVerified } = req.body;
    
    const provider = await Provider.findById(providerId);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    provider.isVerified = isVerified;
    
    if (isVerified) {
      provider.verifiedAt = new Date();
      provider.verifiedBy = req.adminId;
    } else {
      provider.verifiedAt = undefined;
      provider.verifiedBy = undefined;
    }
    
    await provider.save();
    
    res.json({
      message: `Provider ${isVerified ? 'verified' : 'unverified'} successfully`,
      provider: {
        _id: provider._id,
        practiceName: provider.practiceName,
        isVerified: provider.isVerified,
        verifiedAt: provider.verifiedAt
      }
    });
  } catch (error) {
    console.error('Toggle verified error:', error);
    res.status(500).json({ error: 'Failed to update verification status' });
  }
});

// Toggle featured status
router.patch('/:providerId/featured', adminAuth, async (req, res) => {
  try {
    const { providerId } = req.params;
    const { isFeatured, featuredOrder } = req.body;
    
    const provider = await Provider.findById(providerId);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    provider.isFeatured = isFeatured;
    if (featuredOrder !== undefined) {
      provider.featuredOrder = featuredOrder;
    }
    
    await provider.save();
    
    res.json({
      message: `Provider ${isFeatured ? 'featured' : 'unfeatured'} successfully`,
      provider: {
        _id: provider._id,
        practiceName: provider.practiceName,
        isFeatured: provider.isFeatured,
        featuredOrder: provider.featuredOrder
      }
    });
  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(500).json({ error: 'Failed to update featured status' });
  }
});

// Update provider coordinates (for geo search)
router.patch('/:providerId/coordinates', adminAuth, async (req, res) => {
  try {
    const { providerId } = req.params;
    const { latitude, longitude } = req.body;
    
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }
    
    const provider = await Provider.findById(providerId);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    provider.location = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };
    
    await provider.save();
    
    res.json({
      message: 'Coordinates updated successfully',
      provider: {
        _id: provider._id,
        practiceName: provider.practiceName,
        location: provider.location
      }
    });
  } catch (error) {
    console.error('Update coordinates error:', error);
    res.status(500).json({ error: 'Failed to update coordinates' });
  }
});

// Get all verified providers
router.get('/verified', adminAuth, async (req, res) => {
  try {
    const providers = await Provider.find({ isVerified: true })
      .select('practiceName providerTypes address isVerified verifiedAt')
      .sort({ verifiedAt: -1 });
    
    res.json(providers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get verified providers' });
  }
});

// Get all featured providers
router.get('/featured', adminAuth, async (req, res) => {
  try {
    const providers = await Provider.find({ isFeatured: true })
      .select('practiceName providerTypes address isFeatured featuredOrder')
      .sort({ featuredOrder: 1 });
    
    res.json(providers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get featured providers' });
  }
});

// Bulk update featured order
router.patch('/featured/reorder', adminAuth, async (req, res) => {
  try {
    const { providers } = req.body;  // Array of { _id, featuredOrder }
    
    if (!Array.isArray(providers)) {
      return res.status(400).json({ error: 'Providers array required' });
    }
    
    const updates = providers.map(p => 
      Provider.findByIdAndUpdate(p._id, { featuredOrder: p.featuredOrder })
    );
    
    await Promise.all(updates);
    
    res.json({ message: 'Featured order updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reorder featured providers' });
  }
});

module.exports = router;
