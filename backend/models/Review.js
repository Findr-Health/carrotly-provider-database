const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // References
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  
  // Review Content
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: String,
  comment: String,
  
  // Optional photos
  photos: [{
    url: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Verification
  isVerifiedBooking: {
    type: Boolean,
    default: false
  },
  
  // Provider Response
  providerResponse: {
    content: String,
    respondedAt: Date
  },
  
  // Moderation
  status: {
    type: String,
    enum: ['pending', 'approved', 'flagged', 'removed'],
    default: 'approved'
  },
  flagReason: String,
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  moderatedAt: Date,
  
  // Helpfulness votes
  helpfulCount: {
    type: Number,
    default: 0
  },
  helpfulVotes: [{
    userId: mongoose.Schema.Types.ObjectId,
    votedAt: Date
  }],
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Update timestamps
reviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// After saving a review, update provider's rating
reviewSchema.post('save', async function() {
  await this.constructor.updateProviderRating(this.providerId);
});

// After removing a review, update provider's rating
reviewSchema.post('remove', async function() {
  await this.constructor.updateProviderRating(this.providerId);
});

// Static method to recalculate provider rating
reviewSchema.statics.updateProviderRating = async function(providerId) {
  const Provider = mongoose.model('Provider');
  
  const result = await this.aggregate([
    { $match: { providerId: providerId, status: 'approved' } },
    { 
      $group: {
        _id: '$providerId',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  if (result.length > 0) {
    await Provider.findByIdAndUpdate(providerId, {
      rating: Math.round(result[0].avgRating * 10) / 10,  // Round to 1 decimal
      reviewCount: result[0].count
    });
  } else {
    await Provider.findByIdAndUpdate(providerId, {
      rating: 0,
      reviewCount: 0
    });
  }
};

// Indexes
reviewSchema.index({ providerId: 1, createdAt: -1 });  // Provider's reviews
reviewSchema.index({ userId: 1, createdAt: -1 });  // User's reviews
reviewSchema.index({ providerId: 1, status: 1 });  // Approved reviews
reviewSchema.index({ bookingId: 1 }, { unique: true, sparse: true });  // One review per booking

module.exports = mongoose.model('Review', reviewSchema);
