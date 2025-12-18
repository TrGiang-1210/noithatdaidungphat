const CategoryService = require('../services/categoryService');
const Category = require('../models/Category');
const Joi = require('joi');

const categorySchema = Joi.object({
  slug: Joi.string().required(),
  name: Joi.alternatives().try(
    Joi.string(),
    Joi.object({
      vi: Joi.string().required(),
      zh: Joi.string().allow('')
    })
  ).required(),
  description: Joi.alternatives().try(
    Joi.string().allow(''),
    Joi.object({
      vi: Joi.string().allow(''),
      zh: Joi.string().allow('')
    })
  ).optional(),
  parent: Joi.string().allow(null, '').optional(),
}).unknown(true);

const updateCategorySchema = Joi.object({
  name: Joi.alternatives().try(
    Joi.string(),
    Joi.object({
      vi: Joi.string(),
      zh: Joi.string().allow('')
    })
  ),
  slug: Joi.string().trim(),
  description: Joi.alternatives().try(
    Joi.string().allow(''),
    Joi.object({
      vi: Joi.string().allow(''),
      zh: Joi.string().allow('')
    })
  ),
  parent: Joi.string().allow(null, '').optional(),
}).unknown(true).min(1);

/**
 * Helper: Transform category data theo language
 */
function transformCategory(cat, lang = 'vi') {
  const category = cat.toObject ? cat.toObject() : cat;
  
  return {
    ...category,
    _id: category._id.toString(),
    // ✅ Xử lý name
    name: typeof category.name === 'object' && category.name[lang]
      ? category.name[lang]
      : (category.name?.vi || category.name || ''),
    // ✅ Xử lý description
    description: typeof category.description === 'object' && category.description[lang]
      ? category.description[lang]
      : (category.description?.vi || category.description || '')
  };
}

// GET: Public categories (với language support)
exports.getCategories = async (req, res) => {
  try {
    const { lang = 'vi' } = req.query;
    
    const allCats = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, 'name.vi': 1 }); // Sort theo tiếng Việt

    const map = new Map();
    const roots = [];

    allCats.forEach(cat => {
      const transformed = transformCategory(cat, lang);
      transformed.children = [];
      map.set(cat._id.toString(), transformed);

      if (!cat.parent || cat.parent === null) {
        roots.push(transformed);
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
          sortChildren(node.children);
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
    const { lang = 'vi' } = req.query;
    const category = await CategoryService.getById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    const transformed = transformCategory(category, lang);
    res.json(transformed);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching category' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { error } = categorySchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    // ✅ Convert name/description sang multilingual format nếu cần
    const { name, description, ...otherFields } = req.body;
    
    const categoryData = {
      ...otherFields,
      name: typeof name === 'string' 
        ? { vi: name, zh: '' } 
        : name,
      description: typeof description === 'string'
        ? { vi: description || '', zh: '' }
        : (description || { vi: '', zh: '' })
    };

    const category = await CategoryService.create(categoryData);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating category' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { error } = updateCategorySchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    // ✅ Convert sang multilingual format nếu cần
    const { name, description, ...otherFields } = req.body;
    
    const updateData = { ...otherFields };
    
    if (name !== undefined) {
      updateData.name = typeof name === 'string' 
        ? { vi: name, zh: '' } 
        : name;
    }
    
    if (description !== undefined) {
      updateData.description = typeof description === 'string'
        ? { vi: description || '', zh: '' }
        : description;
    }

    const category = await CategoryService.update(req.params.id, updateData);
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

// Admin: Lấy category tree (không transform language)
exports.getCategoryTree = async (req, res) => {
  try {
    const categories = await CategoryService.getAll({});
    const map = {};
    const tree = [];

    categories.forEach(cat => {
      const catObj = cat.toObject();
      map[cat._id] = {
        ...catObj,
        value: cat._id.toString(),
        // ✅ Hiển thị name.vi cho admin panel
        label: typeof catObj.name === 'object' ? catObj.name.vi : catObj.name,
        children: []
      };
    });

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