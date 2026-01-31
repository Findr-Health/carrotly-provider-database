/**
 * Provider Business Hours Management
 * Quick endpoint to set business hours
 */

const express = require('express');
const router = express.Router();
const Provider = require('../models/Provider');

/**
 * POST /api/providers/:providerId/business-hours
 * Set business hours for a provider
 */
router.post('/:providerId/business-hours', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { businessHours } = req.body;
    
    const provider = await Provider.findByIdAndUpdate(
      providerId,
      { $set: { businessHours } },
      { new: true }
    );
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    return res.json({
      success: true,
      businessHours: provider.businessHours
    });
    
  } catch (error) {
    console.error('Update business hours error:', error);
    return res.status(500).json({ error: 'Failed to update business hours' });
  }
});

/**
 * GET /api/providers/:providerId/business-hours
 * Get business hours for a provider
 */
router.get('/:providerId/business-hours', async (req, res) => {
  try {
    const { providerId } = req.params;
    
    const provider = await Provider.findById(providerId).select('businessHours practiceName');
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    return res.json({
      success: true,
      practiceName: provider.practiceName,
      businessHours: provider.businessHours || {}
    });
    
  } catch (error) {
    console.error('Get business hours error:', error);
    return res.status(500).json({ error: 'Failed to get business hours' });
  }
});

module.exports = router;
