import { Response, NextFunction } from 'express';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
import { getFileUrl } from '../middlewares/upload';

export const uploadImages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다', 401);
    }

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      throw new AppError('업로드할 파일이 없습니다', 400);
    }

    const files = req.files as Express.Multer.File[];

    // Generate URLs for uploaded files
    const fileUrls = files.map((file) => {
      const relativePath = file.path.split('uploads')[1].replace(/\\/g, '/');
      return getFileUrl(req, relativePath);
    });

    res.status(200).json({
      success: true,
      message: '파일이 성공적으로 업로드되었습니다',
      data: {
        files: fileUrls,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadSingleImage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다', 401);
    }

    if (!req.file) {
      throw new AppError('업로드할 파일이 없습니다', 400);
    }

    const relativePath = req.file.path.split('uploads')[1].replace(/\\/g, '/');
    const fileUrl = getFileUrl(req, relativePath);

    res.status(200).json({
      success: true,
      message: '파일이 성공적으로 업로드되었습니다',
      data: {
        file: fileUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};
