import { Router } from 'express';

import authController from '../../../controller/authController.js';
import { ACTIONS, RESOURCES } from '../../../infrastructure/enum/grants.js';
import authenticate from '../../../infrastructure/middleware/authenticate.js';
import injectGrants from '../../../infrastructure/middleware/injectGrants.js';

const authRoutes = Router();

/**
 * @swagger
 *  '/api/v1/auth/register':
 *      post:
 *          tags:
 *              - Auth
 *          summary: Register a new user
 *          operationId: register
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              email:
 *                                  type: string
 *                              username:
 *                                  type: string
 *                              password:
 *                                  type: string
 *          responses:
 *              201:
 *                  description: User registered successfully
 *                  content:
 *                      application/json:
 *                          example:
 *                             token: <token>
 *                             refreshToken: <refreshToken>
 *              400:
 *                  description: Bad request
 *                  content:
 *                      application/json:
 *                          example:
 *                              message: Oops! Something went wrong with your request. Please review your input and try again.
 *                              status: 400
 *              409:
 *                  description: User already exists
 *                  content:
 *                      application/json:
 *                          example:
 *                              message: Sorry, it seems that a user with this email already exists. Please try logging in instead, or use a different email address to create a new account.
 *                              status: 409
 *              500:
 *                  description: Internal server error
 *                  content:
 *                      application/json:
 *                          example:
 *                              message: Apologies! Something unexpected happened on our end. Our team has been notified, and we're working to fix it. Please try again later.
 *                              status: 500
 */
authRoutes.post('/register', authController.register);

/**
 * @swagger
 *  '/api/v1/auth/login':
 *      post:
 *          tags:
 *              - Auth
 *          summary: Login a user
 *          operationId: login
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              identity:
 *                                  type: string
 *                              password:
 *                                  type: string
 *          responses:
 *              200:
 *                  description:
 *                  content:
 *                      application/json:
 *                          example:
 *                             token: <token>
 *                             refreshToken: <refreshToken>
 *              400:
 *                  description: Bad request
 *                  content:
 *                      application/json:
 *                          example:
 *                              message: Oops! Something went wrong with your request. Please review your input and try again.
 *                              status: 400
 *              500:
 *                  description: Internal server error
 *                  content:
 *                      application/json:
 *                          example:
 *                              message: Apologies! Something unexpected happened on our end. Our team has been notified, and we're working to fix it. Please try again later.
 *                              status: 500
 */
authRoutes.post(
  '/login',
  injectGrants(RESOURCES.SESSION, ACTIONS.CREATEOWN),
  authController.login
);

/**
 * @swagger
 *  '/api/v1/auth/token':
 *      post:
 *          tags:
 *              - Auth
 *          summary: Refresh user token
 *          operationId: refreshToken
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              token:
 *                                  type: string
 *          responses:
 *              200:
 *                  description:
 *                  content:
 *                      application/json:
 *                          example:
 *                              message: Token refreshed successfully
 *              400:
 *                  description: Bad request
 *                  content:
 *                      application/json:
 *                          example:
 *                              message: Oops! Something went wrong with your request. Please review your input and try again.
 *                              status: 400
 *              500:
 *                  description: Internal server error
 *                  content:
 *                      application/json:
 *                          example:
 *                              message: Apologies! Something unexpected happened on our end. Our team has been notified, and we're working to fix it. Please try again later.
 *                              status: 500
 */
authRoutes.post(
  '/token',
  injectGrants(RESOURCES.SESSION, ACTIONS.UPDATEOWN),
  authenticate,
  authController.refreshToken
);

/**
 * @swagger
 *  '/api/v1/auth/logout':
 *      post:
 *          tags:
 *              - Auth
 *          summary: Logout user
 *          operationId: logout
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              token:
 *                                  type: string
 *          responses:
 *              200:
 *                  description:
 *                  content:
 *                      application/json:
 *                          example:
 *                              message: User logged out successfully
 *              400:
 *                  description: Bad request
 *                  content:
 *                      application/json:
 *                          example:
 *                              message: Oops! Something went wrong with your request. Please review your input and try again.
 *                              status: 400
 *              500:
 *                  description: Internal server error
 *                  content:
 *                      application/json:
 *                          example:
 *                              message: Apologies! Something unexpected happened on our end. Our team has been notified, and we're working to fix it. Please try again later.
 *                              status: 500
 */
authRoutes.post(
  '/logout',
  injectGrants(RESOURCES.SESSION, ACTIONS.DELETEOWN),
  authenticate,
  authController.logout
);

export default authRoutes;
