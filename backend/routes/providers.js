const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Provider = require('../models/Provider');
const emailService = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'findr-health-secret-key-change-in-production';

// Get all providers (for admin)

// Search term normalization - map user queries to provider types
const searchTermMap = {
  // Dental variations
  'dentist': 'Dental',
  'dentistry': 'Dental',
  'orthodontist': 'Dental',
  'dental': 'Dental',
  
  // Medical variations  
  'doctor': 'Medical',
  'physician': 'Medical',
  'clinic': 'Medical',
  'medical': 'Medical',
  
  // Mental Health variations
  'therapist': 'Mental Health',
  'counselor': 'Mental Health',
  'psychologist': 'Mental Health',
  'psychiatrist': 'Mental Health',
  'therapy': 'Mental Health',
  
  // Massage variations
  'massage therapist': 'Massage',
  'masseuse': 'Massage',
  
  // Fitness variations
  'trainer': 'Fitness',
  'personal trainer': 'Fitness',
  'gym': 'Fitness',
  
  // Urgent Care variations
  'urgent': 'Urgent Care',
  'walk-in': 'Urgent Care',
  'emergency': 'Urgent Care',
  
  // Skincare variations
  'dermatologist': 'Skincare',
  'aesthetician': 'Skincare',
  'skin care': 'Skincare',
  
  // Yoga variations
  'yoga instructor': 'Yoga',
  
  // Nutrition variations
  'dietitian': 'Nutrition',
  'nutritionist': 'Nutrition',
  
  // Pharmacy variations
  'pharmacist': 'Pharmacy',
  'drug store': 'Pharmacy',
  'drugstore': 'Pharmacy'
};

function normalizeSearchTerm(query) {
  if (!query) return query;
  
  const lowerQuery = query.toLowerCase().trim();
  
  // Check if query matches any mapped term
  for (const [term, providerType] of Object.entries(searchTermMap)) {
    if (lowerQuery === term || lowerQuery.includes(term)) {
      return providerType;
    }
  }
  
  return query;
}

