import axios from 'axios';

// Kiểu dữ liệu danh mục
export interface Category {
  _id: string;
  slug: string;
  name: string;
  img_url?: string;
  parent?: string; // ObjectId (dưới dạng string)
}

// Lấy danh sách tất cả danh mục
export const fetchAllCategories = async (): Promise<Category[]> => {
  const response = await axios.get('https://tongkhonoithattayninh.vn/api/categories');
  return response.data;
};
