// src/contexts/CartContext.tsx - FIXED VERSION
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

type Product = {
  _id: string;
  name: string;
  price: number;
  priceSale?: number;
  images?: string[];
  image?: string;
  img_url?: string;
  size?: string;
  selectedAttributes?: Record<string, string>; // ✅ THÊM FIELD NÀY
};

type CartItem = {
  product: Product;
  quantity: number;
  selectedAttributes?: Record<string, string>; // ✅ THÊM FIELD NÀY
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
  addToCart: (product: Product, quantity?: number) => Promise<boolean>;
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
  const [cart, setCart] = useState<CartShape>(defaultCart);
  const lastToastTime = useRef<number>(0); // ← THÊM REF ĐỂ DEBOUNCE TOAST

  // Helper: chuẩn hóa product object
  const normalizeProduct = (prod: any): Product => ({
    _id: prod._id || prod.productId,
    name: prod.name || "Sản phẩm không tên",
    price: prod.priceSale ?? prod.price ?? 0,
    images: Array.isArray(prod.images)
      ? prod.images
      : prod.image
      ? [prod.image]
      : prod.img_url
      ? [prod.img_url]
      : [],
    size: prod.size,
    selectedAttributes: prod.selectedAttributes || {}, // ✅ THÊM DÒNG NÀY
  });

  // ← THÊM FUNCTION SHOW TOAST VỚI DEBOUNCE
  const showSuccessToast = (message: string) => {
    const now = Date.now();
    // Chỉ show toast nếu đã qua 1 giây kể từ toast trước
    if (now - lastToastTime.current > 1000) {
      toast.success(message);
      lastToastTime.current = now;
    }
  };

  // Load cart từ server hoặc localStorage
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
        })),
        totalQuantity:
          serverCart.totalQuantity ||
          serverCart.items.reduce(
            (s: number, i: any) => s + (i.quantity || 1),
            0
          ),
      };
      setCart(normalized);
      // XÓA local để tránh xung đột
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

    // Cuối cùng nếu cả 2 đều rỗng
    setCart(defaultCart);
  }, []);

  const reloadCart = useCallback(async () => {
    await loadCart();
  }, [loadCart]);

  // Lưu localStorage (chỉ dùng cho guest)
  const persistLocalCart = (newCart: CartShape) => {
    try {
      localStorage.setItem("cart_local", JSON.stringify(newCart));
    } catch (e) {
      console.warn("Không lưu được local cart", e);
    }
  };

  const addToCart = useCallback(
    async (product: Product, quantity = 1): Promise<boolean> => {
      const normalizedProduct = normalizeProduct(product);
      const token = localStorage.getItem("token");

      if (token) {
        try {
          const res = await addToCartAPI(normalizedProduct._id, quantity);
          // API thành công → reload từ server
          await loadCart();
          showSuccessToast("Đã thêm vào giỏ hàng!"); // ← DÙNG DEBOUNCED TOAST
          return true;
        } catch (err: any) {
          console.error("Lỗi thêm giỏ hàng server:", err);

          // VẪN THÊM VÀO LOCAL ĐỂ KHÔNG MẤT SẢN PHẨM
          setCart((prev) => {
            const existing = prev.items.find(
              (i) => i.product._id === normalizedProduct._id
            );
            let newItems;
            if (existing) {
              newItems = prev.items.map((i) =>
                i.product._id === normalizedProduct._id
                  ? {
                      ...i,
                      quantity: i.quantity + quantity,
                      selectedAttributes:
                        normalizedProduct.selectedAttributes || {}, // ✅ LƯU THUỘC TÍNH
                    }
                  : i
              );
            } else {
              newItems = [
                ...prev.items,
                {
                  product: normalizedProduct,
                  quantity,
                  selectedAttributes:
                    normalizedProduct.selectedAttributes || {}, // ✅ LƯU THUỘC TÍNH
                },
              ];
            }
            const newTotal = newItems.reduce((s, i) => s + i.quantity, 0);
            const newCart = { items: newItems, totalQuantity: newTotal };
            persistLocalCart(newCart);
            return newCart;
          });

          // KHÔNG TOAST Ở ĐÂY vì đã toast ở catch block phía trên
          showSuccessToast("Đã thêm vào giỏ hàng"); // ← DÙNG DEBOUNCED TOAST
          return false;
        }
      }

      // Guest flow (giữ nguyên nhưng dùng debounced toast)
      setCart((prev) => {
        const existing = prev.items.find(
          (i) => i.product._id === normalizedProduct._id
        );
        let newItems;
        if (existing) {
          newItems = prev.items.map((i) =>
            i.product._id === normalizedProduct._id
              ? { ...i, quantity: i.quantity + quantity }
              : i
          );
        } else {
          newItems = [...prev.items, { product: normalizedProduct, quantity }];
        }
        const newTotal = newItems.reduce((s, i) => s + i.quantity, 0);
        const newCart = { items: newItems, totalQuantity: newTotal };
        persistLocalCart(newCart);
        return newCart;
      });

      showSuccessToast("Đã thêm vào giỏ hàng!"); // ← DÙNG DEBOUNCED TOAST
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
