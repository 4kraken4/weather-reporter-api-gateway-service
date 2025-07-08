import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import UrlUtils from '../utils/UrlUtils.js';

import Config from './Config.js';

const config = Config.getInstance();

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: `API Documentation | ${config.app.name} | ${config.service.env} Environment`,
      version: config.service.version,
      description: `API Documentation for ${config.app.name}`
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: config.service.env === 'development' ? 'http' : 'https',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/interfaces/http/routes/*.js'],
  servers: [
    {
      url: UrlUtils.buildServiceBaseUrl(config.service, false)
    }
  ]
};

const swaggerSpec = swaggerJsdoc(options);
const swaggerDocs = app => {
  app.use(
    `/${config.service.routePrefix}/${config.app.swaggerUrl}`,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
  );

  app.get(
    `/${config.service.routePrefix}/${config.app.swaggerUrl}.json`,
    (_req, res) => {
      res.redirect(
        301,
        `${config.service.protocol}://${config.service.host}:${config.service.port}/${config.service.routePrefix}/${config.app.swaggerUrl}`
      );
    }
  );
};

export default swaggerDocs;
