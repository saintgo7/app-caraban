import { body, param, query, ValidationChain } from 'express-validator';

/**
 * Common validation patterns
 */
export const patterns = {
  // Korean phone number: 010-1234-5678 or 01012345678
  phone: /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/,
  // Strong password: at least 8 characters, 1 uppercase, 1 lowercase, 1 number
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  // UUID v4
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  // Date in YYYY-MM-DD format
  date: /^\d{4}-\d{2}-\d{2}$/,
  // Time in HH:MM format
  time: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
};

/**
 * Sanitization helpers
 */
export const sanitizers = {
  // Normalize Korean phone number to format: 010-1234-5678
  normalizePhone: (phone: string): string => {
    return phone.replace(/[^0-9]/g, '').replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3');
  },

  // Remove HTML tags and trim whitespace
  sanitizeText: (text: string): string => {
    return text.replace(/<[^>]*>/g, '').trim();
  },

  // Normalize email (lowercase and trim)
  normalizeEmail: (email: string): string => {
    return email.toLowerCase().trim();
  },
};

/**
 * Common validators for reuse
 */
export const commonValidators = {
  // Email validation
  email: () =>
    body('email')
      .trim()
      .isEmail()
      .withMessage('유효한 이메일 주소를 입력해주세요')
      .normalizeEmail()
      .isLength({ max: 255 })
      .withMessage('이메일은 최대 255자까지 입력 가능합니다'),

  // Strong password validation
  strongPassword: (field = 'password') =>
    body(field)
      .trim()
      .isLength({ min: 8 })
      .withMessage('비밀번호는 최소 8자 이상이어야 합니다')
      .matches(patterns.strongPassword)
      .withMessage('비밀번호는 대문자, 소문자, 숫자를 각각 최소 1개 포함해야 합니다')
      .isLength({ max: 128 })
      .withMessage('비밀번호는 최대 128자까지 가능합니다'),

  // Basic password validation (for backward compatibility)
  password: (field = 'password') =>
    body(field)
      .trim()
      .isLength({ min: 6 })
      .withMessage('비밀번호는 최소 6자 이상이어야 합니다')
      .isLength({ max: 128 })
      .withMessage('비밀번호는 최대 128자까지 가능합니다'),

  // Name validation (Korean, English, spaces allowed)
  name: (field: string, displayName: string) =>
    body(field)
      .trim()
      .notEmpty()
      .withMessage(`${displayName}을(를) 입력해주세요`)
      .isLength({ min: 1, max: 50 })
      .withMessage(`${displayName}은(는) 1-50자 사이여야 합니다`)
      .matches(/^[가-힣a-zA-Z\s]+$/)
      .withMessage(`${displayName}은(는) 한글, 영문, 공백만 입력 가능합니다`),

  // Phone number validation
  phone: (field = 'phone') =>
    body(field)
      .optional()
      .trim()
      .matches(patterns.phone)
      .withMessage('올바른 휴대폰 번호를 입력해주세요 (예: 010-1234-5678)')
      .customSanitizer(sanitizers.normalizePhone),

  // UUID validation
  uuid: (field: string, location: 'body' | 'param' | 'query' = 'param') => {
    const validator = location === 'body' ? body(field) : location === 'query' ? query(field) : param(field);
    return validator
      .trim()
      .notEmpty()
      .withMessage('ID를 입력해주세요')
      .matches(patterns.uuid)
      .withMessage('올바른 ID 형식이 아닙니다');
  },

  // Date validation
  date: (field: string, options: { min?: Date; max?: Date } = {}) => {
    const validator = body(field)
      .trim()
      .notEmpty()
      .withMessage('날짜를 입력해주세요')
      .matches(patterns.date)
      .withMessage('날짜는 YYYY-MM-DD 형식이어야 합니다')
      .isISO8601()
      .withMessage('올바른 날짜를 입력해주세요');

    if (options.min) {
      validator.isAfter(options.min.toISOString()).withMessage(`날짜는 ${options.min.toLocaleDateString()} 이후여야 합니다`);
    }

    if (options.max) {
      validator.isBefore(options.max.toISOString()).withMessage(`날짜는 ${options.max.toLocaleDateString()} 이전이어야 합니다`);
    }

    return validator;
  },

  // Positive integer validation
  positiveInt: (field: string, displayName: string) =>
    body(field)
      .trim()
      .notEmpty()
      .withMessage(`${displayName}을(를) 입력해주세요`)
      .isInt({ min: 1 })
      .withMessage(`${displayName}은(는) 1 이상의 정수여야 합니다`)
      .toInt(),

  // Price/Amount validation (non-negative)
  amount: (field: string, displayName: string) =>
    body(field)
      .trim()
      .notEmpty()
      .withMessage(`${displayName}을(를) 입력해주세요`)
      .isFloat({ min: 0 })
      .withMessage(`${displayName}은(는) 0 이상의 숫자여야 합니다`)
      .toFloat(),

  // Enum validation
  enum: (field: string, values: string[], displayName: string) =>
    body(field)
      .trim()
      .notEmpty()
      .withMessage(`${displayName}을(를) 선택해주세요`)
      .isIn(values)
      .withMessage(`${displayName}은(는) ${values.join(', ')} 중 하나여야 합니다`),

  // Text with length limit
  text: (field: string, displayName: string, maxLength = 1000) =>
    body(field)
      .trim()
      .notEmpty()
      .withMessage(`${displayName}을(를) 입력해주세요`)
      .isLength({ max: maxLength })
      .withMessage(`${displayName}은(는) 최대 ${maxLength}자까지 입력 가능합니다`)
      .customSanitizer(sanitizers.sanitizeText),

  // Optional text with length limit
  optionalText: (field: string, maxLength = 1000) =>
    body(field)
      .optional()
      .trim()
      .isLength({ max: maxLength })
      .withMessage(`${field}은(는) 최대 ${maxLength}자까지 입력 가능합니다`)
      .customSanitizer(sanitizers.sanitizeText),

  // Boolean validation
  boolean: (field: string, displayName: string) =>
    body(field)
      .optional()
      .isBoolean()
      .withMessage(`${displayName}은(는) true 또는 false여야 합니다`)
      .toBoolean(),

  // Array validation
  array: (field: string, displayName: string, options: { min?: number; max?: number } = {}) => {
    const validator = body(field)
      .isArray()
      .withMessage(`${displayName}은(는) 배열이어야 합니다`);

    if (options.min !== undefined) {
      validator.isArray({ min: options.min }).withMessage(`${displayName}은(는) 최소 ${options.min}개 이상이어야 합니다`);
    }

    if (options.max !== undefined) {
      validator.isArray({ max: options.max }).withMessage(`${displayName}은(는) 최대 ${options.max}개까지 가능합니다`);
    }

    return validator;
  },
};

