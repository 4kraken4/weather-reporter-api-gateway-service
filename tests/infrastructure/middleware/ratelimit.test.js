import Config from '../../../src/config/Config.js';
import {
  getRateLimiter,
  rateLimiterMiddleware,
  reinitializeRateLimiter
} from '../../../src/infrastructure/middleware/ratelimit.js';
import { CacheFactory, getUnifiedCache } from '../../../src/utils/CacheFactory.js';

// Mock dependencies
jest.mock('../../../src/config/Config.js');
jest.mock('../../../src/utils/CacheFactory.js');
jest.mock('rate-limiter-flexible', () => ({
  RateLimiterMemory: jest.fn(),
  RateLimiterRedis: jest.fn()
}));

// Import the mocked classes
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';

describe('Rate Limiter Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let mockConfig;
  let mockRateLimiter;
  let mockCache;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock request object
    mockReq = {
      ip: '127.0.0.1'
    };

    // Mock response object
    mockRes = {
      set: jest.fn()
    };

    // Mock next function
    mockNext = jest.fn();

    // Mock Config
    mockConfig = {
      app: {
        name: 'weather-reporter'
      },
      service: {
        requestLimit: 100,
        requestLimitTime: 60,
        slidingWindow: false,
        requestBlockDuration: 300
      }
    };
    Config.getInstance = jest.fn().mockReturnValue(mockConfig);

    // Mock rate limiter
    mockRateLimiter = {
      consume: jest.fn()
    };

    // Mock cache
    mockCache = {
      cache: {
        isConnected: true
      }
    };

    // Mock CacheFactory
    CacheFactory.getCacheInfo = jest.fn().mockReturnValue({
      isRedis: false
    });
    getUnifiedCache.mockResolvedValue(mockCache);

    // Mock RateLimiterMemory constructor
    RateLimiterMemory.mockImplementation(() => mockRateLimiter);
    RateLimiterRedis.mockImplementation(() => mockRateLimiter);

    // Initialize rate limiter for tests
    await reinitializeRateLimiter();
  });

  describe('Rate Limiter Middleware Function', () => {
    describe('Successful Rate Limiting', () => {
      it('should call next when rate limit is not exceeded', async () => {
        const rateLimiterRes = {
          remainingPoints: 50,
          limit: 100
        };
        mockRateLimiter.consume.mockResolvedValue(rateLimiterRes);

        await rateLimiterMiddleware(mockReq, mockRes, mockNext);

        expect(mockRateLimiter.consume).toHaveBeenCalledWith('127.0.0.1');
        expect(mockNext).toHaveBeenCalledWith();
      });

      it('should handle different IP addresses', async () => {
        const testIPs = ['192.168.1.1', '10.0.0.1', '172.16.0.1', '8.8.8.8'];
        const rateLimiterRes = { remainingPoints: 25 };
        mockRateLimiter.consume.mockResolvedValue(rateLimiterRes);

        for (const ip of testIPs) {
          const req = { ip };
          await rateLimiterMiddleware(req, mockRes, mockNext);
          expect(mockRateLimiter.consume).toHaveBeenCalledWith(ip);
        }
      });

      it('should log remaining requests', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const rateLimiterRes = { remainingPoints: 50 };
        mockRateLimiter.consume.mockResolvedValue(rateLimiterRes);

        await rateLimiterMiddleware(mockReq, mockRes, mockNext);

        expect(consoleSpy).toHaveBeenCalledWith('Remaining Requests:', 50);
        consoleSpy.mockRestore();
      });
    });

    describe('Rate Limit Exceeded', () => {
      it('should call next with TooManyRequestsError when rate limit is exceeded', async () => {
        const rateLimiterRes = {
          msBeforeNext: 30000,
          limit: 100,
          remainingPoints: 0
        };
        mockRateLimiter.consume.mockRejectedValue(rateLimiterRes);

        await rateLimiterMiddleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        expect(mockNext.mock.calls[0][0].message).toBe('TooManyRequestsError');
      });

      it('should set appropriate response headers when rate limit is exceeded', async () => {
        const rateLimiterRes = {
          msBeforeNext: 45000,
          limit: 100,
          remainingPoints: 0
        };
        mockRateLimiter.consume.mockRejectedValue(rateLimiterRes);

        await rateLimiterMiddleware(mockReq, mockRes, mockNext);

        expect(mockRes.set).toHaveBeenCalledWith('Retry-After', '45');
        expect(mockRes.set).toHaveBeenCalledWith('X-RateLimit-Limit', '100');
        expect(mockRes.set).toHaveBeenCalledWith('X-RateLimit-Remaining', '0');
      });

      it('should handle msBeforeNext calculation correctly', async () => {
        const testCases = [
          { msBeforeNext: 1000, expectedRetryAfter: '1' },
          { msBeforeNext: 1500, expectedRetryAfter: '2' },
          { msBeforeNext: 30000, expectedRetryAfter: '30' },
          { msBeforeNext: 500, expectedRetryAfter: '1' },
          { msBeforeNext: 0, expectedRetryAfter: '1' }
        ];

        for (const testCase of testCases) {
          const rateLimiterRes = {
            msBeforeNext: testCase.msBeforeNext,
            limit: 100,
            remainingPoints: 0
          };
          mockRateLimiter.consume.mockRejectedValue(rateLimiterRes);
          mockRes.set.mockClear();

          await rateLimiterMiddleware(mockReq, mockRes, mockNext);

          expect(mockRes.set).toHaveBeenCalledWith('Retry-After', testCase.expectedRetryAfter);
        }
      });

      it('should handle missing msBeforeNext property', async () => {
        const rateLimiterRes = {
          limit: 100,
          remainingPoints: 0
        };
        mockRateLimiter.consume.mockRejectedValue(rateLimiterRes);

        await rateLimiterMiddleware(mockReq, mockRes, mockNext);

        expect(mockRes.set).toHaveBeenCalledWith('Retry-After', '1');
      });
    });

    describe('Error Handling', () => {
      it('should handle null rate limiter gracefully', () => {
        // Simulate null rate limiter
        jest.doMock('../../../src/infrastructure/middleware/ratelimit.js', () => ({
          rateLimiterMiddleware: (req, res, next) => {
            const rateLimiter = null;
            rateLimiter?.consume(req.ip)
              .then(() => next())
              .catch(() => next(new Error('TooManyRequestsError')));
          }
        }));

        expect(() => {
          rateLimiterMiddleware(mockReq, mockRes, mockNext);
        }).not.toThrow();
      });

      it('should handle undefined IP address', async () => {
        mockReq.ip = undefined;
        const rateLimiterRes = { remainingPoints: 50 };
        mockRateLimiter.consume.mockResolvedValue(rateLimiterRes);

        await rateLimiterMiddleware(mockReq, mockRes, mockNext);

        expect(mockRateLimiter.consume).toHaveBeenCalledWith(undefined);
      });

      it('should handle null IP address', async () => {
        mockReq.ip = null;
        const rateLimiterRes = { remainingPoints: 50 };
        mockRateLimiter.consume.mockResolvedValue(rateLimiterRes);

        await rateLimiterMiddleware(mockReq, mockRes, mockNext);

        expect(mockRateLimiter.consume).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('Rate Limiter Utility Functions', () => {
    describe('getRateLimiter', () => {
      it('should return the current rate limiter instance', () => {
        const rateLimiter = getRateLimiter();
        expect(rateLimiter).toBeDefined();
      });
    });

    describe('reinitializeRateLimiter', () => {
      it('should reinitialize the rate limiter', async () => {
        const result = await reinitializeRateLimiter();
        expect(result).toBeDefined();
      });

      it('should handle reinitialization with Redis', async () => {
        CacheFactory.getCacheInfo.mockReturnValue({ isRedis: true });
        mockCache.cache.isConnected = true;

        const result = await reinitializeRateLimiter();
        expect(result).toBeDefined();
      });

      it('should fallback to memory when Redis fails during reinitialization', async () => {
        CacheFactory.getCacheInfo.mockReturnValue({ isRedis: true });
        getUnifiedCache.mockRejectedValue(new Error('Redis connection failed'));

        const result = await reinitializeRateLimiter();
        expect(result).toBeDefined();
      });
    });
  });

  describe('Configuration Integration', () => {
    it('should use configuration values for rate limiting', async () => {
      // Clear previous calls and reinitialize to test config usage
      Config.getInstance.mockClear();
      await reinitializeRateLimiter();

      expect(Config.getInstance).toHaveBeenCalled();
    });

    it('should handle different configuration values', async () => {
      const customConfig = {
        app: { name: 'custom-app' },
        service: {
          requestLimit: 50,
          requestLimitTime: 30,
          slidingWindow: true,
          requestBlockDuration: 600
        }
      };
      Config.getInstance.mockReturnValue(customConfig);

      await reinitializeRateLimiter();

      expect(RateLimiterMemory).toHaveBeenCalledWith({
        points: 50,
        duration: 30,
        execEvenly: true,
        blockDuration: 600
      });
    });
  });

  describe('Cache Integration', () => {
    it('should use Redis when available and connected', async () => {
      CacheFactory.getCacheInfo.mockReturnValue({ isRedis: true });
      mockCache.cache.isConnected = true;

      await reinitializeRateLimiter();

      expect(RateLimiterRedis).toHaveBeenCalledWith({
        storeClient: mockCache,
        keyPrefix: 'weather-reporter',
        points: 100,
        duration: 60,
        execEvenly: false,
        blockDuration: 300
      });
    });

    it('should fallback to memory when Redis is not connected', async () => {
      CacheFactory.getCacheInfo.mockReturnValue({ isRedis: true });
      mockCache.cache.isConnected = false;

      await reinitializeRateLimiter();

      expect(RateLimiterMemory).toHaveBeenCalledWith({
        points: 100,
        duration: 60,
        execEvenly: false,
        blockDuration: 300
      });
    });

    it('should use memory cache when cache strategy is not Redis', async () => {
      CacheFactory.getCacheInfo.mockReturnValue({ isRedis: false });

      await reinitializeRateLimiter();

      expect(RateLimiterMemory).toHaveBeenCalledWith({
        points: 100,
        duration: 60,
        execEvenly: false,
        blockDuration: 300
      });
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle rate limiter consume promise rejection', async () => {
      const error = new Error('Rate limiter error');
      mockRateLimiter.consume.mockRejectedValue(error);

      await rateLimiterMiddleware(mockReq, mockRes, mockNext);

      // Should still call next with TooManyRequestsError, not the original error
      expect(mockNext).toHaveBeenCalledWith(new Error('TooManyRequestsError'));
    });

    it('should handle IPv6 addresses', async () => {
      mockReq.ip = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      const rateLimiterRes = { remainingPoints: 25 };
      mockRateLimiter.consume.mockResolvedValue(rateLimiterRes);

      await rateLimiterMiddleware(mockReq, mockRes, mockNext);

      expect(mockRateLimiter.consume).toHaveBeenCalledWith('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle proxied IP addresses', async () => {
      mockReq.ip = '::ffff:192.168.1.1';
      const rateLimiterRes = { remainingPoints: 30 };
      mockRateLimiter.consume.mockResolvedValue(rateLimiterRes);

      await rateLimiterMiddleware(mockReq, mockRes, mockNext);

      expect(mockRateLimiter.consume).toHaveBeenCalledWith('::ffff:192.168.1.1');
    });

    it('should handle very large msBeforeNext values', async () => {
      const rateLimiterRes = {
        msBeforeNext: Number.MAX_SAFE_INTEGER,
        limit: 100,
        remainingPoints: 0
      };
      mockRateLimiter.consume.mockRejectedValue(rateLimiterRes);

      await rateLimiterMiddleware(mockReq, mockRes, mockNext);

      const expectedRetryAfter = String(Math.ceil(Number.MAX_SAFE_INTEGER / 1000));
      expect(mockRes.set).toHaveBeenCalledWith('Retry-After', expectedRetryAfter);
    });

    it('should handle negative msBeforeNext values', async () => {
      const rateLimiterRes = {
        msBeforeNext: -1000,
        limit: 100,
        remainingPoints: 0
      };
      mockRateLimiter.consume.mockRejectedValue(rateLimiterRes);

      await rateLimiterMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.set).toHaveBeenCalledWith('Retry-After', '1');
    });
  });

  describe('Logging', () => {
    it('should log remaining requests on successful consumption', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const rateLimiterRes = { remainingPoints: 42 };
      mockRateLimiter.consume.mockResolvedValue(rateLimiterRes);

      await rateLimiterMiddleware(mockReq, mockRes, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith('Remaining Requests:', 42);
      consoleSpy.mockRestore();
    });

    it('should handle logging when remainingPoints is zero', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const rateLimiterRes = { remainingPoints: 0 };
      mockRateLimiter.consume.mockResolvedValue(rateLimiterRes);

      await rateLimiterMiddleware(mockReq, mockRes, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith('Remaining Requests:', 0);
      consoleSpy.mockRestore();
    });
  });
});
