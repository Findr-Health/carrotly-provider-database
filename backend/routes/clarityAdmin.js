/**
 * Clarity Admin Routes
 * API endpoints for managing inquiries, services, providers, and prices
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Models
const Inquiry = require('../models/Inquiry');
const Service = require('../models/Service');
const ClarityProvider = require('../models/ClarityProvider');
const Price = require('../models/Price');

const JWT_SECRET = process.env.JWT_SECRET || 'carrotly-admin-secret-2024';

// Middleware to verify admin token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// =====================
// INQUIRY ROUTES
// =====================

// Get all inquiries with filtering
router.get('/inquiries', verifyToken, async (req, res) => {
  try {
    const { 
      type, 
      status, 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const inquiries = await Inquiry.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Inquiry.countDocuments(query);
    
    // Stats
    const stats = {
      total: await Inquiry.countDocuments(),
      new: await Inquiry.countDocuments({ status: 'new' }),
      inProgress: await Inquiry.countDocuments({ status: 'in_progress' }),
      completed: await Inquiry.countDocuments({ status: 'completed' }),
      byType: {
        providerOutreach: await Inquiry.countDocuments({ type: 'provider_outreach' }),
        internationalValidation: await Inquiry.countDocuments({ type: 'international_validation' }),
        consultation: await Inquiry.countDocuments({ type: 'consultation' })
      }
    };
    
    res.json({
      inquiries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    });
  } catch (error) {
    console.error('Get inquiries error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single inquiry
router.get('/inquiries/:id', verifyToken, async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    
    res.json(inquiry);
  } catch (error) {
    console.error('Get inquiry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create inquiry (called from clarity chat)
router.post('/inquiries', async (req, res) => {
  try {
    const inquiry = new Inquiry(req.body);
    await inquiry.save();
    res.status(201).json(inquiry);
  } catch (error) {
    console.error('Create inquiry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update inquiry
router.put('/inquiries/:id', verifyToken, async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;
    updateData.updatedAt = new Date();
    
    // If marking as completed, set resolvedAt
    if (updateData.status === 'completed' && !updateData.resolvedAt) {
      updateData.resolvedAt = new Date();
    }
    
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    
    res.json(inquiry);
  } catch (error) {
    console.error('Update inquiry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update inquiry status
router.patch('/inquiries/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['new', 'in_progress', 'completed', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const updateData = { 
      status,
      updatedAt: new Date()
    };
    
    if (status === 'completed') {
      updateData.resolvedAt = new Date();
    }
    
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    
    res.json(inquiry);
  } catch (error) {
    console.error('Update inquiry status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete inquiry
router.delete('/inquiries/:id', verifyToken, async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
    
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    
    res.json({ message: 'Inquiry deleted successfully' });
  } catch (error) {
    console.error('Delete inquiry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// =====================
// SERVICE ROUTES
// =====================

// Get all services
router.get('/services', verifyToken, async (req, res) => {
  try {
    const { 
      category, 
      search,
      page = 1, 
      limit = 50,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;
    
    const query = { isActive: true };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { cptCodes: { $regex: search, $options: 'i' } }
      ];
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const services = await Service.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Service.countDocuments(query);
    
    res.json({
      services,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single service
router.get('/services/:id', verifyToken, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json(service);
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create service
router.post('/services', verifyToken, async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();
    res.status(201).json(service);
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update service
router.put('/services/:id', verifyToken, async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;
    updateData.updatedAt = new Date();
    
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json(service);
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete service (soft delete)
router.delete('/services/:id', verifyToken, async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// =====================
// CLARITY PROVIDER ROUTES
// =====================

// Get all clarity providers
router.get('/clarity-providers', verifyToken, async (req, res) => {
  try {
    const { 
      type, 
      search,
      country,
      isInternational,
      page = 1, 
      limit = 50,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;
    
    const query = { isActive: true };
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (country && country !== 'all') {
      query['address.country'] = country;
    }
    
    if (isInternational !== undefined) {
      query.isInternational = isInternational === 'true';
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'address.state': { $regex: search, $options: 'i' } }
      ];
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const providers = await ClarityProvider.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await ClarityProvider.countDocuments(query);
    
    res.json({
      providers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get clarity providers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single clarity provider
router.get('/clarity-providers/:id', verifyToken, async (req, res) => {
  try {
    const provider = await ClarityProvider.findById(req.params.id);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    res.json(provider);
  } catch (error) {
    console.error('Get clarity provider error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create clarity provider
router.post('/clarity-providers', verifyToken, async (req, res) => {
  try {
    const provider = new ClarityProvider(req.body);
    await provider.save();
    res.status(201).json(provider);
  } catch (error) {
    console.error('Create clarity provider error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update clarity provider
router.put('/clarity-providers/:id', verifyToken, async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;
    updateData.updatedAt = new Date();
    
    const provider = await ClarityProvider.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    res.json(provider);
  } catch (error) {
    console.error('Update clarity provider error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete clarity provider (soft delete)
router.delete('/clarity-providers/:id', verifyToken, async (req, res) => {
  try {
    const provider = await ClarityProvider.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    res.json({ message: 'Provider deleted successfully' });
  } catch (error) {
    console.error('Delete clarity provider error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// =====================
// PRICE ROUTES
// =====================

// Get all prices with service and provider data
router.get('/prices', verifyToken, async (req, res) => {
  try {
    const { 
      serviceId, 
      providerId,
      verified,
      page = 1, 
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = { isActive: true };
    
    if (serviceId) {
      query.serviceId = serviceId;
    }
    
    if (providerId) {
      query.providerId = providerId;
    }
    
    if (verified !== undefined) {
      query.verified = verified === 'true';
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const prices = await Price.find(query)
      .populate('serviceId', 'name category cptCodes')
      .populate('providerId', 'name type address')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Price.countDocuments(query);
    
    res.json({
      prices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get prices error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single price
router.get('/prices/:id', verifyToken, async (req, res) => {
  try {
    const price = await Price.findById(req.params.id)
      .populate('serviceId')
      .populate('providerId');
    
    if (!price) {
      return res.status(404).json({ error: 'Price not found' });
    }
    
    res.json(price);
  } catch (error) {
    console.error('Get price error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create price
router.post('/prices', verifyToken, async (req, res) => {
  try {
    const price = new Price(req.body);
    await price.save();
    
    // Populate and return
    const populatedPrice = await Price.findById(price._id)
      .populate('serviceId', 'name category')
      .populate('providerId', 'name type address');
    
    res.status(201).json(populatedPrice);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Price already exists for this service and provider' });
    }
    console.error('Create price error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update price
router.put('/prices/:id', verifyToken, async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;
    updateData.updatedAt = new Date();
    
    const price = await Price.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('serviceId', 'name category')
     .populate('providerId', 'name type address');
    
    if (!price) {
      return res.status(404).json({ error: 'Price not found' });
    }
    
    res.json(price);
  } catch (error) {
    console.error('Update price error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete price (soft delete)
router.delete('/prices/:id', verifyToken, async (req, res) => {
  try {
    const price = await Price.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
    
    if (!price) {
      return res.status(404).json({ error: 'Price not found' });
    }
    
    res.json({ message: 'Price deleted successfully' });
  } catch (error) {
    console.error('Delete price error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// =====================
// PRICE LOOKUP (Public - for LLM)
// =====================

// Lookup price by service and location
router.get('/lookup/price', async (req, res) => {
  try {
    const { serviceName, city, state, country = 'US' } = req.query;
    
    if (!serviceName) {
      return res.status(400).json({ error: 'Service name required' });
    }
    
    // Find matching service
    const service = await Service.findOne({
      $or: [
        { name: { $regex: serviceName, $options: 'i' } },
        { keywords: { $regex: serviceName, $options: 'i' } }
      ],
      isActive: true
    });
    
    if (!service) {
      return res.json({ 
        found: false, 
        message: 'Service not found in database',
        typicalRange: null
      });
    }
    
    // Build provider location query
    const providerQuery = { isActive: true };
    if (country) providerQuery['address.country'] = country;
    if (state) providerQuery['address.state'] = { $regex: state, $options: 'i' };
    if (city) providerQuery['address.city'] = { $regex: city, $options: 'i' };
    
    // Find providers in location
    const providers = await ClarityProvider.find(providerQuery);
    const providerIds = providers.map(p => p._id);
    
    // Find prices
    const prices = await Price.find({
      serviceId: service._id,
      providerId: { $in: providerIds },
      isActive: true
    }).populate('providerId', 'name type address contact');
    
    if (prices.length === 0) {
      return res.json({
        found: false,
        service: {
          name: service.name,
          category: service.category,
          typicalRange: service.typicalPriceRange
        },
        message: 'No verified prices found for this location'
      });
    }
    
    // Sort by price
    const sortedPrices = prices.sort((a, b) => a.cashPrice - b.cashPrice);
    
    res.json({
      found: true,
      service: {
        name: service.name,
        category: service.category
      },
      prices: sortedPrices.map(p => ({
        provider: p.providerId.name,
        type: p.providerId.type,
        address: p.providerId.address,
        contact: p.providerId.contact,
        cashPrice: p.cashPrice,
        verified: p.verified,
        dateCollected: p.dateCollected
      })),
      lowestPrice: sortedPrices[0].cashPrice,
      highestPrice: sortedPrices[sortedPrices.length - 1].cashPrice
    });
  } catch (error) {
    console.error('Price lookup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// =====================
// DASHBOARD STATS
// =====================

router.get('/dashboard/clarity-stats', verifyToken, async (req, res) => {
  try {
    const stats = {
      inquiries: {
        total: await Inquiry.countDocuments(),
        new: await Inquiry.countDocuments({ status: 'new' }),
        inProgress: await Inquiry.countDocuments({ status: 'in_progress' }),
        completed: await Inquiry.countDocuments({ status: 'completed' }),
        byType: {
          providerOutreach: await Inquiry.countDocuments({ type: 'provider_outreach' }),
          internationalValidation: await Inquiry.countDocuments({ type: 'international_validation' }),
          consultation: await Inquiry.countDocuments({ type: 'consultation' })
        }
      },
      priceDatabase: {
        services: await Service.countDocuments({ isActive: true }),
        providers: await ClarityProvider.countDocuments({ isActive: true }),
        prices: await Price.countDocuments({ isActive: true }),
        verifiedPrices: await Price.countDocuments({ isActive: true, verified: true })
      },
      recentInquiries: await Inquiry.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('type status providerName facilityName userEmail createdAt')
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Clarity stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
