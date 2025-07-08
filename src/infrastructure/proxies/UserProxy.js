import Config from '../../config/Config.js';
import HttpClient from '../../interfaces/http/HttpClient.js';

export default class UserProxy {
  static services = Config.getInstance().services;
  static httpClient = new HttpClient(
    `${UserProxy.services.user.protocol}://${UserProxy.services.user.host}:${UserProxy.services.user.port}/${UserProxy.services.user.routePrefix}`
  );

  static async assignRole(req) {
    const response = await UserProxy.httpClient.put('/promote', req?.body);
    return response.data;
  }
}
