// routes/index.js – PUBLIC ROUTES

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

// Middleware
const { protect: auth } = require('../middlewares/auth');

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

// Auth công khai
router.post('/auth/register', userController.register);
router.post('/auth/login', userController.login);
router.post('/auth/forgot-password', userController.forgotPassword);
router.post('/auth/reset-password', userController.resetPassword);

// Cart
router.post('/cart', auth, cartController.addItem);
router.get('/cart', auth, cartController.getCart);
router.put('/cart', auth, cartController.updateItem);
router.delete('/cart', auth, cartController.removeItem);
router.delete('/cart/clear', auth, cartController.clearCart);

// ==================== ORDER ROUTES (PUBLIC) ====================
// Tạo đơn hàng (không cần login - COD)
router.post('/orders', orderController.createOrder);

// Tracking đơn hàng công khai (dùng order number)
router.get('/orders/track/:orderNumber', orderController.trackPublicByOrderNumber);

// ==================== ORDER ROUTES (USER - Protected) ====================
// Xem danh sách đơn hàng của mình
router.get('/orders/my-orders', auth, orderController.getUserOrders);

// Xem chi tiết 1 đơn hàng của mình
router.get('/orders/my-orders/:id', auth, orderController.getUserOrderById);

// Hủy đơn hàng của mình (chỉ khi còn Pending)
router.patch('/orders/:id/cancel-user', auth, orderController.cancelUserOrder);

// Posts
router.get('/posts', postController.getAllPostsPublic);
router.get('/posts/:slug', postController.getPostBySlug);

// Post Categories
router.get('/post-categories', postCategoryController.getAllCategories);
router.get('/post-categories/:slug', postCategoryController.getPostsByCategory);

// ==================== PROTECTED ROUTES (User Profile) ====================
router.get('/auth/me', auth, userController.getCurrentUser);
router.put('/auth/profile', auth, userController.updateProfile);

module.exports = router;