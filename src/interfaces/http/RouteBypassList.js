import Config from '../../config/Config.js';

const BYPASSED_ROUTES = Object.freeze({
  // Swagger routes
  [`GET /${Config.getInstance().app.healthUrl}`]: true,
  [`GET /${Config.getInstance().app.swaggerUrl}`]: true,
  [`GET /${Config.getInstance().app.swaggerUrl}/`]: true,
  [`GET /${Config.getInstance().app.swaggerUrl}.json`]: true,
  [`GET /${Config.getInstance().app.swaggerUrl}/swagger-ui.css`]: true,
  [`GET /${Config.getInstance().app.swaggerUrl}/swagger-ui-bundle.js`]: true,
  [`GET /${Config.getInstance().app.swaggerUrl}/swagger-ui-init.js`]: true,
  [`GET /${Config.getInstance().app.swaggerUrl}/swagger-ui-standalone-preset.js`]: true,
  [`GET /${Config.getInstance().app.swaggerUrl}/favicon-32x32.png`]: true,
  [`GET /${Config.getInstance().app.swaggerUrl}/favicon-16x16.png`]: true,

  // Authentication routes
  'POST /auth/login': true,
  'POST /auth/register': true,
  'POST /auth/token': true
});

export default BYPASSED_ROUTES;
