const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  // Step 1: Basic Information
  practiceName: {
    type: String,
    required: true
  },
  providerTypes: [{
    type: String,
    enum: ['medical', 'dental', 'cosmetic', 'fitness', 'massage', 'mental-health', 'skincare', 'Medical', 'Dental', 'Cosmetic', 'Fitness', 'Massage', 'Mental Health', 'Skincare', 'nutrition', 'Nutrition', 'yoga', 'Yoga', 'pharmacy', 'Pharmacy', 'urgent-care', 'Urgent Care']
  }],
  
  // Description (for provider bio/about section)
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
  
  // Geolocation for distance calculations
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },

  // Step 3: Photos
  photos: [{
    url: String,
    isPrimary: { type: Boolean, default: false },
    caption: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Step 4: Services (UPDATED with variants support)
  services: [{
    name: { type: String, required: true },
    category: String,
    description: String,
    shortDescription: String,        // Max 100 chars for tiles
    duration: Number,                // Base duration in minutes
    price: Number,                   // Base price (for simple services)
    basePrice: Number,               // Starting price (for "from $X" display)
    hasVariants: { type: Boolean, default: false },
    variants: [{
      name: String,
      description: String,
      price: Number,
      duration: Number,
      isDefault: { type: Boolean, default: false }
    }],
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
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

  // Step 8: Team Members (UPDATED with service linking)
  teamMembers: [{
    name: { type: String, required: true },
    title: String,
    credentials: String,
    bio: String,
    photo: String,
    specialties: [String],
    yearsExperience: Number,
    rating: { type: Number, default: 0 },           // NEW: Average rating
    reviewCount: { type: Number, default: 0 },
  bookingCount: { type: Number, default: 0 },      // NEW: Number of reviews
    acceptsBookings: { type: Boolean, default: true },
    calendarConnected: { type: Boolean, default: false },
    serviceIds: [String]                            // NEW: IDs of services this member can perform
  }],

  // Step 6: Payment & Payout
  payment: {
    method: { type: String, enum: ['stripe', 'bank'] },
    stripeAccountId: String,
    stripeEmail: String,
    stripeOnboardingComplete: { type: Boolean, default: false },
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

  // Step 7: Calendar & Availability
  calendar: {
    provider: { type: String, enum: ['google', 'microsoft', 'apple', 'manual'] },
    calendarId: String,
    calendarEmail: String,
    accessToken: String,
    refreshToken: String,
    tokenExpiry: Date,
    syncDirection: { type: String, enum: ['two-way', 'one-way'] },
    syncBusyOnly: Boolean,
    bufferMinutes: { type: Number, default: 0 },
    businessHours: {
      monday: { isOpen: { type: Boolean, default: false }, open: String, close: String },
      tuesday: { isOpen: { type: Boolean, default: false }, open: String, close: String },
      wednesday: { isOpen: { type: Boolean, default: false }, open: String, close: String },
      thursday: { isOpen: { type: Boolean, default: false }, open: String, close: String },
      friday: { isOpen: { type: Boolean, default: false }, open: String, close: String },
      saturday: { isOpen: { type: Boolean, default: false }, open: String, close: String },
      sunday: { isOpen: { type: Boolean, default: false }, open: String, close: String }
    }
  },

  // Cancellation Policy
  cancellationPolicy: {
  type: String,
  enum: ['flexible', 'standard', 'moderate', 'strict'],
  default: 'standard'
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
  
  // Rating & Reviews (aggregated)
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  bookingCount: { type: Number, default: 0 },

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
  adminNotes: String,
  
  // Password for provider login
  password: String
});

// Index for geospatial queries
providerSchema.index({ location: '2dsphere' });

// Index for search
providerSchema.index({ practiceName: 'text', description: 'text' });

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

// Virtual for bookable team members count
providerSchema.virtual('bookableTeamCount').get(function() {
  if (!this.teamMembers) return 0;
  return this.teamMembers.filter(m => m.acceptsBookings !== false).length;
});

// Ensure virtuals are included in JSON output
providerSchema.set('toJSON', { virtuals: true });
providerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Provider', providerSchema);
