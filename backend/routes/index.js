const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const categoryController = require('../controllers/categoryController');
const auth = require('../middlewares/auth'); // <-- thêm dòng này


// Home
router.get('/home', auth, homeController.getHomeData);

// Categories
router.get('/categories', auth, categoryController.getCategories);
router.get('/categories/:id', auth, categoryController.getCategoryById);
router.post('/categories', auth, categoryController.createCategory);
router.put('/categories/:id', auth, categoryController.updateCategory);
router.delete('/categories/:id', auth, categoryController.deleteCategory);

module.exports = router;