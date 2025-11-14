export const USER_ROLES = {
  ADMIN: 'admin' as const,
  MANAGER: 'manager' as const,
  STAFF: 'staff' as const,
  CUSTOMER: 'customer' as const,
};

export const ORDER_STATUS = {
  PENDING: 'pending' as const,
  CONFIRMED: 'confirmed' as const,
  PROCESSING: 'processing' as const,
  SHIPPED: 'shipped' as const,
  DELIVERED: 'delivered' as const,
  CANCELLED: 'cancelled' as const,
};

export const PAYMENT_STATUS = {
  PENDING: 'pending' as const,
  PAID: 'paid' as const,
  FAILED: 'failed' as const,
  REFUNDED: 'refunded' as const,
};

export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
};

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
};
