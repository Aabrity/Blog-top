
// import express from 'express';
// import {
//   google,
//   signin,
//   signup,
//   verifyEmail,
//   requestPasswordReset,
//   resetPassword,
//   sendContactEmail,
//   logout,
//   verifySigninOTP, 
//   changeExpiredPassword
// } from '../controllers/auth.controller.js';
// // import svgCaptcha from "svg-captcha";

// import { getAllReports } from '../controllers/admin.controller.js';
// import { deleteReportAndPost } from '../controllers/report.controller.js';

// import { verifyToken } from '../utils/verifyUser.js';
// import { isAdmin } from '../utils/verifyRoles.js';
// import { verifyCaptchaAndSignup,getCaptcha } from '../controllers/captcha.controller.js';
// import {
//   validateEmail,
//   validateSignup,
//   validatePasswordReset,
  
// } from '../utils/validators.js';

// import rateLimit from 'express-rate-limit';

// const router = express.Router();

// // 🔐 Per-route rate limiters

// // ✅ Signup Limiter — uses IP only (unauthenticated users)
// export const signupLimiter = rateLimit({
//   windowMs: 10 * 60 * 1000, // 10 minutes
//   max: 10,
//   message: 'Too many signup attempts. Please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
//   keyGenerator: (req) => req.ip,
// });

// // ✅ Signin Limiter — must use IP (user not yet logged in)
// export const signinLimiter = rateLimit({
//   windowMs: 10 * 60 * 1000,
//   max: 5,
//   message: 'Too many login attempts. Please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
//   keyGenerator: (req) => req.ip, // ❌ DO NOT use req.user
// });

// // ✅ Reset Limiter — use IP; reduce max to prevent abuse
// export const resetLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 5, // ❌ 100 is way too high, risk of spam/flood
//   message: 'Too many password reset requests. Try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
//   keyGenerator: (req) => req.ip,
// });

// // ✅ Email Limiter — can use user ID *if* authenticated
// export const emailLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 5,
//   message: 'Too many email submissions. Try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
//   keyGenerator: (req) => req.user?.id || req.ip, // ✅ fallback to IP
// });

// // 🧼 Validate /sendEmail input
// const validateContactMessage = (req, res, next) => {
//   const { name, email, message } = req.body;
//   if (
//     typeof name !== 'string' ||
//     typeof email !== 'string' ||
//     typeof message !== 'string' ||
//     message.trim().length === 0 ||
//     message.length > 1000
//   ) {
//     return res.status(400).json({ error: 'Invalid input' });
//   }
//   next();
// };

// // 🔐 Auth routes
// router.post('/signup', validateSignup, signupLimiter, verifyCaptchaAndSignup, signup);
// router.post('/signin', signinLimiter, signin);
// router.post('/google', signinLimiter, google);
// router.post('/verify-email', validateEmail, verifyEmail);
// router.post('/request-password-reset', validateEmail, resetLimiter, requestPasswordReset);
// router.post('/reset-password', validatePasswordReset, resetLimiter, resetPassword);
// router.post("/change-expired-password", changeExpiredPassword);
// // 📩 Contact/Email route with validation
// router.post('/sendEmail', validateContactMessage, emailLimiter, sendContactEmail);
// router.post('/verify-signin-otp', verifySigninOTP);
// // 🔒 Admin-only routes

// router.delete('/admin/deleteWithPost/:reportId', verifyToken, isAdmin, deleteReportAndPost);

// // 🔓 Logout route
// router.post('/logout', (req, res) => {
//   res.clearCookie('access_token', {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'Strict',
//   });
//   res.status(200).json({ message: 'Logged out successfully' });
// });

// // Route to get CAPTCHA
// router.get('/captcha', getCaptcha);

// export default router;
import express from 'express';
import {
  google,
  signin,
  signup,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  sendContactEmail,
  logout,
  verifySigninOTP,
  changeExpiredPassword
} from '../controllers/auth.controller.js';

import { getAllReports } from '../controllers/admin.controller.js';
import { deleteReportAndPost } from '../controllers/report.controller.js';

import { verifyToken } from '../utils/verifyUser.js';
import { isAdmin } from '../utils/verifyRoles.js';
import { verifyCaptchaAndSignup, getCaptcha } from '../controllers/captcha.controller.js';
import {
  validateEmail,
  validateSignup,
  validatePasswordReset,
} from '../utils/validators.js';

import rateLimit from 'express-rate-limit';

const router = express.Router();

// 🔐 Per-route rate limiters
export const signupLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: 'Too many signup attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
});

export const signinLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
});

export const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many password reset requests. Try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
});

export const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many email submissions. Try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
});

const validateContactMessage = (req, res, next) => {
  const { name, email, message } = req.body;
  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof message !== 'string' ||
    message.trim().length === 0 ||
    message.length > 1000
  ) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  next();
};

// 🔐 Auth routes
router.route('/signup')
  .post(validateSignup, signupLimiter, verifyCaptchaAndSignup, signup)
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

router.route('/signin')
  .post(signinLimiter, signin)
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

router.route('/google')
  .post(signinLimiter, google)
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

router.route('/verify-email')
  .post(validateEmail, verifyEmail)
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

router.route('/request-password-reset')
  .post(validateEmail, resetLimiter, requestPasswordReset)
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

router.route('/reset-password')
  .post(validatePasswordReset, resetLimiter, resetPassword)
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

router.route('/change-expired-password')
  .post(changeExpiredPassword)
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

router.route('/sendEmail')
  .post(validateContactMessage, emailLimiter, sendContactEmail)
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

router.route('/verify-signin-otp')
  .post(verifySigninOTP)
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

// 🔒 Admin-only routes
router.route('/admin/deleteWithPost/:reportId')
  .delete(verifyToken, isAdmin, deleteReportAndPost)
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

// 🔓 Logout
router.route('/logout')
  .post((req, res) => {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    });
    res.status(200).json({ message: 'Logged out successfully' });
  })
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

// CAPTCHA route
router.route('/captcha')
  .get(getCaptcha)
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

export default router;
