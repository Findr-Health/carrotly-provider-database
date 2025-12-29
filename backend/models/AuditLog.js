const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Who performed the action
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    index: true
  },
  adminEmail: {
    type: String,
    required: true
  },
  adminName: String,
  adminRole: String,
  
  // What action was performed
  action: {
    type: String,
    enum: [
      // Provider actions
      'provider.view',
      'provider.create',
      'provider.update',
      'provider.delete',
      'provider.approve',
      'provider.reject',
      'provider.suspend',
      
      // Service actions
      'service.create',
      'service.update',
      'service.delete',
      
      // Team actions
      'team.add',
      'team.remove',
      
      // Photo actions
      'photo.add',
      'photo.remove',
      
      // Admin actions
      'admin.create',
      'admin.update',
      'admin.delete',
      'admin.role_change',
      'admin.status_change',
      'admin.password_reset',
      
      // Auth actions
      'auth.login',
      'auth.logout',
      'auth.login_failed',
      'auth.password_change',
      
      // Booking actions (future)
      'booking.view',
      'booking.cancel',
      'booking.refund',
      
      // User actions (future)
      'user.view',
      'user.delete',
      
      // Analytics actions
      'analytics.view',
      'analytics.export',
      
      // System actions
      'system.settings_change',
      'system.export_data'
    ],
    required: true,
    index: true
  },
  
  // What resource was affected
  resourceType: {
    type: String,
    enum: ['provider', 'service', 'team', 'photo', 'admin', 'user', 'booking', 'analytics', 'system'],
    required: true,
    index: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  resourceName: String,
  
  // Change details
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    fields: [String] // List of fields that changed
  },
  
  // Context
  ip: String,
  userAgent: String,
  requestId: String, // For tracing
  
  // Result
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: String,
  
  // Metadata
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Optional notes
  notes: String
});

// Compound indexes for common queries
auditLogSchema.index({ adminId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });

// Static method to create audit log entry
auditLogSchema.statics.log = async function(data) {
  try {
    const entry = new this(data);
    await entry.save();
    return entry;
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw - audit logging should not break main functionality
    return null;
  }
};

// Static method to get logs for a specific admin
auditLogSchema.statics.getAdminActivity = async function(adminId, options = {}) {
  const { page = 1, limit = 50, startDate, endDate } = options;
  
  const query = { adminId };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  const logs = await this.find(query)
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  
  const total = await this.countDocuments(query);
  
  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to get logs for a specific resource
auditLogSchema.statics.getResourceHistory = async function(resourceType, resourceId, options = {}) {
  const { page = 1, limit = 50 } = options;
  
  const query = { resourceType, resourceId };
  
  const logs = await this.find(query)
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('adminId', 'name email');
  
  const total = await this.countDocuments(query);
  
  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
