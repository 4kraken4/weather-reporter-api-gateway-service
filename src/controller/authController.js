import Config from '../config/Config.js';
import AuthProxy from '../infrastructure/proxies/AuthProxy.js';
import { getCircuitBreakerInstance } from '../utils/CircuiteBreaker.js';

const authController = {
  login: async (req, res, next) => {
    try {
      const breaker = getCircuitBreakerInstance(
        AuthProxy.login,
        Config.getInstance().services.authentication.name
      );
      const response = await breaker.fire(req);

      res.cookie('refreshToken', response.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        path: '/refresh-token',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  register: async (req, res, next) => {
    try {
      const breaker = getCircuitBreakerInstance(
        AuthProxy.register,
        Config.getInstance().services.authentication.name
      );
      const response = await breaker.fire(req);

      res.status(201).json({
        token: response.token,
        refreshToken: response.refreshToken,
        qr: response.qr
      });
    } catch (error) {
      next(error);
    }
  },

  logout: async (req, res, next) => {
    try {
      const breaker = getCircuitBreakerInstance(
        AuthProxy.logout,
        Config.getInstance().services.authentication.name
      );
      const response = await breaker.fire(req);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  refreshToken: async (req, res, next) => {
    try {
      const breaker = getCircuitBreakerInstance(
        AuthProxy.refreshToken,
        Config.getInstance().services.authentication.name
      );
      const response = await breaker.fire(req);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
};

export default authController;
