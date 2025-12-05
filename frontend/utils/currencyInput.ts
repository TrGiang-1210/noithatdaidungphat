// src/utils/currencyInput.ts
export const formatCurrencyInput = (value: string): string => {
  // Chỉ giữ lại số
  const numbersOnly = value.replace(/\D/g, '');
  if (!numbersOnly) return '';

  // Thêm dấu chấm phân cách hàng nghìn
  return Number(numbersOnly).toLocaleString('vi-VN');
};

export const parseCurrencyInput = (value: string): number => {
  return parseInt(value.replace(/\D/g, ''), 10) || 0;
};