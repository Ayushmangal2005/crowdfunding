import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    sourcemap: false,
  },
  esbuild: {
    sourcemap: false,
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_SERVER_URL || 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  // 👇 Custom logger filter to silence source map errors
  logLevel: 'error', // suppress non-critical logs like sourcemap warnings
});