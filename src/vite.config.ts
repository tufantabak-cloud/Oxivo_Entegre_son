import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚀 CSS & POSTCSS SETTINGS — CRITICAL FOR VERCEL UI
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  css: {
    postcss: './postcss.config.js',
    devSourcemap: true,

    // CSS sırasının bozulmasını engelle
    order: 'index',

    preprocessorOptions: {
      css: {
        charset: false,
      },
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚀 DEV SERVER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  server: {
    port: 3000,
    host: true,
    strictPort: false,

    hmr: {
      overlay: true,
    },

    // CSS dosyalarını hızlı ısıtma (skeleton → instant load)
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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚀 PRE-BUNDLING OPTIMIZATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'lucide-react',
      'sonner',
      'recharts',
      'styles/figma-fixes.css',   // CRITICAL: treeshake etme!
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚀 BUILD OPTIMIZATION — VERCEL FIX
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  build: {
    outDir: 'build',
    sourcemap: false,

    // ⚠️ CSS tek dosyada → UI BOZULMASI önlenir
    cssCodeSplit: false,

    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },

    chunkSizeWarningLimit: 1000,

    // Rollup output optimizasyonları
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'assets/style.[hash].css';
          }
          return 'assets/[name].[hash].[ext]';
        },

        // Vendor splitting
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
})
