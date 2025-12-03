const CategoryService = require('../services/categoryService');
const Category = require('../models/Category');   // ← THÊM DÒNG NÀY NGAY ĐÂY!
const Joi = require('joi');

const categorySchema = Joi.object({
  slug: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().allow(''),
  parent: Joi.string().allow(null, '').optional(),
}).unknown(true);

// Schema cho cập nhật (không bắt buộc slug/name)
const updateCategorySchema = Joi.object({
  name: Joi.string().trim(),
  slug: Joi.string().trim(),
  description: Joi.string().allow(''),
  parent: Joi.string().allow(null, '').optional(),
}).unknown(true).min(1); // ít nhất 1 field để update

exports.getCategories = async (req, res) => {
  try {
    // BỎ .lean() ĐI → hoặc convert _id thành string ngay từ đầu
    const allCats = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 });

    const map = new Map(); // Dùng Map thay vì object → hỗ trợ ObjectId làm key
    const roots = [];

    allCats.forEach(cat => {
      const item = {
        _id: cat._id.toString(),    // ← convert ngay từ đầu
        name: cat.name,
        slug: cat.slug,
        image: cat.image || null,
        children: []
      };

      map.set(cat._id.toString(), item); // dùng string làm key

      if (!cat.parent || cat.parent === null) {
        roots.push(item);
      }
    });

    // Gắn con vào cha
    allCats.forEach(cat => {
      if (cat.parent && map.has(cat.parent.toString())) {
        map.get(cat.parent.toString()).children.push(map.get(cat._id.toString()));
      }
    });

    // Sắp xếp children
    const sortChildren = (nodes) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          node.children.sort((a, b) => 
            (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name)
          );
          sortChildren(node.children); // đệ quy
        }
      });
    };
    sortChildren(roots);

    res.json(roots);
  } catch (error) {
    console.error("Lỗi getCategories tree:", error);
    res.status(500).json({ 
      message: "Lỗi server khi lấy danh mục", 
      error: error.message 
    });
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
    const { error } = categorySchema.validate(req.body); // giữ nguyên: bắt buộc slug + name
    if (error) return res.status(400).json({ message: error.details[0].message });

    const category = await CategoryService.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating category' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    // DÙNG SCHEMA MỚI CHO UPDATE
    const { error } = updateCategorySchema.validate(req.body);
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