const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },

  sku: { type: String, required: true, unique: true },

  images: { type: [String], required: true },  // array 3 ảnh

  description: { type: String, default: "" },

  priceOriginal: { type: Number, required: true },
  priceSale: { type: Number, required: true },

  material: { type: String, default: "" },
  color: { type: String, default: "" },
  size: { type: String, default: "" },

  quantity: { type: Number, required: true },

  // FIX: Bỏ required, cho phép array rỗng
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  }],

  hot: { type: Boolean, default: false },
  onSale: { type: Boolean, default: false },
  sold: { type: Number, default: 0 },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Tự động cập nhật updated_at
productSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model("Product", productSchema);