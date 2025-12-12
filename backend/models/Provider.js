const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  placeId: {
    type: String,
    sparse: true
  },
  practiceName: {
    type: String,
    required: true
  },
  providerTypes: [{
    type: String,
    required: true
  }],
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  address: {
    street: String,
    suite: String,
    city: String,
    state: String,
    zip: String
  },
  photos: [{
    url: String,
    isPrimary: { type: Boolean, default: false }
  }],
  services: [{
    serviceId: String,
    name: String,
    category: String,
    duration: Number,
    price: Number
  }],
  credentials: {
    licenseNumber: String,
    licenseState: String,
    licenseExpiration: Date,
    certifications: [String],
    yearsExperience: Number,
    education: String
  },
  insuranceAccepted: [String],
  languagesSpoken: [String],
  teamMembers: [{
    name: String,
    title: String,
    photo: String,
    bio: String
  }],
  agreement: {
    signed: { type: Boolean, default: false },
    signedAt: Date,
    signature: String,
    signerTitle: String,
    version: String
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'pending'
  },
  visibility: {
    type: String,
    enum: ['hidden', 'visible'],
    default: 'hidden'
  },
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
providerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Provider', providerSchema);
