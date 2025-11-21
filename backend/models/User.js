// src/models/User.js

const mongoose = require('mongoose');

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
      unique: true, // <<< QUAN TRỌNG: tránh 2 tài khoản cùng 1 số điện thoại
      sparse: true, // cho phép nhiều user để trống phone (vì default '')
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
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  }
);

// Index tìm kiếm nhanh bằng email hoặc phone
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

module.exports = mongoose.model('User', userSchema);