import UrlUtils from '../../src/utils/UrlUtils.js';

describe('UrlUtils', () => {
  const mockServiceConfig = {
    protocol: 'http',
    host: 'localhost',
    port: 8080,
    routePrefix: 'api/v1',
    name: 'weather'
  };

  let originalEnv;

  beforeAll(() => {
    originalEnv = process.env.NODE_ENV;
  });

  beforeEach(() => {
    // Reset environment for each test
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    // Clean up environment
    delete process.env.NODE_ENV;
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('buildServiceBaseUrl', () => {
    it('should build correct URL for development environment', () => {
      process.env.NODE_ENV = 'development';
      const result = UrlUtils.buildServiceBaseUrl(mockServiceConfig, true);
      expect(result).toBe('http://localhost:8080/api/v1/weather');
    });

    it('should build correct URL for production environment', () => {
      process.env.NODE_ENV = 'production';
      const result = UrlUtils.buildServiceBaseUrl(mockServiceConfig, true);
      expect(result).toBe('http://localhost/api/v1/weather');
    });

    it('should exclude service name when includeName is false', () => {
      process.env.NODE_ENV = 'development';
      const result = UrlUtils.buildServiceBaseUrl(mockServiceConfig, false);
      expect(result).toBe('http://localhost:8080/api/v1');
    });

    it('should handle HTTPS protocol', () => {
      const httpsConfig = { ...mockServiceConfig, protocol: 'https' };
      const result = UrlUtils.buildServiceBaseUrl(httpsConfig, true);
      expect(result).toBe('https://localhost:8080/api/v1/weather');
    });

    it('should throw error for missing service config', () => {
      expect(() => UrlUtils.buildServiceBaseUrl(null)).toThrow('Service configuration is required');
    });

    it('should handle custom ports in different environments', () => {
      const customConfig = { ...mockServiceConfig, port: 9000 };

      process.env.NODE_ENV = 'development';
      let result = UrlUtils.buildServiceBaseUrl(customConfig, true);
      expect(result).toBe('http://localhost:9000/api/v1/weather');

      process.env.NODE_ENV = 'production';
      result = UrlUtils.buildServiceBaseUrl(customConfig, true);
      expect(result).toBe('http://localhost/api/v1/weather');
    });
  });

  describe('buildEndpointUrl', () => {
    const baseUrl = 'http://localhost:8080/api/v1/weather';

    it('should build endpoint URL without parameters', () => {
      const result = UrlUtils.buildEndpointUrl(baseUrl, '/search');
      expect(result).toBe('http://localhost:8080/api/v1/weather/search');
    });

    it('should build endpoint URL with query parameters', () => {
      const params = { q: 'London', page: 1, pageSize: 10 };
      const result = UrlUtils.buildEndpointUrl(baseUrl, '/search', params);
      expect(result).toBe('http://localhost:8080/api/v1/weather/search?q=London&page=1&pageSize=10');
    });

    it('should handle endpoint starting with slash', () => {
      const result = UrlUtils.buildEndpointUrl(baseUrl, '/current/123');
      expect(result).toBe('http://localhost:8080/api/v1/weather/current/123');
    });

    it('should handle endpoint not starting with slash', () => {
      const result = UrlUtils.buildEndpointUrl(baseUrl, 'current/123');
      expect(result).toBe('http://localhost:8080/api/v1/weather/current/123');
    });

    it('should handle empty endpoint', () => {
      expect(() => {
        UrlUtils.buildEndpointUrl(baseUrl, '');
      }).toThrow('Base URL and endpoint are required');
    });

    it('should handle null parameters', () => {
      const result = UrlUtils.buildEndpointUrl(baseUrl, '/search', null);
      expect(result).toBe('http://localhost:8080/api/v1/weather/search');
    });
  });
});
