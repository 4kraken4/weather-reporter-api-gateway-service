import Config from '../config/Config.js';
import WeatherProxy from '../infrastructure/proxies/WeatherProxy.js';
import { getCircuitBreakerInstance } from '../utils/CircuiteBreaker.js';
import { createModuleLogger } from '../utils/Logger.js';

const logger = createModuleLogger('Weather Controller');

const weatherController = {
  search: async (req, res, next) => {
    try {
      const breaker = getCircuitBreakerInstance(
        WeatherProxy.search,
        Config.getInstance().services.weather.name,
        'search'
      );
      const response = await breaker.fire(req);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
  getWeatherByCity: async (req, res, next) => {
    try {
      const breaker = getCircuitBreakerInstance(
        WeatherProxy.getWeatherByCity,
        Config.getInstance().services.weather.name,
        'getWeatherByCity'
      );
      const response = await breaker.fire(req);
      res.status(200).json(response.data);
    } catch (error) {
      logger.error('Error in /current/:id:', error);
      next(error);
    }
  },
  getWeatherByCityName: async (req, res, next) => {
    try {
      const breaker = getCircuitBreakerInstance(
        WeatherProxy.getWeatherByCityName,
        Config.getInstance().services.weather.name,
        'getWeatherByCityName'
      );
      const response = await breaker.fire(req);
      res.status(200).json(response.data);
    } catch (error) {
      logger.error('Error in /current/:id:', error);
      next(error);
    }
  },
  getBulkWeather: async (req, res, next) => {
    try {
      // Validate request body
      const { cities } = req.body;

      if (!cities) {
        return res.status(400).json({
          success: false,
          message: 'Cities array is required in request body'
        });
      }

      if (!Array.isArray(cities)) {
        return res.status(400).json({
          success: false,
          message: 'Cities must be an array'
        });
      }

      if (cities.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cities array cannot be empty'
        });
      }

      if (cities.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 50 cities allowed per request'
        });
      }

      const breaker = getCircuitBreakerInstance(
        WeatherProxy.getBulkWeather,
        Config.getInstance().services.weather.name,
        'getBulkWeather'
      );
      const response = await breaker.fire(req);
      res.status(200).json(response);
    } catch (error) {
      logger.error('Error in bulk weather endpoint:', error);
      next(error);
    }
  }
};

export default weatherController;
