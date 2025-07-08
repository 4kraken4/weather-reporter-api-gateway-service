import helmet from 'helmet';

import Config from '../../config/Config.js';

const cspProd = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'sha256-BeXIQk2DxxoDrgnnoH683KOnlwQvO0HH1fT4VFQTi8g='"],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for Swagger UI - more secure than dynamic unsafe-hashes
      "'sha256-ezdv1bOGcoOD7FKudKN0Y2Mb763O6qVtM8LT2mtanIU='",
      "'sha256-/jDKvbQ8cdux+c5epDIqkjHbXDaIY8RucT1PmAe8FG4='",
      "'sha256-RL3ie0nH+Lzz2YNqQN83mnU0J1ot4QL7b99vMdIX99w='",
      "'sha256-BeXIQk2DxxoDrgnnoH683KOnlwQvO0HH1fT4VFQTi8g='"
    ],
    imgSrc: [
      "'self'",
      'data:',
      'https://openweathermap.org', // Weather icons
      'https://cdn.weatherapi.com', // Weather API images
      'https://www.weatherapi.com' // Alternative weather images
    ],
    connectSrc: [
      "'self'",
      'https://api.openweathermap.org', // Weather API
      'https://api.weatherapi.com', // Alternative weather API
      'wss://localhost:*', // Local WebSocket connections
      'ws://localhost:*' // Local WebSocket connections (dev)
    ],
    fontSrc: [
      "'self'",
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'data:'
    ],
    objectSrc: ["'none'"],
    baseUri: ["'self'"], // Prevents <base> tag manipulation
    formAction: ["'self'"], // Restricts form submission targets
    frameAncestors: ["'none'"], // Prevents embedding in frames
    manifestSrc: ["'self'"], // Controls web app manifest
    workerSrc: ["'self'"], // Controls web workers
    upgradeInsecureRequests: [],
    reportUri: ['/api/v1/security/csp-report'] // CSP violation reporting
  }
};

const configureHelmet = app => {
  const config = Config.getInstance();
  const env = config?.service?.env || 'development';

  app.use(
    helmet({
      contentSecurityPolicy:
        env === 'production'
          ? cspProd
          : {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // More permissive for development
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
            },
      maxContentLength: 50000000, // 50MB - more reasonable for API responses
      dnsPrefetchControl: { allow: false },
      expectCt:
        env === 'production'
          ? {
              maxAge: 86400,
              enforce: true,
              reportUri: '/api/v1/security/ct-report' // Use relative path to your own endpoint
            }
          : false,
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts:
        env === 'production'
          ? {
              maxAge: 31536000, // 1 year in seconds
              includeSubDomains: true,
              preload: true
            }
          : false, // Don't enforce HSTS in development
      ieNoOpen: true,
      noSniff: true,
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' }, // More balanced than 'no-referrer'
      xssFilter: true
    })
  );
};

export default configureHelmet;
