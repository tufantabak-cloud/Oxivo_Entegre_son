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
  css: {
    postcss: './postcss.config.js',
    devSourcemap: true,
    preprocessorOptions: {
      css: {
        charset: false, // Prevent duplicate charset declarations
      },
    },
  },
  server: {
    port: 3000,
    host: true,
    strictPort: false,
    // Optimize dev server for faster CSS reload
    hmr: {
      overlay: true,
    },
    // Pre-transform CSS on server start
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
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'lucide-react',
      'sonner',
      'recharts',
      'xlsx',
    ],
    // Force re-optimization on CSS changes
    force: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Single CSS file for better caching
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
        // Optimize CSS file naming
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'assets/style.[hash].css';
          }
          return 'assets/[name].[hash].[ext]';
        },
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('lucide-react') || id.includes('sonner')) {
              return 'ui-components';
            }
            if (id.includes('recharts')) {
              return 'charts';
            }
            if (id.includes('@radix-ui')) {
              return 'radix-ui';
            }
            if (id.includes('xlsx')) {
              return 'xlsx-vendor';
            }
            return 'vendor';
          }
        },
      },
    },
  },
})
