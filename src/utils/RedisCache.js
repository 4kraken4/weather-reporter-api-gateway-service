import Redis from 'ioredis';

import Config from '../config/Config.js';

import { createModuleLogger } from './Logger.js';

/**
 * Redis-based cache with TTL support
 */
export class RedisCache {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.config = Config.getInstance();
    this.logger = createModuleLogger('Redis Cache');
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    try {
      const redisConfig = this.config.cache.redis;

      this.client = new Redis({
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
        db: redisConfig.database,
        retryDelayOnFailover: redisConfig.retryDelayOnFailover,
        enableReadyCheck: redisConfig.enableReadyCheck,
        maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
        lazyConnect: true,
        keyPrefix: redisConfig.keyPrefix
      });

      // Handle connection events
      this.client.on('connect', () => {
        this.logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        this.logger.info('Redis client ready');
      });

      this.client.on('error', err => {
        this.logger.error('Redis client error:', err);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        this.logger.info('Redis client connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        this.logger.warn('Redis client reconnecting');
      });

      // Connect to Redis
      await this.client.connect();

      return this;
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Set a value in cache with TTL
   */
  async set(key, value, ttlMs = 300000) {
    // Default 5 minutes
    if (!this.isConnected || !this.client) {
      throw new Error('Redis client not connected');
    }

    try {
      const serializedValue = JSON.stringify({
        value,
        timestamp: Date.now()
      });

      const ttlSeconds = Math.ceil(ttlMs / 1000);
      await this.client.setex(key, ttlSeconds, serializedValue);
    } catch (error) {
      this.logger.error('Redis set error:', error);
      throw error;
    }
  }

  /**
   * Get a value from cache
   */
  async get(key) {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis client not connected');
    }

    try {
      const cached = await this.client.get(key);
      if (!cached) {
        return null;
      }

      const parsed = JSON.parse(cached);
      return parsed.value;
    } catch (error) {
      this.logger.error('Redis get error:', error);
      return null;
    }
  }

  /**
   * Check if key exists and is not expired
   */
  async has(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error('Redis has error:', error);
      return false;
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.del(key);
      return result === 1;
    } catch (error) {
      this.logger.error('Redis delete error:', error);
      return false;
    }
  }

  /**
   * Clear all cache (with key prefix)
   */
  async clear() {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis client not connected');
    }

    try {
      const { keyPrefix } = this.config.cache.redis;
      const keys = await this.client.keys(`${keyPrefix}*`);

      if (keys.length > 0) {
        // Remove prefix before deleting since client already adds it
        const keysWithoutPrefix = keys.map(key => key.replace(keyPrefix, ''));
        await this.client.del(...keysWithoutPrefix);
      }
    } catch (error) {
      this.logger.error('Redis clear error:', error);
      throw error;
    }
  }

  /**
   * Get cache size (approximate count of keys with prefix)
   */
  async size() {
    if (!this.isConnected || !this.client) {
      return 0;
    }

    try {
      const { keyPrefix } = this.config.cache.redis;
      const keys = await this.client.keys(`${keyPrefix}*`);
      return keys.length;
    } catch (error) {
      this.logger.error('Redis size error:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!this.isConnected || !this.client) {
      return {
        size: 0,
        keys: [],
        timestamps: [],
        connected: false
      };
    }

    try {
      const { keyPrefix } = this.config.cache.redis;
      const keys = await this.client.keys(`${keyPrefix}*`);

      // Get timestamps for each key (this might be expensive for large caches)
      const keyPromises = keys.slice(0, 10).map(async key => {
        // Limit to first 10 keys for performance
        try {
          const value = await this.client.get(key.replace(keyPrefix, ''));
          if (value) {
            const parsed = JSON.parse(value);
            return {
              timestamp: parsed.timestamp,
              age: Date.now() - parsed.timestamp
            };
          }
          return null;
        } catch {
          // Skip malformed entries
          return null;
        }
      });

      const timestampResults = await Promise.all(keyPromises);
      const validTimestamps = timestampResults.filter(Boolean);

      return {
        size: keys.length,
        keys: keys.map(key => key.replace(keyPrefix, '')).slice(0, 10), // Show first 10 keys
        timestamps: validTimestamps,
        connected: this.isConnected
      };
    } catch (error) {
      this.logger.error('Redis getStats error:', error);
      return {
        size: 0,
        keys: [],
        timestamps: [],
        connected: false
      };
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

// Create a global Redis cache instance
export const globalRedisCache = new RedisCache();
