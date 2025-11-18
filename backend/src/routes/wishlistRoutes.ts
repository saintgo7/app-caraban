import express from 'express';
import {
  addToWishlist,
  getWishlist,
  checkWishlist,
  updateWishlistItem,
  removeFromWishlist,
  getWishlistStats,
} from '../controllers/wishlistController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

// All routes require authentication
router.post('/', authenticateToken, addToWishlist);
router.get('/', authenticateToken, getWishlist);
router.get('/check/:campsiteId', authenticateToken, checkWishlist);
router.patch('/:id', authenticateToken, updateWishlistItem);
router.delete('/:campsiteId', authenticateToken, removeFromWishlist);
router.get('/stats/:campsiteId', authenticateToken, getWishlistStats);

export default router;
