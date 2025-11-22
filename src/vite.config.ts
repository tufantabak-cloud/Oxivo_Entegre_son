import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@utils": path.resolve(__dirname, "./src/utils"),
    },
    // React kopyalarını tekilleştirme (Çok önemli)
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // Bu kütüphaneleri önceden işlemesini söylüyoruz
    include: ['react', 'react-dom', 'xlsx', 'recharts'],
  },
  build: {
    chunkSizeWarningLimit: 2000, // Uyarı limitini yükselttik
    commonjsOptions: {
      transformMixedEsModules: true, // CJS/ESM uyumsuzluklarını çözer
    },
    rollupOptions: {
      output: {
        // manualChunks KISMINI KALDIRDIK.
        // Vite artık yükleme sırasını kendisi yönetecek.
      },
    },
    // Production'da console.log'ları kaldır (logger kullan)
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.* calls
        drop_debugger: true, // Remove debugger statements
      },
    },
  },
})