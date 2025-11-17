import { Response, NextFunction } from 'express';
import { Campsite, Reservation, User } from '../models';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
import { Op } from 'sequelize';

export const createReservation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다', 401);
    }

    const {
      campsiteId,
      checkInDate,
      checkOutDate,
      guestCount,
      specialRequests,
    } = req.body;

    // Check if campsite exists
    const campsite = await Campsite.findByPk(campsiteId);

    if (!campsite || !campsite.isActive) {
      throw new AppError('캠핑장을 찾을 수 없습니다', 404);
    }

    // Validate guest count
    if (guestCount > campsite.maxCapacity) {
      throw new AppError(
        `최대 수용 인원은 ${campsite.maxCapacity}명입니다`,
        400
      );
    }

    // Check availability
    const conflictingReservation = await Reservation.findOne({
      where: {
        campsiteId,
        status: { [Op.in]: ['pending', 'confirmed'] },
        [Op.or]: [
          {
            checkInDate: {
              [Op.between]: [checkInDate, checkOutDate],
            },
          },
          {
            checkOutDate: {
              [Op.between]: [checkInDate, checkOutDate],
            },
          },
          {
            [Op.and]: [
              { checkInDate: { [Op.lte]: checkInDate } },
              { checkOutDate: { [Op.gte]: checkOutDate } },
            ],
          },
        ],
      },
    });

    if (conflictingReservation) {
      throw new AppError('선택하신 날짜에 예약이 불가능합니다', 400);
    }

    // Calculate total price
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalPrice = nights * campsite.pricePerNight;

    // Create reservation
    const reservation = await Reservation.create({
      campsiteId,
      userId: req.user.id,
      checkInDate,
      checkOutDate,
      guestCount,
      totalPrice,
      specialRequests,
      status: 'pending',
      paymentStatus: 'pending',
    });

    res.status(201).json({
      success: true,
      message: '예약이 성공적으로 생성되었습니다',
      data: { reservation },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyReservations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다', 401);
    }

    const { status, page = 1, limit = 10 } = req.query;

    const where: any = { userId: req.user.id };

    if (status) {
      where.status = status;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: reservations } = await Reservation.findAndCountAll({
      where,
      include: [
        {
          model: Campsite,
          as: 'campsite',
          attributes: [
            'id',
            'name',
            'address',
            'images',
            'checkInTime',
            'checkOutTime',
          ],
        },
      ],
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        reservations,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getReservationById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다', 401);
    }

    const { id } = req.params;

    const reservation = await Reservation.findByPk(id, {
      include: [
        {
          model: Campsite,
          as: 'campsite',
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
            },
          ],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        },
      ],
    });

    if (!reservation) {
      throw new AppError('예약을 찾을 수 없습니다', 404);
    }

    // Check if user has access to this reservation
    const campsite = await Campsite.findByPk(reservation.campsiteId);
    const isOwner = campsite?.ownerId === req.user.id;
    const isCustomer = reservation.userId === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isCustomer && !isAdmin) {
      throw new AppError('접근 권한이 없습니다', 403);
    }

    res.json({
      success: true,
      data: { reservation },
    });
  } catch (error) {
    next(error);
  }
};

export const updateReservationStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다', 401);
    }

    const { id } = req.params;
    const { status, paymentStatus, paymentMethod } = req.body;

    const reservation = await Reservation.findByPk(id);

    if (!reservation) {
      throw new AppError('예약을 찾을 수 없습니다', 404);
    }

    // Check permissions
    const campsite = await Campsite.findByPk(reservation.campsiteId);
    const isOwner = campsite?.ownerId === req.user.id;
    const isCustomer = reservation.userId === req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Only owner or admin can confirm reservations
    if (status === 'confirmed' && !isOwner && !isAdmin) {
      throw new AppError('예약 확인 권한이 없습니다', 403);
    }

    // Only customer can cancel their own reservation
    if (status === 'cancelled' && !isCustomer && !isAdmin) {
      throw new AppError('예약 취소 권한이 없습니다', 403);
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;

    await reservation.update(updateData);

    res.json({
      success: true,
      message: '예약 상태가 업데이트되었습니다',
      data: { reservation },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelReservation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다', 401);
    }

    const { id } = req.params;

    const reservation = await Reservation.findByPk(id);

    if (!reservation) {
      throw new AppError('예약을 찾을 수 없습니다', 404);
    }

    // Check if user is the customer
    if (reservation.userId !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('예약 취소 권한이 없습니다', 403);
    }

    // Check if reservation can be cancelled
    if (reservation.status === 'cancelled') {
      throw new AppError('이미 취소된 예약입니다', 400);
    }

    if (reservation.status === 'completed') {
      throw new AppError('완료된 예약은 취소할 수 없습니다', 400);
    }

    // Check if cancellation is allowed (e.g., at least 1 day before check-in)
    const checkInDate = new Date(reservation.checkInDate);
    const now = new Date();
    const daysDiff = Math.ceil(
      (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff < 1) {
      throw new AppError(
        '체크인 1일 전부터는 취소가 불가능합니다',
        400
      );
    }

    await reservation.update({
      status: 'cancelled',
      paymentStatus: 'refunded',
    });

    res.json({
      success: true,
      message: '예약이 취소되었습니다',
      data: { reservation },
    });
  } catch (error) {
    next(error);
  }
};

export const checkAvailability = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { campsiteId, checkInDate, checkOutDate } = req.query;

    if (!campsiteId || !checkInDate || !checkOutDate) {
      throw new AppError('캠핑장 ID와 날짜를 모두 입력해주세요', 400);
    }

    const conflictingReservation = await Reservation.findOne({
      where: {
        campsiteId: campsiteId as string,
        status: { [Op.in]: ['pending', 'confirmed'] },
        [Op.or]: [
          {
            checkInDate: {
              [Op.between]: [checkInDate as string, checkOutDate as string],
            },
          },
          {
            checkOutDate: {
              [Op.between]: [checkInDate as string, checkOutDate as string],
            },
          },
          {
            [Op.and]: [
              { checkInDate: { [Op.lte]: checkInDate as string } },
              { checkOutDate: { [Op.gte]: checkOutDate as string } },
            ],
          },
        ],
      },
    });

    const isAvailable = !conflictingReservation;

    res.json({
      success: true,
      data: {
        isAvailable,
        message: isAvailable
          ? '예약 가능한 날짜입니다'
          : '선택하신 날짜에 예약이 불가능합니다',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCampsiteReservations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다', 401);
    }

    const { campsiteId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // Check if user is the owner
    const campsite = await Campsite.findByPk(campsiteId);

    if (!campsite) {
      throw new AppError('캠핑장을 찾을 수 없습니다', 404);
    }

    if (campsite.ownerId !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('접근 권한이 없습니다', 403);
    }

    const where: any = { campsiteId };

    if (status) {
      where.status = status;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: reservations } = await Reservation.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        },
      ],
      limit: Number(limit),
      offset,
      order: [['checkInDate', 'ASC']],
    });

    res.json({
      success: true,
      data: {
        reservations,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
