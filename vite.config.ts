import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  server: {
    open: true,
  },
});
