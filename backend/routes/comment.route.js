
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
router
  .route('/getPostComments/:postId')
  .get(
    param('postId').isMongoId().withMessage('Invalid Post ID'),
    getPostComments
  )
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

// ✅ Authenticated users only
router
  .route('/create')
  .post(
    verifyToken,
    commentLimiter,
    body('content')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Comment must be between 1 and 1000 characters'),
    body('postId').isMongoId().withMessage('Invalid Post ID'),
    createComment
  )
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

router
  .route('/likeComment/:commentId')
  .put(
    verifyToken,
    commentLimiter,
    param('commentId').isMongoId().withMessage('Invalid Comment ID'),
    likeComment
  )
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

router
  .route('/editComment/:commentId')
  .put(
    verifyToken,
    param('commentId').isMongoId().withMessage('Invalid Comment ID'),
    body('content')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Updated comment must be between 1 and 1000 characters'),
    editComment
  )
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

router
  .route('/deleteComment/:commentId')
  .delete(
    verifyToken,
    param('commentId').isMongoId().withMessage('Invalid Comment ID'),
    deleteComment
  )
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

// ✅ Admin only: all comments and stats
router
  .route('/getcomments')
  .get(verifyToken, isAdmin, getcomments)
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

export default router;
