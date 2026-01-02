import axios from 'axios';

// ĐỊNH NGHĨA KIỂU DỮ LIỆU – BẮT BUỘC PHẢI CÓ "export"
export interface ObjectIdRef {
  _id: string;
  name?: string;
}
// VITE CACHE IS STUPID SOMETIMES
export interface Product {
  _id: string;
  slug: string;
  name: string;
  sku: string;
  images: string[];
  description?: string;
  priceOriginal: number;
  priceSale: number;
  material?: string;
  color?: string;
  size?: string;
  quantity: number;
  created_at?: string;
  updated_at?: string;
}

// Các hàm API
export const fetchAllProducts = async (): Promise<Product[]> => {
  const response = await axios.get('http://localhost:5000/api/products');
  return response.data;
};

export const fetchProductById = async (id: string): Promise<Product> => {
  const response = await axios.get(`http://localhost:5000/api/products/${id}`);
  return response.data;
};

export const fetchProductDetail = async (slug: string): Promise<Product> => {
  const response = await axios.get(`http://localhost:5000/api/products/${slug}`);
  return response.data;
};

// TÌM KIẾM – ĐÃ HOẠT ĐỘNG 100%
// Thay thế hàm searchProducts
export const searchProducts = async (
  keyword: string, 
  language: string = 'vi'
): Promise<Product[]> => {
  const res = await fetch(
    `/api/products/search?query=${encodeURIComponent(keyword)}&lang=${language}`
  );
  if (!res.ok) throw new Error("Không thể tìm kiếm sản phẩm");
  return res.json();
};