// src/api/adminAPI.ts
import axiosInstance from './axiosInstance';

export const getCategoryTree = () => axiosInstance.get('/admin/categories/tree');
export const bulkUpdateCategories = (data: any) => 
  axiosInstance.post('/admin/products/bulk-categories', data);