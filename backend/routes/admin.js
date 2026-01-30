// routes/admin.js - ✅ FIXED WITH POST IMAGE UPLOAD
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: fileFilter
});

// ==================== 🆕 IMAGE UPLOAD ROUTES FOR POSTS ====================

// 📸 Upload single image for post
router.post('/upload-image', auth, admin, postUpload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Không có file ảnh được tải lên' });
    }

    // Return relative path that frontend can use
    const imageUrl = `/uploads/posts/${req.file.filename}`;
    
    console.log('✅ Uploaded single image:', imageUrl);
    
    res.json({ 
      url: imageUrl,
      filename: req.file.filename,
      message: 'Upload ảnh thành công'
    });
  } catch (error) {
    console.error('❌ Upload single image error:', error);
    res.status(500).json({ message: 'Lỗi khi upload ảnh: ' + error.message });
  }
});

// 📸📸📸 Upload multiple images for posts (bulk upload)
router.post('/upload-images', auth, admin, postUpload.array('images', 50), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Không có file ảnh được tải lên' });
    }

    // Map all uploaded files to their URLs
    const imageUrls = req.files.map(file => ({
      url: `/uploads/posts/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size
    }));
    
    console.log(`✅ Uploaded ${imageUrls.length} images successfully`);
    
    res.json({ 
      images: imageUrls,
      count: imageUrls.length,
      message: `Upload thành công ${imageUrls.length} ảnh`
    });
  } catch (error) {
    console.error('❌ Upload multiple images error:', error);
    res.status(500).json({ message: 'Lỗi khi upload ảnh: ' + error.message });
  }
});

// 🗑️ Delete image (optional - for cleanup)
router.delete('/delete-image/:filename', auth, admin, (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(postsDir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('✅ Deleted image:', filename);
      res.json({ message: 'Xóa ảnh thành công' });
    } else {
      res.status(404).json({ message: 'Không tìm thấy file ảnh' });
    }
  } catch (error) {
    console.error('❌ Delete image error:', error);
    res.status(500).json({ message: 'Lỗi khi xóa ảnh: ' + error.message });
  }
});

// ==================== DASHBOARD STATS ROUTE WITH DATE FILTER ====================
router.get('/dashboard/stats', auth, admin, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const Order = require('../models/Order');
    const Category = require('../models/Category');
    const Post = require('../models/Post');
    const Translation = require('../models/Translation');
    const ChatRoom = require('../models/ChatRoom');
    const OrderDetail = require('../models/OrderDetail');
    
    console.log('📊 Fetching dashboard stats with filters:', req.query);
    
    // ==================== DATE RANGE LOGIC ====================
    let startDate, endDate;
    let days = 7; // default
    
    if (req.query.startDate && req.query.endDate) {
      // Custom date range
      startDate = new Date(req.query.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      // Calculate days for this range
      days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    } else {
      // Preset range (7, 30, 90, 180, 365 days)
      days = parseInt(req.query.days) || 7;
      
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      
      startDate = new Date();
      startDate.setDate(startDate.getDate() - (days - 1));
      startDate.setHours(0, 0, 0, 0);
    }
    
    console.log('📅 Date Range:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days
    });
    
    // ==================== STATIC STATS (unchanged) ====================
    
    const totalProducts = await Product.countDocuments();
    
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const productsLastWeek = await Product.countDocuments({
      created_at: { $lt: lastWeek }
    });
    const newProductsThisWeek = totalProducts - productsLastWeek;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const ordersToday = await Order.countDocuments({
      created_at: { $gte: today, $lt: tomorrow }
    });
    
    const pendingOrders = await Order.countDocuments({
      status: 'Pending'
    });
    
    const ordersDataToday = await Order.find({
      created_at: { $gte: today, $lt: tomorrow },
      status: { $in: ['Confirmed', 'Shipping', 'Completed'] }
    });
    const revenueToday = ordersDataToday.reduce((sum, order) => sum + (order.total || 0), 0);
    
    const uncategorized = await Product.countDocuments({
      $or: [
        { categories: { $exists: false } },
        { categories: { $size: 0 } }
      ]
    });
    
    const hotProducts = await Product.countDocuments({ hot: true });
    const totalCategories = await Category.countDocuments();
    
    const activeRooms = await ChatRoom.find({ status: 'active' });
    const newMessages = activeRooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0);
    const totalConversations = await ChatRoom.countDocuments({ status: 'active' });
    
    const totalPosts = await Post.countDocuments();
    const postsToday = await Post.countDocuments({
      created_at: { $gte: today, $lt: tomorrow }
    });
    
    // Translation stats
    const totalUIKeys = await Translation.countDocuments();
    const translatedUIKeys = await Translation.countDocuments({
      'translations.zh.value': { $exists: true, $ne: '' }
    });
    const pendingUIKeys = totalUIKeys - translatedUIKeys;
    
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
    
    // ==================== REVENUE CHART DATA (DYNAMIC PERIOD) ====================
    const allOrders = await Order.find({
      created_at: { $gte: startDate, $lte: endDate },
      status: { $in: ['Confirmed', 'Shipping', 'Completed'] }
    }).select('created_at total');
    
    const revenueData = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayOrders = allOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= currentDate && orderDate < nextDate;
      });
      
      const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      
      revenueData.push({
        date: currentDate.toISOString().split('T')[0],
        dateVN: currentDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        revenue: dayRevenue,
        orders: dayOrders.length
      });
      
      currentDate = nextDate;
    }
    
    const totalRevenue = revenueData.reduce((sum, day) => sum + day.revenue, 0);
    const totalOrders = revenueData.reduce((sum, day) => sum + day.orders, 0);
    const averageRevenue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    
    // Calculate previous period for growth comparison
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);
    const prevEndDate = new Date(startDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
    
    const prevOrders = await Order.find({
      created_at: { $gte: prevStartDate, $lte: prevEndDate },
      status: { $in: ['Confirmed', 'Shipping', 'Completed'] }
    });
    const prevRevenue = prevOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    let revenueGrowth = 0;
    if (prevRevenue > 0) {
      revenueGrowth = Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100 * 10) / 10;
    } else if (totalRevenue > 0) {
      revenueGrowth = 100;
    }
    
    console.log('📈 Growth calculation:', {
      currentPeriod: `${totalRevenue.toLocaleString('vi-VN')} ₫`,
      previousPeriod: `${prevRevenue.toLocaleString('vi-VN')} ₫`,
      growth: `${revenueGrowth}%`
    });
    
    // ==================== 🆕 TOP SELLING PRODUCTS (DYNAMIC PERIOD) ====================
    const periodOrders = await Order.find({
      created_at: { $gte: startDate, $lte: endDate },
      status: { $in: ['Confirmed', 'Shipping', 'Completed'] }
    }).select('_id');
    
    const orderIds = periodOrders.map(o => o._id);
    
    const orderDetails = await OrderDetail.find({
      order_id: { $in: orderIds }
    }).populate('product_id', 'name images slug');
    
    const productSales = {};
    
    for (const detail of orderDetails) {
      if (!detail.product_id) continue;
      
      const productId = detail.product_id._id.toString();
      
      if (!productSales[productId]) {
        // Get Vietnamese name
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
          image: detail.img_url || (detail.product_id.images && detail.product_id.images[0]) || '',
          slug: detail.product_id.slug || ''
        };
      }
      
      productSales[productId].quantity += detail.quantity || 0;
      productSales[productId].revenue += (detail.quantity || 0) * (detail.price || 0);
    }
    
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(item => ({
        name: item.name,
        quantity: item.quantity,
        revenue: item.revenue,
        image: item.image,
        slug: item.slug
      }));
    
    // ==================== RESPONSE ====================
    const stats = {
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
      revenueChart: {
        data: revenueData,
        total7Days: totalRevenue, // Keep this name for backward compatibility
        totalOrders7Days: totalOrders,
        average7Days: averageRevenue,
        growth: revenueGrowth,
        topProducts: topProducts
      }
    };
    
    console.log('✅ Dashboard stats generated:', {
      dateRange: `${startDate.toLocaleDateString('vi-VN')} - ${endDate.toLocaleDateString('vi-VN')}`,
      days,
      totalRevenue: totalRevenue.toLocaleString('vi-VN'),
      totalOrders,
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
router.put('/categories/reorder', auth, admin, categoryController.reorderCategories);
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
router.get('/orders/stats/archive', auth, admin, orderController.getArchiveStats);
router.get('/orders', auth, admin, orderController.getAllOrdersAdmin);
router.get('/orders/:id', auth, admin, orderController.getOrderByIdAdmin);
router.patch('/orders/:id/status', auth, admin, orderController.updateOrderStatus);
router.patch('/orders/:id/cancel', auth, admin, orderController.cancelOrderAdmin);
router.patch('/orders/:id/archive', auth, admin, orderController.archiveOrder);
router.patch('/orders/:id/unarchive', auth, admin, orderController.unarchiveOrder);
router.delete('/orders/:id', auth, admin, orderController.deleteOrder);

module.exports = router;