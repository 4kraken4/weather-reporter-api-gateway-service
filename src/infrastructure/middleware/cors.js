import cors from 'cors';

import URL_WHITELIST from '../../interfaces/http/whitelist.js';

const sanitizedWhitelist = URL_WHITELIST.map(url => {
  // Ensure all URLs in the whitelist are strings and trimmed
  if (typeof url !== 'string') {
    throw new Error(`Invalid URL in whitelist: ${url}`);
  }

  // remove any leading or trailing special characters or spaces
  let sanitizedUrl = url;
  if (sanitizedUrl.startsWith('http://') || sanitizedUrl.startsWith('https://')) {
    sanitizedUrl = sanitizedUrl.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
  }

  if (process.env.NODE_ENV === 'production') {
    // In production, ensure URLs are absolute and start with http:// or https://
    if (!sanitizedUrl.startsWith('http://') && !sanitizedUrl.startsWith('https://')) {
      throw new Error(`Invalid URL in whitelist: ${sanitizedUrl}`);
    }
  } else {
    // In development, allow relative URLs or those starting with http:// or https://
    if (
      !sanitizedUrl.startsWith('http://') &&
      !sanitizedUrl.startsWith('https://') &&
      !sanitizedUrl.startsWith('/')
    ) {
      throw new Error(`Invalid URL in whitelist: ${sanitizedUrl}`);
    }
  }

  return sanitizedUrl.trim();
});

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (same-origin requests)
    if (!origin || sanitizedWhitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORSDeniedError'));
    }
  },
  optionsSuccessStatus: 200,
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-request-id',
    'x-request-timestamp'
  ],
  AccessControlAllowHeaders: ['x-request-timestamp', 'x-request-id'],
  credentials: true,
  maxAge: 3600, // 1 hour
  preflightContinue: false
};

const corsMiddleware = cors(corsOptions);

// Export the middleware with configuration for testing
corsMiddleware.configuration = corsOptions;

export default corsMiddleware;
