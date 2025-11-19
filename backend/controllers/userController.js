// src/controllers/userController.js (hoặc authController.js đều được)

const UserService = require('../services/userService');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

// ==================== VALIDATION SCHEMAS ====================
const registerSchema = Joi.object({
  name: Joi.string().trim().required(),
  phone: Joi.string().trim().allow(''),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim(),
  phone: Joi.string().trim().allow(''),
  email: Joi.string().email(),
  password: Joi.string().min(6),
}).min(1); // ít nhất 1 field để update

// ==================== ĐĂNG KÝ ====================
exports.register = async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const user = await UserService.createUser(req.body);

    // Tạo token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // khuyến khích để lâu hơn 1h
    );

    // Trả về đúng kiểu frontend mong đợi
    res.status(201).json({
      message: 'Đăng ký thành công!',
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone || '',
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email hoặc số điện thoại đã được sử dụng!' });
    }
    res.status(500).json({ message: err.message || 'Lỗi server khi đăng ký' });
  }
};

// ==================== ĐĂNG NHẬP ====================
exports.login = async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { email, password } = req.body;
    const { user, token } = await UserService.loginUser(email, password);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone || '',
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    res.status(401).json({ message: err.message || 'Email hoặc mật khẩu không đúng' });
  }
};

// ==================== LẤY THÔNG TIN USER HIỆN TẠI (/auth/me) ====================
exports.getCurrentUser = async (req, res) => {
  try {
    // req.user được gán từ middleware auth (protect route)
    const user = await UserService.getUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    res.json({
      _id: user._id,
      name: user.name,
      phone: user.phone || '',
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy thông tin người dùng' });
  }
};

// ==================== CẬP NHẬT THÔNG TIN CÁ NHÂN (/auth/profile) ====================
exports.updateProfile = async (req, res) => {
  try {
    const { error } = updateProfileSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const updatedUser = await UserService.updateUser(req.user.id, req.body);

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      phone: updatedUser.phone || '',
      email: updatedUser.email,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email hoặc số điện thoại đã được sử dụng!' });
    }
    res.status(500).json({ message: err.message || 'Cập nhật thất bại' });
  }
};

// ==================== QUÊN MẬT KHẨU ====================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Vui lòng cung cấp email' });

    const result = await UserService.forgotPassword(email);
    res.json(result); // { message: 'Đã gửi link đặt lại mật khẩu đến email của bạn' }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ==================== ĐẶT LẠI MẬT KHẨU ====================
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Thiếu thông tin' });
    }

    const result = await UserService.resetPassword(token, newPassword);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Token không hợp lệ hoặc đã hết hạn' });
  }
};