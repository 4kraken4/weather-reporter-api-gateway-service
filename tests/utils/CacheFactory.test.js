import Config from '../../src/config/Config.js';
import { CacheFactory, UnifiedCache, getCache, getUnifiedCache } from '../../src/utils/CacheFactory.js';
import Logger from '../../src/utils/Logger.js';
import { MemoryCache, globalWeatherCache } from '../../src/utils/MemoryCache.js';
import { RedisCache, globalRedisCache } from '../../src/utils/RedisCache.js';

// Mock dependencies
jest.mock('../../src/config/Config.js');
jest.mock('../../src/utils/Logger.js');
jest.mock('../../src/utils/MemoryCache.js');
jest.mock('../../src/utils/RedisCache.js');

describe('CacheFactory', () => {
  let mockConfig;
  let mockMemoryCache;
  let mockRedisCache;
  let mockLogger;

  beforeEach(() => {
    // Reset factory state
    CacheFactory.reset();

    // Mock Config
    mockConfig = {
      cache: {
        strategy: 'memory',
        defaultTtl: 300000
      }
    };
    Config.getInstance = jest.fn().mockReturnValue(mockConfig);

    // Mock Logger
    mockLogger = {
      warn: jest.fn()
    };
    Logger.module = jest.fn().mockReturnValue(mockLogger);

    // Mock MemoryCache
    mockMemoryCache = {
      isConnected: true,
      set: jest.fn().mockResolvedValue(true),
      get: jest.fn().mockResolvedValue('test-value'),
      has: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(true),
      clear: jest.fn().mockResolvedValue(true),
      size: jest.fn().mockResolvedValue(5),
      getStats: jest.fn().mockResolvedValue({ hits: 10, misses: 2 })
    };
    globalWeatherCache.isConnected = true;
    Object.assign(globalWeatherCache, mockMemoryCache);

    // Mock RedisCache
    mockRedisCache = {
      isConnected: false,
      connect: jest.fn().mockResolvedValue(true),
      set: jest.fn().mockResolvedValue(true),
      get: jest.fn().mockResolvedValue('redis-value'),
      has: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(true),
      clear: jest.fn().mockResolvedValue(true),
      size: jest.fn().mockResolvedValue(10),
      getStats: jest.fn().mockResolvedValue({ hits: 20, misses: 3 }),
      _isRedisCache: true // Add flag for mock detection
    };
    globalRedisCache.isConnected = false;
    Object.assign(globalRedisCache, mockRedisCache);
    globalRedisCache._isRedisCache = true; // Ensure flag is set for global instance

    MemoryCache.mockImplementation(() => mockMemoryCache);
    RedisCache.mockImplementation(() => {
      // Create a proper instance that passes instanceof check
      const instance = Object.create(RedisCache.prototype);
      Object.assign(instance, mockRedisCache);
      instance._isRedisCache = true; // Ensure flag is set
      return instance;
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    CacheFactory.reset();
  });

  describe('getInstance', () => {
    it('should return memory cache when strategy is memory', async () => {
      mockConfig.cache.strategy = 'memory';

      const cache = await CacheFactory.getInstance();

      expect(cache).toBe(globalWeatherCache);
      expect(Config.getInstance).toHaveBeenCalled();
    });

    it('should return Redis cache when strategy is redis and connected', async () => {
      mockConfig.cache.strategy = 'redis';
      globalRedisCache.isConnected = true;

      const cache = await CacheFactory.getInstance();

      expect(cache).toBe(globalRedisCache);
      expect(globalRedisCache.connect).not.toHaveBeenCalled();
    });

    it('should connect to Redis cache when strategy is redis and not connected', async () => {
      mockConfig.cache.strategy = 'redis';
      globalRedisCache.isConnected = false;
      globalRedisCache.connect.mockResolvedValue(true);

      const cache = await CacheFactory.getInstance();

      expect(cache).toBe(globalRedisCache);
      expect(globalRedisCache.connect).toHaveBeenCalled();
    });

    it('should fallback to memory cache when Redis connection fails', async () => {
      mockConfig.cache.strategy = 'redis';
      globalRedisCache.isConnected = false;
      globalRedisCache.connect.mockRejectedValue(new Error('Redis connection failed'));

      const cache = await CacheFactory.getInstance();

      expect(cache).toBe(globalWeatherCache);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to connect to Redis, falling back to memory cache:',
        expect.any(Error)
      );
    });

    it('should return cached instance on subsequent calls', async () => {
      mockConfig.cache.strategy = 'memory';

      const cache1 = await CacheFactory.getInstance();
      const cache2 = await CacheFactory.getInstance();

      expect(cache1).toBe(cache2);
      expect(Config.getInstance).toHaveBeenCalledTimes(1);
    });

    it('should handle unknown strategy gracefully', async () => {
      mockConfig.cache.strategy = 'unknown';

      const cache = await CacheFactory.getInstance();

      expect(cache).toBe(globalWeatherCache);
    });
  });

  describe('createInstance', () => {
    it('should create new Redis instance when strategy is redis', () => {
      const cache = CacheFactory.createInstance('redis');

      expect(RedisCache).toHaveBeenCalled();
      expect(cache).toBeInstanceOf(RedisCache);
    });

    it('should create new Memory instance when strategy is memory', () => {
      const cache = CacheFactory.createInstance('memory');

      expect(MemoryCache).toHaveBeenCalled();
      expect(cache).toEqual(mockMemoryCache);
    });

    it('should use config strategy when no strategy provided', () => {
      mockConfig.cache.strategy = 'redis';

      CacheFactory.createInstance();

      expect(RedisCache).toHaveBeenCalled();
      expect(Config.getInstance).toHaveBeenCalled();
    });

    it('should default to memory cache when strategy is undefined', () => {
      CacheFactory.createInstance(undefined);

      expect(MemoryCache).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset singleton instances', async () => {
      // Get instance first
      await CacheFactory.getInstance();
      expect(CacheFactory._cache).toBeTruthy();

      // Reset
      CacheFactory.reset();
      expect(CacheFactory._cache).toBeNull();
      expect(CacheFactory._instance).toBeNull();
    });
  });

  describe('getCacheInfo', () => {
    it('should return cache configuration info for memory strategy', () => {
      mockConfig.cache.strategy = 'memory';
      mockConfig.cache.defaultTtl = 600000;

      const info = CacheFactory.getCacheInfo();

      expect(info).toEqual({
        strategy: 'memory',
        defaultTtl: 600000,
        isRedis: false,
        isMemory: true
      });
    });

    it('should return cache configuration info for redis strategy', () => {
      mockConfig.cache.strategy = 'redis';
      mockConfig.cache.defaultTtl = 300000;

      const info = CacheFactory.getCacheInfo();

      expect(info).toEqual({
        strategy: 'redis',
        defaultTtl: 300000,
        isRedis: true,
        isMemory: false
      });
    });
  });

  describe('getCache convenience function', () => {
    it('should return the same result as getInstance', async () => {
      const cache1 = await CacheFactory.getInstance();
      const cache2 = await getCache();

      expect(cache1).toBe(cache2);
    });
  });
});

describe('UnifiedCache', () => {
  let mockMemoryCache;
  let mockRedisCache;

  beforeEach(() => {
    mockMemoryCache = {
      set: jest.fn().mockResolvedValue(true),
      get: jest.fn().mockResolvedValue('memory-value'),
      has: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(true),
      clear: jest.fn().mockResolvedValue(true),
      size: jest.fn().mockResolvedValue(5),
      getStats: jest.fn().mockResolvedValue({ hits: 10, misses: 2 })
    };

    mockRedisCache = {
      set: jest.fn().mockResolvedValue(true),
      get: jest.fn().mockResolvedValue('redis-value'),
      has: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(true),
      clear: jest.fn().mockResolvedValue(true),
      size: jest.fn().mockResolvedValue(10),
      getStats: jest.fn().mockResolvedValue({ hits: 20, misses: 3 })
    };

    MemoryCache.mockImplementation(() => mockMemoryCache);
    RedisCache.mockImplementation(() => mockRedisCache);

    jest.clearAllMocks();
  });

  describe('with Memory Cache', () => {
    let unifiedCache;

    beforeEach(() => {
      unifiedCache = new UnifiedCache(new MemoryCache());
    });

    it('should identify memory cache correctly', () => {
      expect(unifiedCache.isRedis).toBe(false);
    });

    it('should call memory cache set method', async () => {
      await unifiedCache.set('key', 'value', 300000);

      expect(mockMemoryCache.set).toHaveBeenCalledWith('key', 'value', 300000);
    });

    it('should call memory cache get method', async () => {
      const result = await unifiedCache.get('key');

      expect(mockMemoryCache.get).toHaveBeenCalledWith('key');
      expect(result).toBe('memory-value');
    });

    it('should call memory cache has method', async () => {
      const result = await unifiedCache.has('key');

      expect(mockMemoryCache.has).toHaveBeenCalledWith('key');
      expect(result).toBe(true);
    });

    it('should call memory cache delete method', async () => {
      const result = await unifiedCache.delete('key');

      expect(mockMemoryCache.delete).toHaveBeenCalledWith('key');
      expect(result).toBe(true);
    });

    it('should call memory cache clear method', async () => {
      const result = await unifiedCache.clear();

      expect(mockMemoryCache.clear).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should call memory cache size method', async () => {
      const result = await unifiedCache.size();

      expect(mockMemoryCache.size).toHaveBeenCalled();
      expect(result).toBe(5);
    });

    it('should call memory cache getStats method', async () => {
      const result = await unifiedCache.getStats();

      expect(mockMemoryCache.getStats).toHaveBeenCalled();
      expect(result).toEqual({ hits: 10, misses: 2 });
    });
  });

  describe('with Redis Cache', () => {
    let unifiedCache;

    beforeEach(() => {
      // Create a RedisCache instance for proper instanceof check
      const redisInstance = new RedisCache();
      Object.assign(redisInstance, mockRedisCache);
      redisInstance._isRedisCache = true; // Ensure flag is set
      unifiedCache = new UnifiedCache(redisInstance);
    });

    it('should identify Redis cache correctly', () => {
      expect(unifiedCache.isRedis).toBe(true);
    });

    it('should call Redis cache set method', async () => {
      await unifiedCache.set('key', 'value', 300000);

      expect(mockRedisCache.set).toHaveBeenCalledWith('key', 'value', 300000);
    });

    it('should call Redis cache get method', async () => {
      const result = await unifiedCache.get('key');

      expect(mockRedisCache.get).toHaveBeenCalledWith('key');
      expect(result).toBe('redis-value');
    });

    it('should call Redis cache has method', async () => {
      const result = await unifiedCache.has('key');

      expect(mockRedisCache.has).toHaveBeenCalledWith('key');
      expect(result).toBe(true);
    });

    it('should call Redis cache delete method', async () => {
      const result = await unifiedCache.delete('key');

      expect(mockRedisCache.delete).toHaveBeenCalledWith('key');
      expect(result).toBe(true);
    });

    it('should call Redis cache clear method', async () => {
      const result = await unifiedCache.clear();

      expect(mockRedisCache.clear).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should call Redis cache size method', async () => {
      const result = await unifiedCache.size();

      expect(mockRedisCache.size).toHaveBeenCalled();
      expect(result).toBe(10);
    });

    it('should call Redis cache getStats method', async () => {
      const result = await unifiedCache.getStats();

      expect(mockRedisCache.getStats).toHaveBeenCalled();
      expect(result).toEqual({ hits: 20, misses: 3 });
    });
  });
});

describe('getUnifiedCache convenience function', () => {
  let mockConfig;

  beforeEach(() => {
    CacheFactory.reset();

    mockConfig = {
      cache: {
        strategy: 'memory',
        defaultTtl: 300000
      }
    };
    Config.getInstance = jest.fn().mockReturnValue(mockConfig);

    const mockMemoryCache = {
      set: jest.fn(),
      get: jest.fn(),
      has: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      size: jest.fn(),
      getStats: jest.fn()
    };

    globalWeatherCache.isConnected = true;
    Object.assign(globalWeatherCache, mockMemoryCache);

    jest.clearAllMocks();
  });

  it('should return UnifiedCache instance', async () => {
    const unifiedCache = await getUnifiedCache();

    expect(unifiedCache).toBeInstanceOf(UnifiedCache);
    expect(unifiedCache.cache).toBe(globalWeatherCache);
  });

  it('should work with factory getInstance', async () => {
    const factoryCache = await CacheFactory.getInstance();
    const unifiedCache = await getUnifiedCache();

    expect(unifiedCache.cache).toBe(factoryCache);
  });
});
