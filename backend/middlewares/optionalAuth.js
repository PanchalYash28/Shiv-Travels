const jwt = require('jsonwebtoken');

/**
 * Optional auth middleware.
 * If a valid Bearer token is present, attaches `req.user`.
 * If not present (or invalid), continues without user info.
 */
module.exports = function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    req.user = null;
    return next();
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    req.user = null;
  }

  next();
};

