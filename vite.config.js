import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // The site's Content-Security-Policy only allows fonts and images from its own origin,
    // so nothing may be inlined as a data: URI.
    assetsInlineLimit: 0,
    sourcemap: false
  },
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: false } }
  },
});
