const ProductService = require('../services/productService');
const CategoryService = require('../services/categoryService');

exports.getHomeData = async (req, res) => {
  try {
    const categories = await CategoryService.getAll();

    let hotProducts = [];
    let saleProducts = [];
    let bestSellerProducts = [];

    if (ProductService && typeof ProductService.getAll === 'function') {
      hotProducts = await ProductService.getAll({ hot: true }, 8, { created_at: -1 }).catch(() => []);
      saleProducts = await ProductService.getAll({ onSale: true }, 8, { created_at: -1 }).catch(() => []);
      bestSellerProducts = await ProductService.getAll({}, 8, { sold: -1 }).catch(() => []);
    }

    res.json({ categories, hotProducts, saleProducts, bestSellerProducts });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching home data' });
  }
};