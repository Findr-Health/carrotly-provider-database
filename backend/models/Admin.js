const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  // Basic Info
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
  name: {
    type: String,
    required: true
  },
  
  // Role & Permissions
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator', 'support', 'analyst'],
    default: 'admin',
    required: true
  },
  
  // Custom permissions override (optional - if set, overrides role defaults)
  customPermissions: {
    providers: {
      view: { type: Boolean },
      create: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean },
      approve: { type: Boolean }
    },
    users: {
      view: { type: Boolean },
      viewPII: { type: Boolean },
      delete: { type: Boolean }
    },
    bookings: {
      view: { type: Boolean },
      cancel: { type: Boolean },
      refund: { type: Boolean }
    },
    analytics: {
      viewBasic: { type: Boolean },
      viewRevenue: { type: Boolean },
      export: { type: Boolean }
    },
    admins: {
      view: { type: Boolean },
      create: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean }
    },
    system: {
      viewAuditLogs: { type: Boolean },
      settings: { type: Boolean },
      apiKeys: { type: Boolean }
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  
  // Security
  passwordChangedAt: Date,
  requirePasswordChange: {
    type: Boolean,
    default: false
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: Date,
  
  // Activity Tracking
  lastLoginAt: Date,
  lastLoginIP: String,
  loginHistory: [{
    timestamp: { type: Date, default: Date.now },
    ip: String,
    userAgent: String,
    success: Boolean
  }],
  
  // Profile
  avatar: String,
  phone: String,
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
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

// Default permissions by role
const rolePermissions = {
  super_admin: {
    providers: { view: true, create: true, edit: true, delete: true, approve: true },
    users: { view: true, viewPII: true, delete: true },
    bookings: { view: true, cancel: true, refund: true },
    analytics: { viewBasic: true, viewRevenue: true, export: true },
    admins: { view: true, create: true, edit: true, delete: true },
    system: { viewAuditLogs: true, settings: true, apiKeys: true }
  },
  admin: {
    providers: { view: true, create: true, edit: true, delete: true, approve: true },
    users: { view: true, viewPII: true, delete: false },
    bookings: { view: true, cancel: true, refund: false },
    analytics: { viewBasic: true, viewRevenue: false, export: true },
    admins: { view: false, create: false, edit: false, delete: false },
    system: { viewAuditLogs: true, settings: false, apiKeys: false }
  },
  moderator: {
    providers: { view: true, create: false, edit: false, delete: false, approve: true },
    users: { view: false, viewPII: false, delete: false },
    bookings: { view: false, cancel: false, refund: false },
    analytics: { viewBasic: false, viewRevenue: false, export: false },
    admins: { view: false, create: false, edit: false, delete: false },
    system: { viewAuditLogs: false, settings: false, apiKeys: false }
  },
  support: {
    providers: { view: true, create: false, edit: false, delete: false, approve: false },
    users: { view: true, viewPII: false, delete: false },
    bookings: { view: true, cancel: false, refund: false },
    analytics: { viewBasic: false, viewRevenue: false, export: false },
    admins: { view: false, create: false, edit: false, delete: false },
    system: { viewAuditLogs: false, settings: false, apiKeys: false }
  },
  analyst: {
    providers: { view: false, create: false, edit: false, delete: false, approve: false },
    users: { view: false, viewPII: false, delete: false },
    bookings: { view: false, cancel: false, refund: false },
    analytics: { viewBasic: true, viewRevenue: true, export: true },
    admins: { view: false, create: false, edit: false, delete: false },
    system: { viewAuditLogs: false, settings: false, apiKeys: false }
  }
};

// Method to get effective permissions (custom overrides role defaults)
adminSchema.methods.getPermissions = function() {
  const defaults = rolePermissions[this.role] || rolePermissions.support;
  
  if (!this.customPermissions) {
    return defaults;
  }
  
  // Merge custom permissions over defaults
  const merged = JSON.parse(JSON.stringify(defaults));
  
  for (const category in this.customPermissions) {
    if (this.customPermissions[category]) {
      for (const permission in this.customPermissions[category]) {
        if (this.customPermissions[category][permission] !== undefined) {
          merged[category][permission] = this.customPermissions[category][permission];
        }
      }
    }
  }
  
  return merged;
};

// Method to check a specific permission
adminSchema.methods.hasPermission = function(category, permission) {
  const perms = this.getPermissions();
  return perms[category] && perms[category][permission] === true;
};

// Method to check if account is locked
adminSchema.methods.isLocked = function() {
  return this.lockedUntil && this.lockedUntil > new Date();
};

// Pre-save middleware
adminSchema.pre('save', async function(next) {
  this.updatedAt = new Date();
  
  // Hash password if modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
    this.passwordChangedAt = new Date();
  }
  
  next();
});

// Method to compare password
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes
adminSchema.index({ email: 1 });
adminSchema.index({ role: 1 });
adminSchema.index({ status: 1 });

// Export role permissions for use elsewhere
adminSchema.statics.rolePermissions = rolePermissions;

// Export role descriptions
adminSchema.statics.roleDescriptions = {
  super_admin: 'Full access to all features including admin management and system settings',
  admin: 'Day-to-day operations including provider and user management',
  moderator: 'Review and approve/reject provider applications',
  support: 'Read-only access to providers, users, and bookings for customer support',
  analyst: 'Access to analytics and reporting features only'
};

module.exports = mongoose.model('Admin', adminSchema);
