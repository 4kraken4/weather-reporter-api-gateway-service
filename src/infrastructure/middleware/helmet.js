import helmet from 'helmet';

import Config from '../../config/Config.js';

const cspProd = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'sha256-BeXIQk2DxxoDrgnnoH683KOnlwQvO0HH1fT4VFQTi8g='"],
    styleSrc: [
      "'self'",
      (req, _res) => {
        if (req.path.includes(`/${Config.getInstance().app.swaggerUrl}`)) {
          return "'unsafe-hashes'";
        }
      },
      "'sha256-ezdv1bOGcoOD7FKudKN0Y2Mb763O6qVtM8LT2mtanIU='",
      "'sha256-/jDKvbQ8cdux+c5epDIqkjHbXDaIY8RucT1PmAe8FG4='",
      "'sha256-RL3ie0nH+Lzz2YNqQN83mnU0J1ot4QL7b99vMdIX99w='",
      "'sha256-BeXIQk2DxxoDrgnnoH683KOnlwQvO0HH1fT4VFQTi8g='"
    ],
    imgSrc: ["'self'", 'data:'],
    connectSrc: ["'self'"],
    fontSrc: ["'self'", 'https:', 'data:'],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: []
  }
};

const configureHelmet = app => {
  app.use(
    helmet({
      contentSecurityPolicy:
        Config.getInstance().service.env === 'production' ? cspProd : false,
      maxContentLength: 5000,
      dnsPrefetchControl: { allow: false },
      expectCt: {
        maxAge: 86400,
        enforce: true,
        reportUri: 'https://booknow.lk/report'
      },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true
      },
      ieNoOpen: true,
      noSniff: true,
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      referrerPolicy: { policy: 'no-referrer' },
      xssFilter: true
    })
  );
};

export default configureHelmet;
