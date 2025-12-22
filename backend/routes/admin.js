const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Provider = require('../models/Provider');
const emailService = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'carrotly-admin-secret-2024';

const ADMIN_USERS = [
  { id: '1', email: 'admin@findrhealth.com', password: 'admin123', name: 'Admin User', role: 'super_admin' }
];

// Auth middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// POST /api/admin/login - NO AUTH (public endpoint)
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const admin = ADMIN_USERS.find(u => u.email === email && u.password === password);
  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { userId: admin.id, email: admin.email, role: admin.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({
    token,
    admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role }
  });
});

// GET /api/admin/stats - Dashboard statistics (AUTH ENABLED)
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const total = await Provider.countDocuments();
    const pending = await Provider.countDocuments({ status: 'pending' });
    const approved = await Provider.countDocuments({ status: 'approved' });
    const rejected = await Provider.countDocuments({ status: 'rejected' });
    
    let byType = [];
    try {
      byType = await Provider.aggregate([
        { $unwind: { path: '$providerTypes', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$providerTypes', count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } }
      ]);
    } catch (aggErr) {
      console.log('Aggregation error:', aggErr);
      byType = [];
    }
    
    res.json({ 
      total, 
      pending, 
      approved, 
      rejected, 
      byType: byType || [] 
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ 
      error: err.message,
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      byType: []
    });
  }
});

// GET /api/admin/providers - List all providers (AUTH ENABLED)
router.get('/providers', verifyToken, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { practiceName: { $regex: search, $options: 'i' } },
        { 'contactInfo.email': { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    const providers = await Provider.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Provider.countDocuments(query);
    
    res.json({
      providers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Providers list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/providers/:id - Get single provider (AUTH ENABLED)
router.get('/providers/:id', verifyToken, async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    res.json(provider);
  } catch (err) {
    console.error('Provider detail error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/providers - Create provider (NO AUTH - for agent)
router.post('/providers', async (req, res) => {
  try {
    const providerData = {
      practiceName: req.body.practiceName || req.body.name,
      providerTypes: req.body.providerTypes || req.body.types || [],
      contactInfo: {
        email: req.body.email || req.body.contactInfo?.email,
        phone: req.body.phone || req.body.contactInfo?.phone,
        website: req.body.website || req.body.contactInfo?.website
      },
      address: req.body.address || {},
      services: req.body.services || [],
      photos: req.body.photos || [],
      status: req.body.status || 'pending'
    };
    
    const provider = new Provider(providerData);
    await provider.save();
    
    res.status(201).json({
      success: true,
      providerId: provider._id,
      message: 'Provider created successfully'
    });
  } catch (err) {
    console.error('Create provider error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

router.patch('/providers/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Send email for approved or rejected
    if (status === 'approved' || status === 'rejected') {
      const email = provider.contactInfo?.email || provider.email;
      if (email) {
        try {
          await emailService.sendProviderApprovalEmail(email, provider.practiceName, status === 'approved');
          console.log(`✅ Provider ${status} email sent to ${email}`);
        } catch (emailError) {
          console.error('Failed to send provider status email:', emailError);
        }
      }
    }
    
    res.json(provider);
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/providers/:id - Delete provider (AUTH ENABLED)
router.delete('/providers/:id', verifyToken, async (req, res) => {
  try {
    const provider = await Provider.findByIdAndDelete(req.params.id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    res.json({ message: 'Provider deleted successfully' });
  } catch (err) {
    console.error('Delete provider error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/providers/:id/services - Add services (NO AUTH - for agent)
router.post('/providers/:id/services', async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    const newServices = req.body.services || [];
    provider.services = [...provider.services, ...newServices];
    await provider.save();
    
    res.json({
      success: true,
      message: 'Services added successfully',
      provider
    });
  } catch (err) {
    console.error('Add services error:', err);
    res.status(500).json({ error: err.message });
  }
});
// FULL provider update - supports all fields
router.put('/providers/:id', verifyToken, async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;
    updateData.updatedAt = new Date();
    
    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    res.json(provider);
  } catch (error) {
    console.error('Update provider error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;
