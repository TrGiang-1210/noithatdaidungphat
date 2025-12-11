// controllers/orderController.js - FIXED VERSION
const OrderService = require("../services/orderService");
const OrderDetailService = require("../services/OrderDetailService");
const ProductService = require("../services/productService");
const CartService = require("../services/CartService");
const UserService = require("../services/userService");
const EmailService = require("../services/emailService");
const Joi = require("joi");
const { createMomoPayment } = require("../services/orderService");

const orderSchema = Joi.object({
  payment_method: Joi.string().valid("cod", "bank", "momo").default("cod"),
  customer: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().allow("", null),
    address: Joi.string().required(),
  }).required(),
  ward: Joi.string().allow("", null),
  district: Joi.string().allow("", null),
  city: Joi.string().required(),
  note: Joi.string().allow("", null),
  items: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.string().required(),
        quantity: Joi.number().min(1).required(),
        price: Joi.number().required(),
        name: Joi.string().required(),
        img_url: Joi.string().allow("", null),
      })
    )
    .min(1)
    .required(),
  total: Joi.number().required(),
});

// ✅ HELPER: Tạo mã đơn hàng unique
const generateOrderCode = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `DH${timestamp}${random}`;
};

module.exports = {
  // ==================== PUBLIC: TẠO ĐƠN HÀNG (COD/BANK) ====================
  createOrder: async (req, res) => {
    try {
      const { error } = orderSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const userId = req.user?.id || null;
      const { customer, payment_method, items, total, ward, district, city, note } = req.body;

      // 1. KIỂM TRA VÀ TRỪ TỒN KHO (RESERVE)
      for (const item of items) {
        const product = await ProductService.getById(item.product_id);
        
        if (!product) {
          return res.status(404).json({ 
            message: `Sản phẩm "${item.name}" không tồn tại` 
          });
        }

        if (product.quantity < item.quantity) {
          return res.status(400).json({ 
            message: `Sản phẩm "${item.name}" chỉ còn ${product.quantity} sản phẩm` 
          });
        }

        // TRỪ TỒN KHO NGAY LẬP TỨC
        await ProductService.update(item.product_id, {
          quantity: product.quantity - item.quantity
        });
      }

      // 2. TẠO ĐỊA CHỈ ĐẦY ĐỦ
      const fullAddress = `${customer.address}${ward ? ', ' + ward : ''}${district ? ', ' + district : ''}, ${city}`;

      // 3. ✅ TẠO ORDER_CODE TRƯỚC KHI TẠO ĐƠN HÀNG
      const orderCode = generateOrderCode();

      // 4. TẠO ĐƠN HÀNG VỚI TRẠNG THÁI PENDING
      const order = await OrderService.create({
        order_code: orderCode, // ✅ THÊM DÒNG NÀY
        user_id: userId,
        payment_method,
        total,
        status: "Pending",
        customer: {
          ...customer,
          address: fullAddress,
        },
        note: note || "",
        // RESERVE STOCK: Giữ hàng trong 24h
        reservedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      // 5. TẠO CHI TIẾT ĐƠN HÀNG
      const detailDocs = items.map((item) => ({
        order_id: order._id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        img_url: item.img_url || "",
      }));

      await OrderDetailService.createMany(detailDocs);

      // 6. XÓA GIỎ HÀNG NẾU USER ĐĂNG NHẬP
      if (userId) {
        await CartService.clearCart(userId).catch(() => {});
      }

      // 7. GỬI EMAIL
      if (customer.email) {
        try {
          await EmailService.sendOrderConfirmation(order, detailDocs, {
            email: customer.email,
            name: customer.name,
          });
          await EmailService.sendOrderNotificationToAdmin(order, detailDocs, {
            name: customer.name,
          });
        } catch (e) {
          console.error("Email error:", e);
        }
      }

      res.status(201).json({
        message: "Đặt hàng thành công! Vui lòng chờ xác nhận từ shop.",
        order: {
          _id: order._id,
          order_code: order.order_code,
          code: order.order_code, // Thêm alias cho frontend
          tracking_token: order.tracking_token || "", // Nếu có
        },
        order_id: order._id,
        order_code: order.order_code,
        orderNumber: order.order_code,
        reservedUntil: order.reservedUntil
      });
    } catch (error) {
      console.error("Lỗi tạo đơn hàng:", error);
      res.status(500).json({ 
        message: error.message || "Lỗi tạo đơn hàng" 
      });
    }
  },

  // ==================== PUBLIC: TẠO ĐƠN MOMO ====================
  createMomoOrder: async (req, res) => {
    try {
      const { error } = orderSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const userId = req.user?.id || null;
      const { customer, items, total, ward, district, city, note } = req.body;

      // Kiểm tra và trừ tồn kho
      for (const item of items) {
        const product = await ProductService.getById(item.product_id);
        if (!product || product.quantity < item.quantity) {
          return res.status(400).json({ 
            message: `Sản phẩm "${item.name}" không đủ số lượng` 
          });
        }
        await ProductService.update(item.product_id, {
          quantity: product.quantity - item.quantity
        });
      }

      const fullAddress = `${customer.address}${ward ? ', ' + ward : ''}${district ? ', ' + district : ''}, ${city}`;

      // ✅ TẠO ORDER_CODE
      const orderCode = generateOrderCode();

      const order = await OrderService.create({
        order_code: orderCode, // ✅ THÊM DÒNG NÀY
        user_id: userId,
        payment_method: "momo",
        total,
        status: "Pending",
        customer: {
          ...customer,
          address: fullAddress,
        },
        note: note || "",
        reservedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      const detailDocs = items.map((item) => ({
        order_id: order._id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        img_url: item.img_url || "",
      }));

      await OrderDetailService.createMany(detailDocs);

      if (userId) await CartService.clearCart(userId).catch(() => {});

      const orderId = order._id.toString();
      const redirectUrl = process.env.MOMO_REDIRECT_URL || "http://localhost:5173/momo-callback";
      const ipnUrl = process.env.MOMO_IPN_URL || "http://localhost:5000/api/momo/webhook";

      const momoRes = await createMomoPayment(orderId, total, redirectUrl, ipnUrl);

      if (momoRes && momoRes.payUrl) {
        res.json({
          payUrl: momoRes.payUrl,
          orderId,
          order_code: order.order_code,
        });
      } else {
        await OrderService.delete(order._id);
        res.status(500).json({ message: "Không tạo được link MoMo" });
      }
    } catch (err) {
      console.error("Lỗi MoMo:", err);
      res.status(500).json({ message: "Lỗi tạo thanh toán MoMo" });
    }
  },

  // ==================== ADMIN: LẤY TẤT CẢ ĐƠN HÀNG ====================
  getAllOrdersAdmin: async (req, res) => {
    try {
      const { status, sort = "created_at", order = "desc" } = req.query;
      
      const filters = {};
      if (status && status !== 'all') {
        filters.status = status;
      }

      const sortObj = { [sort]: order === "asc" ? 1 : -1 };
      const orders = await OrderService.getAll(filters, sortObj);

      const ordersWithDetails = await Promise.all(
        orders.map(async (order) => {
          const items = await OrderDetailService.getByOrderId(order._id);
          return {
            _id: order._id,
            orderNumber: order.order_code,
            customer: order.customer,
            items: items.map(item => ({
              product: {
                _id: item.product_id,
                name: item.name,
                images: [item.img_url],
                sku: item.product_id.sku || "N/A"
              },
              quantity: item.quantity,
              price: item.price
            })),
            totalAmount: order.total,
            status: order.status,
            paymentMethod: order.payment_method,
            note: order.note,
            createdAt: order.created_at,
            updatedAt: order.updated_at,
            reservedUntil: order.reservedUntil
          };
        })
      );

      res.json(ordersWithDetails);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: error.message || "Lỗi khi lấy đơn hàng" });
    }
  },

  // ==================== ADMIN: XEM CHI TIẾT ĐƠN ====================
  getOrderByIdAdmin: async (req, res) => {
    try {
      const order = await OrderService.getById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      }

      const items = await OrderDetailService.getByOrderId(order._id);

      res.json({
        _id: order._id,
        orderNumber: order.order_code,
        customer: order.customer,
        items: items.map(item => ({
          product: {
            _id: item.product_id,
            name: item.name,
            images: [item.img_url],
            sku: item.product_id.sku || "N/A"
          },
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: order.total,
        status: order.status,
        paymentMethod: order.payment_method,
        note: order.note,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        reservedUntil: order.reservedUntil
      });
    } catch (error) {
      res.status(500).json({ message: error.message || "Lỗi khi lấy đơn hàng" });
    }
  },

  // ==================== ADMIN: CẬP NHẬT TRẠNG THÁI ====================
  updateOrderStatus: async (req, res) => {
    try {
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Vui lòng cung cấp trạng thái mới" });
      }

      const validStatuses = ["Pending", "Confirmed", "Shipping", "Completed", "Cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Trạng thái không hợp lệ" });
      }

      const order = await OrderService.getById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      }

      // Cập nhật trạng thái
      const updated = await OrderService.update(req.params.id, {
        status,
        updated_at: new Date()
      });

      // Gửi email thông báo (nếu có)
      if (order.customer.email) {
        try {
          await EmailService.sendOrderStatusUpdate(
            updated,
            { email: order.customer.email, name: order.customer.name },
            order.status,
            status
          );
        } catch (e) {
          console.error("Email error:", e);
        }
      }

      res.json({
        message: "Cập nhật trạng thái thành công",
        order: updated
      });
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).json({ message: error.message || "Lỗi cập nhật trạng thái" });
    }
  },

  // ==================== ADMIN: HỦY ĐƠN (HOÀN TỒN KHO) ====================
  cancelOrderAdmin: async (req, res) => {
    try {
      const order = await OrderService.getById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      }

      // Chỉ cho phép hủy đơn Pending hoặc Confirmed
      if (!["Pending", "Confirmed"].includes(order.status)) {
        return res.status(400).json({ 
          message: "Chỉ được hủy đơn hàng đang chờ xác nhận hoặc đã xác nhận" 
        });
      }

      // HOÀN LẠI TỒN KHO
      const items = await OrderDetailService.getByOrderId(order._id);
      for (const item of items) {
        try {
          const product = await ProductService.getById(item.product_id);
          if (product) {
            await ProductService.update(item.product_id, {
              quantity: product.quantity + item.quantity
            });
            console.log(`✅ Hoàn ${item.quantity} sản phẩm ${item.name}`);
          }
        } catch (e) {
          console.error(`❌ Lỗi hoàn tồn kho cho ${item.name}:`, e);
        }
      }

      // Cập nhật trạng thái đơn hàng
      const updated = await OrderService.update(req.params.id, {
        status: "Cancelled",
        updated_at: new Date()
      });

      res.json({
        message: "Đã hủy đơn hàng và hoàn tồn kho thành công",
        order: updated
      });
    } catch (error) {
      console.error("Error cancelling order:", error);
      res.status(500).json({ message: error.message || "Lỗi hủy đơn hàng" });
    }
  },

  // ==================== ADMIN: XÓA ĐƠN HÀNG ====================
  deleteOrder: async (req, res) => {
    try {
      const order = await OrderService.getById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      }

      // Xóa chi tiết đơn hàng
      await OrderDetailService.deleteByOrderId(order._id);
      
      // Xóa đơn hàng
      await OrderService.delete(req.params.id);

      res.json({ message: "Đã xóa đơn hàng" });
    } catch (error) {
      res.status(500).json({ message: error.message || "Lỗi khi xóa đơn hàng" });
    }
  },

  // ==================== ADMIN: THỐNG KÊ ====================
  getOrderStats: async (req, res) => {
    try {
      const pending = await OrderService.count({ status: "Pending" });
      const confirmed = await OrderService.count({ status: "Confirmed" });
      const shipping = await OrderService.count({ status: "Shipping" });
      const completed = await OrderService.count({ status: "Completed" });
      const cancelled = await OrderService.count({ status: "Cancelled" });

      res.json({
        pending,
        confirmed,
        shipping,
        completed,
        cancelled,
        total: pending + confirmed + shipping + completed + cancelled
      });
    } catch (error) {
      res.status(500).json({ message: error.message || "Lỗi lấy thống kê" });
    }
  },

  // ==================== USER: XEM ĐƠN HÀNG CỦA MÌNH ====================
  getUserOrders: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Vui lòng đăng nhập" });
      }

      const filters = { user_id: req.user.id };
      const orders = await OrderService.getAll(filters, { created_at: -1 });

      const ordersWithDetails = await Promise.all(
        orders.map(async (order) => {
          const items = await OrderDetailService.getByOrderId(order._id);
          return {
            _id: order._id,
            orderNumber: order.order_code,
            customer: order.customer,
            items,
            totalAmount: order.total,
            status: order.status,
            paymentMethod: order.payment_method,
            createdAt: order.created_at
          };
        })
      );

      res.json(ordersWithDetails);
    } catch (error) {
      res.status(500).json({ message: error.message || "Lỗi lấy đơn hàng" });
    }
  },

  // ==================== USER: XEM CHI TIẾT ĐƠN CỦA MÌNH ====================
  getUserOrderById: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Vui lòng đăng nhập" });
      }

      const order = await OrderService.getById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      }

      // Kiểm tra quyền sở hữu
      if (order.user_id.toString() !== req.user.id) {
        return res.status(403).json({ message: "Bạn không có quyền xem đơn hàng này" });
      }

      const items = await OrderDetailService.getByOrderId(order._id);

      res.json({
        _id: order._id,
        orderNumber: order.order_code,
        customer: order.customer,
        items,
        totalAmount: order.total,
        status: order.status,
        paymentMethod: order.payment_method,
        note: order.note,
        createdAt: order.created_at
      });
    } catch (error) {
      res.status(500).json({ message: error.message || "Lỗi lấy đơn hàng" });
    }
  },

  // ==================== USER: HỦY ĐƠN CỦA MÌNH ====================
  cancelUserOrder: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Vui lòng đăng nhập" });
      }

      const order = await OrderService.getById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      }

      // Kiểm tra quyền sở hữu
      if (order.user_id.toString() !== req.user.id) {
        return res.status(403).json({ message: "Bạn không có quyền hủy đơn hàng này" });
      }

      // Chỉ cho phép hủy đơn Pending
      if (order.status !== "Pending") {
        return res.status(400).json({ 
          message: "Chỉ được hủy đơn hàng đang chờ xác nhận" 
        });
      }

      // Hoàn lại tồn kho
      const items = await OrderDetailService.getByOrderId(order._id);
      for (const item of items) {
        const product = await ProductService.getById(item.product_id);
        if (product) {
          await ProductService.update(item.product_id, {
            quantity: product.quantity + item.quantity
          });
        }
      }

      const updated = await OrderService.update(req.params.id, {
        status: "Cancelled",
        updated_at: new Date()
      });

      res.json({
        message: "Đã hủy đơn hàng thành công",
        order: updated
      });
    } catch (error) {
      res.status(500).json({ message: error.message || "Lỗi hủy đơn hàng" });
    }
  },

  // ==================== PUBLIC: TRA CỨU ĐƠN HÀNG ====================
  trackPublicByOrderNumber: async (req, res) => {
    try {
      const { orderNumber } = req.params;
      const { phone } = req.query;

      if (!orderNumber || !phone) {
        return res.status(400).json({ 
          message: "Vui lòng cung cấp mã đơn hàng và số điện thoại" 
        });
      }

      const orders = await OrderService.getAll({
        order_code: orderNumber.toUpperCase().trim(),
      });

      if (!orders || orders.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      }

      const order = orders[0];

      // Kiểm tra số điện thoại
      const cleanPhone = phone.replace(/\D/g, '');
      const orderPhone = order.customer.phone.replace(/\D/g, '');
      
      if (cleanPhone !== orderPhone) {
        return res.status(403).json({ 
          message: "Số điện thoại không khớp với đơn hàng" 
        });
      }

      const items = await OrderDetailService.getByOrderId(order._id);

      const getStatusText = (status) => {
        const map = {
          Pending: "Chờ xác nhận",
          Confirmed: "Đã xác nhận",
          Shipping: "Đang giao hàng",
          Completed: "Hoàn thành",
          Cancelled: "Đã hủy",
        };
        return map[status] || "Đang xử lý";
      };

      res.json({
        orderId: order.order_code,
        status: getStatusText(order.status),
        statusKey: order.status,
        customerName: order.customer.name,
        phone: order.customer.phone,
        address: order.customer.address,
        orderDate: new Date(order.created_at).toLocaleString("vi-VN"),
        totalAmount: order.total.toLocaleString("vi-VN") + " ₫",
        paymentMethod: order.payment_method === "cod" ? "COD" : "Chuyển khoản",
        items: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price.toLocaleString("vi-VN") + " ₫",
          img_url: item.img_url || "",
        })),
      });
    } catch (error) {
      console.error("Error tracking order:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  // ==================== MOMO WEBHOOK ====================
  momoWebhook: async (req, res) => {
    try {
      console.log("📞 MoMo webhook received:", req.body);

      const { orderId, resultCode } = req.body;

      if (resultCode === 0) {
        const updatedOrder = await OrderService.update(orderId, {
          status: "Confirmed",
          updated_at: new Date(),
        });

        if (updatedOrder && updatedOrder.user_id) {
          await CartService.clearCart(updatedOrder.user_id).catch(() => {});
        }

        console.log("✅ MoMo payment successful for order:", orderId);
      } else {
        console.log("❌ MoMo payment failed for order:", orderId);
      }

      res.status(200).send("OK");
    } catch (err) {
      console.error("❌ Webhook error:", err);
      res.status(500).send("Webhook error");
    }
  },
};