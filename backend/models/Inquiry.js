const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  // Inquiry type
  type: {
    type: String,
    enum: ['general', 'provider_inquiry', 'provider_outreach', 'support', 'feedback', 'partnership'],
    default: 'general'
  },
  
  // Source of the inquiry
  source: {
    type: String,
    enum: ['website', 'app', 'ai_chat', 'phone', 'email', 'referral', 'manual'],
    default: 'app'
  },
  
  // Status
  status: {
    type: String,
    enum: ['new', 'in_progress', 'contacted', 'converted', 'closed', 'spam'],
    default: 'new'
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // User info (if logged in)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Contact info (for non-logged-in users or providers)
  contactInfo: {
    name: String,
    email: String,
    phone: String,
    practiceName: String
  },
  
  // AI Chat specific fields
  conversationId: String,
  userMessage: String,
  requestedProviderType: String,
  
  // Location
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: [Number], // [longitude, latitude]
    city: String,
    state: String,
    zip: String
  },
  
  // Provider being inquired about (if specific)
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider'
  },
  
  // Message/Details
  subject: String,
  message: String,
  notes: String,
  
  // Admin handling
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  
  // Follow-up tracking
  followUps: [{
    date: Date,
    method: { type: String, enum: ['email', 'phone', 'sms', 'in_app'] },
    notes: String,
    outcome: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
  }],
  
  // Outcome
  outcome: {
    type: String,
    enum: ['pending', 'provider_onboarded', 'provider_declined', 'user_booked', 'no_response', 'not_interested', 'spam'],
    default: 'pending'
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  contactedAt: Date,
  closedAt: Date
});

// Update timestamp on save
inquirySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for geo queries
inquirySchema.index({ 'location': '2dsphere' }, { sparse: true });

// Index for common queries
inquirySchema.index({ status: 1, source: 1 });
inquirySchema.index({ type: 1, status: 1 });
inquirySchema.index({ createdAt: -1 });
inquirySchema.index({ requestedProviderType: 1 });

module.exports = mongoose.model('Inquiry', inquirySchema);
