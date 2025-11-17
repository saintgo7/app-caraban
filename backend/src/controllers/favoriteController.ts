import { Response, NextFunction } from 'express';
import { Favorite, Campsite, User } from '../models';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';

export const addFavorite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다', 401);
    }

    const { campsiteId } = req.body;

    // Check if campsite exists
    const campsite = await Campsite.findByPk(campsiteId);

    if (!campsite || !campsite.isActive) {
      throw new AppError('캠핑장을 찾을 수 없습니다', 404);
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      where: {
        userId: req.user.id,
        campsiteId,
      },
    });

    if (existingFavorite) {
      throw new AppError('이미 즐겨찾기에 추가된 캠핑장입니다', 400);
    }

    const favorite = await Favorite.create({
      userId: req.user.id,
      campsiteId,
    });

    res.status(201).json({
      success: true,
      message: '즐겨찾기에 추가되었습니다',
      data: { favorite },
    });
  } catch (error) {
    next(error);
  }
};

export const removeFavorite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다', 401);
    }

    const { campsiteId } = req.params;

    const favorite = await Favorite.findOne({
      where: {
        userId: req.user.id,
        campsiteId,
      },
    });

    if (!favorite) {
      throw new AppError('즐겨찾기를 찾을 수 없습니다', 404);
    }

    await favorite.destroy();

    res.json({
      success: true,
      message: '즐겨찾기에서 제거되었습니다',
    });
  } catch (error) {
    next(error);
  }
};

export const getMyFavorites = async (
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

    const { count, rows: favorites } = await Favorite.findAndCountAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Campsite,
          as: 'campsite',
          where: { isActive: true },
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'firstName', 'lastName'],
            },
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
        favorites,
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

export const checkFavorite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다', 401);
    }

    const { campsiteId } = req.params;

    const favorite = await Favorite.findOne({
      where: {
        userId: req.user.id,
        campsiteId,
      },
    });

    res.json({
      success: true,
      data: {
        isFavorite: !!favorite,
      },
    });
  } catch (error) {
    next(error);
  }
};
