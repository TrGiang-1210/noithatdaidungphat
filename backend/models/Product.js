const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  images: { type: [String], required: true },
  description: { type: String, default: "" },
  priceOriginal: { type: Number, required: true },
  priceSale: { type: Number, required: true },

  // ✅ THÊM: Hệ thống thuộc tính động
  attributes: [{
    name: { type: String, required: true }, // "Chất liệu", "Màu sắc", "Kích thước (cm)"
    options: [{
      label: { type: String, required: true }, // "MDF EC | Duy chuẩn / Không LED"
      value: { type: String, required: true }, // "mdf-ec-duy-chuan"
      image: { type: String }, // "/uploads/attributes/xxx.jpg" (optional)
      isDefault: { type: Boolean, default: false } // Option mặc định
    }]
  }],

  // Các field cũ (giữ lại cho backward compatibility)
  material: { type: String, default: "" },
  color: { type: String, default: "" },
  size: { type: String, default: "" },

  quantity: { type: Number, required: true },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  }],
  hot: { type: Boolean, default: false },
  onSale: { type: Boolean, default: false },
  sold: { type: Number, default: 0 },
  view: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

productSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model("Product", productSchema);