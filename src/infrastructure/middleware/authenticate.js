// Authentication middleware removed - no-op implementation
// This is a stub that passes through all requests without authentication

const authenticate = async (req, _res, next) => {
  // No authentication logic - just pass through
  // Add a meta property to indicate that authentication was bypassed
  if (!req.meta) {
    req.meta = {};
  }
  req.meta.authBypassed = true;
  next();
};

export default authenticate;
