// models/OrderDetail.js - ✅ THÊM FIELD selectedAttributes
const mongoose = require("mongoose");

const OrderDetailSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  name: { type: String, required: true },
  img_url: { type: String, default: '' },
  
  // ✅ THÊM MỚI: Lưu thuộc tính đã chọn
  selectedAttributes: {
    type: Map,
    of: String,
    default: {}
  }
  // VD: { "Chất liệu": "Gỗ", "Màu sắc": "Đỏ", "Kích thước (cm)": "5 x 10" }
  
}, { timestamps: true });

module.exports = mongoose.model("OrderDetail", OrderDetailSchema);