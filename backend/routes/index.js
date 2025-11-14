const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const categoryController = require('../controllers/categoryController');
// bypass auth for development: log + provide dummy req.user
const auth = (req, res, next) => {
  console.log('[DEV] auth bypassed for', req.method, req.originalUrl);
  req.user = { id: 'dev', role: 'dev' }; // controllers expecting req.user won't reject
  next();
};


// Home
router.get('/home', auth, homeController.getHomeData);

// Categories
router.get('/categories', auth, categoryController.getCategories);
router.get('/categories/:id', auth, categoryController.getCategoryById);
router.post('/categories', auth, categoryController.createCategory);
router.put('/categories/:id', auth, categoryController.updateCategory);
router.delete('/categories/:id', auth, categoryController.deleteCategory);

module.exports = router;