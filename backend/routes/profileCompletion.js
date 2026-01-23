const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * Middleware to authenticate user via JWT
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }
  
  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.userId = decoded.userId;
    next();
  });
};

/**
 * POST /api/users/complete-profile
 * Complete user profile after OAuth signup
 */
router.post('/complete-profile', authenticateToken, async (req, res) => {
  try {
    const { phone, address, acceptedTerms, termsVersion } = req.body;
    
    // Validate required fields
    if (!phone || !address?.zipCode || !acceptedTerms) {
      return res.status(400).json({
        success: false,
        message: 'Phone, zip code, and TOS acceptance are required'
      });
    }
    
    // Get user
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update user profile
    user.phone = phone;
    user.address = {
      ...user.address,
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.zipCode,
      country: address.country || 'US',
    };
    
    // Accept terms of service
    user.agreement = {
      signed: true,
      version: termsVersion || '1.0',
      signedAt: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };
    
    // Update profile completion status
    await user.updateProfileCompletion();
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Profile completed successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        photoUrl: user.photoUrl,
        profileComplete: user.profileComplete,
      }
    });
    
  } catch (error) {
    console.error('Profile completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete profile',
      error: error.message
    });
  }
});

/**
 * GET /api/users/profile-status
 * Check if user profile is complete
 */
router.get('/profile-status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      profileComplete: user.profileComplete || false,
      missingFields: []
        .concat(!user.phone ? ['phone'] : [])
        .concat(!user.address?.zipCode ? ['zipCode'] : [])
        .concat(!user.agreement.signed ? ['termsOfService'] : [])
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
