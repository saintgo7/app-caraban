import { Router } from 'express';
import * as adminDashboardController from '../controllers/adminDashboardController';
import { authenticateToken, authorizeRoles } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { body, param, query } from 'express-validator';

const router = Router();

// All routes require authentication and admin/manager role
router.use(authenticateToken);

// Dashboard statistics
router.get(
  '/dashboard/stats',
  authorizeRoles(['admin', 'manager']),
  adminDashboardController.getDashboardStats
);

// Recent activities
router.get(
  '/dashboard/activities',
  authorizeRoles(['admin', 'manager']),
  validate([
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ]),
  adminDashboardController.getRecentActivities
);

// User management
router.get(
  '/users',
  authorizeRoles(['admin', 'manager']),
  validate([
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().trim(),
    query('role').optional().isIn(['admin', 'manager', 'staff', 'customer']),
    query('isActive').optional().isBoolean(),
  ]),
  adminDashboardController.getAllUsers
);

router.patch(
  '/users/:id/status',
  authorizeRoles(['admin']),
  validate([
    param('id').isUUID().withMessage('Invalid user ID'),
    body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  ]),
  adminDashboardController.updateUserStatus
);

// Review management
router.get(
  '/reviews',
  authorizeRoles(['admin', 'manager']),
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pending', 'approved', 'reported']),
    query('rating').optional().isInt({ min: 1, max: 5 }),
  ]),
  adminDashboardController.getAllReviews
);

router.patch(
  '/reviews/:id/moderate',
  authorizeRoles(['admin', 'manager']),
  validate([
    param('id').isUUID().withMessage('Invalid review ID'),
    body('action').isIn(['approve', 'reject', 'hide']).withMessage('Invalid action'),
    body('adminResponse').optional().trim().isLength({ max: 1000 }),
  ]),
  adminDashboardController.moderateReview
);

// System health
router.get(
  '/system/health',
  authorizeRoles(['admin']),
  adminDashboardController.getSystemHealth
);

export default router;
