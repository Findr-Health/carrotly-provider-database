/**
 * Inquiry Model
 * Captures user requests for provider outreach, international validation, and consultations
 */

const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  // Type of inquiry
  type: {
    type: String,
    enum: ['provider_outreach', 'international_validation', 'consultation'],
    required: true
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['new', 'in_progress', 'completed', 'declined'],
    default: 'new'
  },
  
  // For provider outreach
  providerName: String,
  providerLocation: String,
  serviceDiscussed: String,
  
  // For international validation
  facilityName: String,
  country: String,
  
  // User contact (for international validation and consultation)
  userEmail: String,
  userPhone: String,
  
  // For consultation
  issueSummary: String,
  billAmount: Number,
  
  // Common fields
  originalQuestion: String,
  conversationContext: String,
  
  // Admin management
  adminNotes: String,
  assignedTo: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: Date
});

// Update timestamp on save
inquirySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Inquiry', inquirySchema);
