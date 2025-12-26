// models/OrderDetail.js - ✅ MULTILINGUAL SUPPORT
const mongoose = require("mongoose");

const OrderDetailSchema = new mongoose.Schema({
  order_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    required: true 
  },
  product_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  
  // ✅ MULTILINGUAL: name
  name: {
    type: mongoose.Schema.Types.Mixed, // Cho phép cả string và object
    required: true
  },
  // Có thể là string: "Bàn gỗ" (legacy)
  // Hoặc object: { vi: "Bàn gỗ", zh: "木桌" }
  
  img_url: { 
    type: String, 
    default: '' 
  },
  
  // ✅ MULTILINGUAL: selectedAttributes
  // VD: { 
  //   "Màu sắc": { vi: "Đỏ", zh: "红色" },
  //   "Kích thước": { vi: "5x10cm", zh: "5x10厘米" }
  // }
  selectedAttributes: {
    type: Map,
    of: mongoose.Schema.Types.Mixed, // Cho phép string hoặc object {vi, zh}
    default: {}
  }
  
}, { timestamps: true });

// ✅ Helper method: Lấy name theo language
OrderDetailSchema.methods.getNameByLang = function(lang = 'vi') {
  if (typeof this.name === 'string') {
    return this.name;
  }
  if (typeof this.name === 'object') {
    return this.name[lang] || this.name.vi || this.name.en || '';
  }
  return '';
};

// ✅ Helper method: Lấy attributes theo language
OrderDetailSchema.methods.getAttributesByLang = function(lang = 'vi') {
  if (!this.selectedAttributes) return {};
  
  const result = {};
  for (const [key, value] of this.selectedAttributes.entries()) {
    if (typeof value === 'string') {
      result[key] = value;
    } else if (typeof value === 'object') {
      result[key] = value[lang] || value.vi || value.en || '';
    }
  }
  return result;
};

module.exports = mongoose.model("OrderDetail", OrderDetailSchema);