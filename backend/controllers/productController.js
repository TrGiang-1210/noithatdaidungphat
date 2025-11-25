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

// GET /api/products/search-suggestions?q=xxx → SIÊU THÔNG MINH (ĐÃ SỬA LỖI)
exports.searchSuggestions = async (req, res) => {
  try {
    let q = (req.query.q || '').toString().trim();

    // Cho phép tìm ngay từ 1 ký tự
    if (!q || q.length < 1) {
      return res.json([]);
    }

    // Hàm chuẩn hóa: bỏ dấu tiếng Việt
    const normalize = (str) =>
      str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const normalizedQ = normalize(q);
    const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Tạo các pattern tìm kiếm linh hoạt
    const searchPatterns = [
      new RegExp(escapedQ, 'i'),                    // tìm chính xác có dấu
      new RegExp(normalizedQ, 'i'),                 // tìm chính xác không dấu
      new RegExp(normalizedQ.split('').join('.*'), 'i'),  // gõ thiếu: "btra" → "bàn trà"
      new RegExp(escapedQ.split('').join('.*'), 'i'),     // gõ thiếu có dấu: "ghsfa" → "ghế sofa"
    ];

    // Tìm sản phẩm theo tên HOẶC mô tả
    const products = await Product.find({
      $or: [
        { name: { $in: searchPatterns } },
        { description: { $in: searchPatterns } },
        { sku: { $in: searchPatterns } },        // THÊM DÒNG NÀY: TÌM THEO SKU
        { sku: { $regex: escapedQ, $options: 'i' } }, // Bonus: tìm chính xác SKU
      ]
    })
      .select('name slug priceSale priceOriginal images sku')
      .limit(10)
      .lean();

    // Sắp xếp ưu tiên sản phẩm có từ khóa trong tên (ưu tiên cao hơn)
    products.sort((a, b) => {
      const aSku = (a.sku || '').toString().toLowerCase();
      const bSku = (b.sku || '').toString().toLowerCase();
      const lowerQ = q.toLowerCase();

      if (aSku.includes(lowerQ) && !bSku.includes(lowerQ)) return -1;
      if (!aSku.includes(lowerQ) && bSku.includes(lowerQ)) return 1;

      const aName = normalize(a.name);
      const bName = normalize(b.name);
      if (aName.includes(normalizedQ) && !bName.includes(normalizedQ)) return -1;
      if (!aName.includes(normalizedQ) && bName.includes(normalizedQ)) return 1;

      return 0;
    });

    res.json(products);
  } catch (err) {
    console.error('searchSuggestions error:', err);
    res.status(500).json([]);
  }
};