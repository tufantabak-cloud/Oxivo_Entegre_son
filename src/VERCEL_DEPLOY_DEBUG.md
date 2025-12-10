# 🔍 VERCEL DEPLOYMENT DEBUG GUIDE

**Tarih:** 10.12.2024  
**Durum:** 🔴 Build başarılı ama uygulama açılmıyor (ERR_CONNECTION_RESET)

---

## ❌ Mevcut Durum

**Build Status:** ✅ Başarılı  
**Deploy Status:** ✅ Tamamlandı  
**Application Status:** ❌ Açılmıyor (ERR_CONNECTION_RESET)

```
Build Log:
✓ 2866 modules transformed
✓ built in 18.20s
✓ Deployment completed
```

**Ama tarayıcıda:**
```
ERR_CONNECTION_RESET
Bu siteye ulaşılamıyor
```

---

## 🔍 Olası Nedenler

### 1. **Runtime JavaScript Hatası**
Build başarılı ama runtime'da crash oluyor.

**Kontrol:**
- Tarayıcı Console (F12) → Kırmızı hatalar var mı?
- Vercel Dashboard → Functions → Logs

### 2. **Supabase Bağlantı Hatası**
Tablolar olmadığı için query'ler fail oluyor.

**Çözüm:**
- SQL script çalıştır (`/DSYM_TABLES_CREATE.sql`)
- Veya tablo yoksa gracefully handle et (yaptık ✅)

### 3. **TipTap SSR Hatası**
TipTap lazy loading çalışmadı.

**Çözüm:**
- SSR guard eklendi ✅
- Lazy import eklendi ✅
- Suspense wrapper eklendi ✅

### 4. **Environment Variables**
Supabase credentials eksik.

**Kontrol:**
- Vercel Dashboard → Settings → Environment Variables
- `VITE_SUPABASE_URL` var mı?
- `VITE_SUPABASE_ANON_KEY` var mı?

---

## 🛠️ Yapılan Düzeltmeler (10.12.2024)

### ✅ 1. CustomerContractPreview.tsx
**Sorun:** Tablolar yoksa crash ediyordu.

**Çözüm:**
```typescript
catch (error: any) {
  // Tablo yoksa sessizce handle et
  if (error.code === '42P01' || error.message?.includes('relation')) {
    console.warn('⚠️ contract_templates tablosu henüz oluşturulmamış');
    setTemplates([]); // Boş array
  } else {
    toast.error('Şablonlar yüklenemedi');
  }
}
```

### ✅ 2. FullscreenContractEditor.tsx
**Sorun:** SSR hatası.

**Çözüm:**
```typescript
// SSR Safety
if (typeof window === 'undefined') {
  return null;
}
```

### ✅ 3. Error Boundary
**Durum:** Zaten var (`main.tsx` satır 102)

---

## 🚀 Deploy Sonrası Kontrol

### Adım 1: Tarayıcı Console
```
1. Uygulamayı aç
2. F12 → Console
3. Kırmızı hataları kopyala
```

**Muhtemel hatalar:**
```javascript
// ❌ Supabase bağlantı hatası
Failed to fetch

// ❌ Tablo yok hatası
relation "contract_templates" does not exist

// ❌ TipTap import hatası
Cannot find module '@tiptap/react'
```

### Adım 2: Vercel Functions Logs
```
1. Vercel Dashboard
2. Functions sekmesi
3. Real-time logs
```

### Adım 3: Network Tab
```
1. F12 → Network
2. Failed requests (kırmızı)
3. Status code kontrol et
```

---

## 🔧 Hızlı Testler

### Test 1: Ana Sayfa Açılıyor mu?
```
https://your-app.vercel.app
```

✅ **Açılırsa:** Runtime hatası yok  
❌ **Açılmazsa:** JavaScript crash (Console'da hata var)

### Test 2: Müşteri Modülü Çalışıyor mu?
```
Ana Sayfa → Müşteri Cari Kart
```

✅ **Çalışırsa:** Core sistem OK  
❌ **Çalışmazsa:** Supabase connection hatası

### Test 3: DSYM Sekmesi Görünüyor mu?
```
Müşteri Detay → DSYM>Sözleşmeler
```

✅ **Görünürse:** Component render OK  
❌ **Görünmezse:** Tablo yok (SQL script çalıştır)

---

## 📋 Checklist

### Vercel Tarafı
- [ ] Build başarılı ✅ (zaten OK)
- [ ] Deploy tamamlandı ✅ (zaten OK)
- [ ] Environment variables set
- [ ] Functions çalışıyor

### Supabase Tarafı
- [ ] **SQL script çalıştırıldı** (`/DSYM_TABLES_CREATE.sql`)
- [ ] `contract_templates` tablosu var
- [ ] `customer_contracts` tablosu var
- [ ] RLS policies aktif

### Frontend Tarafı
- [ ] Tarayıcı Console temiz (hata yok)
- [ ] Network requests başarılı (200 OK)
- [ ] Ana sayfa yükleniyor
- [ ] Modüller çalışıyor

---

## 🆘 Hata Durumunda

### Senaryo A: Ana Sayfa Bile Açılmıyor
**Yapılacak:**
1. F12 → Console
2. Kırmızı hatayı kopyala
3. Buraya yapıştır ve paylaş

### Senaryo B: Ana Sayfa Açılıyor Ama DSYM Çalışmıyor
**Yapılacak:**
1. Supabase SQL script çalıştır
2. Tablolar oluştur
3. Sayfayı yenile

### Senaryo C: "relation does not exist" Hatası
**Yapılacak:**
1. Bu NORMAL! Tablolar henüz yok.
2. `/DSYM_TABLES_CREATE.sql` dosyasını çalıştır
3. Sorunu çözecek ✅

---

## 💡 ÖNEMLİ NOT

**ERR_CONNECTION_RESET** genellikle şu anlama gelir:
- Sunucu crash oluyor (JavaScript runtime error)
- Vercel function timeout oluyor (nadir)
- DNS/Network sorunu (çok nadir)

**En muhtemel neden:** JavaScript hatası (runtime).

**Çözüm:** Tarayıcı Console'u kontrol et!

---

## 📞 Sonraki Adım

**ŞİMDİ NE YAPACAKSINIZ?**

1. **Git push yapın:**
   ```bash
   git add .
   git commit -m "fix: Add graceful error handling for missing DSYM tables"
   git push
   ```

2. **Vercel deploy bekleyin** (3-5 dakika)

3. **Uygulamayı açın ve F12 → Console kontrol edin**

4. **Hata mesajını paylaşın:**
   - Screenshot al
   - Console log'larını kopyala
   - Buraya yapıştır

**Hata mesajını görünce kesin çözüm sunabilirim!** 🎯

---

**Versiyon:** 1.0  
**Tarih:** 10.12.2024  
**Status:** Debugging in progress...
