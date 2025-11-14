import { Router } from 'express';
import { body } from 'express-validator';
import * as productController from '../controllers/productController';
import { authenticateToken, authorizeRoles } from '../middlewares/auth';
import { validate } from '../middlewares/validation';

const router = Router();

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Protected routes - admin and manager only
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'manager'),
  validate([
    body('sku').notEmpty().withMessage('SKU is required'),
    body('name').notEmpty().withMessage('Product name is required'),
    body('categoryId').isUUID().withMessage('Valid category ID is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('unit').notEmpty().withMessage('Unit is required'),
  ]),
  productController.createProduct
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'manager'),
  productController.updateProduct
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'manager'),
  productController.deleteProduct
);

router.patch(
  '/:id/stock',
  authenticateToken,
  authorizeRoles('admin', 'manager', 'staff'),
  validate([
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    body('operation').isIn(['add', 'subtract']).withMessage('Operation must be add or subtract'),
  ]),
  productController.updateStock
);

export default router;
