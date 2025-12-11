// services/OrderDetailService.js
const OrderDetail = require('../models/OrderDetail');

class OrderDetailService {
  static async getAll() {
    return await OrderDetail.find().populate('product_id');
  }

  static async getByOrderId(orderId) {
    // ✅ KHÔNG throw error nếu không có details
    const details = await OrderDetail.find({ order_id: orderId }).populate('product_id');
    return details; // trả về array rỗng nếu không có
  }

  static async createMany(details) {
    return await OrderDetail.insertMany(details);
  }

  static async deleteByOrderId(orderId) {
    return await OrderDetail.deleteMany({ order_id: orderId });
  }
}

module.exports = OrderDetailService;