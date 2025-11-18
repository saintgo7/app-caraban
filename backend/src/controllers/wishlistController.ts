import { Request, Response } from 'express';
import Wishlist from '../models/Wishlist';
import Campsite from '../models/Campsite';
import User from '../models/User';

/**
 * Add campsite to wishlist
 */
export const addToWishlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { campsiteId, notes, notifyOnAvailability } = req.body;

    // Validate campsite exists
    const campsite = await Campsite.findByPk(campsiteId);
    if (!campsite) {
      res.status(404).json({ message: 'Campsite not found' });
      return;
    }

    // Check if already in wishlist
    const existing = await Wishlist.findOne({
      where: { userId, campsiteId },
    });

    if (existing) {
      res.status(400).json({ message: 'Campsite already in wishlist' });
      return;
    }

    const wishlistItem = await Wishlist.create({
      userId,
      campsiteId,
      notes,
      notifyOnAvailability: notifyOnAvailability || false,
    });

    await wishlistItem.reload({
      include: [
        { model: Campsite, as: 'campsite' },
      ],
    });

    res.status(201).json({
      message: 'Added to wishlist',
      wishlistItem,
    });
  } catch (error: any) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Failed to add to wishlist', error: error.message });
  }
};

/**
 * Get user's wishlist
 */
export const getWishlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { page = 1, limit = 20 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: wishlistItems } = await Wishlist.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Campsite,
          as: 'campsite',
          attributes: ['id', 'name', 'location', 'description', 'images', 'pricePerNight', 'rating', 'amenities'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      wishlist: wishlistItems,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Failed to fetch wishlist', error: error.message });
  }
};

/**
 * Check if campsite is in wishlist
 */
export const checkWishlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { campsiteId } = req.params;

    const wishlistItem = await Wishlist.findOne({
      where: { userId, campsiteId },
    });

    res.json({
      inWishlist: !!wishlistItem,
      wishlistItem: wishlistItem || null,
    });
  } catch (error: any) {
    console.error('Check wishlist error:', error);
    res.status(500).json({ message: 'Failed to check wishlist', error: error.message });
  }
};

/**
 * Update wishlist item
 */
export const updateWishlistItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { notes, notifyOnAvailability } = req.body;

    const wishlistItem = await Wishlist.findOne({
      where: { id, userId },
    });

    if (!wishlistItem) {
      res.status(404).json({ message: 'Wishlist item not found' });
      return;
    }

    await wishlistItem.update({
      notes,
      notifyOnAvailability,
    });

    await wishlistItem.reload({
      include: [
        { model: Campsite, as: 'campsite' },
      ],
    });

    res.json({
      message: 'Wishlist item updated',
      wishlistItem,
    });
  } catch (error: any) {
    console.error('Update wishlist item error:', error);
    res.status(500).json({ message: 'Failed to update wishlist item', error: error.message });
  }
};

/**
 * Remove from wishlist
 */
export const removeFromWishlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { campsiteId } = req.params;

    const wishlistItem = await Wishlist.findOne({
      where: { userId, campsiteId },
    });

    if (!wishlistItem) {
      res.status(404).json({ message: 'Wishsite item not found' });
      return;
    }

    await wishlistItem.destroy();

    res.json({ message: 'Removed from wishlist' });
  } catch (error: any) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Failed to remove from wishlist', error: error.message });
  }
};

/**
 * Get wishlist statistics
 */
export const getWishlistStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { campsiteId } = req.params;

    const totalWishlists = await Wishlist.count({
      where: { campsiteId },
    });

    const withNotifications = await Wishlist.count({
      where: { campsiteId, notifyOnAvailability: true },
    });

    res.json({
      totalWishlists,
      withNotifications,
    });
  } catch (error: any) {
    console.error('Get wishlist stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
};
