// scripts/orderCronjob.js
const cron = require('node-cron');
const Order = require('../models/Order');
const OrderDetail = require('../models/OrderDetail');
const Product = require('../models/Product');

/**
 * Cronjob tự động hủy đơn hàng quá hạn reserve và hoàn tồn kho
 * Chạy mỗi 15 phút
 */
function startOrderReserveCronjob() {
  // Chạy mỗi 15 phút: */15 * * * *
  // Hoặc mỗi giờ: 0 * * * *
  cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('🔄 [CRONJOB] Kiểm tra đơn hàng hết hạn reserve...');

      const now = new Date();

      // Tìm các đơn hàng Pending đã hết hạn reserve
      const expiredOrders = await Order.find({
        status: 'Pending',
        reservedUntil: { $lt: now }
      });

      if (expiredOrders.length === 0) {
        console.log('✅ [CRONJOB] Không có đơn hàng nào hết hạn');
        return;
      }

      console.log(`📦 [CRONJOB] Tìm thấy ${expiredOrders.length} đơn hàng hết hạn`);

      for (const order of expiredOrders) {
        try {
          // Lấy chi tiết đơn hàng
          const orderDetails = await OrderDetail.find({ order_id: order._id });

          // Hoàn lại tồn kho
          for (const detail of orderDetails) {
            try {
              const product = await Product.findById(detail.product_id);
              if (product) {
                product.quantity += detail.quantity;
                await product.save();
                console.log(`  ✅ Hoàn ${detail.quantity}x ${detail.name} (ID: ${detail.product_id})`);
              }
            } catch (productError) {
              console.error(`  ❌ Lỗi hoàn tồn kho cho ${detail.name}:`, productError.message);
            }
          }

          // Cập nhật trạng thái đơn hàng
          order.status = 'Cancelled';
          order.note = (order.note || '') + '\n[Auto] Đã hủy do quá hạn xác nhận (24h)';
          order.updated_at = new Date();
          await order.save();

          console.log(`✅ [CRONJOB] Đã hủy đơn ${order.order_code} và hoàn tồn kho`);

        } catch (orderError) {
          console.error(`❌ [CRONJOB] Lỗi xử lý đơn ${order.order_code}:`, orderError.message);
        }
      }

      console.log('✅ [CRONJOB] Hoàn thành kiểm tra đơn hàng');

    } catch (error) {
      console.error('❌ [CRONJOB] Lỗi cronjob:', error);
    }
  });

  console.log('✅ Order Reserve Cronjob đã được khởi động (chạy mỗi 15 phút)');
}

module.exports = { startOrderReserveCronjob };