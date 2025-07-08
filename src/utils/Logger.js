/**
 * Central Logger utility for the entire application
 * Provides consistent logging across all modules with configurable levels and formats
 */

import Config from '../config/Config.js';

class Logger {
  constructor() {
    try {
      this.config = Config.getInstance();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(
        'Logger: Config initialization failed, using defaults:',
        error.message
      );
      this.config = null;
    }
    this.logLevel = this.getLogLevel();
    this.enabledInProduction = this.config?.logging?.enabledInProduction !== false;

    // Log levels in order of priority
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  getLogLevel() {
    // Priority: ENV variable > config > default
    if (process.env.LOG_LEVEL) {
      return process.env.LOG_LEVEL.toLowerCase();
    }
    return this.config?.logging?.level || 'info';
  }

  shouldLog(level) {
    const currentLevelPriority = this.levels[this.logLevel] ?? this.levels.info;
    // Safe access - level is controlled by internal methods
    // eslint-disable-next-line security/detect-object-injection
    const messageLevelPriority = this.levels[level] ?? this.levels.info;

    // Always log in development, check config for production
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && !this.enabledInProduction) {
      return false;
    }

    // Only log if message level priority is <= current level priority
    // (lower number = higher priority)
    return messageLevelPriority <= currentLevelPriority;
  }

  formatMessage(level, module, message, ...args) {
    const timestamp = new Date().toISOString();
    const modulePrefix = module ? `[${module}]` : '';
    const levelPrefix = `[${level.toUpperCase()}]`;

    // Build spacing and message format based on module parameter
    let formatted;
    if (modulePrefix) {
      // With module: [LEVEL] [MODULE] message (no brackets around message)
      formatted = `${timestamp} ${levelPrefix} ${modulePrefix} ${message}`;
    } else if (module === null) {
      // Explicitly no module: [LEVEL]  message (double space, no brackets around message)
      formatted = `${timestamp} ${levelPrefix}  ${message}`;
    } else {
      // Module undefined (from convenience methods): [LEVEL] [message] (single space, brackets around message)
      formatted = `${timestamp} ${levelPrefix} [${message}]`;
    }

    return {
      formatted,
      args
    };
  }

  /**
   * Determines if a string looks like a module identifier
   * Module identifiers are typically short strings that could be module names
   */
  isModuleIdentifier(str) {
    return (
      typeof str === 'string' &&
      str.length <= 20 &&
      // Allow alphanumeric, spaces, hyphens, and underscores
      /^[A-Za-z][A-Za-z0-9\s_-]*$/.test(str) &&
      // Exclude very long sentences or messages that look like log messages
      !str.includes(':') &&
      !str.includes('[') &&
      !str.includes(']') &&
      // Exclude strings that look like log messages (word + "message", "error", etc.)
      !/\b\w+\s+(message|error|warning|info)\b/i.test(str)
    );
  }

  /**
   * Log error messages (always logged unless completely disabled)
   */
  error(moduleOrMessage, message, ...args) {
    if (this.shouldLog('error')) {
      // Handle both (message, ...args) and (module, message, ...args)
      let module, actualMessage, actualArgs;
      if (arguments.length === 1) {
        // Called as error(message)
        module = undefined;
        actualMessage = moduleOrMessage;
        actualArgs = [];
      } else if (
        typeof message === 'string' &&
        this.isModuleIdentifier(moduleOrMessage)
      ) {
        // Called as error(module, message, ...args) - first arg looks like a module
        module = moduleOrMessage;
        actualMessage = message;
        actualArgs = args;
      } else {
        // Called as error(message, ...args) - first arg is the message
        module = undefined;
        actualMessage = moduleOrMessage;
        actualArgs = [message, ...args];
      }

      const { formatted, args: logArgs } = this.formatMessage(
        'error',
        module,
        actualMessage,
        ...actualArgs
      );
      // eslint-disable-next-line no-console
      console.error(formatted, ...logArgs);
    }
  }

  /**
   * Log warning messages
   */
  warn(moduleOrMessage, message, ...args) {
    if (this.shouldLog('warn')) {
      // Handle both (message, ...args) and (module, message, ...args)
      let module, actualMessage, actualArgs;
      if (arguments.length === 1) {
        // Called as warn(message)
        module = undefined;
        actualMessage = moduleOrMessage;
        actualArgs = [];
      } else if (
        typeof message === 'string' &&
        this.isModuleIdentifier(moduleOrMessage)
      ) {
        // Called as warn(module, message, ...args) - first arg looks like a module
        module = moduleOrMessage;
        actualMessage = message;
        actualArgs = args;
      } else {
        // Called as warn(message, ...args) - first arg is the message
        module = undefined;
        actualMessage = moduleOrMessage;
        actualArgs = [message, ...args];
      }

      const { formatted, args: logArgs } = this.formatMessage(
        'warn',
        module,
        actualMessage,
        ...actualArgs
      );
      // eslint-disable-next-line no-console
      console.warn(formatted, ...logArgs);
    }
  }

