import express from 'express';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  markHelpful,
  getMyReviews
} from '../controllers/reviewController.js';
import { authenticate, requireCustomer } from '../middleware/auth.js';
import { validateReviewData } from '../middleware/validation.js';
import { reviewOwnerOrAdmin } from '../middleware/ownerOrAdmin.js';

const router = express.Router();

// Public routes
router.get('/products/:productId/reviews', getProductReviews);

// Protected routes (customer only)
router.use(authenticate, requireCustomer);

router.post('/', validateReviewData, createReview);
router.get('/my-reviews', getMyReviews);
router.put('/:id', reviewOwnerOrAdmin, updateReview);
router.delete('/:id', reviewOwnerOrAdmin, deleteReview);
router.post('/:id/helpful', markHelpful);

export default router;