import { Router } from 'express';

/**
 * @swagger
 * /api/v1/weather/search:
 *   get:
 *     summary: Search for cities
 *     tags: [Weather]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query for cities
 *     responses:
 *       200:
 *         description: Cities found successfully
 *       401:
 *         description: Unauthorized
 */
import weatherController from '../../../controller/weatherController.js';
import { ACTIONS, RESOURCES } from '../../../infrastructure/enum/grants.js';
import injectGrants from '../../../infrastructure/middleware/injectGrants.js';

const weatherRoutes = Router();

weatherRoutes.get(
  '/search',
  injectGrants(RESOURCES.WEATHER, ACTIONS.READANY),
  weatherController.search
);

/**
 * @swagger
 * /api/v1/weather/current/{cityId}:
 *   get:
 *     summary: Get weather by city ID
 *     tags: [Weather]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cityId
 *         required: true
 *         schema:
 *           type: string
 *         description: City ID
 *     responses:
 *       200:
 *         description: Weather data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: City not found
 */
weatherRoutes.get(
  '/current/:cityId',
  injectGrants(RESOURCES.WEATHER, ACTIONS.READANY),
  weatherController.getWeatherByCity
);

/**
 * @swagger
 * /api/v1/weather/current:
 *   get:
 *     summary: Get weather by city name
 *     tags: [Weather]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: City name
 *       - in: query
 *         name: ccode
 *         schema:
 *           type: string
 *         description: Country code
 *     responses:
 *       200:
 *         description: Weather data retrieved successfully
 *       401:
 *         description: Unauthorized
 */
weatherRoutes.get(
  '/current',
  injectGrants(RESOURCES.WEATHER, ACTIONS.READANY),
  weatherController.getWeatherByCityName
);

/**
 * @swagger
 * /api/v1/weather/bulk:
 *   post:
 *     summary: Get weather data for multiple cities
 *     tags: [Weather]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cities
 *             properties:
 *               cities:
 *                 type: array
 *                 maxItems: 50
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - city
 *                   properties:
 *                     city:
 *                       type: string
 *                       description: City name
 *                       example: "London"
 *                     country:
 *                       type: string
 *                       description: ISO 3166-1 alpha-2 country code
 *                       example: "GB"
 *           example:
 *             cities:
 *               - city: "London"
 *                 country: "GB"
 *               - city: "New York"
 *                 country: "US"
 *               - city: "Tokyo"
 *                 country: "JP"
 *     responses:
 *       200:
 *         description: Bulk weather data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       temperature:
 *                         type: number
 *                         description: Temperature in Celsius
 *                         example: 15
 *                       icon:
 *                         type: string
 *                         description: Weather icon code
 *                         example: "04d"
 *                       description:
 *                         type: string
 *                         description: Weather description
 *                         example: "Overcast clouds"
 *             example:
 *               success: true
 *               data:
 *                 "london-gb":
 *                   temperature: 15
 *                   icon: "04d"
 *                   description: "Overcast clouds"
 *                 "new york-us":
 *                   temperature: 22
 *                   icon: "01d"
 *                   description: "Clear sky"
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Cities array is required in request body"
 *       401:
 *         description: Unauthorized
 */
weatherRoutes.post(
  '/bulk',
  injectGrants(RESOURCES.WEATHER, ACTIONS.READANY),
  weatherController.getBulkWeather
);

export default weatherRoutes;
