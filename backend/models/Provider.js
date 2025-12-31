const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  // Step 1: Basic Information
  practiceName: {
    type: String,
    required: true
  },
  providerTypes: [{
    type: String,
    enum: [
      'Medical', 'Dental', 'Cosmetic', 'Fitness', 'Massage', 
      'Mental Health', 'Skincare', 'Urgent Care', 'Nutrition/Wellness',
      // Legacy lowercase values for backwards compatibility
      'medical', 'dental', 'cosmetic', 'fitness', 'massage', 
      'mental-health', 'skincare'
    ]
  }],
  
  // NEW: Provider description/bio for profile display
  description: String,
  
  // Contact Info (can be nested or flat)
  contactInfo: {
    email: String,
    phone: String,
    website: String
  },
  // Also support flat fields for backwards compatibility
  email: String,
  phone: String,
  website: String,

  // Step 2: Location
  address: {
    street: String,
    suite: String,
    city: String,
    state: String,
    zip: String
  },
  
  // Geo coordinates for map view and distance calculations
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number]  // [longitude, latitude]
    }
  },

  // Step 3: Photos
  photos: [{
    url: String,
    isPrimary: { type: Boolean, default: false },
    caption: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Step 4: Services
  services: [{
    name: { type: String, required: true },
    category: String,
    duration: Number, // in minutes
    price: Number,
    description: String,
    isActive: { type: Boolean, default: true }
  }],

  // Step 5: Optional Details - Credentials
  credentials: {
    licenseNumber: String,
    licenseState: String,
    licenseExpiration: Date,
    yearsExperience: Number,
    education: String,
    certifications: [String]
  },

  // Step 5: Optional Details - Insurance
  insuranceAccepted: [String],

  // Step 5: Optional Details - Languages
  languagesSpoken: [String],

  // Step 8: Team Members
  teamMembers: [{
    name: { type: String, required: true },
    title: String,
    credentials: String,
    bio: String,
    photo: String,
    specialties: [String],
    yearsExperience: Number,
    acceptsBookings: { type: Boolean, default: true },
    calendarConnected: { type: Boolean, default: false }
  }],

  // Step 6: Payment & Payout (Future)
  payment: {
    method: { type: String, enum: ['stripe', 'bank'] },
    stripeAccountId: String,
    stripeEmail: String,
    bankDetails: {
      bankName: String,
      accountHolder: String,
      routingNumber: String,
      accountNumber: String,
      accountType: { type: String, enum: ['checking', 'savings'] }
    },
    payoutSchedule: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    taxInfo: {
      businessType: String,
      taxId: String
    }
  },

  // Step 7: Calendar & Availability (Future)
  calendar: {
    provider: { type: String, enum: ['google', 'microsoft', 'apple', 'manual'] },
    calendarId: String,
    calendarEmail: String,
    syncDirection: { type: String, enum: ['two-way', 'one-way'] },
    syncBusyOnly: Boolean,
    bufferMinutes: Number,
    businessHours: {
      monday: { enabled: Boolean, start: String, end: String },
      tuesday: { enabled: Boolean, start: String, end: String },
      wednesday: { enabled: Boolean, start: String, end: String },
      thursday: { enabled: Boolean, start: String, end: String },
      friday: { enabled: Boolean, start: String, end: String },
      saturday: { enabled: Boolean, start: String, end: String },
      sunday: { enabled: Boolean, start: String, end: String }
    }
  },

  // Step 10: Legal Agreement
  agreement: {
    initials: {
      type: Map,
      of: String
    },
    signature: String,
    title: String,
    agreedDate: Date,
    ipAddress: String,
    version: String
  },

  // Provider Status
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  
  // NEW: Ratings & Reviews (aggregated from Reviews collection)
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  
  // NEW: Verified Badge - toggleable in admin dashboard
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  
  // NEW: Featured flag for home screen display
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredOrder: {
    type: Number,
    default: 0
  },
  // Cancellation Policy
  cancellationPolicy: {
    tier: {
      type: String,
      enum: ['standard', 'moderate'],
      default: 'standard'
    },
    allowFeeWaiver: {
      type: Boolean,
      default: true
    }
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  
  // Onboarding Progress
  onboardingStep: {
    type: Number,
    default: 1
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },

  // Notes (for admin use)
  adminNotes: String
});

// Update the updatedAt field on save
providerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for full address
providerSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  const parts = [
    this.address.street,
    this.address.suite,
    this.address.city,
    this.address.state,
    this.address.zip
  ].filter(Boolean);
  return parts.join(', ');
});

// Virtual for primary photo
providerSchema.virtual('primaryPhoto').get(function() {
  if (!this.photos || this.photos.length === 0) return null;
  const primary = this.photos.find(p => p.isPrimary);
  return primary ? primary.url : this.photos[0].url;
});

// Virtual for active services count
providerSchema.virtual('activeServicesCount').get(function() {
  if (!this.services) return 0;
  return this.services.filter(s => s.isActive !== false).length;
});

// Ensure virtuals are included in JSON output
providerSchema.set('toJSON', { virtuals: true });
providerSchema.set('toObject', { virtuals: true });

// Indexes
// Geo index - only indexes documents with valid coordinates
providerSchema.index({ location: '2dsphere' }, { sparse: true });
providerSchema.index({ status: 1, isVerified: 1 });  // For filtering
providerSchema.index({ isFeatured: 1, featuredOrder: 1 });  // For featured list
providerSchema.index({ rating: -1 });  // For sorting by rating

module.exports = mongoose.model('Provider', providerSchema);
