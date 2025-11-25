# 🚀 DEPLOYMENT GUIDE - Vercel + Supabase

## ✅ ÖNEMLİ: "TypeError: Failed to fetch" HATASI İÇİN ÇÖZÜM

Bulduğunuz çözüm **Figma Plugin** içindir. Bu proje **WEB UYGULAMASI** olduğu için `manifest.json` gerekmez!

---

## 📋 DEPLOYMENT ADIMLARı (SIRA ÖNEMLİ!)

### 1️⃣ **Supabase Setup (İlk Yapılması Gereken)**

#### A. Supabase Dashboard'a Gidin
```
https://supabase.com/dashboard
```

#### B. Proje Bilgilerinizi Alın
```
Project ID: okgeyuhmumlkkcpoholh
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Nerede bulunur?**
- Dashboard → Settings → API
- **Project URL:** `https://okgeyuhmumlkkcpoholh.supabase.co`
- **Anon Key (public):** Yukarıdaki uzun string

#### C. Tabloların Doğruluğunu Kontrol Edin
Supabase SQL Editor'da şu komutu çalıştırın:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Beklenen 20 Tablo:**
- ✅ `customers`
- ✅ `products`
- ✅ `bank_accounts`
- ✅ `mcc_codes`
- ✅ `banks`
- ✅ `epk_institutions`
- ✅ `ok_institutions`
- ✅ `sales_representatives`
- ✅ `job_titles`
- ✅ `partnerships`
- ✅ `account_items`
- ✅ `fixed_commissions`
- ✅ `additional_revenues`
- ✅ `sharing`
- ✅ `kart_program`
- ✅ `suspension_reason`

**Eğer tablolar yoksa:** `/SUPABASE_SCHEMA.sql` dosyasını SQL Editor'da çalıştırın.

---

### 2️⃣ **Vercel Environment Variables (ÇOK KRİTİK!)**

#### A. Vercel Dashboard'a Gidin
```
https://vercel.com/dashboard
→ Your Project
→ Settings
→ Environment Variables
```

#### B. Şu 2 Variable'ı Ekleyin:

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_SUPABASE_PROJECT_ID` | `okgeyuhmumlkkcpoholh` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (tam key) | Production, Preview, Development |

**CRITICAL:** 
- ✅ Key adı **TAM OLARAK** `VITE_` ile başlamalı
- ✅ Her 3 environment için de (Production, Preview, Development) ekleyin
- ❌ `NEXT_PUBLIC_` prefix'i kullanmayın (bu Vite projesi)

---

### 3️⃣ **Local Development (.env Dosyası)**

#### A. Proje Klasöründe `.env` Dosyası Oluşturun

```bash
# Kök dizinde .env dosyası oluşturun
touch .env
```

#### B. İçeriğini Doldurun

```env
VITE_SUPABASE_PROJECT_ID=okgeyuhmumlkkcpoholh
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rZ2V5dWhtdW1sa2tjcG9ob2xoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDAyMjAsImV4cCI6MjA3Mzk3NjIyMH0.wICqJoMc9a2-S7OwW6VMwcs1-ApPjpnS2QMZ4BVZFpI
```

**Not:** `.env.example` dosyasını kopyalayıp `.env` olarak kaydedebilirsiniz.

---

### 4️⃣ **Vercel'e Deploy**

#### A. GitHub'a Push
```bash
git add .
git commit -m "fix: Add Supabase environment variables support"
git push origin main
```

#### B. Vercel Otomatik Deploy Edecek
- Dashboard'da deployment loglarını izleyin
- Build başarılı olmalı

#### C. Deploy Sonrası Kontrol
1. **Vercel URL'inize gidin** (örn: `https://your-app.vercel.app`)
2. **Console'u açın** (F12 → Console)
3. **Şunları görmeli siniz:**

✅ **BAŞARILI:**
```
✅ Using environment variable Supabase credentials
🔧 Creating new Supabase client singleton...
✅ Supabase client singleton created
🔄 Fetching all data from Supabase...
✅ Loaded 0 customers from Supabase
✅ Loaded 0 products from Supabase
✅ Loaded 142 MCC codes from Supabase
✅ Loaded 45 banks from Supabase
...
```

❌ **HATA (Environment variable eksik):**
```
⚠️ Using hard-coded Supabase credentials (fallback). Set VITE_SUPABASE_PROJECT_ID...
```

---

## 🔥 SORUN GİDERME

### Hata 1: `TypeError: Failed to fetch`

**Sebep:** Environment variables eksik veya yanlış

**Çözüm:**
1. Vercel → Settings → Environment Variables'ı kontrol edin
2. **"Redeploy"** butonuna basın (değişiklikleri yeniden build etmek için)
3. Console'da `window.__OXIVO_SUPABASE__` yazın, client var mı kontrol edin

---

### Hata 2: `❌ Error fetching customers: relation "customers" does not exist`

**Sebep:** Supabase tablolarınız oluşturulmamış

**Çözüm:**
1. Supabase Dashboard → SQL Editor
2. `/SUPABASE_SCHEMA.sql` dosyasını çalıştırın
3. Deployment'ı yenileyin

---

### Hata 3: `CORS policy` hatası

**Sebep:** Supabase API izinleri

**Çözüm:**
- **Genellikle gerekmez** çünkü Supabase default olarak tüm origin'lere izin verir
- Eğer custom RLS (Row Level Security) kullanıyorsanız, politikalarınızı kontrol edin

---

### Hata 4: Console'da 10 hata görüyorum

**Çözüm:** Lütfen tam hata mesajlarını kopyalayıp bana gönderin. Örnek:

```
1. TypeError: Cannot read property 'getAll' of undefined
   at App.tsx:245
   
2. Error: Failed to fetch
   at supabaseClient.ts:150
```

---

## 📊 BAŞARILI DEPLOYMENT KONTROL LİSTESİ

- [ ] Supabase'de 20 tablo oluşturuldu
- [ ] Vercel Environment Variables eklendi (2 adet)
- [ ] `.env` dosyası local'de oluşturuldu
- [ ] GitHub'a push yapıldı
- [ ] Vercel deployment başarılı
- [ ] Console'da ✅ yeşil mesajlar görünüyor
- [ ] Hiç kırmızı error yok
- [ ] App açılıyor ve çalışıyor

---

## 🎯 SONUÇ

✅ **manifest.json gerekmez** (bu Figma Plugin için)
✅ **CORS sorunu olmaz** (Supabase otomatik halleder)
✅ **Tek yapmanız gereken:** Environment variables'ı Vercel'e eklemek

**Hala hata alıyorsanız:** Console'daki tam hata mesajlarını gönderin, tek tek çözeceğiz! 🚀
