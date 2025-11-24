import { Request, Response, NextFunction } from 'express';

import { verifyAccessToken, extractTokenFromHeader } from '../config/jwt.js';
import { tokenBlacklistService } from '../services/TokenBlacklistService.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

// #region Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}
// #endregion

// #region Authenticate Middleware
/**
 * Verify JWT access token
 * Populates req.user with user data
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    // Check if token is blacklisted
    if (tokenBlacklistService.isBlacklisted(token)) {
      throw new UnauthorizedError('Token has been revoked');
    }

    // Verify token
    const payload = verifyAccessToken(token);

    // Attach user to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error: any) {
    if (error.message.includes('expired')) {
      next(new UnauthorizedError('Token expired'));
    } else if (error.message.includes('invalid')) {
      next(new UnauthorizedError('Invalid token'));
    } else {
      next(error);
    }
  }
};
// #endregion

// #region Authorize Middleware
/**
 * Check if user has required role
 * Must be used AFTER authenticate middleware
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Not authenticated'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new ForbiddenError(
          `Access denied. Required role: ${allowedRoles.join(' or ')}`
        )
      );
      return;
    }

    next();
  };
};
// #endregion