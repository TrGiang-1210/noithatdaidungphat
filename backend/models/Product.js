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

  // ✅ MULTILINGUAL: Attributes (thuộc tính động)
  attributes: [{
    name: {
      vi: { type: String, required: true }, // "Chất liệu"
      zh: { type: String, default: "" }     // "材料"
    },
    options: [{
      label: {
        vi: { type: String, required: true }, // "MDF EC | Duy chuẩn"
        zh: { type: String, default: "" }     // "MDF EC | 标准"
      },
      value: { type: String, required: true }, // "mdf-ec-duy-chuan" (không dịch)
      image: { type: String },
      isDefault: { type: Boolean, default: false }
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