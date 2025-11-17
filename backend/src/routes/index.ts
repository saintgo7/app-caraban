import { Router } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import campsiteRoutes from './campsiteRoutes';
import reservationRoutes from './reservationRoutes';
import reviewRoutes from './reviewRoutes';
import favoriteRoutes from './favoriteRoutes';
import uploadRoutes from './uploadRoutes';
import paymentRoutes from './paymentRoutes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);

// Camping app routes
router.use('/campsites', campsiteRoutes);
router.use('/reservations', reservationRoutes);
router.use('/reviews', reviewRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/upload', uploadRoutes);
router.use('/payment', paymentRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
