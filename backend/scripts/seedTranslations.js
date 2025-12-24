// backend/scripts/seedTranslations.js - FULL VERSION WITH CHECKOUT
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
  { key: 'common.back', namespace: 'common', viText: 'Quay lại trang trước', category: 'UI' },
  
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
  { key: 'footer.description', namespace: 'footer', viText: 'Nội Thất Đại Dũng Phát – cung cấp sản phẩm nội thất chất lượng, bền đẹp, giá tốt cho gia đình, khách sạn, văn phòng.', category: 'UI' },
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
  { key: 'footer.workingHours', namespace: 'footer', viText: 'Giờ làm việc: 8:00 – 21:00 (T2–CN)', category: 'UI' },
  { key: 'footer.copyright', namespace: 'footer', viText: 'Đại Dũng Phát – All rights reserved.', category: 'UI' },
  
  // ========== PRODUCT (GENERAL) ==========
  { key: 'product.buyNow', namespace: 'products', viText: 'Mua ngay', category: 'UI' },
  { key: 'product.addToCart', namespace: 'products', viText: 'Thêm vào giỏ', category: 'UI' },
  { key: 'product.viewDetails', namespace: 'products', viText: 'Xem chi tiết', category: 'UI' },
  { key: 'product.price', namespace: 'products', viText: 'Giá', category: 'UI' },
  { key: 'product.quantity', namespace: 'products', viText: 'Số lượng', category: 'UI' },
  { key: 'product.inStock', namespace: 'products', viText: 'Còn hàng', category: 'UI' },
  { key: 'product.outOfStock', namespace: 'products', viText: 'Hết hàng', category: 'UI' },
  { key: 'product.description', namespace: 'products', viText: 'Mô tả sản phẩm', category: 'UI' },
  { key: 'product.standard', namespace: 'products', viText: 'Tiêu chuẩn', category: 'UI' },

  // ========== CATEGORY PAGE ==========
  { key: 'category.allProducts', namespace: 'category', viText: 'Tất cả sản phẩm', category: 'UI' },
  { key: 'category.all', namespace: 'category', viText: 'Tất cả', category: 'UI' },
  { key: 'category.sortBy', namespace: 'category', viText: 'Sắp xếp:', category: 'UI' },
  { key: 'category.sortNewest', namespace: 'category', viText: 'Mới nhất', category: 'UI' },
  { key: 'category.sortPriceAsc', namespace: 'category', viText: 'Giá tăng dần', category: 'UI' },
  { key: 'category.sortPriceDesc', namespace: 'category', viText: 'Giá giảm dần', category: 'UI' },
  { key: 'category.sortBestSelling', namespace: 'category', viText: 'Bán chạy nhất', category: 'UI' },
  { key: 'category.noProducts', namespace: 'category', viText: 'Không tìm thấy sản phẩm nào trong danh mục này.', category: 'UI' },

  // Price Filter
  { key: 'category.priceRange', namespace: 'category', viText: 'Khoảng giá', category: 'UI' },
  { key: 'category.priceUnder2M', namespace: 'category', viText: 'Dưới 2 triệu', category: 'UI' },
  { key: 'category.price2to5M', namespace: 'category', viText: '2 - 5 triệu', category: 'UI' },
  { key: 'category.price5to10M', namespace: 'category', viText: '5 - 10 triệu', category: 'UI' },
  { key: 'category.price10to20M', namespace: 'category', viText: '10 - 20 triệu', category: 'UI' },
  { key: 'category.priceAbove20M', namespace: 'category', viText: 'Trên 20 triệu', category: 'UI' },
  { key: 'category.orSelectRange', namespace: 'category', viText: 'Hoặc chọn khoảng giá', category: 'UI' },
  { key: 'category.priceFrom', namespace: 'category', viText: '₫ Từ', category: 'UI' },
  { key: 'category.priceTo', namespace: 'category', viText: '₫ ĐẾN', category: 'UI' },
  { key: 'category.apply', namespace: 'category', viText: 'Áp dụng', category: 'UI' },

  // Product badges
  { key: 'category.sale', namespace: 'category', viText: 'Sale', category: 'UI' },
  { key: 'category.hot', namespace: 'category', viText: 'Hot', category: 'UI' },
  { key: 'category.outOfStock', namespace: 'category', viText: 'Hết hàng', category: 'UI' },
  
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
  { key: 'cart.emptyCart', namespace: 'cart', viText: 'Giỏ hàng trống', category: 'UI' },
  { key: 'cart.checkout', namespace: 'cart', viText: 'Thanh toán', category: 'UI' },
  { key: 'cart.total', namespace: 'cart', viText: 'Tổng cộng', category: 'UI' },
  { key: 'cart.remove', namespace: 'cart', viText: 'Xóa', category: 'UI' },
  { key: 'cart.removeItem', namespace: 'cart', viText: 'Xóa sản phẩm khỏi giỏ hàng', category: 'UI' },
  { key: 'cart.update', namespace: 'cart', viText: 'Cập nhật', category: 'UI' },
  { key: 'cart.continueShopping', namespace: 'cart', viText: 'Tiếp tục mua sắm', category: 'UI' },
  { key: 'cart.noProductName', namespace: 'cart', viText: 'Không có tên', category: 'UI' },
  
  // ========== CHECKOUT PAGE ==========
  { key: 'checkout.deliveryInfo', namespace: 'checkout', viText: 'THÔNG TIN GIAO HÀNG', category: 'UI' },
  { key: 'checkout.phonePlaceholder', namespace: 'checkout', viText: 'Số điện thoại *', category: 'UI' },
  { key: 'checkout.emailPlaceholder', namespace: 'checkout', viText: 'Email', category: 'UI' },
  { key: 'checkout.namePlaceholder', namespace: 'checkout', viText: 'Họ và tên *', category: 'UI' },
  { key: 'checkout.selectProvince', namespace: 'checkout', viText: 'Chọn tỉnh / thành phố *', category: 'UI' },
  { key: 'checkout.addressPlaceholder', namespace: 'checkout', viText: 'Địa chỉ chi tiết *', category: 'UI' },
  { key: 'checkout.notePlaceholder', namespace: 'checkout', viText: 'Nhập ghi chú (nếu có)', category: 'UI' },
  { key: 'checkout.validPhone', namespace: 'checkout', viText: 'Vui lòng nhập số điện thoại hợp lệ', category: 'UI' },
  { key: 'checkout.enterName', namespace: 'checkout', viText: 'Vui lòng nhập họ tên', category: 'error' },
  { key: 'checkout.enterPhone', namespace: 'checkout', viText: 'Vui lòng nhập số điện thoại', category: 'error' },
  { key: 'checkout.enterAddress', namespace: 'checkout', viText: 'Vui lòng nhập địa chỉ', category: 'error' },
  { key: 'checkout.paymentCOD', namespace: 'checkout', viText: 'Thanh toán khi nhận hàng', category: 'UI' },
  { key: 'checkout.paymentBank', namespace: 'checkout', viText: 'Thanh toán chuyển khoản', category: 'UI' },
  { key: 'checkout.bankAccount', namespace: 'checkout', viText: 'Tài khoản ngân hàng: Ngân hàng Thương mại Cổ phần Á Châu (ACB)', category: 'UI' },
  { key: 'checkout.accountHolder', namespace: 'checkout', viText: 'Chủ tài khoản', category: 'UI' },
  { key: 'checkout.accountNumber', namespace: 'checkout', viText: 'Số tài khoản', category: 'UI' },
  { key: 'checkout.qrAlt', namespace: 'checkout', viText: 'QR chuyển khoản ACB', category: 'UI' },
  { key: 'checkout.bankNote', namespace: 'checkout', viText: 'Sau khi chuyển khoản, vui lòng nhấn nút xác nhận bên dưới để hoàn tất đơn hàng.', category: 'UI' },
  { key: 'checkout.confirmPayment', namespace: 'checkout', viText: 'XÁC NHẬN THANH TOÁN', category: 'UI' },
  { key: 'checkout.processing', namespace: 'checkout', viText: 'ĐANG XỬ LÝ...', category: 'UI' },
  { key: 'checkout.support', namespace: 'checkout', viText: 'Hỗ trợ', category: 'UI' },
  { key: 'checkout.orderSuccess', namespace: 'checkout', viText: 'Đặt hàng thành công! Chúng tôi sẽ liên hệ ngay', category: 'notification' },
  { key: 'checkout.orderFailed', namespace: 'checkout', viText: 'Đặt hàng thất bại. Vui lòng thử lại.', category: 'error' },
  { key: 'checkout.guestCheckoutInfo', namespace: 'checkout', viText: 'Bạn có thể xem giỏ hàng mà không cần đăng nhập. Đăng nhập để lưu đơn hoặc hoàn tất thanh toán.', category: 'notification' },
  { key: 'checkout.shippingFee', namespace: 'checkout', viText: 'Phí vận chuyển', category: 'UI' },
  
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
  
  // ========== ORDER SUCCESS PAGE ==========
  { key: 'orderSuccess.title', namespace: 'orderSuccess', viText: 'ĐẶT HÀNG THÀNH CÔNG!', category: 'UI' },
  { key: 'orderSuccess.thankYou', namespace: 'orderSuccess', viText: 'Cảm ơn Quý khách đã tin tưởng mua sắm tại', category: 'UI' },
  { key: 'orderSuccess.companyName', namespace: 'orderSuccess', viText: 'NỘI THẤT ĐẠI DŨNG PHÁT', category: 'UI' },
  { key: 'orderSuccess.orderCodeLabel', namespace: 'orderSuccess', viText: 'MÃ ĐƠN HÀNG CỦA QUÝ KHÁCH', category: 'UI' },
  { key: 'orderSuccess.keepCodeNote', namespace: 'orderSuccess', viText: 'Vui lòng giữ lại mã này để tiện trao đổi với nhân viên tư vấn', category: 'UI' },
  { key: 'orderSuccess.receivedOrder', namespace: 'orderSuccess', viText: 'Chúng tôi đã nhận được đơn hàng của Quý khách.', category: 'UI' },
  { key: 'orderSuccess.contactTime1', namespace: 'orderSuccess', viText: 'Nhân viên sẽ liên hệ xác nhận trong vòng', category: 'UI' },
  { key: 'orderSuccess.contactTime2', namespace: 'orderSuccess', viText: '30 phút - 2 giờ', category: 'UI' },
  { key: 'orderSuccess.contactTime3', namespace: 'orderSuccess', viText: 'tới.', category: 'UI' },
  { key: 'orderSuccess.immediateSupport', namespace: 'orderSuccess', viText: 'Nếu cần hỗ trợ ngay, vui lòng gọi Hotline', category: 'UI' },
  { key: 'orderSuccess.backHome', namespace: 'orderSuccess', viText: 'Về Trang Chủ', category: 'UI' },
  { key: 'orderSuccess.regards', namespace: 'orderSuccess', viText: 'Trân trọng', category: 'UI' },
  { key: 'orderSuccess.signature', namespace: 'orderSuccess', viText: 'Nội Thất Đại Dũng Phát - Uy Tín Từ Tâm', category: 'UI' },
  
  // ========== ORDER TRACKING PAGE ==========
  { key: 'orderTracking.title', namespace: 'orderTracking', viText: 'Tra cứu đơn hàng', category: 'UI' },
  { key: 'orderTracking.subtitle', namespace: 'orderTracking', viText: 'Nhập mã đơn hàng và số điện thoại để kiểm tra', category: 'UI' },
  { key: 'orderTracking.orderCode', namespace: 'orderTracking', viText: 'Mã đơn hàng', category: 'UI' },
  { key: 'orderTracking.orderCodePlaceholder', namespace: 'orderTracking', viText: 'Ví dụ: DH2512150001', category: 'UI' },
  { key: 'orderTracking.phone', namespace: 'orderTracking', viText: 'Số điện thoại', category: 'UI' },
  { key: 'orderTracking.phonePlaceholder', namespace: 'orderTracking', viText: 'Nhập số điện thoại đặt hàng', category: 'UI' },
  { key: 'orderTracking.fillAllFields', namespace: 'orderTracking', viText: 'Vui lòng nhập đầy đủ thông tin', category: 'error' },
  { key: 'orderTracking.orderNotFound', namespace: 'orderTracking', viText: 'Không tìm thấy đơn hàng với thông tin này', category: 'error' },
  { key: 'orderTracking.searching', namespace: 'orderTracking', viText: 'Đang tìm...', category: 'UI' },
  { key: 'orderTracking.searchButton', namespace: 'orderTracking', viText: 'Tra cứu đơn hàng', category: 'UI' },
  { key: 'orderTracking.orderLabel', namespace: 'orderTracking', viText: 'Đơn hàng', category: 'UI' },
  { key: 'orderTracking.customerInfo', namespace: 'orderTracking', viText: 'Thông tin khách hàng', category: 'UI' },
  { key: 'orderTracking.fullName', namespace: 'orderTracking', viText: 'Họ tên', category: 'UI' },
  { key: 'orderTracking.address', namespace: 'orderTracking', viText: 'Địa chỉ', category: 'UI' },
  { key: 'orderTracking.orderDate', namespace: 'orderTracking', viText: 'Ngày đặt', category: 'UI' },
  { key: 'orderTracking.paymentMethod', namespace: 'orderTracking', viText: 'Thanh toán', category: 'UI' },
  { key: 'orderTracking.orderedProducts', namespace: 'orderTracking', viText: 'Sản phẩm đã đặt', category: 'UI' },
  { key: 'orderTracking.quantity', namespace: 'orderTracking', viText: 'Số lượng', category: 'UI' },
  { key: 'orderTracking.searchAnother', namespace: 'orderTracking', viText: 'Tra cứu đơn hàng khác', category: 'UI' },
  { key: 'orderTracking.needSupport', namespace: 'orderTracking', viText: 'Cần hỗ trợ? Gọi', category: 'UI' },
  
  // Payment Methods
  { key: 'orderTracking.paymentCOD', namespace: 'orderTracking', viText: 'Thanh toán khi nhận hàng (COD)', category: 'UI' },
  { key: 'orderTracking.paymentBank', namespace: 'orderTracking', viText: 'Chuyển khoản ngân hàng', category: 'UI' },
  { key: 'orderTracking.paymentMomo', namespace: 'orderTracking', viText: 'Ví điện tử MoMo', category: 'UI' },
  
  // Order Status
  { key: 'orderTracking.statusPending', namespace: 'orderTracking', viText: 'Chờ xử lý', category: 'UI' },
  { key: 'orderTracking.statusConfirmed', namespace: 'orderTracking', viText: 'Đã xác nhận', category: 'UI' },
  { key: 'orderTracking.statusShipping', namespace: 'orderTracking', viText: 'Đang giao hàng', category: 'UI' },
  { key: 'orderTracking.statusCompleted', namespace: 'orderTracking', viText: 'Hoàn thành', category: 'UI' },
  { key: 'orderTracking.statusCancelled', namespace: 'orderTracking', viText: 'Đã hủy', category: 'UI' },
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