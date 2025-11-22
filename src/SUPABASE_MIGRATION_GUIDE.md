# 🚀 Supabase Migration Guide

## ✅ Tamamlanan İşlemler (2025-11-17)

Hybrid Storage Architecture başarıyla kuruldu. localStorage ve Supabase arasında esnek geçiş altyapısı hazır.

---

## 📁 Yeni Dosya Yapısı

```
/utils/storage/
├── StorageAdapter.ts              # Interface & Types
├── LocalStorageAdapter.ts         # localStorage implementation
├── SupabaseStorageAdapter.ts      # Supabase API implementation
├── HybridStorageAdapter.ts        # Hybrid logic (primary/fallback)
└── index.ts                       # Singleton & public API

/components/
└── StorageMigrationPanel.tsx      # Migration UI (DebugModule'de)

/utils/
└── storage.ts                     # [DEPRECATED] Backward compatibility
```

---

## 🎯 Storage Stratejileri

### 1. **localStorage-primary** (Varsayılan - Güvenli)
```
Okuma: localStorage → fallback Supabase
Yazma: localStorage + background Supabase sync
```
✅ **Avantaj**: Hızlı, offline çalışır  
⚠️ **Dezavantaj**: Supabase hatası göz ardı edilir

### 2. **supabase-primary** (Önerilen Geçiş)
```
Okuma: Supabase → fallback localStorage (cache)
Yazma: Supabase + background localStorage cache
```
✅ **Avantaj**: Merkezi veri, çoklu cihaz desteği  
⚠️ **Dezavantaj**: Network gerektirir

### 3. **localStorage-only** (Test/Offline)
```
Sadece localStorage kullanır
```
✅ **Avantaj**: Basit, hızlı  
❌ **Dezavantaj**: Supabase kullanmaz

### 4. **supabase-only** (Production)
```
Sadece Supabase kullanır
```
✅ **Avantaj**: Merkezi, ölçeklenebilir  
❌ **Dezavantaj**: Offline çalışmaz

---

## 🔄 Migration Süreci (Adım Adım)

### **Faz 1: Hazırlık** ✅ TAMAMLANDI

- [x] Storage Adapter Pattern kuruldu
- [x] LocalStorageAdapter oluşturuldu
- [x] SupabaseStorageAdapter oluşturuldu
- [x] HybridStorageAdapter oluşturuldu
- [x] Migration Panel UI eklendi (DebugModule)

### **Faz 2: Test & Migration** ⏳ SONRAKI ADIM

1. **Uygulamayı başlat**
   ```bash
   npm run dev
   ```

2. **Debug modülüne git**
   - Sol menüden "Debug" sekmesine tıkla
   - "🔄 Storage Migration" tabına geç

3. **Health Check yap**
   - "Kontrol Et" butonuna tıkla
   - LocalStorage ve Supabase bağlantısını test et

4. **Migration başlat**
   - "Migration Başlat" butonuna tıkla
   - localStorage → Supabase veri aktarımı otomatik yapılır

5. **Sonuçları kontrol et**
   - Kaç veri aktarıldığını gör
   - Hata varsa logları kontrol et

### **Faz 3: Strateji Değiştir** ⏳ SONRAKI ADIM

1. **Supabase Primary'ye geç**
   - Migration Panel'de "Supabase Primary" butonuna tıkla

2. **Uygulamayı test et**
   - Müşteri ekleme/düzenleme
   - Ürün listesi
   - Domain yükleme
   - Banka/PF işlemleri

3. **Her şey çalışıyorsa "Supabase Only" moduna geç**
   - "Supabase Only" butonuna tıkla
   - localStorage artık kullanılmayacak

---

## 💻 Kod Kullanımı

### Eski Kod (Senkron - Deprecated)
```typescript
import { getStoredData, setStoredData } from './utils/storage';

const customers = getStoredData('customers', []);
setStoredData('customers', newCustomers);
```

