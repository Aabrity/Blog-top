
import { validationResult } from 'express-validator';
import sanitize from 'mongo-sanitize'; 
import sanitizeHtml from 'sanitize-html';
import Post from '../models/post.model.js';
import { errorHandler } from '../utils/error.js';
import { saveBase64Image } from '../utils/fileUpload.js';

/* ------------------------------------------------------------------
   🛠  HELPER FUNCTIONS
-------------------------------------------------------------------*/
const buildSlug = (title) =>
  title
    .trim()
    .toLowerCase()
    .split(' ')
    .join('-')
    .replace(/[^a-z0-9-]/g, '');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return immediately so controller does not continue
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/* ------------------------------------------------------------------
   📌  CONTROLLERS
-------------------------------------------------------------------*/
export const createPost = async (req, res, next) => {
  try {
    req.body = sanitize(req.body);
    req.params = sanitize(req.params);
    req.query = sanitize(req.query);

    const { title, content, category,isAnonymous, images, location, geolocation } = req.body;
    if (!images) {
      return next(errorHandler(400, 'Image is required'));
    }

    const slug = buildSlug(title);

    // Check if slug exists
    const exists = await Post.findOne({ slug });
    if (exists) return next(errorHandler(409, 'Slug already in use.'));

    // Save base64 image to file
    const imageUrl = saveBase64Image(images, req.user.id);

    const safeContent = sanitizeHtml(content);
    const safeTitle = sanitizeHtml(title.trim());
    const safeLocation = location ? sanitizeHtml(location.trim()) : '';

    const post = new Post({
      title: safeTitle,
      content: safeContent,
      category,
      isAnonymous: req.body.isAnonymous || false,
      images: imageUrl, // store URL, not base64
      location: safeLocation,
      geolocation,
      slug,
      userId: req.user.id,
    });

    const saved = await post.save();
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
};

export const getPosts = async (req, res, next) => {
  try {
    req.body = sanitize(req.body);
    req.params = sanitize(req.params);
    req.query = sanitize(req.query);

    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;
    const sortDir = req.query.sort === 'asc' ? 1 : -1;


    // Build dynamic filter
    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.postId) filter._id = req.query.postId;
    if (req.query.slug) filter.slug = req.query.slug;
    if (req.query.category && req.query.category !== 'uncategorized') {
      filter.category = req.query.category;
    }
    if (req.query.searchTerm) {
      const rx = { $regex: req.query.searchTerm, $options: 'i' };
      filter.$or = [{ title: rx }, { content: rx }, { location: rx }];
    }

    const posts = await Post.find(filter)
      .populate('userId', 'username')
      .sort({ updatedAt: sortDir })
      .skip(startIndex)
      .limit(limit)
      .lean();

    // Modify response based on anonymity
    const enriched = posts.map((p) => {
      const post = { ...p };
      if (post.isAnonymous) {
        if (post.userId && post.userId.username) {
          delete post.userId.username;
        }
        return post;
      }
      return {
        ...post,
        userName: post.userId?.username || 'Unknown',
      };
    });

    // Meta counts
    const totalPosts = await Post.countDocuments();
    const lastMonthPosts = await Post.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    res.status(200).json({ posts: enriched, totalPosts, lastMonthPosts });
  } catch (err) {
    next(err);
  }
};

export const getFlags = async (req, res, next) => {
  try {
    req.body = sanitize(req.body);
    req.params = sanitize(req.params);
    req.query = sanitize(req.query);

    const posts = await Post.find({ userId: req.params.userId }).sort({
      createdAt: -1,
    });
    if (!posts.length) return next(errorHandler(404, 'No flags found for this user.'));
    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    req.body = sanitize(req.body);
    req.params = sanitize(req.params);
    req.query = sanitize(req.query);

    const post = await Post.findById(req.params.postId);
    if (!post) return next(errorHandler(404, 'Post not found.'));

    // Authorization check handled in middleware (checkOwnershipOrAdmin)
    await post.deleteOne();
    res.status(200).json({ message: 'Post deleted.' });
  } catch (err) {
    next(err);
  }
};

export const updatePost = async (req, res, next) => {
  try {
    req.body = sanitize(req.body);
    req.params = sanitize(req.params);
    req.query = sanitize(req.query);

    const post = await Post.findById(req.params.postId);
    if (!post) return next(errorHandler(404, 'Post not found.'));

    const allowed = [
      'title',
      'content',
      'isAnonymous',
      'flag',
      'category',
      'images',
      'geolocation',
      'location',
    ];

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        if (
          field === 'images' &&
          typeof req.body.images === 'string' &&
          req.body.images.startsWith('data:image')
        ) {
          // It's a base64 image, save it and store the URL
          const imageUrl = saveBase64Image(req.body.images, req.user.id);
          post.images = imageUrl;
        } else if (
          field === 'content' ||
          field === 'title' ||
          field === 'location'
        ) {
          post[field] = sanitizeHtml(req.body[field]);
        } else {
          post[field] = req.body[field];
        }
      }
    }

    // Update slug if title changed
    if (req.body.title && req.body.title !== post.title) {
      const newSlug = buildSlug(req.body.title);
      const exists = await Post.findOne({ slug: newSlug });
      if (exists)
        return next(
          errorHandler(409, 'Another post already uses that title.')
        );
      post.slug = newSlug;
    }

    const updated = await post.save();
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

export const getUserPosts = async (req, res, next) => {
  try {
    req.body = sanitize(req.body);
    req.params = sanitize(req.params);
    req.query = sanitize(req.query);

    const posts = await Post.find({ userId: req.params.userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};
