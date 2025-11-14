// const ProductService = require('../services/productService');
const CategoryService = require('../services/categoryService');

exports.getHomeData = async (req, res) => {
  try {
    const hotProducts = await ProductService.getAll({ hot: true });
    const categories = await CategoryService.getAll();
    res.json({ hotProducts, categories });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching home data' });
  }
};
