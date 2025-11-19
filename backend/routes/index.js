// routes/index.js (hoặc routes/api.js)

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
const { protect } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // khuyến khích config storage chi tiết hơn sau

// ==================== PUBLIC ROUTES (không cần đăng nhập) ====================
router.get('/', homeController.getHomeData);           // Trang chủ
router.get('/home', homeController.getHomeData);       // Giữ lại cho tương thích cũ

// Tìm kiếm sản phẩm công khai
router.get('/products/search', productController.searchProducts);
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductById);

// Auth công khai
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

// ==================== PROTECTED ROUTES (cần đăng nhập + token) ====================
// User cá nhân
router.get('/auth/me', protect, getCurrentUser);
router.put('/auth/profile', protect, updateProfile);

// Admin routes - chỉ admin mới được phép (bạn sẽ thêm middleware isAdmin sau)
router.post('/categories', protect, categoryController.createCategory);
router.put('/categories/:id', protect, categoryController.updateCategory);
router.delete('/categories/:id', protect, categoryController.deleteCategory);

router.post('/products', protect, upload.array('images', 10), productController.createProduct);
router.put('/products/:id', protect, upload.array('images', 10), productController.updateProduct);
router.delete('/products/:id', protect, productController.deleteProduct);

// Optional: Lấy danh sách categories công khai (cho frontend hiển thị menu)
router.get('/categories', categoryController.getCategories);
router.get('/categories/:id', categoryController.getCategoryById);

module.exports = router;