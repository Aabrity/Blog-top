import User from '../models/user.model.js';

export const checkSubscription = async (req, res, next) => {
  const userId = req.user.id;
  const user = await User.findById(userId);

  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.subscribed && user.subscriptionExpiresAt) {
    if (user.subscriptionExpiresAt < new Date()) {
      // Subscription expired — update user
      user.subscribed = false;
      user.subscriptionExpiresAt = null;
      await user.save();
    }
  }

  req.user.subscribed = user.subscribed;
  next();
};
