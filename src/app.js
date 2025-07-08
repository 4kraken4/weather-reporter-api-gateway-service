import express from 'express';

import Config from './config/Config.js';
import swaggerDocs from './config/swagger.js';
import logger from './infrastructure/logger/logger.js';
import corsMiddleware from './infrastructure/middleware/cors.js';
import errorHandler from './infrastructure/middleware/errorHandler.js';
// import configureHelmet from './infrastructure/middleware/helmet.js';
import { rateLimiterMiddleware } from './infrastructure/middleware/ratelimit.js';
import router from './interfaces/http/routes/index.js';

const app = express();

app.disable('x-powered-by');
app.disable('etag');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// configureHelmet(app);
app.use(logger);
app.use(rateLimiterMiddleware);
app.use(corsMiddleware);
app.use(`/${Config.getInstance().service.routePrefix}`, router);
app.use(errorHandler);
swaggerDocs(app);

export default app;
