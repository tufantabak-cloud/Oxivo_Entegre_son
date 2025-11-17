import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc' // SWC daha hızlıdır, ilk dosyadaki eklentiyi korudum
import path from 'path'

export default defineConfig({
  // Genel Eklentiler
  plugins: [react()], // Hız için SWC sürümünü kullandık

  // Çözümleme Ayarları (Alias ve Uzantılar)
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'], // İlk dosyadan alındı
    alias: {
      // Figma stilleri doğru yüklensin diye 'src' yerine kök dizine işaret ediyoruz:
      // '@': path.resolve(__dirname, './src'), // ESKİ YOL
      '@': path.resolve(__dirname, './src'), // En yaygın kullanılan ve önerilen SRC yolu.

      // Versiyon belirten alias'lar temizlendi (Gerekli değilse karmaşıklık yaratır)
      // Ancak bazı kütüphaneleri yeniden yönlendiren aliaslar da olabilir, 
      // eğer sorun yaşarsanız aşağıdaki satırları tekrar ekleyin:
      // 'sonner@2.0.3': 'sonner',
      // 'react-hook-form@7.55.0': 'react-hook-form',
      // '@jsr/supabase__supabase-js@2.49.8': '@jsr/supabase__supabase-js',
    },
  },

  // BUILD (Derleme) Ayarları - Vercel ve Optimizasyon için KRİTİK
  build: {
    // VERCEL İÇİN KRİTİK: Çıktı klasörünü 'build' olarak ayarla
    outDir: 'build', 
    target: 'esnext', // İlk dosyadan alındı
    sourcemap: false,
    cssCodeSplit: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Console log'ları kaldır
        drop_debugger: true, // Debugger'ları kaldır
      },
    },
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Stil dosyalarının karmaşık adlandırmasını engeller
        assetFileNames: 'assets/[name].[hash].[ext]', 
        // Manüel olarak parçalara ayırma (Vendor Chunks) - Performans için önemli
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

  // CSS Ayarları
  css: {
    // PostCSS yapılandırmasını kök dizinden okur
    postcss: './postcss.config.js', 
    // CSS önbellekleme sorununu çözmek için eski CSS import sırasını sildik
  },

  // Geliştirme Sunucusu Ayarları
  server: {
    port: 3000,
    open: true, // İlk dosyadan alındı
    host: true, 
    strictPort: false,
    hmr: {
      overlay: true,
    },
    // Geliştirme sırasında ilk yüklenecek dosyalar (Hızlandırma)
    warmup: {
      clientFiles: [
        './src/**/*.css', // Tüm CSS dosyalarını genel olarak çağırıyoruz
        './src/**/*.ts',
        './src/**/*.tsx',
      ],
    },
  },
  
  // Önizleme Sunucusu Ayarları
  preview: {
    port: 3000,
    host: true,
  },

  // Bağımlılık Optimizasyonu
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'lucide-react',
      'sonner',
      'recharts',
      // CSS dosyalarını buradan kaldırdık, çünkü ana CSS'i index.css'te topladık.
    ],
  },
})