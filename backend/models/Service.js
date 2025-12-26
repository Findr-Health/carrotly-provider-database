/**
 * Service Model
 * Healthcare services that can be priced (MRI, CBC, etc.)
 */

const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  // Service name (e.g., "MRI Brain without contrast")
  name: {
    type: String,
    required: true
  },
  
  // Category for filtering
  category: {
    type: String,
    enum: ['Imaging', 'Labs', 'Procedure', 'Dental', 'Vision', 'Preventive', 'Specialty', 'Other'],
    required: true
  },
  
  // CPT codes associated with this service
  cptCodes: [{
    type: String
  }],
  
  // Description for clarity
  description: String,
  
  // Typical fair price range (for reference when no specific provider price)
  typicalPriceRange: {
    low: Number,
    high: Number
  },
  
  // Search keywords
  keywords: [String],
  
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
serviceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Text index for search
serviceSchema.index({ name: 'text', description: 'text', keywords: 'text' });

module.exports = mongoose.model('Service', serviceSchema);
