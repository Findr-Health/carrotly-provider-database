const express = require('express');
const router = express.Router();
const Provider = require('../models/Provider');

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
      agreement
    } = req.body;

    // Validation
    if (!practiceName || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!providerTypes || providerTypes.length === 0) {
      return res.status(400).json({ error: 'At least one provider type required' });
    }

    if (!services || services.length < 2) {
      return res.status(400).json({ error: 'At least 2 services required' });
    }

    if (!agreement || !agreement.signature) {
      return res.status(400).json({ error: 'Agreement signature required' });
    }

    // Check if provider already exists
    const existingProvider = await Provider.findOne({ 
      $or: [{ 'contactInfo.email': email }, { placeId }]
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
      contactInfo: {
        phone,
        email,
        website
      },
      address: {
        street: address.street,
        suite: address.suite,
        city: address.city,
        state: address.state,
        zip: address.zip
      },
      photos: photos.map((photo, index) => ({
        url: photo,
        isPrimary: index === 0
      })),
      services: services.map(service => ({
        serviceId: service.id || service.serviceId,
        name: service.name,
        category: service.category,
        duration: service.duration,
        price: service.price
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

    res.status(201).json({
      success: true,
      message: 'Provider profile submitted successfully',
      providerId: provider._id,
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
    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
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

module.exports = router;
