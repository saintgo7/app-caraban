import express from 'express';
import {
  createInquiry,
  getUserInquiries,
  getCampsiteInquiries,
  getInquiry,
  respondToInquiry,
  updateInquiryStatus,
  deleteInquiry,
  getInquiryStats,
} from '../controllers/inquiryController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

// User routes - require authentication
router.post('/', authenticateToken, createInquiry);
router.get('/my-inquiries', authenticateToken, getUserInquiries);
router.get('/stats', authenticateToken, getInquiryStats);
router.get('/:id', authenticateToken, getInquiry);
router.patch('/:id/status', authenticateToken, updateInquiryStatus);
router.delete('/:id', authenticateToken, deleteInquiry);

// Owner/Admin routes
router.get('/campsite/:campsiteId', authenticateToken, getCampsiteInquiries);
router.post('/:id/respond', authenticateToken, respondToInquiry);

export default router;