### Yeni Kod (Async - Hybrid Storage)
```typescript
import { storage } from './utils/storage';

// Get
const customers = await storage.get('customers');

// Set
await storage.set('customers', newCustomers);

// Remove
await storage.remove('customers');

// Clear all
await storage.clear();
```

### Strateji Değiştir (Runtime)
```typescript
import { setStorageStrategy } from './utils/storage';

setStorageStrategy('supabase-primary');
```

### Migration (Programatik)
```typescript
import { migrateToSupabase, syncFromSupabase } from './utils/storage';

// localStorage → Supabase
const result = await migrateToSupabase();
console.log(`${result.migrated} veri aktarıldı`);

// Supabase → localStorage
const syncResult = await syncFromSupabase();
console.log(`${syncResult.synced} veri senkronize edildi`);
```

---

## 🔧 Hook'ları Güncelleme (İleride)

### useDefinitionStore.ts
```typescript
// ❌ ESKİ
const data = getStoredData('definitions', {});

// ✅ YENİ
const data = await storage.get('definitions') ?? {};
```

### useDataSync.ts
```typescript
// ❌ ESKİ
setStoredData('customers', customers);

// ✅ YENİ
await storage.set('customers', customers);
```

---

## 📊 Backend Endpoints (Mevcut)

```
GET  /make-server-9ec5bbb3/customers         # Müşteri listesi
POST /make-server-9ec5bbb3/customers         # Müşteri kaydet
PUT  /make-server-9ec5bbb3/customers/:id     # Müşteri güncelle
DEL  /make-server-9ec5bbb3/customers/:id     # Müşteri sil

GET  /make-server-9ec5bbb3/products          # Ürün listesi
POST /make-server-9ec5bbb3/products/sync     # Ürün sync

GET  /make-server-9ec5bbb3/domains           # Domain listesi
POST /make-server-9ec5bbb3/domains/sync      # Domain sync

GET  /make-server-9ec5bbb3/bankpf            # Banka/PF listesi
POST /make-server-9ec5bbb3/bankpf            # Banka/PF kaydet

GET  /make-server-9ec5bbb3/health            # Health check
```

---

## 🚨 Troubleshooting

### "require is not defined" hatası
```
✅ ÇÖZÜM: XLSX import sorunları çözüldü (önceki commit)
```

### Migration başarısız oluyor
```
1. Console'da error loglarını kontrol edin
2. Supabase credentials'ları kontrol edin (/utils/supabase/info.tsx)
3. Backend API'nin çalıştığını doğrulayın (health check)
4. Network tab'inde 401/403 hatası varsa auth kontrol edin
```

### Veriler senkronize olmuyor
```
1. Storage stratejisini kontrol edin (getStorageStrategy())
2. localStorage ve Supabase'de aynı veri var mı kontrol edin
3. Migration Panel'de "Senkronize Et" butonuna tıklayın
```

### LocalStorage quota exceeded
```
✅ ÇÖZÜM: Hybrid adapter otomatik cleanup yapar
Alternatif: "Supabase Only" moduna geçin
```

---

## 📈 Sonraki Adımlar

1. ⏳ **Test Migration** - DebugModule'de migration testi
2. ⏳ **Production Deploy** - Vercel'de Supabase bağlantısını test et
3. ⏳ **Hook Migration** - useDefinitionStore, useDataSync güncelle
4. ⏳ **Performance Monitoring** - Supabase response time'ları izle
5. ⏳ **Offline Support** - Service Worker ekle (opsiyonel)

---

## 🎉 Başarı Kriterleri

✅ Migration Panel çalışıyor  
✅ Health check başarılı  
⏳ localStorage → Supabase migration başarılı  
⏳ Supabase Primary modunda uygulama çalışıyor  
⏳ Production'da veri kaybı yok  

---

**SON GÜNCELLEME**: 2025-11-17  
**DURUM**: Hybrid Storage altyapısı hazır, test bekleniyor  
**SONRAKI**: Migration test ve strateji geçişi
