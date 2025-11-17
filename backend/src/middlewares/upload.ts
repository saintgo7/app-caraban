import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Upload directory
const uploadDir = path.join(__dirname, '../../uploads');

// Create upload directories if they don't exist
const createUploadDirs = () => {
  const dirs = [
    uploadDir,
    path.join(uploadDir, 'campsites'),
    path.join(uploadDir, 'reviews'),
    path.join(uploadDir, 'profiles'),
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    let uploadPath = uploadDir;

    // Determine upload path based on route
    if (req.baseUrl.includes('/campsites')) {
      uploadPath = path.join(uploadDir, 'campsites');
    } else if (req.baseUrl.includes('/reviews')) {
      uploadPath = path.join(uploadDir, 'reviews');
    } else if (req.baseUrl.includes('/profile')) {
      uploadPath = path.join(uploadDir, 'profiles');
    }

    cb(null, uploadPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter - only images
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'
      )
    );
  }
};

// Multer configuration
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10, // Max 10 files per upload
  },
});

// Helper function to delete file
export const deleteFile = (filePath: string): void => {
  const fullPath = path.join(uploadDir, filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

// Helper function to get file URL
export const getFileUrl = (req: Request, filePath: string): string => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/${filePath}`;
};
