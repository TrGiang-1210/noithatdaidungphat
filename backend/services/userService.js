// src/services/userService.js

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

class UserService {
  // ==================== LẤY USER THEO ID (dùng chung) ====================
  static async getUserById(id) {
    const user = await User.findById(id).select('-password');
    if (!user) throw new Error('Không tìm thấy người dùng');
    return user;
  }

  // ==================== TẠO USER MỚI (REGISTER) ====================
  static async createUser({ name, phone = '', email, password }) {
    // Kiểm tra email hoặc phone đã tồn tại
    const existingUser = await User.findOne({
      $or: [{ email }, { phone: phone || undefined }]
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
      role: 'user' // mặc định
    });

    return newUser;
  }

  // ==================== ĐĂNG NHẬP ====================
  static async loginUser(email, password) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // khuyến khích 7 ngày
    );

    return {
      user,
      token
    };
  }

  // ==================== CẬP NHẬT PROFILE ====================
  static async updateUser(userId, updateData) {
    if (updateData.email || updateData.phone) {
      const existing = await User.findOne({
        _id: { $ne: userId },
        $or: [
          { email: updateData.email },
          { phone: updateData.phone }
        ]
      });
      if (existing) {
        throw new Error('Email hoặc số điện thoại đã được sử dụng bởi tài khoản khác');
      }
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) throw new Error('Không tìm thấy người dùng để cập nhật');

    return updatedUser;
  }

  // ==================== QUÊN MẬT KHẨU (gửi email reset) ====================
  static async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) {
      // Không báo lỗi cụ thể để tránh lộ thông tin
      return { message: 'Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu' };
    }

    // Tạo mật khẩu reset token (tốt hơn dùng crypto thay vì jwt)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 phút
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD // dùng App Password thay vì mật khẩu thật
      }
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
          <p>Vui lòng nhấn nút bên dưới để đặt lại mật khẩu (hết hạn sau 10 phút):</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #001f3f; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Đặt lại mật khẩu</a>
          </div>
          <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
          <hr>
          <small>Trân trọng,<br><strong>Nội Thất Dại Dũng Phát</strong></small>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return { message: 'Đã gửi link đặt lại mật khẩu đến email của bạn' };
  }

  // ==================== ĐẶT LẠI MẬT KHẨU ====================
  static async resetPassword(token, newPassword) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new Error('Token không hợp lệ hoặc đã hết hạn');
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return { message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.' };
  }
}

module.exports = UserService;