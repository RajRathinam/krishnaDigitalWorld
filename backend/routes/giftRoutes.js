import express from 'express';
import {
  getGifts,
  getGift,
  createGift,
  updateGift,
  deleteGift,
  scanOfflineGift,
  getOfflineClaims,
  updateClaimStatus
} from '../controllers/giftController.js';
import { authenticate, requireAdminOrSubadmin } from '../middleware/auth.js';
import { uploadSingleImage, processUploadedFiles } from '../middleware/upload.js';

const router = express.Router();

// Offline scan (User needs to be authenticated)
router.post('/scan-offline', authenticate, scanOfflineGift);

// Admin claims routes
router.get('/claims', authenticate, requireAdminOrSubadmin, getOfflineClaims);
router.put('/claims/:id', authenticate, requireAdminOrSubadmin, updateClaimStatus);

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
