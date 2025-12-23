// backend/scripts/seedTranslations.js
const mongoose = require('mongoose');
const Translation = require('../models/Translation');
require('dotenv').config();

const sampleTranslations = [
  // ========== HOME PAGE ==========
  { key: 'home.hotProducts', namespace: 'home', viText: 'Sản phẩm HOT', category: 'UI' },
  { key: 'home.saleProducts', namespace: 'home', viText: 'Sản phẩm siêu giảm giá', category: 'UI' },
  { key: 'home.newProducts', namespace: 'home', viText: 'Sản phẩm mới', category: 'UI' },
  
  // ========== COMMON ==========
  { key: 'common.viewAll', namespace: 'common', viText: 'Xem tất cả', category: 'UI' },
  { key: 'common.loading', namespace: 'common', viText: 'Đang tải dữ liệu...', category: 'UI' },
  { key: 'common.error', namespace: 'common', viText: 'Lỗi', category: 'UI' },
  { key: 'common.welcome', namespace: 'common', viText: 'Chào mừng', category: 'UI' },
  { key: 'common.home', namespace: 'common', viText: 'Trang chủ', category: 'UI' },
  { key: 'common.products', namespace: 'common', viText: 'Sản phẩm', category: 'UI' },
  { key: 'common.about', namespace: 'common', viText: 'Về chúng tôi', category: 'UI' },
  { key: 'common.contact', namespace: 'common', viText: 'Liên hệ', category: 'UI' },
  { key: 'common.search', namespace: 'common', viText: 'Tìm kiếm', category: 'UI' },
  { key: 'common.language', namespace: 'common', viText: 'Ngôn ngữ', category: 'UI' },
  
  // ========== HEADER ==========
  { key: 'header.topbar', namespace: 'header', viText: 'Nội Thất Đại Dũng Phát, Uy Tín - Chất Lượng - Chính Hãng', category: 'UI' },
  { key: 'header.searchPlaceholder', namespace: 'header', viText: 'Tìm kiếm sản phẩm...', category: 'UI' },
  { key: 'header.productCode', namespace: 'header', viText: 'Mã SP', category: 'UI' },
  { key: 'header.pressEnter', namespace: 'header', viText: 'Nhấn Enter để tìm', category: 'UI' },
  { key: 'header.noPhone', namespace: 'header', viText: 'Chưa có SĐT', category: 'UI' },
  { key: 'header.editProfile', namespace: 'header', viText: 'Chỉnh sửa', category: 'UI' },
  { key: 'header.logout', namespace: 'header', viText: 'Đăng xuất', category: 'UI' },
  { key: 'header.loginRegister', namespace: 'header', viText: 'Đăng ký/Đăng nhập', category: 'UI' },
  { key: 'header.cart', namespace: 'header', viText: 'Giỏ hàng', category: 'UI' },
  { key: 'header.categoryMenu', namespace: 'header', viText: 'DANH MỤC SẢN PHẨM', category: 'UI' },
  { key: 'header.noCategories', namespace: 'header', viText: 'Không có danh mục', category: 'UI' },
  { key: 'header.trackOrder', namespace: 'header', viText: 'Kiểm tra đơn hàng', category: 'UI' },
  { key: 'header.news', namespace: 'header', viText: 'Tin tức', category: 'UI' },
  { key: 'header.about', namespace: 'header', viText: 'Giới thiệu', category: 'UI' },
  
  // ========== FOOTER ==========
  { key: 'footer.description', namespace: 'footer', viText: 'Nội Thất Đại Dũng Phát — cung cấp sản phẩm nội thất chất lượng, bền đẹp, giá tốt cho gia đình, khách sạn, văn phòng.', category: 'UI' },
  { key: 'footer.policy', namespace: 'footer', viText: 'Chính sách', category: 'UI' },
  { key: 'footer.warrantyPolicy', namespace: 'footer', viText: 'Chính sách bảo hành', category: 'UI' },
  { key: 'footer.shippingPolicy', namespace: 'footer', viText: 'Chính sách vận chuyển', category: 'UI' },
  { key: 'footer.returnPolicy', namespace: 'footer', viText: 'Chính sách đổi trả', category: 'UI' },
  { key: 'footer.privacyPolicy', namespace: 'footer', viText: 'Bảo mật thông tin', category: 'UI' },
  { key: 'footer.categories', namespace: 'footer', viText: 'Danh mục sản phẩm', category: 'UI' },
  { key: 'footer.noCategories', namespace: 'footer', viText: 'Không có danh mục', category: 'UI' },
  { key: 'footer.contact', namespace: 'footer', viText: 'Liên hệ', category: 'UI' },
  { key: 'footer.store1Name', namespace: 'footer', viText: 'Nội Thất Đại Dũng Phát - Nội Thất Rẻ Đẹp Long An', category: 'UI' },
  { key: 'footer.store2Name', namespace: 'footer', viText: 'Nệm Đại Dũng Phát - Nệm Tốt Long An', category: 'UI' },
  { key: 'footer.address', namespace: 'footer', viText: 'Địa chỉ', category: 'UI' },
  { key: 'footer.phone', namespace: 'footer', viText: 'Điện thoại', category: 'UI' },
  { key: 'footer.workingHours', namespace: 'footer', viText: 'Giờ làm việc: 8:00 — 21:00 (T2—CN)', category: 'UI' },
  { key: 'footer.copyright', namespace: 'footer', viText: 'Đại Dũng Phát — All rights reserved.', category: 'UI' },
  
  // ========== PRODUCT (GENERAL) ==========
  { key: 'product.buyNow', namespace: 'products', viText: 'Mua ngay', category: 'UI' },
  { key: 'product.addToCart', namespace: 'products', viText: 'Thêm vào giỏ', category: 'UI' },
  { key: 'product.viewDetails', namespace: 'products', viText: 'Xem chi tiết', category: 'UI' },
  { key: 'product.price', namespace: 'products', viText: 'Giá', category: 'UI' },
  { key: 'product.quantity', namespace: 'products', viText: 'Số lượng', category: 'UI' },
  { key: 'product.inStock', namespace: 'products', viText: 'Còn hàng', category: 'UI' },
  { key: 'product.outOfStock', namespace: 'products', viText: 'Hết hàng', category: 'UI' },
  { key: 'product.description', namespace: 'products', viText: 'Mô tả sản phẩm', category: 'UI' },
  
  // ========== PRODUCT DETAIL PAGE ==========
  { key: 'product.sku', namespace: 'products', viText: 'Mã hàng', category: 'UI' },
  { key: 'product.material', namespace: 'products', viText: 'Chất liệu', category: 'UI' },
  { key: 'product.color', namespace: 'products', viText: 'Màu sắc', category: 'UI' },
  { key: 'product.size', namespace: 'products', viText: 'Kích thước (cm)', category: 'UI' },
  { key: 'product.condition', namespace: 'products', viText: 'Tình trạng', category: 'UI' },
  { key: 'product.status', namespace: 'products', viText: 'Trạng thái', category: 'UI' },
  { key: 'product.brandNew', namespace: 'products', viText: 'Hàng mới 100%', category: 'UI' },
  { key: 'product.deliveryCost', namespace: 'products', viText: 'Chi phí giao hàng', category: 'UI' },
  { key: 'product.freeDeliveryHCMC', namespace: 'products', viText: 'Giao lắp miễn phí tại các quận nội thành tại TPHCM.', category: 'UI' },
  { key: 'product.deliverySuburbs', namespace: 'products', viText: 'Quận 9, Hóc Môn, Thủ Đức, Củ Chi, Nhà Bè: 200.000 vnđ/đơn hàng', category: 'UI' },
  { key: 'product.deliveryOtherProvinces', namespace: 'products', viText: 'Các tỉnh thành khác: 400.000 vnđ/đơn hàng', category: 'UI' },
  { key: 'product.deliveryTime', namespace: 'products', viText: 'Thời gian giao hàng', category: 'UI' },
  { key: 'product.deliveryTimeRange', namespace: 'products', viText: 'Từ 6 giờ đến 10 ngày làm việc.', category: 'UI' },
  { key: 'product.installment0Percent', namespace: 'products', viText: 'MUA TRẢ GÓP 0% Thủ tục đơn giản', category: 'UI' },
  { key: 'product.installmentCard', namespace: 'products', viText: 'TRẢ GÓP 0% QUA THẺ Visa, Master, JCB', category: 'UI' },
  { key: 'product.relatedProducts', namespace: 'products', viText: 'CÁC SẢN PHẨM LIÊN QUAN', category: 'UI' },
  { key: 'product.noProductId', namespace: 'products', viText: 'Không có product id/slug trong URL', category: 'UI' },
  { key: 'product.notFound', namespace: 'products', viText: 'Không tìm thấy sản phẩm (kiểm tra backend route).', category: 'UI' },
  { key: 'product.noData', namespace: 'products', viText: 'Không có dữ liệu sản phẩm', category: 'UI' },
  
  // ========== CART & CHECKOUT ==========
  { key: 'cart.title', namespace: 'cart', viText: 'Giỏ hàng', category: 'UI' },
  { key: 'cart.empty', namespace: 'cart', viText: 'Giỏ hàng trống', category: 'UI' },
  { key: 'cart.checkout', namespace: 'cart', viText: 'Thanh toán', category: 'UI' },
  { key: 'cart.total', namespace: 'cart', viText: 'Tổng cộng', category: 'UI' },
  { key: 'cart.remove', namespace: 'cart', viText: 'Xóa', category: 'UI' },
  { key: 'cart.update', namespace: 'cart', viText: 'Cập nhật', category: 'UI' },
  { key: 'cart.continueShopping', namespace: 'cart', viText: 'Tiếp tục mua sắm', category: 'UI' },
  
  // ========== USER ACCOUNT ==========
  { key: 'user.login', namespace: 'auth', viText: 'Đăng nhập', category: 'UI' },
  { key: 'user.register', namespace: 'auth', viText: 'Đăng ký', category: 'UI' },
  { key: 'user.logout', namespace: 'auth', viText: 'Đăng xuất', category: 'UI' },
  { key: 'user.profile', namespace: 'auth', viText: 'Tài khoản', category: 'UI' },
  { key: 'user.myOrders', namespace: 'auth', viText: 'Đơn hàng của tôi', category: 'UI' },
  { key: 'user.email', namespace: 'auth', viText: 'Email', category: 'UI' },
  { key: 'user.password', namespace: 'auth', viText: 'Mật khẩu', category: 'UI' },
  
  // ========== ORDER STATUS ==========
  { key: 'order.pending', namespace: 'orders', viText: 'Chờ xử lý', category: 'UI' },
  { key: 'order.confirmed', namespace: 'orders', viText: 'Đã xác nhận', category: 'UI' },
  { key: 'order.shipping', namespace: 'orders', viText: 'Đang giao', category: 'UI' },
  { key: 'order.delivered', namespace: 'orders', viText: 'Đã giao', category: 'UI' },
  { key: 'order.cancelled', namespace: 'orders', viText: 'Đã hủy', category: 'UI' },
  
  // ========== MESSAGES ==========
  { key: 'message.success', namespace: 'messages', viText: 'Thành công!', category: 'notification' },
  { key: 'message.error', namespace: 'messages', viText: 'Có lỗi xảy ra', category: 'error' },
  { key: 'message.addedToCart', namespace: 'messages', viText: 'Đã thêm vào giỏ hàng', category: 'notification' },
  { key: 'message.orderPlaced', namespace: 'messages', viText: 'Đặt hàng thành công', category: 'notification' },
];

async function seed() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    console.log('🌱 Seeding translation keys...\n');
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const item of sampleTranslations) {
      const existing = await Translation.findOne({ key: item.key });
      
      if (existing) {
        console.log(`⚠️  Key "${item.key}" already exists - skipping`);
        skippedCount++;
      } else {
        await Translation.create({
          key: item.key,
          namespace: item.namespace,
          category: item.category,
          context: item.context || `Translation for ${item.key}`,
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
    console.log(`   Skipped (existing): ${skippedCount} keys`);
    console.log(`   Total: ${sampleTranslations.length} keys`);
    console.log('='.repeat(60) + '\n');
    
    console.log('📋 Next steps:');
    console.log('   1. Restart backend server');
    console.log('   2. Go to: http://localhost:5173/admin/quan-ly-ngon-ngu');
    console.log('   3. Select all keys (or filter by namespace)');
    console.log('   4. Click "AI Translate" button');
    console.log('   5. Review and approve translations');
    console.log('   6. Test language switcher on frontend\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding translations:', error);
    process.exit(1);
  }
}

seed();