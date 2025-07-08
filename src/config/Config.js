import dotenv from 'dotenv';

export default class Config {
  constructor() {
    // Load environment variables - handle different environments
    try {
      dotenv.config({ path: 'src/.env' });
      const env = process.env.NODE_ENV || 'development';
      console.log(`Loading environment: ${env}`); // eslint-disable-line no-console
      dotenv.config({ path: `src/.env.${env}` });
    } catch (error) {
      console.warn('Could not load .env files:', error.message); // eslint-disable-line no-console
    }
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
      weather: {
        port: process.env.WEATHER_SERVICE_PORT,
        name: process.env.WEATHER_SERVICE_NAME || 'weather',
        host: process.env.WEATHER_SERVICE_HOST,
        protocol: process.env.WEATHER_SERVICE_PROTOCOL,
        routePrefix: process.env.WEATHER_SERVICE_ROUTE_PREFIX || 'api/v1'
      }
    };
  }

  get cache() {
    return {
      strategy: process.env.CACHE_STRATEGY || 'memory', // 'memory' or 'redis'
      defaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL, 10) || 300000, // 5 minutes
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        database: parseInt(process.env.REDIS_DATABASE, 10) || 0,
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'weather:',
        retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY, 10) || 100,
        enableReadyCheck: process.env.REDIS_ENABLE_READY_CHECK !== 'false',
        maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES, 10) || 3
      }
    };
  }

  get logging() {
    return {
      level: process.env.LOG_LEVEL || 'info', // debug, info, warn, error
      enabledInProduction: process.env.LOG_ENABLED_IN_PROD !== 'false',
      format: process.env.LOG_FORMAT || 'simple' // simple, json (for future extensibility)
    };
  }
}
