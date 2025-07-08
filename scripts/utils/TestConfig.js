import { URL } from 'url';

import UrlUtils from '../../src/utils/UrlUtils.js';

/**
 * Test configuration helper using UrlUtils for consistent URL construction
 */
export default class TestConfig {
  static getConfig() {
    // Default service configuration for testing
    const serviceConfig = {
      protocol: 'http',
      host: 'localhost',
      port: 9000,
      routePrefix: 'api/v1'
    };

    return {
      BASE_URL: TestConfig._buildTestBaseUrl(serviceConfig),
      JWT_TOKEN:
        process.env.TEST_JWT_TOKEN ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzJhNzQyN2IzOTEyMGJjMzg2MzhmNGUiLCJlbWFpbCI6IndhcnVuYW1hZHVzaGFua2E0NTZAZ21haWwuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzM0OTU5MTI5LCJleHAiOjE3MzQ5NjI3Mjl9.p1VIvKw-eYBwE8bJqOvpBw_b2Hg9j4_eG3pqQoNsC7I',
      TIMEOUT: 10000,
      RETRY_ATTEMPTS: 3,
      RATE_LIMIT_DELAY: 1000
    };
  }

  /**
   * Build base URL for testing (always includes port for localhost)
   * @param {Object} serviceConfig - Service configuration
   * @returns {string} - Base URL with port included
   */
  static _buildTestBaseUrl(serviceConfig) {
    const protocol = serviceConfig.protocol || 'http';
    const hostname = serviceConfig.host || 'localhost';
    const port = serviceConfig.port;

    // Build URL with port always included for testing
    const baseUrl = new URL(`${protocol}://${hostname}`);
    if (port) {
      baseUrl.port = port;
    }

    // Add path components
    const pathSegments = [];
    if (serviceConfig.routePrefix) {
      pathSegments.push(serviceConfig.routePrefix);
    }

    // Join path segments and ensure proper formatting
    if (pathSegments.length > 0) {
      baseUrl.pathname = `/${pathSegments.filter(Boolean).join('/')}`;
    }

    return baseUrl.toString();
  }

  /**
   * Build endpoint URL for testing
   * @param {string} endpoint - The endpoint path
   * @param {Object} params - Query parameters
   * @returns {string} - Complete URL
   */
  static buildEndpointUrl(endpoint, params = null) {
    const config = TestConfig.getConfig();
    return UrlUtils.buildEndpointUrl(config.BASE_URL, endpoint, params);
  }

  /**
   * Get service configuration for testing different environments
   * @param {string} env - Environment (development, staging, production)
   * @returns {Object} - Service configuration
   */
  static getServiceConfig(env = 'development') {
    const configs = {
      development: {
        protocol: 'http',
        host: 'localhost',
        port: 9000,
        routePrefix: 'api/v1'
      },
      staging: {
        protocol: 'https',
        host: 'staging-api.weather-reporter.com',
        port: 443,
        routePrefix: 'api/v1'
      },
      production: {
        protocol: 'https',
        host: 'api.weather-reporter.com',
        port: 443,
        routePrefix: 'api/v1'
      }
    };

    // Use switch statement to prevent object injection
    switch (env) {
      case 'development':
        return configs.development;
      case 'staging':
        return configs.staging;
      case 'production':
        return configs.production;
      default:
        return configs.development;
    }
  }

  /**
   * Build URLs for different environments
   * @param {string} env - Environment
   * @returns {string} - Base URL for the environment
   */
  static buildEnvironmentUrl(env = 'development') {
    const serviceConfig = TestConfig.getServiceConfig(env);

    // For development (localhost), use our test-specific URL builder
    if (env === 'development' && serviceConfig.host === 'localhost') {
      return TestConfig._buildTestBaseUrl(serviceConfig);
    }

    // For other environments, use the standard UrlUtils
    return UrlUtils.buildServiceBaseUrl(serviceConfig, false);
  }
}
