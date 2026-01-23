const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyGoogleToken } = require('../services/googleAuth');

/**
 * POST /api/auth/google
 * Authenticate user with Google OAuth
 */
router.post('/', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required'
      });
    }
    
    // Verify token with Google
    let googleUser;
    try {
      googleUser = await verifyGoogleToken(idToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token',
        error: error.message
      });
    }
    
    // Check if user exists
    let user = await User.findOne({ 
      $or: [
        { email: googleUser.email },
        { socialId: googleUser.googleId, authProvider: 'google' }
      ]
    });
    
    const isNewUser = !user;
    
    if (user) {
      // Existing user - update Google ID if not set
      if (!user.socialId || user.authProvider !== 'google') {
        user.socialId = googleUser.googleId;
        user.authProvider = 'google';
        if (googleUser.photoUrl) user.photoUrl = googleUser.photoUrl;
        await user.save();
      }
    } else {
      // New user - create account
      user = new User({
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        socialId: googleUser.googleId,
        authProvider: 'google',
        photoUrl: googleUser.photoUrl,
        password: Math.random().toString(36), // Random password (won't be used)
        agreement: {
          signed: true,
          signedAt: new Date(),
        }
      });
      
      await user.save();
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return user data and token
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
        authProvider: user.authProvider,
      },
      message: isNewUser ? 'Account created successfully' : 'Login successful'
    });
    
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
});

module.exports = router;
