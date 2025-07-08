/* eslint-disable no-undef */
import dotenv from 'dotenv';

export default class Config {
  constructor() {
    dotenv.config({ path: 'src/.env' });
    const env = process.env.NODE_ENV || 'development';
    console.log(`Loading environment: ${env}`); // eslint-disable-line no-console
    dotenv.config({ path: `src/.env.${env}` });
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new Config();
    }
    return this.instance;
  }

  get app() {
    return {
      name: process.env.APP_NAME || 'weather-reporter',
      swaggerUrl: process.env.APP_SWAGGER_URL || '/swagger',
      healthUrl: process.env.APP_HEALTH_URL || '/health'
    };
  }

  get service() {
    return {
      env: process.env.NODE_ENV || 'development',
      version: process.env.SERVICE_VERSION || '1.0.0',
      port: process.env.SERVICE_PORT || 9000,
      routePrefix: process.env.SERVICE_ROUTE_PREFIX || 'api/v1',
      protocol: process.env.SERVICE_PROTOCOL || 'http',
      host: process.env.SERVICE_HOST || 'localhost',
      name: process.env.SERVICE_NAME || 'api-gateway',
      certPath: process.env.SERVER_CERT_PATH || '',
      requestLimit: process.env.SERVICE_REQUESTS_LIMIT || 100,
      requestLimitTime: process.env.SERVICE_REQUESTS_LIMIT_WINDOW_S || 45,
      requestBlockDuration: process.env.SERVICE_REQUESTS_BLOCK_DURATION_S || 60,
      slidingWindow: process.env.SERVICE_REQUESTS_SLIDING_WINDOW_S || 'false'
    };
  }

  get client() {
    return {
      port: process.env.CLIENT_PORT,
      host: process.env.CLIENT_HOST,
      protocol: process.env.CLIENT_PROTOCOL,
      url: process.env.CLIENT_URL
    };
  }

  get services() {
    return {
      user: {
        port: process.env.USER_SERVICE_PORT,
        name: process.env.USER_SERVICE_NAME,
        host: process.env.USER_SERVICE_HOST,
        protocol: process.env.MOVIE_SERVICE_PROTOCOL,
        routePrefix: process.env.MOVIE_SERVICE_ROUTE_PREFIX
      },
      authentication: {
        port: process.env.AUTH_SERVICE_PORT,
        name: process.env.AUTH_SERVICE_NAME,
        host: process.env.AUTH_SERVICE_HOST,
        protocol: process.env.AUTH_SERVICE_PROTOCOL,
        routePrefix: process.env.AUTH_SERVICE_ROUTE_PREFIX
      },
      product: {
        port: process.env.PRODUCT_SERVICE_PORT,
        name: process.env.PRODUCT_SERVICE_NAME,
        host: process.env.PRODUCT_SERVICE_HOST,
        protocol: process.env.PRODUCT_SERVICE_PROTOCOL,
        routePrefix: process.env.PRODUCT_SERVICE_ROUTE_PREFIX
      },
      weather: {
        port: process.env.WEATHER_SERVICE_PORT,
        name: process.env.WEATHER_SERVICE_NAME || 'weather',
        host: process.env.WEATHER_SERVICE_HOST,
        protocol: process.env.WEATHER_SERVICE_PROTOCOL,
        routePrefix: process.env.WEATHER_SERVICE_ROUTE_PREFIX || 'api/v1'
      }
    };
  }

  get db() {
    return {
      redis: {
        enabled: process.env.REDIS_ENABLED,
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
      }
    };
  }
}
