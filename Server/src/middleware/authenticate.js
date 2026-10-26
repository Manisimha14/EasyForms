// src/middleware/authenticate.js
// Verifies the Bearer JWT access token on private endpoints.
// Sets req.userId from the token's sub claim.

import { UnauthorizedError } from '../utils/app-error.js';
import { verifyAccessToken } from '../utils/tokens.js';

export function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authentication token is required.'));
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return next(new UnauthorizedError('Authentication token is required.'));
  }

  try {
    const decoded = verifyAccessToken(token);

    if (!decoded || !decoded.sub) {
      return next(new UnauthorizedError('Invalid authentication token payload.'));
    }

    req.userId = decoded.sub;
    req.user = { id: decoded.sub, _id: decoded.sub };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired authentication token.'));
  }
}
