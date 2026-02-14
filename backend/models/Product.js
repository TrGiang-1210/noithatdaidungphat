const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  
  // ✅ MULTILINGUAL: Name
  name: {
    vi: { type: String, required: true },
    zh: { type: String, default: "" }
  },
  
  sku: { type: String, required: true, unique: true },
  images: { type: [String], required: true },
  
  // ✅ MULTILINGUAL: Description
  description: {
    vi: { type: String, default: "" },
    zh: { type: String, default: "" }
  },
  
  priceOriginal: { type: Number, required: true },
  priceSale: { type: Number, required: true },

  // ✅ MULTILINGUAL: Attributes
  attributes: [{
    name: {
      vi: { type: String, required: true },
      zh: { type: String, default: "" }
    },
    options: [{
      label: {
        vi: { type: String, required: true },
        zh: { type: String, default: "" }
      },
      value: { type: String, required: true },
      image: { type: String },
      isDefault: { type: Boolean, default: false }
    }]
  }],

  variants: [{
    combination: [{
      name: { vi: String, zh: String }, // Tên thuộc tính: ví dụ "Chất liệu"
      option: { vi: String, zh: String } // Giá trị: ví dụ "Quy chuẩn"
    }],
    priceOriginal: { type: Number, default: 0 },
    priceSale: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    sku: { type: String },
    image: { type: String } 
  }],

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

// ✅ QUAN TRỌNG: Kiểm tra model đã tồn tại chưa
module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);