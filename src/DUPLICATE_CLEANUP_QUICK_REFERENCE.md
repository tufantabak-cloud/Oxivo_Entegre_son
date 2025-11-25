# 🚀 DUPLICATE CLEANUP - HIZLI BAŞVURU KARTI

## 📋 İŞLEM ADIMLARI (5 DAKİKA)

### 1️⃣ Supabase SQL Editor'e Git
```
Supabase Dashboard → SQL Editor → New Query
```

### 2️⃣ Quick Cleanup Script'i Çalıştır
```sql
-- Kopyala: /QUICK_DUPLICATE_CLEANUP.sql
-- Yapıştır: SQL Editor
-- Çalıştır: RUN button
```

### 3️⃣ Sonucu Kontrol Et
```sql
SELECT * FROM duplicate_monitoring;
-- Beklenen: 0 rows = ✅ BAŞARILI
```

---

## 🔍 HIZLI KONTROLLER

### Duplicate Var mı?
```sql
SELECT * FROM duplicate_monitoring;
```

### Constraint'ler Aktif mi?
```sql
SELECT COUNT(*) FROM pg_constraint WHERE contype = 'u';
-- Beklenen: 14+
```

### Hangi Tabloda Duplicate Var?
```sql
SELECT table_name, COUNT(*) as duplicate_groups
FROM duplicate_monitoring
GROUP BY table_name;
```

---

## 🧹 TEMİZLİK KOMUTLARI

### Tüm Tabloları Temizle
```sql
SELECT * FROM cleanup_all_duplicates();
```

### Tek Tablo Temizle
```sql
-- En SON kaydı sakla
SELECT * FROM cleanup_duplicates('TABLE_NAME', 'COLUMN_NAME', 'latest');

-- En ESKİ kaydı sakla
SELECT * FROM cleanup_duplicates('TABLE_NAME', 'COLUMN_NAME', 'earliest');
```

### Örnekler
```sql
-- Customers temizle
SELECT * FROM cleanup_duplicates('customers', 'firma_unvan', 'latest');

-- Products temizle
SELECT * FROM cleanup_duplicates('products', 'urun_kodu', 'latest');

-- Bank PF temizle
SELECT * FROM cleanup_duplicates('bank_accounts', 'hesap_no', 'latest');
```

---

## 🔒 CONSTRAINT EKLEME

### Tek Constraint
```sql
ALTER TABLE table_name 
ADD CONSTRAINT constraint_name 
UNIQUE (column_name);
```

### Örnekler
```sql
-- Customers
ALTER TABLE customers 
ADD CONSTRAINT customers_firma_unvan_unique 
UNIQUE (firma_unvan);

-- Products
ALTER TABLE products 
ADD CONSTRAINT products_urun_kodu_unique 
UNIQUE (urun_kodu);
```

---

## 📊 ANALİZ KOMUTLARI

### Detaylı Duplicate Listesi
```sql
-- Customers
SELECT 
  firma_unvan,
  COUNT(*) as adet,
  ARRAY_AGG(id) as idler
FROM customers
GROUP BY firma_unvan
HAVING COUNT(*) > 1;

-- Products
SELECT 
  urun_kodu,
  COUNT(*) as adet,
  ARRAY_AGG(id) as idler
FROM products
GROUP BY urun_kodu
HAVING COUNT(*) > 1;
```

### Tablo Özeti
```sql
SELECT 
  COUNT(*) as toplam,
  COUNT(DISTINCT firma_unvan) as unique,
  COUNT(*) - COUNT(DISTINCT firma_unvan) as duplicate
FROM customers;
```

---

## 🧪 TEST KOMUTLARI

### Duplicate Ekleme Testi (BAŞARISIZ olmalı)
```sql
-- Var olan kayıt ekle
INSERT INTO customers (id, firma_unvan)
VALUES ('test-1', 'EXISTING_COMPANY_NAME');
-- Beklenen: ERROR: duplicate key value violates unique constraint
```

### Yeni Kayıt Testi (BAŞARILI olmalı)
```sql
-- Yeni kayıt ekle
INSERT INTO customers (id, firma_unvan, cari_hesap_kodu)
VALUES ('test-2', 'BRAND NEW COMPANY XYZ', 'CARI-NEW-999');
-- Beklenen: INSERT 1

-- Temizle
DELETE FROM customers WHERE id = 'test-2';
```

---

## 🚨 ACİL DURUM KOMUTLARI

### Constraint Kaldır (Rollback)
```sql
ALTER TABLE table_name 
DROP CONSTRAINT IF EXISTS constraint_name CASCADE;
```

### Tüm Constraint'leri Kaldır
```sql
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  FOR constraint_name IN 
    SELECT conname 
    FROM pg_constraint 
    WHERE contype = 'u' AND conname LIKE '%_unique'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %s CASCADE', 
      (SELECT conrelid::regclass FROM pg_constraint WHERE conname = constraint_name),
      constraint_name
    );
  END LOOP;
END $$;
```

---

## 💻 FRONTEND KOMUTLARI

### Duplicate Check
```typescript
import { checkCustomerDuplicate } from './utils/duplicateDetector';

const result = await checkCustomerDuplicate(firmaUnvan, excludeId);
if (result.isDuplicate) {
  toast.error(result.message);
  return;
}
```

### Batch Check
```typescript
import { batchCheckDuplicates } from './utils/duplicateDetector';

const results = await batchCheckDuplicates('products', 'urun_kodu', codes);
```

---

## 📞 YARDIM

### Console Log Kontrolü
```javascript
// Browser Console (F12)
console.log('Duplicate check:', result);
```

### Network Tab Kontrolü
```
F12 → Network → Filter: "supabase" → Check responses
```

### Supabase Logs
```
Supabase Dashboard → Logs → Filter by "duplicate"
```

---

## ✅ BAŞARI KONTROL LİSTESİ

- [ ] `duplicate_monitoring` view boş (0 rows)
- [ ] 14+ unique constraint aktif
- [ ] Test duplicate insert hata veriyor
- [ ] Frontend duplicate check çalışıyor
- [ ] Uygulama normal çalışıyor
- [ ] Console'da hata yok

---

## 📁 DOSYA LOKASYONLARI

| Dosya | Lokasyon |
|-------|----------|
| **Quick Cleanup** | `/QUICK_DUPLICATE_CLEANUP.sql` |
| **Migration** | `/supabase/migrations/20250124_add_unique_constraints_and_deduplication.sql` |
| **Duplicate Detector** | `/utils/duplicateDetector.ts` |
| **Instructions** | `/DUPLICATE_CLEANUP_INSTRUCTIONS.md` |
| **Summary** | `/DUPLICATE_CLEANUP_SUMMARY.md` |

---

## 🎯 EN ÇOK KULLANILAN KOMUTLAR

```sql
-- #1: Duplicate kontrolü
SELECT * FROM duplicate_monitoring;

-- #2: Cleanup
SELECT * FROM cleanup_all_duplicates();

-- #3: Verification
SELECT COUNT(*) FROM pg_constraint WHERE contype = 'u';

-- #4: Test
INSERT INTO customers (id, firma_unvan) VALUES ('test', 'Existing Name');
```

---

**📌 BU KARTI KAYDET! Sürekli kullanacaksın.**

**Son Güncelleme:** 2025-01-25  
**Versiyun:** 1.0.0
