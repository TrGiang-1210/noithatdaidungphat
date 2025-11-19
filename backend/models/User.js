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
      // Bạn có thể thêm validate số điện thoại VN sau nếu cần
      // match: [/^(0[3|5|7|8|9])+([0-9]{8})\b/, 'Số điện thoại không hợp lệ']
    },
    email: {
      type: String,
      required: [true, 'Vui lòng nhập email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
    },
    password: {
      type: String,
      required: [true, 'Vui lòng nhập mật khẩu'],
      minlength: 6,
      select: false, // Không trả password mặc định khi query
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // ==================== THÊM 2 FIELD CHO QUÊN MẬT KHẨU (BẢO MẬT CAO) ====================
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true, // tự động tạo createdAt & updatedAt (chuẩn Mongo)
  }
);

// ==================== INDEX ĐỂ TÌM KIẾM NHANH HƠN (tùy chọn nhưng rất tốt) ====================
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

module.exports = mongoose.model('User', userSchema);