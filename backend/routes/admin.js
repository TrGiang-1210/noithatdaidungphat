// routes/admin.js - ✅ FIXED ROUTE ORDER
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// IMPORT CONTROLLER
const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');
const postController = require('../controllers/postController');
const postCategoryController = require('../controllers/postCategoryController');
const orderController = require('../controllers/orderController');
const translationController = require('../controllers/translation.controller');
const bulkTranslateController = require('../controllers/bulkTranslateController');

const { protect: auth, admin } = require('../middlewares/auth');

// ==================== TẠO FOLDERS ====================
const productsDir = path.join(__dirname, '../uploads/products');
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
  console.log('✅ Đã tạo folder uploads/products');
}

const postsDir = path.join(__dirname, '../uploads/posts');
if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir, { recursive: true });
  console.log('✅ Đã tạo folder uploads/posts');
}

// ==================== MULTER CONFIG ====================
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const postStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, postsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)!'));
};

const productUpload = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

const postUpload = multer({
  storage: postStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

// ==================== DASHBOARD STATS ROUTE ====================
router.get('/dashboard/stats', auth, admin, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const Order = require('../models/Order');
    const Category = require('../models/Category');
    const Post = require('../models/Post');
    const Translation = require('../models/Translation');
    const ChatRoom = require('../models/ChatRoom');
    const OrderDetail = require('../models/OrderDetail');
    
    console.log('📊 Fetching dashboard stats...');
    
    // ==================== EXISTING STATS ====================
    
    // Tổng sản phẩm
    const totalProducts = await Product.countDocuments();
    
    // Sản phẩm tuần trước
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const productsLastWeek = await Product.countDocuments({
      created_at: { $lt: lastWeek }
    });
    const newProductsThisWeek = totalProducts - productsLastWeek;
    
    // Đơn hàng hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const ordersToday = await Order.countDocuments({
      created_at: { $gte: today, $lt: tomorrow }
    });
    
    // Đơn hàng chưa xác nhận (Pending)
    const pendingOrders = await Order.countDocuments({
      status: 'Pending'
    });
    
    // Doanh thu hôm nay
    const ordersDataToday = await Order.find({
      created_at: { $gte: today, $lt: tomorrow },
      status: { $in: ['Confirmed', 'Shipping', 'Completed'] }
    });
    const revenueToday = ordersDataToday.reduce((sum, order) => sum + (order.total || 0), 0);
    
    // Sản phẩm chưa gắn danh mục
    const uncategorized = await Product.countDocuments({
      $or: [
        { categories: { $exists: false } },
        { categories: { $size: 0 } }
      ]
    });
    
    // Sản phẩm hot
    const hotProducts = await Product.countDocuments({ hot: true });
    
    // ==================== EXISTING NEW STATS ====================
    
    // 1. Tổng danh mục
    const totalCategories = await Category.countDocuments();
    
    // 2. Tin nhắn mới
    const activeRooms = await ChatRoom.find({ status: 'active' });
    const newMessages = activeRooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0);
    const totalConversations = await ChatRoom.countDocuments({ status: 'active' });
    
    // 3. Tổng bài viết
    const totalPosts = await Post.countDocuments();
    const postsToday = await Post.countDocuments({
      created_at: { $gte: today, $lt: tomorrow }
    });
    
    // 4. Thống kê dịch UI
    const totalUIKeys = await Translation.countDocuments();
    const translatedUIKeys = await Translation.countDocuments({
      'translations.zh.value': { $exists: true, $ne: '' }
    });
    const pendingUIKeys = totalUIKeys - translatedUIKeys;
    
    // 5. Thống kê dịch DB
    const totalProductsDB = await Product.countDocuments();
    const translatedProductsDB = await Product.countDocuments({
      'name.zh': { $exists: true, $ne: '' }
    });
    const productsDBPercentage = totalProductsDB > 0 
      ? Math.round((translatedProductsDB / totalProductsDB) * 100) 
      : 0;
    
    const totalCategoriesDB = await Category.countDocuments();
    const translatedCategoriesDB = await Category.countDocuments({
      'name.zh': { $exists: true, $ne: '' }
    });
    const categoriesDBPercentage = totalCategoriesDB > 0 
      ? Math.round((translatedCategoriesDB / totalCategoriesDB) * 100) 
      : 0;
    
    const totalPostsDB = await Post.countDocuments();
    const translatedPostsDB = await Post.countDocuments({
      'title.zh': { $exists: true, $ne: '' }
    });
    const postsDBPercentage = totalPostsDB > 0 
      ? Math.round((translatedPostsDB / totalPostsDB) * 100) 
      : 0;
    
    const PostCategory = require('../models/PostCategory');
    const totalPostCategoriesDB = await PostCategory.countDocuments();
    const translatedPostCategoriesDB = await PostCategory.countDocuments({
      'name.zh': { $exists: true, $ne: '' }
    });
    const postCategoriesDBPercentage = totalPostCategoriesDB > 0 
      ? Math.round((translatedPostCategoriesDB / totalPostCategoriesDB) * 100) 
      : 0;
    
    // ==================== 🆕 REVENUE CHART DATA (7 DAYS) ====================
    const revenueData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      // Đếm tổng đơn hàng trong ngày (tất cả trạng thái)
      const dayOrderCount = await Order.countDocuments({
        created_at: { $gte: date, $lt: nextDate }
      });
      
      // Lấy các đơn đã xác nhận trở lên để tính doanh thu
      const dayOrders = await Order.find({
        created_at: { $gte: date, $lt: nextDate },
        status: { $in: ['Confirmed', 'Shipping', 'Completed'] }
      });
      
      const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      
      // Format ngày theo locale Việt Nam
      const dayName = date.toLocaleDateString('vi-VN', { weekday: 'short' });
      const dayMonth = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      
      revenueData.push({
        date: `${dayName} ${dayMonth}`,
        fullDate: date.toISOString(),
        revenue: dayRevenue,
        orders: dayOrderCount,
        confirmedOrders: dayOrders.length
      });
    }
    
    // Tính tổng doanh thu 7 ngày
    const total7DaysRevenue = revenueData.reduce((sum, day) => sum + day.revenue, 0);
    const total7DaysOrders = revenueData.reduce((sum, day) => sum + day.orders, 0);
    
    // Tính trung bình
    const avg7DaysRevenue = Math.round(total7DaysRevenue / 7);
    
    // Tính tăng trưởng so với 7 ngày trước
    const prev7DaysStart = new Date();
    prev7DaysStart.setDate(prev7DaysStart.getDate() - 14);
    prev7DaysStart.setHours(0, 0, 0, 0);
    
    const prev7DaysEnd = new Date();
    prev7DaysEnd.setDate(prev7DaysEnd.getDate() - 7);
    prev7DaysEnd.setHours(0, 0, 0, 0);
    
    const prev7DaysOrders = await Order.find({
      created_at: { $gte: prev7DaysStart, $lt: prev7DaysEnd },
      status: { $in: ['Confirmed', 'Shipping', 'Completed'] }
    });
    
    const prev7DaysRevenue = prev7DaysOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    let revenueGrowth = 0;
    if (prev7DaysRevenue > 0) {
      revenueGrowth = Math.round(((total7DaysRevenue - prev7DaysRevenue) / prev7DaysRevenue) * 100);
    } else if (total7DaysRevenue > 0) {
      revenueGrowth = 100;
    }
    
    // ==================== 🆕 TOP SELLING PRODUCTS (7 DAYS) ====================
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    last7Days.setHours(0, 0, 0, 0);
    
    // Lấy tất cả đơn hàng đã xác nhận trong 7 ngày
    const recent7DaysOrders = await Order.find({
      created_at: { $gte: last7Days },
      status: { $in: ['Confirmed', 'Shipping', 'Completed'] }
    }).select('_id');
    
    const orderIds = recent7DaysOrders.map(o => o._id);
    
    // Lấy chi tiết đơn hàng
    const orderDetails = await OrderDetail.find({
      order_id: { $in: orderIds }
    }).populate('product_id', 'name images');
    
    // Tính tổng số lượng bán cho mỗi sản phẩm
    const productSales = {};
    
    for (const detail of orderDetails) {
      if (!detail.product_id) continue; // Skip nếu sản phẩm đã bị xóa
      
      const productId = detail.product_id._id.toString();
      
      if (!productSales[productId]) {
        // Lấy tên tiếng Việt
        let productName = 'N/A';
        if (detail.name) {
          if (typeof detail.name === 'object') {
            productName = detail.name.vi || detail.name.zh || 'N/A';
          } else {
            productName = detail.name;
          }
        } else if (detail.product_id.name) {
          if (typeof detail.product_id.name === 'object') {
            productName = detail.product_id.name.vi || detail.product_id.name.zh || 'N/A';
          } else {
            productName = detail.product_id.name;
          }
        }
        
        productSales[productId] = {
          productId,
          name: productName,
          quantity: 0,
          revenue: 0,
          image: detail.img_url || (detail.product_id.images && detail.product_id.images[0]) || ''
        };
      }
      
      productSales[productId].quantity += detail.quantity || 0;
      productSales[productId].revenue += (detail.quantity || 0) * (detail.price || 0);
    }
    
    // Sắp xếp theo số lượng bán và lấy top 5
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(item => ({
        name: item.name,
        quantity: item.quantity,
        revenue: item.revenue,
        image: item.image
      }));
    
    // ==================== RESPONSE ====================
    const stats = {
      // Existing stats
      totalProducts,
      newProductsThisWeek,
      ordersToday,
      revenueToday,
      uncategorized,
      hotProducts,
      pendingOrders,
      totalCategories,
      newMessages,
      totalConversations,
      totalPosts,
      postsToday,
      translationUI: {
        total: totalUIKeys,
        translated: translatedUIKeys,
        pending: pendingUIKeys
      },
      translationDB: {
        products: {
          total: totalProductsDB,
          translated: translatedProductsDB,
          percentage: productsDBPercentage
        },
        categories: {
          total: totalCategoriesDB,
          translated: translatedCategoriesDB,
          percentage: categoriesDBPercentage
        },
        posts: {
          total: totalPostsDB,
          translated: translatedPostsDB,
          percentage: postsDBPercentage
        },
        postCategories: {
          total: totalPostCategoriesDB,
          translated: translatedPostCategoriesDB,
          percentage: postCategoriesDBPercentage
        }
      },
      
      // 🆕 NEW: Revenue chart data
      revenueChart: {
        data: revenueData,
        total7Days: total7DaysRevenue,
        totalOrders7Days: total7DaysOrders,
        average7Days: avg7DaysRevenue,
        growth: revenueGrowth,
        topProducts: topProducts
      }
    };
    
    console.log('✅ Dashboard stats with revenue chart:', {
      total7Days: total7DaysRevenue.toLocaleString('vi-VN'),
      growth: `${revenueGrowth}%`,
      topProductsCount: topProducts.length,
      dataPoints: revenueData.length
    });
    
    res.json(stats);
  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== BULK TRANSLATION ROUTES ====================
