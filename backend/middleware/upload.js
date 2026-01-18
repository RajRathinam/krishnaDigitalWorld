import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

/**
 * Configure Cloudinary storage for multer
 */
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecommerce/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const originalname = file.originalname.split('.')[0];
      // Clean filename
      const cleanName = originalname.replace(/[^a-zA-Z0-9]/g, '_');
      return `product_${timestamp}_${cleanName}`;
    }
  }
});

/**
 * File filter for image uploads
 */
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

/**
 * Multer upload instance
 */
export const upload = multer({
  storage: cloudinaryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 20 // Maximum 20 files
  }
});

/**
 * Single image upload middleware
 */
export const uploadSingleImage = (fieldName = 'image') => {
  return upload.single(fieldName);
};

/**
 * Multiple images upload middleware
 */
export const uploadMultipleImages = (fieldName = 'images', maxCount = 20) => {
  return upload.array(fieldName, maxCount);
};

/**
 * Product images upload middleware (accepts any field name)
 */
export const uploadProductImages = () => {
  return upload.any(); // Accepts any field name for images
};

/**
 * Handle upload errors
 */
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 20 files allowed.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field in file upload.'
      });
    }
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error.'
    });
  }
  next();
};

/**
 * Process uploaded files - CRITICAL: This creates the req.uploadedFiles array
 */
export const processUploadedFiles = (req, res, next) => {
  console.log('Processing uploaded files...');
  
  if (req.files && req.files.length > 0) {
    console.log(`Found ${req.files.length} uploaded files`);
    
    req.uploadedFiles = req.files.map(file => {
      console.log(`File uploaded to Cloudinary: ${file.path}`);
      return {
        url: file.path, // Cloudinary URL
        publicId: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      };
    });
    
    console.log('Uploaded files processed:', req.uploadedFiles.length);
  } else if (req.file) {
    console.log('Single file uploaded to Cloudinary:', req.file.path);
    
    req.uploadedFiles = [{
      url: req.file.path, // Cloudinary URL
      publicId: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    }];
  } else {
    req.uploadedFiles = [];
    console.log('No files uploaded');
  }
  next();
};

/**
 * Validate images for product
 */
export const validateProductImages = (req, res, next) => {
  console.log('Validating product images...');
  
  // Check if we have existing colorsAndImages or uploaded files
  const hasColorsAndImages = req.body.colorsAndImages && 
    req.body.colorsAndImages.trim() !== '' && 
    req.body.colorsAndImages.trim() !== '{}';
  
  const hasUploadedFiles = req.uploadedFiles && req.uploadedFiles.length > 0;
  
  console.log('Validation check:', { hasColorsAndImages, hasUploadedFiles });
  
  if (!hasColorsAndImages && !hasUploadedFiles) {
    return res.status(400).json({
      success: false,
      message: 'At least one image is required for the product.'
    });
  }
  next();
};

/**
 * Delete image from Cloudinary
 */
export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

/**
 * Delete multiple images from Cloudinary
 */
export const deleteImages = async (publicIds) => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return result;
  } catch (error) {
    console.error('Error deleting images from Cloudinary:', error);
    throw error;
  }
};