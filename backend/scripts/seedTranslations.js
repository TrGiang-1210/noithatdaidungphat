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
  { key: 'header.color', namespace: 'header', viText: 'Bảng màu', category: 'UI' },
  
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
  
  // ========== SEARCH RESULTS PAGE ==========
  { key: 'search.pageTitle', namespace: 'search', viText: 'Kết quả tìm kiếm cho:', category: 'UI' },
  { key: 'search.resultsFound', namespace: 'search', viText: 'Tìm thấy', category: 'UI' },
  { key: 'search.products', namespace: 'search', viText: 'sản phẩm', category: 'UI' },
  { key: 'search.loading', namespace: 'search', viText: 'Đang tìm kiếm sản phẩm...', category: 'UI' },
  { key: 'search.noResults', namespace: 'search', viText: 'Không tìm thấy sản phẩm nào phù hợp với', category: 'UI' },
  { key: 'search.suggestions', namespace: 'search', viText: 'Gợi ý: Thử tìm "giường", "tủ", "bàn ăn", "ghế sofa"...', category: 'UI' },
  { key: 'search.brand', namespace: 'search', viText: 'Nội thất cao cấp', category: 'UI' },
  { key: 'search.addToCart', namespace: 'search', viText: 'Thêm vào giỏ', category: 'UI' },
  { key: 'search.outOfStock', namespace: 'search', viText: 'Hết hàng', category: 'UI' },

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

  // ========== ACCOUNT PAGE ==========
  // Register Form
  { key: 'auth.registerTitle', namespace: 'auth', viText: 'Đăng ký tài khoản', category: 'UI' },
  { key: 'auth.registerSubtitle', namespace: 'auth', viText: 'Tạo tài khoản để mua sắm nhanh hơn!', category: 'UI' },
  { key: 'auth.fullNamePlaceholder', namespace: 'auth', viText: 'Họ và tên', category: 'UI' },
  { key: 'auth.phonePlaceholder', namespace: 'auth', viText: 'Số điện thoại', category: 'UI' },
  { key: 'auth.emailPlaceholder', namespace: 'auth', viText: 'Email', category: 'UI' },
  { key: 'auth.passwordPlaceholder', namespace: 'auth', viText: 'Mật khẩu', category: 'UI' },
  { key: 'auth.confirmPasswordPlaceholder', namespace: 'auth', viText: 'Xác nhận mật khẩu', category: 'UI' },
  { key: 'auth.registerButton', namespace: 'auth', viText: 'ĐĂNG KÝ', category: 'UI' },

  // Login Form
  { key: 'auth.loginTitle', namespace: 'auth', viText: 'Chào mừng quay lại!', category: 'UI' },
  { key: 'auth.loginSubtitle', namespace: 'auth', viText: 'Đăng nhập để tiếp tục mua sắm', category: 'UI' },
  { key: 'auth.emailOrPhonePlaceholder', namespace: 'auth', viText: 'Email hoặc số điện thoại', category: 'UI' },
  { key: 'auth.loginButton', namespace: 'auth', viText: 'ĐĂNG NHẬP', category: 'UI' },
  { key: 'auth.forgotPassword', namespace: 'auth', viText: 'Quên mật khẩu?', category: 'UI' },

  // Error Messages
  { key: 'auth.passwordMismatch', namespace: 'auth', viText: 'Mật khẩu xác nhận không khớp!', category: 'error' },
  { key: 'auth.loginError', namespace: 'auth', viText: 'Email/số điện thoại hoặc mật khẩu không đúng!', category: 'error' },
  { key: 'auth.registerError', namespace: 'auth', viText: 'Đăng ký thất bại!', category: 'error' },
  { key: 'auth.noTokenError', namespace: 'auth', viText: 'Không lấy được token từ server', category: 'error' },
  { key: 'auth.registerNoToken', namespace: 'auth', viText: 'Đăng ký thành công nhưng không nhận được token', category: 'error' },

  // Success Messages
  { key: 'auth.welcomeBack', namespace: 'auth', viText: 'Xin chào {name}!', category: 'notification' },
  { key: 'auth.registerSuccess', namespace: 'auth', viText: 'Chào mừng {name}! Đăng ký thành công 🎉', category: 'notification' },

  // Other
  { key: 'auth.guest', namespace: 'auth', viText: 'khách', category: 'UI' },
  { key: 'auth.you', namespace: 'auth', viText: 'bạn', category: 'UI' },

  // ========== PROFILE PAGE ==========
  // Page Title
  { key: 'profile.pageTitle', namespace: 'profile', viText: 'CẬP NHẬT THÔNG TIN TÀI KHOẢN', category: 'UI' },

  // Form Labels
  { key: 'profile.fullName', namespace: 'profile', viText: 'Họ tên', category: 'UI' },
  { key: 'profile.phone', namespace: 'profile', viText: 'Điện thoại', category: 'UI' },
  { key: 'profile.email', namespace: 'profile', viText: 'Địa chỉ Email', category: 'UI' },
  { key: 'profile.address', namespace: 'profile', viText: 'Địa chỉ giao hàng', category: 'UI' },
  { key: 'profile.newPassword', namespace: 'profile', viText: 'Mật khẩu mới', category: 'UI' },
  { key: 'profile.confirmPassword', namespace: 'profile', viText: 'Xác nhận mật khẩu', category: 'UI' },

  // Placeholders
  { key: 'profile.fullNamePlaceholder', namespace: 'profile', viText: 'Ví dụ: Nguyễn Văn A', category: 'UI' },
  { key: 'profile.phonePlaceholder', namespace: 'profile', viText: '0901234567890', category: 'UI' },
  { key: 'profile.emailPlaceholder', namespace: 'profile', viText: 'example@gmail.com', category: 'UI' },
  { key: 'profile.addressPlaceholder', namespace: 'profile', viText: 'Ví dụ: 123 Đường Láng, Hà Nội', category: 'UI' },
  { key: 'profile.newPasswordPlaceholder', namespace: 'profile', viText: 'Để trống nếu không đổi', category: 'UI' },
  { key: 'profile.confirmPasswordPlaceholder', namespace: 'profile', viText: 'Nhập lại mật khẩu mới', category: 'UI' },

  // Notes
  { key: 'profile.passwordNote', namespace: 'profile', viText: '(Không cần nhập nếu giữ nguyên)', category: 'UI' },

  // Buttons
  { key: 'profile.updateButton', namespace: 'profile', viText: 'CẬP NHẬT', category: 'UI' },
  { key: 'profile.updating', namespace: 'profile', viText: 'Đang cập nhật...', category: 'UI' },

  // Error Messages
  { key: 'profile.loadError', namespace: 'profile', viText: 'Không thể tải thông tin tài khoản', category: 'error' },
  { key: 'profile.passwordMismatch', namespace: 'profile', viText: 'Mật khẩu xác nhận không khớp!', category: 'error' },
  { key: 'profile.invalidPhone', namespace: 'profile', viText: 'Số điện thoại không hợp lệ (VD: 0901234567)', category: 'error' },
  { key: 'profile.updateError', namespace: 'profile', viText: 'Cập nhật thất bại!', category: 'error' },

  // Success Messages
  { key: 'profile.updateSuccess', namespace: 'profile', viText: 'Cập nhật thông tin thành công! 🎉', category: 'notification' },

  // Chat Header
  { key: 'chat.companyName', namespace: 'chat', viText: 'Nội Thất Đại Dũng Phát', category: 'UI' },
  { key: 'chat.support247', namespace: 'chat', viText: 'Hỗ trợ 24/7', category: 'UI' },
  { key: 'chat.connecting', namespace: 'chat', viText: 'Đang kết nối...', category: 'UI' },

  // Session Info
  { key: 'chat.guestSession', namespace: 'chat', viText: '💭 Khách (Chưa đăng nhập)', category: 'UI' },

  // Welcome Messages
  { key: 'chat.welcomeGreeting', namespace: 'chat', viText: 'Xin chào! 👋', category: 'UI' },
  { key: 'chat.welcomeQuestion', namespace: 'chat', viText: 'Em có thể giúp được gì cho Anh/Chị?', category: 'UI' },
  { key: 'chat.loginHint', namespace: 'chat', viText: 'Đăng nhập để lưu lịch sử chat', category: 'UI' },

  // Quick Actions
  { key: 'chat.quickAction1', namespace: 'chat', viText: 'Cần mua hàng', category: 'UI' },
  { key: 'chat.quickAction2', namespace: 'chat', viText: 'Gọi lại cho tôi', category: 'UI' },
  { key: 'chat.quickAction3', namespace: 'chat', viText: 'Tư vấn dự án', category: 'UI' },

  // Input
  { key: 'chat.inputPlaceholder', namespace: 'chat', viText: 'Nhập tin nhắn...', category: 'UI' },

  // ========== CHATBOT RESPONSES ==========
  // Bot Greetings
  { key: 'bot.greeting1', namespace: 'bot', viText: 'Xin chào! 👋 Tôi là bot tự động của Nội Thất Đại Dũng Phát. Tôi có thể giúp gì cho bạn?', category: 'UI' },
  { key: 'bot.greeting2', namespace: 'bot', viText: 'Chào bạn! 😊 Cảm ơn bạn đã quan tâm đến sản phẩm của chúng tôi. Bạn cần tư vấn gì?', category: 'UI' },
  { key: 'bot.greeting3', namespace: 'bot', viText: 'Hi! Rất vui được hỗ trợ bạn. Bạn đang tìm loại nội thất nào?', category: 'UI' },

  // Bot Products
  { key: 'bot.products1', namespace: 'bot', viText: 'Chúng tôi chuyên cung cấp:\n• Ghế văn phòng\n• Bàn làm việc\n• Tủ hồ sơ\n• Ghế giám đốc\n• Kệ sách\n• Sofa văn phòng\n\nBạn quan tâm loại nào ạ?', category: 'UI' },
  { key: 'bot.products2', namespace: 'bot', viText: 'Shop có đầy đủ các loại nội thất văn phòng và gia đình:\n✓ Ghế xoay, ghế lưới\n✓ Bàn làm việc, bàn họp\n✓ Tủ tài liệu\n✓ Kệ trưng bày\n\nGiá cả cạnh tranh, chất lượng đảm bảo! 💪', category: 'UI' },

  // Bot Categories
  { key: 'bot.categoryChair', namespace: 'bot', viText: 'Về ghế, shop có nhiều loại:\n• Ghế văn phòng lưới\n• Ghế giám đốc cao cấp\n• Ghế chân quỳ\n• Ghế xoay 360°\n\nGiá từ 500k - 5tr. Bạn cần ghế loại nào?', category: 'UI' },
  { key: 'bot.categoryDesk', namespace: 'bot', viText: 'Về bàn làm việc, có các dòng:\n• Bàn văn phòng cơ bản\n• Bàn giám đốc\n• Bàn họp\n• Bàn máy tính\n\nGiá từ 800k - 10tr tùy kích thước.', category: 'UI' },
  { key: 'bot.categoryCabinet', namespace: 'bot', viText: 'Về tủ, shop có:\n• Tủ hồ sơ 2-4 ngăn\n• Tủ tài liệu gỗ\n• Tủ sắt\n• Tủ đồ cá nhân\n\nGiá từ 1tr - 8tr.', category: 'UI' },

  // Bot Delivery
  { key: 'bot.delivery1', namespace: 'bot', viText: 'Về vận chuyển:\n📦 FREE SHIP nội thành HCM cho đơn từ 2 triệu\n🚚 Giao hàng toàn quốc\n⏰ Giao hàng trong 1-3 ngày\n💯 Hỗ trợ lắp đặt tận nơi', category: 'UI' },
  { key: 'bot.delivery2', namespace: 'bot', viText: 'Chúng tôi giao hàng:\n✓ HCM: 1-2 ngày\n✓ Các tỉnh: 3-5 ngày\n✓ Miễn phí ship đơn > 2tr\n✓ COD toàn quốc', category: 'UI' },

  // Bot Contact
  { key: 'bot.contact1', namespace: 'bot', viText: '📞 Hotline: 0941 038 839 - 0965 708 839\n📧 Email: noithatdaidungphat@gmail.com\n📍 Địa chỉ: 474 ĐT824, Mỹ Hạnh Nam, Đức Hòa, Long An\n💬 Zalo: 0965708839', category: 'UI' },
  { key: 'bot.contact2', namespace: 'bot', viText: 'Liên hệ chúng tôi:\n📞 0941 038 839\n📞 0965 708 839\n📧 noithatdaidungphat@gmail.com\n🏢 474 ĐT824, Mỹ Hạnh Nam, Đức Hòa, Long An', category: 'UI' },

  // Bot Support
  { key: 'bot.support1', namespace: 'bot', viText: 'Để được tư vấn chi tiết, admin sẽ hỗ trợ bạn ngay! Vui lòng chờ trong giây lát... ⏰', category: 'UI' },
  { key: 'bot.support2', namespace: 'bot', viText: 'Tôi đang kết nối bạn với nhân viên tư vấn. Xin vui lòng đợi 1-2 phút nhé! 😊', category: 'UI' },

  // Bot Thanks
  { key: 'bot.thanks1', namespace: 'bot', viText: 'Rất vui được hỗ trợ bạn! 😊 Nếu cần gì thêm cứ nhắn tin nhé!', category: 'UI' },
  { key: 'bot.thanks2', namespace: 'bot', viText: 'Không có gì! Chúc bạn một ngày tốt lành! 🌟', category: 'UI' },
  { key: 'bot.thanks3', namespace: 'bot', viText: 'Cảm ơn bạn đã quan tâm! Hẹn gặp lại! 👋', category: 'UI' },

  // Bot Default
  { key: 'bot.default1', namespace: 'bot', viText: 'Tôi chưa hiểu rõ câu hỏi của bạn. Bạn có thể hỏi về:\n• Sản phẩm\n• Giá cả\n• Giao hàng\n• Liên hệ\n\nHoặc đợi admin tư vấn chi tiết nhé!', category: 'UI' },
  { key: 'bot.default2', namespace: 'bot', viText: 'Xin lỗi, tôi chưa có thông tin về vấn đề này. Admin sẽ hỗ trợ bạn sớm nhất! Hoặc gọi hotline: 0941 038 839 để được tư vấn ngay.', category: 'UI' },
  { key: 'bot.default3', namespace: 'bot', viText: 'Để được tư vấn chính xác, vui lòng liên hệ hotline: 0941 038 839 hoặc đợi admin trả lời nhé! 🙏', category: 'UI' },

  // Bot Name
  { key: 'bot.botName', namespace: 'bot', viText: '🤖 Bot Tư Vấn', category: 'UI' },

  // ========== SOCKET ERROR MESSAGES ==========
  { key: 'chat.error.invalidSession', namespace: 'chat', viText: 'Session không hợp lệ', category: 'error' },
  { key: 'chat.error.sessionExpired', namespace: 'chat', viText: 'Session đã hết hạn', category: 'error' },
  { key: 'chat.error.noAccess', namespace: 'chat', viText: 'Không có quyền truy cập', category: 'error' },
  { key: 'chat.error.missingRoomId', namespace: 'chat', viText: 'Thiếu roomId', category: 'error' },
  { key: 'chat.error.cannotSend', namespace: 'chat', viText: 'Không thể gửi tin nhắn', category: 'error' },
  { key: 'chat.error.cannotConnect', namespace: 'chat', viText: 'Không thể kết nối chat', category: 'error' },
  { key: 'chat.sessionReplaced', namespace: 'chat', viText: 'Bạn đã đăng nhập từ thiết bị khác', category: 'notification' },

    // ========== POSTS PAGE ==========
  { key: 'posts.pageTitle', namespace: 'posts', viText: 'Tin Tức & Xu Hướng', category: 'UI' },
  { key: 'posts.pageSubtitle', namespace: 'posts', viText: 'Khám phá các ý tưởng trang trí & xu hướng nội thất mới nhất', category: 'UI' },
  { key: 'posts.categories', namespace: 'posts', viText: 'Danh Mục', category: 'UI' },
  { key: 'posts.allCategories', namespace: 'posts', viText: 'Tất cả', category: 'UI' },
  { key: 'posts.loading', namespace: 'posts', viText: 'Đang tải bài viết...', category: 'UI' },
  { key: 'posts.noPosts', namespace: 'posts', viText: 'Chưa có bài viết nào.', category: 'UI' },
  { key: 'posts.readMore', namespace: 'posts', viText: 'Đọc tiếp', category: 'UI' },
  { key: 'posts.previous', namespace: 'posts', viText: 'Trước', category: 'UI' },
  { key: 'posts.next', namespace: 'posts', viText: 'Sau', category: 'UI' },
  
  // ========== POST DETAIL PAGE ==========
  { key: 'postDetail.notFound', namespace: 'posts', viText: '😢 Không tìm thấy bài viết', category: 'UI' },
  { key: 'postDetail.notFoundDesc', namespace: 'posts', viText: 'Bài viết bạn đang tìm không tồn tại hoặc đã bị xóa.', category: 'UI' },
  { key: 'postDetail.backToList', namespace: 'posts', viText: '← Quay lại danh sách bài viết', category: 'UI' },
  { key: 'postDetail.loading', namespace: 'posts', viText: 'Đang tải bài viết...', category: 'UI' },
  { key: 'postDetail.tags', namespace: 'posts', viText: 'Tags:', category: 'UI' },
  { key: 'postDetail.backButton', namespace: 'posts', viText: 'Quay lại danh sách', category: 'UI' },
  { key: 'postDetail.relatedPosts', namespace: 'posts', viText: 'Bài viết liên quan', category: 'UI' },
  
  // ========== BREADCRUMB ==========
  { key: 'posts.breadcrumb.home', namespace: 'posts', viText: 'Trang chủ', category: 'UI' },
  { key: 'posts.breadcrumb.news', namespace: 'posts', viText: 'Tin tức', category: 'UI' },
  
  // ========== ADMIN - POST MANAGER ==========
  { key: 'admin.posts.title', namespace: 'admin', viText: 'Quản Lý Bài Viết', category: 'UI' },
  { key: 'admin.posts.createPost', namespace: 'admin', viText: 'Tạo Bài Viết', category: 'UI' },
  { key: 'admin.posts.editPost', namespace: 'admin', viText: 'Sửa Bài Viết', category: 'UI' },
  { key: 'admin.posts.category', namespace: 'admin', viText: 'Danh Mục', category: 'UI' },
  { key: 'admin.posts.createCategory', namespace: 'admin', viText: 'Danh Mục', category: 'UI' },
  { key: 'admin.posts.thumbnail', namespace: 'admin', viText: 'Thumbnail', category: 'UI' },
  { key: 'admin.posts.title', namespace: 'admin', viText: 'Tiêu đề', category: 'UI' },
  { key: 'admin.posts.status', namespace: 'admin', viText: 'Trạng thái', category: 'UI' },
  { key: 'admin.posts.createdAt', namespace: 'admin', viText: 'Ngày tạo', category: 'UI' },
  { key: 'admin.posts.actions', namespace: 'admin', viText: 'Thao tác', category: 'UI' },
  { key: 'admin.posts.draft', namespace: 'admin', viText: 'Nháp', category: 'UI' },
  { key: 'admin.posts.published', namespace: 'admin', viText: 'Đã xuất bản', category: 'UI' },
  { key: 'admin.posts.searchPlaceholder', namespace: 'admin', viText: 'Tìm kiếm bài viết...', category: 'UI' },
  { key: 'admin.posts.allCategories', namespace: 'admin', viText: 'Tất cả danh mục', category: 'UI' },
  { key: 'admin.posts.noPosts', namespace: 'admin', viText: 'Không có bài viết nào', category: 'UI' },
  { key: 'admin.posts.titlePlaceholder', namespace: 'admin', viText: 'Nhập tiêu đề bài viết...', category: 'UI' },
  { key: 'admin.posts.content', namespace: 'admin', viText: 'Nội dung bài viết', category: 'UI' },
  { key: 'admin.posts.excerpt', namespace: 'admin', viText: 'Mô tả ngắn (Excerpt)', category: 'UI' },
  { key: 'admin.posts.excerptPlaceholder', namespace: 'admin', viText: 'Mô tả ngắn gọn về bài viết, hiển thị trong danh sách bài viết...', category: 'UI' },
  { key: 'admin.posts.publish', namespace: 'admin', viText: 'Xuất bản', category: 'UI' },
  { key: 'admin.posts.featuredImage', namespace: 'admin', viText: 'Ảnh đại diện', category: 'UI' },
  { key: 'admin.posts.addFeaturedImage', namespace: 'admin', viText: 'Thêm ảnh đại diện', category: 'UI' },
  { key: 'admin.posts.selectCategory', namespace: 'admin', viText: '-- Chọn danh mục --', category: 'UI' },
  { key: 'admin.posts.tagsPlaceholder', namespace: 'admin', viText: 'Nhập tag và nhấn Enter', category: 'UI' },
  { key: 'admin.posts.seo', namespace: 'admin', viText: 'SEO', category: 'UI' },
  { key: 'admin.posts.metaTitle', namespace: 'admin', viText: 'Meta Title', category: 'UI' },
  { key: 'admin.posts.metaTitlePlaceholder', namespace: 'admin', viText: 'Tiêu đề SEO', category: 'UI' },
  { key: 'admin.posts.metaDescription', namespace: 'admin', viText: 'Meta Description', category: 'UI' },
  { key: 'admin.posts.metaDescPlaceholder', namespace: 'admin', viText: 'Mô tả SEO', category: 'UI' },
  { key: 'admin.posts.slug', namespace: 'admin', viText: 'URL Slug', category: 'UI' },
  { key: 'admin.posts.slugPlaceholder', namespace: 'admin', viText: 'url-bai-viet', category: 'UI' },
  { key: 'admin.posts.saveDraft', namespace: 'admin', viText: 'Lưu Nháp', category: 'UI' },
  { key: 'admin.posts.deleteConfirm', namespace: 'admin', viText: 'Bạn có chắc muốn xóa bài viết này?', category: 'UI' },
  { key: 'admin.posts.createSuccess', namespace: 'admin', viText: 'Tạo bài viết thành công!', category: 'notification' },
  { key: 'admin.posts.updateSuccess', namespace: 'admin', viText: 'Cập nhật bài viết thành công!', category: 'notification' },
  { key: 'admin.posts.deleteSuccess', namespace: 'admin', viText: 'Xóa bài viết thành công!', category: 'notification' },
  { key: 'admin.posts.createError', namespace: 'admin', viText: 'Lỗi khi tạo bài viết', category: 'error' },
  { key: 'admin.posts.updateError', namespace: 'admin', viText: 'Lỗi khi cập nhật bài viết', category: 'error' },
  { key: 'admin.posts.deleteError', namespace: 'admin', viText: 'Lỗi khi xóa bài viết', category: 'error' },
  
  // ========== ADMIN - CATEGORY MANAGER ==========
  { key: 'admin.postCategories.createTitle', namespace: 'admin', viText: 'Tạo Danh Mục Mới', category: 'UI' },
  { key: 'admin.postCategories.name', namespace: 'admin', viText: 'Tên danh mục *', category: 'UI' },
  { key: 'admin.postCategories.namePlaceholder', namespace: 'admin', viText: 'Ví dụ: Xu hướng nội thất', category: 'UI' },
  { key: 'admin.postCategories.slug', namespace: 'admin', viText: 'Slug *', category: 'UI' },
  { key: 'admin.postCategories.slugPlaceholder', namespace: 'admin', viText: 'xu-huong-noi-that', category: 'UI' },
  { key: 'admin.postCategories.cancel', namespace: 'admin', viText: 'Hủy', category: 'UI' },
  { key: 'admin.postCategories.create', namespace: 'admin', viText: 'Tạo Danh Mục', category: 'UI' },
  { key: 'admin.postCategories.createSuccess', namespace: 'admin', viText: 'Tạo danh mục thành công!', category: 'notification' },
  { key: 'admin.postCategories.createError', namespace: 'admin', viText: 'Lỗi khi tạo danh mục', category: 'error' },
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