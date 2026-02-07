import express from 'express';
import {
    createModel,
    getModelsByBrand
} from '../controllers/modelController.js';

import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
// Admin routes
router.get('/brand/:brandId', getModelsByBrand);

router.post(
  '/',
  authenticate,
  requireAdmin,
  createModel
);

export default router;