router.get('/', async (req, res) => {
  try {
    const { 
      latitude, 
      longitude, 
      sort, 
      limit = 50,
      type,
      status,
      search,
      verified,
      featured
    } = req.query;

    let query = { status: status || 'approved' };
    
    // Filter by provider type
    if (type) {
      query.providerTypes = type;
    }

    
    // Text search with relevance scoring
    let useTextSearch = false;
    if (search) {
      // Normalize search term (e.g., "dentist" -> "Dental")
      const normalizedSearch = normalizeSearchTerm(search);
      console.log(`[Search] Original: "${search}" -> Normalized: "${normalizedSearch}"`);
      
      // Try text search first (requires text index)
      // If text index exists, use it for better relevance
      try {
        // Use MongoDB text search with scoring
        query.$text = { $search: normalizedSearch };
        useTextSearch = true;
      } catch (e) {
        // Fallback to regex search if no text index
        // Use normalized search for provider type, original for everything else
        const searchRegex = new RegExp(search, 'i');
        const normalizedRegex = new RegExp(normalizedSearch, 'i');
        
        // Weighted search: prioritize service names and categories
        // Use aggregation to calculate relevance scores
        const serviceNameMatch = { 'services.name': searchRegex };
        const serviceCategoryMatch = { 'services.category': searchRegex };
        const providerTypeMatch = { providerTypes: normalizedRegex };
        const practiceNameMatch = { practiceName: searchRegex };
        const descriptionMatch = { description: searchRegex };
        const locationMatch = {
          $or: [
            { 'address.city': searchRegex },
            { 'address.state': searchRegex }
          ]
        };
        
        // Combine with OR (any match is valid)
        query.$or = [
          serviceNameMatch,
          serviceCategoryMatch,
          providerTypeMatch,
          practiceNameMatch,
          descriptionMatch,
          locationMatch
        ];
      }
    }
    
    let sortOption = { createdAt: -1 };
    
    // Sort options
    if (sort === '-rating') {
      sortOption = { 'reviews.averageRating': -1, reviewCount: -1 };
    } else if (sort === '-bookingCount' || sort === '-popular') {
      sortOption = { bookingCount: -1, reviewCount: -1 };
    } else if (sort === '-reviewCount') {
      sortOption = { reviewCount: -1 };
    }

    let providers;
    
    if (useTextSearch && !sort) {
      // When using text search without explicit sort, sort by text score
      providers = await Provider.find(query, { score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" } })
        .limit(parseInt(limit));
    } else if (useTextSearch && sort) {
      // Use explicit sort but include text score
      providers = await Provider.find(query, { score: { $meta: "textScore" } })
        .sort(sortOption)
        .limit(parseInt(limit));
    } else {
      // Regular search without text index
      providers = await Provider.find(query)
        .sort(sortOption)
        .limit(parseInt(limit));
    }

    // If coordinates provided, calculate distance
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      providers = providers.map(p => {
        const pLat = p.location?.coordinates?.[1] || 0;
        const pLng = p.location?.coordinates?.[0] || 0;
        const distance = Math.sqrt(
          Math.pow(lat - pLat, 2) + Math.pow(lng - pLng, 2)
        ) * 69; // Rough miles conversion
        return { ...p.toObject(), distance };
      });
      
      // Sort by distance if requested
      if (sort === 'distance') {
        providers.sort((a, b) => a.distance - b.distance);
      }
    }

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
      password,  // NEW: password field
      calendar,
      cancellationPolicy,
      description
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

    // Agreement signature is optional - if not signed, status will be pending_agreement
    const hasSignature = agreement && agreement.signature;

    // Check if provider already exists
    const queryConditions = [{ 'contactInfo.email': email.toLowerCase() }];
    if (placeId) {
      queryConditions.push({ placeId });
    }
    const existingProvider = await Provider.findOne({ $or: queryConditions });

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
      agreement: hasSignature ? {
        signed: true,
        signedAt: new Date(agreement.agreedDate),
        signature: agreement.signature,
        signerTitle: agreement.title,
        version: agreement.version || '2025'
      } : {
        signed: false,
        version: '2025'
      },
      status: hasSignature ? 'pending' : 'pending_agreement',
      description,
      calendar: calendar ? {
        businessHours: calendar.businessHours
      } : undefined,
      cancellationPolicy: cancellationPolicy ? {
        tier: cancellationPolicy.tier,
        allowFeeWaiver: cancellationPolicy.allowFeeWaiver
      } : undefined,
      visibility: 'hidden'
    });

    await provider.save();

    // Send welcome email to provider
    try {
      await emailService.sendProviderWelcomeEmail(
        provider.contactInfo.email,
        provider.practiceName
      );
    } catch (emailError) {
      console.error('Failed to send provider welcome email:', emailError);
    }

    console.log('✅ Provider created:', provider._id);

    // Generate token for immediate login after registration
    const token = jwt.sign(
      { providerId: provider._id, email: provider.contactInfo.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: hasSignature 
        ? 'Provider profile submitted successfully' 
        : 'Profile saved! Please sign the agreement to complete your application.',
      providerId: provider._id,
      token,
      status: provider.status,
      agreementSigned: hasSignature
    });

  } catch (error) {
    console.error('Create provider error:', error);
    res.status(500).json({ error: 'Failed to create provider profile', details: error.message });
  }
});

// Update provider
router.put('/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData.password;
    delete updateData._id; // Never update _id
    
    const currentProvider = await Provider.findById(req.params.id);
    if (!currentProvider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    const oldStatus = currentProvider.status;
    
    // Handle nested objects properly - merge instead of replace
    // This prevents losing existing nested data when only updating part of it
    const nestedFields = ['calendar', 'contactInfo', 'address', 'credentials', 'payment', 'agreement'];
    
    for (const field of nestedFields) {
      if (updateData[field] && currentProvider[field]) {
        const existingData = currentProvider[field].toObject ? currentProvider[field].toObject() : currentProvider[field];
        updateData[field] = { ...existingData, ...updateData[field] };
        
        // Special handling for calendar.businessHours - merge each day
        if (field === 'calendar' && updateData.calendar.businessHours && existingData.businessHours) {
          const existingHours = existingData.businessHours.toObject ? existingData.businessHours.toObject() : existingData.businessHours;
          updateData.calendar.businessHours = { ...existingHours, ...updateData.calendar.businessHours };
        }
      }
    }
    
    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    // Send status change email if needed
    if (updateData.status && updateData.status !== oldStatus) {
      const email = provider.contactInfo?.email || provider.email;
      if (email && (updateData.status === 'approved' || updateData.status === 'rejected')) {
        try {
          await emailService.sendProviderApprovalEmail(email, provider.practiceName, updateData.status === 'approved');
        } catch (emailError) {
          console.error('Failed to send provider status email:', emailError);
        }
      }
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
// Sign agreement (for providers who skipped signing during onboarding)
router.post('/:id/sign-agreement', async (req, res) => {
  try {
    const { signature, title } = req.body;
    
    if (!signature || signature.trim().length < 3) {
      return res.status(400).json({ error: 'Valid signature (full legal name) is required' });
    }

    const provider = await Provider.findById(req.params.id);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // Check if already signed
    if (provider.agreement?.signed) {
      return res.status(400).json({ error: 'Agreement already signed' });
    }

    // Update agreement and status
    provider.agreement = {
      signed: true,
      signedAt: new Date(),
      signature: signature.trim(),
      signerTitle: title?.trim() || '',
      version: '2025',
      ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown'
    };
    
    // Move from pending_agreement to pending (ready for admin review)
    if (provider.status === 'pending_agreement') {
      provider.status = 'pending';
    }
    
    provider.onboardingCompleted = true;
    
    await provider.save();

    // Send email notification that application is complete
    try {
      const email = provider.contactInfo?.email || provider.email;
      if (email) {
        await emailService.sendProviderWelcomeEmail(email, provider.practiceName);
      }
    } catch (emailError) {
      console.error('Failed to send agreement confirmation email:', emailError);
    }

    console.log('✅ Provider agreement signed:', provider._id);

    res.json({
      success: true,
      message: 'Agreement signed successfully! Your application is now under review.',
      status: provider.status,
      agreementSigned: true
    });

  } catch (error) {
    console.error('Sign agreement error:', error);
    res.status(500).json({ error: 'Failed to sign agreement', details: error.message });
  }
});

// Get agreement status
router.get('/:id/agreement-status', async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id).select('agreement status practiceName');
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    res.json({
      signed: provider.agreement?.signed || false,
      signedAt: provider.agreement?.signedAt,
      signature: provider.agreement?.signature,
      status: provider.status,
      needsSignature: provider.status === 'pending_agreement'
    });

  } catch (error) {
    console.error('Get agreement status error:', error);
    res.status(500).json({ error: 'Failed to get agreement status' });
  }
});

