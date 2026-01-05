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
    // ✅ Sort theo sortOrder
    const categories = await Category.find({})
      .sort({ sortOrder: 1, 'name.vi': 1 });
    
    const map = {};
    const tree = [];

    categories.forEach(cat => {
      const catObj = cat.toObject();
      map[cat._id] = {
        ...catObj,
        value: cat._id.toString(),
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

    // ✅ Sort children theo sortOrder
    const sortChildren = (nodes) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          node.children.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          sortChildren(node.children);
        }
      });
    };
    sortChildren(tree);
    
    // ✅ Sort root level
    tree.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    res.json(tree);
  } catch (error) {
    console.error("❌ getCategoryTree error:", error);
    res.status(500).json({ message: "Lỗi lấy cây danh mục" });
  }
};

// ✅ Reorder categories (drag & drop) - ENHANCED with 3 positions
exports.reorderCategories = async (req, res) => {
  try {
    const { draggedId, targetId, position } = req.body; // before | inside | after
    
    console.log('🔄 Reordering categories:', { draggedId, targetId, position });
    
    if (!draggedId || !targetId || !position) {
      return res.status(400).json({ 
        message: 'Thiếu draggedId, targetId hoặc position' 
      });
    }
    
    // Tìm 2 categories
    const draggedCat = await Category.findById(draggedId);
    const targetCat = await Category.findById(targetId);
    
    if (!draggedCat || !targetCat) {
      return res.status(404).json({ 
        message: 'Không tìm thấy danh mục' 
      });
    }
    
    // Kiểm tra không cho kéo cha vào con
    const isDescendant = async (parentId, childId) => {
      const children = await Category.find({ parent: parentId });
      for (const child of children) {
        if (child._id.toString() === childId.toString()) return true;
        if (await isDescendant(child._id, childId)) return true;
      }
      return false;
    };
    
    if (position === 'inside' && await isDescendant(draggedId, targetId)) {
      return res.status(400).json({ 
        message: 'Không thể di chuyển danh mục cha vào danh mục con của nó' 
      });
    }
    
    // ✅ Xác định parent mới dựa trên position
    let newParent;
    
    if (position === 'inside') {
      // Đặt vào trong target -> target là parent mới
      newParent = targetId;
    } else {
      // before hoặc after -> cùng parent với target
      newParent = targetCat.parent;
    }
    
    const oldParent = draggedCat.parent;
    
    // Cập nhật parent
    draggedCat.parent = newParent;
    
    // Cập nhật level và ancestors
    if (newParent) {
      const parentCat = await Category.findById(newParent);
      draggedCat.level = (parentCat.level || 0) + 1;
      draggedCat.ancestors = [...(parentCat.ancestors || []), newParent];
    } else {
      draggedCat.level = 0;
      draggedCat.ancestors = [];
    }
    
    // Lấy tất cả siblings ở parent mới
    const siblings = await Category.find({ 
      parent: newParent || null 
    }).sort({ sortOrder: 1, 'name.vi': 1 });
    
    // Tìm vị trí của targetCat
    const targetIndex = siblings.findIndex(
      s => s._id.toString() === targetId.toString()
    );
    
    // Sắp xếp lại sortOrder
    let newOrder = 0;
    const updatePromises = [];
    
    // ✅ FIX: Xử lý đúng cho cả drag lên và xuống
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i];
      
      // Skip draggedCat nếu nó đang ở cùng parent
      if (sibling._id.toString() === draggedId.toString()) {
        continue;
      }
      
      const isTarget = sibling._id.toString() === targetId.toString();
      
      if (position === 'before' && isTarget) {
        // Đặt draggedCat TRƯỚC target
        draggedCat.sortOrder = newOrder;
        updatePromises.push(draggedCat.save());
        newOrder++;
        
        sibling.sortOrder = newOrder;
        updatePromises.push(sibling.save());
        newOrder++;
        
      } else if (position === 'after' && isTarget) {
        // Đặt target TRƯỚC, draggedCat SAU
        sibling.sortOrder = newOrder;
        updatePromises.push(sibling.save());
        newOrder++;
        
        draggedCat.sortOrder = newOrder;
        updatePromises.push(draggedCat.save());
        newOrder++;
        
      } else {
        // Các sibling khác giữ nguyên thứ tự
        sibling.sortOrder = newOrder;
        updatePromises.push(sibling.save());
        newOrder++;
      }
    }
    
    // ✅ Xử lý riêng cho position === 'inside'
    if (position === 'inside') {
      // Lấy children hiện tại của target
      const targetChildren = await Category.find({ 
        parent: targetId 
      }).sort({ sortOrder: 1 });
      
      // Đặt draggedCat làm child đầu tiên
      draggedCat.sortOrder = 0;
      await draggedCat.save();
      
      // Đẩy các children khác xuống
      for (let i = 0; i < targetChildren.length; i++) {
        const child = targetChildren[i];
        if (child._id.toString() !== draggedId.toString()) {
          child.sortOrder = i + 1;
          await child.save();
        }
      }
    }
    
    // Nếu kéo từ parent khác sang, cập nhật sortOrder ở old parent
    if (oldParent && oldParent.toString() !== (newParent ? newParent.toString() : 'null')) {
      const oldSiblings = await Category.find({ 
        parent: oldParent 
      }).sort({ sortOrder: 1 });
      
      let order = 0;
      for (const sibling of oldSiblings) {
        if (sibling._id.toString() !== draggedId.toString()) {
          sibling.sortOrder = order;
          updatePromises.push(sibling.save());
          order++;
        }
      }
    }
    
    // Lưu tất cả thay đổi (chỉ cho before/after)
    if (position !== 'inside') {
      await Promise.all(updatePromises);
    }
    
    // Cập nhật lại ancestors và level cho tất cả children của draggedCat
    const updateChildrenRecursive = async (parentId) => {
      const children = await Category.find({ parent: parentId });
      const parent = await Category.findById(parentId);
      
      for (const child of children) {
        child.level = parent.level + 1;
        child.ancestors = [...parent.ancestors, parentId];
        await child.save();
        
        const hasGrandChildren = await Category.countDocuments({ parent: child._id });
        if (hasGrandChildren > 0) {
          await updateChildrenRecursive(child._id);
        }
      }
    };
    
    const hasChildren = await Category.countDocuments({ parent: draggedId });
    if (hasChildren > 0) {
      await updateChildrenRecursive(draggedId);
    }
    
    console.log(`✅ Reorder successful: ${position}`);
    
    res.json({ 
      message: 'Di chuyển danh mục thành công',
      position,
      draggedCat,
      targetCat
    });
    
  } catch (error) {
    console.error('❌ Reorder error:', error);
    res.status(500).json({ 
      message: 'Lỗi khi sắp xếp lại danh mục',
      error: error.message 
    });
  }
};