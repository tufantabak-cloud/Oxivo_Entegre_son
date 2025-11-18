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
    // React kopyalarını tekilleştirme (Çok önemli)
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // Bu kütüphaneleri önceden işlemesini söylüyoruz
    include: ['react', 'react-dom', 'xlsx', 'recharts'],
  },
  build: {
    chunkSizeWarningLimit: 2000, // Uyarı limitini yükselttik (Sarı uyarıları görmezden gel)
    commonjsOptions: {
      transformMixedEsModules: true, // CJS/ESM uyumsuzluklarını çözer
    },
    rollupOptions: {
      output: {
        // manualChunks KISMINI KALDIRDIK.
        // Vite artık yükleme sırasını kendisi yönetecek.
        // Bu sayede "React undefined" hatası oluşmayacak.
      },
    },
  },
})