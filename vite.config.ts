import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // React çakışmalarını önler
    dedupe: ['react', 'react-dom'],
  },
  build: {
    chunkSizeWarningLimit: 1000, // Uyarı limitini makul seviyeye çektik
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // 1. React Çekirdeği (En Kritik)
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('scheduler')
            ) {
              return 'vendor-react';
            }

            // 2. Büyük Kütüphaneleri Ayır (Performans için)
            if (id.includes('xlsx')) {
              return 'vendor-xlsx'; // Excel kütüphanesi ayrı yüklensin
            }
            if (id.includes('recharts')) {
              return 'vendor-charts'; // Grafik kütüphanesi ayrı yüklensin
            }
            if (id.includes('lucide') || id.includes('@radix-ui')) {
              return 'vendor-ui'; // UI bileşenleri ayrı yüklensin
            }

            // 3. Geri kalan her şey
            return 'vendor-utils';
          }
        },
      },
    },
  },
})