/**
 * Specific model validators
 */

// User registration validation
export const userRegistrationValidators = (): ValidationChain[] => [
  commonValidators.email(),
  commonValidators.strongPassword('password'),
  commonValidators.name('firstName', '이름'),
  commonValidators.name('lastName', '성'),
  commonValidators.phone('phone'),
];

// User login validation
export const userLoginValidators = (): ValidationChain[] => [
  commonValidators.email(),
  commonValidators.password('password'),
];

// User profile update validation
export const userProfileUpdateValidators = (): ValidationChain[] => [
  commonValidators.name('firstName', '이름').optional(),
  commonValidators.name('lastName', '성').optional(),
  commonValidators.phone('phone'),
  commonValidators.optionalText('address', 500),
];

// Password change validation
export const passwordChangeValidators = (): ValidationChain[] => [
  commonValidators.password('currentPassword'),
  commonValidators.strongPassword('newPassword'),
  body('newPassword').custom((value, { req }) => {
    if (value === req.body.currentPassword) {
      throw new Error('새 비밀번호는 현재 비밀번호와 달라야 합니다');
    }
    return true;
  }),
];

// Campsite validation
export const campsiteValidators = (): ValidationChain[] => [
  commonValidators.text('name', '캠핑장 이름', 200),
  commonValidators.text('description', '캠핑장 설명', 5000),
  commonValidators.text('address', '주소', 500),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('위도는 -90에서 90 사이의 값이어야 합니다')
    .toFloat(),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('경도는 -180에서 180 사이의 값이어야 합니다')
    .toFloat(),
  commonValidators.enum('category', ['캠핑장', '글램핑', '카라반', '오토캠핑'], '카테고리'),
  commonValidators.amount('pricePerNight', '1박 요금'),
  commonValidators.positiveInt('capacity', '수용 인원'),
  commonValidators.array('amenities', '편의시설', { max: 50 }),
];

// Reservation validation
export const reservationValidators = (): ValidationChain[] => [
  commonValidators.uuid('campsiteId', 'param'),
  commonValidators.date('checkInDate'),
  commonValidators.date('checkOutDate'),
  body('checkOutDate').custom((value, { req }) => {
    const checkIn = new Date(req.body.checkInDate);
    const checkOut = new Date(value);
    if (checkOut <= checkIn) {
      throw new Error('체크아웃 날짜는 체크인 날짜보다 늦어야 합니다');
    }
    return true;
  }),
  commonValidators.positiveInt('numberOfGuests', '인원 수'),
  commonValidators.optionalText('specialRequests', 1000),
];

// Payment validation
export const paymentValidators = (): ValidationChain[] => [
  commonValidators.uuid('reservationId', 'body'),
  body('impUid')
    .trim()
    .notEmpty()
    .withMessage('결제 고유번호(impUid)를 입력해주세요')
    .isLength({ max: 100 })
    .withMessage('결제 고유번호가 올바르지 않습니다'),
  body('merchantUid')
    .trim()
    .notEmpty()
    .withMessage('주문번호(merchantUid)를 입력해주세요')
    .isLength({ max: 100 })
    .withMessage('주문번호가 올바르지 않습니다'),
  commonValidators.amount('amount', '결제 금액'),
];

// Review validation
export const reviewValidators = (): ValidationChain[] => [
  commonValidators.uuid('campsiteId', 'param'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('평점은 1에서 5 사이의 정수여야 합니다')
    .toInt(),
  commonValidators.text('comment', '후기 내용', 2000),
];

/**
 * Query parameter validators for pagination and filtering
 */
export const paginationValidators = (): ValidationChain[] => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('페이지 번호는 1 이상의 정수여야 합니다')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('페이지당 항목 수는 1에서 100 사이여야 합니다')
    .toInt(),
  query('sortBy')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('정렬 기준이 올바르지 않습니다'),
  query('order')
    .optional()
    .trim()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('정렬 순서는 ASC 또는 DESC여야 합니다')
    .toUpperCase(),
];

export const searchValidators = (): ValidationChain[] => [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('검색어는 1에서 200자 사이여야 합니다'),
  ...paginationValidators(),
];
