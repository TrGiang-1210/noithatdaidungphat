// routes/index.js — PUBLIC ROUTES (UPDATED)

const express = require('express');
const router = express.Router();

// Controllers
const homeController = require('../controllers/homeController');
const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');
const userController = require('../controllers/userController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const postController = require('../controllers/postController');
const postCategoryController = require('../controllers/postCategoryController');
const translationController = require('../controllers/translation.controller');

// Middleware
const { protect: auth } = require('../middlewares/auth');

// ✅ THÊM: Chat handler để xử lý logout
const { handleUserLogout } = require('../services/authHandler');

// ==================== PUBLIC ROUTES ====================
router.get('/', homeController.getHomeData);
router.get('/home', homeController.getHomeData);

// Danh mục
router.get('/categories', categoryController.getCategories);
router.get('/categories/:id', categoryController.getCategoryById);

// Sản phẩm
router.get('/products/search', productController.searchProducts);
router.get('/products/search-suggestions', productController.searchSuggestions);
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductById);
router.get('/products/slug/:slug', productController.getProductBySlug);

// Tăng lượt xem
router.post('/products/slug/:slug/increment-view', productController.incrementView);
router.post('/products/:id/increment-view', productController.incrementView);

// ==================== AUTH ROUTES ====================
// Public auth
router.post('/auth/register', userController.register);
router.post('/auth/login', userController.login);
router.post('/auth/forgot-password', userController.forgotPassword);
router.post('/auth/reset-password', userController.resetPassword);

// ✅ THÊM: Logout endpoint với chat session cleanup
router.post('/auth/logout', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (userId) {
      // Cập nhật chat session khi logout
      await handleUserLogout(userId, { closeRoom: false });
      console.log('✅ User logged out, chat session updated:', userId);
    }
    
    res.json({ 
      success: true, 
      message: 'Logout thành công' 
    });
  } catch (error) {
    console.error('❌ Error in logout:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi logout' 
    });
  }
});

// Protected auth routes
router.get('/auth/me', auth, userController.getCurrentUser);
router.put('/auth/profile', auth, userController.updateProfile);

// ==================== CART ROUTES ====================
router.post('/cart', auth, cartController.addItem);
router.get('/cart', auth, cartController.getCart);
router.put('/cart', auth, cartController.updateItem);
router.delete('/cart', auth, cartController.removeItem);
router.delete('/cart/clear', auth, cartController.clearCart);

// ==================== ORDER ROUTES ====================
// Tạo đơn hàng (không cần login - COD)
router.post('/orders', orderController.createOrder);
// Tracking đơn hàng công khai (dùng order number)
router.get('/orders/track/:orderNumber', orderController.trackPublicByOrderNumber);

// User orders (protected)
router.get('/orders/my-orders', auth, orderController.getUserOrders);
router.get('/orders/my-orders/:id', auth, orderController.getUserOrderById);
router.patch('/orders/:id/cancel-user', auth, orderController.cancelUserOrder);

// ==================== POST ROUTES ====================
router.get('/posts', postController.getAllPostsPublic);
router.get('/posts/:slug', postController.getPostBySlug);

// Post Categories
router.get('/post-categories', postCategoryController.getAllCategories);
router.get('/post-categories/:slug', postCategoryController.getPostsByCategory);

// ==================== TRANSLATION ROUTES ====================
// ✅ FIX: Đổi route để không trùng với homepage
router.get('/translations', translationController.getTranslations);

module.exports = router;