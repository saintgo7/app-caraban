import { Response, NextFunction } from 'express';
import { Review, Campsite, User, Reservation } from '../models';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
import sequelize from '../config/database';

export const createReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다', 401);
    }

    const { campsiteId, reservationId, rating, title, content, images } =
      req.body;

    // Validate that user has a completed reservation for this campsite
    if (reservationId) {
      const reservation = await Reservation.findByPk(reservationId);

      if (!reservation) {
        throw new AppError('예약을 찾을 수 없습니다', 404);
      }

      if (reservation.userId !== req.user.id) {
        throw new AppError('리뷰 작성 권한이 없습니다', 403);
      }

      if (reservation.status !== 'completed') {
        throw new AppError('체크아웃 완료 후 리뷰를 작성할 수 있습니다', 400);
      }

      // Check if review already exists for this reservation
      const existingReview = await Review.findOne({
        where: { reservationId },
      });

      if (existingReview) {
        throw new AppError('이미 작성된 리뷰가 있습니다', 400);
      }
    }

    // Create review
    const review = await Review.create({
      campsiteId,
      userId: req.user.id,
      reservationId,
      rating,
      title,
      content,
      images: images ? JSON.stringify(images) : undefined,
    });

    // Update campsite rating and review count
    const campsite = await Campsite.findByPk(campsiteId);
    if (campsite) {
      const reviews = await Review.findAll({
        where: { campsiteId, isVisible: true },
      });

      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / reviews.length;

      await campsite.update({
        rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        reviewCount: reviews.length,
      });
    }

    res.status(201).json({
      success: true,
      message: '리뷰가 성공적으로 작성되었습니다',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

export const getReviewsByCampsite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { campsiteId } = req.params;
    const {
      page = 1,
      limit = 10,
      rating,
      sortBy = 'createdAt',
      order = 'DESC',
    } = req.query;

    const where: any = { campsiteId, isVisible: true };

    if (rating) {
      where.rating = rating;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: reviews } = await Review.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName'],
        },
      ],
      limit: Number(limit),
      offset,
      order: [[sortBy as string, order as string]],
    });

    res.json({
      success: true,
      data: {
        reviews,
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

export const getMyReviews = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다', 401);
    }

    const { page = 1, limit = 10 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Campsite,
          as: 'campsite',
          attributes: ['id', 'name', 'images'],
        },
      ],
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        reviews,
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

export const updateReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다', 401);
    }

    const { id } = req.params;
    const { rating, title, content, images } = req.body;

    const review = await Review.findByPk(id);

    if (!review) {
      throw new AppError('리뷰를 찾을 수 없습니다', 404);
    }

    // Check if user is the author
    if (review.userId !== req.user.id) {
      throw new AppError('리뷰 수정 권한이 없습니다', 403);
    }

    const updateData: any = {};
    if (rating !== undefined) updateData.rating = rating;
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (images) updateData.images = JSON.stringify(images);

    await review.update(updateData);

    // Update campsite rating if rating changed
    if (rating !== undefined) {
      const campsite = await Campsite.findByPk(review.campsiteId);
      if (campsite) {
        const reviews = await Review.findAll({
          where: { campsiteId: review.campsiteId, isVisible: true },
        });

        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = totalRating / reviews.length;

        await campsite.update({
          rating: Math.round(avgRating * 10) / 10,
        });
      }
    }

    res.json({
      success: true,
      message: '리뷰가 수정되었습니다',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다', 401);
    }

    const { id } = req.params;

    const review = await Review.findByPk(id);

    if (!review) {
      throw new AppError('리뷰를 찾을 수 없습니다', 404);
    }

    // Check if user is the author or admin
    if (review.userId !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('리뷰 삭제 권한이 없습니다', 403);
    }

    const campsiteId = review.campsiteId;

    // Soft delete - make it invisible
    await review.update({ isVisible: false });

    // Update campsite rating and review count
    const campsite = await Campsite.findByPk(campsiteId);
    if (campsite) {
      const reviews = await Review.findAll({
        where: { campsiteId, isVisible: true },
      });

      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = totalRating / reviews.length;

        await campsite.update({
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length,
        });
      } else {
        await campsite.update({
          rating: null,
          reviewCount: 0,
        });
      }
    }

    res.json({
      success: true,
      message: '리뷰가 삭제되었습니다',
    });
  } catch (error) {
    next(error);
  }
};

export const addOwnerReply = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다', 401);
    }

    const { id } = req.params;
    const { ownerReply } = req.body;

    const review = await Review.findByPk(id);

    if (!review) {
      throw new AppError('리뷰를 찾을 수 없습니다', 404);
    }

    // Check if user is the campsite owner
    const campsite = await Campsite.findByPk(review.campsiteId);

    if (!campsite) {
      throw new AppError('캠핑장을 찾을 수 없습니다', 404);
    }

    if (campsite.ownerId !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('답변 작성 권한이 없습니다', 403);
    }

    await review.update({
      ownerReply,
      ownerReplyDate: new Date(),
    });

    res.json({
      success: true,
      message: '답변이 작성되었습니다',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

export const getReviewStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { campsiteId } = req.params;

    const reviews = await Review.findAll({
      where: { campsiteId, isVisible: true },
      attributes: ['rating'],
    });

    if (reviews.length === 0) {
      return res.json({
        success: true,
        data: {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0,
          },
        },
      });
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;

    const ratingDistribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    res.json({
      success: true,
      data: {
        totalReviews: reviews.length,
        averageRating,
        ratingDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
};
