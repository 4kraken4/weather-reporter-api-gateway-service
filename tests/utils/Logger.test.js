import Config from '../../src/config/Config.js';
import logger, { api, cache, circuit, createModuleLogger, db, debug, error, http, info, warn } from '../../src/utils/Logger.js';

// Mock dependencies
jest.mock('../../src/config/Config.js');

describe('Logger', () => {
  let mockConfig;
  let originalEnv;
  let consoleSpy;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Mock Config
    mockConfig = {
      logging: {
        level: 'info',
        enabledInProduction: true
      }
    };
    Config.getInstance = jest.fn().mockReturnValue(mockConfig);

    // Mock console methods
    consoleSpy = {
      error: jest.spyOn(console, 'error').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      log: jest.spyOn(console, 'log').mockImplementation(),
      debug: jest.spyOn(console, 'debug').mockImplementation()
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;

    // Restore console methods
    Object.values(consoleSpy).forEach(spy => spy.mockRestore());
  });

  describe('Logger Singleton Instance', () => {
    it('should be initialized successfully', () => {
      expect(logger).toBeDefined();
      expect(logger.logLevel).toBe('info');
      expect(logger.enabledInProduction).toBe(true);
    });

    it('should have correct levels configuration', () => {
      expect(logger.levels).toEqual({
        error: 0,
        warn: 1,
        info: 2,
        debug: 3
      });
    });
  });

  describe('Log Level Management', () => {
    it('should get log level from environment first', () => {
      process.env.LOG_LEVEL = 'WARN';
      expect(logger.getLogLevel()).toBe('warn');
    });

    it('should get log level from config if no environment variable', () => {
      delete process.env.LOG_LEVEL;
      expect(logger.getLogLevel()).toBe('info'); // From mockConfig
    });

    it('should default to info if neither environment nor config available', () => {
      delete process.env.LOG_LEVEL;
      Config.getInstance.mockReturnValue({});
      expect(logger.getLogLevel()).toBe('info');
    });

    it('should handle null config gracefully', () => {
      delete process.env.LOG_LEVEL;
      Config.getInstance.mockReturnValue(null);
      expect(logger.getLogLevel()).toBe('info');
    });
  });

  describe('Should Log Logic', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should log error level messages when log level is error', () => {
      // Mock the logLevel property
      Object.defineProperty(logger, 'logLevel', { value: 'error', writable: true });
      expect(logger.shouldLog('error')).toBe(true);
      expect(logger.shouldLog('warn')).toBe(false);
      expect(logger.shouldLog('info')).toBe(false);
      expect(logger.shouldLog('debug')).toBe(false);
    });

    it('should log warn and error when log level is warn', () => {
      Object.defineProperty(logger, 'logLevel', { value: 'warn', writable: true });
      expect(logger.shouldLog('error')).toBe(true);
      expect(logger.shouldLog('warn')).toBe(true);
      expect(logger.shouldLog('info')).toBe(false);
      expect(logger.shouldLog('debug')).toBe(false);
    });

    it('should log info, warn, and error when log level is info', () => {
      Object.defineProperty(logger, 'logLevel', { value: 'info', writable: true });
      expect(logger.shouldLog('error')).toBe(true);
      expect(logger.shouldLog('warn')).toBe(true);
      expect(logger.shouldLog('info')).toBe(true);
      expect(logger.shouldLog('debug')).toBe(false);
    });

    it('should log all levels when log level is debug', () => {
      Object.defineProperty(logger, 'logLevel', { value: 'debug', writable: true });
      expect(logger.shouldLog('error')).toBe(true);
      expect(logger.shouldLog('warn')).toBe(true);
      expect(logger.shouldLog('info')).toBe(true);
      expect(logger.shouldLog('debug')).toBe(true);
    });

    it('should not log in production when logging is disabled', () => {
      process.env.NODE_ENV = 'production';
      Object.defineProperty(logger, 'enabledInProduction', { value: false, writable: true });
      Object.defineProperty(logger, 'logLevel', { value: 'debug', writable: true });

      expect(logger.shouldLog('error')).toBe(false);
      expect(logger.shouldLog('warn')).toBe(false);
      expect(logger.shouldLog('info')).toBe(false);
      expect(logger.shouldLog('debug')).toBe(false);
    });

    it('should log in production when logging is enabled', () => {
      process.env.NODE_ENV = 'production';
      Object.defineProperty(logger, 'enabledInProduction', { value: true, writable: true });
      Object.defineProperty(logger, 'logLevel', { value: 'info', writable: true });

      expect(logger.shouldLog('error')).toBe(true);
      expect(logger.shouldLog('warn')).toBe(true);
      expect(logger.shouldLog('info')).toBe(true);
      expect(logger.shouldLog('debug')).toBe(false);
    });

    it('should handle unknown log levels by defaulting to info', () => {
      Object.defineProperty(logger, 'logLevel', { value: 'unknown', writable: true });
      expect(logger.shouldLog('error')).toBe(true);
      expect(logger.shouldLog('warn')).toBe(true);
      expect(logger.shouldLog('info')).toBe(true);
      expect(logger.shouldLog('debug')).toBe(false);
    });
  });

  describe('Format Message', () => {
    it('should format message with prefix and module', () => {
      const result = logger.formatMessage('TEST', 'TestModule', 'Test message', 'extra', 'data');
      expect(result.formatted).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[TEST\] \[TestModule\] Test message/);
      expect(result.args).toEqual(['extra', 'data']);
    });

    it('should format message with only prefix', () => {
      const result = logger.formatMessage('ERROR', null, 'Error occurred');
      expect(result.formatted).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[ERROR\] {2}Error occurred/);
      expect(result.args).toEqual([]);
    });

    it('should format message with no additional args', () => {
      const result = logger.formatMessage('INFO', 'Module', 'Simple message');
      expect(result.formatted).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] \[Module\] Simple message/);
      expect(result.args).toEqual([]);
    });

    it('should handle undefined and null args', () => {
      const result = logger.formatMessage('WARN', 'Module', 'Message', undefined, null, 'valid');
      expect(result.formatted).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[WARN\] \[Module\] Message/);
      expect(result.args).toEqual([undefined, null, 'valid']);
    });

    it('should format objects and arrays as args', () => {
      const obj = { key: 'value' };
      const arr = [1, 2, 3];
      const result = logger.formatMessage('DEBUG', 'Module', 'Objects:', obj, arr);
      expect(result.formatted).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[DEBUG\] \[Module\] Objects:/);
      expect(result.args).toEqual([obj, arr]);
    });
  });

  describe('Core Logging Methods', () => {
    beforeEach(() => {
      Object.defineProperty(logger, 'logLevel', { value: 'debug', writable: true });
      process.env.NODE_ENV = 'development';
    });

    describe('error method', () => {
      it('should log error messages to console.error', () => {
        logger.error('Error message', { error: 'details' });
        expect(consoleSpy.error).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[ERROR\] \[Error message\]/),
          { error: 'details' }
        );
      });

      it('should log error with module prefix', () => {
        logger.error('MODULE', 'Error in module', 'extra data');
        expect(consoleSpy.error).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[ERROR\] \[MODULE\] Error in module/),
          'extra data'
        );
      });

      it('should not log error when level is above error and in production', () => {
        process.env.NODE_ENV = 'production';
        Object.defineProperty(logger, 'enabledInProduction', { value: false, writable: true });

        logger.error('Should not log');
        expect(consoleSpy.error).not.toHaveBeenCalled();
      });
    });

    describe('warn method', () => {
      it('should log warn messages to console.warn', () => {
        logger.warn('Warning message', 'additional info');
        expect(consoleSpy.warn).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[WARN\] \[Warning message\]/),
          'additional info'
        );
      });

      it('should log warn with module prefix', () => {
        logger.warn('AUTH', 'Authentication warning');
        expect(consoleSpy.warn).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[WARN\] \[AUTH\] Authentication warning/)
        );
      });

      it('should not log warn when log level is error', () => {
        Object.defineProperty(logger, 'logLevel', { value: 'error', writable: true });

        logger.warn('Should not log');
        expect(consoleSpy.warn).not.toHaveBeenCalled();
      });
    });

    describe('info method', () => {
      it('should log info messages to console.log', () => {
        logger.info('Info message', 123);
        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] \[Info message\]/),
          123
        );
      });

      it('should log info with module prefix', () => {
        logger.info('API', 'Request processed successfully');
        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] \[API\] Request processed successfully/)
        );
      });

      it('should not log info when log level is warn', () => {
        Object.defineProperty(logger, 'logLevel', { value: 'warn', writable: true });

        logger.info('Should not log');
        expect(consoleSpy.log).not.toHaveBeenCalled();
      });
    });

    describe('debug method', () => {
      it('should log debug messages to console.debug', () => {
        logger.debug('Debug message', { debug: true });
        expect(consoleSpy.debug).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[DEBUG\] \[Debug message\]/),
          { debug: true }
        );
      });

      it('should log debug with module prefix', () => {
        logger.debug('DB', 'Query executed', 'SELECT * FROM users');
        expect(consoleSpy.debug).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[DEBUG\] \[DB\] Query executed/),
          'SELECT * FROM users'
        );
      });

      it('should not log debug when log level is info', () => {
        Object.defineProperty(logger, 'logLevel', { value: 'info', writable: true });

        logger.debug('Should not log');
        expect(consoleSpy.debug).not.toHaveBeenCalled();
      });
    });
  });

  describe('Specialized Logging Methods', () => {
    beforeEach(() => {
      Object.defineProperty(logger, 'logLevel', { value: 'debug', writable: true });
      process.env.NODE_ENV = 'development';
    });

    describe('http method', () => {
      it('should log 2xx responses as info', () => {
        logger.http('GET', '/api/users', 200, 150);
        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] \[HTTP\] GET \/api\/users 200 - 150ms/)
        );
      });

      it('should log 3xx responses as info', () => {
        logger.http('POST', '/api/redirect', 301, 50);
        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] \[HTTP\] POST \/api\/redirect 301 - 50ms/)
        );
      });

      it('should log 4xx responses as warn', () => {
        logger.http('GET', '/api/protected', 404, 75);
        expect(consoleSpy.warn).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[WARN\] \[HTTP\] GET \/api\/protected 404 - 75ms/)
        );
      });

      it('should log 5xx responses as error', () => {
        logger.http('POST', '/api/process', 500, 1000);
        expect(consoleSpy.error).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[ERROR\] \[HTTP\] POST \/api\/process 500 - 1000ms/)
        );
      });

      it('should include additional arguments', () => {
        logger.http('PUT', '/api/update', 200, 200, 'user:123', 'updated');
        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] \[HTTP\] PUT \/api\/update 200 - 200ms/),
          'user:123',
          'updated'
        );
      });
    });

    describe('db method', () => {
      it('should log database operations as debug', () => {
        logger.db('SELECT', 'users', 25);
        expect(consoleSpy.debug).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[DEBUG\] \[DATABASE\] SELECT users - 25ms/)
        );
      });

      it('should include additional arguments', () => {
        logger.db('UPDATE', 'profiles', 50, 'rows:5');
        expect(consoleSpy.debug).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[DEBUG\] \[DATABASE\] UPDATE profiles - 50ms/),
          'rows:5'
        );
      });
    });

    describe('cache method', () => {
      it('should log cache operations as debug', () => {
        logger.cache('GET', 'user:123', 'hit');
        expect(consoleSpy.debug).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[DEBUG\] \[CACHE\] GET user:123 HIT/)
        );
      });

      it('should log cache miss operations', () => {
        logger.cache('GET', 'user:456', false);
        expect(consoleSpy.debug).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[DEBUG\] \[CACHE\] GET user:456 MISS/)
        );
      });

      it('should include additional arguments', () => {
        logger.cache('DEL', 'temp:*', null, 'keys:15');
        expect(consoleSpy.debug).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[DEBUG\] \[CACHE\] DEL temp:\*/),
          'keys:15'
        );
      });
    });

    describe('circuit method', () => {
      it('should log circuit open as warn', () => {
        logger.circuit('weather-api', 'open', 'Too many failures');
        expect(consoleSpy.warn).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[WARN\] \[CIRCUIT\] Circuit breaker open for weather-api/),
          'Too many failures'
        );
      });

      it('should log circuit closed as info', () => {
        logger.circuit('auth-service', 'closed');
        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] \[CIRCUIT\] Circuit breaker closed for auth-service/)
        );
      });

      it('should log circuit half-open as info', () => {
        logger.circuit('payment-gateway', 'half-open', 'Testing recovery');
        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] \[CIRCUIT\] Circuit breaker half-open for payment-gateway/),
          'Testing recovery'
        );
      });

      it('should include additional arguments', () => {
        logger.circuit('db-service', 'open', 'failure-count:10', 'threshold:5');
        expect(consoleSpy.warn).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[WARN\] \[CIRCUIT\] Circuit breaker open for db-service/),
          'failure-count:10',
          'threshold:5'
        );
      });
    });

    describe('api method', () => {
      it('should log 2xx responses as info', () => {
        logger.api('weather-service', '/forecast', 'GET', 200, 150);
        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] \[API\] weather-service GET \/forecast 200 - 150ms/)
        );
      });

      it('should log 3xx responses as info', () => {
        logger.api('redirect-service', '/old-endpoint', 'POST', 302, 50);
        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] \[API\] redirect-service POST \/old-endpoint 302 - 50ms/)
        );
      });

      it('should log 4xx responses as warn', () => {
        logger.api('auth-service', '/validate', 'POST', 401, 75);
        expect(consoleSpy.warn).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[WARN\] \[API\] auth-service POST \/validate 401 - 75ms/)
        );
      });

      it('should log 5xx responses as error', () => {
        logger.api('payment-service', '/charge', 'POST', 503, 5000);
        expect(consoleSpy.error).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[ERROR\] \[API\] payment-service POST \/charge 503 - 5000ms/)
        );
      });

      it('should include additional arguments', () => {
        logger.api('user-service', '/profile', 'GET', 200, 100, 'user-id:123', 'cached:false');
        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] \[API\] user-service GET \/profile 200 - 100ms/),
          'user-id:123',
          'cached:false'
        );
      });
    });
  });

  describe('Module Logger Creation', () => {
    it('should create module-specific logger', () => {
      const moduleLogger = logger.module('TestModule');
      expect(moduleLogger).toBeDefined();
      expect(typeof moduleLogger.error).toBe('function');
      expect(typeof moduleLogger.warn).toBe('function');
      expect(typeof moduleLogger.info).toBe('function');
      expect(typeof moduleLogger.debug).toBe('function');
    });

    it('should use module prefix in logs', () => {
      const moduleLogger = logger.module('AUTH');
      moduleLogger.error('Authentication failed');
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[ERROR\] \[AUTH\] Authentication failed/)
      );
    });

    it('should preserve additional arguments in module logger', () => {
      const moduleLogger = logger.module('API');
      moduleLogger.info('Request processed', { id: 123 }, 'success');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] \[API\] Request processed/),
        { id: 123 },
        'success'
      );
    });
  });

  describe('Exported Convenience Methods', () => {
    beforeEach(() => {
      Object.defineProperty(logger, 'logLevel', { value: 'debug', writable: true });
      process.env.NODE_ENV = 'development';
    });

    it('should export error function', () => {
      error('Exported error');
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[ERROR\] \[Exported error\]/)
      );
    });

    it('should export warn function', () => {
      warn('Exported warning');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[WARN\] \[Exported warning\]/)
      );
    });

    it('should export info function', () => {
      info('Exported info');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] \[Exported info\]/)
      );
    });

    it('should export debug function', () => {
      debug('Exported debug');
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[DEBUG\] \[Exported debug\]/)
      );
    });

    it('should export http function', () => {
      http('GET', '/test', 200, 100);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] \[HTTP\] GET \/test 200 - 100ms/)
      );
    });

    it('should export db function', () => {
      db('SELECT', 'test_table', 50);
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[DEBUG\] \[DATABASE\] SELECT test_table - 50ms/)
      );
    });

    it('should export cache function', () => {
      cache('GET', 'test:key', true);
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[DEBUG\] \[CACHE\] GET test:key HIT/)
      );
    });

    it('should export circuit function', () => {
      circuit('test-service', 'open');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[WARN\] \[CIRCUIT\] Circuit breaker open for test-service/)
      );
    });

    it('should export api function', () => {
      api('test-service', '/endpoint', 'POST', 201, 150);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] \[API\] test-service POST \/endpoint 201 - 150ms/)
      );
    });
  });

  describe('createModuleLogger Export', () => {
    it('should create module logger via exported function', () => {
      const moduleLogger = createModuleLogger('EXPORTED');
      expect(moduleLogger).toBeDefined();
      expect(typeof moduleLogger.error).toBe('function');
    });

    it('should work correctly with exported function', () => {
      const moduleLogger = createModuleLogger('TEST');
      moduleLogger.warn('Module warning');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[WARN\] \[TEST\] Module warning/)
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle circular objects in formatting', () => {
      const circular = { name: 'test' };
      circular.self = circular;

      logger.info('Circular object:', circular);
      // Should not throw and should handle circular reference gracefully
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should handle very long log messages', () => {
      const longMessage = 'x'.repeat(1000);
      logger.info(longMessage);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] \[.*\]/)
      );
    });

    it('should handle special characters in messages', () => {
      const specialChars = 'Message with 🚀 emojis and \n newlines \t tabs';
      logger.info(specialChars);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] \[[\s\S]*\]/)
      );
    });

    it('should handle null config gracefully', () => {
      // Logger should still function even with null config
      expect(logger.logLevel).toBeDefined();
      expect(logger.levels).toBeDefined();
    });
  });
});
