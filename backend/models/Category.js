const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  
  // ✅ MULTILINGUAL: Name
  name: {
    vi: { type: String, required: true },
    zh: { type: String, default: "" }
  },
  
  // ✅ MULTILINGUAL: Description
  description: {
    vi: { type: String, default: "" },
    zh: { type: String, default: "" }
  },

  // Hierarchy fields
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    default: null
  },
  ancestors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  }],
  level: { type: Number, default: 0 },

  image: String,
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Index
categorySchema.index({ parent: 1 });
categorySchema.index({ slug: 1 });

// Tự động cập nhật updated_at
categorySchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

// ✅ QUAN TRỌNG: Kiểm tra model đã tồn tại chưa trước khi export
module.exports = mongoose.models.Category || mongoose.model('Category', categorySchema);