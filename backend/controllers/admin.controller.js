
import Report from '../models/report.model.js';
import { errorHandler } from '../utils/error.js';
import mongoSanitize from 'mongo-sanitize';  // npm install mongo-sanitize

// Utility to validate positive integers for pagination
const validatePositiveInt = (value, defaultValue) => {
  const num = parseInt(value, 10);
  if (isNaN(num) || num <= 0) return defaultValue;
  return num;
};

export const getAllReports = async (req, res, next) => {
  if (!req.user.isAdmin) return next(errorHandler(403, 'Forbidden'));

  try {
    // Sanitize query params to strip any malicious keys or operators
    const sanitizedQuery = mongoSanitize(req.query);

    // Extract sanitized page and limit as strings
    const pageRaw = typeof sanitizedQuery.page === 'string' ? sanitizedQuery.page.trim() : undefined;
    const limitRaw = typeof sanitizedQuery.limit === 'string' ? sanitizedQuery.limit.trim() : undefined;

    // Validate and convert to numbers with defaults
    const page = validatePositiveInt(pageRaw, 1);
    const limit = validatePositiveInt(limitRaw, 20);
    const skip = (page - 1) * limit;

    // Fetch total count for pagination info
    const totalReports = await Report.countDocuments();

    const reports = await Report.find()
      .select('reason createdAt postId reporterId')
      .populate('postId', 'title slug')
      .populate('reporterId', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      page,
      limit,
      totalReports,
      totalPages: Math.ceil(totalReports / limit),
      reports,
    });
  } catch (err) {
    next(err);
  }
};
