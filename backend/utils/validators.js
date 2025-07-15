// import { body } from 'express-validator';

// export const validateSignup = [
//   body('email').isEmail().withMessage('Invalid email'),
//   body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
// ];

// export const validateEmail = [
//   body('email').isEmail().withMessage('Invalid email address'),
// ];

// export const validatePasswordReset = [
//   body('token').notEmpty().withMessage('Reset token is required'),
//   body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
// ];
// import { body } from 'express-validator';
import { body, param, query } from 'express-validator';
import sanitizeHtml from 'sanitize-html';
/**
 * ✅ validateSignup
 * Enforces strong password policy and validates email format
 */
export const validateSignup = [
  body('email')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(), // ✅ Prevents email format tampering

  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*]/).withMessage('Password must contain at least one special character'),
];

/**
 * ✅ validateEmail
 * Reusable validator for email-only fields
 */
export const validateEmail = [
  body('email')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
];

/**
 * ✅ validatePasswordReset
 * Ensures reset token and strong new password are provided
 */
export const validatePasswordReset = [
  body('token')
    .notEmpty().withMessage('Reset token is required')
    .trim().escape(),

  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*]/).withMessage('Password must contain at least one special character'),
];



const stripHtml = (value) => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });

const URL_REGEX = /^(https?|ipfs):\/\/[^\s/$.?#].[^\s]*$/i;

export const validateCreatePost = [
  body('title')
    .isString()
    .trim()
    .isLength({ min: 5, max: 140 })
    .withMessage('Title must be 5‑140 characters.')
    .customSanitizer(stripHtml),

  body('content')
    .isString()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters.')
    .customSanitizer((value) => sanitizeHtml(value)),

  body('category')
    .optional()
    .isIn(['Suspicious & Criminal Activity', 'Lost & Found', 'Accidents & Public Hazards', 'uncategorized'])
    .withMessage('Invalid category.'),

body('images')
  .notEmpty()
  .withMessage('Image is required')
  .bail()
  .custom((base64) => {
    const base64Pattern = /^data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+$/;
    if (!base64Pattern.test(base64)) {
      throw new Error('Invalid base64 image string');
    }
    return true;
  }),


  body('location')
    .optional()
    .isString()
    .trim()
    .customSanitizer(stripHtml),

  body('geolocation.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('geolocation.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
];

export const validateGetPosts = [
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('startIndex').optional().isInt({ min: 0 }),
  query('order').optional().isIn(['asc', 'desc']),
  query('searchTerm').optional().isString().trim(),
];

// For routes that only have userId param
export const validateIdParams = [
  param('userId').isMongoId().withMessage('Invalid user ID'),
];

// For routes that have both postId and userId
export const validatePostIdAndUserIdParams = [
  param('postId').isMongoId().withMessage('Invalid post ID'),
  param('userId').isMongoId().withMessage('Invalid user ID'),
];



