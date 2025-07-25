
import express from 'express';

import {
  createPost,
  deletePost,
  getFlags,
  getPosts,
  updatePost,
} from '../controllers/post.controller.js';

import { postRateLimiter } from '../utils/rateLimiter.js';
import { validateRequest } from '../utils/validateRequest.js';
import {
  validateCreatePost,
  validateGetPosts,
  validateIdParams,
  validatePostIdAndUserIdParams,
} from '../utils/validators.js';
import { checkOwnershipOrAdmin, verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.route('/create')
  .post(
    verifyToken,
    postRateLimiter,
    validateCreatePost,
    validateRequest,
    createPost
  )
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

router.route('/getposts')
  .get(
    validateGetPosts,
    validateRequest,
    getPosts
  )
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

router.route('/deletepost/:postId/:userId')
  .delete(
    verifyToken,
    postRateLimiter,
    validatePostIdAndUserIdParams,
    validateRequest,
    checkOwnershipOrAdmin,
    deletePost
  )
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

router.route('/updatepost/:postId/:userId')
  .put(
    verifyToken,
    postRateLimiter,
    validatePostIdAndUserIdParams,
    validateRequest,
    checkOwnershipOrAdmin,
    updatePost
  )
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

router.route('/posts/:userId')
  .get(
    verifyToken,
    validateIdParams,
    validateRequest,
    getFlags
  )
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

export default router;
