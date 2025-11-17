import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController';
import * as authRefreshController from '../controllers/authRefreshController';
import { authenticateToken } from '../middlewares/auth';
import { validate } from '../middlewares/validation';

const router = Router();

// Public routes
router.post(
  '/register',
  validate([
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
  ]),
  authController.register
);

router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  authController.login
);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);

router.put(
  '/profile',
  authenticateToken,
  validate([
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  ]),
  authController.updateProfile
);

router.put(
  '/change-password',
  authenticateToken,
  validate([
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ]),
  authController.changePassword
);

// Refresh token routes
router.post(
  '/refresh',
  validate([body('refreshToken').notEmpty().withMessage('Refresh token is required')]),
  authRefreshController.refreshAccessToken
);

router.post(
  '/logout',
  validate([body('refreshToken').optional()]),
  authRefreshController.logout
);

router.post('/logout-all', authenticateToken, authRefreshController.logoutAll);

router.get('/sessions', authenticateToken, authRefreshController.getActiveSessions);

router.delete('/sessions/:sessionId', authenticateToken, authRefreshController.revokeSession);

export default router;
