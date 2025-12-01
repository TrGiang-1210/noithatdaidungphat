// backend/routes/admin.js
const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/categoryController');
const { protect: auth, admin } = require('../middlewares/auth');

// === CATEGORY ROUTES ===
router.post('/categories', auth, admin, categoryController.createCategory);
router.put('/categories/:id', auth, admin, categoryController.updateCategory);
router.delete('/categories/:id', auth, admin, categoryController.deleteCategory);
router.get('/categories/tree', auth, categoryController.getCategoryTree);

// === PRODUCT BULK CATEGORY – ĐÃ FIX 100% CACHE ===
router.post('/products/bulk-categories', auth, admin, async (req, res) => {
  try {
    // Require tươi mới mỗi lần request → không bao giờ bị cache
    const { bulkUpdateCategories } = require('../controllers/productController');
    await bulkUpdateCategories(req, res);
  } catch (err) {
    console.error('Bulk update categories error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
});

module.exports = router;