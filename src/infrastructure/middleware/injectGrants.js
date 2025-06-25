const injectGrants = (resource, action) => {
  return async (req, _, next) => {
    req.meta = {
      resource,
      action
    };
    next();
  };
};

export default injectGrants;
