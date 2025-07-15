
import express from 'express';
import { body, param } from 'express-validator';
import { reportPost } from '../controllers/report.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
import { reportLimiter } from '../utils/rateLimiter.js'; 

const router = express.Router();



router.post(
  '/report/:postId',
  verifyToken,
  reportLimiter, 
  param('postId').isMongoId().withMessage('Invalid post ID'),
  body('reason')
    .isIn(['Spam', 'Abusive Content', 'False Information', 'Other'])
    .withMessage('Invalid reason'),
  body('comment')
    .optional()
    .trim()
    .escape() 
    .isLength({ max: 500 })
    .withMessage('Comment too long'),
  reportPost
);

export default router;
