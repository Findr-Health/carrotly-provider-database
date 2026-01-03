const mongoose = require('mongoose');

// Service Variant Schema (for tiered pricing)
const serviceVariantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  price: {
    type: Number,
    required: true
  },
  duration: Number, // Can override base duration
  isDefault: {
    type: Boolean,
    default: false
  }
}, { _id: true });

// Main Service Schema
const serviceSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  shortDescription: {
    type: String,
    maxlength: 100
  },
  
  // Categorization
  category: {
    type: String,
    required: true
  },
  
  // Pricing & Duration
  basePrice: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    default: 60
  },
  
  // Variants (optional - for tiered pricing)
  hasVariants: {
    type: Boolean,
    default: false
  },
  variants: [serviceVariantSchema],
  
  // Display
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// Pre-save middleware to update updatedAt
serviceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for display price (shows "from $X" if variants exist)
serviceSchema.virtual('displayPrice').get(function() {
  if (this.hasVariants && this.variants.length > 0) {
    const minPrice = Math.min(...this.variants.map(v => v.price));
    return `from $${minPrice}`;
  }
  return `$${this.basePrice}`;
});

// Virtual for display duration
serviceSchema.virtual('displayDuration').get(function() {
  if (this.hasVariants && this.variants.length > 0) {
    const durations = this.variants.map(v => v.duration || this.duration);
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    if (min === max) return `${min} min`;
    return `${min}-${max} min`;
  }
  return `${this.duration} min`;
});

module.exports = {
  serviceSchema,
  serviceVariantSchema
};
