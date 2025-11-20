// controllers/productController.js
const ProductService = require('../services/productService');
const Product = require('../models/Product'); // <--- THÊM DÒNG NÀY NẾU CHƯA CÓ (rất hay bị thiếu)
const Joi = require('joi');

const productSchema = Joi.object({
  name: Joi.string().required(),
  slug: Joi.string().required(),
  sku: Joi.string().required(),
  images: Joi.array().items(Joi.string()).min(1).required(),
  description: Joi.string().allow(''),

  priceOriginal: Joi.number().required(),
  priceSale: Joi.number().required(),

  material: Joi.string().allow(''),
  color: Joi.string().allow(''),
  size: Joi.string().allow(''),
  quantity: Joi.number().required(),
});

// ======================================================================
// GET ALL PRODUCTS
// ======================================================================
exports.getProducts = async (req, res) => {
  try {
    const { name, material, color, minPrice, maxPrice, sort } = req.query;
    const filters = {};

    if (name) filters.name = new RegExp(name, "i");
    if (material) filters.material = new RegExp(material, "i");
    if (color) filters.color = new RegExp(color, "i");

    if (minPrice || maxPrice) filters.priceSale = {};
    if (minPrice) filters.priceSale.$gte = Number(minPrice);
    if (maxPrice) filters.priceSale.$lte = Number(maxPrice);

    let query = ProductService.getAll(filters);

    if (sort === "price_asc") query = query.sort({ priceSale: 1 });
    if (sort === "price_desc") query = query.sort({ priceSale: -1 });

    const products = await query;
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message || "Error fetching products" });
  }
};

// ======================================================================
// GET PRODUCT BY ID OR SLUG
// ======================================================================
exports.getProductById = async (req, res) => {
  try {
    const product = await ProductService.getByIdOrSlug(req.params.id);
    res.json(product);
  } catch (error) {
    res.status(404).json({ message: error.message || "Product not found" });
  }
};

// ======================================================================
// CREATE PRODUCT
// ======================================================================
exports.createProduct = async (req, res) => {
  try {
    const { error } = productSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const images = req.files
      ? req.files.map(file => `/uploads/${file.filename}`)
      : req.body.images || [];

    const product = await ProductService.create({ ...req.body, images });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message || "Error creating product" });
  }
};

// ======================================================================
// UPDATE PRODUCT
// ======================================================================
exports.updateProduct = async (req, res) => {
  try {
    const { error } = productSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const images = req.files
      ? req.files.map(file => `/uploads/${file.filename}`)
      : req.body.images;

    const product = await ProductService.update(req.params.id, { ...req.body, images });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message || "Error updating product" });
  }
};

// ======================================================================
// DELETE PRODUCT
// ======================================================================
exports.deleteProduct = async (req, res) => {
  try {
    await ProductService.delete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Error deleting product" });
  }
};

// ======================================================================
// SEARCH PRODUCTS – HOÀN HẢO, HỖ TRỢ TIẾNG VIỆT CÓ DẤU
// ======================================================================
exports.searchProducts = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({ message: "Query không được để trống" });
    }

    const products = await Product.find({
      $or: [
        { name: { $regex: query.trim(), $options: 'i' } },
        { description: { $regex: query.trim(), $options: 'i' } },
        { sku: { $regex: query.trim(), $options: 'i' } }
      ]
    }).limit(20);

    res.status(200).json(products);
  } catch (error) {
    console.error("Lỗi search:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};