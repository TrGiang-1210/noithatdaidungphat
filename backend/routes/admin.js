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
const orderController = require('../controllers/orderController');

const { protect: auth, admin } = require('../middlewares/auth');

// ==================== TẠO FOLDERS ====================
// Tạo thư mục uploads cho products
const productsDir = path.join(__dirname, '../uploads/products');
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
  console.log('✅ Đã tạo folder uploads/products');
}

// Tạo thư mục uploads cho posts
const postsDir = path.join(__dirname, '../uploads/posts');
if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir, { recursive: true });
  console.log('✅ Đã tạo folder uploads/posts');
}

// ==================== MULTER CONFIG ====================
// Cấu hình multer cho products
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Cấu hình multer cho posts
const postStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, postsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter chung
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)!'));
};

// Upload instance cho products
const productUpload = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

// Upload instance cho posts
const postUpload = multer({
  storage: postStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

// ==================== UPLOAD ROUTES ====================
// Upload ảnh cho posts (featured image)
router.post('/upload-image', auth, admin, postUpload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không có file nào được upload' });
    }

    const imageUrl = `/uploads/posts/${req.file.filename}`;
    
    res.json({
      success: true,
      url: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi upload ảnh' });
  }
});

// Upload nhiều ảnh cho products (nếu cần route riêng)
router.post('/upload-product-images', auth, admin, productUpload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Không có file nào được upload' });
    }

    const imageUrls = req.files.map(file => `/uploads/products/${file.filename}`);
    
    res.json({
      success: true,
      urls: imageUrls,
      count: req.files.length
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi upload ảnh' });
  }
});

// ==================== CATEGORY ROUTES ====================
router.get('/categories/tree', auth, admin, categoryController.getCategoryTree);
router.post('/categories', auth, admin, categoryController.createCategory);
router.put('/categories/:id', auth, admin, categoryController.updateCategory);
router.delete('/categories/:id', auth, admin, categoryController.deleteCategory);

// ==================== PRODUCT ROUTES ====================
// GET: Lấy tất cả sản phẩm (cho admin panel)
router.get('/products', auth, admin, productController.getAllProductsAdmin);
// POST: Tạo sản phẩm mới
router.post('/products', auth, admin, productUpload.any(), productController.createProduct);
router.put('/products/:id', auth, admin, productUpload.any(), productController.updateProduct);
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

// ==================== POST CATEGORY ROUTES ====================
router.post('/post-categories', auth, admin, postCategoryController.createCategory);
router.delete('/post-categories/:id', auth, admin, postCategoryController.deleteCategory);

// ==================== ORDER ROUTES ====================
// Lấy tất cả đơn hàng với filter
router.get('/orders', auth, admin, orderController.getAllOrdersAdmin);
// Xem chi tiết đơn hàng
router.get('/orders/:id', auth, admin, orderController.getOrderByIdAdmin);
// Cập nhật trạng thái đơn hàng
router.patch('/orders/:id/status', auth, admin, orderController.updateOrderStatus);
// Hủy đơn hàng (hoàn tồn kho)
router.patch('/orders/:id/cancel', auth, admin, orderController.cancelOrderAdmin);
// Xóa đơn hàng (nếu cần)
router.delete('/orders/:id', auth, admin, orderController.deleteOrder);
// Thống kê đơn hàng
router.get('/orders/stats/overview', auth, admin, orderController.getOrderStats);

module.exports = router;