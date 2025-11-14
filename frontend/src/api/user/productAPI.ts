import axios from 'axios';

// Định nghĩa kiểu dữ liệu sản phẩm
export interface ObjectIdRef {
  _id: string;
  name?: string;
}

export interface Product {
  _id: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  img_url: string;
  category_id: string | ObjectIdRef;
  sale?: boolean;
  view?: number;
  hot?: boolean;
  coupons_id?: string | ObjectIdRef;
  brand_id: string | ObjectIdRef;
  product_type_id: string | ObjectIdRef;
  created_at?: string;
  updated_at?: string;
}

// Lấy danh sách tất cả sản phẩm
export const fetchAllProducts = async (): Promise<Product[]> => {
  const response = await axios.get('http://localhost:5000/api/products');
  return response.data;
};

// Lấy chi tiết sản phẩm theo ID
export const fetchProductById = async (id: string): Promise<Product> => {
  const response = await axios.get(`http://localhost:5000/api/products/${id}`);
  return response.data;
};

// Lọc sản phẩm theo brand, price, category
export const fetchFilteredProducts = async (filters: {
  category_id?: string;
  brand_id?: string;
  minPrice?: number;
  maxPrice?: number;
}): Promise<Product[]> => {
  const params = new URLSearchParams();

  if (filters.category_id) params.append('category_id', filters.category_id);
  if (filters.brand_id) params.append('brand_id', filters.brand_id);
  if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
  if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());

  const response = await axios.get(`http://localhost:5000/api/products?${params.toString()}`);
  return response.data;
};

// Lấy sản phẩm theo product_type_id
export const fetchProductsByType = async (productTypeId: string): Promise<Product[]> => {
  const response = await axios.get(`http://localhost:5000/api/products?product_type_id=${productTypeId}`);
  return response.data;
};

// Lấy chi tiết sản phẩm theo slug
export const fetchProductDetail = async (slug: string): Promise<Product> => {
  const response = await axios.get(`http://localhost:5000/api/products/${slug}`);
  return response.data;
};

export const searchProducts = async (keyword: string): Promise<Product[]> => {
  const res = await fetch(`/api/products/search?query=${encodeURIComponent(keyword)}`);
  if (!res.ok) throw new Error("Không thể tìm kiếm sản phẩm");
  return res.json();
};
