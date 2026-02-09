// src/utils/imageUrl.ts

const getBaseUrl = (): string => {
  // 1. Vite sẽ tự thay thế biến này bằng giá trị trong .env.production khi bạn chạy lệnh build
  const apiUrl = import.meta.env.VITE_API_URL || "";
  
  if (apiUrl) {
    // Loại bỏ /api ở cuối nếu có để lấy base domain cho ảnh
    return apiUrl.replace(/\/api$/, ''); 
  }

  // 2. Fallback: Nếu không có biến môi trường, tự lấy domain hiện tại
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `${window.location.protocol}//${window.location.hostname}`;
  }

  // 3. Cuối cùng mới là localhost cho máy cá nhân
  return "http://localhost:5000"; 
};

export const getImageUrl = (path: string | null | undefined): string => {
  if (!path) {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f0f0f0" width="300" height="300/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E';
  }

  if (path.startsWith('http')) return path;

  const baseUrl = getBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
};

export const getFirstImageUrl = (images: string[] | undefined | null): string => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f0f0f0" width="300" height="300/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E';
  }
  return getImageUrl(images[0]);
};