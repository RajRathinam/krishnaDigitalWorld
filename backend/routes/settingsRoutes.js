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
import { authenticate, requireAdmin, requireAdminOrSubadmin } from '../middleware/auth.js';

/**
 * Public shop banner (GET /api/shop-info only).
 * Do not mount a blanket router.use(authenticate) at /api — it catches /api/auth/* etc.
 */
export const publicShopRouter = express.Router();
publicShopRouter.get('/shop-info', getShopInfoPublic);

/**
 * Admin / subadmin settings (GET/PUT /api/admin/settings/shop-info, subadmins CRUD).
 * Each protected route lists authenticate explicitly — no catch-all middleware.
 */
export const adminSettingsRouter = express.Router();
adminSettingsRouter.get('/shop-info', authenticate, getShopInfo);
adminSettingsRouter.put('/shop-info', authenticate, requireAdminOrSubadmin, updateShopInfo);
adminSettingsRouter.post('/subadmins', authenticate, requireAdmin, createSubadmin);
adminSettingsRouter.get('/subadmins', authenticate, requireAdmin, getSubadmins);
adminSettingsRouter.put('/subadmins/:id', authenticate, requireAdmin, updateSubadmin);
adminSettingsRouter.delete('/subadmins/:id', authenticate, requireAdmin, deleteSubadmin);
