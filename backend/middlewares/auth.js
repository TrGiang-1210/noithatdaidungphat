// middleware/auth.js (ĐÃ FIX – hỗ trợ Guest Checkout 2025)
const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  // Nếu có token → xác thực bình thường
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: decoded.id,
        role: decoded.role
      };
      return next(); // có user → đi tiếp
    } catch (err) {
      return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
  }

  // Không có token → chỉ cho phép guest với 2 route này
  const allowedGuestRoutes = [
    '/api/orders',
    '/api/orders/momo'
  ];

  const isGuestAllowed = req.method === 'POST' && 
    allowedGuestRoutes.some(route => req.originalUrl.startsWith(route));

  if (isGuestAllowed) {
    req.user = null; // đánh dấu là guest
    return next();
  }

  // Các route khác → bắt buộc đăng nhập
  return res.status(401).json({ message: 'Bạn cần đăng nhập để thực hiện hành động này' });
};

module.exports = { protect };