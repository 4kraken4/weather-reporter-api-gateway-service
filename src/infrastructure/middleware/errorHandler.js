import Config from '../../config/Config.js';

function isNetworkError(error) {
  return (
    error === 'ECONNABORTED' ||
    error === 'ECONNREFUSED' ||
    error === 'EOPENBREAKER' ||
    error === 'ETIMEDOUT' ||
    error === 'CircuitBreakerOpenError'
  );
}

function handleNetworkError(error) {
  const port = getServicePort(error);
  const serviceName = getServiceName(port);
  return `It seems ${serviceName} service is currently unavailable. Please try again later.`;
}

const getServicePort = error => error?.baseURL?.split(':')[2]?.split('/')[0];

const getServiceName = port => {
  switch (port) {
    case Config.getInstance().services.user.port:
      return `the ${Config.getInstance().services.user.name}`;
    case Config.getInstance().services.authentication.port:
      return `the ${Config.getInstance().services.authentication.name}`;
    case Config.getInstance().services.product.port:
      return `the ${Config.getInstance().services.product.name}`;
    default:
      return 'an important';
  }
};

// Helper to generate error messages based on the error type
function generateErrorMessage(type, message, status = 400) {
  return {
    type,
    message,
    status
  };
}

// Parse error by checking predefined error messages or handling network errors
function parseError(error) {
  // Check if the error exists in the predefined errors
  if (errorList[error?.error || error]) {
    return errorList[error?.error || error];
  }

  return {
    message:
      "Apologies! Something unexpected happened on our end. We're working to fix it. Please try again later.",
    status: 500
  };
}

function getError(error) {
  if (error?.code && isNetworkError(error.code)) {
    return error.code;
  } else if (error.response) {
    let currentError = error.response;
    while (currentError.response) {
      if (currentError?.response) currentError = currentError.response;
    }
    if (currentError?.data?.code && isNetworkError(currentError.data.code)) {
      return currentError;
    }
    return error.response?.data?.error?.error || error.response?.data?.error;
  } else {
    return error.message;
  }
}

