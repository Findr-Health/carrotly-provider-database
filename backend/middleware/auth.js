// backend/middleware/auth.js
// General authentication middleware for Findr Health API
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware to verify JWT token and attach user/provider to request
 * Used for general API authentication (not admin-specific)
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required - no token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach decoded token data to request
    // Can contain userId, providerId, email, etc depending on what was encoded
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Optional auth - allows request to proceed with or without token
 * If token present and valid, attaches user data
 * If no token or invalid, continues without user data
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // No token, continue without auth
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    // Invalid token, but don't block request
    console.warn('Optional auth failed:', error.message);
  }
  
  next();
};


/**
 * Middleware specifically for provider-authenticated routes
 * Verifies token and ensures user has providerId
 */
const authenticateProvider = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      error: 'Authentication required - no token provided' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if this is a provider account
    if (!decoded.providerId) {
      return res.status(403).json({ 
        success: false,
        error: 'Provider access required. This endpoint is only accessible to providers.' 
      });
    }
    
    // Attach decoded token data to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    return res.status(401).json({ success: false, error: 'Authentication failed' });
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  authenticateProvider
};
