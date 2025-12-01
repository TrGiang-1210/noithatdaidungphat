const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/categoryController');
const { protect: auth, admin } = require('../middlewares/auth');

// === CATEGORY ROUTES ===
router.post('/categories', auth, admin, categoryController.createCategory);
router.put('/categories/:id', auth, admin, categoryController.updateCategory);
router.delete('/categories/:id', auth, admin, categoryController.deleteCategory);
router.get('/categories/tree', auth, categoryController.getCategoryTree);

// === PRODUCT BULK CATEGORY ===
router.post('/products/bulk-categories', auth, admin, async (req, res) => {
  try {
    const productController = require('../controllers/productController');
    if (!productController.bulkUpdateCategories || typeof productController.bulkUpdateCategories !== 'function') {
      return res.status(500).json({ success: false, message: 'Controller không được load đúng' });
    }
    await productController.bulkUpdateCategories(req, res);
  } catch (err) {
    console.error('Bulk update categories error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
});

module.exports = router;