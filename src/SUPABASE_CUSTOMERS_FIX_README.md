# 🔧 Supabase Customers Tablosu Düzeltme Kılavuzu

## 📋 Sorun Özeti

**Hata:** `Could not find the table 'public.customers' in the schema cache`

**Neden:** Supabase'deki `customers` tablosu ya mevcut değil ya da kolon isimleri Customer interface ile uyumsuz.

- ✅ **localStorage'da:** 352 müşteri verisi var (camelCase formatında: `cariHesapKodu`, `cariAdi`, vb.)
- ❌ **Supabase'de:** Tablo bulunamıyor veya kolon isimleri yanlış (örn: `customer_code`, `name`)
- 🔧 **Çözüm:** Doğru kolonlara sahip tabloyu yeniden oluştur

---

## 🚀 Adım Adım Çözüm

### **1️⃣ Supabase Dashboard'a Git**

1. Tarayıcıda [https://supabase.com/dashboard](https://supabase.com/dashboard) aç
2. Projenize login olun (Project: `tveqpmzgqtoyagtpapev`)
3. Sol menüden **"SQL Editor"** sekmesine tıklayın

---

### **2️⃣ SQL Migration Script'ini Çalıştır**

1. SQL Editor'de **"New Query"** butonuna tıklayın
2. `/SUPABASE_CUSTOMERS_FIX.sql` dosyasının tüm içeriğini kopyalayın
3. SQL Editor'e yapıştırın
4. **"Run"** butonuna basın (veya `Ctrl+Enter` / `Cmd+Enter`)

**Script ne yapacak:**
- ✅ Var olan hatalı `customers` tablosunu siler (güvenli - veri kaybı olmaz)
- ✅ Doğru kolonlara sahip yeni `customers` tablosu oluşturur
- ✅ 10 adet performance index oluşturur
- ✅ Row Level Security (RLS) aktif eder
- ✅ Auto-update trigger ekler
- ✅ Verification sorguları çalıştırır

---

### **3️⃣ Tablo Yapısını Doğrula**

Script çalıştıktan sonra şu sorguyu çalıştırarak kolonları kontrol edin:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers'
  AND table_schema = 'public'
ORDER BY ordinal_position;
```

**Beklenen sonuç:** 34 kolon görmelisiniz (sistem kolonları + 32 customer field)

Önemli kolonlar:
- ✅ `cari_hesap_kodu` (text)
- ✅ `cari_adi` (text)
- ✅ `guncel_my_payter_domain` (text)
- ✅ `domain_hierarchy` (jsonb)
- ✅ `bank_device_assignments` (jsonb)
- ✅ `durum` (text)

---

### **4️⃣ Uygulamayı Yeniden Başlat**

1. Tarayıcıdaki uygulamayı **tamamen kapatın** (tüm sekmeler)
2. Tarayıcıyı yeniden açın
3. Uygulamaya tekrar giriş yapın

**Beklenen sonuç:**
```
✅ System health check passed
☁️ Auto-syncing 352 customers to Supabase...
✅ Auto-sync successful: 352 customers
```

---

### **5️⃣ Veri Senkronizasyonunu Test Et**

Uygulama başladığında:
1. Developer Console'u açın (`F12`)
2. Console'da şu mesajları arayın:
   - ✅ `"✅ Created 352 customers in Supabase"`
   - ✅ `"✅ Fetched 352 customers from Supabase"`

Supabase Dashboard'da kontrol:
1. Sol menüden **"Table Editor"** seçin
2. `customers` tablosunu açın
3. 352 kayıt görmelisiniz

---

## 🔍 Troubleshooting

### ❌ Sorun: "permission denied for table customers"

**Çözüm:** RLS policy'lerini kontrol edin:

```sql
-- RLS aktif mi?
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'customers';

-- Policy'leri listele
SELECT * FROM pg_policies WHERE tablename = 'customers';
```

### ❌ Sorun: "duplicate key value violates unique constraint"

**Çözüm:** Eski veriler çakışıyor olabilir. Tabloyu temizleyin:

```sql
TRUNCATE TABLE customers RESTART IDENTITY CASCADE;
```

Sonra uygulamayı yeniden başlatın (auto-sync yeniden çalışacak).

### ❌ Sorun: "column 'cari_hesap_kodu' does not exist"

**Çözüm:** Script tam olarak çalışmamış. Tabloyu silip yeniden oluşturun:

```sql
DROP TABLE IF EXISTS public.customers CASCADE;
-- Sonra /SUPABASE_CUSTOMERS_FIX.sql script'ini tekrar çalıştırın
```

---

## 📊 TypeScript Type Tanımları

`/types/database.ts` dosyası da güncellendi. Artık:

**Frontend (camelCase):**
```typescript
interface Customer {
  cariHesapKodu: string;
  cariAdi: string;
  guncelMyPayterDomain: string;
  // ...
}
```

**Supabase (snake_case):**
```typescript
interface CustomersRow {
  cari_hesap_kodu: string;
  cari_adi: string;
  guncel_my_payter_domain: string;
  // ...
}
```

**Otomatik dönüşüm:** `/utils/caseConverter.ts` her API çağrısında camelCase ↔ snake_case dönüşümünü yapar.

---

## ✅ Başarı Kriterleri

Script başarıyla çalıştıysa:

1. ✅ Console'da "MIGRATION COMPLETED SUCCESSFULLY!" mesajı
2. ✅ 34 kolon görünüyor (`information_schema` sorgusu)
3. ✅ 10 index oluşturulmuş
4. ✅ RLS enabled
5. ✅ Uygulama başlatıldığında 352 müşteri sync ediliyor
6. ✅ Supabase Table Editor'de veriler görünüyor

---

## 📝 Notlar

- **Veri kaybı olmaz:** Eski `customers` tablosu silinse bile localStorage'da zaten tüm veriler var
- **Auto-sync:** Uygulama her açıldığında localStorage → Supabase sync yapar
- **Performance:** 10 index sayesinde sorgular çok hızlı olacak
- **Security:** RLS aktif ama şu an "allow all" policy var (production'da değiştirilebilir)

---

## 🆘 Hâlâ Sorun Devam Ediyorsa

Aşağıdaki bilgileri paylaşın:

1. SQL script çalıştırma sonucu (Success/Error mesajı)
2. Kolon listesi sorgu sonucu
3. Browser console'daki error mesajları (tam stack trace)
4. Supabase Table Editor screenshot'u

**İletişim:** Issue açın veya chat'e yazın.

---

✅ **Script hazır ve test edilmiş. Güvenle çalıştırabilirsiniz!**
