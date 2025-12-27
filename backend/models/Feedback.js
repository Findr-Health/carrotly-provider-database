/**
 * Feedback Model
 * Stores user feedback on AI responses (thumbs up/down)
 */

const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  // Unique message identifier from frontend
  messageId: {
    type: String,
    required: true,
    index: true
  },
  
  // Rating: 'positive' or 'negative'
  rating: {
    type: String,
    enum: ['positive', 'negative'],
    required: true
  },
  
  // The user's original prompt/question
  userPrompt: {
    type: String,
    default: null
  },
  
  // The AI's response that was rated
  aiResponse: {
    type: String,
    required: true
  },
  
  // Session identifier (anonymous)
  sessionId: {
    type: String,
    default: 'unknown'
  },
  
  // Type of interaction
  interactionType: {
    type: String,
    enum: ['chat', 'document_analysis', 'calculator', 'unknown'],
    default: 'unknown'
  },
  
  // Optional user comment (for future enhancement)
  comment: {
    type: String,
    default: null
  },
  
  // Metadata
  metadata: {
    userAgent: String,
    screenSize: String,
    referrer: String
  },
  
  // Status for admin review
  status: {
    type: String,
    enum: ['new', 'reviewed', 'actioned', 'dismissed'],
    default: 'new'
  },
  
  // Admin notes
  adminNotes: {
    type: String,
    default: null
  },
  
  // Tags for categorization
  tags: [{
    type: String
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  reviewedAt: {
    type: Date,
    default: null
  },
  
  reviewedBy: {
    type: String,
    default: null
  }
});

// Indexes for efficient querying
feedbackSchema.index({ rating: 1, createdAt: -1 });
feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ createdAt: -1 });

// Virtual for response preview (first 200 chars)
feedbackSchema.virtual('responsePreview').get(function() {
  if (this.aiResponse && this.aiResponse.length > 200) {
    return this.aiResponse.substring(0, 200) + '...';
  }
  return this.aiResponse;
});

// Static method for getting feedback stats
feedbackSchema.statics.getStats = async function(startDate = null, endDate = null) {
  const match = {};
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        positive: {
          $sum: { $cond: [{ $eq: ['$rating', 'positive'] }, 1, 0] }
        },
        negative: {
          $sum: { $cond: [{ $eq: ['$rating', 'negative'] }, 1, 0] }
        },
        newCount: {
          $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        _id: 0,
        total: 1,
        positive: 1,
        negative: 1,
        newCount: 1,
        positiveRate: {
          $cond: [
            { $eq: ['$total', 0] },
            0,
            { $multiply: [{ $divide: ['$positive', '$total'] }, 100] }
          ]
        }
      }
    }
  ]);
  
  return stats[0] || { total: 0, positive: 0, negative: 0, newCount: 0, positiveRate: 0 };
};

// Static method for getting daily trends
feedbackSchema.statics.getDailyTrends = async function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        total: { $sum: 1 },
        positive: {
          $sum: { $cond: [{ $eq: ['$rating', 'positive'] }, 1, 0] }
        },
        negative: {
          $sum: { $cond: [{ $eq: ['$rating', 'negative'] }, 1, 0] }
        }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        date: '$_id',
        total: 1,
        positive: 1,
        negative: 1,
        _id: 0
      }
    }
  ]);
};

module.exports = mongoose.model('Feedback', feedbackSchema);
