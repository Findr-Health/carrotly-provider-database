const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Info
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },

  // Address
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },

  // Insurance
  insurance: {
    hasInsurance: { type: Boolean, default: false },
    provider: String,
    memberId: String,
    groupNumber: String,
    insurancePhone: String,
    primaryInsured: String,
    relationship: { type: String, enum: ['self', 'spouse', 'child', 'other'] }
  },

  // Payment Methods
  paymentMethods: [{
    type: { type: String, enum: ['credit', 'debit', 'hsa', 'fsa', 'bank'] },
    lastFour: String,
    expiryMonth: Number,
    expiryYear: Number,
    isDefault: { type: Boolean, default: false },
    nickname: String,
    addedAt: { type: Date, default: Date.now }
  }],

  // Emergency Contact
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },

  // Preferences
  preferences: {
    language: { type: String, default: 'en' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false }
    },
    searchRadius: { type: Number, default: 25 } // miles
  },

  // Saved/Favorites
  savedProviders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider'
  }],

  // Profile
  profilePhoto: String,

  // Agreement
  agreement: {
    signed: { type: Boolean, required: true },
    signedAt: { type: Date, required: true },
    version: { type: String, required: true },
    ipAddress: String,
    documents: [String]
  },

  // Account Status
  status: {
    type: String,
    enum: ['active', 'suspended', 'deleted', 'pending'],
    default: 'pending'
  },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,

  // Metadata
  lastLogin: Date,
  loginCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  this.updatedAt = new Date();
  
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Don't return sensitive data in JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  return obj;
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
