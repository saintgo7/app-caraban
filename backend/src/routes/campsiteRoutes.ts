import { Router } from 'express';
import { body, query } from 'express-validator';
import * as campsiteController from '../controllers/campsiteController';
import { authenticateToken } from '../middlewares/auth';
import { validate } from '../middlewares/validation';

const router = Router();

// Public routes
router.get(
  '/',
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isIn(['auto', 'glamping', 'caravan', 'general']),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
  ]),
  campsiteController.getAllCampsites
);

router.get('/:id', campsiteController.getCampsiteById);

// Protected routes - require authentication
router.post(
  '/',
  authenticateToken,
  validate([
    body('name').notEmpty().withMessage('캠핑장 이름은 필수입니다'),
    body('address').notEmpty().withMessage('주소는 필수입니다'),
    body('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('올바른 위도를 입력해주세요'),
    body('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('올바른 경도를 입력해주세요'),
    body('type')
      .isIn(['auto', 'glamping', 'caravan', 'general'])
      .withMessage('올바른 캠핑장 타입을 선택해주세요'),
    body('maxCapacity')
      .isInt({ min: 1 })
      .withMessage('최대 수용 인원을 입력해주세요'),
    body('pricePerNight')
      .isFloat({ min: 0 })
      .withMessage('1박 요금을 입력해주세요'),
    body('checkInTime').notEmpty().withMessage('체크인 시간을 입력해주세요'),
    body('checkOutTime').notEmpty().withMessage('체크아웃 시간을 입력해주세요'),
  ]),
  campsiteController.createCampsite
);

router.put(
  '/:id',
  authenticateToken,
  validate([
    body('name').optional().notEmpty().withMessage('캠핑장 이름은 비워둘 수 없습니다'),
    body('latitude')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('올바른 위도를 입력해주세요'),
    body('longitude')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('올바른 경도를 입력해주세요'),
    body('type')
      .optional()
      .isIn(['auto', 'glamping', 'caravan', 'general'])
      .withMessage('올바른 캠핑장 타입을 선택해주세요'),
    body('maxCapacity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('최대 수용 인원은 1명 이상이어야 합니다'),
    body('pricePerNight')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('1박 요금은 0원 이상이어야 합니다'),
  ]),
  campsiteController.updateCampsite
);

router.delete('/:id', authenticateToken, campsiteController.deleteCampsite);

router.get('/owner/my-campsites', authenticateToken, campsiteController.getMyCampsites);

export default router;
