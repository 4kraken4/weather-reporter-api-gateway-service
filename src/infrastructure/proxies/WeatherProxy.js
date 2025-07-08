import Config from '../../config/Config.js';
import HttpClient from '../../interfaces/http/HttpClient.js';
import UrlUtils from '../../utils/UrlUtils.js';

export default class WeatherProxy {
  /**
   * Get services configuration lazily
   * @returns {Object} - Services configuration
   */
  static getServices() {
    if (!this._services) {
      this._services = Config.getInstance().services;
    }
    return this._services;
  }

  /**
   * Construct base URL for weather service using URL utilities
   * @returns {string} - Properly formatted base URL
   */
  static getBaseUrl() {
    return UrlUtils.buildServiceBaseUrl(WeatherProxy.getServices().weather, true);
  }

  /**
   * Get HTTP client instance lazily
   * @returns {HttpClient} - HTTP client instance
   */
  static getHttpClient() {
    if (!this._httpClient) {
      this._httpClient = new HttpClient(WeatherProxy.getBaseUrl());
    }
    return this._httpClient;
  }

  /**
   * Construct a full URL for a specific endpoint
   * @param {string} endpoint - The endpoint path (e.g., '/search', '/current/123')
   * @param {Object} params - Query parameters to append
   * @returns {string} - Complete URL with query parameters
   */
  static buildEndpointUrl(endpoint, params = null) {
    return UrlUtils.buildEndpointUrl(WeatherProxy.getBaseUrl(), endpoint, params);
  }

  /**
   * Enhance error with service context for better error handling
   * @param {Error} error - Original error
   * @param {string} operation - The operation that failed
   * @returns {Error} - Enhanced error with service context
   */
  static enhanceError(error, operation) {
    if (error) {
      error.serviceContext = 'weather';
      error.operation = operation;
      error.serviceName = 'Weather Service';
    }
    return error;
  }

  static async search(req) {
    try {
      const response = await WeatherProxy.getHttpClient().get('/search', {
        params: req.query
      });
      return response.data;
    } catch (error) {
      throw WeatherProxy.enhanceError(error, 'weather_search');
    }
  }

  static async getWeatherByCity(req) {
    try {
      const { cityId } = req.params;
      if (!cityId) {
        throw new Error('City ID is required');
      }
      const response = await WeatherProxy.getHttpClient().get(`/current/${cityId}`);
      return response.data;
    } catch (error) {
      throw WeatherProxy.enhanceError(error, 'weather_by_city_id');
    }
  }

  static async getWeatherByCityName(req) {
    try {
      const { city, ccode } = req.query;
      const response = await WeatherProxy.getHttpClient().get(`/current`, {
        params: { region: city, code: ccode }
      });
      return response.data;
    } catch (error) {
      throw WeatherProxy.enhanceError(error, 'weather_by_city_name');
    }
  }

  static async getBulkWeather(req) {
    try {
      const response = await WeatherProxy.getHttpClient().post('/bulk', req.body);
      return response.data;
    } catch (error) {
      throw WeatherProxy.enhanceError(error, 'bulk_weather');
    }
  }
}
