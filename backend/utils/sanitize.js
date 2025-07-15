import validator from 'validator';

/**
 * Sanitizes a string for safe use in HTML contexts
 * by escaping HTML entities.
 * @param {string} input
 * @returns {string} sanitized string
 */
export function sanitizeForHTML(input) {
  if (typeof input !== 'string') return '';
  return validator.escape(input);
}

/**
 * Sanitizes a string for safe use in email headers
 * by removing newline chars that could cause injection.
 * @param {string} input
 * @returns {string} sanitized string
 */
export function sanitizeForEmailHeader(input) {
  if (typeof input !== 'string') return '';
  // Remove \r and \n to prevent email header injection
  return input.replace(/[\r\n]+/g, ' ');
}

export const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return validator.escape(str.trim()); // escape HTML entities
};

export const sanitizeUsername = (username) => {
  // only allow alphanumeric lowercase without spaces, max 20 chars
  const clean = username.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean.slice(0, 20);
};

/**
 * Combined sanitizer for inputs going into emails:
 * escapes HTML and removes header injection chars.
 * @param {string} input
 * @returns {string} sanitized string
 */
export function sanitizeEmailInput(input) {
  return sanitizeForEmailHeader(sanitizeForHTML(input));
}
