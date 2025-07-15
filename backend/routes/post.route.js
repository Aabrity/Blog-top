
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
import { validateCreatePost, validateGetPosts, validateIdParams, validatePostIdAndUserIdParams } from '../utils/validators.js';
import { checkOwnershipOrAdmin, verifyToken } from '../utils/verifyUser.js';


const router = express.Router();

router.post(
  '/create',
  verifyToken,
  postRateLimiter,
  validateCreatePost,
  validateRequest,
  createPost
);

router.get(
  '/getposts',
  validateGetPosts,
  validateRequest,
  getPosts
);

router.delete(
  '/deletepost/:postId/:userId',
  verifyToken,
  postRateLimiter,
  validatePostIdAndUserIdParams,
  validateRequest,
  checkOwnershipOrAdmin,
  deletePost
);

router.put(
  '/updatepost/:postId/:userId',
  verifyToken,
  postRateLimiter,
  validatePostIdAndUserIdParams,
  validateRequest,
  checkOwnershipOrAdmin,
  updatePost
);

router.get(
  '/posts/:userId',
  verifyToken,
  validateIdParams,
  validateRequest,
  getFlags
);

export default router;
