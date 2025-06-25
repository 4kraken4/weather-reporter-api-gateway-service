import Config from '../../config/Config.js';
import HttpClient from '../../interfaces/http/HttpClient.js';

export default class WeatherProxy {
  static services = Config.getInstance().services;
  static httpClient = new HttpClient(
    // eslint-disable-next-line no-undef
    `${WeatherProxy.services.weather.protocol}://${WeatherProxy.services.weather.host}${process.env.NODE_ENV !== 'development' ? '' : `:${WeatherProxy.services.weather.port}`}/${WeatherProxy.services.weather.routePrefix}${process.env.NODE_ENV !== 'development' ? '' : `/${WeatherProxy.services.weather.name}`}`
  );

  static async search(req) {
    const response = await WeatherProxy.httpClient.get('/search', {
      params: req.query
    });
    return response.data;
  }

  static async getWeatherByCity(req) {
    const { cityId } = req.params;
    if (!cityId) {
      throw new Error('City ID is required');
    }
    const response = await WeatherProxy.httpClient.get(`/current/${cityId}`);
    return response.data;
  }
}
