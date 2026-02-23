// src/contexts/CartContext.tsx - FIXED WITH LANGUAGE SUPPORT
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import {
  fetchCart,
  addToCartAPI,
  updateCartItemAPI,
  removeCartItemAPI,
  clearCartAPI,
} from "@/api/user/cartAPI";
import { toast } from "react-toastify";
import { useLanguage } from "@/context/LanguageContext";
import axiosInstance from "../axios";

type Product = {
  _id: string;
  name: any; // ✅ Đổi thành any để support cả string và object multilingual
  price: number;
  priceSale?: number;
  images?: string[];
  image?: string;
  img_url?: string;
  size?: string;
  selectedAttributes?: Record<string, string>;
};

type CartItem = {
  product: Product;
  quantity: number;
  selectedAttributes?: Record<string, string>;
};

type CartShape = {
  items: CartItem[];
  totalQuantity: number;
};

type CartContextType = {
  cart: CartShape;
  cartItems: CartItem[];
  totalQuantity: number;
  loadCart: () => Promise<void>;
  reloadCart: () => Promise<void>;
  addToCart: (product: Product, quantity?: number, selectedAttributes?: Record<string, string>) => Promise<boolean>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  openCart?: () => void;
};

const defaultCart: CartShape = { items: [], totalQuantity: 0 };

