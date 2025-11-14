// const ProductService = require('../services/productService');
const CategoryService = require('../services/categoryService');

exports.getHomeData = async (req, res) => {
  try {
    const categories = await CategoryService.getAll();
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching home data' });
  }
};
