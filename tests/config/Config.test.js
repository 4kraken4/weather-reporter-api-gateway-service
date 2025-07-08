import { jest } from '@jest/globals';

describe('Config - Simple Tests', () => {
  let Config;
  let originalEnv;

  beforeAll(async () => {
    // Save original environment
    originalEnv = process.env;

    // Mock dotenv to avoid file system operations
    jest.doMock('dotenv', () => ({
      config: jest.fn()
    }));

    // Import Config after mocking
    const ConfigModule = await import('../../src/config/Config.js');
    Config = ConfigModule.default;
  });

  beforeEach(() => {
    // Reset Config instance
    if (Config.instance) {
      Config.instance = null;
    }

    // Reset environment
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Singleton Pattern', () => {
    it('should create an instance', () => {
      const config = new Config();
      expect(config).toBeInstanceOf(Config);
    });

    it('should return the same instance when called multiple times', () => {
      const instance1 = Config.getInstance();
      const instance2 = Config.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Configuration Methods', () => {
    let config;

    beforeEach(() => {
      config = Config.getInstance();
    });

    it('should return app configuration', () => {
      const appConfig = config.app;
      expect(appConfig).toHaveProperty('name');
      expect(appConfig).toHaveProperty('swaggerUrl');
      expect(appConfig).toHaveProperty('healthUrl');
    });

    it('should return service configuration', () => {
      const serviceConfig = config.service;
      expect(serviceConfig).toHaveProperty('protocol');
      expect(serviceConfig).toHaveProperty('host');
      expect(serviceConfig).toHaveProperty('port');
      expect(serviceConfig).toHaveProperty('version');
    });

    it('should return client configuration', () => {
      const clientConfig = config.client;
      expect(clientConfig).toHaveProperty('port');
      expect(clientConfig).toHaveProperty('host');
      expect(clientConfig).toHaveProperty('protocol');
    });

    it('should return services configuration', () => {
      const servicesConfig = config.services;
      expect(servicesConfig).toHaveProperty('weather');
    });

    it('should return cache configuration', () => {
      const cacheConfig = config.cache;
      expect(cacheConfig).toHaveProperty('strategy');
      expect(cacheConfig).toHaveProperty('defaultTtl');
      expect(cacheConfig).toHaveProperty('redis');
    });

    it('should return logging configuration', () => {
      const loggingConfig = config.logging;
      expect(loggingConfig).toHaveProperty('level');
      expect(loggingConfig).toHaveProperty('enabledInProduction');
      expect(loggingConfig).toHaveProperty('format');
    });
  });
});
