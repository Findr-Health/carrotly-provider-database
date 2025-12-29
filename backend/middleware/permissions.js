const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware to verify JWT token and attach admin to request
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get full admin record with permissions
    const admin = await Admin.findById(decoded.id);
    
    if (!admin) {
      return res.status(401).json({ error: 'Admin not found' });
    }
    
    if (admin.status !== 'active') {
      return res.status(401).json({ error: 'Account is not active' });
    }
    
    if (admin.isLocked()) {
      return res.status(401).json({ error: 'Account is locked. Please try again later.' });
    }
    
    // Attach admin and permissions to request
    req.admin = admin;
    req.adminPermissions = admin.getPermissions();
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Factory function to create permission check middleware
 * @param {string} category - Permission category (providers, users, etc.)
 * @param {string} permission - Specific permission (view, create, etc.)
 */
const requirePermission = (category, permission) => {
  return (req, res, next) => {
    if (!req.admin || !req.adminPermissions) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!req.admin.hasPermission(category, permission)) {
      // Log unauthorized access attempt
      AuditLog.log({
        adminId: req.admin._id,
        adminEmail: req.admin.email,
        adminName: req.admin.name,
        adminRole: req.admin.role,
        action: `${category}.${permission}`,
        resourceType: category,
        success: false,
        errorMessage: 'Permission denied',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(403).json({ 
        error: 'Permission denied',
        required: `${category}.${permission}`
      });
    }
    
    next();
  };
};

/**
 * Check if admin has any of the specified permissions
 */
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.admin || !req.adminPermissions) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const hasAny = permissions.some(([category, permission]) => 
      req.admin.hasPermission(category, permission)
    );
    
    if (!hasAny) {
      return res.status(403).json({ 
        error: 'Permission denied',
        required: 'One of: ' + permissions.map(p => p.join('.')).join(', ')
      });
    }
    
    next();
  };
};

/**
 * Check if admin is super_admin
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.admin || req.admin.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

/**
 * Middleware to log admin actions
 */
const auditLog = (action, resourceType, getResourceInfo = null) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json to capture response
    res.json = async (data) => {
      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          let resourceId = null;
          let resourceName = null;
          let changes = null;
          
          // Get resource info if function provided
          if (getResourceInfo) {
            const info = getResourceInfo(req, data);
            resourceId = info.resourceId;
            resourceName = info.resourceName;
            changes = info.changes;
          } else {
            // Default: try to get ID from params or response
            resourceId = req.params.id || data?._id || data?.id;
            resourceName = data?.practiceName || data?.name || data?.email;
          }
          
          await AuditLog.log({
            adminId: req.admin._id,
            adminEmail: req.admin.email,
            adminName: req.admin.name,
            adminRole: req.admin.role,
            action,
            resourceType,
            resourceId,
            resourceName,
            changes,
            ip: req.ip || req.connection?.remoteAddress,
            userAgent: req.get('User-Agent'),
            success: true
          });
        } catch (logError) {
          console.error('Audit log error:', logError);
          // Don't fail the request if logging fails
        }
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * Log authentication events
 */
const logAuthEvent = async (admin, action, success, req, errorMessage = null) => {
  await AuditLog.log({
    adminId: admin?._id || null,
    adminEmail: admin?.email || req.body?.email,
    adminName: admin?.name,
    adminRole: admin?.role,
    action,
    resourceType: 'admin',
    resourceId: admin?._id,
    resourceName: admin?.email || req.body?.email,
    success,
    errorMessage,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('User-Agent')
  });
};

/**
 * Middleware to filter sensitive data based on permissions
 */
const filterSensitiveData = (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = (data) => {
    // If user can't view revenue, strip it from responses
    if (!req.admin.hasPermission('analytics', 'viewRevenue')) {
      data = stripRevenue(data);
    }
    
    // If user can't view PII, strip it from user data
    if (!req.admin.hasPermission('users', 'viewPII')) {
      data = stripPII(data);
    }
    
    return originalJson(data);
  };
  
  next();
};

// Helper to strip revenue data
function stripRevenue(data) {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(stripRevenue);
  }
  
  if (typeof data === 'object') {
    const stripped = { ...data };
    delete stripped.revenue;
    delete stripped.gross;
    delete stripped.net;
    delete stripped.fees;
    delete stripped.totalValue;
    delete stripped.bookingAmount;
    
    // Recursively strip nested objects
    for (const key in stripped) {
      if (typeof stripped[key] === 'object') {
        stripped[key] = stripRevenue(stripped[key]);
      }
    }
    
    return stripped;
  }
  
  return data;
}

// Helper to strip PII
function stripPII(data) {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(stripPII);
  }
  
  if (typeof data === 'object') {
    const stripped = { ...data };
    
    // Mask email
    if (stripped.email) {
      const [local, domain] = stripped.email.split('@');
      stripped.email = local.slice(0, 2) + '***@' + domain;
    }
    
    // Mask phone
    if (stripped.phone) {
      stripped.phone = '***-***-' + stripped.phone.slice(-4);
    }
    
    // Remove sensitive fields
    delete stripped.password;
    delete stripped.taxId;
    delete stripped.accountNumber;
    delete stripped.routingNumber;
    
    return stripped;
  }
  
  return data;
}

module.exports = {
  verifyToken,
  requirePermission,
  requireAnyPermission,
  requireSuperAdmin,
  auditLog,
  logAuthEvent,
  filterSensitiveData
};
