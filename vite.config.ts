// Kök Dizindeki vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc' 
import path from 'path'

export default defineConfig({
  plugins: [react()], 

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'), 
    },
  },

  build: {
    outDir: 'build', 
    target: 'esnext',
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
        assetFileNames: 'assets/[name].[hash].[ext]', 
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

  // CSS Ayarları: Buradaki yolu GÜNCELLEYİN!
  css: {
    // ARTIK .cjs UZANTISINI GÖSTERİYORUZ
    postcss: './postcss.config.cjs', 
  },

  server: {
    port: 3000,
    open: true, 
    host: true, 
    strictPort: false,
    hmr: {
      overlay: true,
    },
    warmup: {
      clientFiles: [
        './src/**/*.css', 
        './src/**/*.ts',
        './src/**/*.tsx',
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
    ],
  },
});