const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  // References
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
    index: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true  // One review per booking
  },
  
  // Rating (1-5 stars)
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  // Review content
  title: {
    type: String,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 2000
  },
  
  // Service reviewed
  serviceName: String,
  
  // Status
  status: {
    type: String,
    enum: ['published', 'flagged', 'removed', 'hidden'],
    default: 'published'
  },
  
  // Helpful votes
  helpfulCount: {
    type: Number,
    default: 0
  },
  helpfulVoters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Provider response
  providerResponse: {
    content: {
      type: String,
      maxlength: 1000
    },
    respondedAt: Date,
    editedAt: Date
  },
  
  // Flagging/Moderation
  flags: [{
    flaggedBy: mongoose.Schema.Types.ObjectId,
    reason: {
      type: String,
      enum: ['inappropriate', 'fake', 'spam', 'offensive', 'other']
    },
    details: String,
    flaggedAt: { type: Date, default: Date.now }
  }],
  
  // Moderation
  moderation: {
    reviewedBy: mongoose.Schema.Types.ObjectId,
    reviewedAt: Date,
    action: {
      type: String,
      enum: ['approved', 'removed', 'edited']
    },
    reason: String
  },
  
  // Edit tracking
  isEdited: { type: Boolean, default: false },
  editedAt: Date,
  editHistory: [{
    content: String,
    rating: Number,
    editedAt: Date
  }],
  
  // Edit window (7 days)
  canEditUntil: Date,
  
  // Verification
  isVerifiedBooking: { type: Boolean, default: true }

}, {
  timestamps: true
});

// Indexes
ReviewSchema.index({ provider: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ provider: 1, rating: 1 });
ReviewSchema.index({ user: 1, createdAt: -1 });

// Set edit window on creation
ReviewSchema.pre('save', function(next) {
  if (this.isNew) {
    const editWindow = new Date();
    editWindow.setDate(editWindow.getDate() + 7);
    this.canEditUntil = editWindow;
  }
  next();
});

// Virtual: Can user still edit?
ReviewSchema.virtual('canEdit').get(function() {
  return this.status === 'published' && new Date() < this.canEditUntil;
});

// Virtual: Flag count
ReviewSchema.virtual('flagCount').get(function() {
  return this.flags ? this.flags.length : 0;
});

// Static: Get provider stats
ReviewSchema.statics.getProviderStats = async function(providerId) {
  const stats = await this.aggregate([
    { 
      $match: { 
        provider: new mongoose.Types.ObjectId(providerId),
        status: 'published'
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        fiveStars: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        fourStars: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        threeStars: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        twoStars: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }
  
  const s = stats[0];
  return {
    averageRating: Math.round(s.averageRating * 10) / 10,
    totalReviews: s.totalReviews,
    distribution: {
      5: s.fiveStars,
      4: s.fourStars,
      3: s.threeStars,
      2: s.twoStars,
      1: s.oneStar
    }
  };
};

ReviewSchema.set('toJSON', { virtuals: true });
ReviewSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Review', ReviewSchema);
