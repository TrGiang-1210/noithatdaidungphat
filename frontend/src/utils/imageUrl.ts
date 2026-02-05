// src/utils/imageUrl.ts

/**
 * Chuyển đổi đường dẫn ảnh tương đối thành URL đầy đủ
 * @param path - Đường dẫn ảnh từ backend (vd: "/uploads/products/abc.jpg")
 * @returns URL đầy đủ để hiển thị ảnh
 */
export const getImageUrl = (path: string | undefined | null): string => {
  // 1. Nếu không có path → trả về ảnh placeholder
  if (!path) {
    return 'https://via.placeholder.com/150?text=No+Image';
  }

  // 2. Nếu đã là URL đầy đủ (http/https) → trả về luôn
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // ✅ FIX: LUÔN DÙNG PRODUCTION DOMAIN CHO ẢNH
  // Vì ảnh được lưu trên production server, không phải localhost
  const baseUrl = 'https://tongkhonoithattayninh.vn';

  // 4. Đảm bảo path có dấu / ở đầu
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // 5. Ghép base URL + path
  return `${baseUrl}${normalizedPath}`;
};

/**
 * Lấy URL ảnh đầu tiên trong mảng, hoặc placeholder nếu mảng rỗng
 * @param images - Mảng đường dẫn ảnh
 * @returns URL ảnh đầu tiên
 */
export const getFirstImageUrl = (images: string[] | undefined | null): string => {
  if (!images || images.length === 0) {
    return 'https://via.placeholder.com/150?text=No+Image';
  }
  return getImageUrl(images[0]);
};

/**
 * Chuyển đổi tất cả ảnh trong mảng thành URL đầy đủ
 * @param images - Mảng đường dẫn ảnh
 * @returns Mảng URL đầy đủ
 */
export const getImageUrls = (images: string[] | undefined | null): string[] => {
  if (!images || images.length === 0) {
    return ['https://via.placeholder.com/150?text=No+Image'];
  }
  return images.map(img => getImageUrl(img));
};