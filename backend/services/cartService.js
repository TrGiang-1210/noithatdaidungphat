const Cart = require('../models/Cart');
const Product = require('../models/Product');

class CartService {
  static async addItem(userId, { product_id, quantity }) {
    const product = await Product.findById(product_id);
    if (!product) throw new Error('Product không tồn tại');
    if (product.stock < quantity) throw new Error('Không đủ số lượng trong kho');

    let cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
      cart = await Cart.create({
        user_id: userId,
        items: [{ product_id, quantity, price: product.price }]
      });
    } else {
      const itemIndex = cart.items.findIndex(
        item => item.product_id.toString() === product_id
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
        cart.items[itemIndex].price = product.price;
      } else {
        cart.items.push({ product_id, quantity, price: product.price });
      }

      cart.updated_at = Date.now();
      await cart.save();
    }

    return await this.getCart(userId); // Trả lại dữ liệu đầy đủ
  }

  static async getCart(userId) {
  let cart = await Cart.findOne({ user_id: userId }).populate({
    path: 'items.product_id',
    select: '_id name price images'
  });

  if (!cart) {
    return { items: [] };
  }

  const items = cart.items.map(item => ({
    product: {
      _id: item.product_id._id,
      name: item.product_id.name,
      price: item.product_id.price,
      images: item.product_id.images || [],
    },
    quantity: item.quantity
  }));

  return { items };
}

  static async updateItem(userId, { product_id, quantity }) {
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) throw new Error('Không tìm thấy giỏ hàng');

    const product = await Product.findById(product_id);
    if (!product) throw new Error('Product không tồn tại');
    if (quantity > product.stock) throw new Error('Không đủ hàng trong kho');

    const itemIndex = cart.items.findIndex(item => item.product_id.toString() === product_id);
    if (itemIndex === -1) throw new Error('Sản phẩm không tồn tại trong giỏ hàng');

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1); // Xóa sản phẩm
    } else {
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].price = product.price;
    }

    cart.updated_at = Date.now();
    await cart.save();

    return await this.getCart(userId);
  }

  static async removeItem(userId, product_id) {
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) throw new Error('Không tìm thấy giỏ hàng');

    cart.items = cart.items.filter(item => item.product_id.toString() !== product_id);
    cart.updated_at = Date.now();
    await cart.save();

    return await this.getCart(userId);
  }

  static async clearCart(userId) {
    await Cart.deleteOne({ user_id: userId });
    return { user_id: userId, items: [] };
  }
}

module.exports = CartService;
