import { createModuleLogger } from '../../utils/Logger.js';

const logger = createModuleLogger('Error Handler');

// Error source detection based on error context
function detectServiceFromError(error, request) {
  // Check if error has service context metadata
  if (error.serviceContext) {
    return error.serviceContext;
  }

  // Check if request has route information that can help identify the service
  if (request?.originalUrl || request?.url) {
    const path = request.originalUrl || request.url;

    if (path.includes('/weather')) return 'weather';
    if (path.includes('/auth')) return 'auth';
  }

  // Check error message for service indicators
  if (error.message || error.error) {
    const errorText = (error.message || error.error).toLowerCase();

    if (errorText.includes('weather')) return 'weather';
    if (errorText.includes('auth')) return 'auth';
  }

  // Fallback to generic service
  return 'external';
}

function isNetworkError(error) {
  return (
    error === 'ECONNABORTED' ||
    error === 'ECONNREFUSED' ||
    error === 'EOPENBREAKER' ||
    error === 'ETIMEDOUT' ||
    error === 'ServiceUnavailableError' ||
    error === 'ENETUNREACH' ||
    error === 'EHOSTUNREACH' ||
    error === 'ENOTFOUND'
  );
}

/**
 * Handle network errors by providing a user-friendly message.
 * @param {Object} error - The error object to handle.
 * @param {Object} request - The request object for context.
 * @returns {string} - The user-friendly error message.
 */
function handleNetworkError(error, request = null) {
  const serviceContext = detectServiceFromError(error, request);
  const serviceName = getServiceDisplayName(serviceContext);

  // Provide more specific messaging based on error type
  const errorCode = error?.code || error?.error || error;

  switch (errorCode) {
    case 'ECONNREFUSED':
      return `The ${serviceName} service is currently unavailable. Our team has been notified and is working to restore service. Please try again in a few minutes.`;

    case 'ETIMEDOUT':
    case 'ECONNABORTED':
      return `The ${serviceName} service is experiencing high load and took too long to respond. Please try again in a moment.`;

    case 'ENETUNREACH':
    case 'EHOSTUNREACH':
    case 'ENOTFOUND':
      return `We're having trouble reaching the ${serviceName} service. This might be a temporary network issue. Please try again later.`;

    case 'ServiceUnavailableError':
    case 'EOPENBREAKER':
      return `The ${serviceName} service is temporarily unavailable for maintenance. Please try again in a few minutes.`;

    default:
      return `The ${serviceName} service is currently experiencing issues. Please try again later.`;
  }
}

/**
 * Get user-friendly service name for display
 * @param {string} serviceContext - The service context identifier
 * @returns {string} - Display name for the service
 */
function getServiceDisplayName(serviceContext) {
  // Use switch statement to prevent object injection
  switch (serviceContext) {
    case 'weather':
      return 'Weather';
    case 'auth':
      return 'Authentication';
    default:
      return 'requested';
  }
}

/**
 * Sanitize request path for security - remove sensitive information
 * @param {string} path - The original request path
 * @returns {string} - Sanitized path safe for client exposure
 */
function sanitizePath(path) {
  if (!path) return 'unknown';

  // Remove query parameters that might contain sensitive data
  const pathWithoutQuery = path.split('?')[0];

  // Replace dynamic segments with generic placeholders
  const sanitized = pathWithoutQuery
    .replace(/\/api\/v[0-9]+/g, '/api/*') // Version numbers
    .replace(
      /\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g,
      '/:id'
    ) // UUIDs
    .replace(/\/[0-9a-fA-F]{24}/g, '/:id') // MongoDB ObjectIds
    .replace(/\/[0-9]+/g, '/:id') // Numeric IDs
    .replace(/\/[a-zA-Z0-9_-]{10,}/g, '/:token') // Long alphanumeric strings (potential tokens)
    .replace(/\/auth\/[^/]+/g, '/auth/:authId') // Auth-specific paths
    .replace(/\/weather\/[^/]+/g, '/weather/:weatherId'); // Weather-specific paths

  // Limit path length to prevent information leakage
  const maxLength = 50;
  if (sanitized.length > maxLength) {
    return `${sanitized.substring(0, maxLength)}...`;
  }

  return sanitized;
}

/**
 * Generate a secure error reference ID for tracking
 * @returns {string} - Unique error reference ID
 */
function generateErrorReference() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `ERR_${timestamp}_${random}`.toUpperCase();
}

/**
 * Determine if error details should be exposed based on environment
 * @returns {boolean} - Whether to expose detailed error information
 */
function shouldExposeErrorDetails() {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' || env === 'test';
}

// Helper to generate error messages based on the error type
function generateErrorMessage(type, message, status = 400) {
  return {
    type,
    message,
    status
  };
}

