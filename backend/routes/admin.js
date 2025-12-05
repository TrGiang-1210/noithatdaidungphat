// src/routes/admin.js
const express = require('express');
const router = express.Router();

// IMPORT CONTROLLER TỪ ĐẦU – KHÔNG ĐƯỢC DÙNG require() TRONG ROUTE!
const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController'); // ← THÊM DÒNG NÀY

const { protect: auth, admin } = require('../middlewares/auth');

// === CATEGORY ROUTES ===
router.post('/categories', auth, admin, categoryController.createCategory);
router.put('/categories/:id', auth, admin, categoryController.updateCategory);
router.delete('/categories/:id', auth, admin, categoryController.deleteCategory);
router.get('/categories/tree', auth, admin, categoryController.getCategoryTree); // ← thêm admin nếu muốn bảo mật

// === PRODUCT ADMIN ROUTES ===
// GÁN DANH MỤC HÀNG LOẠT – ĐÃ FIX CHUẨN!
router.post('/products/bulk-categories', auth, admin, productController.bulkUpdateCategories);

// Thêm các route admin khác sau này ở đây:
// router.get('/products', productController.getProducts);
router.put('/products/:id', auth, admin, productController.updateProduct);
// ...

module.exports = router;