/**
 * ClarityProvider Model
 * Healthcare providers for the price database (different from onboarding Provider model)
 */

const mongoose = require('mongoose');

const clarityProviderSchema = new mongoose.Schema({
  // Provider name
  name: {
    type: String,
    required: true
  },
  
  // Type of facility
  type: {
    type: String,
    enum: ['Imaging Center', 'Lab', 'Surgery Center', 'Hospital', 'Clinic', 'Dental', 'Pharmacy', 'Other'],
    required: true
  },
  
  // Address
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: {
      type: String,
      default: 'US'
    }
  },
  
  // Contact information
  contact: {
    phone: String,
    email: String,
    website: String
  },
  
  // Partner status
  isPartner: {
    type: Boolean,
    default: false
  },
  
  // International provider
  isInternational: {
    type: Boolean,
    default: false
  },
  
  // Accreditations (JCI, AAAHC, etc.)
  accreditation: [String],
  
  // Internal notes
  notes: String,
  
  // Rating/quality info
  rating: {
    score: Number,
    source: String,
    reviewCount: Number
  },
  
  // Active status
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
clarityProviderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Text index for search
clarityProviderSchema.index({ name: 'text', 'address.city': 'text', 'address.state': 'text' });

module.exports = mongoose.model('ClarityProvider', clarityProviderSchema);
