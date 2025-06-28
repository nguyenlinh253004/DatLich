const jwt = require('jsonwebtoken');
const User = require('../models/User');


// Middleware xác thực
 const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Không có token, truy cập bị từ chối' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Người dùng không tồn tại' });
    }
    if (user.isLocked) {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa' });
    }
    req.userId = decoded.userId;
    req.userRole = user.role;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

module.exports = authMiddleware;