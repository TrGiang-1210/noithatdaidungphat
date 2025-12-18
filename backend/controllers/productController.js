const ProductService = require("../services/productService");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Joi = require("joi");
const mongoose = require("mongoose");

/**
 * Helper: Transform product data theo language
 */
function transformProduct(prod, lang = 'vi') {
  const product = prod.toObject ? prod.toObject() : prod;
  
  return {
    ...product,
    // ✅ Xử lý name
    name: typeof product.name === 'object' && product.name[lang]
      ? product.name[lang]
      : (product.name?.vi || product.name || ''),
    
    // ✅ Xử lý description
    description: typeof product.description === 'object' && product.description[lang]
      ? product.description[lang]
      : (product.description?.vi || product.description || ''),
    
    // ✅ Xử lý attributes (nếu có)
    attributes: product.attributes?.map(attr => ({
      ...attr,
      name: typeof attr.name === 'object' && attr.name[lang]
        ? attr.name[lang]
        : (attr.name?.vi || attr.name || ''),
      options: attr.options?.map(opt => ({
        ...opt,
        label: typeof opt.label === 'object' && opt.label[lang]
          ? opt.label[lang]
          : (opt.label?.vi || opt.label || '')
      }))
    })) || []
  };
}

/**
 * Helper: Transform category name theo language
 */
function transformCategoryName(cat, lang = 'vi') {
  if (!cat) return cat;
  return {
    ...cat,
    name: typeof cat.name === 'object' && cat.name[lang]
      ? cat.name[lang]
      : (cat.name?.vi || cat.name || '')
  };
}

