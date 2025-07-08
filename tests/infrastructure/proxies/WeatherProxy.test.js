import Config from '../../../src/config/Config.js';
import WeatherProxy from '../../../src/infrastructure/proxies/WeatherProxy.js';
import HttpClient from '../../../src/interfaces/http/HttpClient.js';
import UrlUtils from '../../../src/utils/UrlUtils.js';

// Mock dependencies
jest.mock('../../../src/config/Config.js');
jest.mock('../../../src/interfaces/http/HttpClient.js');
jest.mock('../../../src/utils/UrlUtils.js');

describe('WeatherProxy', () => {
  let mockConfig;
  let mockHttpClient;
  let mockUrlUtils;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock Config.getInstance()
    mockConfig = {
      services: {
        weather: {
          protocol: 'http',
          host: 'localhost',
          port: 9001,
          name: 'weather',
          routePrefix: 'api/v1'
        }
      }
    };
    Config.getInstance = jest.fn().mockReturnValue(mockConfig);

    // Mock HttpClient instance
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn()
    };
    HttpClient.mockImplementation(() => mockHttpClient);

    // Mock UrlUtils static methods
    mockUrlUtils = {
      buildServiceBaseUrl: jest.fn().mockReturnValue('http://localhost:9001/api/v1/weather'),
      buildEndpointUrl: jest.fn()
    };
    UrlUtils.buildServiceBaseUrl = mockUrlUtils.buildServiceBaseUrl;
    UrlUtils.buildEndpointUrl = mockUrlUtils.buildEndpointUrl;

    // Clear static properties
    WeatherProxy._services = null;
    WeatherProxy._httpClient = null;
  });

  describe('Static Property Management', () => {
    describe('getServices', () => {
      it('should return services configuration from Config', () => {
        const services = WeatherProxy.getServices();

        expect(Config.getInstance).toHaveBeenCalled();
        expect(services).toBe(mockConfig.services);
      });

      it('should cache services configuration on subsequent calls', () => {
        WeatherProxy.getServices();
        WeatherProxy.getServices();

        expect(Config.getInstance).toHaveBeenCalledTimes(1);
      });
    });

    describe('getBaseUrl', () => {
      it('should build base URL using UrlUtils', () => {
        const baseUrl = WeatherProxy.getBaseUrl();

        expect(UrlUtils.buildServiceBaseUrl).toHaveBeenCalledWith(
          mockConfig.services.weather,
          true
        );
        expect(baseUrl).toBe('http://localhost:9001/api/v1/weather');
      });
    });

    describe('getHttpClient', () => {
      it('should create HTTP client with base URL', () => {
        const httpClient = WeatherProxy.getHttpClient();

        expect(HttpClient).toHaveBeenCalledWith('http://localhost:9001/api/v1/weather');
        expect(httpClient).toBe(mockHttpClient);
      });

      it('should cache HTTP client instance on subsequent calls', () => {
        WeatherProxy.getHttpClient();
        WeatherProxy.getHttpClient();

        expect(HttpClient).toHaveBeenCalledTimes(1);
      });
    });

    describe('buildEndpointUrl', () => {
      it('should build endpoint URL using UrlUtils', () => {
        const endpoint = '/search';
        const params = { query: 'London' };
        const expectedUrl = 'http://localhost:9001/api/v1/weather/search?query=London';

        mockUrlUtils.buildEndpointUrl.mockReturnValue(expectedUrl);

        const result = WeatherProxy.buildEndpointUrl(endpoint, params);

        expect(UrlUtils.buildEndpointUrl).toHaveBeenCalledWith(
          'http://localhost:9001/api/v1/weather',
          endpoint,
          params
        );
        expect(result).toBe(expectedUrl);
      });

      it('should build endpoint URL without params', () => {
        const endpoint = '/current/123';
        const expectedUrl = 'http://localhost:9001/api/v1/weather/current/123';

        mockUrlUtils.buildEndpointUrl.mockReturnValue(expectedUrl);

        const result = WeatherProxy.buildEndpointUrl(endpoint);

        expect(UrlUtils.buildEndpointUrl).toHaveBeenCalledWith(
          'http://localhost:9001/api/v1/weather',
          endpoint,
          null
        );
        expect(result).toBe(expectedUrl);
      });
    });
  });

  describe('Error Enhancement', () => {
    it('should enhance error with service context', () => {
      const originalError = new Error('Test error');
      const operation = 'weather_search';

      const enhancedError = WeatherProxy.enhanceError(originalError, operation);

      expect(enhancedError).toBe(originalError);
      expect(enhancedError.serviceContext).toBe('weather');
      expect(enhancedError.operation).toBe(operation);
      expect(enhancedError.serviceName).toBe('Weather Service');
    });

    it('should handle null error gracefully', () => {
      const result = WeatherProxy.enhanceError(null, 'test_operation');
      expect(result).toBeNull();
    });

    it('should handle undefined error gracefully', () => {
      const result = WeatherProxy.enhanceError(undefined, 'test_operation');
      expect(result).toBeUndefined();
    });
  });

  describe('Weather Service Methods', () => {
    describe('search', () => {
      it('should search weather data successfully', async () => {
        const mockRequest = {
          query: {
            query: 'London',
            limit: 10
          }
        };
        const mockResponse = {
          data: {
            success: true,
            data: [
              { id: '123', name: 'London', country: 'UK' }
            ]
          }
        };

        mockHttpClient.get.mockResolvedValue(mockResponse);

        const result = await WeatherProxy.search(mockRequest);

        expect(mockHttpClient.get).toHaveBeenCalledWith('/search', {
          params: mockRequest.query
        });
        expect(result).toBe(mockResponse.data);
      });

      it('should enhance error when search fails', async () => {
        const mockRequest = { query: { query: 'London' } };
        const mockError = new Error('Network error');

        mockHttpClient.get.mockRejectedValue(mockError);

        await expect(WeatherProxy.search(mockRequest)).rejects.toMatchObject({
          message: 'Network error',
          serviceContext: 'weather',
          operation: 'weather_search',
          serviceName: 'Weather Service'
        });

        expect(mockHttpClient.get).toHaveBeenCalledWith('/search', {
          params: mockRequest.query
        });
      });
    });

    describe('getWeatherByCity', () => {
      it('should get weather by city ID successfully', async () => {
        const mockRequest = {
          params: {
            cityId: '123'
          }
        };
        const mockResponse = {
          data: {
            success: true,
            data: {
              id: '123',
              name: 'London',
              weather: { temperature: 20, conditions: 'Sunny' }
            }
          }
        };

        mockHttpClient.get.mockResolvedValue(mockResponse);

        const result = await WeatherProxy.getWeatherByCity(mockRequest);

        expect(mockHttpClient.get).toHaveBeenCalledWith('/current/123');
        expect(result).toBe(mockResponse.data);
      });

      it('should throw error when city ID is missing', async () => {
        const mockRequest = {
          params: {}
        };

        await expect(WeatherProxy.getWeatherByCity(mockRequest)).rejects.toMatchObject({
          message: 'City ID is required',
          serviceContext: 'weather',
          operation: 'weather_by_city_id',
          serviceName: 'Weather Service'
        });

        expect(mockHttpClient.get).not.toHaveBeenCalled();
      });

      it('should throw error when city ID is null', async () => {
        const mockRequest = {
          params: {
            cityId: null
          }
        };

        await expect(WeatherProxy.getWeatherByCity(mockRequest)).rejects.toMatchObject({
          message: 'City ID is required',
          serviceContext: 'weather',
          operation: 'weather_by_city_id',
          serviceName: 'Weather Service'
        });

        expect(mockHttpClient.get).not.toHaveBeenCalled();
      });

      it('should throw error when city ID is empty string', async () => {
        const mockRequest = {
          params: {
            cityId: ''
          }
        };

        await expect(WeatherProxy.getWeatherByCity(mockRequest)).rejects.toMatchObject({
          message: 'City ID is required',
          serviceContext: 'weather',
          operation: 'weather_by_city_id',
          serviceName: 'Weather Service'
        });

        expect(mockHttpClient.get).not.toHaveBeenCalled();
      });

      it('should enhance error when HTTP request fails', async () => {
        const mockRequest = {
          params: {
            cityId: '123'
          }
        };
        const mockError = new Error('Service unavailable');

        mockHttpClient.get.mockRejectedValue(mockError);

        await expect(WeatherProxy.getWeatherByCity(mockRequest)).rejects.toMatchObject({
          message: 'Service unavailable',
          serviceContext: 'weather',
          operation: 'weather_by_city_id',
          serviceName: 'Weather Service'
        });

        expect(mockHttpClient.get).toHaveBeenCalledWith('/current/123');
      });
    });

    describe('getWeatherByCityName', () => {
      it('should get weather by city name successfully', async () => {
        const mockRequest = {
          query: {
            city: 'London',
            ccode: 'UK'
          }
        };
        const mockResponse = {
          data: {
            success: true,
            data: {
              name: 'London',
              country: 'UK',
              weather: { temperature: 18, conditions: 'Cloudy' }
            }
          }
        };

        mockHttpClient.get.mockResolvedValue(mockResponse);

        const result = await WeatherProxy.getWeatherByCityName(mockRequest);

        expect(mockHttpClient.get).toHaveBeenCalledWith('/current', {
          params: {
            region: 'London',
            code: 'UK'
          }
        });
        expect(result).toBe(mockResponse.data);
      });

      it('should handle missing city code', async () => {
        const mockRequest = {
          query: {
            city: 'London'
            // ccode is missing
          }
        };
        const mockResponse = {
          data: {
            success: true,
            data: { name: 'London', weather: { temperature: 18 } }
          }
        };

        mockHttpClient.get.mockResolvedValue(mockResponse);

        const result = await WeatherProxy.getWeatherByCityName(mockRequest);

        expect(mockHttpClient.get).toHaveBeenCalledWith('/current', {
          params: {
            region: 'London',
            code: undefined
          }
        });
        expect(result).toBe(mockResponse.data);
      });

      it('should enhance error when request fails', async () => {
        const mockRequest = {
          query: {
            city: 'London',
            ccode: 'UK'
          }
        };
        const mockError = new Error('Invalid city name');

        mockHttpClient.get.mockRejectedValue(mockError);

        await expect(WeatherProxy.getWeatherByCityName(mockRequest)).rejects.toMatchObject({
          message: 'Invalid city name',
          serviceContext: 'weather',
          operation: 'weather_by_city_name',
          serviceName: 'Weather Service'
        });

        expect(mockHttpClient.get).toHaveBeenCalledWith('/current', {
          params: {
            region: 'London',
            code: 'UK'
          }
        });
      });
    });

    describe('getBulkWeather', () => {
      it('should get bulk weather data successfully', async () => {
        const mockRequest = {
          body: {
            cities: [
              { name: 'London', country: 'UK' },
              { name: 'Paris', country: 'FR' },
              { id: '123' }
            ]
          }
        };
        const mockResponse = {
          data: {
            success: true,
            data: {
              London: { temperature: 20, conditions: 'Sunny' },
              Paris: { temperature: 15, conditions: 'Rainy' },
              '123': { temperature: 25, conditions: 'Clear' }
            }
          }
        };

        mockHttpClient.post.mockResolvedValue(mockResponse);

        const result = await WeatherProxy.getBulkWeather(mockRequest);

        expect(mockHttpClient.post).toHaveBeenCalledWith('/bulk', mockRequest.body);
        expect(result).toBe(mockResponse.data);
      });

      it('should handle empty cities array', async () => {
        const mockRequest = {
          body: {
            cities: []
          }
        };
        const mockResponse = {
          data: {
            success: true,
            data: {}
          }
        };

        mockHttpClient.post.mockResolvedValue(mockResponse);

        const result = await WeatherProxy.getBulkWeather(mockRequest);

        expect(mockHttpClient.post).toHaveBeenCalledWith('/bulk', mockRequest.body);
        expect(result).toBe(mockResponse.data);
      });

      it('should enhance error when bulk request fails', async () => {
        const mockRequest = {
          body: {
            cities: [
              { name: 'London', country: 'UK' }
            ]
          }
        };
        const mockError = new Error('Bulk operation failed');

        mockHttpClient.post.mockRejectedValue(mockError);

        await expect(WeatherProxy.getBulkWeather(mockRequest)).rejects.toMatchObject({
          message: 'Bulk operation failed',
          serviceContext: 'weather',
          operation: 'bulk_weather',
          serviceName: 'Weather Service'
        });

        expect(mockHttpClient.post).toHaveBeenCalledWith('/bulk', mockRequest.body);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should use lazy loading for all dependencies', async () => {
      // Ensure clean state
      WeatherProxy._services = null;
      WeatherProxy._httpClient = null;

      const mockRequest = { query: { query: 'London' } };
      const mockResponse = { data: { success: true, data: [] } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      await WeatherProxy.search(mockRequest);

      // Verify that dependencies are initialized lazily
      expect(Config.getInstance).toHaveBeenCalled();
      expect(UrlUtils.buildServiceBaseUrl).toHaveBeenCalled();
      expect(HttpClient).toHaveBeenCalled();
    });

    it('should maintain singleton pattern for HttpClient', async () => {
      const mockRequest1 = { query: { query: 'London' } };
      const mockRequest2 = { params: { cityId: '123' } };
      const mockResponse = { data: { success: true, data: {} } };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      await WeatherProxy.search(mockRequest1);
      await WeatherProxy.getWeatherByCity(mockRequest2);

      // HttpClient should only be created once
      expect(HttpClient).toHaveBeenCalledTimes(1);
    });

    it('should use consistent base URL across all methods', () => {
      WeatherProxy.getBaseUrl();
      WeatherProxy.getHttpClient();
      WeatherProxy.buildEndpointUrl('/test');

      // UrlUtils.buildServiceBaseUrl should be called for each base URL request
      expect(UrlUtils.buildServiceBaseUrl).toHaveBeenCalledWith(
        mockConfig.services.weather,
        true
      );
    });
  });

  describe('Error Scenarios', () => {
    it('should handle Config.getInstance() failure gracefully', () => {
      Config.getInstance.mockImplementation(() => {
        throw new Error('Config initialization failed');
      });

      expect(() => WeatherProxy.getServices()).toThrow('Config initialization failed');
    });

    it('should handle UrlUtils.buildServiceBaseUrl failure', () => {
      UrlUtils.buildServiceBaseUrl.mockImplementation(() => {
        throw new Error('URL building failed');
      });

      expect(() => WeatherProxy.getBaseUrl()).toThrow('URL building failed');
    });

    it('should handle HttpClient instantiation failure', () => {
      HttpClient.mockImplementation(() => {
        throw new Error('HTTP client creation failed');
      });

      expect(() => WeatherProxy.getHttpClient()).toThrow('HTTP client creation failed');
    });
  });

  describe('Request Parameter Validation', () => {
    it('should handle valid request objects gracefully', async () => {
      const mockResponse = { data: { success: true, data: [] } };
      mockHttpClient.get.mockResolvedValue(mockResponse);
      mockHttpClient.post.mockResolvedValue(mockResponse);

      // Valid requests should work
      await expect(WeatherProxy.search({ query: { query: 'test' } })).resolves.toBeDefined();
      await expect(WeatherProxy.getWeatherByCityName({ query: { city: 'London' } })).resolves.toBeDefined();
      await expect(WeatherProxy.getBulkWeather({ body: { cities: [] } })).resolves.toBeDefined();
    });

    it('should handle request object with empty but defined properties', async () => {
      const mockResponse = { data: { success: true, data: [] } };
      mockHttpClient.get.mockResolvedValue(mockResponse);
      mockHttpClient.post.mockResolvedValue(mockResponse);

      // Empty but defined properties should work
      await expect(WeatherProxy.search({ query: {} })).resolves.toBeDefined();
      await expect(WeatherProxy.getWeatherByCityName({ query: {} })).resolves.toBeDefined();
      await expect(WeatherProxy.getBulkWeather({ body: {} })).resolves.toBeDefined();
    });

    it('should throw errors for invalid request structures', async () => {
      // Missing query object should throw
      await expect(WeatherProxy.search({})).rejects.toThrow();
      await expect(WeatherProxy.getWeatherByCityName({})).rejects.toThrow();

      // Missing body object should throw
      await expect(WeatherProxy.getBulkWeather({})).rejects.toThrow();

      // Null request should throw
      await expect(WeatherProxy.search(null)).rejects.toThrow();
      await expect(WeatherProxy.getWeatherByCityName(null)).rejects.toThrow();
      await expect(WeatherProxy.getBulkWeather(null)).rejects.toThrow();
    });

    it('should handle undefined properties in valid request structures', async () => {
      const mockResponse = { data: { success: true, data: [] } };
      mockHttpClient.get.mockResolvedValue(mockResponse);
      mockHttpClient.post.mockResolvedValue(mockResponse);

      // Undefined values in defined structures should work
      await expect(WeatherProxy.search({ query: { query: undefined } })).resolves.toBeDefined();
      await expect(WeatherProxy.getWeatherByCityName({ query: { city: undefined, ccode: undefined } })).resolves.toBeDefined();
      await expect(WeatherProxy.getBulkWeather({ body: { cities: undefined } })).resolves.toBeDefined();
    });
  });
});
