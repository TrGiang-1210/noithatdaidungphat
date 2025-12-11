// models/Order.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  address: { type: String, required: true },
});

const orderSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null // Cho phép guest checkout
  },

  order_code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },

  customer: customerSchema,

  payment_method: { 
    type: String, 
    enum: ['cod', 'bank', 'momo', 'vnpay'], 
    default: 'cod' 
  },

  total: { type: Number, required: true },

  status: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'Shipping', 'Completed', 'Cancelled'],
    default: 'Pending'
  },

  note: { type: String, default: '' },

  // ✅ THÊM FIELD RESERVE STOCK
  reservedUntil: { 
    type: Date,
    default: function() {
      // Mặc định giữ hàng 24 giờ
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  },

  // Nếu bạn dùng GHN, GHTK, ViettelPost...
  tracking_number: { type: String },
  carrier: { type: String },

}, { 
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  } 
});

// Tạo order_code tự động nếu chưa có
orderSchema.pre('save', function(next) {
  if (!this.order_code) {
    const date = new Date().toISOString().slice(2,10).replace(/-/g,'');
    const random = Math.floor(1000 + Math.random() * 9000);
    this.order_code = `DH${date}${random}`;
  }
  next();
});

// ✅ INDEX để tìm kiếm nhanh
orderSchema.index({ order_code: 1 });
orderSchema.index({ 'customer.phone': 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ reservedUntil: 1 });

module.exports = mongoose.model('Order', orderSchema);