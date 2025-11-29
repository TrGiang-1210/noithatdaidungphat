// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect: auth, admin } = require('../middlewares/auth'); // nếu bạn có middleware admin

// === ADMIN CATEGORY ROUTES ===
router.post('/categories', auth, categoryController.createCategory);
router.put('/categories/:id', auth, categoryController.updateCategory);
router.delete('/categories/:id', auth, categoryController.deleteCategory);

// THÊM DÒNG NÀY – CHÍNH LÀ CÁI FRONTEND ĐANG GỌI!!!
router.get('/categories/tree', categoryController.getCategoryTree);

module.exports = router;