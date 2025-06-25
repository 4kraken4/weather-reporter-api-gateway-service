import Config from '../../config/Config.js';
import HttpClient from '../../interfaces/http/HttpClient.js';

export default class AuthProxy {
  static services = Config.getInstance().services;
  static httpClient = new HttpClient(
    `${AuthProxy.services.authentication.protocol}://${AuthProxy.services.authentication.host}:${AuthProxy.services.authentication.port}/${AuthProxy.services.authentication.routePrefix}`
  );

  static async register(req) {
    const response = await AuthProxy.httpClient.post('/register', req?.body, {
      headers: {
        Authorization: req.header('Authorization') || `Bearer ${req?.token}`
      }
    });
    return response.data;
  }

  static async login(req) {
    const response = await AuthProxy.httpClient.post('/login', req?.body, {
      headers: {
        Authorization: req.header('Authorization') || `Bearer ${req?.token}`
      }
    });
    return response.data;
  }

  static async logout(req) {
    const response = await AuthProxy.httpClient.post(
      '/logout',
      { token: req?.token },
      {
        headers: {
          Authorization: req.header('Authorization') || `Bearer ${req?.token}`
        }
      }
    );
    return response.data;
  }

  static async refreshToken(req) {
    const refreshToken = req.body?.token;
    const response = await AuthProxy.httpClient.post(
      '/token',
      {
        refreshToken
      },
      {
        headers: {
          Authorization: req.header('Authorization') || `Bearer ${req?.token}`
        }
      }
    );
    return response.data;
  }

  static async authenticate(req) {
    const response = await AuthProxy.httpClient.post(
      '/authenticate',
      { token: req?.token },
      {
        headers: {
          Authorization: req.header('Authorization') || `Bearer ${req?.token}`
        }
      }
    );
    return response.data;
  }

  static async authorize(req) {
    const response = await AuthProxy.httpClient.post(
      '/authorize',
      { resource: req?.meta?.resource, action: req?.meta?.action },
      {
        headers: {
          Authorization: req.header('Authorization') || `Bearer ${req?.token}`
        }
      }
    );
    return response.data;
  }

  static async loginWithQR(req) {
    const response = await AuthProxy.httpClient.post('/login-qr', req.body);
    return response.data;
  }
}
