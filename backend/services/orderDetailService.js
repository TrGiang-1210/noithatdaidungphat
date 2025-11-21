const OrderDetail = require('../models/OrderDetail');

class OrderDetailService {
  static async getAll() {
    return await OrderDetail.find().populate('product_id');
  }

  static async getByOrderId(orderId) {
    const details = await OrderDetail.find({ order_id: orderId }).populate('product_id');
    if (!details.length) throw new Error('Order details not found');
    return details;
  }

  static async createMany(details) {
    return await OrderDetail.insertMany(details);
  }

  static async deleteByOrderId(orderId) {
    return await OrderDetail.deleteMany({ order_id: orderId });
  }
}

module.exports = OrderDetailService;