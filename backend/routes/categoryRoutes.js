// routes/categoryRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path'; // <-- ADD THIS IMPORT
import { fileURLToPath } from 'url'; // <-- ADD THIS IMPORT
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryStatus
} from '../controllers/categoryController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { 
  fileFilter,
  handleCategoryUploadError 
} from '../middleware/categoryUpload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Create uploads directories if they don't exist
import fs from 'fs';
const categoriesUploadDir = path.join(__dirname, '..', 'uploads', 'categories');
const subcategoriesUploadDir = path.join(__dirname, '..', 'uploads', 'subcategories');

if (!fs.existsSync(categoriesUploadDir)) {
  fs.mkdirSync(categoriesUploadDir, { recursive: true });
}
if (!fs.existsSync(subcategoriesUploadDir)) {
  fs.mkdirSync(subcategoriesUploadDir, { recursive: true });
}

// Configure multer for both field types
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'categoryImage') {
        cb(null, categoriesUploadDir);
      } else if (file.fieldname === 'subcategoryImages') {
        cb(null, subcategoriesUploadDir);
      } else {
        cb(null, 'uploads/');
      }
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const cleanName = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
      const ext = path.extname(file.originalname);
      
      if (file.fieldname === 'categoryImage') {
        cb(null, `category-${timestamp}_${cleanName}${ext}`);
      } else if (file.fieldname === 'subcategoryImages') {
        cb(null, `subcategory-${timestamp}_${cleanName}${ext}`);
      } else {
        cb(null, `file-${timestamp}_${cleanName}${ext}`);
      }
    }
  }),
  fileFilter: fileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 21 // 1 category image + 20 subcategory images
  }
});

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategory);

// Admin routes - use fields() to handle both file types together
router.post(
  '/', 
  authenticate, 
  requireAdmin,
  (req, res, next) => {
    upload.fields([
      { name: 'categoryImage', maxCount: 1 },
      { name: 'subcategoryImages', maxCount: 20 }
    ])(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        return handleCategoryUploadError(err, req, res, next);
      }
      next();
    });
  },
  createCategory
);

router.put(
  '/:id', 
  authenticate, 
  requireAdmin,
  (req, res, next) => {
    upload.fields([
      { name: 'categoryImage', maxCount: 1 },
      { name: 'subcategoryImages', maxCount: 20 }
    ])(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        return handleCategoryUploadError(err, req, res, next);
      }
      next();
    });
  },
  updateCategory
);

router.delete('/:id', authenticate, requireAdmin, deleteCategory);
router.patch('/:id/status', authenticate, requireAdmin, updateCategoryStatus);

export default router;