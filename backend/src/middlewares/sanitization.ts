import { Request, Response, NextFunction } from 'express';
import createDOMPurify from 'isomorphic-dompurify';

const DOMPurify = createDOMPurify();

/**
 * XSS Protection - Sanitize all string inputs
 * This middleware should be used before validation
 */
export const sanitizeInputs = (req: Request, res: Response, next: NextFunction): void => {
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  return obj;
}

/**
 * Sanitize a string value
 */
function sanitizeString(value: string): string {
  // Remove any script tags and potentially dangerous HTML
  let sanitized = DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [], // No HTML tags allowed in API inputs
    ALLOWED_ATTR: [],
  });

  // Additional security: escape special characters for SQL injection prevention
  // Note: Sequelize ORM already handles this, but extra layer doesn't hurt
  sanitized = sanitized
    .replace(/'/g, "''") // Escape single quotes
    .trim();

  return sanitized;
}

/**
 * Sanitize HTML content (for rich text fields)
 * This allows safe HTML tags while removing dangerous ones
 */
export const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'a',
      'blockquote',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
};

/**
 * Remove null bytes from strings (security vulnerability)
 */
export const removeNullBytes = (req: Request, res: Response, next: NextFunction): void => {
  const cleanNullBytes = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/\0/g, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(cleanNullBytes);
    }
    if (obj && typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cleaned[key] = cleanNullBytes(obj[key]);
        }
      }
      return cleaned;
    }
    return obj;
  };

  if (req.body) req.body = cleanNullBytes(req.body);
  if (req.query) req.query = cleanNullBytes(req.query);
  if (req.params) req.params = cleanNullBytes(req.params);

  next();
};

/**
 * Normalize Unicode characters to prevent homograph attacks
 */
export const normalizeUnicode = (req: Request, res: Response, next: NextFunction): void => {
  const normalize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.normalize('NFKC'); // Canonical decomposition followed by canonical composition
    }
    if (Array.isArray(obj)) {
      return obj.map(normalize);
    }
    if (obj && typeof obj === 'object') {
      const normalized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          normalized[key] = normalize(obj[key]);
        }
      }
      return normalized;
    }
    return obj;
  };

  if (req.body) req.body = normalize(req.body);
  if (req.query) req.query = normalize(req.query);
  if (req.params) req.params = normalize(req.params);

  next();
};

/**
 * Combined security middleware
 * Apply all sanitization in correct order
 */
export const securitySanitization = [
  removeNullBytes,
  normalizeUnicode,
  sanitizeInputs,
];

export default {
  sanitizeInputs,
  sanitizeHTML,
  removeNullBytes,
  normalizeUnicode,
  securitySanitization,
};
