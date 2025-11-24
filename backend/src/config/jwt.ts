import jwt from 'jsonwebtoken';

// #region Configuration
export const jwtConfig = {
  access: {
    secret: process.env.JWT_ACCESS_SECRET || 'fallback-secret-change-in-prod',
    expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
  },
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
};

// Validate secrets on startup
if (
  jwtConfig.access.secret === 'fallback-secret-change-in-prod' ||
  jwtConfig.refresh.secret === 'fallback-refresh-secret'
) {
  console.warn('WARNING: Using default JWT secrets! Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in .env');
}
// #endregion

// #region Token Payload Interface
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}
// #endregion

// #region Token Generation
/**
 * Generate access token (short-lived)
 * Used for API requests
 */
export const generateAccessToken = (userId: string, email: string, role: string): string => {
  const payload: TokenPayload = {
    userId,
    email,
    role,
    type: 'access',
  };

  return jwt.sign(payload, jwtConfig.access.secret, {
    expiresIn: jwtConfig.access.expiresIn,
  });
};

/**
 * Generate refresh token (long-lived)
 * Used to obtain new access tokens
 */
export const generateRefreshToken = (userId: string, email: string, role: string): string => {
  const payload: TokenPayload = {
    userId,
    email,
    role,
    type: 'refresh',
  };

  return jwt.sign(payload, jwtConfig.refresh.secret, {
    expiresIn: jwtConfig.refresh.expiresIn,
  });
};

/**
 * Generate both tokens at once
 */
export const generateTokenPair = (userId: string, email: string, role: string) => {
  return {
    accessToken: generateAccessToken(userId, email, role),
    refreshToken: generateRefreshToken(userId, email, role),
  };
};
// #endregion

// #region Token Verification
/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, jwtConfig.access.secret) as TokenPayload;

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid access token');
    }
    throw error;
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, jwtConfig.refresh.secret) as TokenPayload;

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};
// #endregion

// #region Token Extraction
/**
 * Extract token from Authorization header
 * Expected format: "Bearer <token>"
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};
// #endregion