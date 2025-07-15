
import express from 'express';
import {
  createComment,
  deleteComment,
  editComment,
  getPostComments,
  getcomments,
  likeComment,
} from '../controllers/comment.controller.js';

import { isAdmin } from '../utils/verifyRoles.js';
import { verifyToken } from '../utils/verifyUser.js';
import { body, param } from 'express-validator';
import { commentLimiter } from '../utils/rateLimiter.js';

const router = express.Router();


// ✅ Public: Get all comments for a post
router.get(
  '/getPostComments/:postId',
  param('postId').isMongoId().withMessage('Invalid Post ID'),
  getPostComments
);

// ✅ Authenticated users only
router.post(
  '/create',
  verifyToken,
  commentLimiter,
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
  body('postId').isMongoId().withMessage('Invalid Post ID'),
  createComment
);

router.put(
  '/likeComment/:commentId',
  verifyToken,
  commentLimiter,
  param('commentId').isMongoId().withMessage('Invalid Comment ID'),
  likeComment
);

router.put(
  '/editComment/:commentId',
  verifyToken,
  param('commentId').isMongoId().withMessage('Invalid Comment ID'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Updated comment must be between 1 and 1000 characters'),
  editComment
);

router.delete(
  '/deleteComment/:commentId',
  verifyToken,
  param('commentId').isMongoId().withMessage('Invalid Comment ID'),
  deleteComment
);

// ✅ Admin only: all comments and stats
router.get('/getcomments', verifyToken, isAdmin, getcomments);

export default router;
