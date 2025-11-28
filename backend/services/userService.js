// src/services/userService.js

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
// const nodemailer = require('nodemailer');
const sendResetPasswordEmail = require('./brevoService');

class UserService {
  static async getUserById(id) {
    const user = await User.findById(id).select('name phone email address role createdAt updatedAt');
    if (!user) throw new Error('Không tìm thấy người dùng');
    return user;
  }

  // ==================== TẠO USER MỚI ====================
  static async createUser({ name, phone = '', email, password }) {
    const existingUser = await User.findOne({
      $or: [{ email }, phone ? { phone } : null].filter(Boolean)
    });

    if (existingUser) {
      throw new Error('Email hoặc số điện thoại đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name,
      phone,
      email,
      password: hashedPassword,
    });

    return newUser;
  }

  // ==================== ĐĂNG NHẬP BẰNG EMAIL HOẶC PHONE ====================
  static async loginUser({ email, phone, password }) {
    // Tìm user bằng email HOẶC phone
    const user = await User.findOne({
      $or: [
        email ? { email } : null,
        phone ? { phone } : null,
      ].filter(Boolean),
    }).select('+password');

    if (!user) {
      throw new Error('Email/số điện thoại hoặc mật khẩu không đúng');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Email/số điện thoại hoặc mật khẩu không đúng');
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { user, token };
  }

  // ==================== CẬP NHẬT PROFILE (hỗ trợ address) ====================
static async updateUser(userId, updateData) {
  // Kiểm tra trùng email hoặc phone
  if (updateData.email || updateData.phone) {
    const query = { _id: { $ne: userId } };
    if (updateData.email) query.email = updateData.email;
    if (updateData.phone) query.phone = updateData.phone;

    const existing = await User.findOne(query);
    if (existing) {
      throw new Error('Email hoặc số điện thoại đã được sử dụng bởi tài khoản khác');
    }
  }

  // Hash password nếu có
  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 12);
  }

  // Lọc field cho phép update
  const allowedUpdates = ['name', 'phone', 'email', 'password', 'address'];
  const updates = {};
  allowedUpdates.forEach(field => {
    if (updateData[field] !== undefined) {
      updates[field] = updateData[field];
    }
  });

  // Cập nhật trước
  await User.findByIdAndUpdate(userId, updates, { runValidators: true });

  // Sau đó lấy lại user mới nhất từ DB (chắc chắn có address)
  const freshUser = await User.findById(userId)
    .select('name phone email address role createdAt updatedAt');

  if (!freshUser) throw new Error('Không tìm thấy người dùng sau khi cập nhật');

  return freshUser;
}

  // ==================== QUÊN MẬT KHẨU (giữ nguyên đẹp như cũ) ====================
static async forgotPassword(email) {
  const user = await User.findOne({ email: email.toLowerCase() });

  // Luôn trả message chung chung (chống dò tài khoản)
  const successMsg = 'Nếu email đã đăng ký, link đặt lại sẽ được gửi trong vài phút';

  if (!user) {
    return { message: successMsg };
  }

  // Tạo token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/quen-mat-khau?token=${resetToken}`;
  // QUAN TRỌNG: try-catch riêng cho phần gửi mail
  try {
    await sendResetPasswordEmail(user.email, user.name, resetUrl); // ← gọi Brevo

    console.log('BREVO: Email reset password đã gửi thành công tới:', user.email);
    console.log('Link reset:', resetUrl);
  } catch (emailError) {
    console.error('BREVO: LỖI GỬI EMAIL QUA BREVO:', emailError.message || emailError);

    // Quan trọng: không throw, vẫn báo thành công cho user (bảo mật)
    // Nhưng dev biết có lỗi thật → dễ debug
  }
  return { message: successMsg };
}

  static async resetPassword(token, newPassword) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpire: { $gt: Date.now() },
    });

    if (!user) throw new Error('Token không hợp lệ hoặc đã hết hạn');

    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();

    return { message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.' };
  }

  static async getUserByEmail(email) {
    return await User.findOne({ email: email.toLowerCase() });
  }
}

module.exports = UserService;