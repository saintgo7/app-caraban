import { Router } from 'express';
import { body, query } from 'express-validator';
import * as favoriteController from '../controllers/favoriteController';
import { authenticateToken } from '../middlewares/auth';
import { validate } from '../middlewares/validation';

const router = Router();

// All favorite routes require authentication
router.use(authenticateToken);

// Add campsite to favorites
router.post(
  '/',
  validate([
    body('campsiteId').isUUID().withMessage('올바른 캠핑장 ID를 입력해주세요'),
  ]),
  favoriteController.addFavorite
);

// Get user's favorite campsites
router.get(
  '/',
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  favoriteController.getMyFavorites
);

// Check if campsite is favorited
router.get('/check/:campsiteId', favoriteController.checkFavorite);

// Remove campsite from favorites
router.delete('/:campsiteId', favoriteController.removeFavorite);

export default router;
