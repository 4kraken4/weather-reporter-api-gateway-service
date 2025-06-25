import Config from '../config/Config.js';
import WeatherProxy from '../infrastructure/proxies/WeatherProxy.js';
import { getCircuitBreakerInstance } from '../utils/CircuiteBreaker.js';

const weatherController = {
  search: async (req, res, next) => {
    try {
      const breaker = getCircuitBreakerInstance(
        WeatherProxy.search,
        Config.getInstance().services.weather.name
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
        Config.getInstance().services.weather.name
      );
      const response = await breaker.fire(req);
      res.status(200).json(response.data);
    } catch (error) {
      console.error('Error in /current/:id:', error);
      next(error);
    }
  },
  getWeatherByCityName: async (req, res, next) => {
    try {
      const breaker = getCircuitBreakerInstance(
        WeatherProxy.getWeatherByCityName,
        Config.getInstance().services.weather.name
      );
      const response = await breaker.fire(req);
      res.status(200).json(response.data);
    } catch (error) {
      console.error('Error in /current/:id:', error);
      next(error);
    }
  }
};

export default weatherController;
