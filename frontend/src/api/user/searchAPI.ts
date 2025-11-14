import axios from "axios";
import type { Product } from "../user/productAPI";

const API_BASE_URL = "http://localhost:5000"; // backend đang chạy ở cổng 5000

export const searchProductsAPI = async (query: string): Promise<Product[]> => {
  const response = await axios.get(`${API_BASE_URL}/api/products/search?query=${encodeURIComponent(query)}`);
  return Array.isArray(response.data) ? response.data : [];
};
