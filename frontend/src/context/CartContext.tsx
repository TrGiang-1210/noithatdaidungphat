// src/contexts/CartContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  fetchCart,
  addToCartAPI,
  updateCartItemAPI,
  removeCartItemAPI,
  clearCartAPI
} from '@/api/user/cartAPI'; // ← bạn sửa đường dẫn nếu khác

// Cấu trúc sản phẩm trong giỏ hàng của dự án mới
export interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[]; // mảng ảnh
  };
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  totalPrice: number;
  totalQuantity: number;
  isSidebarOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  increaseQuantity: (productId: string) => Promise<void>;
  decreaseQuantity: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  forceClearCart: () => void;
  reloadCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const totalPrice = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const loadCart = async () => {
  try {
    const data = await fetchCart();

    // Backend của bạn hiện tại trả về: { items: [...] } hoặc { cart: { items: [...] } }
    // Đoạn này ăn hết mọi trường hợp
    const rawItems = data?.items || data?.cart?.items || data || [];

    const formattedItems: CartItem[] = rawItems.map((item: any) => ({
      product: {
        _id: item.product?._id || item.product_id,
        name: item.product?.name || 'Sản phẩm',
        price: Number(item.product?.price || item.price || 0),
        images: Array.isArray(item.product?.images) 
          ? item.product.images 
          : (item.product?.img_url ? [item.product.img_url] : ['/placeholder.jpg']),
      },
      quantity: Number(item.quantity || 1),
    }));

    setCartItems(formattedItems);
  } catch (err) {
    console.error('Lỗi load giỏ hàng:', err);
    setCartItems([]);
  }
};

  useEffect(() => {
    loadCart();
  }, []);

  const addToCart = async (productId: string, quantity: number = 1) => {
    try {
      const existing = cartItems.find(i => i.product._id === productId);
      if (existing) {
        await updateCartItemAPI(productId, existing.quantity + quantity);
      } else {
        await addToCartAPI(productId, quantity);
      }
      await loadCart();
      toast.success('Đã thêm vào giỏ hàng!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Thêm giỏ hàng thất bại');
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      await removeCartItemAPI(productId);
      await loadCart();
      toast.info('Đã xóa sản phẩm khỏi giỏ hàng');
    } catch (err) {
      toast.error('Xóa thất bại');
    }
  };

  const increaseQuantity = async (productId: string) => {
    const item = cartItems.find(i => i.product._id === productId);
    if (item) await updateCartItemAPI(productId, item.quantity + 1);
    await loadCart();
  };

  const decreaseQuantity = async (productId: string) => {
    const item = cartItems.find(i => i.product._id === productId);
    if (item && item.quantity > 1) {
      await updateCartItemAPI(productId, item.quantity - 1);
      await loadCart();
    }
  };

  const clearCart = async () => {
    try {
      await clearCartAPI();
      setCartItems([]);
      toast.success('Đã làm trống giỏ hàng');
    } catch (err) {
      toast.error('Lỗi khi làm trống giỏ');
    }
  };

  const forceClearCart = () => {
    setCartItems([]);
    clearCartAPI().catch(() => {});
  };

  const reloadCart = async () => {
    await loadCart();
  };

  const openCart = () => setIsSidebarOpen(true);
  const closeCart = () => setIsSidebarOpen(false);

  return (
    <CartContext.Provider value={{
      cartItems,
      totalPrice,
      totalQuantity,
      isSidebarOpen,
      openCart,
      closeCart,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
      forceClearCart,
      reloadCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart phải dùng trong CartProvider');
  return context;
};