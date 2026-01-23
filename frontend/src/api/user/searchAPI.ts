// VITE CACHE FIX 2025 - XÓA SAU KHI HẾT LỖI ĐỎ
// anything here to break cache...
import axios from "axios";
import { Product } from "./productAPI";

const API_BASE_URL = "https://tongkhonoithattayninh.vn"; // backend đang chạy ở cổng 5000

export const searchProductsAPI = async (query: string): Promise<Product[]> => {
  const response = await axios.get(`${API_BASE_URL}/api/products/search?query=${query}`);
  return Array.isArray(response.data) ? response.data : [];
};
