// routes/admin.js
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

const { protect: auth, admin } = require('../middlewares/auth');

// Tạo thư mục uploads nếu chưa có
const uploadsDir = path.join(__dirname, '../uploads/products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Đã tạo folder uploads/products');
}

// Cấu hình multer cho upload ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Chỉ chấp nhận file ảnh!'));
  }
});

// ==================== CATEGORY ROUTES ====================
router.get('/categories/tree', auth, admin, categoryController.getCategoryTree);
router.post('/categories', auth, admin, categoryController.createCategory);
router.put('/categories/:id', auth, admin, categoryController.updateCategory);
router.delete('/categories/:id', auth, admin, categoryController.deleteCategory);

// ==================== PRODUCT ROUTES ====================
// GET: Lấy tất cả sản phẩm (cho admin panel) - ✅ FIX ĐÂY
router.get('/products', auth, admin, productController.getAllProductsAdmin);
// POST: Tạo sản phẩm mới
router.post('/products', auth, admin, upload.array('images', 3), productController.createProduct);
// PUT: Cập nhật sản phẩm
router.put('/products/:id', auth, admin, upload.array('images', 3), productController.updateProduct);
// DELETE: Xóa sản phẩm
router.delete('/products/:id', auth, admin, productController.deleteProduct);
// POST: Gán danh mục hàng loạt
router.post('/products/bulk-categories', auth, admin, productController.bulkUpdateCategories);

// ==================== POST ROUTES ====================
router.get("/posts", auth, admin, postController.getAllPosts);
router.get("/posts/:slug", auth, admin, postController.getPostBySlug);
router.post("/posts", auth, admin, postController.createPost);
router.put("/posts/:id", auth, admin, postController.updatePost);
router.delete("/posts/:id", auth, admin, postController.deletePost);
router.post('/post-categories', auth, admin, postCategoryController.createCategory);

// ==================== POST CATEGORY ROUTES ====================
router.post('/post-categories', auth, admin, postCategoryController.createCategory);
router.delete('/post-categories/:id', auth, admin, postCategoryController.deleteCategory);

module.exports = router;