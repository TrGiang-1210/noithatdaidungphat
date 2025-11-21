// src/services/userService.js

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

class UserService {
  static async getUserById(id) {
    const user = await User.findById(id).select('-password');
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

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    updates,
    { new: true, runValidators: true }
  ).select('name phone email address role createdAt updatedAt');

  if (!updatedUser) throw new Error('Không tìm thấy người dùng để cập nhật');

  // <<< DÒNG THẦN THÁNH NÀY FIX 100% BUG KHÔNG HIỆN ADDRESS >>>
  await updatedUser.reload();

  return updatedUser;
}

  // ==================== QUÊN MẬT KHẨU (giữ nguyên đẹp như cũ) ====================
  static async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) {
      return { message: 'Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Nội Thất Dại Dũng Phát" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Yêu cầu đặt lại mật khẩu - Hết hạn sau 10 phút',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #001f3f;">Đặt lại mật khẩu</h2>
          <p>Xin chào <strong>${user.name}</strong>,</p>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
          <p>Vui lòng nhấn nút bên dưới (hết hạn sau 10 phút):</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #001f3f; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Đặt lại mật khẩu</a>
          </div>
          <p>Nếu không phải bạn yêu cầu, vui lòng bỏ qua email này.</p>
          <hr>
          <small>Trân trọng,<br><strong>Nội Thất Dại Dũng Phát</strong></small>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { message: 'Đã gửi link đặt lại mật khẩu đến email của bạn' };
  }

  static async resetPassword(token, newPassword) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) throw new Error('Token không hợp lệ hoặc đã hết hạn');

    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return { message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.' };
  }
}

module.exports = UserService;