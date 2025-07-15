
import sanitize from 'mongo-sanitize';
import Post from '../models/post.model.js';
import Report from '../models/report.model.js';
import { errorHandler } from '../utils/error.js';
import { logActivity } from '../utils/loggers.js';

// 🛡️ OWASP: Validate input, sanitize, prevent self-reporting & DB injection
export const reportPost = async (req, res, next) => {
  // Sanitize all inputs
  req.body = sanitize(req.body);
  req.params = sanitize(req.params);
  req.query = sanitize(req.query);

  const { postId } = req.params;
  const { reason, comment } = req.body;

  try {
    // 🔒 Check if post exists
    const post = await Post.findById(postId);
    if (!post) return next(errorHandler(404, 'Post not found'));

    // 🔐 Prevent self-reporting
    if (post.userId.toString() === req.user.id) {
      return next(errorHandler(403, 'You cannot report your own post.'));
    }

    const report = await Report.create({
      postId,
      reporterId: req.user.id,
      reason,
      comment,
    });

    // ✅ Log report creation
    await logActivity(req.user.id, 'Reported a post', {
      postId,
      reportId: report._id,
      reason,
    });

    res.status(201).json({ message: 'Report submitted for review.' });
  } catch (err) {
    // 🛡️ Handle duplicate report gracefully
    if (err.code === 11000) {
      return next(errorHandler(409, 'You have already reported this post.'));
    }
    next(err);
  }
};

// ✅ Admin-only: Delete Report AND the Post it references
export const deleteReportAndPost = async (req, res, next) => {
  // Sanitize inputs
  req.body = sanitize(req.body);
  req.params = sanitize(req.params);
  req.query = sanitize(req.query);

  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Delete the associated post
    await Post.findByIdAndDelete(report.postId);

    // Delete the report itself
    await Report.findByIdAndDelete(reportId);

    // Log both deletions
    await logActivity(req.user.id, 'Deleted reported post & report', {
      reportId,
      postId: report.postId,
    });

    return res.status(200).json({ message: 'Report and related post deleted.' });
  } catch (err) {
    console.error(err);
    next(errorHandler(500, 'Internal server error.'));
  }
};
