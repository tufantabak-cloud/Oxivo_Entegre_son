import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc' 
import path from 'path'

export default defineConfig({
  plugins: [react()], 

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), 
    },
  },

  build: {
    outDir: 'dist', // Vercel standartı 'dist'tir. 'build' yerine bunu kullanıyoruz.
    target: 'esnext',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-components': ['lucide-react', 'sonner'],
          'charts': ['recharts'],
          'excel': ['xlsx'],
        },
      },
    },
  },

  // CSS ayarını basitleştirdik, PostCSS config dosyasını otomatik bulacak.
  css: {
    devSourcemap: true,
  },

  server: {
    port: 3000,
    open: true, 
    host: true, 
  },
});