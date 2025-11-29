// models/Order.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },        // <-- BẮT BUỘC có
  email: String,
  address: { type: String, required: true },
});

const orderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Quan trọng: bạn cần 1 trường code để khách tra cứu!
  order_code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  }, // VD: DH251129048

  customer: customerSchema,

  payment_method: { 
    type: String, 
    enum: ['cod', 'bank', 'momo', 'vnpay'], 
    default: 'cod' 
  },

  total: { type: Number, required: true },

  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'packaging', 'shipped', 'delivering', 'delivered', 'cancelled'],
    default: 'pending'
  },

  // Nếu bạn dùng GHN, GHTK, ViettelPost...
  tracking_number: { type: String },        // VD: 80221123456789
  carrier: { type: String },                // "GHN", "GHTK", ...

}, { 
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  } 
});

// Tạo order_code tự động nếu chưa có (khi tạo đơn hàng)
orderSchema.pre('save', function(next) {
  if (!this.order_code) {
    const date = new Date().toISOString().slice(2,10).replace(/-/g,'');
    const random = Math.floor(1000 + Math.random() * 9000);
    this.order_code = `DH${date}${random}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);