import { Request, Response, NextFunction } from 'express';
import { Reservation } from '../models';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
import { verifyPayment } from '../services/paymentService';

export const completePayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다', 401);
    }

    const { reservationId, impUid } = req.body;

    // Find reservation
    const reservation = await Reservation.findByPk(reservationId);

    if (!reservation) {
      throw new AppError('예약을 찾을 수 없습니다', 404);
    }

    // Check if user owns the reservation
    if (reservation.userId !== req.user.id) {
      throw new AppError('접근 권한이 없습니다', 403);
    }

    // Verify payment with PortOne
    const payment = await verifyPayment(impUid, reservation.totalPrice);

    // Update reservation
    await reservation.update({
      paymentStatus: 'paid',
      paymentMethod: payment.pay_method,
      status: 'confirmed',
    });

    res.json({
      success: true,
      message: '결제가 완료되었습니다',
      data: {
        reservation,
        payment,
      },
    });
  } catch (error: any) {
    logger.error('Payment completion failed:', error);
    next(new AppError(error.message || '결제 처리 중 오류가 발생했습니다', 500));
  }
};

export const refundPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다', 401);
    }

    const { reservationId } = req.body;

    // Find reservation
    const reservation = await Reservation.findByPk(reservationId);

    if (!reservation) {
      throw new AppError('예약을 찾을 수 없습니다', 404);
    }

    // Check if user owns the reservation
    if (reservation.userId !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('접근 권한이 없습니다', 403);
    }

    // Check if payment can be refunded
    if (reservation.paymentStatus !== 'paid') {
      throw new AppError('결제 완료된 예약만 환불 가능합니다', 400);
    }

    // Calculate refund amount based on cancellation policy
    const checkInDate = new Date(reservation.checkInDate);
    const now = new Date();
    const daysUntilCheckIn = Math.ceil(
      (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    let refundAmount = reservation.totalPrice;

    // Cancellation policy
    if (daysUntilCheckIn < 1) {
      refundAmount = 0; // No refund if less than 1 day before check-in
    } else if (daysUntilCheckIn < 3) {
      refundAmount = reservation.totalPrice * 0.5; // 50% refund
    } else if (daysUntilCheckIn < 7) {
      refundAmount = reservation.totalPrice * 0.8; // 80% refund
    }
    // 100% refund if 7 days or more before check-in

    // Request refund from PortOne (if impUid exists)
    // Note: In real implementation, you would store impUid when payment is completed
    // For now, we'll just update the status

    // Update reservation
    await reservation.update({
      paymentStatus: 'refunded',
      status: 'cancelled',
    });

    res.json({
      success: true,
      message: '환불이 처리되었습니다',
      data: {
        reservation,
        refundAmount,
        originalAmount: reservation.totalPrice,
      },
    });
  } catch (error: any) {
    logger.error('Refund failed:', error);
    next(new AppError(error.message || '환불 처리 중 오류가 발생했습니다', 500));
  }
};

// Webhook handler for payment notifications from PortOne
export const paymentWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { imp_uid, status } = req.body;

    logger.info(`Payment webhook received: ${imp_uid}, ${status}`);

    // Process payment notification
    // Update reservation status based on webhook data

    res.json({
      success: true,
      message: 'Webhook processed',
    });
  } catch (error) {
    logger.error('Webhook processing failed:', error);
    next(error);
  }
};

import logger from '../config/logger';
