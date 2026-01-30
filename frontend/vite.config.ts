import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // ✅ Thêm đoạn này để build ra thư mục dist chuẩn
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  // Lưu ý: server proxy chỉ có tác dụng khi chạy npm run dev ở máy cá nhân
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://tongkhonoithattayninh.vn',
        changeOrigin: true,
      },
    },
  },
})