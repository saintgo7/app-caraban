import { Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import User from '../models/User';
import RefreshToken from '../models/RefreshToken';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY || '';
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI || 'http://localhost:3000/auth/kakao/callback';

interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  refresh_token_expires_in: number;
}

interface KakaoUserInfo {
  id: number;
  connected_at: string;
  properties?: {
    nickname?: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account?: {
    profile_needs_agreement?: boolean;
    profile?: {
      nickname?: string;
      thumbnail_image_url?: string;
      profile_image_url?: string;
    };
    email_needs_agreement?: boolean;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
    email?: string;
    name_needs_agreement?: boolean;
    name?: string;
    phone_number_needs_agreement?: boolean;
    phone_number?: string;
  };
}

/**
 * Generate Kakao OAuth authorization URL
 */
export const getKakaoAuthUrl = (_req: Request, res: Response): void => {
  const state = crypto.randomBytes(16).toString('hex');

  // Store state in session or temporary cache for CSRF protection
  // For simplicity, we'll return it to the client

  const authUrl = new URL('https://kauth.kakao.com/oauth/authorize');
  authUrl.searchParams.append('client_id', KAKAO_REST_API_KEY);
  authUrl.searchParams.append('redirect_uri', KAKAO_REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('state', state);

  res.json({
    authUrl: authUrl.toString(),
    state,
  });
};

/**
 * Exchange authorization code for access token
 */
const getKakaoToken = async (code: string): Promise<KakaoTokenResponse> => {
  const tokenUrl = 'https://kauth.kakao.com/oauth/token';

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: KAKAO_REST_API_KEY,
    redirect_uri: KAKAO_REDIRECT_URI,
    code: code,
  });

  const response = await axios.post<KakaoTokenResponse>(tokenUrl, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data;
};

/**
 * Get user information from Kakao
 */
const getKakaoUserInfo = async (accessToken: string): Promise<KakaoUserInfo> => {
  const userInfoUrl = 'https://kapi.kakao.com/v2/user/me';

  const response = await axios.get<KakaoUserInfo>(userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
  });

  return response.data;
};

/**
 * Generate JWT access token
 */
const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });
};

/**
 * Generate refresh token
 */
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

/**
 * Handle Kakao OAuth callback
 */
export const kakaoCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'Authorization code is required' });
      return;
    }

    // Validate state for CSRF protection (in production, verify against stored state)
    if (!state || typeof state !== 'string') {
      res.status(400).json({ error: 'Invalid state parameter' });
      return;
    }

    // Exchange code for access token
    const tokenData = await getKakaoToken(code);

    // Get user information
    const kakaoUser = await getKakaoUserInfo(tokenData.access_token);

    // Extract user data
    const kakaoId = kakaoUser.id.toString();
    const email = kakaoUser.kakao_account?.email;
    const nickname = kakaoUser.kakao_account?.profile?.nickname ||
      kakaoUser.properties?.nickname ||
      `kakao_user_${kakaoId}`;

    // Split nickname into first and last name (or use nickname for both)
    const nameParts = nickname.split(' ');
    const firstName = nameParts[0] || nickname;
    const lastName = nameParts.slice(1).join(' ') || nickname;

    // Check if user exists
    let user = await User.findOne({
      where: { kakaoId },
    });

    if (!user && email) {
      // Check if user with email exists
      user = await User.findOne({
        where: { email },
      });

      if (user) {
        // Link Kakao account to existing user
        await user.update({ kakaoId });
      }
    }

    // Create new user if doesn't exist
    if (!user) {
      if (!email) {
        res.status(400).json({
          error: 'Email is required for account creation. Please grant email permission in Kakao.'
        });
        return;
      }

      user = await User.create({
        email,
        firstName,
        lastName,
        kakaoId,
        password: crypto.randomBytes(32).toString('hex'), // Random password for OAuth users
        role: 'customer',
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = await generateRefreshToken(user.id, req);

    res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Kakao login error:', error);

    if (axios.isAxiosError(error)) {
      res.status(500).json({
        error: 'Failed to authenticate with Kakao',
        details: error.response?.data || error.message,
      });
      return;
    }

    res.status(500).json({ error: 'Internal server error during Kakao login' });
  }
};

/**
 * Unlink Kakao account
 */
export const unlinkKakao = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findByPk(userId);

    if (!user || !user.kakaoId) {
      res.status(404).json({ error: 'Kakao account not linked' });
      return;
    }

    // Ensure user has a password before unlinking (for security)
    if (!user.password || user.password.length < 32) {
      res.status(400).json({
        error: 'Please set a password before unlinking your Kakao account'
      });
      return;
    }

    // Unlink Kakao account
    await user.update({ kakaoId: null as any });

    res.json({
      message: 'Kakao account unlinked successfully',
    });
  } catch (error) {
    console.error('Unlink Kakao error:', error);
    res.status(500).json({ error: 'Failed to unlink Kakao account' });
  }
};

/**
 * Link existing account to Kakao
 */
export const linkKakao = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { code } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!code) {
      res.status(400).json({ error: 'Authorization code is required' });
      return;
    }

    // Exchange code for access token
    const tokenData = await getKakaoToken(code);

    // Get user information
    const kakaoUser = await getKakaoUserInfo(tokenData.access_token);
    const kakaoId = kakaoUser.id.toString();

    // Check if Kakao account is already linked
    const existingUser = await User.findOne({
      where: { kakaoId },
    });

    if (existingUser) {
      res.status(400).json({
        error: 'This Kakao account is already linked to another user'
      });
      return;
    }

    // Link Kakao account
    const user = await User.findByPk(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await user.update({ kakaoId });

    res.json({
      message: 'Kakao account linked successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        kakaoId: user.kakaoId,
      },
    });
  } catch (error) {
    console.error('Link Kakao error:', error);
    res.status(500).json({ error: 'Failed to link Kakao account' });
  }
};
