// src/controllers/userController.js
const UserService = require('../services/userService');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const crypto = require('crypto');
const sendResetPasswordEmail = require('../services/brevoService');
const User = require('../models/User');
// const sendEmail = require('../utils/sendEmail');

// ==================== VALIDATION SCHEMAS ====================
const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).label('Email'),
  phone: Joi.string().pattern(/^0[35789][0-9]{8}$/).label('Số điện thoại'),
  password: Joi.string().required().label('Mật khẩu'),
}).xor('email', 'phone').messages({
  'object.xor': 'Chỉ được nhập email hoặc số điện thoại, không nhập cả hai',
  'object.missing': 'Vui lòng nhập email hoặc số điện thoại',
  'any.required': 'Vui lòng nhập {{#label}}',
  'string.email': '{{#label}} không hợp lệ',
  'string.pattern.base': '{{#label}} không hợp lệ (VD: 0901234567)',
});

const registerSchema = Joi.object({
  name: Joi.string().trim().required().label('Họ và tên'),
  phone: Joi.string()
    .trim()
    .allow('')
    .pattern(/^0[35789][0-9]{8}$/)
    .message('Số điện thoại không hợp lệ, ví dụ đúng: 0901234567')
    .label('Số điện thoại'),
  email: Joi.string().email({ tlds: { allow: false } }).required().label('Email'),
  password: Joi.string().min(6).required().label('Mật khẩu'),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().label('Họ và tên'),
  phone: Joi.string()
    .trim()
    .allow('')
    .pattern(/^0[35789][0-9]{8}$/)
    .message('Số điện thoại không hợp lệ')
    .label('Số điện thoại'),
  email: Joi.string().email({ tlds: { allow: false } }).label('Email'),
  address: Joi.string().trim().allow('').label('Địa chỉ giao hàng'),
  password: Joi.string().min(6).label('Mật khẩu mới'),
}).min(1).min(1); // ít nhất 1 field

// ==================== ĐĂNG KÝ ====================
exports.register = async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const user = await UserService.createUser(req.body);

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

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

    const { email, phone, password } = req.body;

    const { user, token } = await UserService.loginUser({ email, phone, password });

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
    res.status(401).json({ message: err.message || 'Email/số điện thoại hoặc mật khẩu không đúng' });
  }
};

// ==================== CÁC HÀM KHÁC (giữ nguyên) ====================
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await UserService.getUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    res.json({
      _id: user._id,
      name: user.name,
      phone: user.phone || '',
      email: user.email,
      address: user.address || '',
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy thông tin người dùng' });
  }
};

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
      address: updatedUser.address || '',
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

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Vui lòng nhập email' });

  try {
    // ← CHỈ 2 DÒNG NÀY, KHÔNG CÓ REQUIRE Ở ĐÂY
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    const msg = 'Nếu email đã đăng ký, link đặt lại mật khẩu sẽ được gửi trong vài phút';
    if (!user) return res.json({ message: msg });

    // Tạo token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/quen-mat-khau?token=${resetToken}`;

    const emailResult = await sendResetPasswordEmail(
      user.email,
      user.name || 'Khách hàng',
      resetUrl
    );

    if (emailResult) {
      console.log('BREVO: Đã gửi email reset password tới', user.email, '| MessageId:', emailResult.messageId);
    } else {
      console.error('BREVO: Gửi thất bại tới', user.email);
    }

    res.json({ message: msg });
  } catch (err) {
    console.error('Lỗi forgotPassword:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ==================== ĐẶT LẠI MẬT KHẨU (SỬA LẠI CHO ĐÚNG) ====================
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Token hoặc mật khẩu không hợp lệ' });
  }

  try {
    // CHỈ HASH 1 LẦN DUY NHẤT – ĐÚNG NHƯ KHI LƯU
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Tìm user bằng token đã hash + còn hạn
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Link đã hết hạn hoặc không hợp lệ' });
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword; // giả sử anh dùng pre-save hook để hash
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.' });
  } catch (err) {
    console.error('Lỗi resetPassword:', err);
    res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại' });
  }
};