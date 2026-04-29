import rateLimit from "express-rate-limit";

// general limiter — 100 requests per 15 minutes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: "Too many requests. Please try again in 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// strict limiter — 20 requests per 15 minutes for POST routes
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: "Too many requests. Please try again in 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});
