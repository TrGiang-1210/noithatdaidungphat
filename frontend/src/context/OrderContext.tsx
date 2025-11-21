// src/contexts/OrderContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { createOrder } from '@/api/user/orderAPI'; // bạn sửa đường dẫn nếu cần
import { toast } from 'react-toastify';

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  note?: string;
  city: string;
}

interface OrderItem {
  product: string; // product _id
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  customer: CustomerInfo;
  items: any[];
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

interface OrderContextType {
  addOrder: (orderData: {
    customer: CustomerInfo;
    items: OrderItem[];
    total: number;
    paymentMethod: string;
  }) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const addOrder = async (orderData: any) => {
    try {
      const response = await createOrder(orderData);
      toast.success('Đặt hàng thành công! Chúng tôi sẽ liên hệ sớm');
      return response;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đặt hàng thất bại');
      throw err;
    }
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