import config from '../config.js';
import { logger } from '../utils/logger.js';

/**
 * Bearer Token Authentication Middleware
 *
 * Validates that requests include a valid Authorization header with Bearer token.
 * Protects /ai/* endpoints from unauthorized access.
 */

function authMiddleware(req, res, next) {
  const authHeader = req.get('Authorization');

  // Missing header
  if (!authHeader) {
    logger.warn('Unauthorized request - missing Authorization header', {
      method: req.method,
      path: req.path,
    });
    return res.status(401).json({
      ok: false,
      error: 'Missing Authorization header',
      code: 'MISSING_AUTH',
    });
  }

  // Invalid format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    logger.warn('Unauthorized request - invalid Authorization format', {
      method: req.method,
      path: req.path,
    });
    return res.status(401).json({
      ok: false,
      error: 'Invalid Authorization format. Use: Authorization: Bearer <token>',
      code: 'INVALID_AUTH_FORMAT',
    });
  }

  const token = parts[1];

  // Compare tokens
  if (token !== config.appBearerToken) {
    logger.warn('Unauthorized request - invalid token', {
      method: req.method,
      path: req.path,
    });
    return res.status(403).json({
      ok: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }

  // Valid token
  next();
}

export default authMiddleware;

