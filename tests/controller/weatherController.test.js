import { jest } from '@jest/globals';

// Mock all dependencies first
jest.mock('../../src/config/Config.js');
jest.mock('../../src/infrastructure/proxies/WeatherProxy.js');
jest.mock('../../src/utils/CircuiteBreaker.js');

// Import the modules we need to mock
import Config from '../../src/config/Config.js';
import weatherController from '../../src/controller/weatherController.js';
import WeatherProxy from '../../src/infrastructure/proxies/WeatherProxy.js';
import { getCircuitBreakerInstance } from '../../src/utils/CircuiteBreaker.js';

// Setup mocks after imports
const mockConfigInstance = {
  services: {
    weather: {
      name: 'weather-service',
      protocol: 'http',
      host: 'localhost',
      port: 9002,
      routePrefix: 'api/v1'
    }
  }
};

Config.getInstance = jest.fn(() => mockConfigInstance);
Config.instance = mockConfigInstance;

const mockWeatherProxy = {
  search: jest.fn(),
  getWeatherByCity: jest.fn(),
  getWeatherByCityName: jest.fn(),
  getBulkWeather: jest.fn()
};

WeatherProxy.search = mockWeatherProxy.search;
WeatherProxy.getWeatherByCity = mockWeatherProxy.getWeatherByCity;
WeatherProxy.getWeatherByCityName = mockWeatherProxy.getWeatherByCityName;
WeatherProxy.getBulkWeather = mockWeatherProxy.getBulkWeather;

const mockCircuitBreaker = {
  fire: jest.fn()
};

getCircuitBreakerInstance.mockImplementation(() => mockCircuitBreaker);

// Import the controller after setting up mocks

