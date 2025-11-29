// routes/index.js – BẢN FIX DỨT ĐIỂM SEARCH + CLEAN

const express = require('express');
const router = express.Router();

// Controllers
const homeController = require('../controllers/homeController');
const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');
const userController = require('../controllers/userController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');

// Middleware
const { protect: auth } = require('../middlewares/auth');
const {
  addItem,
  getCart,
  updateItem,
  removeItem,
  clearCart
} = cartController;
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// ==================== PUBLIC ROUTES ====================
router.get('/', homeController.getHomeData);
router.get('/home', homeController.getHomeData);

// Danh mục
router.get('/categories', categoryController.getCategories);
router.get('/categories/:id', categoryController.getCategoryById);

// Sản phẩm
// SEARCH – PHẢI CÔNG KHAI, KHÔNG AUTH, VÀ CÓ /api TRONG SERVER.JS
router.get('/products/search', productController.searchProducts);
router.get('/products/search-suggestions', productController.searchSuggestions);
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductById);
router.get('/products/slug/:slug', productController.getProductBySlug);

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

// Orders
router.get('/orders', auth, orderController.getOrders);
router.get('/orders/:id', auth, orderController.getOrderById);
router.post('/orders', auth, orderController.createOrder);
router.post('/track', orderController.trackPublic);
router.put('/orders/:id', auth, orderController.updateOrder);
router.delete('/orders/:id', auth, orderController.deleteOrder);

// ==================== PROTECTED ROUTES ====================
router.get('/auth/me', auth, userController.getCurrentUser);
router.put('/auth/profile', auth, userController.updateProfile);

// ==================== ADMIN ROUTES ====================
router.post('/categories', auth, categoryController.createCategory);
router.put('/categories/:id', auth, categoryController.updateCategory);
router.delete('/categories/:id', auth, categoryController.deleteCategory);

router.post('/products', auth, upload.array('images', 10), productController.createProduct);
router.put('/products/:id', auth, upload.array('images', 10), productController.updateProduct);
router.delete('/products/:id', auth, productController.deleteProduct);

module.exports = router;