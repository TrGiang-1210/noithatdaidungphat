const CategoryService = require('../services/categoryService');
const Joi = require('joi');

const categorySchema = Joi.object({
  slug: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().allow('')
});

exports.getCategories = async (req, res) => {
  try {
    const { name } = req.query;
    const filters = {};
    if (name) filters.name = new RegExp(name, 'i');

    const categories = await CategoryService.getAll(filters);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching categories' });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await CategoryService.getById(req.params.id);
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching category' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { error } = categorySchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const category = await CategoryService.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating category' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { error } = categorySchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const category = await CategoryService.update(req.params.id, req.body);
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error updating category' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await CategoryService.delete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error deleting category' });
  }
};

// THÊM VÀO CUỐI FILE categoryController.js
exports.getCategoryTree = async (req, res) => {
  try {
    const categories = await CategoryService.getAll({}); // lấy hết
    const map = {};
    const tree = [];

    // Tạo map id → object + thêm value/label cho react-checkbox-tree
    categories.forEach(cat => {
      map[cat._id] = {
        ...cat.toObject(),
        value: cat._id.toString(),
        label: cat.name,
        children: []
      };
    });

    // Xây cây
    categories.forEach(cat => {
      if (cat.parent && map[cat.parent]) {
        map[cat.parent].children.push(map[cat._id]);
      } else {
        tree.push(map[cat._id]);
      }
    });

    res.json(tree);
  } catch (error) {
    console.error("Lỗi getCategoryTree:", error);
    res.status(500).json({ message: "Lỗi lấy cây danh mục" });
  }
};