import Config from '../config/Config.js';
import UserProxy from '../infrastructure/proxies/UserProxy.js';
import { getCircuitBreakerInstance } from '../utils/CircuiteBreaker.js';

const userController = {
  assignRole: async (req, res, next) => {
    try {
      const breaker = getCircuitBreakerInstance(
        UserProxy.assignRole,
        Config.getInstance().services.user.name
      );
      const response = await breaker.fire(req);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
};

export default userController;
