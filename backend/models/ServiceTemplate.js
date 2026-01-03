const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  priceModifier: { type: Number, default: 0 },
  durationModifier: { type: Number, default: 0 },
  description: String
});

const serviceTemplateSchema = new mongoose.Schema({
  providerType: {
    type: String,
    required: true,
    enum: [
      'Medical',
      'Urgent Care',
      'Dental',
      'Mental Health',
      'Skincare',
      'Massage',
      'Fitness',
      'Yoga/Pilates',
      'Nutrition',
      'Pharmacy/Rx'
    ],
    index: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    maxlength: 100
  },
  suggestedPriceMin: {
    type: Number,
    required: true
  },
  suggestedPriceMax: {
    type: Number,
    required: true
  },
  suggestedDuration: {
    type: Number,
    required: true
  },
  suggestedVariants: [variantSchema],
  isPopular: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
serviceTemplateSchema.index({ providerType: 1, category: 1, sortOrder: 1 });

// Static method to get categories for a provider type
serviceTemplateSchema.statics.getCategoriesForProviderType = function(providerType) {
  const categoryMap = {
    'Medical': ['Consultation', 'Preventive', 'Diagnostic', 'Treatment', 'Procedures'],
    'Urgent Care': ['Walk-in Visit', 'Diagnostic', 'Treatment', 'Minor Procedures'],
    'Dental': ['Preventive', 'Restorative', 'Cosmetic', 'Surgical'],
    'Mental Health': ['Assessment', 'Individual Therapy', 'Couples/Family', 'Group', 'Psychiatry'],
    'Skincare': ['Facials', 'Injectables', 'Acne Treatment', 'Body Treatment'],
    'Massage': ['Relaxation', 'Therapeutic', 'Sports', 'Specialty'],
    'Fitness': ['Personal Training', 'Group Class', 'Assessment'],
    'Yoga/Pilates': ['Group Class', 'Private Session', 'Workshop'],
    'Nutrition': ['Consultation', 'Meal Planning', 'Program'],
    'Pharmacy/Rx': ['Consultation', 'Compounding', 'Immunization', 'Weight Loss']
  };
  return categoryMap[providerType] || [];
};

module.exports = mongoose.model('ServiceTemplate', serviceTemplateSchema);
