import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import User from '../models/User';
import Review from '../models/Review';

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = (req as any).user?.role;

    if (userRole !== 'admin' && userRole !== 'manager') {
      res.status(403).json({ error: '관리자 권한이 필요합니다' });
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // User statistics
    const totalUsers = await User.count();
    const newUsersToday = await User.count({
      where: {
        createdAt: {
          [Op.gte]: today,
        },
      },
    });
    const newUsersThisMonth = await User.count({
      where: {
        createdAt: {
          [Op.gte]: thisMonth,
        },
      },
    });

    // Review statistics
    const totalReviews = await Review.count({
      where: {
        isApproved: true,
        isVisible: true,
      },
    });
    const pendingReviews = await Review.count({
      where: {
        [Op.or]: [
          { isApproved: false },
          { reportCount: { [Op.gte]: 1 } },
        ],
      },
    });
    const avgRating = await Review.findAll({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'average'],
      ],
      where: {
        isApproved: true,
        isVisible: true,
      },
      raw: true,
    });

    // Rating distribution
    const ratingDistribution = await Review.findAll({
      attributes: [
        'rating',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: {
        isApproved: true,
        isVisible: true,
      },
      group: ['rating'],
      order: [['rating', 'DESC']],
      raw: true,
    });

    // Recent activity (last 30 days)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentReviews = await Review.count({
      where: {
        createdAt: {
          [Op.gte]: last30Days,
        },
      },
    });

    res.json({
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        newThisMonth: newUsersThisMonth,
      },
      reviews: {
        total: totalReviews,
        pending: pendingReviews,
        averageRating: parseFloat((avgRating[0] as any)?.average || '0').toFixed(2),
        ratingDistribution,
        recentCount: recentReviews,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: '통계 조회 중 오류가 발생했습니다' });
  }
};

/**
 * Get recent activities
 */
export const getRecentActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = (req as any).user?.role;

    if (userRole !== 'admin' && userRole !== 'manager') {
      res.status(403).json({ error: '관리자 권한이 필요합니다' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;

    const recentReviews = await Review.findAll({
      include: [
        {
          association: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          association: 'campsite',
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
    });

    const recentUsers = await User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'createdAt', 'role'],
      order: [['createdAt', 'DESC']],
      limit,
    });

    res.json({
      recentReviews,
      recentUsers,
    });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({ error: '최근 활동 조회 중 오류가 발생했습니다' });
  }
};

/**
 * Get all users with pagination and filters
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = (req as any).user?.role;

    if (userRole !== 'admin' && userRole !== 'manager') {
      res.status(403).json({ error: '관리자 권한이 필요합니다' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const role = req.query.role as string;
    const isActive = req.query.isActive as string;

    const offset = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const { rows: users, count: total } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: '사용자 조회 중 오류가 발생했습니다' });
  }
};

/**
 * Update user status (activate/deactivate)
 */
export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = (req as any).user?.role;

    if (userRole !== 'admin') {
      res.status(403).json({ error: '관리자 권한이 필요합니다' });
      return;
    }

    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
      return;
    }

    await user.update({ isActive });

    res.json({
      message: '사용자 상태가 업데이트되었습니다',
      user: {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: '사용자 상태 업데이트 중 오류가 발생했습니다' });
  }
};

/**
 * Get all reviews with pagination and filters for admin
 */
export const getAllReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = (req as any).user?.role;

    if (userRole !== 'admin' && userRole !== 'manager') {
      res.status(403).json({ error: '관리자 권한이 필요합니다' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string; // 'pending', 'approved', 'reported'
    const rating = req.query.rating as string;

    const offset = (page - 1) * limit;

    const where: any = {};

    if (status === 'pending') {
      where.isApproved = false;
    } else if (status === 'reported') {
      where.reportCount = { [Op.gte]: 1 };
    } else if (status === 'approved') {
      where.isApproved = true;
      where.reportCount = 0;
    }

    if (rating) {
      where.rating = parseInt(rating);
    }

    const { rows: reviews, count: total } = await Review.findAndCountAll({
      where,
      include: [
        {
          association: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          association: 'campsite',
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({ error: '리뷰 조회 중 오류가 발생했습니다' });
  }
};

/**
 * Approve or reject a review
 */
export const moderateReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = (req as any).user?.role;

    if (userRole !== 'admin' && userRole !== 'manager') {
      res.status(403).json({ error: '관리자 권한이 필요합니다' });
      return;
    }

    const { id } = req.params;
    const { action, adminResponse } = req.body; // action: 'approve', 'reject', 'hide'

    const review = await Review.findByPk(id);

    if (!review) {
      res.status(404).json({ error: '리뷰를 찾을 수 없습니다' });
      return;
    }

    const updates: any = {};

    if (action === 'approve') {
      updates.isApproved = true;
      updates.isVisible = true;
      updates.reportCount = 0;
    } else if (action === 'reject' || action === 'hide') {
      updates.isApproved = false;
      updates.isVisible = false;
    }

    if (adminResponse) {
      updates.adminResponse = adminResponse;
      updates.adminResponseDate = new Date();
    }

    await review.update(updates);

    res.json({
      message: '리뷰가 처리되었습니다',
      review,
    });
  } catch (error) {
    console.error('Moderate review error:', error);
    res.status(500).json({ error: '리뷰 처리 중 오류가 발생했습니다' });
  }
};

/**
 * Get system health and metrics
 */
export const getSystemHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = (req as any).user?.role;

    if (userRole !== 'admin') {
      res.status(403).json({ error: '관리자 권한이 필요합니다' });
      return;
    }

    // Database health check
    let dbHealth = 'healthy';
    try {
      await sequelize.authenticate();
    } catch (error) {
      dbHealth = 'unhealthy';
    }

    // Get database size info
    const tables = await sequelize.query(
      'SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema = DATABASE()',
      { type: sequelize.QueryTypes.SELECT }
    ) as any[];

    res.json({
      status: dbHealth === 'healthy' ? 'healthy' : 'degraded',
      database: {
        status: dbHealth,
        tables: tables.map((t: any) => ({
          name: t.table_name || t.TABLE_NAME,
          rows: t.table_rows || t.TABLE_ROWS,
        })),
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({ error: '시스템 상태 조회 중 오류가 발생했습니다' });
  }
};
