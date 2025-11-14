const Category = require('../models/Category');

class CategoryService {
  static async getAll(filters = {}) {
    return await Category.find(filters);
  }

  static async getById(id) {
    const category = await Category.findById(id);
    if (!category) throw new Error('Category not found');
    return category;
  }

  static async create(data) {
    return await Category.create(data);
  }

  static async update(id, data) {
    const category = await Category.findByIdAndUpdate(id, data, { new: true });
    if (!category) throw new Error('Category not found');
    return category;
  }

  static async delete(id) {
    const category = await Category.findByIdAndDelete(id);
    if (!category) throw new Error('Category not found');
    return true;
  }
}

module.exports = CategoryService;