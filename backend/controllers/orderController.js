// controllers/orderController.js - FIXED VERSION
const OrderService = require("../services/orderService");
const OrderDetailService = require("../services/OrderDetailService");
const ProductService = require("../services/productService");
const CartService = require("../services/CartService");
const UserService = require("../services/userService");
const EmailService = require("../services/emailService");
const Joi = require("joi");
const { createMomoPayment } = require("../services/orderService");

// ==================== VALIDATION SCHEMA ====================
const orderSchema = Joi.object({
  payment_method: Joi.string().valid("cod", "bank", "momo").default("cod"),
  customer: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().allow("", null),
    address: Joi.string().required(),
  }).required(),
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
        selectedAttributes: Joi.object()
          .pattern(Joi.string(), Joi.string())
          .optional(),
      })
    )
    .min(1)
    .required(),
  total: Joi.number().required(),
});

// ✅ HELPER: Generate unique order code
const generateOrderCode = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `DH${timestamp}${random}`;
};

// ==================== HELPER FUNCTIONS ====================

// ✅ Helper: Get text by language (existing)
function getTextByLang(field, lang = "vi") {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (typeof field === "object") {
    return field[lang] || field.vi || field.en || "";
  }
  return "";
}

// ✅ NEW: Convert attributes to multilingual format when creating order
function convertAttributesToMultilingual(selectedAttributes, product) {
  if (!selectedAttributes || !product || !Array.isArray(product.attributes)) {
    console.warn("⚠️ Invalid input for convertAttributesToMultilingual");
    return {};
  }

  const result = {};

  for (const [key, value] of Object.entries(selectedAttributes)) {
    // Tìm attribute definition trong product
    const attribute = product.attributes.find((attr) => {
      if (!attr || !attr.name) return false;

      // Hỗ trợ tìm theo cả vi và zh
      if (typeof attr.name === "string") {
        return attr.name === key;
      } else if (typeof attr.name === "object") {
        return attr.name.vi === key || attr.name.zh === key;
      }
      return false;
    });

    if (!attribute) {
      console.warn(`⚠️ Attribute "${key}" not found in product`);
      // Fallback: giữ nguyên key và value
      result[key] = { vi: value, zh: value };
      continue;
    }

    // Lấy key tiếng Việt
    const viKey =
      typeof attribute.name === "object" ? attribute.name.vi : attribute.name;

    // Tìm option để lấy label multilingual
    const option = attribute.options?.find((opt) => opt.value === value);

    if (option && option.label) {
      // ✅ Lưu cả vi + zh
      if (typeof option.label === "object") {
        result[viKey] = {
          vi: option.label.vi || value,
          zh: option.label.zh || value,
        };
      } else {
        // Legacy: label là string
        result[viKey] = {
          vi: String(option.label),
          zh: value,
        };
      }
    } else {
      // Không tìm thấy option → fallback
      console.warn(
        `⚠️ Option not found for value "${value}" in attribute "${viKey}"`
      );
      result[viKey] = { vi: value, zh: value };
    }
  }

  return result;
}

// ✅ NEW: Extract product name as multilingual object
function getProductNameMultilingual(product, itemName) {
  // Ưu tiên: product.name > item.name > fallback

  // 1. Thử từ product
  if (product && product.name) {
    if (typeof product.name === "object") {
      return {
        vi: product.name.vi || "",
        zh: product.name.zh || "",
      };
    } else {
      // product.name là string (legacy)
      return {
        vi: String(product.name),
        zh: "",
      };
    }
  }

  // 2. Fallback từ itemName
  if (itemName) {
    if (typeof itemName === "object") {
      return {
        vi: itemName.vi || "",
        zh: itemName.zh || "",
      };
    } else {
      return {
        vi: String(itemName),
        zh: "",
      };
    }
  }

  // 3. Fallback cuối cùng
  return { vi: "N/A", zh: "N/A" };
}

