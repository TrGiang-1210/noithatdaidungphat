// vite.config.ts — BẢN CUỐI CÙNG, CHẠY NGON 100%
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
  server: {
    port: 5173,
    host: true, // để localhost:5173 chạy ngon
    proxy: {
      '/api': {
        target: 'http://localhost:5000',  // ← backend của mày
        changeOrigin: true,
        secure: false,
        // rewrite: (path) => path.replace(/^\/api/, '') // nếu cần, nhưng ko cần vì backend có /api
      },
    },
  },
})