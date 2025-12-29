const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');
const { 
  verifyToken, 
  requirePermission, 
  requireSuperAdmin,
  auditLog,
  logAuthEvent 
} = require('../middleware/permissions');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * POST /api/admin/auth/login
 * Admin login - no auth required
 */
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find admin by email
    let admin = await Admin.findOne({ email: email.toLowerCase() });
    
    // If no admin exists and it's the default credentials, create super_admin
    if (!admin && email === 'admin@findrhealth.com' && password === 'admin123') {
      admin = new Admin({
        email: 'admin@findrhealth.com',
        password: password, // Will be hashed by pre-save hook
        name: 'Super Admin',
        role: 'super_admin',
        status: 'active'
      });
      await admin.save();
    }
    
    if (!admin) {
      await logAuthEvent(null, 'auth.login_failed', false, req, 'Invalid email');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if account is locked
    if (admin.isLocked()) {
      await logAuthEvent(admin, 'auth.login_failed', false, req, 'Account locked');
      return res.status(401).json({ 
        error: 'Account is locked. Please try again later.',
        lockedUntil: admin.lockedUntil
      });
    }
    
    // Check if account is active
    if (admin.status !== 'active') {
      await logAuthEvent(admin, 'auth.login_failed', false, req, 'Account inactive');
      return res.status(401).json({ error: 'Account is not active' });
    }
    
    // Check password
    const isValidPassword = await admin.comparePassword(password);
    
    if (!isValidPassword) {
      // Increment failed attempts
      admin.failedLoginAttempts += 1;
      
      // Lock account after 5 failed attempts
      if (admin.failedLoginAttempts >= 5) {
        admin.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }
      
      await admin.save();
      await logAuthEvent(admin, 'auth.login_failed', false, req, 'Invalid password');
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Reset failed attempts on successful login
    admin.failedLoginAttempts = 0;
    admin.lockedUntil = null;
    admin.lastLoginAt = new Date();
    admin.lastLoginIP = req.ip || req.connection?.remoteAddress;
    
    // Add to login history (keep last 10)
    admin.loginHistory.unshift({
      timestamp: new Date(),
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      success: true
    });
    admin.loginHistory = admin.loginHistory.slice(0, 10);
    
    await admin.save();
    
    // Generate token
    const token = jwt.sign(
      { 
        id: admin._id, 
        email: admin.email,
        role: admin.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    await logAuthEvent(admin, 'auth.login', true, req);
    
    res.json({
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permissions: admin.getPermissions(),
        requirePasswordChange: admin.requirePasswordChange
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/admin/auth/logout
 * Admin logout
 */
router.post('/auth/logout', verifyToken, async (req, res) => {
  try {
    await logAuthEvent(req.admin, 'auth.logout', true, req);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/admin/auth/change-password
 * Change own password
 */
router.post('/auth/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    
    const admin = await Admin.findById(req.admin._id);
    
    const isValidPassword = await admin.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    admin.password = newPassword; // Will be hashed by pre-save hook
    admin.requirePasswordChange = false;
    await admin.save();
    
    await logAuthEvent(admin, 'auth.password_change', true, req);
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/admin/admins
 * List all admin users
 * Required: admins.view
 */
router.get('/admins', 
  verifyToken, 
  requirePermission('admins', 'view'),
  async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        role, 
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      const query = {};
      
      if (role) {
        query.role = role;
      }
      
      if (status) {
        query.status = status;
      }
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
      
      const admins = await Admin.find(query)
        .select('-password -loginHistory')
        .sort(sort)
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));
      
      const total = await Admin.countDocuments(query);
      
      // Get counts by role
      const roleCounts = await Admin.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);
      
      res.json({
        admins: admins.map(a => ({
          id: a._id,
          email: a.email,
          name: a.name,
          role: a.role,
          status: a.status,
          lastLoginAt: a.lastLoginAt,
          createdAt: a.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        counts: {
          total,
          byRole: roleCounts.reduce((acc, r) => {
            acc[r._id] = r.count;
            return acc;
          }, {})
        }
      });
    } catch (error) {
      console.error('Get admins error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/**
 * GET /api/admin/admins/:id
 * Get single admin user
 * Required: admins.view
 */
router.get('/admins/:id',
  verifyToken,
  requirePermission('admins', 'view'),
  async (req, res) => {
    try {
      const admin = await Admin.findById(req.params.id)
        .select('-password');
      
      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }
      
      res.json({
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        status: admin.status,
        permissions: admin.getPermissions(),
        customPermissions: admin.customPermissions,
        lastLoginAt: admin.lastLoginAt,
        lastLoginIP: admin.lastLoginIP,
        loginHistory: admin.loginHistory,
        createdAt: admin.createdAt,
        createdBy: admin.createdBy
      });
    } catch (error) {
      console.error('Get admin error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/**
 * POST /api/admin/admins
 * Create new admin user
 * Required: admins.create
 */
router.post('/admins',
  verifyToken,
  requirePermission('admins', 'create'),
  auditLog('admin.create', 'admin', (req, data) => ({
    resourceId: data._id,
    resourceName: data.email,
    changes: { after: { email: data.email, role: data.role } }
  })),
  async (req, res) => {
    try {
      const { email, name, role, password, requirePasswordChange = true } = req.body;
      
      // Validation
      if (!email || !name || !role || !password) {
        return res.status(400).json({ error: 'Email, name, role, and password are required' });
      }
      
      if (!['super_admin', 'admin', 'moderator', 'support', 'analyst'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      
      // Only super_admin can create super_admin
      if (role === 'super_admin' && req.admin.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admins can create super admin accounts' });
      }
      
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
      
      // Check if email exists
      const existing = await Admin.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      
      const admin = new Admin({
        email: email.toLowerCase(),
        name,
        role,
        password,
        requirePasswordChange,
        status: 'active',
        createdBy: req.admin._id
      });
      
      await admin.save();
      
      res.status(201).json({
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        status: admin.status,
        createdAt: admin.createdAt
      });
    } catch (error) {
      console.error('Create admin error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/**
 * PUT /api/admin/admins/:id
 * Update admin user
 * Required: admins.edit
 */
router.put('/admins/:id',
  verifyToken,
  requirePermission('admins', 'edit'),
  async (req, res) => {
    try {
      const { name, role, status, customPermissions } = req.body;
      
      const admin = await Admin.findById(req.params.id);
      
      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }
      
      // Store old values for audit
      const oldValues = {
        name: admin.name,
        role: admin.role,
        status: admin.status
      };
      
      // Only super_admin can modify super_admin
      if (admin.role === 'super_admin' && req.admin.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admins can modify super admin accounts' });
      }
      
      // Only super_admin can set role to super_admin
      if (role === 'super_admin' && req.admin.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admins can assign super admin role' });
      }
      
      // Prevent self-demotion of last super_admin
      if (admin._id.toString() === req.admin._id.toString() && 
          admin.role === 'super_admin' && 
          role !== 'super_admin') {
        const superAdminCount = await Admin.countDocuments({ role: 'super_admin', status: 'active' });
        if (superAdminCount <= 1) {
          return res.status(400).json({ error: 'Cannot demote the last super admin' });
        }
      }
      
      // Update fields
      if (name) admin.name = name;
      if (role) admin.role = role;
      if (status) admin.status = status;
      if (customPermissions !== undefined) admin.customPermissions = customPermissions;
      
      await admin.save();
      
      // Log role change separately
      if (oldValues.role !== admin.role) {
        await AuditLog.log({
          adminId: req.admin._id,
          adminEmail: req.admin.email,
          adminName: req.admin.name,
          adminRole: req.admin.role,
          action: 'admin.role_change',
          resourceType: 'admin',
          resourceId: admin._id,
          resourceName: admin.email,
          changes: {
            before: { role: oldValues.role },
            after: { role: admin.role }
          },
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
      
      // Log status change separately
      if (oldValues.status !== admin.status) {
        await AuditLog.log({
          adminId: req.admin._id,
          adminEmail: req.admin.email,
          adminName: req.admin.name,
          adminRole: req.admin.role,
          action: 'admin.status_change',
          resourceType: 'admin',
          resourceId: admin._id,
          resourceName: admin.email,
          changes: {
            before: { status: oldValues.status },
            after: { status: admin.status }
          },
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
      
      res.json({
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        status: admin.status,
        permissions: admin.getPermissions()
      });
    } catch (error) {
      console.error('Update admin error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/**
 * DELETE /api/admin/admins/:id
 * Delete admin user
 * Required: admins.delete
 */
router.delete('/admins/:id',
  verifyToken,
  requirePermission('admins', 'delete'),
  auditLog('admin.delete', 'admin', (req) => ({
    resourceId: req.params.id
  })),
  async (req, res) => {
    try {
      const admin = await Admin.findById(req.params.id);
      
      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }
      
      // Prevent self-deletion
      if (admin._id.toString() === req.admin._id.toString()) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }
      
      // Only super_admin can delete super_admin
      if (admin.role === 'super_admin' && req.admin.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admins can delete super admin accounts' });
      }
      
      // Prevent deletion of last super_admin
      if (admin.role === 'super_admin') {
        const superAdminCount = await Admin.countDocuments({ role: 'super_admin' });
        if (superAdminCount <= 1) {
          return res.status(400).json({ error: 'Cannot delete the last super admin' });
        }
      }
      
      await Admin.findByIdAndDelete(req.params.id);
      
      res.json({ message: 'Admin deleted successfully' });
    } catch (error) {
      console.error('Delete admin error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/**
 * POST /api/admin/admins/:id/reset-password
 * Reset admin password (super_admin only)
 * Required: admins.edit
 */
router.post('/admins/:id/reset-password',
  verifyToken,
  requirePermission('admins', 'edit'),
  async (req, res) => {
    try {
      const admin = await Admin.findById(req.params.id);
      
      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }
      
      // Generate temporary password
      const tempPassword = crypto.randomBytes(8).toString('hex');
      
      admin.password = tempPassword;
      admin.requirePasswordChange = true;
      admin.failedLoginAttempts = 0;
      admin.lockedUntil = null;
      
      await admin.save();
      
      await AuditLog.log({
        adminId: req.admin._id,
        adminEmail: req.admin.email,
        adminName: req.admin.name,
        adminRole: req.admin.role,
        action: 'admin.password_reset',
        resourceType: 'admin',
        resourceId: admin._id,
        resourceName: admin.email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // In production, you'd email this to the user
      res.json({ 
        message: 'Password reset successfully',
        temporaryPassword: tempPassword,
        note: 'User will be required to change password on next login'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/**
 * GET /api/admin/admins/:id/activity
 * Get admin activity/audit log
 * Required: admins.view OR system.viewAuditLogs
 */
router.get('/admins/:id/activity',
  verifyToken,
  async (req, res) => {
    try {
      // Check if user can view this admin's activity
      const canViewAll = req.admin.hasPermission('system', 'viewAuditLogs');
      const canViewAdmins = req.admin.hasPermission('admins', 'view');
      const isOwnActivity = req.params.id === req.admin._id.toString();
      
      if (!canViewAll && !canViewAdmins && !isOwnActivity) {
        return res.status(403).json({ error: 'Permission denied' });
      }
      
      const { page = 1, limit = 50 } = req.query;
      
      const result = await AuditLog.getAdminActivity(req.params.id, { page, limit });
      
      res.json(result);
    } catch (error) {
      console.error('Get activity error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/**
 * GET /api/admin/audit-logs
 * Get all audit logs
 * Required: system.viewAuditLogs
 */
router.get('/audit-logs',
  verifyToken,
  requirePermission('system', 'viewAuditLogs'),
  async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 50, 
        adminId,
        action,
        resourceType,
        startDate,
        endDate
      } = req.query;
      
      const query = {};
      
      if (adminId) query.adminId = adminId;
      if (action) query.action = action;
      if (resourceType) query.resourceType = resourceType;
      
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }
      
      const logs = await AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));
      
      const total = await AuditLog.countDocuments(query);
      
      res.json({
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/**
 * GET /api/admin/roles
 * Get available roles and their descriptions
 * No auth required (useful for forms)
 */
router.get('/roles', verifyToken, async (req, res) => {
  res.json({
    roles: Object.entries(Admin.roleDescriptions).map(([role, description]) => ({
      role,
      description,
      permissions: Admin.rolePermissions[role]
    }))
  });
});

/**
 * GET /api/admin/me
 * Get current admin profile
 */
router.get('/me', verifyToken, async (req, res) => {
  res.json({
    id: req.admin._id,
    email: req.admin.email,
    name: req.admin.name,
    role: req.admin.role,
    status: req.admin.status,
    permissions: req.admin.getPermissions(),
    lastLoginAt: req.admin.lastLoginAt,
    requirePasswordChange: req.admin.requirePasswordChange
  });
});

module.exports = router;
