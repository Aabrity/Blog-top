
export const isAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) return res.status(403).json('Admins only');
  next();
};

export const isAdminOrSelf = (req, res, next) => {
  if (req.user?.id === req.params.userId || req.user?.isAdmin) {
    return next();
  }
  return res.status(403).json('Access denied');
};
