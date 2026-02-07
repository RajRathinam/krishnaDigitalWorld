import { sanitizeInput, validateRegistration, validateLogin, validateOTP, validateResendOTP,validateProduct, validateCartItem, validateOrder, validateReview, validateCoupon, validateUserUpdate } from '../utils/validators.js';

/**
 * Generic validation middleware
 */
export const validate = (validator) => {
  return (req, res, next) => {
    // Sanitize input - create copies instead of modifying originals
    const sanitizedBody = sanitizeInput(req.body);
    const sanitizedQuery = sanitizeInput(req.query);
    const sanitizedParams = sanitizeInput(req.params);
    
    // Attach sanitized data to request object
    req.sanitizedBody = sanitizedBody;
    req.sanitizedQuery = sanitizedQuery;
    req.sanitizedParams = sanitizedParams;
    
    // For backward compatibility, you can assign to req.body
    // but NOT to req.query or req.params
    req.body = sanitizedBody;
    
    const validation = validator(sanitizedBody);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }
    
    next();
  };
};

/**
 * Route-specific validators
 */
export const validateRegistrationData = validate(validateRegistration);
export const validateLoginData = validate(validateLogin);
export const validateOTPData = validate(validateOTP);
export const validateProductData = validate(validateProduct);
export const validateCartItemData = validate(validateCartItem);
export const validateOrderData = validate(validateOrder);
export const validateReviewData = validate(validateReview);
export const validateCouponData = validate(validateCoupon);
export const validateUserUpdateData = validate(validateUserUpdate);
// middleware/validation.js - Add this line
export const validateResendOTPData = validate(validateResendOTP);
/**
 * Validate query parameters
 */
export const validatePagination = (req, res, next) => {
  // Create a sanitized copy of query params
  const query = { ...req.query };
  
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  
  if (page < 1 || limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: 'Invalid pagination parameters'
    });
  }
  
  req.pagination = { page, limit };
  next();
};

/**
 * Validate sort parameters
 */
export const validateSort = (allowedFields = []) => {
  return (req, res, next) => {
    // Create a copy of query params
    const query = { ...req.query };
    
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    
    if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: `Invalid sort field. Allowed: ${allowedFields.join(', ')}`
      });
    }
    
    if (!['asc', 'desc'].includes(sortOrder.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Sort order must be "asc" or "desc"'
      });
    }
    
    req.sort = { sortBy, sortOrder: sortOrder.toLowerCase() };
    next();
  };
};

/**
 * Validate filter parameters
 */
export const validateFilters = (allowedFilters = {}) => {
  return (req, res, next) => {
    // Create a copy of query params
    const query = { ...req.query };
    
    const filters = {};
    const errors = [];
    
    Object.keys(query).forEach(key => {
      if (key.startsWith('filter[') && key.endsWith(']')) {
        const filterKey = key.substring(7, key.length - 1);
        
        if (allowedFilters[filterKey]) {
          const value = query[key];
          const validator = allowedFilters[filterKey];
          
          if (validator(value)) {
            filters[filterKey] = value;
          } else {
            errors.push(`Invalid value for filter ${filterKey}`);
          }
        } else {
          errors.push(`Filter ${filterKey} is not allowed`);
        }
      }
    });
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filters',
        errors
      });
    }
    
    req.filters = filters;
    next();
  };
};

/**
 * Validate search query
 */
export const validateSearch = (req, res, next) => {
  // Create a copy of query params
  const query = { ...req.query };
  
  const search = query.search || '';
  
  if (search && search.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Search query too long (max 100 characters)'
    });
  }
  
  req.search = search.trim();
  next();
};

/**
 * Validate date range
 */
export const validateDateRange = (req, res, next) => {
  // Create a copy of query params
  const query = { ...req.query };
  
  const dateFrom = query.dateFrom;
  const dateTo = query.dateTo;
  
  if (dateFrom && isNaN(Date.parse(dateFrom))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid dateFrom format (use YYYY-MM-DD)'
    });
  }
  
  if (dateTo && isNaN(Date.parse(dateTo))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid dateTo format (use YYYY-MM-DD)'
    });
  }
  
  if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
    return res.status(400).json({
      success: false,
      message: 'dateFrom must be before dateTo'
    });
  }
  
  req.dateRange = {
    from: dateFrom ? new Date(dateFrom) : null,
    to: dateTo ? new Date(dateTo) : null
  };
  
  next();
};

/**
 * Sanitize middleware - safer approach
 */
export const sanitizeMiddleware = () => {
  return (req, res, next) => {
    // Create sanitized copies
    const sanitizedBody = req.body ? sanitizeInput(req.body) : {};
    const sanitizedQuery = req.query ? sanitizeInput(req.query) : {};
    const sanitizedParams = req.params ? sanitizeInput(req.params) : {};
    
    // Attach sanitized data to custom properties
    req.sanitized = {
      body: sanitizedBody,
      query: sanitizedQuery,
      params: sanitizedParams
    };
    
    // You can still modify req.body (but NOT req.query or req.params)
    req.body = sanitizedBody;
    
    next();
  };
};