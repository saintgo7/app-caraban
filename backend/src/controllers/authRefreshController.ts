import { Response, NextFunction, Request } from 'express';
import jwt from 'jsonwebtoken';
import { User, RefreshToken } from '../models';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
import crypto from 'crypto';

// Generate access token
const generateAccessToken = (userId: string, email: string, role: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('JWT secret is not configured', 500);
  }

  return jwt.sign({ id: userId, email, role }, secret, {
    expiresIn: '15m', // Short-lived access token
  });
};

// Generate refresh token
const generateRefreshToken = async (
  userId: string,
  req: Request
): Promise<string> => {
  const token = crypto.randomBytes(64).toString('hex');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  await RefreshToken.create({
    userId,
    token,
    expiresAt,
    ipAddress: req.ip,
    deviceInfo: req.get('user-agent'),
  });

  return token;
};

// Refresh access token using refresh token
export const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    // Find refresh token in database
    const storedToken = await RefreshToken.findOne({
      where: { token: refreshToken },
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    });

    if (!storedToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Check if token is valid
    if (!storedToken.isValid()) {
      throw new AppError('Refresh token expired or revoked', 401);
    }

    const user = storedToken.user as any;

    // Generate new access token
    const accessToken = generateAccessToken(user.id, user.email, user.role);

    // Optionally rotate refresh token for better security
    if (process.env.ROTATE_REFRESH_TOKENS === 'true') {
      // Revoke old token
      await storedToken.update({ isRevoked: true });

      // Generate new refresh token
      const newRefreshToken = await generateRefreshToken(user.id, req);

      return res.json({
        success: true,
        data: {
          accessToken,
          refreshToken: newRefreshToken,
        },
      });
    }

    res.json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Logout - revoke refresh token
export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Revoke the refresh token
      await RefreshToken.update(
        { isRevoked: true },
        { where: { token: refreshToken } }
      );
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Logout from all devices - revoke all user's refresh tokens
export const logoutAll = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Revoke all refresh tokens for this user
    await RefreshToken.update(
      { isRevoked: true },
      { where: { userId: req.user.id } }
    );

    res.json({
      success: true,
      message: 'Logged out from all devices',
    });
  } catch (error) {
    next(error);
  }
};

// Get active sessions (refresh tokens)
export const getActiveSessions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const sessions = await RefreshToken.findAll({
      where: {
        userId: req.user.id,
        isRevoked: false,
      },
      attributes: ['id', 'deviceInfo', 'ipAddress', 'createdAt', 'expiresAt'],
      order: [['createdAt', 'DESC']],
    });

    // Filter out expired sessions
    const activeSessions = sessions.filter((session) => !session.isExpired());

    res.json({
      success: true,
      data: {
        sessions: activeSessions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Revoke specific session
export const revokeSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { sessionId } = req.params;

    const session = await RefreshToken.findOne({
      where: {
        id: sessionId,
        userId: req.user.id,
      },
    });

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    await session.update({ isRevoked: true });

    res.json({
      success: true,
      message: 'Session revoked successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Clean up expired tokens (should be run as a cron job)
export const cleanupExpiredTokens = async () => {
  try {
    const deleted = await RefreshToken.destroy({
      where: {
        expiresAt: {
          [Op.lt]: new Date(),
        },
      },
    });

    console.log(`Cleaned up ${deleted} expired refresh tokens`);
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  }
};

import { Op } from 'sequelize';