// ✅ EXISTING: SAFE ATTRIBUTE CONVERSION for display (keep for backward compatibility)
function convertAttributesToStrings(selectedAttributes, product, lang = "vi") {
  if (!selectedAttributes) return {};

  const result = {};

  // Convert Map hoặc Object thành plain object
  const attrs =
    selectedAttributes instanceof Map
      ? Object.fromEntries(selectedAttributes)
      : selectedAttributes;

  for (const [key, value] of Object.entries(attrs)) {
    // ✅ Nếu value là object multilingual → lấy theo language
    if (typeof value === "object" && value !== null) {
      result[key] = value[lang] || value.vi || value.zh || String(value);
    } else {
      // Legacy: value là string
      let valueStr = String(value || "");

      // Tìm label trong product (nếu có)
      if (product && Array.isArray(product.attributes)) {
        const attribute = product.attributes.find((attr) => {
          if (!attr || !attr.name) return false;
          const attrName = getTextByLang(attr.name, lang);
          return attrName === key;
        });

        if (attribute && Array.isArray(attribute.options)) {
          const option = attribute.options.find(
            (opt) => opt && opt.value === valueStr
          );

          if (option && option.label) {
            valueStr = getTextByLang(option.label, lang);
          }
        }
      }

      result[key] = valueStr;
    }
  }

  return result;
}

