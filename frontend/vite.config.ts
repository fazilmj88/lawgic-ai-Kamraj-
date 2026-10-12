import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../dist'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    // HMR is disabled in Development Environment via DISABLE_HMR env var.
    hmr: process.env.DISABLE_HMR !== 'true',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/rest': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/storage': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
