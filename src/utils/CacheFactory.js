import Config from '../config/Config.js';

import Logger from './Logger.js';
import { MemoryCache, globalWeatherCache } from './MemoryCache.js';
import { RedisCache, globalRedisCache } from './RedisCache.js';

// Create logger lazily to allow proper mocking in tests
let logger = null;
const getLogger = () => {
  if (!logger) {
    logger = Logger.module('Cache Factory');
  }
  return logger;
};

/**
 * Cache factory that provides the appropriate cache implementation
 * based on configuration
 */
export class CacheFactory {
  static _instance = null;
  static _cache = null;

  /**
   * Get the configured cache instance
   */
  static async getInstance() {
    if (this._cache) {
      return this._cache;
    }

    const config = Config.getInstance();
    const cacheStrategy = config.cache.strategy;

    if (cacheStrategy === 'redis') {
      this._cache = globalRedisCache;

      // Initialize Redis connection if not already connected
      if (!this._cache.isConnected) {
        try {
          await this._cache.connect();
        } catch (error) {
          getLogger().warn(
            'Failed to connect to Redis, falling back to memory cache:',
            error
          );
          this._cache = globalWeatherCache;
        }
      }
    } else {
      this._cache = globalWeatherCache;
    }

    return this._cache;
  }

  /**
   * Create a new cache instance (for testing or specific use cases)
   */
  static createInstance(strategy = null) {
    const config = Config.getInstance();
    const cacheStrategy = strategy || config.cache.strategy;

    if (cacheStrategy === 'redis') {
      return new RedisCache();
    }

    return new MemoryCache();
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static reset() {
    this._cache = null;
    this._instance = null;
    logger = null; // Reset logger for testing
  }

  /**
   * Get cache configuration information
   */
  static getCacheInfo() {
    const config = Config.getInstance();
    return {
      strategy: config.cache.strategy,
      defaultTtl: config.cache.defaultTtl,
      isRedis: config.cache.strategy === 'redis',
      isMemory: config.cache.strategy === 'memory'
    };
  }
}

/**
 * Convenience function to get the configured cache instance
 */
export const getCache = () => CacheFactory.getInstance();

/**
 * Wrapper class that provides a unified interface for both cache types
 * and handles async/sync differences automatically
 */
export class UnifiedCache {
  constructor(cacheInstance) {
    this.cache = cacheInstance;
    // More robust Redis detection that works with mocks
    this.isRedis =
      cacheInstance instanceof RedisCache ||
      (cacheInstance &&
        cacheInstance.constructor &&
        cacheInstance.constructor.name === 'RedisCache') ||
      (cacheInstance && cacheInstance._isRedisCache === true);
  }

  /**
   * Set a value in cache with TTL
   */
  async set(key, value, ttlMs) {
    if (this.isRedis) {
      return this.cache.set(key, value, ttlMs);
    }
    return this.cache.set(key, value, ttlMs);
  }

  /**
   * Get a value from cache
   */
  async get(key) {
    if (this.isRedis) {
      return this.cache.get(key);
    }
    return this.cache.get(key);
  }

  /**
   * Check if key exists
   */
  async has(key) {
    if (this.isRedis) {
      return this.cache.has(key);
    }
    return this.cache.has(key);
  }

  /**
   * Delete a key from cache
   */
  async delete(key) {
    if (this.isRedis) {
      return this.cache.delete(key);
    }
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  async clear() {
    if (this.isRedis) {
      return this.cache.clear();
    }
    return this.cache.clear();
  }

  /**
   * Get cache size
   */
  async size() {
    if (this.isRedis) {
      return this.cache.size();
    }
    return this.cache.size();
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (this.isRedis) {
      return this.cache.getStats();
    }
    return this.cache.getStats();
  }
}

/**
 * Get a unified cache instance that works with both Redis and Memory cache
 */
export const getUnifiedCache = async () => {
  const cacheInstance = await getCache();
  return new UnifiedCache(cacheInstance);
};