module.exports = {
  // ==================== PUBLIC: TẠO ĐƠN HÀNG (COD/BANK) ====================
  createOrder: async (req, res) => {
    try {
      const { error } = orderSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const userId = req.user?.id || null;
      const { customer, payment_method, items, total, city, note } = req.body;

      // 1. KIỂM TRA VÀ TRỪ TỒN KHO (RESERVE)
      for (const item of items) {
        const product = await ProductService.getById(item.product_id);

        if (!product) {
          return res.status(404).json({
            message: `Sản phẩm "${item.name}" không tồn tại`,
          });
        }

        if (product.quantity < item.quantity) {
          return res.status(400).json({
            message: `Sản phẩm "${item.name}" chỉ còn ${product.quantity} sản phẩm`,
          });
        }

        // TRỪ TỒN KHO NGAY LẬP TỨC
        await ProductService.update(item.product_id, {
          quantity: product.quantity - item.quantity,
        });
      }

      // 2. ✅ Tạo ĐỊA CHỈ ĐƠN GIẢN - CHỈ address + city
      const fullAddress = `${customer.address}, ${city}`.trim();

      // 3. ✅ Tạo ORDER_CODE TRƯỚC KHI TẠO ĐƠN HÀNG
      const orderCode = generateOrderCode();

      // 4. Tạo ĐƠN HÀNG Với TRẠNG THÁI PENDING
      const order = await OrderService.create({
        order_code: orderCode,
        user_id: userId,
        payment_method,
        total,
        status: "Pending",
        customer: {
          ...customer,
          address: fullAddress,
        },
        note: note || "",
        reservedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      // 5. ✅ TẠO CHI TIẾT ĐƠN HÀNG - LƯU MULTILINGUAL FORMAT
      console.log("\n📦 Creating order details with multilingual support...");

      const detailDocs = await Promise.all(
        items.map(async (item) => {
          const product = await ProductService.getById(item.product_id);

          // ✅ A. LẤY TÊN SẢN PHẨM MULTILINGUAL
          const productName = getProductNameMultilingual(product, item.name);
          console.log(`  📝 Product name:`, productName);

          // ✅ B. CONVERT ATTRIBUTES → MULTILINGUAL OBJECT
          let multilingualAttributes = {};

          if (
            item.selectedAttributes &&
            Object.keys(item.selectedAttributes).length > 0
          ) {
            if (product && Array.isArray(product.attributes)) {
              multilingualAttributes = convertAttributesToMultilingual(
                item.selectedAttributes,
                product
              );
              console.log(
                `  🎨 Attributes (multilingual):`,
                multilingualAttributes
              );
            } else {
              console.warn(`  ⚠️ Product has no attributes, using fallback`);
              // Fallback: convert value thành object
              for (const [key, value] of Object.entries(
                item.selectedAttributes
              )) {
                multilingualAttributes[key] = { vi: value, zh: value };
              }
            }
          }

          // ✅ C. RETURN DOCUMENT VỚI FORMAT MỚI
          return {
            order_id: order._id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            name: productName, // ✅ { vi: "Bàn gỗ", zh: "木桌" }
            img_url: item.img_url || "",
            selectedAttributes: multilingualAttributes, // ✅ { "Màu sắc": {vi, zh}, ... }
          };
        })
      );

      await OrderDetailService.createMany(detailDocs);
      console.log("✅ Order details saved successfully\n");

      // 6. XÓA GIỎ HÀNG NẾU USER ĐĂNG NHẬP
      if (userId) {
        await CartService.clearCart(userId).catch(() => {});
      }

      // 7. Gửi EMAIL
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
          code: order.order_code,
          tracking_token: order.tracking_token || "",
        },
        order_id: order._id,
        order_code: order.order_code,
        orderNumber: order.order_code,
        reservedUntil: order.reservedUntil,
      });
    } catch (error) {
      console.error("Lỗi tạo đơn hàng:", error);
      res.status(500).json({
        message: error.message || "Lỗi tạo đơn hàng",
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
      const { customer, items, total, city, note } = req.body;

      // Kiểm tra và trừ tồn kho
      for (const item of items) {
        const product = await ProductService.getById(item.product_id);
        if (!product || product.quantity < item.quantity) {
          return res.status(400).json({
            message: `Sản phẩm "${item.name}" không đủ số lượng`,
          });
        }
        await ProductService.update(item.product_id, {
          quantity: product.quantity - item.quantity,
        });
      }

      // ✅ TẠO ĐỊA CHỈ ĐƠN GIẢN - CHỈ address + city
      const fullAddress = `${customer.address}, ${city}`.trim();

      // ✅ TẠO ORDER_CODE
      const orderCode = generateOrderCode();

      const order = await OrderService.create({
        order_code: orderCode,
        user_id: userId,
        payment_method: "momo",
        total,
        status: "Pending",
        customer: {
          ...customer,
          address: fullAddress,
        },
        note: note || "",
        reservedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
      const redirectUrl =
        process.env.MOMO_REDIRECT_URL || "http://localhost:5173/momo-callback";
      const ipnUrl =
        process.env.MOMO_IPN_URL || "http://localhost:5000/api/momo/webhook";

      const momoRes = await createMomoPayment(
        orderId,
        total,
        redirectUrl,
        ipnUrl
      );

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

  // ==================== ADMIN: LẤY TẤT CẢ ĐỠN HÀNG (TIẾNG VIỆT) ====================
  getAllOrdersAdmin: async (req, res) => {
    try {
      const { status, sort = "created_at", order = "desc" } = req.query;

      const filters = {};
      if (status && status !== "all") {
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
            items: await Promise.all(
              items.map(async (item) => {
                // ✅ FIX: HANDLE MISSING PRODUCT
                let product = null;
                try {
                  product = await ProductService.getById(item.product_id);
                } catch (e) {
                  console.warn(
                    `⚠️ Product ${item.product_id} not found:`,
                    e.message
                  );
                }

                // ✅ LẤY TÊN TIẾNG VIỆT AN TOÀN
                let productNameVi = "Sản phẩm đã xóa"; // ← Default for deleted products

                if (typeof item.name === "object") {
                  productNameVi =
                    item.name.vi || item.name.zh || "Sản phẩm đã xóa";
                } else if (typeof item.name === "string") {
                  productNameVi = item.name;
                } else if (product && product.name) {
                  productNameVi = getTextByLang(product.name, "vi");
                }

                // ✅ CONVERT ATTRIBUTES → STRING (TIẾNG VIỆT) - Handle null product
                const displayAttributes = product
                  ? convertAttributesToStrings(
                      item.selectedAttributes,
                      product,
                      "vi"
                    )
                  : convertAttributesToStrings(
                      item.selectedAttributes,
                      null,
                      "vi"
                    );

                return {
                  product: {
                    _id: item.product_id,
                    name: productNameVi,
                    images: product?.images?.[0]
                      ? [product.images[0]]
                      : [item.img_url || ""], // ← Use stored img_url
                    sku: product?.sku || "N/A",
                    attributes: product?.attributes || [],
                  },
                  quantity: item.quantity,
                  price: item.price,
                  selectedAttributes: displayAttributes,
                };
              })
            ),
            totalAmount: order.total,
            status: order.status,
            paymentMethod: order.payment_method,
            note: order.note,
            createdAt: order.created_at,
            updatedAt: order.updated_at,
            reservedUntil: order.reservedUntil,
          };
        })
      );

      res.json(ordersWithDetails);
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
      res
        .status(500)
        .json({ message: error.message || "Lỗi khi lấy đơn hàng" });
    }
  },

  // ==================== ADMIN: LẤY CHI TIẾT ĐƠN HÀNG ====================
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
        items: await Promise.all(
          items.map(async (item) => {
            // ✅ HANDLE MISSING PRODUCT
            let product = null;
            try {
              product = await ProductService.getById(item.product_id);
            } catch (e) {
              console.warn(`⚠️ Product ${item.product_id} not found`);
            }

            // ✅ LẤY TÊN TIẾNG VIỆT
            let productNameVi = "Sản phẩm đã xóa";

            if (typeof item.name === "object") {
              productNameVi = item.name.vi || item.name.zh || "Sản phẩm đã xóa";
            } else if (typeof item.name === "string") {
              productNameVi = item.name;
            } else if (product && product.name) {
              productNameVi = getTextByLang(product.name, "vi");
            }

            // ✅ CONVERT ATTRIBUTES → STRING
            const displayAttributes = product
              ? convertAttributesToStrings(
                  item.selectedAttributes,
                  product,
                  "vi"
                )
              : convertAttributesToStrings(item.selectedAttributes, null, "vi");

            return {
              product: {
                _id: item.product_id,
                name: productNameVi,
                images: product?.images?.[0]
                  ? [product.images[0]]
                  : [item.img_url || ""],
                sku: product?.sku || "N/A",
              },
              quantity: item.quantity,
              price: item.price,
              selectedAttributes: displayAttributes,
            };
          })
        ),
        totalAmount: order.total,
        status: order.status,
        paymentMethod: order.payment_method,
        note: order.note,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        reservedUntil: order.reservedUntil,
      });
    } catch (error) {
      console.error("❌ Error:", error);
      res
        .status(500)
        .json({ message: error.message || "Lỗi khi lấy đơn hàng" });
    }
  },

  // ==================== ADMIN: CẬP NHẬT TRẠNG THÁI ====================
  updateOrderStatus: async (req, res) => {
    try {
      const { status } = req.body;

      if (!status) {
        return res
          .status(400)
          .json({ message: "Vui lòng cung cấp trạng thái mới" });
      }

      const validStatuses = [
        "Pending",
        "Confirmed",
        "Shipping",
        "Completed",
        "Cancelled",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Trạng thái không hợp lệ" });
      }

      const order = await OrderService.getById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      }

      // ✅ THÊM: CẬP NHẬT SOLD KHI CHUYỂN SANG CONFIRMED
      if (status === "Confirmed" && order.status === "Pending") {
        const items = await OrderDetailService.getByOrderId(order._id);

        for (const item of items) {
          try {
            const product = await ProductService.getById(item.product_id);
            if (product) {
              await ProductService.update(item.product_id, {
                sold: (product.sold || 0) + item.quantity,
              });
              console.log(
                `✅ Cập nhật sold +${item.quantity} cho ${item.name}`
              );
            }
          } catch (e) {
            console.error(`❌ Lỗi cập nhật sold:`, e);
          }
        }
      }

      // ✅ THÊM: TRỪ SOLD KHI HỦY ĐƠN ĐÃ CONFIRMED
      if (
        status === "Cancelled" &&
        ["Confirmed", "Shipping"].includes(order.status)
      ) {
        const items = await OrderDetailService.getByOrderId(order._id);

        for (const item of items) {
          try {
            const product = await ProductService.getById(item.product_id);
            if (product) {
              await ProductService.update(item.product_id, {
                sold: Math.max(0, (product.sold || 0) - item.quantity), // Không cho âm
              });
              console.log(`✅ Hoàn sold -${item.quantity} cho ${item.name}`);
            }
          } catch (e) {
            console.error(`❌ Lỗi hoàn sold:`, e);
          }
        }
      }

      // Cập nhật trạng thái
      const updated = await OrderService.update(req.params.id, {
        status,
        updated_at: new Date(),
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
        order: updated,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      res
        .status(500)
        .json({ message: error.message || "Lỗi cập nhật trạng thái" });
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
          message: "Chỉ được hủy đơn hàng đang chờ xác nhận hoặc đã xác nhận",
        });
      }

      // HOÀN LẠI TỒN KHO
      const items = await OrderDetailService.getByOrderId(order._id);
      for (const item of items) {
        try {
          const product = await ProductService.getById(item.product_id);
          if (product) {
            await ProductService.update(item.product_id, {
              quantity: product.quantity + item.quantity,
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
        updated_at: new Date(),
      });

      res.json({
        message: "Đã hủy đơn hàng và hoàn tồn kho thành công",
        order: updated,
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
      res
        .status(500)
        .json({ message: error.message || "Lỗi khi xóa đơn hàng" });
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
        total: pending + confirmed + shipping + completed + cancelled,
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
            createdAt: order.created_at,
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
        return res
          .status(403)
          .json({ message: "Bạn không có quyền xem đơn hàng này" });
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
        createdAt: order.created_at,
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
        return res
          .status(403)
          .json({ message: "Bạn không có quyền hủy đơn hàng này" });
      }

      // Chỉ cho phép hủy đơn Pending
      if (order.status !== "Pending") {
        return res.status(400).json({
          message: "Chỉ được hủy đơn hàng đang chờ xác nhận",
        });
      }

      // Hoàn lại tồn kho
      const items = await OrderDetailService.getByOrderId(order._id);
      for (const item of items) {
        const product = await ProductService.getById(item.product_id);
        if (product) {
          await ProductService.update(item.product_id, {
            quantity: product.quantity + item.quantity,
          });
        }
      }

      const updated = await OrderService.update(req.params.id, {
        status: "Cancelled",
        updated_at: new Date(),
      });

      res.json({
        message: "Đã hủy đơn hàng thành công",
        order: updated,
      });
    } catch (error) {
      res.status(500).json({ message: error.message || "Lỗi hủy đơn hàng" });
    }
  },

  // ==================== PUBLIC: TRA CỨU ĐƠN HÀNG - MULTILINGUAL ====================
  trackPublicByOrderNumber: async (req, res) => {
    try {
      const { orderNumber } = req.params;
      const lang = req.query.lang || "vi";

      console.log(`🔍 Tracking order: ${orderNumber} in ${lang}`);

      if (!orderNumber) {
        return res.status(400).json({
          message: "Vui lòng cung cấp mã đơn hàng",
        });
      }

      const orders = await OrderService.getAll({
        order_code: orderNumber.toUpperCase().trim(),
      });

      if (!orders || orders.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      }

      const order = orders[0];
      const items = await OrderDetailService.getByOrderId(order._id);

      // ✅ Helper: Get status text
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
        paymentMethod:
          order.payment_method === "cod"
            ? "COD"
            : order.payment_method === "momo"
            ? "MoMo"
            : "Chuyển khoản",
        items: await Promise.all(
          items.map(async (item) => {
            // ✅ A. LẤY TÊN SẢN PHẨM THEO NGÔN NGỮ
            const itemName =
              typeof item.name === "object"
                ? item.name[lang] || item.name.vi || "N/A"
                : String(item.name);

            // ✅ B. LẤY PRODUCT ĐỂ TÌM ATTRIBUTE DEFINITIONS
            const product = await ProductService.getById(item.product_id);

            // ✅ C. DỊCH ATTRIBUTES - CẢ KEY VÀ VALUE
            const translatedAttributes = {};

            if (item.selectedAttributes) {
              // Convert Map → Object nếu cần
              const attrs =
                item.selectedAttributes instanceof Map
                  ? Object.fromEntries(item.selectedAttributes)
                  : item.selectedAttributes;

              for (const [viKey, value] of Object.entries(attrs)) {
                // ✅ BƯỚC 1: TÌM ATTRIBUTE DEFINITION → LẤY KEY THEO NGÔN NGỮ
                let translatedKey = viKey; // Default: giữ nguyên key

                if (product && Array.isArray(product.attributes)) {
                  const attribute = product.attributes.find((attr) => {
                    if (!attr || !attr.name) return false;

                    // Tìm attribute theo viKey
                    if (typeof attr.name === "object") {
                      return attr.name.vi === viKey;
                    } else {
                      return attr.name === viKey;
                    }
                  });

                  // Nếu tìm thấy → lấy tên attribute theo ngôn ngữ
                  if (attribute && attribute.name) {
                    translatedKey =
                      typeof attribute.name === "object"
                        ? attribute.name[lang] || attribute.name.vi || viKey
                        : attribute.name;
                  }
                }

                // ✅ BƯỚC 2: LẤY VALUE THEO NGÔN NGỮ
                let translatedValue = viKey; // Default

                if (typeof value === "object" && value !== null) {
                  // NEW FORMAT: {vi: "Đỏ", zh: "红色"}
                  translatedValue = value[lang] || value.vi || String(value);
                } else {
                  // LEGACY FORMAT: string
                  translatedValue = String(value);
                }

                // ✅ LƯU: KEY (đã dịch) → VALUE (đã dịch)
                translatedAttributes[translatedKey] = translatedValue;
              }
            }

            console.log(`  📦 Item (${lang}): ${itemName}`);
            console.log(`     Attributes:`, translatedAttributes);

            return {
              name: itemName,
              quantity: item.quantity || 0,
              price: (item.price || 0).toLocaleString("vi-VN") + " ₫",
              img_url: item.img_url || "",
              selectedAttributes: translatedAttributes, // ✅ CẢ KEY VÀ VALUE ĐÃ DỊCH
            };
          })
        ),
      });
    } catch (error) {
      console.error("❌ Error tracking order:", error);
      res.status(500).json({ message: "Lỗi server: " + error.message });
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
