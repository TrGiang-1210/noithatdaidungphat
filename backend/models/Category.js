const mongoose = require('mongoose');   // ← THÊM DÒNG NÀY
const Schema = mongoose.Schema;

const categorySchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,

  // THÊM 3 FIELD SIÊU QUAN TRỌNG:
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    default: null
  },
  // (Tùy chọn) để query nhanh hơn, có thể thêm:
  ancestors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  }], // ví dụ: ["nội thất", "phòng khách", "sofa"]
  level: { type: Number, default: 0 }, // 0 = gốc, 1 = con, 2 = cháu...

  image: String,        // ảnh danh mục
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Index để tìm nhanh theo parent
categorySchema.index({ parent: 1 });
categorySchema.index({ slug: 1 });

// Tự động cập nhật updated_at
categorySchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('Category', categorySchema);