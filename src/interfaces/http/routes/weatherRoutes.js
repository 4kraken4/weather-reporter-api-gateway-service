import { Router } from 'express';

import weatherController from '../../../controller/weatherController.js';
import { ACTIONS, RESOURCES } from '../../../infrastructure/enum/grants.js';
import injectGrants from '../../../infrastructure/middleware/injectGrants.js';

const weatherRoutes = Router();

weatherRoutes.get(
  '/search',
  injectGrants(RESOURCES.WEATHER, ACTIONS.READANY),
  weatherController.search
);

weatherRoutes.get(
  '/current/:cityId',
  injectGrants(RESOURCES.WEATHER, ACTIONS.READANY),
  weatherController.getWeatherByCity
);

export default weatherRoutes;
