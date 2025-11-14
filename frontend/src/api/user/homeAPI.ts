import axios from 'axios';
import type { Category } from './categoryAPI';

// fallback Product type (nếu productAPI chưa export type Product)
export type Product = {
  _id: string;
  name: string;
  price?: number;
  img_url?: string;
  [key: string]: any;
};

export interface HomeData {
  saleProducts: Product[];
  hotProducts: Product[];
  bestSellerProducts: Product[];
  categories: Category[];
}

export const fetchHomeData = async (): Promise<HomeData> => {
  const response = await axios.get('http://localhost:5000/api/home');
  return response.data;
};