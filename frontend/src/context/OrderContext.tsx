// src/contexts/OrderContext.tsx
import React, { createContext, useContext } from 'react';
import { createOrder } from '@/api/user/orderAPI';

interface OrderContextType {
  addOrder: (orderData: any) => Promise<any>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const addOrder = async (orderData: any) => {
    const response = await createOrder(orderData);
    // CHỈ TRẢ VỀ DỮ LIỆU, KHÔNG TOAST Ở ĐÂY NỮA
    return response.data || response; // ← quan trọng nhất
  };

  return (
    <OrderContext.Provider value={{ addOrder }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrder phải dùng trong OrderProvider');
  return context;
};