const errorList = {
  BadRequest: generateErrorMessage(
    'BadRequest',
    'Oops! Something went wrong with your request. Please review your input and try again.'
  ),
  InvalidCountryCodeError: generateErrorMessage(
    'InvalidCountryCodeError',
    'Oops! The country code provided is invalid. Please make sure to enter a valid country code and try again.',
    400
  ),
  InvalidRegionIdError: generateErrorMessage(
    'InvalidRegionIdError',
    'Oops! The region ID provided is invalid. Please make sure to enter a valid region ID and try again.'
  ),
  InvalidSearchTermError: generateErrorMessage(
    'InvalidSearchTermError',
    'Oops! The search term provided is invalid. Please make sure to enter a valid search term and try again.'
  ),
  BulkWeatherArrayNotProvidedError: generateErrorMessage(
    'BulkWeatherArrayNotProvidedError',
    'Oops! It seems you forgot to provide the cities array in the request body. Please include the cities you want to search for in the request body and try again.',
    400
  ),
  NoCitiesProvidedError: generateErrorMessage(
    'NoCitiesProvidedError',
    'Oops! It seems you forgot to provide any cities in the request body. Please include at least one city in the cities array and try again.',
    400
  ),
  TooManyCitiesError: generateErrorMessage(
    'TooManyCitiesError',
    'Oops! You have exceeded the maximum number of cities allowed in the request body. Please limit your request to 20 cities and try again.',
    400
  ),
  UnauthorizedError: generateErrorMessage(
    'UnauthorizedError',
    'You are not authorized to perform this action. Please make sure you have the necessary permissions.',
    401
  ),
  CORSDeniedError: generateErrorMessage(
    'CORSDeniedError',
    'The request has been blocked by CORS policy. Please enable CORS on the server.',
    403
  ),
  RegionNotFoundError: generateErrorMessage(
    'RegionNotFoundError',
    "We couldn't find the region you're looking for. Please check the region details.",
    404
  ),
  TimeoutError: generateErrorMessage(
    'TimeoutError',
    'Oops! The request has timed out. Please try again later.',
    408
  ),
  TooManyRequestsError: generateErrorMessage(
    'TooManyRequestsError',
    'You have exceeded the rate limit. Please try again later.',
    429
  ),
  ServiceUnavailableError: generateErrorMessage(
    'ServiceUnavailableError',
    'The service is currently unavailable. Please try again later.',
    503
  ),
  ECONNREFUSED: generateErrorMessage(
    'ECONNREFUSED',
    'The service is currently unavailable. Please try again later.',
    503
  ),
  ECONNABORTED: generateErrorMessage(
    'ECONNABORTED',
    'The service is taking too long to respond. Please try again later.',
    503
  ),
  EOPENBREAKER: generateErrorMessage(
    'EOPENBREAKER',
    'The service is currently unavailable. Please try again later.',
    503
  ),
  ENETUNREACH: generateErrorMessage(
    'ENETUNREACH',
    'Network is unreachable. Please check your connection and try again.',
    503
  ),
  EHOSTUNREACH: generateErrorMessage(
    'EHOSTUNREACH',
    'The service host is unreachable. Please try again later.',
    503
  ),
  ENOTFOUND: generateErrorMessage(
    'ENOTFOUND',
    'Service endpoint not found. This might be a configuration issue.',
    503
  )
};

// Parse error by checking predefined error messages or handling network errors
function parseError(error) {
  // Check if the error exists in the predefined errors
  if (errorList[error?.error || error]) {
    return errorList[error?.error || error];
  }

  return {
    message:
      "Apologies! Something unexpected happened on our end. We're working to fix it. Please try again later.",
    status: 500
  };
}

function getError(error) {
  if (error?.code && isNetworkError(error.code)) {
    return error.code;
  } else if (error.response) {
    let currentError = error.response;
    while (currentError.response) {
      if (currentError?.response) currentError = currentError.response;
    }
    if (currentError?.data?.code && isNetworkError(currentError.data.code)) {
      return currentError;
    }
    return error.response?.data?.error?.error || error.response?.data?.error;
  } else {
    return error.message;
  }
}

// Main error handler
const errorHandler = (err, req, res, _next) => {
  const error = getError(err);
  const msg = parseError(error);
  const errorRef = generateErrorReference();
  const isDevMode = shouldExposeErrorDetails();

  if (msg.type === errorList.TooManyRequestsError.type) {
    msg.message = `
    You have exceeded the rate limit. Please try again in 
    ${res.get('Retry-After') || 1} seconds.`;
  }

  // Enhanced network error handling with request context
  if (isNetworkError(error?.error || error?.code || error)) {
    // Create enhanced error object with context
    const enhancedError = {
      error: error?.error || error?.code || error,
      code: error?.code || error,
      serviceContext: error?.serviceContext,
      baseURL: error?.baseURL || err?.config?.baseURL,
      originalError: err
    };

    msg.message = handleNetworkError(enhancedError, req);
    msg.status = 503; // Service Unavailable
  }

  // Build secure error response
  const errorResponse = {
    error: {
      type: msg.type || 'UnknownError',
      message: msg.message,
      reference: errorRef,
      timestamp: new Date().toISOString()
    }
  };

  // Only include path and additional details in development mode
  if (isDevMode) {
    errorResponse.error.path = sanitizePath(req?.path || req?.url);
    errorResponse.error.method = req?.method;

    // Include stack trace only in development
    if (err?.stack) {
      errorResponse.error.stack = err.stack;
    }
  }

  // Log error details for internal monitoring (always log regardless of environment)
  logger.error(`[${errorRef}] Error:`, {
    type: msg.type,
    message: msg.message,
    path: req?.path || req?.url,
    method: req?.method,
    userAgent: req?.get('User-Agent'),
    ip: req?.ip || req?.connection?.remoteAddress,
    stack: err?.stack
  });

  res.status(msg.status).json(errorResponse);
};

export default errorHandler;