describe('Weather Controller', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      query: {},
      params: {},
      body: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('search', () => {
    it('should successfully search for weather data', async () => {
      const mockWeatherData = {
        locations: [
          { id: 1, name: 'London', temp: 15 },
          { id: 2, name: 'London City', temp: 14 }
        ],
        total: 2,
        page: 1,
        pageSize: 5
      };

      mockReq.query = { q: 'London', page: '1', pageSize: '5' };
      mockCircuitBreaker.fire.mockResolvedValue(mockWeatherData);

      await weatherController.search(mockReq, mockRes, mockNext);

      expect(getCircuitBreakerInstance).toHaveBeenCalledWith(
        mockWeatherProxy.search,
        'weather-service',
        'search'
      );
      expect(mockCircuitBreaker.fire).toHaveBeenCalledWith(mockReq);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockWeatherData);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle search errors', async () => {
      const mockError = new Error('Search failed');
      mockReq.query = { q: 'InvalidCity' };
      mockCircuitBreaker.fire.mockRejectedValue(mockError);

      await weatherController.search(mockReq, mockRes, mockNext);

      expect(getCircuitBreakerInstance).toHaveBeenCalledWith(
        mockWeatherProxy.search,
        'weather-service',
        'search'
      );
      expect(mockCircuitBreaker.fire).toHaveBeenCalledWith(mockReq);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('getWeatherByCity', () => {
    it('should successfully get weather by city ID', async () => {
      const mockWeatherData = {
        data: {
          id: 123,
          name: 'London',
          temperature: 15,
          conditions: 'Partly cloudy'
        }
      };

      mockReq.params = { cityId: '123' };
      mockCircuitBreaker.fire.mockResolvedValue(mockWeatherData);

      await weatherController.getWeatherByCity(mockReq, mockRes, mockNext);

      expect(getCircuitBreakerInstance).toHaveBeenCalledWith(
        mockWeatherProxy.getWeatherByCity,
        'weather-service',
        'getWeatherByCity'
      );
      expect(mockCircuitBreaker.fire).toHaveBeenCalledWith(mockReq);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockWeatherData.data);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle errors and log them', async () => {
      const mockError = new Error('City not found');
      mockReq.params = { cityId: '999' };
      mockCircuitBreaker.fire.mockRejectedValue(mockError);

      await weatherController.getWeatherByCity(mockReq, mockRes, mockNext);

      expect(getCircuitBreakerInstance).toHaveBeenCalledWith(
        mockWeatherProxy.getWeatherByCity,
        'weather-service',
        'getWeatherByCity'
      );
      expect(mockCircuitBreaker.fire).toHaveBeenCalledWith(mockReq);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in /current/:id:'),
        mockError
      );
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getWeatherByCityName', () => {
    it('should successfully get weather by city name and country code', async () => {
      const mockWeatherData = {
        data: {
          name: 'London',
          country: 'UK',
          temperature: 18,
          conditions: 'Sunny'
        }
      };

      mockReq.query = { city: 'London', ccode: 'UK' };
      mockCircuitBreaker.fire.mockResolvedValue(mockWeatherData);

      await weatherController.getWeatherByCityName(mockReq, mockRes, mockNext);

      expect(getCircuitBreakerInstance).toHaveBeenCalledWith(
        mockWeatherProxy.getWeatherByCityName,
        'weather-service',
        'getWeatherByCityName'
      );
      expect(mockCircuitBreaker.fire).toHaveBeenCalledWith(mockReq);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockWeatherData.data);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle errors and log them', async () => {
      const mockError = new Error('City name not found');
      mockReq.query = { city: 'InvalidCity', ccode: 'XX' };
      mockCircuitBreaker.fire.mockRejectedValue(mockError);

      await weatherController.getWeatherByCityName(mockReq, mockRes, mockNext);

      expect(getCircuitBreakerInstance).toHaveBeenCalledWith(
        mockWeatherProxy.getWeatherByCityName,
        'weather-service',
        'getWeatherByCityName'
      );
      expect(mockCircuitBreaker.fire).toHaveBeenCalledWith(mockReq);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in /current/:id:'),
        mockError
      );
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getBulkWeather', () => {
    it('should successfully get bulk weather data', async () => {
      const mockWeatherData = {
        results: [
          { city: 'London', temperature: 15 },
          { city: 'Paris', temperature: 18 }
        ]
      };

      mockReq.body = {
        cities: [
          { name: 'London', countryCode: 'UK' },
          { name: 'Paris', countryCode: 'FR' }
        ]
      };
      mockCircuitBreaker.fire.mockResolvedValue(mockWeatherData);

      await weatherController.getBulkWeather(mockReq, mockRes, mockNext);

      expect(getCircuitBreakerInstance).toHaveBeenCalledWith(
        mockWeatherProxy.getBulkWeather,
        'weather-service',
        'getBulkWeather'
      );
      expect(mockCircuitBreaker.fire).toHaveBeenCalledWith(mockReq);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockWeatherData);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should validate cities array exists', async () => {
      mockReq.body = {}; // Missing cities array

      await weatherController.getBulkWeather(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cities array is required in request body'
      });
      expect(getCircuitBreakerInstance).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should validate cities array is not empty', async () => {
      mockReq.body = { cities: [] };

      await weatherController.getBulkWeather(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cities array cannot be empty'
      });
      expect(getCircuitBreakerInstance).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should validate cities array type', async () => {
      mockReq.body = { cities: 'not-an-array' };

      await weatherController.getBulkWeather(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cities must be an array'
      });
      expect(getCircuitBreakerInstance).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should validate cities array length limit', async () => {
      const largeCitiesArray = Array(51).fill({ name: 'City', countryCode: 'US' });
      mockReq.body = { cities: largeCitiesArray };

      await weatherController.getBulkWeather(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Maximum 50 cities allowed per request'
      });
      expect(getCircuitBreakerInstance).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle bulk weather service errors', async () => {
      const mockError = new Error('Bulk weather service unavailable');
      mockReq.body = {
        cities: [{ name: 'London', countryCode: 'UK' }]
      };
      mockCircuitBreaker.fire.mockRejectedValue(mockError);

      await weatherController.getBulkWeather(mockReq, mockRes, mockNext);

      expect(getCircuitBreakerInstance).toHaveBeenCalledWith(
        mockWeatherProxy.getBulkWeather,
        'weather-service',
        'getBulkWeather'
      );
      expect(mockCircuitBreaker.fire).toHaveBeenCalledWith(mockReq);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in bulk weather endpoint:'),
        mockError
      );
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
});
