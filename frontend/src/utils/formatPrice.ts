// src/utils/formatPrice.ts
export const formatPrice = (price: number | string): string => {
  const num = typeof price === 'string' ? parseInt(price, 10) : price;
  if (isNaN(num)) return '0đ';

  return new Intl.NumberFormat('vi-VN').format(num) + 'đ';
};