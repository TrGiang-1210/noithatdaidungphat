// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập họ tên'],
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
      unique: true,
      sparse: true, // cho phép nhiều user để trống phone
      match: [/^(0[3|5|7|8|9][0-9]{8})$/, 'Số điện thoại Việt Nam không hợp lệ'],
    },
    email: {
      type: String,
      required: [true, 'Vui lòng nhập email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Vui lòng nhập mật khẩu'],
      minlength: 6,
      select: false, // không trả về password khi query
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // ←←← THÊM 2 FIELD QUAN TRỌNG CHO RESET PASSWORD
    resetPasswordToken: String,         // token đã được hash SHA256
    resetPasswordExpire: Date,          // thời gian hết hạn
  },
  {
    timestamps: true,
  }
);

// ==================== PRE-SAVE: HASH PASSWORD ====================
userSchema.pre('save', async function (next) {
  // Chỉ hash khi password được thay đổi (hoặc tạo mới)
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ==================== METHOD: TẠO RESET TOKEN ====================
// Gọi trong controller: const { token, hashedToken } = await user.createPasswordResetToken();
userSchema.methods.createPasswordResetToken = function () {
  // Token thô gửi qua email (hex 32 bytes)
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token trước khi lưu vào DB (SHA256)
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Hết hạn sau 15 phút (có thể thay đổi)
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken; // ← trả về token thô để gửi email
};

// Index tìm kiếm nhanh
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
// Index cho reset token (tăng tốc tìm kiếm)
userSchema.index({ resetPasswordToken: 1 });

module.exports = mongoose.model('User', userSchema);