const ProductService = require('../services/productService');
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

  // Nếu bạn không dùng các field cũ thì bỏ luôn
//   category_id: Joi.string().allow(''),
//   brand_id: Joi.string().allow('')
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

    // Giá lọc theo giáSale hoặc priceOriginal? => Dùng priceSale
    if (minPrice || maxPrice) filters.priceSale = {};
    if (minPrice) filters.priceSale.$gte = Number(minPrice);
    if (maxPrice) filters.priceSale.$lte = Number(maxPrice);

    let query = ProductService.getAll(filters);

    if (sort === "price_asc") query.sort({ priceSale: 1 });
    if (sort === "price_desc") query.sort({ priceSale: -1 });

    const products = await query;
    res.json(products);

  } catch (error) {
    res.status(500).json({ message: error.message || "Error fetching products" });
  }
};

// ======================================================================
// GET PRODUCT BY ID
// ======================================================================
exports.getProductById = async (req, res) => {
  try {
    const product = await ProductService.getByIdOrSlug(req.params.id);
    res.json(product);
  } catch (error) {
    res.status(404).json({ message: error.message || "Product not found" }); // Thay 500 thành 404 nếu muốn
  }
};

// ======================================================================
// CREATE PRODUCT
// ======================================================================
exports.createProduct = async (req, res) => {
  try {
    const { error } = productSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    // Nếu upload nhiều ảnh
    const images = req.files
      ? req.files.map(file => `/uploads/${file.filename}`)
      : req.body.images || [];

    const product = await ProductService.create({
      ...req.body,
      images
    });

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

    const product = await ProductService.update(req.params.id, {
      ...req.body,
      images
    });

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
// SEARCH PRODUCTS
// ======================================================================
exports.searchProducts = async (req, res) => {
  try {
    const { query, minPrice, maxPrice, sort } = req.query;

    const filters = {};

    if (query) filters.name = new RegExp(query, "i");

    if (minPrice || maxPrice) filters.priceSale = {};
    if (minPrice) filters.priceSale.$gte = Number(minPrice);
    if (maxPrice) filters.priceSale.$lte = Number(maxPrice);

    let queryObj = ProductService.getAll(filters);

    if (sort === "price_asc") queryObj.sort({ priceSale: 1 });
    if (sort === "price_desc") queryObj.sort({ priceSale: -1 });

    const products = await queryObj;

    res.json(products);

  } catch (error) {
    res.status(500).json({ message: error.message || "Error searching products" });
  }
};
