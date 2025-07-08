/* eslint-disable no-console */
import CircuitBreaker from 'opossum';

import Config from '../config/Config.js';

// Enhanced fallback strategies for different services
const FALLBACK_STRATEGIES = {
  weather: {
    search: () => ({
      success: false,
      message: 'Weather service temporarily unavailable',
      fallback: true,
      data: []
    }),
    getWeatherByCity: () => ({
      success: false,
      message: 'Weather data temporarily unavailable',
      fallback: true,
      data: {
        temperature: null,
        conditions: 'Data unavailable'
      }
    }),
    getWeatherByCityName: () => ({
      success: false,
      message: 'Weather data temporarily unavailable',
      fallback: true,
      data: {
        temperature: null,
        conditions: 'Data unavailable'
      }
    }),
    getBulkWeather: () => ({
      success: false,
      message: 'Bulk weather service temporarily unavailable',
      fallback: true,
      data: {}
    })
  },
  authentication: {
    authorize: () => {
      throw new Error('AuthenticationUnavailableError');
    },
    login: () => {
      throw new Error('AuthenticationUnavailableError');
    },
    register: () => {
      throw new Error('AuthenticationUnavailableError');
    },
    logout: () => {
      throw new Error('AuthenticationUnavailableError');
    }
  },
  user: {
    assignRole: () => ({
      success: false,
      message: 'User service temporarily unavailable',
      fallback: true
    })
  }
};

// Enhanced configuration per service type
const SERVICE_CONFIGS = {
  weather: {
    errorThresholdPercentage: 60, // More lenient for external APIs
    timeout: 8000,
    resetTimeout: 30000, // Longer reset for external APIs
    rollingCountTimeout: 60000,
    rollingCountBuckets: 10,
    volumeThreshold: 10
  },
  authentication: {
    errorThresholdPercentage: 90, // Stricter for critical service
    timeout: 3000,
    resetTimeout: 15000, // Faster recovery for critical service
    rollingCountTimeout: 30000,
    rollingCountBuckets: 6,
    volumeThreshold: 5
  },
  user: {
    errorThresholdPercentage: 75,
    timeout: 4000,
    resetTimeout: 20000,
    rollingCountTimeout: 40000,
    rollingCountBuckets: 8,
    volumeThreshold: 8
  }
};

const breakerInstances = new Map();

function initializeBreakerInstances() {
  if (breakerInstances.size === 0) {
    // Get valid service names from config
    const validServices = Object.keys(Config.getInstance().services);
    validServices.forEach(service => {
      // Validate service name before using as key
      if (typeof service === 'string' && service.length > 0) {
        breakerInstances.set(service, null);
      }
    });
  }
}

// Enhanced error filter function
function createEnhancedErrorFilter(serviceName) {
  return error => {
    const err = !error?.response ? error?.code : error?.response?.status;

    // Network and infrastructure errors - should trip circuit
    const networkErrors = [
      'ECONNABORTED',
      'ECONNREFUSED',
      'EOPENBREAKER',
      'ETIMEDOUT',
      'ENETUNREACH',
      'EHOSTUNREACH',
      'ENOTFOUND'
    ];

    if (networkErrors.includes(err)) {
      return false; // Trip circuit
    }

    // Server errors - should trip circuit
    if (err >= 500) {
      return false; // Trip circuit
    }

    // Rate limiting - should trip circuit
    if (err === 429) {
      return false; // Trip circuit
    }

    // Authentication service special handling
    if (serviceName === 'authentication') {
      // Don't trip circuit for bad credentials (401)
      if (err === 401) {
        return true; // Don't trip
      }
      // Trip circuit for auth service unavailable (503)
      if (err === 503) {
        return false; // Trip circuit
      }
    }

    // Client errors (4xx except 429) - don't trip circuit
    if (err >= 400 && err < 500) {
      return true; // Don't trip circuit
    }

    // Default: trip circuit for unknown errors
    return false;
  };
}

// Safe service config getter
function getServiceConfig(service) {
  switch (service) {
    case 'weather':
      return SERVICE_CONFIGS.weather;
    case 'authentication':
      return SERVICE_CONFIGS.authentication;
    case 'user':
      return SERVICE_CONFIGS.user;
    default:
      return SERVICE_CONFIGS.weather; // Default fallback
  }
}

// Get fallback function for service and operation
function getFallbackFunction(serviceName, operationType = 'default') {
  // Use switch statement to safely access FALLBACK_STRATEGIES
  switch (serviceName) {
    case 'weather':
      switch (operationType) {
        case 'search':
          return FALLBACK_STRATEGIES.weather.search;
        case 'getWeatherByCity':
          return FALLBACK_STRATEGIES.weather.getWeatherByCity;
        case 'getWeatherByCityName':
          return FALLBACK_STRATEGIES.weather.getWeatherByCityName;
        case 'getBulkWeather':
          return FALLBACK_STRATEGIES.weather.getBulkWeather;
        default:
          return FALLBACK_STRATEGIES.weather.search;
      }
    case 'authentication':
      switch (operationType) {
        case 'authorize':
          return FALLBACK_STRATEGIES.authentication.authorize;
        case 'login':
          return FALLBACK_STRATEGIES.authentication.login;
        case 'register':
          return FALLBACK_STRATEGIES.authentication.register;
        case 'logout':
          return FALLBACK_STRATEGIES.authentication.logout;
        default:
          return FALLBACK_STRATEGIES.authentication.authorize;
      }
    case 'user':
      switch (operationType) {
        case 'assignRole':
          return FALLBACK_STRATEGIES.user.assignRole;
        default:
          return FALLBACK_STRATEGIES.user.assignRole;
      }
    default:
      // Default fallback for unknown services
      return () => ({
        success: false,
        message: 'Service temporarily unavailable',
        fallback: true
      });
  }
}

