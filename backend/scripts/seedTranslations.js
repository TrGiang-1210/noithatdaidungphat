// backend/scripts/seedTranslations.js
const mongoose = require('mongoose');
const Translation = require('../models/Translation');
require('dotenv').config();

const sampleTranslations = [
  // Common UI
  { key: 'common.welcome', namespace: 'common', viText: 'Chào mừng', category: 'UI', context: 'Welcome message' },
  { key: 'common.home', namespace: 'common', viText: 'Trang chủ', category: 'UI', context: 'Homepage link' },
  { key: 'common.products', namespace: 'common', viText: 'Sản phẩm', category: 'UI', context: 'Products page' },
  { key: 'common.about', namespace: 'common', viText: 'Về chúng tôi', category: 'UI', context: 'About page' },
  { key: 'common.contact', namespace: 'common', viText: 'Liên hệ', category: 'UI', context: 'Contact page' },
  { key: 'common.search', namespace: 'common', viText: 'Tìm kiếm', category: 'UI', context: 'Search placeholder' },
  { key: 'common.loading', namespace: 'common', viText: 'Đang tải...', category: 'UI', context: 'Loading state' },
  { key: 'common.language', namespace: 'common', viText: 'Ngôn ngữ', category: 'UI', context: 'Language selector' },
  
  // Product related
  { key: 'product.buyNow', namespace: 'products', viText: 'Mua ngay', category: 'UI', context: 'Buy button' },
  { key: 'product.addToCart', namespace: 'products', viText: 'Thêm vào giỏ', category: 'UI', context: 'Add to cart button' },
  { key: 'product.viewDetails', namespace: 'products', viText: 'Xem chi tiết', category: 'UI', context: 'View product details' },
  { key: 'product.price', namespace: 'products', viText: 'Giá', category: 'UI', context: 'Price label' },
  { key: 'product.quantity', namespace: 'products', viText: 'Số lượng', category: 'UI', context: 'Quantity input' },
  { key: 'product.inStock', namespace: 'products', viText: 'Còn hàng', category: 'UI', context: 'Stock status' },
  { key: 'product.outOfStock', namespace: 'products', viText: 'Hết hàng', category: 'UI', context: 'Out of stock' },
  { key: 'product.description', namespace: 'products', viText: 'Mô tả sản phẩm', category: 'UI', context: 'Description section' },
  
  // Cart & Checkout
  { key: 'cart.title', namespace: 'cart', viText: 'Giỏ hàng', category: 'UI', context: 'Cart page title' },
  { key: 'cart.empty', namespace: 'cart', viText: 'Giỏ hàng trống', category: 'UI', context: 'Empty cart message' },
  { key: 'cart.checkout', namespace: 'cart', viText: 'Thanh toán', category: 'UI', context: 'Checkout button' },
  { key: 'cart.total', namespace: 'cart', viText: 'Tổng cộng', category: 'UI', context: 'Total amount' },
  { key: 'cart.remove', namespace: 'cart', viText: 'Xóa', category: 'UI', context: 'Remove item button' },
  { key: 'cart.update', namespace: 'cart', viText: 'Cập nhật', category: 'UI', context: 'Update cart button' },
  { key: 'cart.continueShopping', namespace: 'cart', viText: 'Tiếp tục mua sắm', category: 'UI', context: 'Continue shopping link' },
  
  // User Account
  { key: 'user.login', namespace: 'auth', viText: 'Đăng nhập', category: 'UI', context: 'Login button' },
  { key: 'user.register', namespace: 'auth', viText: 'Đăng ký', category: 'UI', context: 'Register button' },
  { key: 'user.logout', namespace: 'auth', viText: 'Đăng xuất', category: 'UI', context: 'Logout button' },
  { key: 'user.profile', namespace: 'auth', viText: 'Tài khoản', category: 'UI', context: 'Profile page' },
  { key: 'user.myOrders', namespace: 'auth', viText: 'Đơn hàng của tôi', category: 'UI', context: 'Orders page' },
  { key: 'user.email', namespace: 'auth', viText: 'Email', category: 'UI', context: 'Email input' },
  { key: 'user.password', namespace: 'auth', viText: 'Mật khẩu', category: 'UI', context: 'Password input' },
  
  // Order Status
  { key: 'order.pending', namespace: 'orders', viText: 'Chờ xử lý', category: 'UI', context: 'Order status' },
  { key: 'order.confirmed', namespace: 'orders', viText: 'Đã xác nhận', category: 'UI', context: 'Order status' },
  { key: 'order.shipping', namespace: 'orders', viText: 'Đang giao', category: 'UI', context: 'Order status' },
  { key: 'order.delivered', namespace: 'orders', viText: 'Đã giao', category: 'UI', context: 'Order status' },
  { key: 'order.cancelled', namespace: 'orders', viText: 'Đã hủy', category: 'UI', context: 'Order status' },
  
  // Messages
  { key: 'message.success', namespace: 'messages', viText: 'Thành công!', category: 'notification', context: 'Success message' },
  { key: 'message.error', namespace: 'messages', viText: 'Có lỗi xảy ra', category: 'error', context: 'Error message' },
  { key: 'message.addedToCart', namespace: 'messages', viText: 'Đã thêm vào giỏ hàng', category: 'notification', context: 'Add to cart success' },
  { key: 'message.orderPlaced', namespace: 'messages', viText: 'Đặt hàng thành công', category: 'notification', context: 'Order success' },
];

async function seed() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    console.log('🌱 Seeding translation keys...\n');
    
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const item of sampleTranslations) {
      const existing = await Translation.findOne({ key: item.key });
      
      if (existing) {
        console.log(`⚠️  Key "${item.key}" already exists - skipping`);
        updatedCount++;
      } else {
        await Translation.create({
          key: item.key,
          namespace: item.namespace,
          category: item.category,
          context: item.context,
          translations: {
            vi: {
              value: item.viText,
              status: 'draft',
              translatedBy: 'system',
              lastModified: new Date()
            },
            zh: {
              status: 'draft'
            }
          }
        });
        console.log(`✅ Created: ${item.key}`);
        createdCount++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Seeding completed!');
    console.log(`   Created: ${createdCount} keys`);
    console.log(`   Skipped (existing): ${updatedCount} keys`);
    console.log(`   Total: ${sampleTranslations.length} keys`);
    console.log('='.repeat(60) + '\n');
    
    console.log('📝 Next steps:');
    console.log('   1. Access admin panel: http://localhost:5173/admin/quan-ly-ngon-ngu');
    console.log('   2. Select keys and click "AI Translate" button');
    console.log('   3. Review and approve translations');
    console.log('   4. Use translations in your frontend\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding translations:', error);
    process.exit(1);
  }
}

seed();