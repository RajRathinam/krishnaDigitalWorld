import express from 'express';
import {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand
} from '../controllers/brandController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadSingleImage, processUploadedFiles } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', getBrands);
router.get('/:id', getBrand);

// Admin routes
router.post(
  '/',
  authenticate,
  requireAdmin,
  uploadSingleImage('logo'),
  processUploadedFiles,
  createBrand
);
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  uploadSingleImage('logo'),
  processUploadedFiles,
  updateBrand
);
router.delete('/:id', authenticate, requireAdmin, deleteBrand);

export default router;