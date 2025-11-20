import { Request, Response } from 'express';
import Inquiry from '../models/Inquiry';
import User from '../models/User';
import Campsite from '../models/Campsite';
import { Op } from 'sequelize';
import sequelize from '../config/database';

/**
 * Create a new inquiry
 */
export const createInquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { campsiteId, subject, message, category, priority } = req.body;

    // Validate campsite exists
    const campsite = await Campsite.findByPk(campsiteId);
    if (!campsite) {
      res.status(404).json({ message: 'Campsite not found' });
      return;
    }

    const inquiry = await Inquiry.create({
      userId,
      campsiteId,
      subject,
      message,
      category: category || 'general',
      priority: priority || 'normal',
      status: 'pending',
      isRead: false,
    });

    // Load associations
    await inquiry.reload({
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Campsite, as: 'campsite', attributes: ['id', 'name', 'location'] },
      ],
    });

    res.status(201).json({
      message: 'Inquiry created successfully',
      inquiry,
    });
  } catch (error: any) {
    console.error('Create inquiry error:', error);
    res.status(500).json({ message: 'Failed to create inquiry', error: error.message });
  }
};

/**
 * Get user's inquiries
 */
export const getUserInquiries = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { status, campsiteId, page = 1, limit = 10 } = req.query;

    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (campsiteId) {
      where.campsiteId = campsiteId;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: inquiries } = await Inquiry.findAndCountAll({
      where,
      include: [
        { model: Campsite, as: 'campsite', attributes: ['id', 'name', 'location', 'images'] },
        { model: User, as: 'responder', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      inquiries,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Get user inquiries error:', error);
    res.status(500).json({ message: 'Failed to fetch inquiries', error: error.message });
  }
};

/**
 * Get campsite inquiries (for owners/admins)
 */
export const getCampsiteInquiries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { campsiteId } = req.params;
    const { status, priority, category, page = 1, limit = 10 } = req.query;

    const where: any = { campsiteId };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (category) {
      where.category = category;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: inquiries } = await Inquiry.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'responder', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      limit: Number(limit),
      offset,
    });

    res.json({
      inquiries,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Get campsite inquiries error:', error);
    res.status(500).json({ message: 'Failed to fetch inquiries', error: error.message });
  }
};

/**
 * Get single inquiry
 */
export const getInquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const inquiry = await Inquiry.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Campsite, as: 'campsite', attributes: ['id', 'name', 'location', 'ownerId'] },
        { model: User, as: 'responder', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    if (!inquiry) {
      res.status(404).json({ message: 'Inquiry not found' });
      return;
    }

    // Check authorization
    const campsite = inquiry.get('campsite') as any;
    if (
      inquiry.userId !== userId &&
      campsite.ownerId !== userId &&
      !['admin', 'manager'].includes(userRole)
    ) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    // Mark as read if owner/admin is viewing
    if (inquiry.userId !== userId && !inquiry.isRead) {
      await inquiry.update({ isRead: true });
    }

    res.json({ inquiry });
  } catch (error: any) {
    console.error('Get inquiry error:', error);
    res.status(500).json({ message: 'Failed to fetch inquiry', error: error.message });
  }
};

/**
 * Respond to inquiry
 */
export const respondToInquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { response, status } = req.body;

    const inquiry = await Inquiry.findByPk(id, {
      include: [{ model: Campsite, as: 'campsite', attributes: ['id', 'ownerId'] }],
    });

    if (!inquiry) {
      res.status(404).json({ message: 'Inquiry not found' });
      return;
    }

    // Check authorization
    const campsite = inquiry.get('campsite') as any;
    if (
      campsite.ownerId !== userId &&
      !['admin', 'manager'].includes(userRole)
    ) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    await inquiry.update({
      response,
      respondedBy: userId,
      respondedAt: new Date(),
      status: status || 'answered',
      isRead: true,
    });

    await inquiry.reload({
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Campsite, as: 'campsite', attributes: ['id', 'name', 'location'] },
        { model: User, as: 'responder', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    res.json({
      message: 'Response added successfully',
      inquiry,
    });
  } catch (error: any) {
    console.error('Respond to inquiry error:', error);
    res.status(500).json({ message: 'Failed to respond to inquiry', error: error.message });
  }
};

/**
 * Update inquiry status
 */
export const updateInquiryStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const { status } = req.body;

    const inquiry = await Inquiry.findByPk(id);

    if (!inquiry) {
      res.status(404).json({ message: 'Inquiry not found' });
      return;
    }

    // Only inquiry creator can close their inquiry
    if (status === 'closed' && inquiry.userId !== userId) {
      res.status(403).json({ message: 'Only inquiry creator can close it' });
      return;
    }

    await inquiry.update({ status });

    res.json({
      message: 'Inquiry status updated',
      inquiry,
    });
  } catch (error: any) {
    console.error('Update inquiry status error:', error);
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
};

/**
 * Delete inquiry
 */
export const deleteInquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const inquiry = await Inquiry.findByPk(id);

    if (!inquiry) {
      res.status(404).json({ message: 'Inquiry not found' });
      return;
    }

    // Only inquiry creator or admin can delete
    if (inquiry.userId !== userId && !['admin', 'manager'].includes(userRole)) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    await inquiry.destroy();

    res.json({ message: 'Inquiry deleted successfully' });
  } catch (error: any) {
    console.error('Delete inquiry error:', error);
    res.status(500).json({ message: 'Failed to delete inquiry', error: error.message });
  }
};

/**
 * Get inquiry statistics (for dashboard)
 */
export const getInquiryStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { campsiteId } = req.query;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const where: any = {};

    if (campsiteId) {
      // Verify ownership
      if (!['admin', 'manager'].includes(userRole)) {
        const campsite = await Campsite.findByPk(campsiteId as string);
        if (!campsite || (campsite as any).ownerId !== userId) {
          res.status(403).json({ message: 'Access denied' });
          return;
        }
      }
      where.campsiteId = campsiteId;
    }

    const [total, pending, answered, closed, unread] = await Promise.all([
      Inquiry.count({ where }),
      Inquiry.count({ where: { ...where, status: 'pending' } }),
      Inquiry.count({ where: { ...where, status: 'answered' } }),
      Inquiry.count({ where: { ...where, status: 'closed' } }),
      Inquiry.count({ where: { ...where, isRead: false } }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayInquiries = await Inquiry.count({
      where: {
        ...where,
        createdAt: { [Op.gte]: today },
      },
    });

    const categoryStats = await Inquiry.findAll({
      where,
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['category'],
      raw: true,
    });

    res.json({
      total,
      pending,
      answered,
      closed,
      unread,
      todayInquiries,
      categoryStats,
    });
  } catch (error: any) {
    console.error('Get inquiry stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
};
