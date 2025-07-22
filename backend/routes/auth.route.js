
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
  verifySigninOTP
} from '../controllers/auth.controller.js';
// import svgCaptcha from "svg-captcha";

import { getAllReports } from '../controllers/admin.controller.js';
import { deleteReportAndPost } from '../controllers/report.controller.js';

import { verifyToken } from '../utils/verifyUser.js';
import { isAdmin } from '../utils/verifyRoles.js';
import { verifyCaptchaAndSignup,getCaptcha } from '../controllers/captcha.controller.js';
import {
  validateEmail,
  validateSignup,
  validatePasswordReset,
  
} from '../utils/validators.js';

import rateLimit from 'express-rate-limit';

const router = express.Router();

// 🔐 Per-route rate limiters
const signupLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  message: 'Too many signup attempts. Please try again later.',
});

const signinLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again later.',
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many password reset requests. Try again later.',
});

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many email submissions. Try again later.',
});

// 🧼 Validate /sendEmail input
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
router.post('/signup', validateSignup, signupLimiter, verifyCaptchaAndSignup, signup);
router.post('/signin', signinLimiter, signin);
router.post('/google', signinLimiter, google);
router.post('/verify-email', validateEmail, verifyEmail);
router.post('/request-password-reset', validateEmail, resetLimiter, requestPasswordReset);
router.post('/reset-password', validatePasswordReset, resetLimiter, resetPassword);

// 📩 Contact/Email route with validation
router.post('/sendEmail', validateContactMessage, emailLimiter, sendContactEmail);
router.post('/verify-signin-otp', verifySigninOTP);
// 🔒 Admin-only routes
router.get('/admin/reports', verifyToken, isAdmin, getAllReports);
router.delete('/admin/deleteWithPost/:reportId', verifyToken, isAdmin, deleteReportAndPost);

// 🔓 Logout route
router.post('/logout', (req, res) => {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

// Route to get CAPTCHA
router.get('/captcha', getCaptcha);

export default router;
