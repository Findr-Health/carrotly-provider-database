const mongoose = require('mongoose');

// Standard provider types
const PROVIDER_TYPES = [
  'Medical',
  'Urgent Care', 
  'Dental',
  'Mental Health',
  'Skincare/Aesthetics',
  'Massage/Bodywork',
  'Fitness/Training',
  'Yoga/Pilates',
  'Nutrition/Wellness',
  'Pharmacy/RX'
];

const providerSchema = new mongoose.Schema({
  // Basic Information
  placeId: String,
  practiceName: {
    type: String,
    required: true
  },
  providerTypes: [{
    type: String,
    enum: PROVIDER_TYPES
  }],
  
  // Contact Info
  contactInfo: {
    email: String,
    phone: String,
    website: String
  },
  email: String,
  phone: String,
  website: String,

  // Location
  address: {
    street: String,
    suite: String,
    city: String,
    state: String,
    zip: String
  },

  // Photos
  photos: [{
    url: String,
    isPrimary: { type: Boolean, default: false },
    caption: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Services
  services: [{
    serviceId: String,
    name: { type: String, required: true },
    category: String,
    duration: Number,
    price: Number,
    description: String,
    isActive: { type: Boolean, default: true }
  }],

  // Credentials
  credentials: {
    licenseNumber: String,
    licenseState: String,
    licenseExpiration: Date,
    yearsExperience: Number,
    education: String,
    certifications: [String]
  },

  // Insurance & Languages
  insuranceAccepted: [String],
  languagesSpoken: [String],

  // Team Members
  teamMembers: [{
    name: { type: String, required: true },
    title: String,
    credentials: String,
    bio: String,
    photo: String,
    specialties: [String],
    yearsExperience: Number,
    acceptsBookings: { type: Boolean, default: true }
  }],

  // Agreement
  agreement: {
    signed: Boolean,
    signedAt: Date,
    signature: String,
    signerTitle: String,
    version: String,
    initials: {
      type: Map,
      of: String
    }
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  visibility: {
    type: String,
    enum: ['hidden', 'visible'],
    default: 'hidden'
  },

  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  approvedAt: Date,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  adminNotes: String
});

// Update timestamp on save
providerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Export the types for use in other files
providerSchema.statics.PROVIDER_TYPES = PROVIDER_TYPES;

module.exports = mongoose.model('Provider', providerSchema);