router.get('/bulk-translate/stats', auth, admin, bulkTranslateController.getTranslationStats);
router.post('/bulk-translate/products', auth, admin, bulkTranslateController.translateAllProducts);
router.post('/bulk-translate/categories', auth, admin, bulkTranslateController.translateAllCategories);
router.post('/bulk-translate/posts', auth, admin, bulkTranslateController.translateAllPosts);
router.post('/bulk-translate/post-categories', auth, admin, bulkTranslateController.translateAllPostCategories);
router.post('/bulk-translate/orders', auth, admin, bulkTranslateController.translateAllOrders);

// ==================== TRANSLATION ROUTES ====================
router.get('/translations/keys', auth, admin, translationController.getTranslationKeys);
router.get('/translations/statistics', auth, admin, translationController.getStatistics);
router.post('/translations/keys', auth, admin, translationController.createTranslationKey);
router.post('/translations/ai-translate', auth, admin, translationController.requestAITranslation);
router.post('/translations/batch-ai-translate', auth, admin, translationController.batchAITranslation);
router.put('/translations/:id/review', auth, admin, translationController.reviewTranslation);

// ==================== CATEGORY ROUTES ====================
router.get('/categories/tree', auth, admin, categoryController.getCategoryTree);
router.post('/categories', auth, admin, categoryController.createCategory);
router.put('/categories/:id', auth, admin, categoryController.updateCategory);
router.delete('/categories/:id', auth, admin, categoryController.deleteCategory);

