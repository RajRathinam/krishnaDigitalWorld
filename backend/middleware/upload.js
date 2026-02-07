import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory:', uploadsDir);
}

/**
 * Configure local disk storage for multer
 */
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalname = file.originalname.split('.')[0];
    // Clean filename - remove special characters
    const cleanName = originalname.replace(/[^a-zA-Z0-9]/g, '_');
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}_${cleanName}${ext}`;
    cb(null, filename);
  }
});

/**
 * File filter for image uploads
 */
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

/**
 * Multer upload instance
 */
export const upload = multer({
  storage: diskStorage,
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
 * Process uploaded files - Creates the req.uploadedFiles array with local paths
 */
export const processUploadedFiles = (req, res, next) => {
  console.log('Processing uploaded files...');

  if (req.files && req.files.length > 0) {
    console.log(`Found ${req.files.length} uploaded files`);

    req.uploadedFiles = req.files.map(file => {
      const localPath = `/uploads/${file.filename}`;
      console.log(`File saved locally: ${localPath}`);
      return {
        url: localPath, // Local path instead of Cloudinary URL
        publicId: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      };
    });

    console.log('Uploaded files processed:', req.uploadedFiles.length);
  } else if (req.file) {
    const localPath = `/uploads/${req.file.filename}`;
    console.log('Single file saved locally:', localPath);

    req.uploadedFiles = [{
      url: localPath, // Local path instead of Cloudinary URL
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
 * Delete image from local storage
 */
export const deleteImage = async (filename) => {
  try {
    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('✅ Deleted local file:', filename);
      return { result: 'ok' };
    } else {
      console.log('⚠️ File not found:', filename);
      return { result: 'not found' };
    }
  } catch (error) {
    console.error('Error deleting local file:', error);
    throw error;
  }
};

/**
 * Delete multiple images from local storage
 */
export const deleteImages = async (filenames) => {
  try {
    const results = [];
    for (const filename of filenames) {
      const result = await deleteImage(filename);
      results.push(result);
    }
    return { deleted: results.length };
  } catch (error) {
    console.error('Error deleting local files:', error);
    throw error;
  }
};