const Product = require('../models/Product');
const mongoose = require('mongoose');

class ProductService {

  // Lấy toàn bộ sản phẩm + filter + limit + sort
  static async getAll(filters = {}, limit = 0, sort = {}) {
    return await Product.find(filters)
      .limit(limit)
      .sort(sort); // Xóa populate
  }

  // Lấy 1 sản phẩm theo ID
  static async getById(id) {
    const product = await Product.findById(id); // Xóa populate

    if (!product) throw new Error('Product not found');
    return product;
  }

  // Thêm sau getById
static async getByIdOrSlug(identifier) {
    let product;

    // Nếu là ObjectId hợp lệ (24 ký tự hex) → tìm bằng _id
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      product = await Product.findById(identifier);
    } 
    // Ngược lại → tìm bằng slug
    else {
      product = await Product.findOne({ slug: identifier });
    }

    if (!product) throw new Error('Product not found');
    return product;
  }
  // Tạo sản phẩm
  static async create(data) {
    return await Product.create(data);
  }

  // Update sản phẩm
  static async update(id, data) {
    data.updated_at = new Date(); // cập nhật thời gian tự động
    const product = await Product.findByIdAndUpdate(id, data, { new: true });

    if (!product) throw new Error('Product not found');
    return product;
  }

  // Xóa sản phẩm
  static async delete(id) {
    const product = await Product.findByIdAndDelete(id);

    if (!product) throw new Error('Product not found');
    return true;
  }
}

module.exports = ProductService;