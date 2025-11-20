// routes/index.js – BẢN FIX DỨT ĐIỂM SEARCH + CLEAN

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

// ==================== PUBLIC ROUTES ====================
router.get('/', homeController.getHomeData);
router.get('/home', homeController.getHomeData);



// Danh mục
router.get('/categories', categoryController.getCategories);
router.get('/categories/:id', categoryController.getCategoryById);

// Sản phẩm
// SEARCH – PHẢI CÔNG KHAI, KHÔNG AUTH, VÀ CÓ /api TRONG SERVER.JS
router.get('/products/search', productController.searchProducts);  // ← ĐÚNG ĐƯỜNG DẪN
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductById);        // bằng _id
router.get('/products/slug/:slug', productController.getProductBySlug);// nếu có slug

// Auth công khai
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

// ==================== PROTECTED ROUTES ====================
router.get('/auth/me', protect, getCurrentUser);
router.put('/auth/profile', protect, updateProfile);

// ==================== ADMIN ROUTES ====================
router.post('/categories', protect, categoryController.createCategory);
router.put('/categories/:id', protect, categoryController.updateCategory);
router.delete('/categories/:id', protect, categoryController.deleteCategory);

router.post('/products', protect, upload.array('images', 10), productController.createProduct);
router.put('/products/:id', protect, upload.array('images', 10), productController.updateProduct);
router.delete('/products/:id', protect, productController.deleteProduct);

module.exports = router;