// Helper escape regex
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// remove diacritics
const normalizeString = (s) => {
  if (!s) return "";
  return s
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

// GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const { lang = 'vi' } = req.query;
    let filters = {};

    // Lọc theo danh mục
    if (req.query.category) {
      const category = await Category.findOne({
        slug: req.query.category,
        isActive: true,
      });
      if (!category) return res.json([]);

      const getChildIds = async (parentId) => {
        const children = await Category.find({ parent: parentId }).select("_id");
        let ids = children.map((c) => c._id);
        for (const child of children) {
          ids = ids.concat(await getChildIds(child._id));
        }
        return ids;
      };

      const childIds = await getChildIds(category._id);
      filters.categories = { $in: [category._id, ...childIds] };
    }

    // Lọc giá
    if (req.query.minPrice || req.query.maxPrice) {
      filters.priceSale = {};
      if (req.query.minPrice) filters.priceSale.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filters.priceSale.$lte = Number(req.query.maxPrice);
    }

    // Sắp xếp
    let sort = { created_at: -1 };
    if (req.query.sort === "price-asc") sort = { priceSale: 1 };
    if (req.query.sort === "price-desc") sort = { priceSale: -1 };
    if (req.query.sort === "-sold") sort = { sold: -1 };

    const products = await Product.find(filters)
      .populate('categories')
      .sort(sort)
      .lean();

    // ✅ Transform theo language
    const transformed = products.map(prod => {
      const p = transformProduct(prod, lang);
      // Transform categories
      if (p.categories) {
        p.categories = p.categories.map(cat => transformCategoryName(cat, lang));
      }
      return p;
    });

    res.json(transformed);
  } catch (err) {
    console.error("Lỗi getProducts:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// GET /api/products/search
exports.searchProducts = async (req, res) => {
  try {
    const { lang = 'vi' } = req.query;
    const raw = (req.query.query || req.query.q || "").toString().trim();
    if (!raw) return res.json([]);

    const limit = Math.max(0, parseInt(req.query.limit, 10) || 0);

    const normalRegex = new RegExp(escapeRegex(raw), "i");
    const chars = raw.split("").filter(Boolean).map(escapeRegex);
    const fuzzyPattern = chars.join(".*");
    const fuzzyRegex = new RegExp(fuzzyPattern, "i");

    const rawNormalized = normalizeString(raw);
    const normalNormalizedRegex = new RegExp(escapeRegex(rawNormalized), "i");
    const fuzzyNormalizedRegex = new RegExp(
      rawNormalized.split("").map(escapeRegex).join(".*"),
      "i"
    );

    // ✅ Tìm kiếm trong cả name.vi và name.zh
    const orConditions = [
      { 'name.vi': { $regex: normalRegex } },
      { 'name.zh': { $regex: normalRegex } },
      { slug: { $regex: normalRegex } },
      { 'name.vi': { $regex: fuzzyRegex } },
      { 'name.zh': { $regex: fuzzyRegex } },
      { slug: { $regex: fuzzyRegex } },
      { 'description.vi': { $regex: normalRegex } },
      { 'description.zh': { $regex: normalRegex } },
      { sku: { $regex: normalRegex } },
    ];

    let query = Product.find({ $or: orConditions });
    if (limit > 0) query = query.limit(limit);
    query = query.collation({ locale: "vi", strength: 1 });

    const products = await query.lean();

    // ✅ Transform theo language
    const transformed = products.map(prod => transformProduct(prod, lang));

    return res.json(Array.isArray(transformed) ? transformed : []);
  } catch (err) {
    console.error("searchProducts error:", err);
    return res.status(500).json({ message: err.message || "Error searching products" });
  }
};

// GET /api/products/:id
exports.getProductById = async (req, res) => {
  try {
    const { lang = 'vi' } = req.query;
    const p = await ProductService.getById(req.params.id);
    if (!p) return res.status(404).json({ message: "Product not found" });
    
    const transformed = transformProduct(p, lang);
    return res.json(transformed);
  } catch (err) {
    console.error("getProductById error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// GET /api/products/slug/:slug
exports.getProductBySlug = async (req, res) => {
  try {
    const { lang = 'vi' } = req.query;
    
    let p;
    if (typeof ProductService.getByIdOrSlug === "function") {
      p = await ProductService.getByIdOrSlug(req.params.slug);
    } else {
      p = await Product.findOne({ slug: req.params.slug }).lean();
    }
    
    if (!p) return res.status(404).json({ message: "Product not found" });
    
    const transformed = transformProduct(p, lang);
    return res.json(transformed);
  } catch (err) {
    console.error("getProductBySlug error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// Tăng lượt xem
exports.incrementView = async (req, res) => {
  try {
    const { id, slug } = req.params;
    let product;
    
    if (id) {
      product = await Product.findByIdAndUpdate(
        id,
        { $inc: { view: 1 } },
        { new: true }
      );
    } else if (slug) {
      product = await Product.findOneAndUpdate(
        { slug: slug },
        { $inc: { view: 1 } },
        { new: true }
      );
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json({ 
      success: true, 
      view: product.view 
    });
  } catch (err) {
    console.error("incrementView error:", err);
    return res.status(500).json({ 
      success: false,
      message: err.message || "Server error" 
    });
  }
};

// GET /api/products/search-suggestions
exports.searchSuggestions = async (req, res) => {
  try {
    const { lang = 'vi' } = req.query;
    let q = (req.query.q || "").toString().trim();

    if (!q || q.length < 1) {
      return res.json([]);
    }

    const normalize = (str) =>
      str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    const normalizedQ = normalize(q);
    const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const searchPatterns = [
      new RegExp(escapedQ, "i"),
      new RegExp(normalizedQ, "i"),
      new RegExp(normalizedQ.split("").join(".*"), "i"),
      new RegExp(escapedQ.split("").join(".*"), "i"),
    ];

    // ✅ Tìm trong cả name.vi và name.zh
    const products = await Product.find({
      $or: [
        { 'name.vi': { $in: searchPatterns } },
        { 'name.zh': { $in: searchPatterns } },
        { 'description.vi': { $in: searchPatterns } },
        { 'description.zh': { $in: searchPatterns } },
        { sku: { $in: searchPatterns } },
        { sku: { $regex: escapedQ, $options: "i" } },
      ],
    })
      .select("name slug priceSale priceOriginal images sku")
      .limit(10)
      .lean();

    // ✅ Transform theo language
    const transformed = products.map(prod => transformProduct(prod, lang));

    // Sắp xếp theo độ ưu tiên
    transformed.sort((a, b) => {
      const aSku = (a.sku || "").toString().toLowerCase();
      const bSku = (b.sku || "").toString().toLowerCase();
      const lowerQ = q.toLowerCase();

      if (aSku.includes(lowerQ) && !bSku.includes(lowerQ)) return -1;
      if (!aSku.includes(lowerQ) && bSku.includes(lowerQ)) return 1;

      const aName = normalize(a.name);
      const bName = normalize(b.name);
      if (aName.includes(normalizedQ) && !bName.includes(normalizedQ)) return -1;
      if (!aName.includes(normalizedQ) && bName.includes(normalizedQ)) return 1;

      return 0;
    });

    res.json(transformed);
  } catch (err) {
    console.error("searchSuggestions error:", err);
    res.status(500).json([]);
  }
};

// === ADMIN FUNCTIONS ===

exports.bulkUpdateCategories = async (req, res) => {
  try {
    const { productIds, categoryIds } = req.body;

    if (!Array.isArray(productIds) || !Array.isArray(categoryIds)) {
      return res.status(400).json({ message: "productIds và categoryIds phải là mảng" });
    }

    if (productIds.length === 0 || categoryIds.length === 0) {
      return res.status(400).json({ message: "Chọn ít nhất 1 sản phẩm và 1 danh mục" });
    }

    const validCategoryObjectIds = categoryIds.map((id) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Category ID không hợp lệ: ${id}`);
      }
      return new mongoose.Types.ObjectId(id);
    });

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { categories: validCategoryObjectIds } }
    );

    return res.json({
      success: true,
      message: `Đã gán danh mục thành công cho ${result.modifiedCount} sản phẩm!`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Lỗi bulkUpdateCategories:", error);
    return res.status(500).json({ message: error.message || "Lỗi server" });
  }
};

exports.getAllProductsAdmin = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("categories", "name slug")
      .sort({ created_at: -1 })
      .lean();
    
    // ✅ Admin panel: giữ nguyên format multilingual (không transform)
    res.json(products);
  } catch (err) {
    console.error("getAllProductsAdmin error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// POST /api/admin/products - Tạo sản phẩm mới
exports.createProduct = async (req, res) => {
  try {
    const {
      name, sku, description, priceOriginal, priceSale, quantity,
      material, color, size, categories, hot, onSale, attributes
    } = req.body;

    if (!name || !sku || !priceOriginal || !priceSale || !quantity) {
      return res.status(400).json({ 
        message: "Thiếu thông tin bắt buộc: name, sku, priceOriginal, priceSale, quantity" 
      });
    }

    const existingSku = await Product.findOne({ sku });
    if (existingSku) {
      return res.status(400).json({ message: "SKU đã tồn tại" });
    }

    // Tạo slug từ name.vi hoặc name (nếu là string)
    const nameForSlug = typeof name === 'object' ? name.vi : name;
    const slug = nameForSlug
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d")
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    // Xử lý images
    let images = [];
    if (req.files && req.files.length > 0) {
      const mainImages = req.files.filter(f => !f.fieldname.startsWith('attribute_'));
      images = mainImages.map((file) => `/uploads/products/${file.filename}`);
    }

    // Xử lý categories
    let categoryIds = [];
    if (categories) {
      if (Array.isArray(categories)) {
        categoryIds = categories.filter(id => mongoose.Types.ObjectId.isValid(id));
      } else if (typeof categories === "string") {
        categoryIds = categories
          .split(",")
          .map((id) => id.trim())
          .filter(id => mongoose.Types.ObjectId.isValid(id));
      }
    }

    // ✅ Xử lý attributes với multilingual
    let parsedAttributes = [];
    if (attributes) {
      try {
        parsedAttributes = typeof attributes === 'string' 
          ? JSON.parse(attributes) 
          : attributes;

        // Upload ảnh cho attributes
        if (req.files && req.files.length > 0) {
          parsedAttributes.forEach((attr, attrIdx) => {
            attr.options.forEach((opt, optIdx) => {
              const fieldName = `attribute_${attrIdx}_${optIdx}`;
              const file = req.files.find(f => f.fieldname === fieldName);
              if (file) {
                opt.image = `/uploads/products/${file.filename}`;
              }
            });
          });
        }
      } catch (e) {
        console.error("Error parsing attributes:", e);
      }
    }

    // ✅ Convert name/description sang multilingual format
    const productData = {
      slug, sku,
      name: typeof name === 'string' 
        ? { vi: name, zh: '' } 
        : name,
      description: typeof description === 'string'
        ? { vi: description || '', zh: '' }
        : (description || { vi: '', zh: '' }),
      priceOriginal: Number(priceOriginal),
      priceSale: Number(priceSale),
      quantity: Number(quantity),
      material: material || "",
      color: color || "",
      size: size || "",
      categories: categoryIds,
      hot: hot === "true" || hot === true || false,
      onSale: onSale === "true" || onSale === true || false,
      images: images.length > 0 ? images : [],
      attributes: parsedAttributes,
    };

    const product = await Product.create(productData);
    
    const savedProduct = await Product.findById(product._id)
      .populate("categories", "name slug")
      .lean();

    res.status(201).json(savedProduct);
  } catch (err) {
    console.error("createProduct error:", err);
    res.status(500).json({ message: err.message || "Lỗi tạo sản phẩm" });
  }
};

// PUT /api/admin/products/:id - Cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    const {
      name, sku, description, priceOriginal, priceSale, quantity,
      material, color, size, categories, hot, onSale, attributes
    } = req.body;

    // Kiểm tra SKU trùng
    if (sku && sku !== product.sku) {
      const existingSku = await Product.findOne({ sku });
      if (existingSku) {
        return res.status(400).json({ message: "SKU đã tồn tại" });
      }
      product.sku = sku;
    }

    // Cập nhật name
    if (name) {
      product.name = typeof name === 'string' 
        ? { vi: name, zh: '' } 
        : name;
      
      // Update slug từ name.vi
      const nameForSlug = typeof name === 'object' ? name.vi : name;
      product.slug = nameForSlug
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d")
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
    }

    // Cập nhật description
    if (description !== undefined) {
      product.description = typeof description === 'string'
        ? { vi: description || '', zh: '' }
        : description;
    }

    if (priceOriginal !== undefined) product.priceOriginal = Number(priceOriginal);
    if (priceSale !== undefined) product.priceSale = Number(priceSale);
    if (quantity !== undefined) product.quantity = Number(quantity);
    if (material !== undefined) product.material = material;
    if (color !== undefined) product.color = color;
    if (size !== undefined) product.size = size;
    if (hot !== undefined) product.hot = hot === "true" || hot === true;
    if (onSale !== undefined) product.onSale = onSale === "true" || onSale === true;

    // Xử lý categories
    if (categories !== undefined) {
      let categoryIds = [];
      if (Array.isArray(categories)) {
        categoryIds = categories.filter(id => mongoose.Types.ObjectId.isValid(id));
      } else if (typeof categories === "string") {
        categoryIds = categories
          .split(",")
          .map((id) => id.trim())
          .filter(id => mongoose.Types.ObjectId.isValid(id));
      }
      product.categories = categoryIds;
    }

    // Xử lý attributes
    if (attributes !== undefined) {
      try {
        let parsedAttributes = typeof attributes === 'string' 
          ? JSON.parse(attributes) 
          : attributes;

        if (req.files && req.files.length > 0) {
          parsedAttributes.forEach((attr, attrIdx) => {
            attr.options.forEach((opt, optIdx) => {
              const fieldName = `attribute_${attrIdx}_${optIdx}`;
              const file = req.files.find(f => f.fieldname === fieldName);
              if (file) {
                opt.image = `/uploads/products/${file.filename}`;
              }
            });
          });
        }

        product.attributes = parsedAttributes;
      } catch (e) {
        console.error("Error parsing attributes:", e);
      }
    }

    // Xử lý images
    if (req.files && req.files.length > 0) {
      const mainImages = req.files.filter(f => !f.fieldname.startsWith('attribute_'));
      if (mainImages.length > 0) {
        product.images = mainImages.map((file) => `/uploads/products/${file.filename}`);
      }
    }

    await product.save();
    
    const updatedProduct = await Product.findById(product._id)
      .populate("categories", "name slug")
      .lean();

    res.json(updatedProduct);
  } catch (err) {
    console.error("updateProduct error:", err);
    res.status(500).json({ message: err.message || "Lỗi cập nhật sản phẩm" });
  }
};

// DELETE /api/admin/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa sản phẩm thành công" });
  } catch (err) {
    console.error("deleteProduct error:", err);
    res.status(500).json({ message: err.message || "Lỗi xóa sản phẩm" });
  }
};