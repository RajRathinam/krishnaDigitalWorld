import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
  getAdvertisements,
  getAdvertisement,
  createAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
  updateAdvertisementStatus,
  incrementAdViews,
  incrementAdClicks,
  getActiveAdvertisements
} from '../controllers/advertisementController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { fileFilter } from '../middleware/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Create uploads directory for ads videos
const adsVideoDir = path.join(__dirname, '..', 'uploads', 'ads-videos');
const adsThumbnailDir = path.join(__dirname, '..', 'uploads', 'ads-thumbnails');

if (!fs.existsSync(adsVideoDir)) {
  fs.mkdirSync(adsVideoDir, { recursive: true });
}
if (!fs.existsSync(adsThumbnailDir)) {
  fs.mkdirSync(adsThumbnailDir, { recursive: true });
}

// Configure multer for video uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'video') {
        cb(null, adsVideoDir);
      } else if (file.fieldname === 'thumbnail') {
        cb(null, adsThumbnailDir);
      } else {
        cb(null, 'uploads/');
      }
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const cleanName = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
      const ext = path.extname(file.originalname);
      
      if (file.fieldname === 'video') {
        cb(null, `ad-video-${timestamp}_${cleanName}${ext}`);
      } else if (file.fieldname === 'thumbnail') {
        cb(null, `ad-thumbnail-${timestamp}_${cleanName}${ext}`);
      } else {
        cb(null, `ad-file-${timestamp}_${cleanName}${ext}`);
      }
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video') {
      // Allow video files
      const allowedTypes = /mp4|webm|ogg|mov|avi|mkv/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = file.mimetype.startsWith('video/');
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only video files are allowed for video field'));
      }
    } else if (file.fieldname === 'thumbnail') {
      // Allow image files for thumbnails
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = file.mimetype.startsWith('image/');
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for thumbnail field'));
      }
    } else {
      cb(null, true);
    }
  },
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB for videos
    files: 2 // video + thumbnail
  }
});

// Error handler for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 100MB for videos and 5MB for thumbnails.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// Public routes (for frontend display)
router.get('/active', getActiveAdvertisements);
router.patch('/:id/views', incrementAdViews);
router.patch('/:id/clicks', incrementAdClicks);

// Admin routes
router.get('/', authenticate, requireAdmin, getAdvertisements);
router.get('/:id', authenticate, requireAdmin, getAdvertisement);

router.post(
  '/',
  authenticate,
  requireAdmin,
  (req, res, next) => {
    upload.fields([
      { name: 'video', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 }
    ])(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        return handleUploadError(err, req, res, next);
      }
      next();
    });
  },
  createAdvertisement
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  (req, res, next) => {
    upload.fields([
      { name: 'video', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 }
    ])(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        return handleUploadError(err, req, res, next);
      }
      next();
    });
  },
  updateAdvertisement
);

router.delete('/:id', authenticate, requireAdmin, deleteAdvertisement);
router.patch('/:id/status', authenticate, requireAdmin, updateAdvertisementStatus);

export default router;