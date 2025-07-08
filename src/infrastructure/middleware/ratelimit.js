/* eslint-disable no-console */
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';

import Config from '../../config/Config.js';
import { CacheFactory, getUnifiedCache } from '../../utils/CacheFactory.js';

let rateLimiter = null;

/**
 * Initialize rate limiter using CacheFactory strategy
 */
async function initializeRateLimiter() {
  const config = Config.getInstance();
  const cacheInfo = CacheFactory.getCacheInfo();

  try {
    if (cacheInfo.isRedis) {
      // Use Redis-based rate limiter
      const cache = await getUnifiedCache();

      // Check if Redis cache is connected
      if (cache.cache.isConnected) {
        rateLimiter = new RateLimiterRedis({
          storeClient: cache,
          keyPrefix: config.app.name,
          points: config.service.requestLimit,
          duration: config.service.requestLimitTime,
          execEvenly: config.service.slidingWindow,
          blockDuration: config.service.requestBlockDuration
        });
        console.log('Rate limiter initialized with Redis backend');
      } else {
        throw new Error('Redis cache not connected');
      }
    } else {
      // Use memory-based rate limiter
      rateLimiter = new RateLimiterMemory({
        points: config.service.requestLimit,
        duration: config.service.requestLimitTime,
        execEvenly: config.service.slidingWindow,
        blockDuration: config.service.requestBlockDuration
      });
      console.log('Rate limiter initialized with memory backend');
    }
  } catch (error) {
    console.warn(
      'Failed to initialize Redis rate limiter, falling back to memory:',
      error.message
    );

    // Fallback to memory rate limiter
    rateLimiter = new RateLimiterMemory({
      points: config.service.requestLimit,
      duration: config.service.requestLimitTime,
      execEvenly: config.service.slidingWindow,
      blockDuration: config.service.requestBlockDuration
    });
    console.log('Rate limiter initialized with memory backend (fallback)');
  }
}

// Initialize the rate limiter (will be called when first needed)
let initPromise = null;

const initializeRateLimiterOnce = async () => {
  if (!initPromise) {
    initPromise = initializeRateLimiter();
  }
  return initPromise;
};

/**
 * Get the current rate limiter instance
 */
export const getRateLimiter = () => rateLimiter;

/**
 * Reinitialize rate limiter (useful for configuration changes)
 */
export const reinitializeRateLimiter = async () => {
  rateLimiter = null;
  initPromise = null;
  await initializeRateLimiterOnce();
  return rateLimiter;
};

export const rateLimiterMiddleware = async (req, res, next) => {
  try {
    await initializeRateLimiterOnce();
  } catch (error) {
    console.warn('Rate limiter initialization failed:', error.message);
  }

  if (!rateLimiter) {
    return next();
  }

  try {
    const rateLimiterRes = await rateLimiter.consume(req.ip);
    // If the limit is not reached, process the request
    console.log('Remaining Requests:', rateLimiterRes.remainingPoints);
    next();
  } catch (rateLimiterRes) {
    // If the limit is reached, handle the rate limit exceeded
    const msBeforeNext = rateLimiterRes.msBeforeNext || 1000;
    const retrySecs = Math.max(1, Math.ceil(msBeforeNext / 1000));
    res.set('Retry-After', String(retrySecs));
    res.set(
      'X-RateLimit-Limit',
      String(rateLimiterRes.totalHits || rateLimiterRes.limit || 100)
    );
    res.set('X-RateLimit-Remaining', String(rateLimiterRes.remainingPoints || 0));
    next(new Error('TooManyRequestsError'));
  }
};
