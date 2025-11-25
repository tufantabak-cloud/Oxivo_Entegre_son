# 🚀 VERCEL + SUPABASE ENTEGRASYON KURULUMU

## 📋 GEREKLİ ENVIRONMENT VARIABLES

Vercel Dashboard'da bu environment variable'ları ayarlayın:

### 1. Supabase Credentials

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_URL=postgresql://postgres:password@db.your-project-id.supabase.co:5432/postgres
```

**Nerede bulunur?**
1. Supabase Dashboard → Settings → API
2. `Project URL` → `SUPABASE_URL`
3. `anon public` key → `SUPABASE_ANON_KEY`
4. `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`
5. `Database URL` → `SUPABASE_DB_URL`

---

## 🛠️ KURULUM ADIMLARI

### STEP 1: Supabase Tablosunu Temizle

1. Supabase Dashboard'a git: https://supabase.com/dashboard
2. Projenizi seçin
3. Sol menüden **SQL Editor** tıklayın
4. `/SUPABASE_CLEANUP.sql` dosyasındaki SQL'i kopyala-yapıştır
5. **RUN** butonuna tıkla
6. ✅ Success mesajı bekle

### STEP 2: Vercel Environment Variables Ayarla

1. Vercel Dashboard'a git: https://vercel.com/dashboard
2. Projenizi seçin
3. **Settings** → **Environment Variables**
4. Yukarıdaki 4 variable'ı ekle:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_DB_URL`
5. **Environment** seçiminde **Production**, **Preview**, **Development** seç
6. **Save** tıkla

### STEP 3: Supabase Edge Function Deploy

**MANUEL DEPLOY (Supabase CLI ile):**

```bash
# Supabase CLI yükle (eğer yoksa)
npm install -g supabase

# Supabase'e login
supabase login

# Projeyi linke et
supabase link --project-ref your-project-id

# Edge function deploy et
supabase functions deploy make-server-9ec5bbb3
```

**ALTERNATİF: Manuel Upload**

1. Supabase Dashboard → Edge Functions
2. **Create Function** tıkla
3. Name: `make-server-9ec5bbb3`
4. `/supabase/functions/server/index.tsx` içeriğini yapıştır
5. **Deploy** tıkla

### STEP 4: Edge Function Environment Variables

Supabase Dashboard → Edge Functions → `make-server-9ec5bbb3` → Configuration:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### STEP 5: Test Edge Function

```bash
curl https://your-project-id.supabase.co/functions/v1/make-server-9ec5bbb3/health
```

Beklenen response:
```json
{"status":"ok"}
```

### STEP 6: Vercel'de Redeploy

```bash
git add .
git commit -m "feat: Supabase cleanup and Vercel integration"
git push
```

Vercel otomatik olarak yeniden deploy edecek.

---

## ✅ DOĞRULAMA

### 1. Supabase Table Kontrolü

```sql
-- Supabase SQL Editor'da çalıştır
SELECT * FROM kv_store_9ec5bbb3;
```

**Beklenen sonuç:** Tablo boş olabilir (ilk kullanımda)

### 2. Edge Function Kontrolü

```bash
curl https://your-project-id.supabase.co/functions/v1/make-server-9ec5bbb3/health
```

**Beklenen sonuç:** `{"status":"ok"}`

### 3. Frontend Connection Kontrolü

Browser console'da:
```javascript
// Supabase bağlantısını kontrol et
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Has Anon Key:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
```

---

## 🐛 HATA GİDERME

### Hata: "Table kv_store_9ec5bbb3 does not exist"

**Çözüm:** STEP 1'deki SQL script'i çalıştırın.

### Hata: "Invalid API key"

**Çözüm:** 
1. Supabase Dashboard'dan API key'leri yeniden kopyalayın
2. Vercel'de environment variable'ları güncelleyin
3. Redeploy yapın

### Hata: "CORS policy error"

**Çözüm:** Edge function CORS ayarları zaten yapılmış, sorun yoksa:
1. Edge function'ı yeniden deploy edin
2. Browser cache'i temizleyin

### Hata: "Edge function not found"

**Çözüm:**
1. Supabase Dashboard → Edge Functions kontrol edin
2. `make-server-9ec5bbb3` function'ı yoksa STEP 3'ü tekrarlayın

---

## 📊 VERİ MİGRASYONU (localStorage → Supabase)

Uygulamada **Settings** → **Supabase Migration** panelinden:

1. **Check Status** tıklayın
2. Eğer localStorage'da veri varsa **Migrate to Supabase** görünür
3. Tıklayın ve bekleyin
4. ✅ Migration successful mesajı

---

## 🔒 GÜVENLİK KONTROLÜ

### ⚠️ UYARI: Service Role Key ASLA Frontend'e GİTMEMELİ!

**Doğru:**
```typescript
// Backend (Edge Function)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') // ✅ OK
);
```

**YANLIŞ:**
```typescript
// Frontend
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY // ❌ ASLA!
);
```

---

## 📝 NOTLAR

- **KV Store:** Tüm veriler `kv_store_9ec5bbb3` tablosunda JSON olarak saklanır
- **Edge Function:** `make-server-9ec5bbb3` Hono sunucusu REST API sağlar
- **Frontend:** Sadece ANON_KEY kullanır, SERVICE_ROLE_KEY backend'de kalır
- **Vercel:** Sadece static build'i host eder, backend Supabase'de çalışır

---

**Kurulum tamamlandığında bu checklist'i işaretle:**

- [ ] STEP 1: Supabase SQL cleanup çalıştırıldı
- [ ] STEP 2: Vercel environment variables eklendi
- [ ] STEP 3: Edge function deploy edildi
- [ ] STEP 4: Edge function env vars eklendi
- [ ] STEP 5: Health check başarılı
- [ ] STEP 6: Vercel redeploy yapıldı
- [ ] ✅ Doğrulama testleri geçti
- [ ] ✅ Uygulama Supabase'den veri çekiyor

**Tüm adımlar tamamsa: Kurulum başarılı! 🎉**
