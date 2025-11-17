import { Router } from 'express';
import * as uploadController from '../controllers/uploadController';
import { authenticateToken } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

const router = Router();

// All upload routes require authentication
router.use(authenticateToken);

// Upload multiple images (max 10)
router.post(
  '/images',
  upload.array('images', 10),
  uploadController.uploadImages
);

// Upload single image
router.post(
  '/image',
  upload.single('image'),
  uploadController.uploadSingleImage
);

export default router;
