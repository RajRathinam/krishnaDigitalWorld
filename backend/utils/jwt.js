// utils/jwt.js
import jwt from 'jsonwebtoken';

// Add default values for environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token
 */
export const generateToken = (user) => {
  const payload = {
    userId: user.id,
    phone: user.phone,
    slug: user.slug,
    role: user.role,
    isVerified: user.isVerified
  };

  console.log('Generating token with secret:', JWT_SECRET ? 'Set' : 'Not set');
  console.log('Token expires in:', JWT_EXPIRES_IN);
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  try {
    console.log('Verifying token with secret:', JWT_SECRET ? 'Set' : 'Not set');
    console.log('Token to verify:', token ? token.substring(0, 20) + '...' : 'No token');
    
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('JWT verification error details:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Token:', token ? token.substring(0, 50) + '...' : 'No token');
    
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw new Error('Invalid or expired token');
  }
};

/**
 * Decode token without verification
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('JWT decode error:', error.message);
    throw new Error('Invalid token');
  }
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (user) => {
  const payload = {
    userId: user.id,
    phone: user.phone,
    type: 'refresh'
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '30d'
  });
};

/**
 * Set token cookie
 */
export const setTokenCookie = (res, token, tokenName = 'token') => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 24 * 60 * 60 * 1000 // 15 days
  };

  res.cookie(tokenName, token, cookieOptions);
};

/**
 * Clear token cookie
 */
export const clearTokenCookie = (res, tokenName = 'token') => {
  res.clearCookie(tokenName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
};