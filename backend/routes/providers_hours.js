const express = require('express');
const router = express.Router();
const Provider = require('../models/Provider');

router.post('/:providerId/business-hours', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { businessHours } = req.body;
    
    console.log('📅 Setting business hours for provider:', providerId);
    console.log('📋 Business hours data:', JSON.stringify(businessHours, null, 2));
    
    // FIXED: Use correct nested path
    const provider = await Provider.findByIdAndUpdate(
      providerId,
      { $set: { 'calendar.businessHours': businessHours } },
      { new: true, runValidators: true }
    );
    
    if (!provider) {
      console.error('❌ Provider not found:', providerId);
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    console.log('✅ Business hours updated successfully');
    console.log('📋 Saved hours:', JSON.stringify(provider.calendar?.businessHours, null, 2));
    
    return res.json({
      success: true,
      businessHours: provider.calendar?.businessHours || {}
    });
    
  } catch (error) {
    console.error('❌ Update business hours error:', error);
    return res.status(500).json({ 
      error: 'Failed to update business hours',
      details: error.message 
    });
  }
});

router.get('/:providerId/business-hours', async (req, res) => {
  try {
    const { providerId } = req.params;
    
    const provider = await Provider.findById(providerId).select('calendar.businessHours practiceName');
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    return res.json({
      success: true,
      practiceName: provider.practiceName,
      businessHours: provider.calendar?.businessHours || {}
    });
    
  } catch (error) {
    console.error('Get business hours error:', error);
    return res.status(500).json({ error: 'Failed to get business hours' });
  }
});

module.exports = router;
