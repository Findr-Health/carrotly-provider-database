const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'findr-health-user-secret-2025';
const JWT_EXPIRES_IN = '30d';

// Auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// ==================== AUTH ROUTES ====================

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, agreedToTerms, termsVersion } = req.body;
    
    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'Email, password, first name, and last name are required' 
      });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters' 
      });
    }

    // Terms acceptance is required
    if (!agreedToTerms) {
      return res.status(400).json({ 
        error: 'You must agree to the Terms of Service to create an account' 
      });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Get client IP and user agent
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    
    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      phone,
      agreement: {
        signed: true,
        version: termsVersion || '2.0',
        signedAt: new Date(),
        ipAddress: ipAddress,
        userAgent: userAgent
      }
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Account is suspended' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Update last login
    user.lastLoginAt = new Date();
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        phone: user.phone,
        photoUrl: user.photoUrl
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ==================== PROFILE ROUTES ====================

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('favorites', 'practiceName providerTypes address photos rating reviewCount isVerified');
    
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'phone', 'photoUrl', 'dateOfBirth', 'location', 'notificationPreferences'];
    const updates = {};
    
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true }
    );
    
    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    
    const user = await User.findById(req.userId).select('+password');
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ==================== FAVORITES ROUTES ====================

// Get favorites
router.get('/favorites', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('favorites', 'practiceName providerTypes address photos rating reviewCount isVerified primaryPhoto');
    
    res.json(user.favorites || []);
  } catch (error) {
    console.error('Favorites error:', error);
    res.status(500).json({ error: 'Failed to get favorites' });
  }
});

// Add favorite
router.post('/favorites/:providerId', auth, async (req, res) => {
  try {
    const { providerId } = req.params;
    
    const user = await User.findById(req.userId);
    
    if (user.favorites.includes(providerId)) {
      return res.status(400).json({ error: 'Provider already in favorites' });
    }
    
    user.favorites.push(providerId);
    await user.save();
    
    res.json({ message: 'Added to favorites', favorites: user.favorites });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// Remove favorite
router.delete('/favorites/:providerId', auth, async (req, res) => {
  try {
    const { providerId } = req.params;
    
    const user = await User.findById(req.userId);
    user.favorites = user.favorites.filter(id => id.toString() !== providerId);
    await user.save();
    
    res.json({ message: 'Removed from favorites', favorites: user.favorites });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

// Check if provider is favorited
router.get('/favorites/:providerId/check', auth, async (req, res) => {
  try {
    const { providerId } = req.params;
    const user = await User.findById(req.userId);
    
    res.json({ 
      isFavorite: user.favorites.includes(providerId) 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check favorite status' });
  }
});

// ==================== DEVICE TOKEN ROUTES ====================

// Register device for push notifications
router.post('/devices', auth, async (req, res) => {
  try {
    const { token, platform, deviceModel } = req.body;
    
    if (!token || !platform) {
      return res.status(400).json({ error: 'Token and platform required' });
    }
    
    const user = await User.findById(req.userId);
    
    // Remove existing token if present
    user.deviceTokens = user.deviceTokens.filter(d => d.token !== token);
    
    // Add new token
    user.deviceTokens.push({
      token,
      platform,
      deviceModel,
      addedAt: new Date()
    });
    
    await user.save();
    
    res.json({ message: 'Device registered' });
  } catch (error) {
    console.error('Device registration error:', error);
    res.status(500).json({ error: 'Failed to register device' });
  }
});

// Remove device token
router.delete('/devices/:token', auth, async (req, res) => {
  try {
    const { token } = req.params;
    
    const user = await User.findById(req.userId);
    user.deviceTokens = user.deviceTokens.filter(d => d.token !== token);
    await user.save();
    
    res.json({ message: 'Device removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove device' });
  }
});

module.exports = router;

// ============ SOCIAL AUTH ROUTES ============

// Google Sign In
router.post('/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    // Verify Google token (in production, use google-auth-library)
    // For now, decode the JWT payload (not secure for production)
    const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
    
    const { email, given_name, family_name, sub: googleId, picture } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Email not found in token' });
    }

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Create new user
      user = new User({
        email: email.toLowerCase(),
        firstName: given_name || 'User',
        lastName: family_name || '',
        password: require('crypto').randomBytes(32).toString('hex'), // Random password
        authProvider: 'google',
        socialId: googleId,
        photoUrl: picture,
        emailVerified: true
      });
      await user.save();
    } else if (!user.socialId) {
      // Link existing email user to Google
      user.authProvider = 'google';
      user.socialId = googleId;
      if (picture && !user.photoUrl) user.photoUrl = picture;
      await user.save();
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        authProvider: user.authProvider
      }
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Apple Sign In
router.post('/auth/apple', async (req, res) => {
  try {
    const { identityToken, email, firstName, lastName } = req.body;
    
    if (!identityToken) {
      return res.status(400).json({ error: 'Identity token is required' });
    }

    // Decode Apple JWT (in production, verify with Apple's public keys)
    const payload = JSON.parse(Buffer.from(identityToken.split('.')[1], 'base64').toString());
    const { sub: appleId, email: tokenEmail } = payload;
    
    const userEmail = email || tokenEmail;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find or create user
    let user = await User.findOne({ 
      $or: [
        { email: userEmail.toLowerCase() },
        { socialId: appleId, authProvider: 'apple' }
      ]
    });
    
    if (!user) {
      user = new User({
        email: userEmail.toLowerCase(),
        firstName: firstName || 'Apple',
        lastName: lastName || 'User',
        password: require('crypto').randomBytes(32).toString('hex'),
        authProvider: 'apple',
        socialId: appleId,
        emailVerified: true
      });
      await user.save();
    } else if (!user.socialId) {
      user.authProvider = 'apple';
      user.socialId = appleId;
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        authProvider: user.authProvider
      }
    });
  } catch (err) {
    console.error('Apple auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Facebook Sign In
router.post('/auth/facebook', async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    // Fetch user data from Facebook Graph API
    const fetch = require('node-fetch');
    const fbResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,email,first_name,last_name,picture&access_token=${accessToken}`
    );
    
    if (!fbResponse.ok) {
      return res.status(401).json({ error: 'Invalid Facebook token' });
    }

    const fbData = await fbResponse.json();
    const { id: facebookId, email, first_name, last_name, picture } = fbData;

    if (!email) {
      return res.status(400).json({ error: 'Email permission is required' });
    }

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      user = new User({
        email: email.toLowerCase(),
        firstName: first_name || 'Facebook',
        lastName: last_name || 'User',
        password: require('crypto').randomBytes(32).toString('hex'),
        authProvider: 'facebook',
        socialId: facebookId,
        photoUrl: picture?.data?.url,
        emailVerified: true
      });
      await user.save();
    } else if (!user.socialId) {
      user.authProvider = 'facebook';
      user.socialId = facebookId;
      if (picture?.data?.url && !user.photoUrl) user.photoUrl = picture.data.url;
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        authProvider: user.authProvider
      }
    });
  } catch (err) {
    console.error('Facebook auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});
