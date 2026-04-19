// Authentication Middleware
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    iat: number;
    exp: number;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production_123456789';

/**
 * Verify JWT token from Authorization header
 * Expected format: Authorization: Bearer <token>
 */
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        status: 'error',
        message: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = {
        id: decoded.id || decoded.sub,
        email: decoded.email,
        iat: decoded.iat,
        exp: decoded.exp,
      };
      next();
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        res.status(401).json({
          status: 'error',
          message: 'Token has expired',
        });
      } else if (err.name === 'JsonWebTokenError') {
        res.status(401).json({
          status: 'error',
          message: 'Invalid token',
        });
      } else {
        res.status(401).json({
          status: 'error',
          message: 'Token verification failed',
        });
      }
    }
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Authentication error',
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if token is missing
 * Useful for public endpoints that can also accept authenticated requests
 */
export const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = {
          id: decoded.id || decoded.sub,
          email: decoded.email,
          iat: decoded.iat,
          exp: decoded.exp,
        };
      } catch (err) {
        // Silently fail - user will be undefined
        console.warn('Optional auth token verification failed:', (err as Error).message);
      }
    }

    next();
  } catch (err) {
    // Continue without auth
    next();
  }
};

/**
 * Generate JWT token for user
 */
export const generateToken = (userId: string, email: string, expiresIn: string = '7d'): string => {
  return jwt.sign(
    {
      id: userId,
      email,
    },
    JWT_SECRET,
    { expiresIn: expiresIn as any }
  );
};

/**
 * Verify JWT token (standalone function)
 */
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw new Error(`Token verification failed: ${(err as Error).message}`);
  }
};
