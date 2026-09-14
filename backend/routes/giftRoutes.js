import express from 'express';
import {
  getGifts,
  getGift,
  createGift,
  updateGift,
  deleteGift
} from '../controllers/giftController.js';
import { authenticate, requireAdminOrSubadmin } from '../middleware/auth.js';
import { uploadSingleImage, processUploadedFiles } from '../middleware/upload.js';

const router = express.Router();

// Public/Admin routes
router.get('/', getGifts);
router.get('/:id', getGift);

// Admin routes
router.post(
  '/',
  authenticate,
  requireAdminOrSubadmin,
  uploadSingleImage('image', 'gifts'),
  processUploadedFiles,
  createGift
);
router.put(
  '/:id',
  authenticate,
  requireAdminOrSubadmin,
  uploadSingleImage('image', 'gifts'),
  processUploadedFiles,
  updateGift
);
router.delete('/:id', authenticate, requireAdminOrSubadmin, deleteGift);

export default router;
