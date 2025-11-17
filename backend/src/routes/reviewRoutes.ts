import { Router } from 'express';
import { body, query } from 'express-validator';
import * as reviewController from '../controllers/reviewController';
import { authenticateToken } from '../middlewares/auth';
import { validate } from '../middlewares/validation';

const router = Router();

// Public routes
router.get(
  '/campsite/:campsiteId',
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('rating').optional().isInt({ min: 1, max: 5 }),
    query('sortBy').optional().isIn(['createdAt', 'rating']),
    query('order').optional().isIn(['ASC', 'DESC']),
  ]),
  reviewController.getReviewsByCampsite
);

router.get('/campsite/:campsiteId/stats', reviewController.getReviewStats);

// Protected routes
router.use(authenticateToken);

router.post(
  '/',
  validate([
    body('campsiteId').isUUID().withMessage('올바른 캠핑장 ID를 입력해주세요'),
    body('reservationId')
      .optional()
      .isUUID()
      .withMessage('올바른 예약 ID를 입력해주세요'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('평점은 1에서 5 사이여야 합니다'),
    body('title')
      .notEmpty()
      .withMessage('리뷰 제목은 필수입니다')
      .isLength({ max: 200 })
      .withMessage('리뷰 제목은 200자를 초과할 수 없습니다'),
    body('content').notEmpty().withMessage('리뷰 내용은 필수입니다'),
  ]),
  reviewController.createReview
);

router.get(
  '/my-reviews',
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  reviewController.getMyReviews
);

router.put(
  '/:id',
  validate([
    body('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('평점은 1에서 5 사이여야 합니다'),
    body('title')
      .optional()
      .notEmpty()
      .withMessage('리뷰 제목은 비워둘 수 없습니다')
      .isLength({ max: 200 })
      .withMessage('리뷰 제목은 200자를 초과할 수 없습니다'),
    body('content')
      .optional()
      .notEmpty()
      .withMessage('리뷰 내용은 비워둘 수 없습니다'),
  ]),
  reviewController.updateReview
);

router.delete('/:id', reviewController.deleteReview);

router.post(
  '/:id/reply',
  validate([
    body('ownerReply').notEmpty().withMessage('답변 내용은 필수입니다'),
  ]),
  reviewController.addOwnerReply
);

export default router;
