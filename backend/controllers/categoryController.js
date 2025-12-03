const CategoryService = require('../services/categoryService');
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

// THAY TOÀN BỘ HÀM getCategories BẰNG HÀM NÀY
exports.getCategories = async (req, res) => {
  try {
    // Lấy tất cả danh mục + chỉ lấy những cái active
    const allCats = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();

    const map = {};
    const roots = [];

    // Tạo map và gán children = []
    allCats.forEach(cat => {
      const item = {
        _id: cat._id,
        name: cat.name,
        slug: cat.slug,
        image: cat.image,
        children: []
      };
      map[cat._id] = item;

      if (!cat.parent) {
        roots.push(item);
      }
    });

    // Gắn con vào cha
    allCats.forEach(cat => {
      if (cat.parent && map[cat.parent.toString()]) {
        map[cat.parent.toString()].children.push(map[cat._id]);
      }
    });

    // Sắp xếp con theo sortOrder hoặc tên
    roots.forEach(root => {
      root.children.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name));
    });

    res.json(roots);
  } catch (error) {
    console.error("Lỗi getCategories tree:", error);
    res.status(500).json({ message: "Lỗi server" });
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