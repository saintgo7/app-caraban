import { Router } from 'express';
import { body, query } from 'express-validator';
import * as reservationController from '../controllers/reservationController';
import { authenticateToken } from '../middlewares/auth';
import { validate } from '../middlewares/validation';

const router = Router();

// All reservation routes require authentication
router.use(authenticateToken);

// Create new reservation
router.post(
  '/',
  validate([
    body('campsiteId').isUUID().withMessage('올바른 캠핑장 ID를 입력해주세요'),
    body('checkInDate')
      .isDate()
      .withMessage('올바른 체크인 날짜를 입력해주세요'),
    body('checkOutDate')
      .isDate()
      .withMessage('올바른 체크아웃 날짜를 입력해주세요'),
    body('guestCount')
      .isInt({ min: 1 })
      .withMessage('투숙객 수는 1명 이상이어야 합니다'),
  ]),
  reservationController.createReservation
);

// Get user's reservations
router.get(
  '/my-reservations',
  validate([
    query('status')
      .optional()
      .isIn(['pending', 'confirmed', 'cancelled', 'completed']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  reservationController.getMyReservations
);

// Check availability for specific dates
router.get(
  '/check-availability',
  validate([
    query('campsiteId').isUUID().withMessage('올바른 캠핑장 ID를 입력해주세요'),
    query('checkInDate').isDate().withMessage('올바른 체크인 날짜를 입력해주세요'),
    query('checkOutDate')
      .isDate()
      .withMessage('올바른 체크아웃 날짜를 입력해주세요'),
  ]),
  reservationController.checkAvailability
);

// Get reservations for a specific campsite (owner only)
router.get(
  '/campsite/:campsiteId',
  validate([
    query('status')
      .optional()
      .isIn(['pending', 'confirmed', 'cancelled', 'completed']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  reservationController.getCampsiteReservations
);

// Get specific reservation details
router.get('/:id', reservationController.getReservationById);

// Update reservation status
router.patch(
  '/:id/status',
  validate([
    body('status')
      .optional()
      .isIn(['pending', 'confirmed', 'cancelled', 'completed'])
      .withMessage('올바른 상태를 선택해주세요'),
    body('paymentStatus')
      .optional()
      .isIn(['pending', 'paid', 'refunded'])
      .withMessage('올바른 결제 상태를 선택해주세요'),
  ]),
  reservationController.updateReservationStatus
);

// Cancel reservation
router.post('/:id/cancel', reservationController.cancelReservation);

export default router;
