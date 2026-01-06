const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Authentication
  authProvider: {
    type: String,
    enum: ['email', 'google', 'apple', 'facebook'],
    default: 'email'
  },
  socialId: String,
  
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    select: false  // Don't include password in queries by default
  },
  
  // Profile
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
  phone: {
    type: String,
    trim: true
  },
  photoUrl: String,
  
  // Date of birth (for age-related services)
  dateOfBirth: Date,
  
  // User's location (for nearby searches)
  location: {
    city: String,
    state: String,
    zip: String,
    coordinates: {
      type: [Number],  // [longitude, latitude]
      default: undefined
    }
  },
  
  // Favorites
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider'
  }],
  
  // Notification Preferences
  notificationPreferences: {
    bookingReminders: { type: Boolean, default: true },
    bookingConfirmations: { type: Boolean, default: true },
    promotions: { type: Boolean, default: false },
    newsletter: { type: Boolean, default: false },
    smsEnabled: { type: Boolean, default: false },
    pushEnabled: { type: Boolean, default: true }
  },
  
  // Device tokens for push notifications
  deviceTokens: [{
    token: String,
    platform: { type: String, enum: ['ios', 'android', 'web'] },
    deviceModel: String,
    addedAt: { type: Date, default: Date.now }
  }],
  // Stripe
  stripeCustomerId: String,
  // Account Status
  status: {
    type: String,
    enum: ['active', 'suspended', 'deleted'],
    default: 'active'
  },
  
  // Email verification
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Password reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date,
  lastLoginAt: Date,
  lastLoginIp: String
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  this.updatedAt = new Date();
  
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Virtual for initials
userSchema.virtual('initials').get(function() {
  return `${this.firstName?.[0] || ''}${this.lastName?.[0] || ''}`.toUpperCase();
});

// Include virtuals in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Remove sensitive fields when converting to JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.passwordResetToken;
  delete obj.deviceTokens;
  return obj;
};

// Indexes
userSchema.index({ status: 1 });
userSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('User', userSchema);
