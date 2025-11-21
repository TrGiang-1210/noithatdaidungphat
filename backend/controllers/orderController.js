const OrderService = require('../services/orderService');
const OrderDetailService = require('../services/OrderDetailService');
const CartService = require('../services/CartService');
const UserService = require('../services/userService');
const EmailService = require('../services/emailService');
const Joi = require('joi');
const { createMomoPayment } = require('../services/orderService');

const orderSchema = Joi.object({
  payment_method: Joi.string().valid('cod', 'bank').default('cod'),
  customer: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().allow('', null),
    address: Joi.string().required()
  }).required(),
  ward: Joi.string().required(),
  district: Joi.string().required(),
  city: Joi.string().required(),
  items: Joi.array().items(
    Joi.object({
      product_id: Joi.string().required(),
      quantity: Joi.number().min(1).required(),
      price: Joi.number().required(),
      name: Joi.string().required(),
      img_url: Joi.string().allow('', null)
    })
  ).min(1).required(),
  total: Joi.number().required()
});

module.exports = {
  getOrders: async (req, res) => {
    try {
      const { status, minTotal, maxTotal, sort = 'created_at', order = 'desc' } = req.query;
      const filters = {};
      // Nếu là user thường, chỉ trả về đơn của user đó
      if (req.user && req.user.role !== 'admin') {
        filters.user_id = req.user.id;
      } else if (req.query.user_id) {
        filters.user_id = req.query.user_id;
      }
      if (status) filters.status = status;
      if (minTotal || maxTotal) {
        filters.total = {};
        if (minTotal) filters.total.$gte = Number(minTotal);
        if (maxTotal) filters.total.$lte = Number(maxTotal);
      }
      // Truyền sort vào service
      const sortObj = { [sort]: order === 'asc' ? 1 : -1 };
      const orders = await OrderService.getAll(filters, sortObj);
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const details = await OrderDetailService.getByOrderId(order._id);
          const user = await UserService.getById(order.user_id);
          return {
            ...order._doc,
            items: details,
            user: user // rename for clarity
          };
        })
      );
      res.status(200).json(ordersWithItems);
    } catch (error) {
      res.status(500).json({ message: error.message || 'Lỗi khi lấy đơn hàng' });
    }
  },

  getOrderById: async (req, res) => {
    try {
      const order = await OrderService.getById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

      const items = await OrderDetailService.getByOrderId(order._id);

      res.json({
        _id: order._id,
        customer: order.customer,
        payment_method: order.payment_method,
        total: order.total,
        status: order.status,
        created_at: order.created_at,
        updated_at: order.updated_at,
        items: items.map(item => ({
          _id: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          img_url: item.img_url
        }))
      });
    } catch (error) {
      res.status(500).json({ message: error.message || 'Lỗi khi lấy đơn hàng' });
    }
  },

  createOrder: async (req, res) => {
    try {
      const { error } = orderSchema.validate(req.body);
      if (error) return res.status(400).json({ message: error.details[0].message });

      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Bạn chưa đăng nhập' });

      const { customer, payment_method, items, total, ward, district, city } = req.body;
      const fullAddress = `${customer.address}, ${ward}, ${district}, ${city}`;

      const order = await OrderService.create({
        user_id: userId,
        payment_method,
        total,
        status: 'pending',
        customer: {
          ...customer,
          address: fullAddress
        },
        ward,
        district,
        city
      });

      const detailDocs = items.map(item => ({
        order_id: order._id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        img_url: item.img_url || '',
      }));

      await OrderDetailService.createMany(detailDocs);
      await CartService.clearCart(userId);

      // Gửi email xác nhận đơn hàng cho khách hàng
      try {
        const user = await UserService.getById(userId);
        await EmailService.sendOrderConfirmation(order, detailDocs, user);
        await EmailService.sendOrderNotificationToAdmin(order, detailDocs, user);
      } catch (emailError) {
        console.error('❌ Lỗi gửi email:', emailError);
        // Không dừng quá trình tạo đơn hàng nếu gửi email thất bại
      }

      const io = req.app.get('io');
      if (io) {
        io.to(userId.toString()).emit('new-notification', {
          user_id: userId,
          content: `Đơn hàng #${order._id} đã được tạo thành công!`,
          type: 'order_placed',
          related_id: order._id,
          related_model: 'Order',
          related_action: 'view_order'
        });

        io.to('admin').emit('new-order', {
          order_id: order._id,
          user_id: userId,
          total,
          status: order.status,
          created_at: order.created_at
        });
      }

      res.status(201).json({ order, orderDetails: detailDocs });
    } catch (error) {
      console.error('❌ Lỗi tạo đơn hàng:', error);
      res.status(500).json({ message: error.message || 'Lỗi tạo đơn hàng' });
    }
  },

  updateOrder: async (req, res) => {
    try {
      const order = await OrderService.getById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

      if (req.body.status === 'cancelled' && order.status !== 'pending') {
        return res.status(400).json({ message: 'Chỉ được hủy đơn đang chờ' });
      }

      const oldStatus = order.status;
      const updated = await OrderService.update(req.params.id, req.body);

      // Gửi email cập nhật trạng thái nếu có thay đổi
      if (req.body.status && req.body.status !== oldStatus) {
        try {
          const user = await UserService.getById(order.user_id);
          await EmailService.sendOrderStatusUpdate(updated, user, oldStatus, req.body.status);
        } catch (emailError) {
          console.error('❌ Lỗi gửi email cập nhật trạng thái:', emailError);
          // Không dừng quá trình cập nhật nếu gửi email thất bại
        }
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: error.message || 'Lỗi cập nhật đơn hàng' });
    }
  },

  deleteOrder: async (req, res) => {
    try {
      await OrderService.delete(req.params.id);
      res.json({ message: 'Đã xóa đơn hàng' });
    } catch (error) {
      res.status(500).json({ message: error.message || 'Lỗi khi xóa đơn hàng' });
    }
  },

  createMomoOrder: async (req, res) => {
    try {
      const { error } = orderSchema.validate(req.body);
      if (error) return res.status(400).json({ message: error.details[0].message });

      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Bạn chưa đăng nhập' });

      const { customer, payment_method, items, total, ward, district, city } = req.body;
      const fullAddress = `${customer.address}, ${ward}, ${district}, ${city}`;

      // Tạo đơn hàng thực sự trong database
      const order = await OrderService.create({
        user_id: userId,
        payment_method,
        total,
        status: 'pending',
        customer: {
          ...customer,
          address: fullAddress
        },
        ward,
        district,
        city
      });

      // Tạo order details
      const detailDocs = items.map(item => ({
        order_id: order._id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        img_url: item.img_url || '',
      }));

      await OrderDetailService.createMany(detailDocs);

      // Xóa giỏ hàng ngay khi tạo đơn hàng thành công
      console.log('🛒 Creating MoMo order - Clearing cart for user:', userId);
      try {
        await CartService.clearCart(userId);
        console.log('✅ Cart cleared successfully when creating MoMo order');
      } catch (cartError) {
        console.error('❌ Error clearing cart when creating MoMo order:', cartError);
      }

      // Gửi email xác nhận đơn hàng cho khách hàng (MoMo)
      try {
        const user = await UserService.getById(userId);
        await EmailService.sendOrderConfirmation(order, detailDocs, user);
        await EmailService.sendOrderNotificationToAdmin(order, detailDocs, user);
      } catch (emailError) {
        console.error('❌ Lỗi gửi email MoMo:', emailError);
        // Không dừng quá trình tạo đơn hàng nếu gửi email thất bại
      }

      // Tạo link thanh toán Momo với orderId thực
      const orderId = order._id.toString();
      const redirectUrl = process.env.MOMO_REDIRECT_URL || 'http://localhost:5173/momo-callback';
      const ipnUrl = process.env.MOMO_IPN_URL || 'http://localhost:5000/api/momo/webhook';
      
      console.log('🔗 MoMo - Redirect URL:', redirectUrl);
      console.log('🔗 MoMo - IPN URL:', ipnUrl);
      console.log('🔗 MoMo - Order ID:', orderId);
      
      const momoRes = await createMomoPayment(orderId, total, redirectUrl, ipnUrl);
      
      console.log('🔗 MoMo - Response:', momoRes);
      
      if (momoRes && momoRes.payUrl) {
        res.json({ 
          payUrl: momoRes.payUrl, 
          orderId: orderId,
          order: order,
          orderDetails: detailDocs 
        });
      } else {
        // Nếu tạo link thanh toán thất bại, xóa đơn hàng đã tạo
        await OrderService.delete(order._id);
        await OrderDetailService.deleteByOrderId(order._id);
        res.status(500).json({ message: 'Không tạo được link thanh toán MoMo' });
      }
    } catch (err) {
      console.error('❌ Lỗi tạo đơn hàng Momo:', err);
      res.status(500).json({ message: err.message || 'Lỗi tạo đơn hàng Momo' });
    }
  },

  momoWebhook: async (req, res) => {
    try {
      console.log('📞 MoMo webhook - Request received');
      console.log('📞 MoMo webhook - Headers:', req.headers);
      console.log('📞 MoMo webhook - Body:', req.body);
      
      const { orderId, resultCode, message } = req.body;
      console.log('📞 MoMo webhook received:', { orderId, resultCode, message });
      
      if (resultCode === 0) {
        // Thanh toán thành công
        console.log('✅ MoMo webhook - Payment successful, processing...');
        try {
          // Cập nhật trạng thái đơn hàng thành 'paid'
          const updatedOrder = await OrderService.update(orderId, { 
            status: 'paid',
            updated_at: new Date()
          });
          
          console.log('✅ MoMo webhook - Order updated:', updatedOrder);
          
          if (updatedOrder) {
            // Xóa giỏ hàng của user
            console.log('🛒 MoMo webhook - Clearing cart for user:', updatedOrder.user_id);
            try {
              await CartService.clearCart(updatedOrder.user_id);
              console.log('✅ MoMo webhook - Cart cleared successfully');
            } catch (cartError) {
              console.error('❌ MoMo webhook - Error clearing cart:', cartError);
              // Tiếp tục xử lý ngay cả khi xóa giỏ hàng thất bại
            }
            
            // Gửi email thông báo thanh toán thành công
            try {
              const user = await UserService.getById(updatedOrder.user_id);
              const orderDetails = await OrderDetailService.getByOrderId(orderId);
              await EmailService.sendOrderStatusUpdate(updatedOrder, user, 'pending', 'paid');
            } catch (emailError) {
              console.error('❌ Lỗi gửi email thanh toán thành công:', emailError);
            }

            // Gửi thông báo realtime
            const io = req.app.get('io');
            if (io) {
              io.to(updatedOrder.user_id.toString()).emit('new-notification', {
                user_id: updatedOrder.user_id,
                content: `Đơn hàng #${orderId} đã được thanh toán thành công!`,
                type: 'payment_success',
                related_id: orderId,
                related_model: 'Order',
                related_action: 'view_order'
              });

              io.to('admin').emit('order-updated', {
                order_id: orderId,
                user_id: updatedOrder.user_id,
                status: 'paid',
                updated_at: new Date()
              });
            }
            
            console.log('✅ MoMo payment successful for order:', orderId);
          } else {
            console.error('❌ Không tìm thấy đơn hàng:', orderId);
          }
        } catch (error) {
          console.error('❌ Lỗi xử lý webhook MoMo:', error);
        }
      } else {
        // Thanh toán thất bại
        console.log('❌ MoMo payment failed for order:', orderId, 'with code:', resultCode);
        
        // Có thể cập nhật trạng thái đơn hàng thành 'failed' nếu muốn
        try {
          await OrderService.update(orderId, { 
            status: 'failed',
            updated_at: new Date()
          });
        } catch (error) {
          console.error('❌ Lỗi cập nhật trạng thái đơn hàng thất bại:', error);
        }
      }
      
      console.log('📞 MoMo webhook - Sending OK response');
      res.status(200).send('OK');
    } catch (err) {
      console.error('❌ Webhook error:', err);
      res.status(500).send('Webhook error');
    }
  }
};
