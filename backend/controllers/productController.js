// controllers/productController.js
const ProductService = require('../services/productService');
const Product = require('../models/Product');
const Joi = require('joi');

// Helper escape regex
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// remove diacritics
const normalizeString = (s) => {
  if (!s) return '';
  return s
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase();
};

// GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 0;
    const filters = {}; // mở rộng từ req.query nếu cần
    const sort = {}; // parse req.query.sort nếu cần
    const products = await ProductService.getAll(filters, limit, sort);
    return res.json(Array.isArray(products) ? products : []);
  } catch (err) {
    console.error('getProducts error:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

// GET /api/products/search
exports.searchProducts = async (req, res) => {
  try {
    const raw = (req.query.query || req.query.q || '').toString().trim();
    if (!raw) return res.json([]);

    const limit = Math.max(0, parseInt(req.query.limit, 10) || 0);

    // regex for original input
    const normalRegex = new RegExp(escapeRegex(raw), 'i');

    // fuzzy for original input (chars with .* between)
    const chars = raw.split('').filter(Boolean).map(escapeRegex);
    const fuzzyPattern = chars.join('.*');
    const fuzzyRegex = new RegExp(fuzzyPattern, 'i');

    // normalized (no diacritics)
    const rawNormalized = normalizeString(raw);
    const normalNormalizedRegex = new RegExp(escapeRegex(rawNormalized), 'i');
    const fuzzyNormalizedRegex = new RegExp(rawNormalized.split('').map(escapeRegex).join('.*'), 'i');

    // search conditions: original fields AND normalized fields (if you have name_normalized/slug_normalized)
    const orConditions = [
      { name: { $regex: normalRegex } },
      { slug: { $regex: normalRegex } },
      { name: { $regex: fuzzyRegex } },
      { slug: { $regex: fuzzyRegex } },
      // normalized fields (ensure you add/populate these in DB)
      { name_normalized: { $regex: normalNormalizedRegex } },
      { slug_normalized: { $regex: normalNormalizedRegex } },
      { name_normalized: { $regex: fuzzyNormalizedRegex } },
      { slug_normalized: { $regex: fuzzyNormalizedRegex } },
      { description: { $regex: normalRegex } },
    ];

    // Remove conditions that reference fields you don't have (optional)
    const finalConditions = orConditions.filter(cond => {
      const key = Object.keys(cond)[0];
      // if normalized fields not present in schema it's OK — Mongo ignores non-existing fields
      return true;
    });

    let query = Product.find({ $or: finalConditions });

    if (limit > 0) query = query.limit(limit);

    // use collation for case/accents where supported (still keep normalized checks)
    query = query.collation({ locale: 'vi', strength: 1 });

    const products = await query.lean();

    return res.json(Array.isArray(products) ? products : []);
  } catch (err) {
    console.error('searchProducts error:', err);
    return res.status(500).json({ message: err.message || 'Error searching products' });
  }
};

// GET /api/products/:id
exports.getProductById = async (req, res) => {
  try {
    const p = await ProductService.getById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Product not found' });
    return res.json(p);
  } catch (err) {
    console.error('getProductById error:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

// GET /api/products/slug/:slug
exports.getProductBySlug = async (req, res) => {
  try {
    if (typeof ProductService.getByIdOrSlug === 'function') {
      const p = await ProductService.getByIdOrSlug(req.params.slug);
      if (!p) return res.status(404).json({ message: 'Product not found' });
      return res.json(p);
    }
    // fallback: try find by slug via model
    const p = await Product.findOne({ slug: req.params.slug }).lean();
    if (!p) return res.status(404).json({ message: 'Product not found' });
    return res.json(p);
  } catch (err) {
    console.error('getProductBySlug error:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

// Admin stubs (so router mounting won't crash). Implement properly later.
exports.createProduct = async (req, res) => {
  return res.status(501).json({ message: 'createProduct not implemented' });
};
exports.updateProduct = async (req, res) => {
  return res.status(501).json({ message: 'updateProduct not implemented' });
};
exports.deleteProduct = async (req, res) => {
  return res.status(501).json({ message: 'deleteProduct not implemented' });
};