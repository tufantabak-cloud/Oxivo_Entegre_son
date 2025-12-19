import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  root: '.', // Root directory
  publicDir: 'public', // Public assets directory
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "components": path.resolve(__dirname, "./src/components"),
      "utils": path.resolve(__dirname, "./src/utils"),
    },
    // React kopyalarını tekilleştirme (Çok önemli)
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // Bu kütüphaneleri önceden işlemesini söylüyoruz
    include: ['react', 'react-dom', 'xlsx', 'recharts'],
  },
  build: {
    outDir: 'dist', // Vercel 'dist' klasörünü bekliyor
    chunkSizeWarningLimit: 2000, // Uyarı limitini yükselttik
    // ✅ Force cache invalidation - v3.2.1-UUID-DEBUG
    commonjsOptions: {
      transformMixedEsModules: true, // CJS/ESM uyumsuzluklarını çözer
    },
    rollupOptions: {
      output: {
        // manualChunks KISMINI KALDIRDIK.
        // Vite artık yükleme sırasını kendisi yönetecek.
      },
    },
    // Production build - minified & optimized
    minify: 'terser',
    sourcemap: true, // ✅ TEMPORARY: Enable sourcemap for debugging React Error #426
  },
})