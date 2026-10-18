/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const src = fileURLToPath(new URL('./src', import.meta.url));
const shared = fileURLToPath(new URL('../backend/src/shared', import.meta.url));
const API_TARGET = process.env.VITE_DEV_API_TARGET ?? 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': src, '@shared': shared },
    // Shared schemas import zod from the backend folder; use one copy (the frontend's).
    dedupe: ['zod', 'react', 'react-dom'],
  },
  server: {
    port: 5173,
    fs: { allow: [fileURLToPath(new URL('.', import.meta.url)), shared] },
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: false },
      // Uploaded public files (covers, photos, QR codes) are served by the API.
      '/media': { target: API_TARGET, changeOrigin: false },
      // Legacy PHP URLs are redirected (301) by the backend.
      // (with or without a query string: /course_details.php?subject_id=7)
      '^/[^?]*\\.php(\\?.*)?$': { target: API_TARGET, changeOrigin: false },
    },
  },
  build: {
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
    css: false,
  },
});