const CartContext = createContext<CartContextType>({
  cart: defaultCart,
  cartItems: [],
  totalQuantity: 0,
  loadCart: async () => {},
  reloadCart: async () => {},
  addToCart: async () => false,
  updateItem: async () => {},
  removeItem: async () => {},
  clearCart: async () => {},
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { language } = useLanguage();
  const [cart, setCart] = useState<CartShape>(defaultCart);
  const lastToastTime = useRef<number>(0);

  // ✅ Helper: chuẩn hóa product object (GIỮ NGUYÊN MULTILINGUAL NAME)
  const normalizeProduct = (prod: any): Product => {
    console.log("📄 Normalizing product:", prod._id, "name:", prod.name);

    return {
      _id: prod._id || prod.productId,
      name: prod.name || "Sản phẩm không tên", // ✅ Giữ nguyên object/string
      price: prod.priceSale ?? prod.price ?? 0,
      images: Array.isArray(prod.images)
        ? prod.images
        : prod.image
        ? [prod.image]
        : prod.img_url
        ? [prod.img_url]
        : [],
      size: prod.size,
      selectedAttributes: prod.selectedAttributes || {},
    };
  };

  // ✅ Tạo key duy nhất cho mỗi item = productId + attributes
  // Cùng sản phẩm nhưng khác thuộc tính → key khác → nằm riêng
  const makeCartKey = (productId: string, attrs: Record<string, string> = {}) => {
    const sortedAttrs = Object.keys(attrs).sort().map(k => `${k}:${attrs[k]}`).join("|");
    return `${productId}__${sortedAttrs}`;
  };

  const showSuccessToast = (message: string) => {
    const now = Date.now();
    if (now - lastToastTime.current > 1000) {
      toast.success(message);
      lastToastTime.current = now;
    }
  };

  // ✅ Load cart từ server hoặc localStorage
  const loadCart = useCallback(async () => {
    const token = localStorage.getItem("token");

    let serverCart = null;
    if (token) {
      try {
        serverCart = await fetchCart();
      } catch (err) {
        console.warn("Không lấy được giỏ hàng từ server", err);
      }
    }

    // ƯU TIÊN: Nếu server có dữ liệu → dùng server
    if (serverCart && serverCart.items && serverCart.items.length > 0) {
      const normalized = {
        items: serverCart.items.map((item: any) => ({
          product: normalizeProduct(item.product || item),
          quantity: item.quantity || 1,
          selectedAttributes: item.selectedAttributes || {},
        })),
        totalQuantity:
          serverCart.totalQuantity ||
          serverCart.items.reduce(
            (s: number, i: any) => s + (i.quantity || 1),
            0
          ),
      };
      setCart(normalized);
      localStorage.removeItem("cart_local");
      return;
    }

    // Nếu server rỗng hoặc không có token → dùng local
    try {
      const raw = localStorage.getItem("cart_local");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.items && parsed.items.length > 0) {
          const normalizedItems = parsed.items.map((item: any) => ({
            product: normalizeProduct(item.product || item),
            quantity: item.quantity || 1,
            selectedAttributes: item.selectedAttributes || {},
          }));
          const totalQty = normalizedItems.reduce(
            (s: number, i: any) => s + i.quantity,
            0
          );
          setCart({ items: normalizedItems, totalQuantity: totalQty });
          return;
        }
      }
    } catch (e) {
      console.error("Lỗi parse local cart", e);
    }

    setCart(defaultCart);
  }, []);

  // ✅ FETCH LẠI PRODUCT INFO KHI ĐỔI NGÔN NGỮ
  useEffect(() => {
    console.log("🔄 Language changed to:", language, "- Refetching products...");

    const refetchProducts = async () => {
      if (cart.items.length === 0) {
        console.log("⚠️ Cart is empty, skipping refetch");
        return;
      }

      try {
        const updatedItems = await Promise.all(
          cart.items.map(async (item) => {
            try {
              // ✅ Fetch product với language param
              const res = await axiosInstance.get(
                `/products/${item.product._id}?lang=${language}`
              );

              console.log(`✅ Refetched product ${item.product._id}:`, res.data.name);
              console.log(`   Type of name:`, typeof res.data.name);

              // ✅ REBUILD product object hoàn toàn, không spread cũ
              return {
                ...item,
                product: {
                  _id: item.product._id,
                  name: res.data.name, // ✅ Lấy trực tiếp từ API
                  price: item.product.price,
                  priceSale: item.product.priceSale,
                  images: item.product.images,
                  image: item.product.image,
                  img_url: item.product.img_url,
                  size: item.product.size,
                  selectedAttributes: item.product.selectedAttributes,
                },
              };
            } catch (error) {
              console.error(`❌ Error fetching product ${item.product._id}:`, error);
              return item; // Giữ nguyên nếu lỗi
            }
          })
        );

        console.log("🎯 Setting cart with updated items:", updatedItems.map(i => i.product.name));

        setCart((prev) => ({
          ...prev,
          items: updatedItems,
        }));

        // ✅ LƯU VÀO LOCALSTORAGE NGAY SAU KHI UPDATE (KHÔNG GỌI normalizeProduct)
        try {
          localStorage.setItem("cart_local", JSON.stringify({
            items: updatedItems,
            totalQuantity: updatedItems.reduce((s, i) => s + i.quantity, 0),
          }));
          console.log("💾 Saved updated cart to localStorage");
        } catch (e) {
          console.warn("Không lưu được localStorage", e);
        }

        console.log("✅ Cart updated successfully");
      } catch (error) {
        console.error("❌ Error refetching products:", error);
      }
    };

    refetchProducts();
  }, [language]); // ✅ Chỉ phụ thuộc vào language

  const reloadCart = useCallback(async () => {
    await loadCart();
  }, [loadCart]);

  const persistLocalCart = (newCart: CartShape) => {
    try {
      localStorage.setItem("cart_local", JSON.stringify(newCart));
    } catch (e) {
      console.warn("Không lưu được local cart", e);
    }
  };

  const addToCart = useCallback(
    async (product: Product, quantity = 1, selectedAttributes?: Record<string, string>): Promise<boolean> => {
      const normalizedProduct = normalizeProduct(product);
      const token = localStorage.getItem("token");

      // Ưu tiên selectedAttributes truyền vào, nếu không thì lấy từ product object
      const attrs = selectedAttributes || product.selectedAttributes || {};
      const newKey = makeCartKey(normalizedProduct._id, attrs);

      console.log("➕ Adding to cart:", normalizedProduct._id, "key:", newKey, "attrs:", attrs);

      if (token) {
        try {
          const res = await addToCartAPI(normalizedProduct._id, quantity);
          await loadCart();
          showSuccessToast("Đã thêm vào giỏ hàng!");
          return true;
        } catch (err: any) {
          console.error("Lỗi thêm giỏ hàng server:", err);

          setCart((prev) => {
            const existing = prev.items.find(
              (i) => makeCartKey(i.product._id, i.selectedAttributes) === newKey
            );
            let newItems;
            if (existing) {
              newItems = prev.items.map((i) =>
                makeCartKey(i.product._id, i.selectedAttributes) === newKey
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              );
            } else {
              newItems = [...prev.items, { product: normalizedProduct, quantity, selectedAttributes: attrs }];
            }
            const newTotal = newItems.reduce((s, i) => s + i.quantity, 0);
            const newCart = { items: newItems, totalQuantity: newTotal };
            persistLocalCart(newCart);
            return newCart;
          });

          showSuccessToast("Đã thêm vào giỏ hàng");
          return false;
        }
      }

      // GUEST FLOW
      setCart((prev) => {
        const existing = prev.items.find(
          (i) => makeCartKey(i.product._id, i.selectedAttributes) === newKey
        );
        let newItems;
        if (existing) {
          newItems = prev.items.map((i) =>
            makeCartKey(i.product._id, i.selectedAttributes) === newKey
              ? { ...i, quantity: i.quantity + quantity }
              : i
          );
        } else {
          newItems = [...prev.items, { product: normalizedProduct, quantity, selectedAttributes: attrs }];
        }
        const newTotal = newItems.reduce((s, i) => s + i.quantity, 0);
        const newCart = { items: newItems, totalQuantity: newTotal };
        persistLocalCart(newCart);
        return newCart;
      });

      showSuccessToast("Đã thêm vào giỏ hàng!");
      return false;
    },
    [loadCart]
  );

  const updateItem = useCallback(
    async (productId: string, quantity: number) => {
      if (quantity <= 0) {
        await removeItem(productId);
        return;
      }

      const token = localStorage.getItem("token");
      if (token) {
        try {
          await updateCartItemAPI(productId, quantity);
          await loadCart();
          return;
        } catch (err) {
          console.warn("Cập nhật server lỗi, dùng local", err);
        }
      }

      setCart((prev) => {
        const newItems = prev.items.map((i) =>
          i.product._id === productId ? { ...i, quantity } : i
        );
        const newTotal = newItems.reduce((s, i) => s + i.quantity, 0);
        const newCart = { items: newItems, totalQuantity: newTotal };
        persistLocalCart(newCart);
        return newCart;
      });
    },
    [loadCart]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          await removeCartItemAPI(productId);
          await loadCart();
          return;
        } catch (err) {
          console.warn("Xóa server lỗi", err);
        }
      }

      setCart((prev) => {
        const newItems = prev.items.filter((i) => i.product._id !== productId);
        const newTotal = newItems.reduce((s, i) => s + i.quantity, 0);
        const newCart = { items: newItems, totalQuantity: newTotal };
        persistLocalCart(newCart);
        return newCart;
      });
    },
    [loadCart]
  );

  const clearCart = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await clearCartAPI();
      } catch (err) {
        console.warn("Clear server cart lỗi", err);
      }
    } else {
      localStorage.removeItem("cart_local");
    }
    setCart(defaultCart);
  }, []);

  useEffect(() => {
    loadCart();
    const onLogout = () => loadCart();
    window.addEventListener("app:auth-logout", onLogout);
    return () => window.removeEventListener("app:auth-logout", onLogout);
  }, [loadCart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItems: cart.items,
        totalQuantity: cart.totalQuantity,
        loadCart,
        reloadCart,
        addToCart,
        updateItem,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;