/**
 * Feedback API Routes
 * Findr Health - Clarity Platform
 * 
 * Endpoints:
 * - POST /api/feedback - Submit feedback (public)
 * - GET /api/clarity-admin/feedback - Get all feedback (admin)
 * - GET /api/clarity-admin/feedback/stats - Get feedback stats (admin)
 * - PATCH /api/clarity-admin/feedback/:id - Update feedback status (admin)
 */

const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

/**
 * POST /api/feedback
 * Submit feedback for an AI response (public endpoint)
 */
router.post('/', async (req, res) => {
  try {
    const { 
      messageId, 
      rating, 
      aiResponse, 
      userPrompt, 
      sessionId,
      timestamp 
    } = req.body;
    
    // Validate required fields
    if (!messageId || !rating || !aiResponse) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: messageId, rating, aiResponse'
      });
    }
    
    // Validate rating
    if (!['positive', 'negative'].includes(rating)) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be "positive" or "negative"'
      });
    }
    
    // Detect interaction type from content
    let interactionType = 'chat';
    const lowerResponse = aiResponse.toLowerCase();
    if (lowerResponse.includes('uploaded') || lowerResponse.includes('document') || lowerResponse.includes('bill')) {
      interactionType = 'document_analysis';
    } else if (lowerResponse.includes('cash pay') && lowerResponse.includes('insurance') && lowerResponse.includes('year')) {
      interactionType = 'calculator';
    }
    
    // Create feedback record
    const feedback = new Feedback({
      messageId,
      rating,
      aiResponse,
      userPrompt: userPrompt || null,
      sessionId: sessionId || 'unknown',
      interactionType,
      metadata: {
        userAgent: req.headers['user-agent'],
        referrer: req.headers['referer']
      },
      createdAt: timestamp ? new Date(timestamp) : new Date()
    });
    
    await feedback.save();
    
    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });
    
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
});

// ============ Admin Routes ============

/**
 * GET /api/clarity-admin/feedback
 * Get all feedback with filtering and pagination
 */
router.get('/admin', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      rating,
      status,
      interactionType,
      startDate,
      endDate,
      search
    } = req.query;
    
    // Build query
    const query = {};
    
    if (rating) query.rating = rating;
    if (status) query.status = status;
    if (interactionType) query.interactionType = interactionType;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    if (search) {
      query.$or = [
        { userPrompt: { $regex: search, $options: 'i' } },
        { aiResponse: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [feedback, total] = await Promise.all([
      Feedback.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Feedback.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: feedback,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get feedback'
    });
  }
});

/**
 * GET /api/clarity-admin/feedback/stats
 * Get feedback statistics
 */
router.get('/admin/stats', async (req, res) => {
  try {
    const { startDate, endDate, days = 30 } = req.query;
    
    const [stats, trends] = await Promise.all([
      Feedback.getStats(startDate, endDate),
      Feedback.getDailyTrends(parseInt(days))
    ]);
    
    res.json({
      success: true,
      stats,
      trends
    });
    
  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get feedback stats'
    });
  }
});

/**
 * GET /api/clarity-admin/feedback/:id
 * Get single feedback item
 */
router.get('/admin/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }
    
    res.json({
      success: true,
      data: feedback
    });
    
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get feedback'
    });
  }
});

/**
 * PATCH /api/clarity-admin/feedback/:id
 * Update feedback status/notes (admin)
 */
router.patch('/admin/:id', async (req, res) => {
  try {
    const { status, adminNotes, tags } = req.body;
    
    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === 'reviewed' || status === 'actioned') {
        updateData.reviewedAt = new Date();
      }
    }
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (tags) updateData.tags = tags;
    
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }
    
    res.json({
      success: true,
      data: feedback
    });
    
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update feedback'
    });
  }
});

/**
 * DELETE /api/clarity-admin/feedback/:id
 * Delete feedback (admin)
 */
router.delete('/admin/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Feedback deleted'
    });
    
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete feedback'
    });
  }
});

module.exports = router;
