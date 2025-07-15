import User from '../models/user.model.js';

const isPasswordExpired = (passwordChangedAt) => {
  const expiryDays = 30;
  const expiryDate = new Date(passwordChangedAt);
  expiryDate.setDate(expiryDate.getDate() + expiryDays);
  return new Date() > expiryDate;
};

export const checkPasswordExpiry = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (isPasswordExpired(user.passwordChangedAt)) {
      return res.status(403).json({
        message: 'Your password has expired. Please reset it to continue.',
      });
    }

    next();
  } catch (error) {
    console.error('Password expiry check failed:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
