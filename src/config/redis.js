/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
import { Redis } from 'ioredis';

import Config from './Config.js';

const redisConfig = Config.getInstance().db.redis;

const redis = new Redis({
  host: redisConfig.host || 'localhost',
  port: redisConfig.port || 6379,
  connectTimeout: 1000,
  retryStrategy: times => {
    const delay = Math.min(times * 1000, 3000);
    return delay;
  }
});

redis.on('reconnecting', time => {
  console.error(`Redis reconnecting in ${time}ms`);
});

redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('ready', () => {
  console.log('Redis ready');
});

redis.on('close', () => {
  console.error('Redis disconnected');
});

redis.on('error', error => {
  // console.error(`Redis error: ${error}`)
});

async function waitForRedis() {
  let retries = 0;

  const checkRedisStatus = () => {
    if (redis.status === 'ready' || retries >= 4) {
      return Promise.resolve(redis.status);
    }

    retries++;
    return new Promise(resolve => {
      setTimeout(() => resolve(checkRedisStatus()), 1000);
    });
  };

  return checkRedisStatus();
}

export { redis, waitForRedis };
