import cors from 'cors';

import URL_WHITELIST from '../../interfaces/http/whitelist.js';

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || URL_WHITELIST.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORSDeniedError'));
    }
  },
  optionsSuccessStatus: 200,
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 3600, // 1 hour
  preflightContinue: false
};

export default cors(corsOptions);
