// middleware/categoryUpload.js
import multer from 'multer';

/**
 * File filter for images
 */
export const fileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

/**
 * Handle category upload errors
 */
export const handleCategoryUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 20 subcategory images allowed.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field. Expected categoryImage or subcategoryImages.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error.'
    });
  }
  next();
};

/**
 * Cleanup uploaded files on error
 */
export const cleanupUploadedFiles = (req) => {
  if (req.files) {
    // Delete category image
    if (req.files.categoryImage) {
      req.files.categoryImage.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting category image:', err);
        });
      });
    }
    
    // Delete subcategory images
    if (req.files.subcategoryImages) {
      req.files.subcategoryImages.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting subcategory image:', err);
        });
      });
    }
  }
};