// ==================== PRODUCT ROUTES ====================
router.get('/products', auth, admin, productController.getAllProductsAdmin);
router.post('/products', auth, admin, productUpload.any(), productController.createProduct);
router.put('/products/:id', auth, admin, productUpload.any(), productController.updateProduct);
router.delete('/products/:id', auth, admin, productController.deleteProduct);
router.post('/products/bulk-categories', auth, admin, productController.bulkUpdateCategories);

// ==================== POST ROUTES ====================
router.get("/posts", auth, admin, postController.getAllPosts);
router.get("/posts/:slug", auth, admin, postController.getPostBySlug);
router.post("/posts", auth, admin, postController.createPost);
router.put("/posts/:id", auth, admin, postController.updatePost);
router.delete("/posts/:id", auth, admin, postController.deletePost);

// ==================== POST CATEGORY ROUTES ====================
router.get('/post-categories', postCategoryController.getAllCategories);
router.post('/post-categories', auth, admin, postCategoryController.createCategory);
router.put('/post-categories/:id', auth, admin, postCategoryController.updateCategory);
router.delete('/post-categories/:id', auth, admin, postCategoryController.deleteCategory);

// ==================== ORDER ROUTES ====================
// ⚠️ Specific routes MUST come before dynamic routes
router.get('/orders/stats/overview', auth, admin, orderController.getOrderStats);
router.get('/orders', auth, admin, orderController.getAllOrdersAdmin);
router.get('/orders/:id', auth, admin, orderController.getOrderByIdAdmin);
router.patch('/orders/:id/status', auth, admin, orderController.updateOrderStatus);
router.patch('/orders/:id/cancel', auth, admin, orderController.cancelOrderAdmin);
router.delete('/orders/:id', auth, admin, orderController.deleteOrder);

module.exports = router;