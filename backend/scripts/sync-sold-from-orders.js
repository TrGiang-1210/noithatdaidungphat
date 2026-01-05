// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');

// ✅ IMPORTANT: Đường dẫn tương đối từ /script lên /models
const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderDetail = require('../models/OrderDetail');

// ✅ Lấy MongoDB URI từ .env
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/noithatdaidungphat';

async function syncSoldCount() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB:', MONGODB_URI);

    // 1. Lấy tất cả đơn hàng đã CONFIRMED/SHIPPING/COMPLETED
    const completedOrders = await Order.find({
      status: { $in: ['Confirmed', 'Shipping', 'Completed'] }
    }).select('_id status');

    const orderIds = completedOrders.map(o => o._id);
    console.log(`📦 Found ${orderIds.length} confirmed orders`);

    if (orderIds.length === 0) {
      console.log('⚠️  No confirmed orders found. Exiting...');
      await mongoose.disconnect();
      return;
    }

    // 2. Aggregate sold count từ OrderDetail
    const soldCounts = await OrderDetail.aggregate([
      { $match: { order_id: { $in: orderIds } } },
      { 
        $group: {
          _id: '$product_id',
          totalSold: { $sum: '$quantity' }
        }
      }
    ]);

    console.log(`📊 Processing ${soldCounts.length} products...\n`);

    // 3. Cập nhật sold vào Product
    let updated = 0;
    for (const item of soldCounts) {
      const product = await Product.findById(item._id);
      
      if (!product) {
        console.log(`  ⚠️  Product ${item._id} not found, skipping...`);
        continue;
      }

      const oldSold = product.sold || 0;
      await Product.updateOne(
        { _id: item._id },
        { $set: { sold: item.totalSold } }
      );
      
      updated++;
      
      // Lấy tên sản phẩm
      const productName = typeof product.name === 'object' 
        ? (product.name.vi || product.name.zh || 'N/A')
        : product.name;
      
      console.log(`  ✅ [${updated}/${soldCounts.length}] ${productName}`);
      console.log(`     Old sold: ${oldSold} → New sold: ${item.totalSold} (+${item.totalSold - oldSold})`);
    }

    console.log(`\n✅ Sync completed! Updated ${updated}/${soldCounts.length} products`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
syncSoldCount();