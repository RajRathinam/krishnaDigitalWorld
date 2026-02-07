import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartItemCount
} from '../controllers/cartController.js';
import { authenticate, requireCustomer } from '../middleware/auth.js';

const router = express.Router();

// All cart routes require authentication and customer role
router.use(authenticate, requireCustomer);

router.get('/', getCart);
router.post('/items', addToCart);
router.put('/items/:productId', updateCartItem);
router.delete('/items/:productId', removeFromCart);
router.delete('/', clearCart);
router.get('/count', getCartItemCount);

export default router;