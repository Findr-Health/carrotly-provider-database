const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Review = require('../models/Review');
const Provider = require('../models/Provider');

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

// Get review stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [total, pending, approved, flagged] = await Promise.all([
      Review.countDocuments(),
      Review.countDocuments({ status: 'pending' }),
      Review.countDocuments({ status: 'approved' }),
      Review.countDocuments({ status: 'flagged' })
    ]);
    
    res.json({ total, pending, approved, flagged });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get all reviews (with filters)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { status, providerId, page = 1, limit = 50 } = req.query;
    
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (providerId) filter.providerId = providerId;
    
    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('providerId', 'practiceName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

// Get single review
router.get('/:reviewId', adminAuth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId)
      .populate('userId', 'firstName lastName email phone')
      .populate('providerId', 'practiceName contactInfo')
      .populate('bookingId');
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get review' });
  }
});

// Update review status
router.patch('/:reviewId/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'approved', 'flagged', 'removed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const review = await Review.findByIdAndUpdate(
      req.params.reviewId,
      { 
        status,
        moderatedBy: req.adminId,
        moderatedAt: new Date()
      },
      { new: true }
    );
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    // Recalculate provider rating
    await Review.updateProviderRating(review.providerId);
    
    res.json({ message: 'Status updated', review });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Delete review
router.delete('/:reviewId', adminAuth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    const providerId = review.providerId;
    await Review.findByIdAndDelete(req.params.reviewId);
    
    // Recalculate provider rating
    await Review.updateProviderRating(providerId);
    
    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Add admin response to review
router.post('/:reviewId/response', adminAuth, async (req, res) => {
  try {
    const { content } = req.body;
    
    const review = await Review.findByIdAndUpdate(
      req.params.reviewId,
      { 
        providerResponse: {
          content,
          respondedAt: new Date()
        }
      },
      { new: true }
    );
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.json({ message: 'Response added', review });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add response' });
  }
});

module.exports = router;
