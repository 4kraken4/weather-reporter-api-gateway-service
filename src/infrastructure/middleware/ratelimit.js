/* eslint-disable no-console */
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';

import Config from '../../config/Config.js';
import { redis, waitForRedis } from '../../config/redis.js';

let rateLimiter = null;
const useRedis =
  Config.getInstance().db.redis.enabled === 'true' &&
  (await waitForRedis()) === 'ready';

if (useRedis) {
  rateLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: Config.getInstance().app.name,
    points: Config.getInstance().service.requestLimit,
    duration: Config.getInstance().service.requestLimitTime,
    execEvenly: Config.getInstance().service.slidingWindow,
    blockDuration: Config.getInstance().service.requestBlockDuration
  });
} else {
  if (Config.getInstance().db.redis.enabled === 'true') {
    console.error('Redis is not ready. Falling back to in-memory rate limiter');
  }
  rateLimiter = new RateLimiterMemory({
    points: Config.getInstance().service.requestLimit,
    duration: Config.getInstance().service.requestLimitTime,
    execEvenly: Config.getInstance().service.slidingWindow,
    blockDuration: Config.getInstance().service.requestBlockDuration
  });
  redis.quit();
}

export const rateLimiterMiddleware = (req, res, next) => {
  rateLimiter
    ?.consume(req.ip)
    .then(rateLimiterRes => {
      // If the limit is not reached, process the request
      console.log('Remaining Requests:', rateLimiterRes.remainingPoints);
      next();
    })
    .catch(rateLimiterRes => {
      // If the limit is reached, handle the rate limit exceeded
      const retrySecs = Math.ceil(rateLimiterRes.msBeforeNext / 1000) || 1;
      res.set('Retry-After', String(retrySecs));
      res.set('X-RateLimit-Limit', String(rateLimiterRes.limit));
      res.set('X-RateLimit-Remaining', String(rateLimiterRes.remainingPoints));
      next(new Error('TooManyRequestsError'));
    });
};
