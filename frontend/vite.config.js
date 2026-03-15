import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
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
          target: env.VITE_SERVER_URL,
          changeOrigin: true,
        }
      }
    },
    logLevel: 'error',
  };
});