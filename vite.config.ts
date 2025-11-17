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
    // 1. ÇÖZÜM: Vercel'in loglarda bulduğu 'build' klasörünü kullan
    outDir: 'build', 
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // 2. ÇÖZÜM: Excel (XLSX) kütüphanesini ayrı bir pakete ayır
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('xlsx')) {
              return 'xlsx-vendor';
            }
            // Diğer tüm kütüphaneleri tek bir 'vendor' paketine ayır
            return 'vendor'; 
          }
        }
      }
    }
  },

  // 2. ÇÖZÜM (Ek Optimizasyon): Vite'e XLSX'i tanımasını söyle
  optimizeDeps: {
    include: ['xlsx'],
  }
})
```

### Son Adım: Gönder ve Bitir

Bu son `vite.config.ts` değişikliğini kaydettikten sonra terminalden gönder:

```powershell
git add .
git commit -m "FIX: Solved XLSX require error and merged all fixes"
git push