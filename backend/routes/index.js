const express = require('express');
const router = express.Router();

const homeController = require('../controllers/homeController');
const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // hoặc cấu hình riêng

// bypass auth for development: log + provide dummy req.user
const auth = (req, res, next) => {
  console.log('[DEV] auth bypassed for', req.method, req.originalUrl);
  req.user = { id: 'dev', role: 'dev' }; // controllers expecting req.user won't reject
  next();
};


// Home
router.get('/home', homeController.getHomeData);

// Categories
router.get('/categories', auth, categoryController.getCategories);
router.get('/categories/:id', auth, categoryController.getCategoryById);
router.post('/categories', auth, categoryController.createCategory);
router.put('/categories/:id', auth, categoryController.updateCategory);
router.delete('/categories/:id', auth, categoryController.deleteCategory);

// Products
router.get("/products/search", productController.searchProducts);
// Lấy danh sách sản phẩm
router.get('/products', productController.getProducts);
// Tạo sản phẩm (cho phép upload nhiều ảnh)
router.post('/products', auth, upload.array('images', 10), productController.createProduct);
// Lấy chi tiết sản phẩm
router.get('/products/:id', productController.getProductById);
// Cập nhật sản phẩm (cho phép upload nhiều ảnh)
router.put('/products/:id', auth, upload.array('images', 10), productController.updateProduct);
// Xóa sản phẩm
router.delete('/products/:id', auth, productController.deleteProduct);

module.exports = router;