  /**
   * Log info messages
   */
  info(moduleOrMessage, message, ...args) {
    if (this.shouldLog('info')) {
      // Handle both (message, ...args) and (module, message, ...args)
      let module, actualMessage, actualArgs;
      if (arguments.length === 1) {
        // Called as info(message)
        module = undefined;
        actualMessage = moduleOrMessage;
        actualArgs = [];
      } else if (
        typeof message === 'string' &&
        this.isModuleIdentifier(moduleOrMessage)
      ) {
        // Called as info(module, message, ...args) - first arg looks like a module
        module = moduleOrMessage;
        actualMessage = message;
        actualArgs = args;
      } else {
        // Called as info(message, ...args) - first arg is the message
        module = undefined;
        actualMessage = moduleOrMessage;
        actualArgs = [message, ...args];
      }

      const { formatted, args: logArgs } = this.formatMessage(
        'info',
        module,
        actualMessage,
        ...actualArgs
      );
      // eslint-disable-next-line no-console
      console.log(formatted, ...logArgs);
    }
  }

  /**
   * Log debug messages (only in debug level)
   */
  debug(moduleOrMessage, message, ...args) {
    if (this.shouldLog('debug')) {
      // Handle both (message, ...args) and (module, message, ...args)
      let module, actualMessage, actualArgs;
      if (arguments.length === 1) {
        // Called as debug(message)
        module = undefined;
        actualMessage = moduleOrMessage;
        actualArgs = [];
      } else if (
        typeof message === 'string' &&
        this.isModuleIdentifier(moduleOrMessage)
      ) {
        // Called as debug(module, message, ...args) - first arg looks like a module
        module = moduleOrMessage;
        actualMessage = message;
        actualArgs = args;
      } else {
        // Called as debug(message, ...args) - first arg is the message
        module = undefined;
        actualMessage = moduleOrMessage;
        actualArgs = [message, ...args];
      }

      const { formatted, args: logArgs } = this.formatMessage(
        'debug',
        module,
        actualMessage,
        ...actualArgs
      );
      // eslint-disable-next-line no-console
      console.debug(formatted, ...logArgs);
    }
  }

  /**
   * Create a module-specific logger
   */
  module(moduleName) {
    return {
      error: (message, ...args) => this.error(moduleName, message, ...args),
      warn: (message, ...args) => this.warn(moduleName, message, ...args),
      info: (message, ...args) => this.info(moduleName, message, ...args),
      debug: (message, ...args) => this.debug(moduleName, message, ...args)
    };
  }

  /**
   * Log HTTP requests (special method for middleware)
   */
  http(method, url, status, duration, ...args) {
    const message = `${method} ${url} ${status} - ${duration}ms`;
    if (status >= 500) {
      this.error('HTTP', message, ...args);
    } else if (status >= 400) {
      this.warn('HTTP', message, ...args);
    } else {
      this.info('HTTP', message, ...args);
    }
  }

  /**
   * Log database operations
   */
  db(operation, collection, duration, ...args) {
    const message = `${operation} ${collection} - ${duration}ms`;
    this.debug('DATABASE', message, ...args);
  }

  /**
   * Log cache operations
   */
  cache(operation, key, hit = null, ...args) {
    let hitStatus = '';
    if (hit !== null) {
      hitStatus = hit ? 'HIT' : 'MISS';
    }
    const message = `${operation} ${key} ${hitStatus}`.trim();
    this.debug('CACHE', message, ...args);
  }

  /**
   * Log circuit breaker events
   */
  circuit(service, state, ...args) {
    const message = `Circuit breaker ${state} for ${service}`;
    if (state === 'open') {
      this.warn('CIRCUIT', message, ...args);
    } else {
      this.info('CIRCUIT', message, ...args);
    }
  }

  /**
   * Log API calls to external services
   */
  api(service, endpoint, method, status, duration, ...args) {
    const message = `${service} ${method} ${endpoint} ${status} - ${duration}ms`;
    if (status >= 500) {
      this.error('API', message, ...args);
    } else if (status >= 400) {
      this.warn('API', message, ...args);
    } else {
      this.info('API', message, ...args);
    }
  }
}

// Create and export a singleton logger instance
const logger = new Logger();

export default logger;

// Export convenience methods for direct use - bind to maintain context
export const error = (...args) => logger.error(...args);
export const warn = (...args) => logger.warn(...args);
export const info = (...args) => logger.info(...args);
export const debug = (...args) => logger.debug(...args);
export const http = (...args) => logger.http(...args);
export const db = (...args) => logger.db(...args);
export const cache = (...args) => logger.cache(...args);
export const circuit = (...args) => logger.circuit(...args);
export const api = (...args) => logger.api(...args);

// Export module creator for scoped logging
export const createModuleLogger = moduleName => logger.module(moduleName);
