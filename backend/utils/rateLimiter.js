// rateLimiter.js
import rateLimit from 'express-rate-limit';

export const postRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests from this IP, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
});
// ⛓️ Rate limiter: Protect comment creation and likes from abuse
export const commentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // max 5 comments or likes per minute
  message: 'Too many actions, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});
// 🛡️ Limit report attempts to prevent abuse (e.g. spamming reports)
export const reportLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // max 3 reports per 5 minutes per user
  message: 'Too many reports submitted. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});