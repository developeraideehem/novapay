// Rate Limiting Middleware
import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (for production, use Redis)
const store: RateLimitStore = {};

/**
 * Generic rate limiter factory
 * @param windowMs - Time window in milliseconds
 * @param maxRequests - Maximum requests per window
 * @param keyGenerator - Function to generate unique key (default: IP address)
 */
export const createRateLimiter = (
  windowMs: number = 900000,
  maxRequests: number = 100,
  keyGenerator?: (req: Request) => string
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator ? keyGenerator(req) : req.ip || 'unknown';
    const now = Date.now();

    if (!store[key]) {
      store[key] = { count: 1, resetTime: now + windowMs };
      next();
      return;
    }

    const record = store[key];

    if (now > record.resetTime) {
      store[key] = { count: 1, resetTime: now + windowMs };
      next();
      return;
    }

    record.count++;

    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.set('Retry-After', retryAfter.toString());
      res.status(429).json({
        status: 'error',
        message: `Too many requests. Please retry after ${retryAfter} seconds.`,
        retryAfter,
      });
      return;
    }

    res.set('X-RateLimit-Limit', maxRequests.toString());
    res.set('X-RateLimit-Remaining', (maxRequests - record.count).toString());
    res.set('X-RateLimit-Reset', record.resetTime.toString());

    next();
  };
};

export const globalRateLimiter = createRateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
);

export const paymentRateLimiter = createRateLimiter(60000, 10);
export const authRateLimiter = createRateLimiter(60000, 5);
export const transferRateLimiter = createRateLimiter(3600000, 20);

export const cleanupRateLimitStore = () => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
};

setInterval(cleanupRateLimitStore, 300000);
