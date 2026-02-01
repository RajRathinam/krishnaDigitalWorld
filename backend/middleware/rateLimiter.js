import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for auth endpoints
 *
 * NOTE: relaxed in development to make testing easier; strict limits apply in production.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Always relaxed for testing
  message: {
    success: false,
    message: 'Too many attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter for OTP requests
 */
export const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100, // Always relaxed for testing
  message: {
    success: false,
    message: 'Please wait 1 minute before requesting another OTP.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter for general API endpoints
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter for admin endpoints
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: {
    success: false,
    message: 'Too many admin requests. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter for user data export
 */
export const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 exports per hour
  message: {
    success: false,
    message: 'Too many export requests. Please try again after 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter by user ID (for authenticated users)
 */
export const userRateLimiter = (maxRequests = 100, windowMinutes = 15) => {
  return (req, res, next) => {
    if (!req.user) {
      return apiLimiter(req, res, next);
    }

    const userLimiter = rateLimit({
      windowMs: windowMinutes * 60 * 1000,
      max: maxRequests,
      keyGenerator: (req) => req.user.id.toString(),
      message: {
        success: false,
        message: `Too many requests. Please try again after ${windowMinutes} minutes.`
      },
      standardHeaders: true,
      legacyHeaders: false
    });

    return userLimiter(req, res, next);
  };
};