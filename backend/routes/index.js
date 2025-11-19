// routes/index.js — BẢN CHUẨN CUỐI CÙNG CHO WEBSITE BÁN NỘI THẤT

const express = require('express');
const router = express.Router();

// Controllers
const homeController = require('../controllers/homeController');
const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');
const {
  register,
  login,
  getCurrentUser,
  updateProfile,
  forgotPassword,
  resetPassword
} = require('../controllers/userController');

// Middleware
const { protect } = require('../middlewares/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// ==================== PUBLIC ROUTES – KHÁCH VÃNG LAI THẤY ĐƯỢC HẾT ====================
router.get('/', homeController.getHomeData);
router.get('/home', homeController.getHomeData);

// Danh mục – công khai
router.get('/categories', categoryController.getCategories);
router.get('/categories/:id', categoryController.getCategoryById);

// Sản phẩm – công khai
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductById);
router.get('/products/search', productController.searchProducts);

// Auth công khai
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

// ==================== PROTECTED ROUTES – CHỈ NGƯỜI ĐĂNG NHẬP MỚI ĐƯỢC ====================
// Thông tin cá nhân
router.get('/auth/me', protect, getCurrentUser);
router.put('/auth/profile', protect, updateProfile);

// ==================== ADMIN ROUTES – CHỈ ADMIN MỚI ĐƯỢC TẠO/SỬA/XÓA ====================
// Danh mục
router.post('/categories', protect, categoryController.createCategory);
router.put('/categories/:id', protect, categoryController.updateCategory);
router.delete('/categories/:id', protect, categoryController.deleteCategory);

// Sản phẩm
router.post('/products', protect, upload.array('images', 10), productController.createProduct);
router.put('/products/:id', protect, upload.array('images', 10), productController.updateProduct);
router.delete('/products/:id', protect, productController.deleteProduct);

module.exports = router;