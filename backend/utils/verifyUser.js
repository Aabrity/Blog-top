// import jwt from 'jsonwebtoken';
// import { errorHandler } from './error.js';

// /**
//  * Verifies JWT in cookies and attaches user data to req object.
//  */
// export const verifyToken = (req, res, next) => {
//   try {
//     const token = req.cookies.access_token;

//     if (!token) {
//       return next(errorHandler(401, 'Access denied. No token provided.'));
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET, {
//       algorithms: ['HS256'], // restrict to known algorithm
//       maxAge: '2h',          // enforce token expiration
//     });

//     // Attach verified user to request
//     req.user = decoded;

//     next();
//   } catch (err) {
//     console.error('JWT Verification Error:', err.message);
//     return next(errorHandler(401, 'Invalid or expired token.'));
//   }
// };
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js'; // if doing DB user validation
import { errorHandler } from './error.js';

/**
 * Verifies JWT in cookies and attaches user data to req object.
 */
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return next(errorHandler(401, 'Access denied. No token provided.'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      maxAge: '2h',
    });

    // OPTIONAL: Check user still exists and is active
    const user = await User.findById(decoded.id);
    if (!user || user.isBanned) {
      return next(errorHandler(403, 'Access revoked.'));
    }
    req.user = user;

    req.user = decoded;
    next();
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('JWT Verification Error:', err.message);
    }
    return next(errorHandler(401, 'Invalid or expired token.'));
  }
};

export const checkOwnershipOrAdmin = async (req, res, next) => {
  try {
    const { postId, userId } = req.params;
    const loggedInUser = req.user; // From verifyToken middleware

    if (loggedInUser.isAdmin) return next();

    if (loggedInUser.id === userId) return next();

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.userId.toString() !== loggedInUser.id) {
      return res.status(403).json({ message: 'Forbidden: Not authorized' });
    }

    next();
  } catch (err) {
    next(err);
  }
};
