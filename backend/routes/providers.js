const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Provider = require('../models/Provider');

const JWT_SECRET = process.env.JWT_SECRET || 'findr-health-secret-key-change-in-production';

// Get all providers (for admin)
router.get('/', async (req, res) => {
  try {
    const providers = await Provider.find().sort({ createdAt: -1 });
    res.json(providers);
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// Get single provider
router.get('/:id', async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    res.json(provider);
  } catch (error) {
    console.error('Get provider error:', error);
    res.status(500).json({ error: 'Failed to fetch provider' });
  }
});

// Create new provider (onboarding submission)
router.post('/', async (req, res) => {
  try {
    const {
      placeId,
      practiceName,
      providerTypes,
      phone,
      email,
      address,
      website,
      photos,
      services,
      optionalInfo,
      teamMembers,
      agreement,
      password  // NEW: password field
    } = req.body;

    // Validation
    if (!practiceName || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!providerTypes || providerTypes.length === 0) {
      return res.status(400).json({ error: 'At least one provider type required' });
    }

    if (!services || services.length < 1) {
      return res.status(400).json({ error: 'At least 1 service required' });
    }

    if (!agreement || !agreement.signature) {
      return res.status(400).json({ error: 'Agreement signature required' });
    }

    // Check if provider already exists
    const existingProvider = await Provider.findOne({ 
      $or: [{ 'contactInfo.email': email.toLowerCase() }, { placeId }]
    });

    if (existingProvider) {
      return res.status(400).json({ 
        error: 'A provider with this email or business already exists',
        providerId: existingProvider._id
      });
    }

    // Create provider
    const provider = new Provider({
      placeId,
      practiceName,
      providerTypes,
      password,  // Will be hashed by pre-save hook
      contactInfo: {
        phone,
        email: email.toLowerCase(),
        website
      },
      address: {
        street: address.street,
        suite: address.suite,
        city: address.city,
        state: address.state,
        zip: address.zip
      },
      photos: photos ? photos.map((photo, index) => ({
        url: photo,
        isPrimary: index === 0
      })) : [],
      services: services.map(service => ({
        serviceId: service.id || service.serviceId,
        name: service.name,
        category: service.category,
        duration: service.duration,
        price: service.price,
        description: service.description
      })),
      credentials: optionalInfo ? {
        licenseNumber: optionalInfo.licenseNumber,
        licenseState: optionalInfo.licenseState,
        licenseExpiration: optionalInfo.licenseExpiration,
        certifications: optionalInfo.certifications,
        yearsExperience: optionalInfo.yearsExperience,
        education: optionalInfo.education
      } : undefined,
      insuranceAccepted: optionalInfo?.insuranceAccepted,
      languagesSpoken: optionalInfo?.languagesSpoken,
      teamMembers: teamMembers?.map(member => ({
        name: member.name,
        title: member.title,
        photo: member.photo,
        bio: member.bio
      })),
      agreement: {
        signed: true,
        signedAt: new Date(agreement.agreedDate),
        signature: agreement.signature,
        signerTitle: agreement.title,
        version: agreement.version || '2025'
      },
      status: 'pending',
      visibility: 'hidden'
    });

    await provider.save();

    console.log('✅ Provider created:', provider._id);

    // Generate token for immediate login after registration
    const token = jwt.sign(
      { providerId: provider._id, email: provider.contactInfo.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Provider profile submitted successfully',
      providerId: provider._id,
      token,
      status: 'pending'
    });

  } catch (error) {
    console.error('Create provider error:', error);
    res.status(500).json({ error: 'Failed to create provider profile', details: error.message });
  }
});

// Update provider
router.put('/:id', async (req, res) => {
  try {
    // Don't allow password updates through this route
    const updateData = { ...req.body };
    delete updateData.password;

    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    res.json(provider);
  } catch (error) {
    console.error('Update provider error:', error);
    res.status(500).json({ error: 'Failed to update provider' });
  }
});

// Delete provider
router.delete('/:id', async (req, res) => {
  try {
    const provider = await Provider.findByIdAndDelete(req.params.id);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    res.json({ message: 'Provider deleted successfully' });
  } catch (error) {
    console.error('Delete provider error:', error);
    res.status(500).json({ error: 'Failed to delete provider' });
  }
});

// Provider login with password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find provider by email
    const provider = await Provider.findOne({ 
      $or: [
        { 'contactInfo.email': email.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    }).select('+password');

    if (!provider) {
      return res.status(404).json({ error: 'No provider found with this email. Please complete onboarding first.' });
    }

    // If password provided, verify it
    if (password) {
      // Check if provider has a password set
      if (!provider.password) {
        return res.status(400).json({ 
          error: 'Password not set. Please use the legacy login or reset your password.',
          legacyLogin: true,
          providerId: provider._id
        });
      }

      const isMatch = await provider.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { providerId: provider._id, email: provider.contactInfo?.email || email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        token,
        providerId: provider._id,
        provider: {
          _id: provider._id,
          practiceName: provider.practiceName,
          providerTypes: provider.providerTypes,
          contactInfo: provider.contactInfo,
          address: provider.address,
          status: provider.status
        }
      });
    }

    // Legacy flow: no password provided, send verification code
    res.json({ 
      success: true, 
      providerId: provider._id,
      hasPassword: !!provider.password,
      message: provider.password 
        ? 'Password required for this account' 
        : 'Verification code sent (demo mode - use any 6-digit code)'
    });

  } catch (error) {
    console.error('Provider login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify login code (legacy - for providers without passwords)
router.post('/verify-login', async (req, res) => {
  try {
    const { providerId, code } = req.body;

    if (!providerId || !code) {
      return res.status(400).json({ error: 'Provider ID and code are required' });
    }

    // Find provider
    const provider = await Provider.findById(providerId);

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // For demo, accept any 6-digit code
    if (code.length !== 6) {
      return res.status(400).json({ error: 'Invalid code format' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { providerId: provider._id, email: provider.contactInfo?.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      providerId: provider._id,
      provider: {
        _id: provider._id,
        practiceName: provider.practiceName,
        providerTypes: provider.providerTypes,
        contactInfo: provider.contactInfo,
        address: provider.address,
        status: provider.status
      }
    });

  } catch (error) {
    console.error('Verify login error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Set password for existing provider (migration or first-time setup)
router.post('/set-password', async (req, res) => {
  try {
    const { providerId, email, password, currentPassword } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    let provider;

    if (providerId) {
      provider = await Provider.findById(providerId).select('+password');
    } else if (email) {
      provider = await Provider.findOne({
        $or: [
          { 'contactInfo.email': email.toLowerCase() },
          { email: email.toLowerCase() }
        ]
      }).select('+password');
    }

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // If provider already has password, require current password
    if (provider.password && currentPassword) {
      const isMatch = await provider.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    // Set new password
    provider.password = password;
    await provider.save();

    // Generate new token
    const token = jwt.sign(
      { providerId: provider._id, email: provider.contactInfo?.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Password set successfully',
      token,
      providerId: provider._id
    });

  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({ error: 'Failed to set password' });
  }
});

// Check if provider has password (for login UI)
router.post('/check-auth', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const provider = await Provider.findOne({
      $or: [
        { 'contactInfo.email': email.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    }).select('password practiceName');

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    res.json({
      exists: true,
      hasPassword: !!provider.password,
      practiceName: provider.practiceName
    });

  } catch (error) {
    console.error('Check auth error:', error);
    res.status(500).json({ error: 'Failed to check authentication' });
  }
});

module.exports = router;
