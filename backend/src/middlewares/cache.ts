import { Request, Response, NextFunction } from 'express';
import redisClient from '../config/redis';

interface CacheOptions {
  /**
   * Time to live in seconds
   */
  ttl?: number;

  /**
   * Custom key generator function
   */
  keyGenerator?: (req: Request) => string;

  /**
   * Should skip caching based on request/response
   */
  skip?: (req: Request, res: Response) => boolean;

  /**
   * Cache only specific status codes
   */
  statusCodes?: number[];
}

/**
 * Default cache key generator
 */
const defaultKeyGenerator = (req: Request): string => {
  const { originalUrl, method } = req;
  const userId = (req as any).user?.userId || 'anonymous';
  return `cache:${method}:${originalUrl}:${userId}`;
};

/**
 * Cache middleware for GET requests
 * Caches successful responses and serves from cache on subsequent requests
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = defaultKeyGenerator,
    skip = () => false,
    statusCodes = [200],
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check if we should skip caching
    if (skip(req, res)) {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator(req);

    try {
      // Try to get cached data
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return res.json(cachedData);
      }

      console.log(`❌ Cache MISS: ${cacheKey}`);

      // Store original json function
      const originalJson = res.json.bind(res);

      // Override json function to cache response
      res.json = function (data: any) {
        // Only cache if status code matches
        if (statusCodes.includes(res.statusCode)) {
          redisClient.set(cacheKey, data, ttl).catch((err) => {
            console.error('Failed to cache response:', err);
          });
        }

        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Cache utilities for manual cache management
 */
export const cacheUtils = {
  /**
   * Cache a specific value with custom key
   */
  set: async (key: string, value: any, ttl: number = 300): Promise<boolean> => {
    return await redisClient.set(`cache:${key}`, value, ttl);
  },

  /**
   * Get cached value by key
   */
  get: async <T>(key: string): Promise<T | null> => {
    return await redisClient.get<T>(`cache:${key}`);
  },

  /**
   * Delete cached value(s)
   */
  del: async (key: string | string[]): Promise<boolean> => {
    const keys = Array.isArray(key) ? key.map((k) => `cache:${k}`) : [`cache:${key}`];
    return await redisClient.del(keys);
  },

  /**
   * Invalidate all cache entries matching a pattern
   * Example: invalidatePattern('campsites:*') clears all campsite caches
   */
  invalidatePattern: async (pattern: string): Promise<number> => {
    return await redisClient.deletePattern(`cache:${pattern}`);
  },

  /**
   * Invalidate cache for a specific resource
   */
  invalidateResource: async (resource: string, id?: string): Promise<number> => {
    const pattern = id ? `cache:*${resource}/${id}*` : `cache:*${resource}*`;
    return await redisClient.deletePattern(pattern);
  },
};

/**
 * Preset cache configurations for common use cases
 */
export const cachePresets = {
  /**
   * Short cache (1 minute) - for frequently changing data
   */
  short: cacheMiddleware({ ttl: 60 }),

  /**
   * Medium cache (5 minutes) - default for most endpoints
   */
  medium: cacheMiddleware({ ttl: 300 }),

  /**
   * Long cache (1 hour) - for relatively static data
   */
  long: cacheMiddleware({ ttl: 3600 }),

  /**
   * Very long cache (1 day) - for rarely changing data
   */
  veryLong: cacheMiddleware({ ttl: 86400 }),

  /**
   * Cache for public data (ignores user context)
   */
  public: cacheMiddleware({
    ttl: 600,
    keyGenerator: (req: Request) => {
      const { originalUrl, method } = req;
      return `cache:public:${method}:${originalUrl}`;
    },
  }),

  /**
   * Cache for search results
   */
  search: cacheMiddleware({
    ttl: 600,
    keyGenerator: (req: Request) => {
      const { originalUrl, method, query } = req;
      const queryString = JSON.stringify(query);
      return `cache:search:${method}:${originalUrl}:${queryString}`;
    },
  }),
};

/**
 * Decorator function to automatically invalidate cache on mutation
 */
export const invalidateCacheAfter = (pattern: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      // Invalidate cache after successful operation
      await cacheUtils.invalidatePattern(pattern);

      return result;
    };

    return descriptor;
  };
};

export default cacheMiddleware;
