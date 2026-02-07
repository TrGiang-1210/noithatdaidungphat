// src/utils/imageUrl.ts

/**
 * 🔥 TỰ ĐỘNG DETECT LOCAL vs PRODUCTION
 * Không cần config .env phức tạp!
 */

/**
 * Lấy base URL dựa trên môi trường hiện tại
 * @returns Base URL cho static files
 */
const getBaseUrl = (): string => {
  // 🔍 DEBUG LOG - XÓA SAU KHI FIX XONG
  console.log('🔧 DEBUG getBaseUrl():');
  console.log('  - VITE_BASE_URL:', import.meta.env.VITE_BASE_URL);
  console.log('  - VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('  - hostname:', window.location.hostname);
  console.log('  - DEV mode:', import.meta.env.DEV);

  // 1. Nếu có VITE_BASE_URL trong .env → ưu tiên dùng
  if (import.meta.env.VITE_BASE_URL) {
    console.log('  ✅ Dùng VITE_BASE_URL:', import.meta.env.VITE_BASE_URL);
    return import.meta.env.VITE_BASE_URL;
  }

  // 2. Nếu có VITE_API_URL → loại bỏ /api
  if (import.meta.env.VITE_API_URL) {
    const baseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, '');
    console.log('  ✅ Dùng VITE_API_URL (remove /api):', baseUrl);
    return baseUrl;
  }

  // 3. ✅ TỰ ĐỘNG DETECT: Kiểm tra hostname hiện tại
  const hostname = window.location.hostname;
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('  ✅ Auto-detect LOCAL:', 'http://localhost:5000');
    return 'http://localhost:5000';
  }
  
  // Production
  console.log('  ✅ Auto-detect PRODUCTION:', 'https://tongkhonoithattayninh.vn');
  return 'https://tongkhonoithattayninh.vn';
};

/**
 * Chuyển đổi đường dẫn ảnh tương đối thành URL đầy đủ
 * @param path - Đường dẫn ảnh từ backend (vd: "/uploads/products/abc.jpg")
 * @returns URL đầy đủ để hiển thị ảnh
 */
export const getImageUrl = (path: string | undefined | null): string => {
  // 1. Nếu không có path → trả về ảnh placeholder (dùng data URL để tránh bị chặn)
  if (!path) {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E';
  }

  // 2. Nếu đã là URL đầy đủ (http/https) → trả về luôn
  if (path.startsWith('http://') || path.startsWith('https://')) {
    console.log('🖼️ Full URL already:', path);
    return path;
  }

  // 3. ✅ Lấy base URL (tự động detect)
  const baseUrl = getBaseUrl();

  // 4. Đảm bảo path có dấu / ở đầu
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // 5. Ghép base URL + path
  const fullUrl = `${baseUrl}${normalizedPath}`;
  
  // 6. Debug log
  console.log('🖼️ Image URL:', { 
    path, 
    baseUrl, 
    fullUrl 
  });
  
  return fullUrl;
};

/**
 * Lấy URL ảnh đầu tiên trong mảng, hoặc placeholder nếu mảng rỗng
 * @param images - Mảng đường dẫn ảnh
 * @returns URL ảnh đầu tiên
 */
export const getFirstImageUrl = (images: string[] | undefined | null): string => {
  if (!images || images.length === 0) {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E';
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
    return ['data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E'];
  }
  return images.map(img => getImageUrl(img));
};