// Mock Logger to avoid import issues
jest.mock('../../src/utils/Logger.js', () => ({
  createModuleLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }))
}));

// Mock ioredis to prevent real connections
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockRejectedValue(new Error('Redis connection failed in test')),
    quit: jest.fn().mockResolvedValue(),
    on: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    exists: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    dbsize: jest.fn()
  }));
});

import Config from '../../src/config/Config.js';
import { RedisCache } from '../../src/utils/RedisCache.js';

// Mock Config
jest.mock('../../src/config/Config.js');

describe('RedisCache', () => {
  let cache;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      cache: {
        redis: {
          host: 'localhost',
          port: 6379,
          db: 0,
          keyPrefix: 'test_prefix_'
        }
      }
    };
    Config.getInstance.mockReturnValue(mockConfig);

    cache = new RedisCache();
  });

  afterEach(async () => {
    // Ensure any connections are properly closed to prevent Jest handles
    if (cache && cache.client) {
      try {
        await cache.disconnect();
      } catch {
        // Ignore errors during cleanup
      }
    }
  });

  describe('Initialization', () => {
    it('should create RedisCache instance', () => {
      expect(cache).toBeDefined();
      expect(cache.isConnected).toBe(false);
    });

    it('should have required methods', () => {
      expect(typeof cache.connect).toBe('function');
      expect(typeof cache.set).toBe('function');
      expect(typeof cache.get).toBe('function');
      expect(typeof cache.has).toBe('function');
      expect(typeof cache.delete).toBe('function');
      expect(typeof cache.clear).toBe('function');
      expect(typeof cache.size).toBe('function');
      expect(typeof cache.getStats).toBe('function');
    });
  });

  describe('Connection Management', () => {
    it('should handle connection attempts', async () => {
      // Since we're mocking ioredis to reject connections, this should throw
      await expect(cache.connect()).rejects.toThrow('Redis connection failed in test');
      expect(cache.isConnected).toBe(false);
    });

    it('should handle disconnect', async () => {
      // Test disconnect method
      await cache.disconnect();
      expect(cache.isConnected).toBe(false);
    });
  });

  describe('Cache Operations (Mocked)', () => {
    beforeEach(() => {
      // Mock Redis operations for testing
      cache.client = {
        set: jest.fn().mockResolvedValue('OK'),
        get: jest.fn().mockResolvedValue('value'),
        exists: jest.fn().mockResolvedValue(1),
        del: jest.fn().mockResolvedValue(1),
        keys: jest.fn().mockResolvedValue(['test_prefix_key1', 'test_prefix_key2']),
        setex: jest.fn().mockResolvedValue('OK')
      };
      cache.isConnected = true;
    });

    it('should set values', async () => {
      await cache.set('key1', 'value1');
      // RedisCache uses setex with default TTL, not set
      expect(cache.client.setex).toHaveBeenCalledWith('key1', 300, expect.stringContaining('"value":"value1"'));
    });

    it('should set values with TTL', async () => {
      await cache.set('key1', 'value1', 3600000); // 1 hour in ms
      expect(cache.client.setex).toHaveBeenCalledWith('key1', 3600, expect.stringContaining('"value":"value1"'));
    });

    it('should get values', async () => {
      const mockData = JSON.stringify({ value: 'value1', timestamp: Date.now() });
      cache.client.get.mockResolvedValue(mockData);
      const result = await cache.get('key1');
      expect(result).toBe('value1');
      expect(cache.client.get).toHaveBeenCalledWith('key1');
    });

    it('should check if key exists', async () => {
      const exists = await cache.has('key1');
      expect(exists).toBe(true);
      expect(cache.client.exists).toHaveBeenCalledWith('key1');
    });

    it('should delete keys', async () => {
      await cache.delete('key1');
      expect(cache.client.del).toHaveBeenCalledWith('key1');
    });

    it('should clear cache', async () => {
      await cache.clear();
      expect(cache.client.keys).toHaveBeenCalledWith('test_prefix_*');
      expect(cache.client.del).toHaveBeenCalledWith('key1', 'key2');
    });

    it('should return cache size', async () => {
      const size = await cache.size();
      expect(size).toBe(2);
      expect(cache.client.keys).toHaveBeenCalledWith('test_prefix_*');
    });
  });

  describe('Error Handling', () => {
    it('should handle operations when not connected', async () => {
      cache.isConnected = false;

      await expect(cache.set('key', 'value')).rejects.toThrow('Redis client not connected');
      await expect(cache.get('key')).rejects.toThrow('Redis client not connected');
      expect(await cache.has('key')).toBe(false); // has returns false, doesn't throw
      expect(await cache.delete('key')).toBe(false); // delete returns false, doesn't throw
      await expect(cache.clear()).rejects.toThrow('Redis client not connected');
      expect(await cache.size()).toBe(0); // size returns 0, doesn't throw
    });
  });
});

// Global cleanup to ensure no Jest handles remain open
afterAll(async () => {
  // Force cleanup of any remaining Redis connections
  await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure cleanup
});
