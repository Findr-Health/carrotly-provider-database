const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Inquiry = require('../models/Inquiry');

const JWT_SECRET = process.env.JWT_SECRET || 'findr-health-admin-secret-2025';

// Admin auth middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = decoded.id || decoded.adminId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

/**
 * Get inquiry stats
 * GET /api/admin/inquiries/stats
 */
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [total, newCount, inProgress, contacted, aiChat, providerOutreach] = await Promise.all([
      Inquiry.countDocuments(),
      Inquiry.countDocuments({ status: 'new' }),
      Inquiry.countDocuments({ status: 'in_progress' }),
      Inquiry.countDocuments({ status: 'contacted' }),
      Inquiry.countDocuments({ source: 'ai_chat' }),
      Inquiry.countDocuments({ type: 'provider_outreach' })
    ]);
    
    // Get top requested provider types
    const topTypes = await Inquiry.aggregate([
      { $match: { type: 'provider_outreach' } },
      { $group: { _id: '$requestedProviderType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Get requests by location
    const byLocation = await Inquiry.aggregate([
      { $match: { type: 'provider_outreach', 'location.state': { $exists: true } } },
      { $group: { _id: '$location.state', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      total,
      new: newCount,
      inProgress,
      contacted,
      aiChat,
      providerOutreach,
      topRequestedTypes: topTypes,
      byLocation
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

/**
 * Get all inquiries
 * GET /api/admin/inquiries
 */
router.get('/', adminAuth, async (req, res) => {
  try {
    const { 
      status, 
      type, 
      source, 
      providerType,
      page = 1, 
      limit = 50 
    } = req.query;
    
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (type && type !== 'all') filter.type = type;
    if (source && source !== 'all') filter.source = source;
    if (providerType) filter.requestedProviderType = { $regex: new RegExp(providerType, 'i') };
    
    const total = await Inquiry.countDocuments(filter);
    const inquiries = await Inquiry.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('providerId', 'practiceName')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    res.json({
      inquiries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get inquiries error:', error);
    res.status(500).json({ error: 'Failed to get inquiries' });
  }
});

/**
 * Get single inquiry
 * GET /api/admin/inquiries/:id
 */
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone')
      .populate('providerId', 'practiceName contactInfo address')
      .populate('assignedTo', 'name email');
    
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    
    res.json(inquiry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get inquiry' });
  }
});

/**
 * Update inquiry status
 * PATCH /api/admin/inquiries/:id/status
 */
router.patch('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const updateData = { status };
    if (status === 'contacted') updateData.contactedAt = new Date();
    if (status === 'closed') updateData.closedAt = new Date();
    
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    
    res.json({ message: 'Status updated', inquiry });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

/**
 * Add follow-up to inquiry
 * POST /api/admin/inquiries/:id/followup
 */
router.post('/:id/followup', adminAuth, async (req, res) => {
  try {
    const { method, notes, outcome } = req.body;
    
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          followUps: {
            date: new Date(),
            method,
            notes,
            outcome,
            createdBy: req.adminId
          }
        },
        status: 'contacted',
        contactedAt: new Date()
      },
      { new: true }
    );
    
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    
    res.json({ message: 'Follow-up added', inquiry });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add follow-up' });
  }
});

/**
 * Update inquiry outcome
 * PATCH /api/admin/inquiries/:id/outcome
 */
router.patch('/:id/outcome', adminAuth, async (req, res) => {
  try {
    const { outcome, notes } = req.body;
    
    const updateData = { 
      outcome,
      status: outcome === 'pending' ? 'in_progress' : 'closed',
      closedAt: outcome !== 'pending' ? new Date() : undefined
    };
    
    if (notes) updateData.notes = notes;
    
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    
    res.json({ message: 'Outcome updated', inquiry });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update outcome' });
  }
});

/**
 * Assign inquiry to admin
 * PATCH /api/admin/inquiries/:id/assign
 */
router.patch('/:id/assign', adminAuth, async (req, res) => {
  try {
    const { assignedTo } = req.body;
    
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { assignedTo, status: 'in_progress' },
      { new: true }
    ).populate('assignedTo', 'name email');
    
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    
    res.json({ message: 'Inquiry assigned', inquiry });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign inquiry' });
  }
});

/**
 * Delete inquiry
 * DELETE /api/admin/inquiries/:id
 */
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Inquiry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Inquiry deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete inquiry' });
  }
});

module.exports = router;
