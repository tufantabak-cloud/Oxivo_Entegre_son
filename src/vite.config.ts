import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  // 🛑 VERCEL İÇİN KRİTİK DÜZELTME: Çıktı klasörünü 'build' olarak ayarla
  build: {
    outDir: 'build', 
    sourcemap: false,
    cssCodeSplit: false,
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
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'assets/style.[hash].css';
          }
          return 'assets/[name].[hash].[ext]';
        },
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-components': ['lucide-react', 'sonner'],
          'charts': ['recharts'],
          'radix-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-popover',
          ],
          'excel': ['xlsx'],
        },
      },
    },
  },

  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },

  css: {
    postcss: './postcss.config.js',
    devSourcemap: true,
    order: 'index',
    preprocessorOptions: {
      css: {
        charset: false,
      },
    },
  },

  server: {
    port: 3000,
    host: true,
    strictPort: false,
    hmr: {
      overlay: true,
    },
    warmup: {
      clientFiles: [
        './styles/globals.css',
        './styles/figma.css',
        './styles/utilities.css',
        './styles/figma-fixes.css',
      ],
    },
  },

  preview: {
    port: 3000,
    host: true,
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'lucide-react',
      'sonner',
      'recharts',
      'styles/figma-fixes.css',
    ],
  },
})