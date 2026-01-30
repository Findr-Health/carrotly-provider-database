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

// ==================== AUTHENTICATED USER ROUTES ====================
/**
 * GET /api/users/me
 * Get current authenticated user's profile
 */
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .lean();
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        photoUrl: user.photoUrl,
        authProvider: user.authProvider,
        profileComplete: user.profileComplete,
        favorites: user.favorites,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get user profile' 
    });
  }
});


// ==================== AUTH ROUTES ====================

// Register new user

// =============================================================================
// ADMIN: List all users
// =============================================================================

/**
 * GET /api/users
 * Admin route to list all users
 */
router.get('/', async (req, res) => {
  try {
    const { status, search, limit = 50, skip = 0 } = req.query;
    
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const total = await User.countDocuments(query);
    
    res.json({ users, total });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

/**
 * GET /api/users/:id
 * Admin route to get single user
 */

/**
 * PUT /api/users/:id
 * Admin route to update user
 */
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

router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Don't allow password update via this route
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * PATCH /api/users/:id/status
 * Admin route to update user status
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

/**
 * POST /api/users/:id/admin-reset-password
 * Admin route to reset user password
 */
router.post('/:id/admin-reset-password', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { password: hashedPassword },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

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

router.get('/:id', async (req, res) => {
  try {
    // Handle 'me' as current user
    let userId = req.params.id;
    if (userId === 'me') {
      // Requires authentication - get from JWT token
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      userId = req.user.userId;
    }
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
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

// ============================================================
// DELETE ACCOUNT
// ============================================================
router.delete('/me', auth, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password required to delete account' });
    }
    
    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }
    
    // Cancel any pending bookings
    const Booking = require('../models/Booking');
    await Booking.updateMany(
      { user: user._id, status: 'pending' },
      { status: 'cancelled', cancelledAt: new Date(), cancellationReason: 'Account deleted' }
    );
    
    // Delete the user
    await User.findByIdAndDelete(user._id);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ============================================================
// DELETE ACCOUNT
// ============================================================
router.delete('/me', auth, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password required to delete account' });
    }
    
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }
    
    const Booking = require('../models/Booking');
    await Booking.updateMany(
      { user: user._id, status: 'pending' },
      { status: 'cancelled', cancelledAt: new Date(), cancellationReason: 'Account deleted' }
    );
    
    await User.findByIdAndDelete(user._id);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// =============================================================================
// ADMIN: Get user payment methods (Stripe)
// =============================================================================

/**
 * GET /api/users/:id/payment-methods
 * Admin route to view user's saved payment methods from Stripe
 */
router.get('/:id/payment-methods', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.stripeCustomerId) {
      return res.json({ 
        hasStripeCustomer: false,
        methods: [] 
      });
    }
    
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Get payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });
    
    // Get default payment method
    const customer = await stripe.customers.retrieve(user.stripeCustomerId);
    const defaultPaymentMethod = customer.invoice_settings?.default_payment_method;
    
    const methods = paymentMethods.data.map(pm => ({
      id: pm.id,
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
      isDefault: pm.id === defaultPaymentMethod
    }));
    
    res.json({
      hasStripeCustomer: true,
      customerId: user.stripeCustomerId,
      methods: methods
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Failed to get payment methods' });
  }
});

module.exports = router;
