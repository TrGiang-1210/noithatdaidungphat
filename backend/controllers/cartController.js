// backend/controllers/cartController.js
const CartService = require('../services/CartService');
const Joi = require('joi');

const addItemSchema = Joi.object({
  product_id: Joi.string().length(24).required(),
  quantity: Joi.number().min(1).default(1)
});

const updateItemSchema = Joi.object({
  product_id: Joi.string().length(24).required(),
  quantity: Joi.number().min(0).required()
});

const removeItemSchema = Joi.object({
  product_id: Joi.string().length(24).required()
});

// === CÁC HÀM CONTROLLER ===
const addItem = async (req, res) => {
  try {
    const { error } = addItemSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const cart = await CartService.addItem(req.user.id, req.body);
    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error adding item to cart' });
  }
};

const getCart = async (req, res) => {
  try {
    const cart = await CartService.getCart(req.user.id);
    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error fetching cart' });
  }
};

const updateItem = async (req, res) => {
  try {
    const { error } = updateItemSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const cart = await CartService.updateItem(req.user.id, req.body);
    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error updating cart' });
  }
};

const removeItem = async (req, res) => {
  try {
    const { error } = removeItemSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const cart = await CartService.removeItem(req.user.id, req.body.product_id);
    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error removing item from cart' });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await CartService.clearCart(req.user.id);
    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error clearing cart' });
  }
};

// === EXPORT TẤT CẢ HÀM ===
module.exports = {
  addItem,
  getCart,
  updateItem,
  removeItem,
  clearCart
};