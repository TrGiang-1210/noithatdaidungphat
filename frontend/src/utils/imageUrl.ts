// src/utils/imageUrl.ts

const getBaseUrl = (): string => {
  // 1. Ưu tiên biến môi trường VITE_BASE_URL nếu bạn định nghĩa trong .env
  if (import.meta.env.VITE_BASE_URL) {
    return import.meta.env.VITE_BASE_URL;
  }

  // 2. Nếu không có, lấy từ VITE_API_URL và bỏ phần /api ở cuối
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api$/, '');
  }

  // 3. Fallback cuối cùng nếu không có .env (Production)
  return 'https://tongkhonoithattayninh.vn';
};

export const getImageUrl = (path: string | null | undefined): string => {
  if (!path) {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E';
  }

  if (path.startsWith('http')) return path;

  const baseUrl = getBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
};

export const getFirstImageUrl = (images: string[] | undefined | null): string => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return getImageUrl(null);
  }
  return getImageUrl(images[0]);
};

export const getImageUrls = (images: string[] | undefined | null): string[] => {
  if (!images || !Array.isArray(images)) return [];
  return images.map((img) => getImageUrl(img));
};