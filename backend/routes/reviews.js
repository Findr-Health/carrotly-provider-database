/**
 * Findr Health Reviews Routes
 * 
 * Endpoints:
 * GET    /api/reviews/provider/:providerId  - Get provider reviews
 * POST   /api/reviews                       - Create review (requires completed booking)
 * PUT    /api/reviews/:id                   - Edit review (within 7 days)
 * DELETE /api/reviews/:id                   - Delete own review
 * POST   /api/reviews/:id/helpful           - Mark as helpful
 * POST   /api/reviews/:id/flag              - Flag review
 * POST   /api/reviews/:id/respond           - Provider responds to review
 */

const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Provider = require('../models/Provider');

// ==================== GET PROVIDER REVIEWS ====================

router.get('/provider/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { 
      rating,          // Filter by star rating (1-5)
      sort = 'recent', // 'recent', 'highest', 'lowest', 'helpful'
      limit = 10,
      page = 1
    } = req.query;

    const query = { 
      provider: providerId,
      status: 'published'
    };

    // Filter by rating
    if (rating) {
      query.rating = parseInt(rating);
    }

    // Determine sort order
    let sortOrder = { createdAt: -1 }; // Default: most recent
    switch (sort) {
      case 'highest':
        sortOrder = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sortOrder = { rating: 1, createdAt: -1 };
        break;
      case 'helpful':
        sortOrder = { helpfulCount: -1, createdAt: -1 };
        break;
    }

    const reviews = await Review.find(query)
      .populate('user', 'firstName lastName')
      .sort(sortOrder)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Review.countDocuments(query);
    
    // Get stats
    const stats = await Review.getProviderStats(providerId);

    res.json({
      success: true,
      reviews: reviews.map(r => ({
        _id: r._id,
        rating: r.rating,
        title: r.title,
        content: r.content,
        serviceName: r.serviceName,
        author: {
          firstName: r.user?.firstName || 'Anonymous',
          lastInitial: r.user?.lastName?.charAt(0) || ''
        },
        helpfulCount: r.helpfulCount,
        providerResponse: r.providerResponse,
        createdAt: r.createdAt,
        isEdited: r.isEdited
      })),
      stats,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get provider reviews error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== GET SINGLE REVIEW ====================

router.get('/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'firstName lastName')
      .populate('provider', 'practiceName');

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ success: true, review });

  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== CREATE REVIEW ====================

router.post('/', async (req, res) => {
  try {
    const { 
      userId,
      bookingId,
      rating,
      title,
      content
    } = req.body;

    // Validate required fields
    if (!userId || !bookingId || !rating || !content) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'bookingId', 'rating', 'content']
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Get the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify booking belongs to user
    if (booking.user.toString() !== userId) {
      return res.status(403).json({ error: 'You can only review your own bookings' });
    }

    // Verify booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'You can only review completed appointments' });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this booking' });
    }

    // Create review
    const review = new Review({
      user: userId,
      provider: booking.provider,
      booking: bookingId,
      rating,
      title,
      content,
      serviceName: booking.service.name,
      status: 'published', // Auto-publish
      isVerifiedBooking: true
    });

    await review.save();

    // Update provider's rating (async, don't wait)
    updateProviderRating(booking.provider).catch(console.error);

    res.status(201).json({
      success: true,
      review: {
        _id: review._id,
        rating: review.rating,
        title: review.title,
        content: review.content,
        createdAt: review.createdAt
      },
      message: 'Review published successfully'
    });

  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== EDIT REVIEW ====================

router.put('/:id', async (req, res) => {
  try {
    const { userId, rating, title, content } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Verify ownership
    if (review.user.toString() !== userId) {
      return res.status(403).json({ error: 'You can only edit your own reviews' });
    }

    // Check edit window
    if (new Date() > review.canEditUntil) {
      return res.status(400).json({ error: 'Edit window has expired (7 days)' });
    }

    // Save to edit history
    review.editHistory.push({
      content: review.content,
      rating: review.rating,
      editedAt: new Date()
    });

    // Update review
    if (rating) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (content) review.content = content;
    review.isEdited = true;
    review.editedAt = new Date();

    await review.save();

    // Update provider rating if changed
    if (rating) {
      updateProviderRating(review.provider).catch(console.error);
    }

    res.json({
      success: true,
      review,
      message: 'Review updated'
    });

  } catch (error) {
    console.error('Edit review error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== DELETE REVIEW ====================

router.delete('/:id', async (req, res) => {
  try {
    const { userId } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Verify ownership
    if (review.user.toString() !== userId) {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }

    const providerId = review.provider;
    
    await Review.findByIdAndDelete(req.params.id);

    // Update provider rating
    updateProviderRating(providerId).catch(console.error);

    res.json({
      success: true,
      message: 'Review deleted'
    });

  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== MARK AS HELPFUL ====================

router.post('/:id/helpful', async (req, res) => {
  try {
    const { userId } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if already voted
    if (review.helpfulVoters.includes(userId)) {
      // Remove vote
      review.helpfulVoters = review.helpfulVoters.filter(
        id => id.toString() !== userId
      );
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else {
      // Add vote
      review.helpfulVoters.push(userId);
      review.helpfulCount += 1;
    }

    await review.save();

    res.json({
      success: true,
      helpfulCount: review.helpfulCount,
      userVoted: review.helpfulVoters.includes(userId)
    });

  } catch (error) {
    console.error('Helpful vote error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== FLAG REVIEW ====================

router.post('/:id/flag', async (req, res) => {
  try {
    const { userId, reason, details } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Flag reason is required' });
    }

    const validReasons = ['inappropriate', 'fake', 'spam', 'offensive', 'other'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ 
        error: 'Invalid reason',
        validReasons
      });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user already flagged
    const alreadyFlagged = review.flags.some(
      f => f.flaggedBy.toString() === userId
    );
    if (alreadyFlagged) {
      return res.status(400).json({ error: 'You have already flagged this review' });
    }

    // Add flag
    review.flags.push({
      flaggedBy: userId,
      reason,
      details,
      flaggedAt: new Date()
    });

    // Auto-hide if multiple flags
    if (review.flags.length >= 3) {
      review.status = 'flagged';
    }

    await review.save();

    res.json({
      success: true,
      message: 'Review flagged for review'
    });

  } catch (error) {
    console.error('Flag review error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== PROVIDER RESPONSE ====================

router.post('/:id/respond', async (req, res) => {
  try {
    const { providerId, content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Response content is required' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Response must be 1000 characters or less' });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Verify provider owns this review's provider
    if (review.provider.toString() !== providerId) {
      return res.status(403).json({ error: 'You can only respond to reviews of your practice' });
    }

    // Check if already responded
    if (review.providerResponse?.content) {
      // Update existing response
      review.providerResponse.content = content;
      review.providerResponse.editedAt = new Date();
    } else {
      // Add new response
      review.providerResponse = {
        content,
        respondedAt: new Date()
      };
    }

    await review.save();

    res.json({
      success: true,
      review,
      message: 'Response added'
    });

  } catch (error) {
    console.error('Provider response error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== GET USER'S REVIEWS ====================

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, page = 1 } = req.query;

    const reviews = await Review.find({ user: userId })
      .populate('provider', 'practiceName photos')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Review.countDocuments({ user: userId });

    res.json({
      success: true,
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== HELPER FUNCTIONS ====================

async function updateProviderRating(providerId) {
  try {
    const stats = await Review.getProviderStats(providerId);
    
    await Provider.findByIdAndUpdate(providerId, {
      rating: stats.averageRating,
      reviewCount: stats.totalReviews
    });
    
    console.log(`Updated provider ${providerId} rating: ${stats.averageRating} (${stats.totalReviews} reviews)`);
  } catch (error) {
    console.error('Update provider rating error:', error);
  }
}

module.exports = router;
