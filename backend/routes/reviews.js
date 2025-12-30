const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Review = require('../models/Review');
const Provider = require('../models/Provider');
const Booking = require('../models/Booking');

const JWT_SECRET = process.env.JWT_SECRET || 'findr-health-user-secret-2025';

// Auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
    }
  } catch (error) {
    // Ignore auth errors for optional auth
  }
  next();
};

// ==================== PUBLIC ROUTES ====================

// Get reviews for a provider
router.get('/provider/:providerId', optionalAuth, async (req, res) => {
  try {
    const { providerId } = req.params;
    const { page = 1, limit = 10, sort = 'recent' } = req.query;
    
    const query = { providerId, status: 'approved' };
    
    let sortOption = { createdAt: -1 };  // Default: most recent
    if (sort === 'highest') sortOption = { rating: -1, createdAt: -1 };
    if (sort === 'lowest') sortOption = { rating: 1, createdAt: -1 };
    if (sort === 'helpful') sortOption = { helpfulCount: -1, createdAt: -1 };
    
    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate('userId', 'firstName lastName photoUrl')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    // Get rating distribution
    const distribution = await Review.aggregate([
      { $match: { providerId: require('mongoose').Types.ObjectId(providerId), status: 'approved' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);
    
    const ratingDistribution = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    };
    distribution.forEach(d => {
      ratingDistribution[d._id] = d.count;
    });
    
    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      ratingDistribution
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

// Get single review
router.get('/:reviewId', async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId)
      .populate('userId', 'firstName lastName photoUrl')
      .populate('providerId', 'practiceName');
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get review' });
  }
});

// ==================== AUTHENTICATED ROUTES ====================

// Submit a review
router.post('/', auth, async (req, res) => {
  try {
    const { providerId, bookingId, rating, title, comment, photos } = req.body;
    
    // Validation
    if (!providerId || !rating) {
      return res.status(400).json({ error: 'Provider ID and rating are required' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    // Check if user already reviewed this provider
    const existingReview = await Review.findOne({
      providerId,
      userId: req.userId,
      status: { $ne: 'removed' }
    });
    
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this provider' });
    }
    
    // Check if booking exists and belongs to user
    let isVerifiedBooking = false;
    if (bookingId) {
      const booking = await Booking.findOne({
        _id: bookingId,
        userId: req.userId,
        providerId,
        status: 'completed'
      });
      
      if (booking) {
        isVerifiedBooking = true;
        
        // Mark booking as reviewed
        booking.hasReview = true;
        await booking.save();
      }
    }
    
    // Create review
    const review = new Review({
      providerId,
      userId: req.userId,
      bookingId: bookingId || undefined,
      rating,
      title,
      comment,
      photos: photos || [],
      isVerifiedBooking
    });
    
    await review.save();
    
    // Populate user data for response
    await review.populate('userId', 'firstName lastName photoUrl');
    
    res.status(201).json(review);
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Update a review
router.put('/:reviewId', auth, async (req, res) => {
  try {
    const { rating, title, comment, photos } = req.body;
    
    const review = await Review.findOne({
      _id: req.params.reviewId,
      userId: req.userId
    });
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found or not authorized' });
    }
    
    // Only allow updates within 7 days
    const daysSinceCreation = (Date.now() - review.createdAt) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > 7) {
      return res.status(400).json({ error: 'Reviews can only be edited within 7 days' });
    }
    
    if (rating) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;
    if (photos) review.photos = photos;
    
    await review.save();
    await review.populate('userId', 'firstName lastName photoUrl');
    
    res.json(review);
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete a review
router.delete('/:reviewId', auth, async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.reviewId,
      userId: req.userId
    });
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found or not authorized' });
    }
    
    // Soft delete
    review.status = 'removed';
    await review.save();
    
    // Update booking if applicable
    if (review.bookingId) {
      await Booking.findByIdAndUpdate(review.bookingId, { hasReview: false });
    }
    
    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Mark review as helpful
router.post('/:reviewId/helpful', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    // Check if already voted
    const alreadyVoted = review.helpfulVotes.some(
      v => v.userId.toString() === req.userId
    );
    
    if (alreadyVoted) {
      return res.status(400).json({ error: 'Already marked as helpful' });
    }
    
    review.helpfulVotes.push({ userId: req.userId, votedAt: new Date() });
    review.helpfulCount = review.helpfulVotes.length;
    await review.save();
    
    res.json({ helpfulCount: review.helpfulCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as helpful' });
  }
});

// Get reviews needing to be written (pending bookings without reviews)
router.get('/pending/mine', auth, async (req, res) => {
  try {
    const pendingBookings = await Booking.find({
      userId: req.userId,
      status: 'completed',
      hasReview: false,
      completedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }  // Last 30 days
    })
    .populate('providerId', 'practiceName photos primaryPhoto')
    .sort({ completedAt: -1 });
    
    res.json(pendingBookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get pending reviews' });
  }
});

// Get user's reviews
router.get('/mine/all', auth, async (req, res) => {
  try {
    const reviews = await Review.find({
      userId: req.userId,
      status: { $ne: 'removed' }
    })
    .populate('providerId', 'practiceName photos primaryPhoto')
    .sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get your reviews' });
  }
});

module.exports = router;
