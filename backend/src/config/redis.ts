import { createClient, RedisClientType } from 'redis';

class RedisClient {
  private client: RedisClientType | null = null;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.REDIS_ENABLED === 'true';
  }

  async connect(): Promise<void> {
    if (!this.isEnabled) {
      console.log('📦 Redis is disabled - running without cache');
      return;
    }

    try {
      const redisHost = process.env.REDIS_HOST || 'localhost';
      const redisPort = parseInt(process.env.REDIS_PORT || '6379');
      const redisPassword = process.env.REDIS_PASSWORD;

      this.client = createClient({
        socket: {
          host: redisHost,
          port: redisPort,
        },
        password: redisPassword,
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        console.log('🔄 Redis Client is connecting...');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis Client is ready');
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis Client is reconnecting...');
      });

      await this.client.connect();
      console.log(`🚀 Redis connected at ${redisHost}:${redisPort}`);
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      console.log('⚠️  Continuing without Redis cache...');
      this.isEnabled = false;
      this.client = null;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.client.isOpen) {
      await this.client.quit();
      console.log('👋 Redis connection closed');
    }
  }

  getClient(): RedisClientType | null {
    return this.client;
  }

  isRedisEnabled(): boolean {
    return this.isEnabled && this.client !== null && this.client.isOpen;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isRedisEnabled()) return null;

    try {
      const data = await this.client!.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error getting key ${key} from cache:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (default: 3600 = 1 hour)
   */
  async set(key: string, value: any, ttl: number = 3600): Promise<boolean> {
    if (!this.isRedisEnabled()) return false;

    try {
      await this.client!.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting key ${key} in cache:`, error);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string | string[]): Promise<boolean> {
    if (!this.isRedisEnabled()) return false;

    try {
      const keys = Array.isArray(key) ? key : [key];
      await this.client!.del(keys);
      return true;
    } catch (error) {
      console.error(`Error deleting key(s) from cache:`, error);
      return false;
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.isRedisEnabled()) return 0;

    try {
      const keys = await this.client!.keys(pattern);
      if (keys.length > 0) {
        await this.client!.del(keys);
      }
      return keys.length;
    } catch (error) {
      console.error(`Error deleting pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isRedisEnabled()) return false;

    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Error checking existence of key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set expiry on existing key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isRedisEnabled()) return false;

    try {
      await this.client!.expire(key, seconds);
      return true;
    } catch (error) {
      console.error(`Error setting expiry on key ${key}:`, error);
      return false;
    }
  }

  /**
   * Increment a numeric value
   */
  async incr(key: string): Promise<number> {
    if (!this.isRedisEnabled()) return 0;

    try {
      return await this.client!.incr(key);
    } catch (error) {
      console.error(`Error incrementing key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Decrement a numeric value
   */
  async decr(key: string): Promise<number> {
    if (!this.isRedisEnabled()) return 0;

    try {
      return await this.client!.decr(key);
    } catch (error) {
      console.error(`Error decrementing key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Clear all keys in current database
   * USE WITH CAUTION!
   */
  async flushDb(): Promise<boolean> {
    if (!this.isRedisEnabled()) return false;

    try {
      await this.client!.flushDb();
      return true;
    } catch (error) {
      console.error('Error flushing database:', error);
      return false;
    }
  }
}

// Export singleton instance
const redisClient = new RedisClient();

export default redisClient;
export { RedisClient };
