const User = require('../models/User');

// Middleware kiểm tra admin
 const adminMiddleware = async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập' });
  }
  next();
};

module.exports = adminMiddleware;