import { URL } from 'url';

/**
 * URL utility functions for consistent URL construction across services
 */
export default class UrlUtils {
  /**
   * Construct a service base URL using URL utilities
   * @param {Object} serviceConfig - Service configuration object
   * @param {boolean} includeName - Whether to include service name in development
   * @returns {string} - Properly formatted base URL
   */
  static buildServiceBaseUrl(serviceConfig, includeName = true) {
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!serviceConfig) {
      throw new Error('Service configuration is required');
    }

    // Build base URL components
    const protocol = serviceConfig.protocol || 'http';
    const hostname = serviceConfig.host || 'localhost';
    const port = isDevelopment ? serviceConfig.port : null;

    // Use URL constructor for proper URL formatting
    const baseUrl = new URL(`${protocol}://${hostname}`);
    if (port) {
      baseUrl.port = port;
    }

    // Add path components
    const pathSegments = [];
    if (serviceConfig.routePrefix) {
      pathSegments.push(serviceConfig.routePrefix);
    }
    // Include service name in all environments if specified and includeName is true
    if (includeName && serviceConfig.name) {
      pathSegments.push(serviceConfig.name);
    }

    // Join path segments and ensure proper formatting
    if (pathSegments.length > 0) {
      baseUrl.pathname = `/${pathSegments.filter(Boolean).join('/')}`;
    }

    return baseUrl.toString();
  }

  /**
   * Construct a full URL for a specific endpoint
   * @param {string} baseUrl - The base URL
   * @param {string} endpoint - The endpoint path (e.g., '/search', '/current/123')
   * @param {Object} params - Query parameters to append
   * @returns {string} - Complete URL with query parameters
   */
  static buildEndpointUrl(baseUrl, endpoint, params = null) {
    if (!baseUrl || !endpoint) {
      throw new Error('Base URL and endpoint are required');
    }

    // Ensure base URL ends with / and endpoint doesn't start with / to properly join them
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const normalizedEndpoint = endpoint.startsWith('/')
      ? endpoint.slice(1)
      : endpoint;

    const url = new URL(normalizedEndpoint, normalizedBaseUrl);

    if (params && typeof params === 'object') {
      Object.keys(params).forEach(key => {
        // Safe object access - keys come from Object.keys() which are safe
        // eslint-disable-next-line security/detect-object-injection
        if (params[key] !== null && params[key] !== undefined) {
          // eslint-disable-next-line security/detect-object-injection
          url.searchParams.append(key, params[key]);
        }
      });
    }

    return url.toString();
  }

  /**
   * Validate and sanitize endpoint path
   * @param {string} endpoint - The endpoint path to validate
   * @returns {string} - Sanitized endpoint path
   */
  static sanitizeEndpoint(endpoint) {
    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error('Invalid endpoint provided');
    }

    // Ensure endpoint starts with /
    const sanitized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // Remove any double slashes and normalize path
    return sanitized.replace(/\/+/g, '/');
  }

  /**
   * Parse and validate URL components
   * @param {string} urlString - URL string to parse
   * @returns {Object} - Parsed URL components
   */
  static parseUrl(urlString) {
    try {
      const url = new URL(urlString);
      return {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        pathname: url.pathname,
        search: url.search,
        searchParams: Object.fromEntries(url.searchParams),
        isValid: true
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Join URL path segments safely
   * @param {...string} segments - Path segments to join
   * @returns {string} - Joined path
   */
  static joinPath(...segments) {
    return segments
      .filter(Boolean)
      .map(segment => segment.toString().replace(/^\/+|\/+$/g, ''))
      .filter(Boolean)
      .join('/');
  }

  /**
   * Remove sensitive information from URL for logging/error reporting
   * @param {string} urlString - URL to sanitize
   * @returns {string} - Sanitized URL
   */
  static sanitizeUrlForLogging(urlString) {
    try {
      const url = new URL(urlString);

      // Remove sensitive query parameters
      const sensitiveParams = ['token', 'key', 'secret', 'password', 'auth'];
      sensitiveParams.forEach(param => {
        if (url.searchParams.has(param)) {
          url.searchParams.set(param, '[REDACTED]');
        }
      });

      return url.toString();
    } catch {
      return '[INVALID_URL]';
    }
  }
}
