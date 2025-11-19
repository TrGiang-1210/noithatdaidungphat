// middleware/auth.js (bản chuẩn nhất 2025 – bảo mật cao, dễ đọc)

const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;

  // 1. Lấy token từ header (Bearer) hoặc query (dùng cho reset password link)
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token; // cho reset password
  }

  // 2. Kiểm tra có token không
  if (!token) {
    return res.status(401).json({ message: 'Bạn cần đăng nhập để thực hiện hành động này' });
  }

  try {
    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Gắn user vào req (chỉ id + role là đủ)
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (err) {
    console.error('Token error:', err.message);
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

module.exports = { protect };