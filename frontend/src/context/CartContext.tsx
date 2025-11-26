// src/contexts/CartContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
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
};

type CartItem = {
  product: Product;
  quantity: number;
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
  addToCart: async () => {},
  updateItem: async () => {},
  removeItem: async () => {},
  clearCart: async () => {},
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartShape>(defaultCart);

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
  });

  // Load cart từ server hoặc localStorage
  const loadCart = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const serverCart = await fetchCart();
        if (serverCart && serverCart.items?.length >= 0) {
          // Chuẩn hóa dữ liệu từ server
          const normalized = {
            items: serverCart.items.map((item: any) => ({
              product: normalizeProduct(item.product || item),
              quantity: item.quantity,
            })),
            totalQuantity: serverCart.totalQuantity || serverCart.items.reduce((s: number, i: any) => s + i.quantity, 0),
          };
          setCart(normalized);
          return;
        }
      } catch (err) {
        console.warn("Lỗi load giỏ hàng từ server, dùng local", err);
      }
    }

    // Guest: load từ localStorage
    try {
      const raw = localStorage.getItem("cart_local");
      if (raw) {
        const parsed = JSON.parse(raw);
        const normalizedItems = (parsed.items || []).map((item: any) => ({
          product: normalizeProduct(item.product || item),
          quantity: item.quantity || 1,
        }));
        const totalQty = normalizedItems.reduce((s: number, i: CartItem) => s + i.quantity, 0);
        setCart({ items: normalizedItems, totalQuantity: totalQty });
      } else {
        setCart(defaultCart);
      }
    } catch (e) {
      console.error("Lỗi parse local cart", e);
      setCart(defaultCart);
    }
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

  // TRỌNG TÂM: addToCart giờ KHÔNG toast nữa, chỉ trả về true/false
  const addToCart = useCallback(async (product: Product, quantity = 1): Promise<boolean> => {
    const normalizedProduct = normalizeProduct(product);
    const token = localStorage.getItem("token");

    if (token) {
      try {
        await addToCartAPI(normalizedProduct._id, quantity);
        await loadCart();
        return true; // thành công với tài khoản đăng nhập
      } catch (err: any) {
        console.warn("Thêm giỏ hàng server lỗi → fallback local", err);
        // không throw, vẫn tiếp tục dùng local
      }
    }

    // Guest flow hoặc fallback
    setCart(prev => {
      const existing = prev.items.find(i => i.product._id === normalizedProduct._id);
      let newItems;
      if (existing) {
        newItems = prev.items.map(i =>
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

    return false; // nghĩa là dùng guest cart
  }, [loadCart]);

  const updateItem = useCallback(async (productId: string, quantity: number) => {
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

    setCart(prev => {
      const newItems = prev.items.map(i =>
        i.product._id === productId ? { ...i, quantity } : i
      );
      const newTotal = newItems.reduce((s, i) => s + i.quantity, 0);
      const newCart = { items: newItems, totalQuantity: newTotal };
      persistLocalCart(newCart);
      return newCart;
    });
  }, [loadCart]);

  const removeItem = useCallback(async (productId: string) => {
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

    setCart(prev => {
      const newItems = prev.items.filter(i => i.product._id !== productId);
      const newTotal = newItems.reduce((s, i) => s + i.quantity, 0);
      const newCart = { items: newItems, totalQuantity: newTotal };
      persistLocalCart(newCart);
      return newCart;
    });
  }, [loadCart]);

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