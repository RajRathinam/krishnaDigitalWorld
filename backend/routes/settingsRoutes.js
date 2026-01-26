import express from 'express';
import {
  createSubadmin,
  getSubadmins,
  updateSubadmin,
  deleteSubadmin,
  getShopInfo,
  updateShopInfo,
  getShopInfoPublic
} from '../controllers/settingsController.js';
import { authenticate, requireAdmin,requireAdminOrSubadmin } from '../middleware/auth.js';

const router = express.Router();

// Public route for shop info (used in frontend)
router.get('/shop-info', getShopInfoPublic);

// Admin/Subadmin routes (require authentication)
router.use(authenticate);

// Shop info routes (admin and subadmin can access)
router.get('/shop-info', getShopInfo);
router.put('/shop-info',requireAdminOrSubadmin, updateShopInfo);

// Subadmin management routes (admin only)
router.post('/subadmins', requireAdmin, createSubadmin);
router.get('/subadmins', requireAdmin, getSubadmins);
router.put('/subadmins/:id', requireAdmin, updateSubadmin);
router.delete('/subadmins/:id', requireAdmin, deleteSubadmin);

export default router;

