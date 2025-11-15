import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';  // Import path nếu chưa có

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),  // Sync với paths trong tsconfig
    },
  },
});