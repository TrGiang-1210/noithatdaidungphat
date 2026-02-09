import axios from 'axios';

// Lấy link API từ .env
const API_URL = import.meta.env.VITE_API_URL || 'https://tongkhonoithattayninh.vn/api';

export interface Product {
  _id: string;
  slug: string;
  name: string;
  sku: string;
  images: string[];
  priceOriginal: number;
  priceSale: number;
  quantity: number;
}

export const fetchAllProducts = async (): Promise<Product[]> => {
  const response = await axios.get(`${API_URL}/products`);
  return response.data;
};

export const fetchProductDetail = async (slug: string): Promise<Product> => {
  const response = await axios.get(`${API_URL}/products/${slug}`);
  return response.data;
};

export const searchProducts = async (query: string, lang: string = 'vi'): Promise<Product[]> => {
  const response = await axios.get(`${API_URL}/products/search`, {
    params: { query, lang }
  });
  return response.data;
};