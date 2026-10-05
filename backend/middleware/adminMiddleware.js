const adminMiddleware = (req, res, next) => {
  console.log('========== ADMIN CHECK ==========');
  console.log('req.user:', req.user);
  console.log('User ID:', req.user?.id);
  console.log('User role:', req.user?.role);

  if (!req.user) {
    return res.status(401).json({
      message: 'Authentication required',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Admin access required',
      receivedRole: req.user.role,
    });
  }

  next();
};

export default adminMiddleware;
