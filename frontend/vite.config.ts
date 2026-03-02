import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import sitemap from 'vite-plugin-sitemap'

export default defineConfig({
  plugins: [
    react(),
    sitemap({
      hostname: 'https://tongkhonoithattayninh.vn',
      dynamicRoutes: [
        '/',
        '/trang-chu',
        '/gioi-thieu',
        '/posts',
        '/mau-mau',
        '/doi-tac',
        '/tim-kiem',
        '/theo-doi-don-hang',
        '/tai-khoan-ca-nhan',
        ]
      })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
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