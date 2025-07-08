import corsMiddleware from '../../../src/infrastructure/middleware/cors.js';
import URL_WHITELIST from '../../../src/interfaces/http/whitelist.js';

// Mock the whitelist
jest.mock('../../../src/interfaces/http/whitelist.js', () => [
  'https://weather-reporter-pi.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
]);

describe('CORS Middleware', () => {
  let mockCallback;

  beforeEach(() => {
    mockCallback = jest.fn();
  });

  describe('Origin Validation', () => {
    it('should allow requests with no origin (same-origin requests)', () => {
      // Extract the origin function from corsMiddleware
      const corsOptions = corsMiddleware.configuration;

      corsOptions.origin(undefined, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, true);
    });

    it('should allow requests with null origin', () => {
      const corsOptions = corsMiddleware.configuration;

      corsOptions.origin(null, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, true);
    });

    it('should allow whitelisted origins', () => {
      const corsOptions = corsMiddleware.configuration;

      corsOptions.origin('https://weather-reporter-pi.vercel.app', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, true);
    });

    it('should allow localhost development origins', () => {
      const corsOptions = corsMiddleware.configuration;

      corsOptions.origin('http://localhost:5173', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, true);
    });

    it('should allow additional whitelisted origins', () => {
      const corsOptions = corsMiddleware.configuration;

      corsOptions.origin('http://localhost:3000', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, true);
    });

    it('should deny non-whitelisted origins', () => {
      const corsOptions = corsMiddleware.configuration;

      corsOptions.origin('https://malicious-site.com', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(new Error('CORSDeniedError'));
    });

    it('should deny random localhost ports', () => {
      const corsOptions = corsMiddleware.configuration;

      corsOptions.origin('http://localhost:8080', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(new Error('CORSDeniedError'));
    });

    it('should deny HTTPS localhost requests not in whitelist', () => {
      const corsOptions = corsMiddleware.configuration;

      corsOptions.origin('https://localhost:3000', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(new Error('CORSDeniedError'));
    });
  });

  describe('CORS Options Configuration', () => {
    it('should have correct optionsSuccessStatus', () => {
      const corsOptions = corsMiddleware.configuration;

      expect(corsOptions.optionsSuccessStatus).toBe(200);
    });

    it('should allow correct HTTP methods', () => {
      const corsOptions = corsMiddleware.configuration;

      expect(corsOptions.methods).toEqual(['GET', 'PUT', 'POST', 'DELETE', 'PATCH']);
    });

    it('should include required headers in allowedHeaders', () => {
      const corsOptions = corsMiddleware.configuration;

      expect(corsOptions.allowedHeaders).toContain('Content-Type');
      expect(corsOptions.allowedHeaders).toContain('Authorization');
      expect(corsOptions.allowedHeaders).toContain('x-request-id');
      expect(corsOptions.allowedHeaders).toContain('x-request-timestamp');
    });

    it('should have correct AccessControlAllowHeaders', () => {
      const corsOptions = corsMiddleware.configuration;

      expect(corsOptions.AccessControlAllowHeaders).toEqual([
        'x-request-timestamp',
        'x-request-id'
      ]);
    });

    it('should enable credentials', () => {
      const corsOptions = corsMiddleware.configuration;

      expect(corsOptions.credentials).toBe(true);
    });

    it('should have correct maxAge', () => {
      const corsOptions = corsMiddleware.configuration;

      expect(corsOptions.maxAge).toBe(3600);
    });

    it('should not continue preflight', () => {
      const corsOptions = corsMiddleware.configuration;

      expect(corsOptions.preflightContinue).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string origin', () => {
      const corsOptions = corsMiddleware.configuration;

      corsOptions.origin('', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, true);
    });

    it('should handle origins with trailing slash', () => {
      const corsOptions = corsMiddleware.configuration;

      corsOptions.origin('https://weather-reporter-pi.vercel.app/', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(new Error('CORSDeniedError'));
    });

    it('should handle origins with query parameters', () => {
      const corsOptions = corsMiddleware.configuration;

      corsOptions.origin('https://weather-reporter-pi.vercel.app?param=value', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(new Error('CORSDeniedError'));
    });

    it('should handle case-sensitive origin matching', () => {
      const corsOptions = corsMiddleware.configuration;

      corsOptions.origin('HTTPS://weather-reporter-pi.vercel.app', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(new Error('CORSDeniedError'));
    });

    it('should handle subdomain attempts', () => {
      const corsOptions = corsMiddleware.configuration;

      corsOptions.origin('https://sub.weather-reporter-pi.vercel.app', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(new Error('CORSDeniedError'));
    });
  });

  describe('Security Tests', () => {
    it('should deny origins with different protocols', () => {
      const corsOptions = corsMiddleware.configuration;

      corsOptions.origin('ftp://weather-reporter-pi.vercel.app', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(new Error('CORSDeniedError'));
    });

    it('should deny origins with different ports', () => {
      const corsOptions = corsMiddleware.configuration;

      corsOptions.origin('https://weather-reporter-pi.vercel.app:8080', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(new Error('CORSDeniedError'));
    });

    it('should deny malicious domain attempts', () => {
      const corsOptions = corsMiddleware.configuration;

      const maliciousDomains = [
        'https://evil.com',
        'http://malware-site.net',
        'https://phishing-attempt.org',
        'javascript:alert(1)'
      ];

      maliciousDomains.forEach(domain => {
        corsOptions.origin(domain, mockCallback);
        expect(mockCallback).toHaveBeenCalledWith(new Error('CORSDeniedError'));
        mockCallback.mockClear();
      });
    });
  });

  describe('Whitelist Integration', () => {
    it('should use imported whitelist for validation', () => {
      expect(Array.isArray(URL_WHITELIST)).toBe(true);
      expect(URL_WHITELIST.length).toBeGreaterThan(0);
    });

    it('should include expected production domains', () => {
      expect(URL_WHITELIST).toContain('https://weather-reporter-pi.vercel.app');
    });

    it('should include development domains', () => {
      expect(URL_WHITELIST).toContain('http://localhost:5173');
    });
  });
});
