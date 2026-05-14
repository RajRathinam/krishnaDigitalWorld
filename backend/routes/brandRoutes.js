import express from 'express';
import {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand
} from '../controllers/brandController.js';
import { authenticate, requireAdminOrSubadmin } from '../middleware/auth.js';
import { uploadSingleImage, processUploadedFiles } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', getBrands);
router.get('/:id', getBrand);

// Admin routes
router.post(
  '/',
  authenticate,
  requireAdminOrSubadmin,
  uploadSingleImage('logo', 'brands'),
  processUploadedFiles,
  createBrand
);
router.put(
  '/:id',
  authenticate,
  requireAdminOrSubadmin,
  uploadSingleImage('logo', 'brands'),
  processUploadedFiles,
  updateBrand
);
router.delete('/:id', authenticate, requireAdminOrSubadmin, deleteBrand);

export default router;