const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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

  // Insurance (encrypted sensitive fields)
  insurance: {
    hasInsurance: { type: Boolean, default: false },
    provider: String,
    memberId: String,  // Consider encrypting
    groupNumber: String,
    insurancePhone: String,
    primaryInsured: String,
    relationship: { type: String, enum: ['self', 'spouse', 'child', 'other', ''] }
  },

  // Payment Methods - store tokens only, not actual card numbers
  paymentMethods: [{
    type: { type: String, enum: ['credit', 'debit', 'hsa', 'fsa', 'bank'] },
    lastFour: String,  // Only last 4 digits
    expiryMonth: Number,
    expiryYear: Number,
    isDefault: { type: Boolean, default: false },
    nickname: String,
    stripePaymentMethodId: String,  // Use payment processor tokens
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
    searchRadius: { type: Number, default: 25 }
  },

  // Saved/Favorites
  savedProviders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider'
  }],

  // Profile
  profilePhoto: String,

  // Agreement - Full tracking for legal compliance
  agreement: {
    signed: { type: Boolean, required: true },
    signedAt: { type: Date, required: true },
    version: { type: String, required: true },
    ipAddress: String,
    userAgent: String,
    documents: [String],
    // Store reference to actual agreement document
    agreementUrl: { type: String, default: '/legal/user-agreement-2025-v1.pdf' },
    // Hash of agreement content for verification
    contentHash: String
  },

  // Agreement History - track all versions user has agreed to
  agreementHistory: [{
    version: String,
    signedAt: Date,
    ipAddress: String,
    agreementUrl: String
  }],

  // Account Status
  status: {
    type: String,
    enum: ['active', 'suspended', 'deleted', 'pending'],
    default: 'pending'
  },
  
  // Email Verification
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Password Reset
  passwordResetToken: String,
  passwordResetExpires: Date,

  // Security
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  lastPasswordChange: Date,
  securityQuestions: [{
    question: String,
    answerHash: String  // Hashed answers
  }],

  // Metadata
  lastLogin: Date,
  lastLoginIp: String,
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
    this.lastPasswordChange = new Date();
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 3600000; // 1 hour
  return resetToken;
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const verifyToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verifyToken)
    .digest('hex');
  this.emailVerificationExpires = Date.now() + 86400000; // 24 hours
  return verifyToken;
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now();
};

// Increment failed login attempts
userSchema.methods.incFailedLogin = async function() {
  // Reset if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    await this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
    return;
  }
  
  const updates = { $inc: { failedLoginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.failedLoginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 7200000 }; // 2 hours
  }
  
  await this.updateOne(updates);
};

// Reset failed login attempts on successful login
userSchema.methods.resetFailedLogin = async function() {
  await this.updateOne({
    $set: { failedLoginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Don't return sensitive data in JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  delete obj.securityQuestions;
  delete obj.failedLoginAttempts;
  delete obj.lockUntil;
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
