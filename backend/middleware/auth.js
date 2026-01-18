// middleware/auth.js
import jwt from 'jsonwebtoken'; // Add this import
import { verifyToken, decodeToken } from '../utils/jwt.js';
import { User } from '../models/index.js';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    console.log('=== AUTHENTICATE MIDDLEWARE ===');
    console.log('Request URL:', req.originalUrl);
    console.log('Request method:', req.method);
    
    // Get token from header, body, or cookie
    let token = req.headers.authorization || req.body.token || req.query.token;
    
    console.log('Raw Authorization header:', req.headers.authorization);
    console.log('Raw cookies:', req.cookies);
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
      console.log('Token extracted from Bearer header');
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
      console.log('Token extracted from cookies');
    }

    console.log('Token extracted:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

    if (!token) {
      console.log('ERROR: No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // First try to decode to see what's in the token
    try {
      const decodedWithoutVerify = jwt.decode(token);
      console.log('Token decoded (without verification):', decodedWithoutVerify);
    } catch (decodeError) {
      console.log('Cannot decode token:', decodeError.message);
    }

    // Verify token
    console.log('Attempting to verify token...');
    const decoded = verifyToken(token);
    console.log('Token verified successfully:', decoded);
    
    // Check if user still exists
    console.log('Looking for user with ID:', decoded.userId);
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      console.log('ERROR: User not found for ID:', decoded.userId);
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.'
      });
    }

    console.log('User found:', {
      id: user.id,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified
    });

    // Check if user is active
    if (!user.isActive) {
      console.log('ERROR: User account is inactive');
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      phone: user.phone,
      slug: user.slug,
      role: user.role,
      isVerified: user.isVerified
    };
    
    console.log('=== AUTHENTICATION SUCCESSFUL ===');
    console.log('User attached to request:', req.user);
    
    next();
  } catch (error) {
    console.error('=== AUTHENTICATION FAILED ===');
    console.error('Error:', error.message);
    console.error('Error stack:', error.stack);
    
    let message = 'Invalid or expired token.';
    if (error.message === 'Token expired') {
      message = 'Token expired. Please login again.';
    } else if (error.message === 'Invalid token') {
      message = 'Invalid token format.';
    }
    
    return res.status(401).json({
      success: false,
      message: message,
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Optional authentication middleware
 * Doesn't fail if no token, but attaches user if valid token exists
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    // Get token from header, body, or cookie
    let token = req.headers.authorization || req.body.token || req.query.token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(); // No token, continue without user
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Check if user still exists
    const user = await User.findByPk(decoded.userId);
    
    if (user && user.isActive) {
      // Attach user to request
      req.user = {
        id: user.id,
        phone: user.phone,
        slug: user.slug,
        role: user.role,
        isVerified: user.isVerified
      };
    }
    
    next();
  } catch (error) {
    // Invalid token, continue without user
    next();
  }
};

/**
 * Check if user is verified
 */
export const requireVerified = (req, res, next) => {
  if (!req.user || !req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Account verification required.'
    });
  }
  next();
};

/**
 * Customer middleware
 * Checks if user has customer role
 */
export const requireCustomer = (req, res, next) => {
  if (!req.user || req.user.role !== 'customer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Customer account required.'
    });
  }
  next();
};

/**
 * Verified customer middleware
 */
export const requireVerifiedCustomer = (req, res, next) => {
  if (!req.user || req.user.role !== 'customer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Customer account required.'
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Account verification required.'
    });
  }
  next();
};

/**
 * Admin middleware
 * Checks if user has admin role
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};