// Original function with enhanced features
export function getCircuitBreakerInstance(
  action = null,
  service,
  operationType = 'default'
) {
  if (service) {
    const serviceLabel = service.charAt(0).toUpperCase() + service.slice(1);
    const instanceKey =
      operationType !== 'default' ? `${service}-${operationType}` : service;

    // Initialize breaker instances lazily
    initializeBreakerInstances();

    if (!breakerInstances.has(instanceKey)) {
      // Get enhanced configuration using safe getter
      const config = getServiceConfig(service);

      const options = {
        ...config,
        name: instanceKey,
        errorFilter: createEnhancedErrorFilter(service),
        fallback: getFallbackFunction(service, operationType)
      };

      const breakerInstance = new CircuitBreaker(action, options);
      breakerInstances.set(instanceKey, breakerInstance);

      // Enhanced event handling with structured logging
      breakerInstance.on('open', () => {
        console.warn({
          event: 'circuit_breaker_open',
          service,
          operationType,
          timestamp: new Date().toISOString(),
          message: `${serviceLabel} Circuit breaker is open, requests are being blocked.`
        });
      });

      breakerInstance.on('halfOpen', () => {
        console.info({
          event: 'circuit_breaker_half_open',
          service,
          operationType,
          timestamp: new Date().toISOString(),
          message: `${serviceLabel} Circuit breaker is half-open, requests are being tested.`
        });
      });

      breakerInstance.on('close', () => {
        console.info({
          event: 'circuit_breaker_close',
          service,
          operationType,
          timestamp: new Date().toISOString(),
          message: `${serviceLabel} Circuit breaker is closed, requests are allowed.`
        });
      });

      breakerInstance.on('fire', () => {
        if (breakerInstance.opened) {
          throw new Error('CircuitBreakerOpenError');
        }
      });

      breakerInstance.on('failure', error => {
        const errorResponse =
          error?.response?.data?.error?.error ||
          error?.response?.data?.error ||
          error.code;
        const finalError = errorResponse || error;
        console.error({
          event: 'circuit_breaker_failure',
          service,
          operationType,
          error: finalError,
          timestamp: new Date().toISOString(),
          message: `${serviceLabel} Circuit breaker failure`
        });
      });

      breakerInstance.on('timeout', () => {
        console.warn({
          event: 'circuit_breaker_timeout',
          service,
          operationType,
          timestamp: new Date().toISOString(),
          message: `${serviceLabel} Circuit breaker timeout`
        });
      });

      breakerInstance.on('fallback', () => {
        console.warn({
          event: 'circuit_breaker_fallback',
          service,
          operationType,
          timestamp: new Date().toISOString(),
          message: `${serviceLabel} Fallback strategy executed`
        });
      });

      breakerInstance.on('success', () => {
        console.debug({
          event: 'circuit_breaker_success',
          service,
          operationType,
          timestamp: new Date().toISOString()
        });
      });
    }

    // Update action if provided
    const existingBreaker = breakerInstances.get(instanceKey);
    if (action && existingBreaker) {
      existingBreaker.action = action;
    }

    return breakerInstances.get(instanceKey);
  } else {
    throw new Error('Service name is required to get a circuit breaker instance.');
  }
}

// Health check functionality
export function getCircuitBreakerHealth() {
  const health = {};

  breakerInstances.forEach((breaker, key) => {
    if (!breaker) return;

    let state;
    if (breaker.opened) {
      state = 'OPEN';
    } else if (breaker.halfOpen) {
      state = 'HALF_OPEN';
    } else {
      state = 'CLOSED';
    }

    // Use Object.defineProperty to safely set the property
    Object.defineProperty(health, key, {
      value: {
        state,
        stats: breaker.stats,
        options: {
          errorThresholdPercentage: breaker.options.errorThresholdPercentage,
          timeout: breaker.options.timeout,
          resetTimeout: breaker.options.resetTimeout,
          volumeThreshold: breaker.options.volumeThreshold
        }
      },
      enumerable: true,
      configurable: true
    });
  });

  return health;
}

// Metrics export for monitoring systems
export function getCircuitBreakerMetrics() {
  const metrics = {};

  breakerInstances.forEach((breaker, key) => {
    if (!breaker) return;

    const { stats } = breaker;

    let state;
    if (breaker.opened) {
      state = 'open';
    } else if (breaker.halfOpen) {
      state = 'half_open';
    } else {
      state = 'closed';
    }

    // Use Object.defineProperty to safely set the property
    Object.defineProperty(metrics, key, {
      value: {
        requests_total: stats.fires,
        requests_successful: stats.successes,
        requests_failed: stats.failures,
        requests_timeout: stats.timeouts,
        requests_rejected: stats.rejects,
        fallbacks_total: stats.fallbacks || 0,
        error_rate: stats.failures / (stats.fires || 1),
        state
      },
      enumerable: true,
      configurable: true
    });
  });

  return metrics;
}
