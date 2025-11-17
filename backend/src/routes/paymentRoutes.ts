import { Router } from 'express';
import { body } from 'express-validator';
import * as paymentController from '../controllers/paymentController';
import { authenticateToken } from '../middlewares/auth';
import { validate } from '../middlewares/validation';

const router = Router();

// Complete payment
router.post(
  '/complete',
  authenticateToken,
  validate([
    body('reservationId').isUUID().withMessage('올바른 예약 ID를 입력해주세요'),
    body('impUid').notEmpty().withMessage('결제 고유번호가 필요합니다'),
    body('merchantUid').notEmpty().withMessage('주문번호가 필요합니다'),
  ]),
  paymentController.completePayment
);

// Refund payment
router.post(
  '/refund',
  authenticateToken,
  validate([
    body('reservationId').isUUID().withMessage('올바른 예약 ID를 입력해주세요'),
    body('reason').notEmpty().withMessage('환불 사유를 입력해주세요'),
  ]),
  paymentController.refundPayment
);

// Webhook endpoint (no authentication required)
router.post('/webhook', paymentController.paymentWebhook);

export default router;
