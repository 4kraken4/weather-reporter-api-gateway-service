import { Router } from 'express';

import userController from '../../../controller/userController.js';
import { ACTIONS, RESOURCES } from '../../../infrastructure/enum/grants.js';
import authenticate from '../../../infrastructure/middleware/authenticate.js';
import injectGrants from '../../../infrastructure/middleware/injectGrants.js';

const userRoutes = Router();

/**
 * @swagger
 *  '/api/v1/users/admin/assign-role':
 *      put:
 *          tags:
 *              - User
 *          summary: Assign a role to a user
 *          operationId: assignRole
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              email:
 *                                  type: string
 *                              role:
 *                                  type: string
 *          responses:
 *              200:
 *                  description: Role assigned successfully
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
 *              401:
 *                  description: Unauthorized
 *                  content:
 *                      application/json:
 *                          example:
 *                              message: Oh no! You're not authorized to perform this action. Please contact your administrator for help.
 *                              status: 401
 *              403:
 *                  description: Forbidden
 *                  content:
 *                      application/json:
 *                          example:
 *                              message: Oh no! You're not allowed to perform this action. Please contact your administrator for help.
 *                              status: 403
 *              500:
 *                  description: Internal server error
 *                  content:
 *                      application/json:
 *                          example:
 *                              message: Apologies! Something unexpected happened on our end. Our team has been notified, and we're working to fix it. Please try again later.
 *                              status: 500
 */
userRoutes.post(
  '/admin/assign-role',
  authenticate,
  injectGrants(RESOURCES.MOVIES, ACTIONS.CREATEANY),
  userController.assignRole
);

export default userRoutes;