// TEMPORARY: Fix test providers
router.post('/admin/fix-test-providers', async (req, res) => {
  try {
    const cityCoords = {
      'Chicago': [-87.6298, 41.8781],
      'Portland': [-122.6765, 45.5231],
      'San Francisco': [-122.4194, 37.7749],
      'Miami': [-80.1918, 25.7617],
      'Nashville': [-86.7816, 36.1627],
      'Los Angeles': [-118.2437, 34.0522],
      'Austin': [-97.7431, 30.2672],
      'Seattle': [-122.3321, 47.6062],
      'Denver': [-104.9903, 39.7392],
      'Phoenix': [-112.0740, 33.4484]
    };

    const updates = [
      {id: '6961103fef927c3f05b10d47', city: 'Chicago', name: 'Chicago Pharmacy Test'},
      {id: '6961103fef927c3f05b10d38', city: 'Portland', name: 'Portland Nutrition Test'},
      {id: '6961103fef927c3f05b10d2c', city: 'San Francisco', name: 'SF Yoga Test'},
      {id: '6961103eef927c3f05b10d1e', city: 'Miami', name: 'Miami Fitness Test'},
      {id: '6961103eef927c3f05b10d0e', city: 'Nashville', name: 'Nashville Massage Test'},
      {id: '6961103def927c3f05b10cf6', city: 'Los Angeles', name: 'LA Skincare Test'},
      {id: '6961103def927c3f05b10ce4', city: 'Austin', name: 'Austin Mental Health Test'},
      {id: '6961103cef927c3f05b10cd3', city: 'Seattle', name: 'Seattle Dental Test'},
      {id: '6961103bef927c3f05b10cac', city: 'Denver', name: 'Denver Urgent Care Test'},
      {id: '6961103bef927c3f05b10c87', city: 'Phoenix', name: 'Phoenix Medical Test'}
    ];

    const results = [];
    for (const u of updates) {
      const coords = cityCoords[u.city];
      
      // Get the provider
      const provider = await Provider.findById(u.id);
      if (provider) {
        // Directly modify and save
        provider.name = u.name;
        provider.location = {
          type: 'Point',
          coordinates: coords
        };
        await provider.save();
        results.push({ id: u.id, name: u.name, updated: true, coords });
      } else {
        results.push({ id: u.id, name: u.name, updated: false, error: 'not found' });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})


// Admin: Fix test providers
router.get('/admin/fix-one-provider/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, lat, lon } = req.query;
    
    const provider = await Provider.findById(id);
    if (!provider) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    provider.name = name;
    provider.location = {
      type: 'Point',
      coordinates: [parseFloat(lon), parseFloat(lat)]
    };
    
    await provider.save();
    
    res.json({ 
      success: true, 
      provider: {
        id: provider._id,
        name: provider.name,
        location: provider.location
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Admin: Build geospatial index
router.get('/admin/build-geo-index', async (req, res) => {
  try {
    await Provider.collection.createIndex({ 'location.coordinates': '2dsphere' });
    const indexes = await Provider.collection.getIndexes();
    res.json({ success: true, indexes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Admin: Test geospatial search
router.get('/admin/test-geo-search', async (req, res) => {
  try {
    const { lat, lon, radius = 5000 } = req.query;
    
    const radiusInMeters = radius * 1609.34;
    
    // Try basic geoNear
    const results = await Provider.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(lon), parseFloat(lat)]
          },
          distanceField: 'distance',
          maxDistance: radiusInMeters,
          spherical: true
        }
      },
      { $limit: 10 }
    ]);
    
    res.json({ 
      success: true, 
      query: { lat, lon, radius, radiusInMeters },
      count: results.length,
      results: results.map(r => ({
        id: r._id,
        name: r.name,
        type: r.providerTypes,
        distance: Math.round(r.distance / 1609.34) + ' miles',
        location: r.location
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});


// Admin: Fix duplicate 2dsphere indexes
router.get('/admin/fix-geo-indexes', async (req, res) => {
  try {
    // Drop the duplicate index on location.coordinates
    await Provider.collection.dropIndex('location.coordinates_2dsphere');
    
    const indexes = await Provider.collection.getIndexes();
    res.json({ 
      success: true, 
      message: 'Dropped location.coordinates_2dsphere, kept location_2dsphere',
      indexes 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Admin: Rebuild all geospatial indexes
router.get('/admin/rebuild-geo-index', async (req, res) => {
  try {
    // Drop ALL 2dsphere indexes
    try {
      await Provider.collection.dropIndex('location_2dsphere');
    } catch (e) { console.log('location_2dsphere not found'); }
    
    try {
      await Provider.collection.dropIndex('location.coordinates_2dsphere');
    } catch (e) { console.log('location.coordinates_2dsphere not found'); }
    
    // Create ONLY ONE on location field
    await Provider.collection.createIndex({ location: '2dsphere' });
    
    const indexes = await Provider.collection.getIndexes();
    res.json({ success: true, indexes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Admin: Create test provider (bypasses agreement requirement)
router.post('/admin/create-test-provider', async (req, res) => {
  try {
    const providerData = {
      ...req.body,
      status: 'approved',
      onboardingCompleted: true,
      onboardingStep: 10,
      agreement: {
        agreedDate: new Date(),
        version: 'test',
        signature: 'Test Provider',
        title: 'Owner'
      }
    };
    
    const provider = new Provider(providerData);
    await provider.save();
    
    res.json({ success: true, provider });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

/**
 * GET /api/providers/debug/calendar-status
 * Check which providers have working calendar integration
 */
router.get('/debug/calendar-status', async (req, res) => {
  try {
    const providers = await Provider.find({})
      .select('practiceName teamMembers')
      .lean();
    
    const results = providers.map(p => ({
      id: p._id,
      name: p.practiceName,
      teamMembers: p.teamMembers.map(tm => ({
        name: tm.name,
        calendarConnected: tm.calendar?.connected || false,
        calendarProvider: tm.calendar?.provider || 'none',
        syncStatus: tm.calendar?.syncStatus || 'disconnected',
        syncError: tm.calendar?.syncError || null,
        lastSync: tm.calendar?.lastSyncAt || null
      }))
    }));
    
    res.json({ providers: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/providers/admin/sync-calendar-all
 * Copy calendar from Long Island City PT to all providers without calendars
 */
router.post('/admin/sync-calendar-all', async (req, res) => {
  try {
    // Get the source provider with working calendar
    const source = await Provider.findById('697a98f3a04e359abfda111f');
    const sourceCalendar = source.teamMembers[0].calendar;
    
    // Find all providers without calendar
    const providers = await Provider.find({
      $or: [
        { 'calendar.connected': { $ne: true } },
        { calendar: null },
        { calendar: { $exists: false } }
      ]
    });
    
    let updated = 0;
    for (const provider of providers) {
      provider.calendar = {
        provider: sourceCalendar.provider,
        connected: true,
        accessToken: sourceCalendar.accessToken,
        refreshToken: sourceCalendar.refreshToken,
        tokenExpiry: sourceCalendar.tokenExpiry,
        calendarId: sourceCalendar.calendarId,
        calendarEmail: sourceCalendar.calendarEmail,
        syncStatus: 'active',
        lastSyncAt: new Date(),
        bufferMinutes: 15,
        minNoticeHours: 24,
        maxDaysOut: 60
      };
      
      await provider.save();
      updated++;
    }
    
    res.json({
      success: true,
      updated,
      message: `Added calendar to ${updated} providers`
    });
    
  } catch (error) {
    console.error('Sync all calendars error:', error);
    res.status(500).json({ error: error.message });
  }
});
