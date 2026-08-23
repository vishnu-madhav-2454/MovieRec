import rateLimit from 'express-rate-limit';

/**
 * Rate limiting configurations for different endpoints
 */

// General API rate limiter - 500 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for auth endpoints - 5 requests per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true,
});

// Create content rate limiter - 20 posts per hour
export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    error: 'Too many posts created, please slow down.',
    retryAfter: '1 hour'
  },
});

// Search rate limiter - 30 requests per minute
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    error: 'Too many search requests, please slow down.',
    retryAfter: '1 minute'
  },
});

// Like/interaction rate limiter - 60 per minute
export const interactionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: {
    error: 'Too many interactions, please slow down.',
    retryAfter: '1 minute'
  },
});

// Message rate limiter - 30 messages per minute
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    error: 'Too many messages sent, please slow down.',
    retryAfter: '1 minute'
  },
});
