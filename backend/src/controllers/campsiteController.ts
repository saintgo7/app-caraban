import { Response, NextFunction } from 'express';
import { Campsite, Review, User, Reservation } from '../models';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
import { Op } from 'sequelize';

export const getAllCampsites = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      minPrice,
      maxPrice,
      search,
      latitude,
      longitude,
      radius = 50, // km
    } = req.query;

    const where: any = { isActive: true };

    // Filter by type
    if (type) {
      where.type = type;
    }

    // Filter by price
    if (minPrice || maxPrice) {
      where.pricePerNight = {};
      if (minPrice) where.pricePerNight[Op.gte] = minPrice;
      if (maxPrice) where.pricePerNight[Op.lte] = maxPrice;
    }

    // Search by name or address
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: campsites } = await Campsite.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      limit: Number(limit),
      offset,
      order: [['rating', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        campsites,
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

export const getCampsiteById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const campsite = await Campsite.findByPk(id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        },
        {
          model: Review,
          as: 'reviews',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName'],
            },
          ],
          order: [['createdAt', 'DESC']],
          limit: 10,
        },
      ],
    });

    if (!campsite) {
      throw new AppError('캠핑장을 찾을 수 없습니다', 404);
    }

    res.json({
      success: true,
      data: { campsite },
    });
  } catch (error) {
    next(error);
  }
};

export const createCampsite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다', 401);
    }

    const {
      name,
      description,
      address,
      latitude,
      longitude,
      type,
      maxCapacity,
      pricePerNight,
      checkInTime,
      checkOutTime,
      amenities,
      images,
    } = req.body;

    const campsite = await Campsite.create({
      name,
      description,
      address,
      latitude,
      longitude,
      type,
      maxCapacity,
      pricePerNight,
      checkInTime,
      checkOutTime,
      amenities: JSON.stringify(amenities),
      images: JSON.stringify(images),
      ownerId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: '캠핑장이 성공적으로 등록되었습니다',
      data: { campsite },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCampsite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다', 401);
    }

    const { id } = req.params;
    const updateData = req.body;

    const campsite = await Campsite.findByPk(id);

    if (!campsite) {
      throw new AppError('캠핑장을 찾을 수 없습니다', 404);
    }

    // Check ownership
    if (campsite.ownerId !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('수정 권한이 없습니다', 403);
    }

    // Update amenities and images as JSON strings
    if (updateData.amenities) {
      updateData.amenities = JSON.stringify(updateData.amenities);
    }
    if (updateData.images) {
      updateData.images = JSON.stringify(updateData.images);
    }

    await campsite.update(updateData);

    res.json({
      success: true,
      message: '캠핑장 정보가 수정되었습니다',
      data: { campsite },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCampsite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다', 401);
    }

    const { id } = req.params;

    const campsite = await Campsite.findByPk(id);

    if (!campsite) {
      throw new AppError('캠핑장을 찾을 수 없습니다', 404);
    }

    // Check ownership
    if (campsite.ownerId !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('삭제 권한이 없습니다', 403);
    }

    // Soft delete
    await campsite.update({ isActive: false });

    res.json({
      success: true,
      message: '캠핑장이 삭제되었습니다',
    });
  } catch (error) {
    next(error);
  }
};

export const getMyCampsites = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다', 401);
    }

    const campsites = await Campsite.findAll({
      where: { ownerId: req.user.id },
      include: [
        {
          model: Reservation,
          as: 'reservations',
          where: { status: { [Op.in]: ['pending', 'confirmed'] } },
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: { campsites },
    });
  } catch (error) {
    next(error);
  }
};