const errorList = {
  BadRequest: generateErrorMessage(
    'BadRequest',
    'Oops! Something went wrong with your request. Please review your input and try again.'
  ),
  PrivilegeMissingError: generateErrorMessage(
    'PrivilegeMissingError',
    'Oops! It seems your account is missing the required privileges to perform this action. Please contact your administrator.'
  ),
  InvalidEmailError: generateErrorMessage(
    'InvalidEmailError',
    "Oops! The email provided is invalid. Please make sure you've entered a valid email address and try again."
  ),
  InvalidPasswordError: generateErrorMessage(
    'InvalidPasswordError',
    'Sorry, the password provided is invalid. Please double-check your password and try again.'
  ),
  TokenNotProvidedError: generateErrorMessage(
    'TokenNotProvidedError',
    'Looks like you forgot to provide a token. Please make sure to include a valid authentication token.',
    401
  ),
  ApiKeyMissingError: generateErrorMessage(
    'ApiKeyMissingError',
    'Oops! It looks like the API key is missing from your request. Please include the required API key with your request.',
    401
  ),
  AuthorizationHeaderMissingError: generateErrorMessage(
    'AuthorizationHeaderMissingError',
    'Oops! The authorization header is missing. Please ensure to include the required authorization header.',
    401
  ),
  InvalidTokenError: generateErrorMessage(
    'InvalidTokenError',
    'Sorry, the token provided is invalid. Please make sure you’re using a valid authentication token.',
    401
  ),
  TokenExpiredError: generateErrorMessage(
    'TokenExpiredError',
    'It appears your session has expired. Please log in again.',
    401
  ),
  ApikeyExpiredError: generateErrorMessage(
    'ApikeyExpiredError',
    'Your API key has expired. Please contact the administrator for a new one.',
    401
  ),
  TokenRevokedError: generateErrorMessage(
    'TokenRevokedError',
    'Your token has been revoked. Please log in again to generate a new token.',
    401
  ),
  ApikeyRevokedError: generateErrorMessage(
    'ApikeyRevokedError',
    'The API key you are using has been revoked. Please contact the administrator for a new API key.',
    401
  ),
  UnauthorizedError: generateErrorMessage(
    'UnauthorizedError',
    'You are not authorized to perform this action. Please make sure you have the necessary permissions.',
    401
  ),
  BadCredentialsError: generateErrorMessage(
    'BadCredentialsError',
    'Uh-oh! The credentials provided are incorrect. Please double-check your username and password.',
    401
  ),
  CORSDeniedError: generateErrorMessage(
    'CORSDeniedError',
    'The request has been blocked by CORS policy. Please enable CORS on the server.',
    403
  ),
  UserNotFoundError: generateErrorMessage(
    'UserNotFoundError',
    "We couldn't find the user you're looking for. Please check the user's details and try again.",
    404
  ),
  ProductNotFoundError: generateErrorMessage(
    'ProductNotFoundError',
    "We couldn't find the product you're looking for. Please check the product details.",
    404
  ),
  OrderNotFoundError: generateErrorMessage(
    'OrderNotFoundError',
    "We couldn't find the order you're looking for. Please check the order details.",
    404
  ),
  PrivilegeNotFoundError: generateErrorMessage(
    'PrivilegeNotFoundError',
    'Sorry, the privilege level you are trying to assign was not found.',
    404
  ),
  TimeoutError: generateErrorMessage(
    'TimeoutError',
    'Oops! The request has timed out. Please try again later.',
    408
  ),
  ProductExistsError: generateErrorMessage(
    'ProductExistsError',
    'A product with the specified name already exists. Please try adding a different product.',
    409
  ),
  InsufficientFundsError: generateErrorMessage(
    'InsufficientFundsError',
    'Sorry, you have insufficient funds to complete this transaction. Please top up your account and try again.',
    403
  ),
  UserExistsError: generateErrorMessage(
    'UserExistsError',
    'A user with the provided email already exists. Please log in or use a different email to create an account.',
    409
  ),
  PrivilegeConflictError: generateErrorMessage(
    'PrivilegeConflictError',
    'There is a conflict with the user’s privileges. The user already has the privilege you are trying to assign.',
    409
  ),
  OrderItemDuplicationError: generateErrorMessage(
    'OrderItemDuplicationError',
    'oops! The product you are trying to add already exists in the order. Please review the order and try again.',
    409
  ),
  TooManyRequestsError: generateErrorMessage(
    'TooManyRequestsError',
    'You have exceeded the rate limit. Please try again later.',
    429
  ),
  CircuitBreakerOpenError: generateErrorMessage(
    'CircuitBreakerOpenError',
    'The service is currently unavailable. Please try again later.',
    503
  ),
  ECONNREFUSED: generateErrorMessage(
    'ECONNREFUSED',
    'The service is currently unavailable. Please try again later.',
    503
  ),
  ECONNABORTED: generateErrorMessage(
    'ECONNABORTED',
    'The service is taking too long to respond. Please try again later.',
    503
  ),
  EOPENBREAKER: generateErrorMessage(
    'EOPENBREAKER',
    'The service is currently unavailable. Please try again later.',
    503
  ),
  SequelizeConnectionRefusedError: generateErrorMessage(
    'SequelizeConnectionRefusedError',
    'The database connection was refused. Please check your database connection settings.',
    503
  )
};

// Main error handler
const errorHandler = (err, _req, res, _next) => {
  console.error('Error occurred:', err.re);
  let error = getError(err);
  const msg = parseError(error);

  if (msg.type === errorList.TooManyRequestsError.type) {
    msg.message = `
    You have exceeded the rate limit. Please try again in 
    ${res.get('Retry-After') || 1} seconds.`;
  }

  if (isNetworkError(error?.error || error)) {
    error = { error: error, baseURL: error?.baseURL || err?.config?.baseURL };
    msg.message = handleNetworkError(error);
  }

  res.status(msg.status).json(msg.message);
};

export default errorHandler;
