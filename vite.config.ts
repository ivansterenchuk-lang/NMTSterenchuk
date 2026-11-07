import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ✅ Додаємо базовий шлях для коректної роботи в Codespaces та на GitHub Pages
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // ✅ Додаємо налаштування сервера для роботи в Codespaces
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 443, // Важливо для роботи гарячого перезавантаження через HTTPS-тунель Codespaces
    },
  },
});