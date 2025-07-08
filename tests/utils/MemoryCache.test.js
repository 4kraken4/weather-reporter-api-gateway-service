import { MemoryCache, globalWeatherCache } from '../../src/utils/MemoryCache.js';

describe('MemoryCache', () => {
  let cache;

  beforeEach(() => {
    cache = new MemoryCache();
  });

  afterEach(() => {
    cache.clear();
  });

  describe('Basic Operations', () => {
    it('should set and get values', async () => {
      await cache.set('key1', 'value1');
      const result = await cache.get('key1');
      expect(result).toBe('value1');
    });

    it('should return null for non-existent keys', async () => {
      const result = await cache.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should check if key exists', async () => {
      await cache.set('key1', 'value1');
      expect(await cache.has('key1')).toBe(true);
      expect(await cache.has('nonexistent')).toBe(false);
    });

    it('should delete keys', async () => {
      await cache.set('key1', 'value1');
      expect(await cache.has('key1')).toBe(true);

      await cache.delete('key1');
      expect(await cache.has('key1')).toBe(false);
    });

    it('should clear all keys', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');

      await cache.clear();
      expect(await cache.has('key1')).toBe(false);
      expect(await cache.has('key2')).toBe(false);
    });

    it('should return cache size', async () => {
      expect(await cache.size()).toBe(0);

      await cache.set('key1', 'value1');
      expect(await cache.size()).toBe(1);

      await cache.set('key2', 'value2');
      expect(await cache.size()).toBe(2);
    });
  });

  describe('TTL Support', () => {
    it('should expire entries after TTL', async () => {
      await cache.set('key1', 'value1', 100); // 100ms TTL

      expect(await cache.get('key1')).toBe('value1');

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(await cache.get('key1')).toBeNull();
    });

    it('should not expire entries without TTL', async () => {
      await cache.set('key1', 'value1'); // No TTL

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(await cache.get('key1')).toBe('value1');
    });
  });

  describe('Statistics', () => {
    it('should track hits and misses', async () => {
      await cache.set('key1', 'value1');

      // Hit
      await cache.get('key1');
      // Miss
      await cache.get('nonexistent');

      const stats = await cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });
  });

  describe('Global Cache Instance', () => {
    it('should have a global weather cache instance', () => {
      expect(globalWeatherCache).toBeDefined();
      expect(globalWeatherCache).toBeInstanceOf(MemoryCache);
    });
  });
});
