import express from 'express';
import {
  getProducts,
  getProduct,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getRelatedProducts,
  updateProductStock
} from '../controllers/productController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadProductImages, processUploadedFiles, validateProductImages, handleUploadError } from '../middleware/upload.js';
import { productOwnerOrAdmin } from '../middleware/ownerOrAdmin.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/category/:categorySlug', getProductsByCategory);
router.get('/:identifier', getProduct);
router.get('/:id/related', getRelatedProducts);

// Protected routes
router.post(
  '/',
  authenticate,
  uploadProductImages(),
  handleUploadError,
  processUploadedFiles,
  validateProductImages,
  createProduct
);

router.put(
  '/:id',
  authenticate,
  productOwnerOrAdmin,
  uploadProductImages(),
  handleUploadError,
  processUploadedFiles,
  updateProduct
);

router.delete('/:id', authenticate, productOwnerOrAdmin, deleteProduct);
router.put('/:id/stock', authenticate, productOwnerOrAdmin, updateProductStock);

export default router;