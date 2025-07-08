import helmet from 'helmet';
import Config from '../../../src/config/Config.js';
import configureHelmet from '../../../src/infrastructure/middleware/helmet.js';

// Mock dependencies
jest.mock('../../../src/config/Config.js');
jest.mock('helmet', () => {
  const actualHelmet = jest.requireActual('helmet');
  return {
    __esModule: true,
    default: jest.fn(actualHelmet.default)
  };
});

describe('Helmet Middleware', () => {
  let mockApp;
  let mockConfig;
  let mockHelmetMiddleware;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Express app
    mockApp = {
      use: jest.fn()
    };

    // Mock helmet middleware
    mockHelmetMiddleware = jest.fn();
    helmet.mockReturnValue(mockHelmetMiddleware);

    // Mock Config.getInstance()
    mockConfig = {
      app: {
        swaggerUrl: 'api-docs'
      },
      service: {
        env: 'development'
      }
    };
    Config.getInstance = jest.fn().mockReturnValue(mockConfig);
  });

  describe('Basic Functionality', () => {
    it('should be a function', () => {
      expect(typeof configureHelmet).toBe('function');
    });

    it('should configure helmet middleware on app', () => {
      configureHelmet(mockApp);

      expect(mockApp.use).toHaveBeenCalledTimes(1);
      expect(mockApp.use).toHaveBeenCalledWith(mockHelmetMiddleware);
    });

    it('should call helmet with configuration options', () => {
      configureHelmet(mockApp);

      expect(helmet).toHaveBeenCalledTimes(1);
      expect(helmet).toHaveBeenCalledWith(expect.objectContaining({
        contentSecurityPolicy: expect.any(Object), // CSP is enabled in development with permissive settings
        maxContentLength: 50000000, // 50MB
        dnsPrefetchControl: { allow: false },
        expectCt: false, // Disabled in development
        frameguard: { action: 'deny' },
        hidePoweredBy: true,
        hsts: false, // Disabled in development
        ieNoOpen: true,
        noSniff: true,
        permittedCrossDomainPolicies: { permittedPolicies: 'none' },
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        xssFilter: true
      }));
    });

    it('should get configuration from Config.getInstance()', () => {
      configureHelmet(mockApp);

      expect(Config.getInstance).toHaveBeenCalledTimes(1);
    });
  });

  describe('Content Security Policy Configuration', () => {
    it('should enable CSP with permissive settings in non-production environments', () => {
      mockConfig.service.env = 'development';
      Config.getInstance.mockReturnValue(mockConfig);

      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      expect(helmetConfig.contentSecurityPolicy).toEqual({
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https:', 'wss:', 'ws:'],
          fontSrc: ["'self'", 'https:', 'data:'],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          reportUri: ['/api/v1/security/csp-report']
        }
      });
    });

    it('should enable CSP with permissive settings in test environment', () => {
      mockConfig.service.env = 'test';
      Config.getInstance.mockReturnValue(mockConfig);

      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      expect(helmetConfig.contentSecurityPolicy).toEqual({
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https:', 'wss:', 'ws:'],
          fontSrc: ["'self'", 'https:', 'data:'],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          reportUri: ['/api/v1/security/csp-report']
        }
      });
    });

    it('should enable CSP with strict settings in production environment', () => {
      mockConfig.service.env = 'production';
      Config.getInstance.mockReturnValue(mockConfig);

      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      expect(helmetConfig.contentSecurityPolicy).toEqual({
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'sha256-BeXIQk2DxxoDrgnnoH683KOnlwQvO0HH1fT4VFQTi8g='"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "'sha256-ezdv1bOGcoOD7FKudKN0Y2Mb763O6qVtM8LT2mtanIU='",
            "'sha256-/jDKvbQ8cdux+c5epDIqkjHbXDaIY8RucT1PmAe8FG4='",
            "'sha256-RL3ie0nH+Lzz2YNqQN83mnU0J1ot4QL7b99vMdIX99w='",
            "'sha256-BeXIQk2DxxoDrgnnoH683KOnlwQvO0HH1fT4VFQTi8g='"
          ],
          imgSrc: [
            "'self'",
            'data:',
            'https://openweathermap.org',
            'https://cdn.weatherapi.com',
            'https://www.weatherapi.com'
          ],
          connectSrc: [
            "'self'",
            'https://api.openweathermap.org',
            'https://api.weatherapi.com',
            'wss://localhost:*',
            'ws://localhost:*'
          ],
          fontSrc: [
            "'self'",
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'data:'
          ],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          manifestSrc: ["'self'"],
          workerSrc: ["'self'"],
          upgradeInsecureRequests: [],
          reportUri: ['/api/v1/security/csp-report']
        }
      });
    });

    it('should handle production environment case variations', () => {
      const productionVariants = ['production', 'prod', 'PRODUCTION', 'Production'];

      productionVariants.forEach(envValue => {
        mockConfig.service.env = envValue;
        Config.getInstance.mockReturnValue(mockConfig);
        helmet.mockClear();

        configureHelmet(mockApp);

        const helmetConfig = helmet.mock.calls[0][0];
        if (envValue === 'production') {
          // Only 'production' exactly matches, gets strict CSP
          expect(helmetConfig.contentSecurityPolicy).toEqual(expect.objectContaining({
            directives: expect.objectContaining({
              upgradeInsecureRequests: []
            })
          }));
        } else {
          // Other variants get permissive CSP
          expect(helmetConfig.contentSecurityPolicy).toEqual(expect.objectContaining({
            directives: expect.objectContaining({
              scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
            })
          }));
        }
      });
    });
  });

  describe('CSP Style Source Configuration', () => {
    it('should use unsafe-inline for style sources in production', () => {
      mockConfig.service.env = 'production';
      Config.getInstance.mockReturnValue(mockConfig);

      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      const cspDirectives = helmetConfig.contentSecurityPolicy.directives;

      expect(cspDirectives.styleSrc).toContain("'unsafe-inline'");
      expect(cspDirectives.styleSrc).toContain("'self'");
    });

    it('should include style hashes in production CSP', () => {
      mockConfig.service.env = 'production';
      Config.getInstance.mockReturnValue(mockConfig);

      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      const cspDirectives = helmetConfig.contentSecurityPolicy.directives;

      expect(cspDirectives.styleSrc).toContain("'sha256-ezdv1bOGcoOD7FKudKN0Y2Mb763O6qVtM8LT2mtanIU='");
      expect(cspDirectives.styleSrc).toContain("'sha256-/jDKvbQ8cdux+c5epDIqkjHbXDaIY8RucT1PmAe8FG4='");
    });
  });

  describe('Security Headers Configuration', () => {
    it('should configure DNS prefetch control', () => {
      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      expect(helmetConfig.dnsPrefetchControl).toEqual({ allow: false });
    });

    it('should configure Expect-CT header based on environment', () => {
      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      expect(helmetConfig.expectCt).toBe(false); // Disabled in development
    });

    it('should enable Expect-CT in production', () => {
      mockConfig.service.env = 'production';
      Config.getInstance.mockReturnValue(mockConfig);

      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      expect(helmetConfig.expectCt).toEqual({
        maxAge: 86400,
        enforce: true,
        reportUri: '/api/v1/security/ct-report'
      });
    });

    it('should configure frame guard', () => {
      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      expect(helmetConfig.frameguard).toEqual({ action: 'deny' });
    });

    it('should hide powered by header', () => {
      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      expect(helmetConfig.hidePoweredBy).toBe(true);
    });

    it('should configure HSTS based on environment', () => {
      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      expect(helmetConfig.hsts).toBe(false); // Disabled in development
    });

    it('should enable HSTS in production', () => {
      mockConfig.service.env = 'production';
      Config.getInstance.mockReturnValue(mockConfig);

      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      expect(helmetConfig.hsts).toEqual({
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      });
    });

    it('should configure IE no open', () => {
      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      expect(helmetConfig.ieNoOpen).toBe(true);
    });

    it('should configure no sniff', () => {
      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      expect(helmetConfig.noSniff).toBe(true);
    });

    it('should configure permitted cross domain policies', () => {
      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      expect(helmetConfig.permittedCrossDomainPolicies).toEqual({ permittedPolicies: 'none' });
    });

    it('should configure referrer policy', () => {
      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      expect(helmetConfig.referrerPolicy).toEqual({ policy: 'strict-origin-when-cross-origin' });
    });

    it('should enable XSS filter', () => {
      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      expect(helmetConfig.xssFilter).toBe(true);
    });

    it('should configure max content length', () => {
      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      expect(helmetConfig.maxContentLength).toBe(50000000); // 50MB
    });
  });

  describe('Error Handling', () => {
    it('should handle missing config gracefully', () => {
      Config.getInstance.mockReturnValue({});

      expect(() => configureHelmet(mockApp)).not.toThrow();
    });

    it('should handle missing app parameter', () => {
      expect(() => configureHelmet(undefined)).toThrow();
    });

    it('should handle missing service config', () => {
      mockConfig.service = undefined;
      Config.getInstance.mockReturnValue(mockConfig);

      expect(() => configureHelmet(mockApp)).not.toThrow();
    });

    it('should handle missing app config', () => {
      mockConfig.app = undefined;
      Config.getInstance.mockReturnValue(mockConfig);

      expect(() => configureHelmet(mockApp)).not.toThrow();
    });

    it('should handle Config.getInstance throwing error', () => {
      Config.getInstance.mockImplementation(() => {
        throw new Error('Config error');
      });

      expect(() => configureHelmet(mockApp)).toThrow('Config error');
    });

    it('should handle helmet throwing error', () => {
      helmet.mockImplementation(() => {
        throw new Error('Helmet configuration error');
      });

      expect(() => configureHelmet(mockApp)).toThrow('Helmet configuration error');
    });
  });

  describe('Integration Tests', () => {
    it('should work with real Express app interface', () => {
      const realApp = {
        use: jest.fn(),
        get: jest.fn(),
        post: jest.fn(),
        listen: jest.fn()
      };

      configureHelmet(realApp);

      expect(realApp.use).toHaveBeenCalledWith(mockHelmetMiddleware);
    });

    it('should work with different environment configurations', () => {
      const environments = ['development', 'test', 'staging', 'production'];

      environments.forEach(env => {
        mockConfig.service.env = env;
        Config.getInstance.mockReturnValue(mockConfig);
        helmet.mockClear();

        configureHelmet(mockApp);

        expect(helmet).toHaveBeenCalledTimes(1);
        expect(mockApp.use).toHaveBeenCalledWith(mockHelmetMiddleware);
      });
    });
  });

  describe('Security Best Practices', () => {
    it('should enforce strict security headers', () => {
      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];

      // Check for strict security configurations
      expect(helmetConfig.frameguard.action).toBe('deny');
      expect(helmetConfig.permittedCrossDomainPolicies.permittedPolicies).toBe('none');
      expect(helmetConfig.referrerPolicy.policy).toBe('strict-origin-when-cross-origin');
      expect(helmetConfig.hidePoweredBy).toBe(true);
      expect(helmetConfig.noSniff).toBe(true);
      expect(helmetConfig.xssFilter).toBe(true);
    });

    it('should configure HSTS for production security', () => {
      mockConfig.service.env = 'production';
      Config.getInstance.mockReturnValue(mockConfig);

      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      const hsts = helmetConfig.hsts;

      expect(hsts.maxAge).toBe(31536000); // 1 year
      expect(hsts.includeSubDomains).toBe(true);
      expect(hsts.preload).toBe(true);
    });

    it('should configure CSP with secure defaults in production', () => {
      mockConfig.service.env = 'production';
      Config.getInstance.mockReturnValue(mockConfig);

      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      const csp = helmetConfig.contentSecurityPolicy;

      expect(csp.directives.defaultSrc).toEqual(["'self'"]);
      expect(csp.directives.objectSrc).toEqual(["'none'"]);
      expect(csp.directives.upgradeInsecureRequests).toEqual([]);
    });

    it('should have appropriate Expect-CT configuration', () => {
      mockConfig.service.env = 'production';
      Config.getInstance.mockReturnValue(mockConfig);

      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      const expectCt = helmetConfig.expectCt;

      expect(expectCt.maxAge).toBe(86400); // 24 hours
      expect(expectCt.enforce).toBe(true);
      expect(expectCt.reportUri).toBe('/api/v1/security/ct-report');
    });
  });

  describe('CSP Hash Validation', () => {
    it('should include valid SHA256 hashes for scripts', () => {
      mockConfig.service.env = 'production';
      Config.getInstance.mockReturnValue(mockConfig);

      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      const scriptSrc = helmetConfig.contentSecurityPolicy.directives.scriptSrc;

      expect(scriptSrc).toContain("'sha256-BeXIQk2DxxoDrgnnoH683KOnlwQvO0HH1fT4VFQTi8g='");
    });

    it('should include valid SHA256 hashes for styles', () => {
      mockConfig.service.env = 'production';
      Config.getInstance.mockReturnValue(mockConfig);

      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      const styleSrc = helmetConfig.contentSecurityPolicy.directives.styleSrc;

      const expectedHashes = [
        "'sha256-ezdv1bOGcoOD7FKudKN0Y2Mb763O6qVtM8LT2mtanIU='",
        "'sha256-/jDKvbQ8cdux+c5epDIqkjHbXDaIY8RucT1PmAe8FG4='",
        "'sha256-RL3ie0nH+Lzz2YNqQN83mnU0J1ot4QL7b99vMdIX99w='",
        "'sha256-BeXIQk2DxxoDrgnnoH683KOnlwQvO0HH1fT4VFQTi8g='"
      ];

      expectedHashes.forEach(hash => {
        expect(styleSrc).toContain(hash);
      });
    });
  });

  describe('Content Sources Configuration', () => {
    it('should allow appropriate image sources in production', () => {
      mockConfig.service.env = 'production';
      Config.getInstance.mockReturnValue(mockConfig);

      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      const imgSrc = helmetConfig.contentSecurityPolicy.directives.imgSrc;

      expect(imgSrc).toEqual([
        "'self'",
        'data:',
        'https://openweathermap.org',
        'https://cdn.weatherapi.com',
        'https://www.weatherapi.com'
      ]);
    });

    it('should allow appropriate font sources in production', () => {
      mockConfig.service.env = 'production';
      Config.getInstance.mockReturnValue(mockConfig);

      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      const fontSrc = helmetConfig.contentSecurityPolicy.directives.fontSrc;

      expect(fontSrc).toEqual([
        "'self'",
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
        'data:'
      ]);
    });

    it('should configure connect sources in production', () => {
      mockConfig.service.env = 'production';
      Config.getInstance.mockReturnValue(mockConfig);

      configureHelmet(mockApp);

      const helmetConfig = helmet.mock.calls[0][0];
      const connectSrc = helmetConfig.contentSecurityPolicy.directives.connectSrc;

      expect(connectSrc).toEqual([
        "'self'",
        'https://api.openweathermap.org',
        'https://api.weatherapi.com',
        'wss://localhost:*',
        'ws://localhost:*'
      ]);
    });
  });
});
