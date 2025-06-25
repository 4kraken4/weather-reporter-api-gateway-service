import Config from '../../config/Config.js';
import { getCircuitBreakerInstance } from '../../utils/CircuiteBreaker.js';
import AuthProxy from '../proxies/AuthProxy.js';

const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      return next(new Error('UnauthorizedError'));
    }

    const tag = authHeader.split(' ')[0];
    if (tag !== 'Bearer') {
      return next(new Error('InvalidTokenError'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new Error('TokenNotProvidedError'));
    }

    req.token = token;

    // Authorize the request by calling the authentication service
    const breaker = getCircuitBreakerInstance(
      AuthProxy.authorize,
      Config.getInstance().services.authentication.name
    );
    const authResp = await breaker.fire(req);

    if (!authResp.authenticated || !authResp.authorized) {
      return next(new Error('UnauthorizedError'));
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
