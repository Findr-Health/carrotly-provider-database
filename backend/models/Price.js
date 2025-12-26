/**
 * Price Model
 * Links services to providers with cash prices
 */

const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
  // Reference to Service
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  
  // Reference to ClarityProvider
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClarityProvider',
    required: true
  },
  
  // The cash price
  cashPrice: {
    type: Number,
    required: true
  },
  
  // Price source for verification
  priceSource: {
    type: String,
    enum: ['website', 'phone_call', 'user_report', 'price_list', 'other'],
    default: 'other'
  },
  
  // URL if price was found online
  sourceUrl: String,
  
  // When the price was collected
  dateCollected: {
    type: Date,
    default: Date.now
  },
  
  // Admin notes
  notes: String,
  
  // Verification status
  verified: {
    type: Boolean,
    default: false
  },
  
  // Active status (for soft delete)
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
priceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Compound index to prevent duplicate service-provider pairs
priceSchema.index({ serviceId: 1, providerId: 1 }, { unique: true });

module.exports = mongoose.model('Price', priceSchema);
