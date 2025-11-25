# 🧹 SUPABASE DUPLICATE CLEANUP & PREVENTION GÜVENLİ KILAVUZU

## 🎯 ÖZET
Supabase tablolarındaki duplicate kayıtları **güvenli şekilde** temizleyip gelecekte oluşmasını engelleyeceğiz.

---

## ⚠️ ÖNEMLİ UYARILAR

### 🔒 GÜVENLİK KONTROL LİSTESİ
- [ ] ✅ Supabase Dashboard'da **backup aldığınızdan emin olun**
- [ ] ✅ Point-in-Time Recovery aktif mi kontrol edin
- [ ] ✅ İşlemi **test ortamında** önce deneyin
- [ ] ✅ Production'da **sakin saatlerde** (gece) çalıştırın
- [ ] ✅ Script'i **kısmı kısmı** çalıştırın (hepsini birden değil)

---

## 📋 ADIM ADIM UYGULAMA

### **ADIM 1: MEVCUT DURUMU KONTROL ET**

**Supabase SQL Editor'e git** ve şu sorguyu çalıştır:

```sql
-- Hangi tablolarda kaç duplicate var?
SELECT * FROM duplicate_monitoring;
```

**Beklenen Çıktı:**
```
table_name     | unique_field        | duplicate_value | duplicate_count | duplicate_ids
---------------+--------------------+----------------+----------------+-----------------
customers      | firma_unvan        | ABC Ltd.       | 3              | {id1, id2, id3}
products       | urun_kodu          | POS-001        | 2              | {id4, id5}
...
```

📊 **Rapor: Duplicate sayısını not al**

---

### **ADIM 2: DETAYLI DUPLICATE ANALİZİ**

**Her tablo için detaylı kontrol:**

```sql
-- Customers - firma_unvan duplicates
SELECT 
  firma_unvan,
  COUNT(*) as adet,
  ARRAY_AGG(id ORDER BY created_at ASC) as tum_idler,
  ARRAY_AGG(created_at ORDER BY created_at ASC) as tarihler
FROM customers
WHERE firma_unvan IS NOT NULL
GROUP BY firma_unvan
HAVING COUNT(*) > 1
ORDER BY adet DESC
LIMIT 20;
```

```sql
-- Products - urun_kodu duplicates
SELECT 
  urun_kodu,
  COUNT(*) as adet,
  ARRAY_AGG(id ORDER BY created_at ASC) as tum_idler,
  ARRAY_AGG(created_at ORDER BY created_at ASC) as tarihler
FROM products
WHERE urun_kodu IS NOT NULL
GROUP BY urun_kodu
HAVING COUNT(*) > 1
ORDER BY adet DESC
LIMIT 20;
```

```sql
-- Bank PF - firma_unvan duplicates  
SELECT 
  firma_unvan,
  COUNT(*) as adet,
  ARRAY_AGG(id ORDER BY created_at ASC) as tum_idler,
  ARRAY_AGG(created_at ORDER BY created_at ASC) as tarihler
FROM bank_accounts
WHERE firma_unvan IS NOT NULL
GROUP BY firma_unvan
HAVING COUNT(*) > 1
ORDER BY adet DESC
LIMIT 20;
```

📝 **Notlar:**
- İlk ID (en eski kayıt) **KORUNACAK**
- Diğer ID'ler **SİLİNECEK**
- Kritik kayıtları manuel kontrol et

---

### **ADIM 3: TEK TABLO TESTİ (DRY RUN)**

**İlk olarak TEK TABLO'da test et:**

```sql
-- Dry run - sadece rapor, silme yok
SELECT 
  'customers' as tablo,
  firma_unvan as alan,
  COUNT(*) as adet,
  ARRAY_AGG(id ORDER BY created_at DESC) as silinecek_idler
FROM customers
WHERE firma_unvan IS NOT NULL
GROUP BY firma_unvan
HAVING COUNT(*) > 1;
```

**Eğer sonuç mantıklı görünüyorsa, devam et:**

```sql
-- Tek tablo için cleanup çalıştır
SELECT * FROM cleanup_duplicates('customers', 'firma_unvan', 'earliest');
```

**Beklenen Çıktı:**
```
deleted_count | kept_count
--------------+------------
5             | 298
```

✅ **Verification:**
```sql
-- Duplicate kaldı mı kontrol et
SELECT firma_unvan, COUNT(*) 
FROM customers 
GROUP BY firma_unvan 
HAVING COUNT(*) > 1;
```

---

### **ADIM 4: TÜM TABLOLARI TEMİZLE**

**Eğer test başarılıysa, tüm tabloları temizle:**

```sql
-- TÜM TABLOLARI CLEANUP YAP
SELECT * FROM cleanup_all_duplicates();
```

**Beklenen Çıktı:**
```
table_name          | unique_field    | deleted_count | kept_count | status
--------------------+----------------+--------------+-----------+--------
customers           | cari_hesap_kodu | 5            | 298       | success
products            | urun_kodu       | 12           | 988       | success
bank_accounts       | hesap_no        | 3            | 45        | success
...
```

📊 **Rapor: Her tabloda kaç duplicate silindi not al**

---

### **ADIM 5: UNIQUE CONSTRAINT EKLE**

**Duplicate'leri sildikten sonra constraint'leri aktif et:**

```sql
-- UNIQUE constraint'leri ekle
-- (Bu zaten migration script'te var, ama manuel çalıştırabilirsin)

-- Customers
ALTER TABLE customers 
ADD CONSTRAINT IF NOT EXISTS customers_firma_unvan_unique 
UNIQUE (firma_unvan);

ALTER TABLE customers 
ADD CONSTRAINT IF NOT EXISTS customers_cari_hesap_kodu_unique 
UNIQUE (cari_hesap_kodu);

-- Products
ALTER TABLE products 
ADD CONSTRAINT IF NOT EXISTS products_urun_kodu_unique 
UNIQUE (urun_kodu);

-- Bank PF
ALTER TABLE bank_accounts 
ADD CONSTRAINT IF NOT EXISTS bank_accounts_hesap_no_unique 
UNIQUE (hesap_no);

-- MCC Codes
ALTER TABLE mcc_codes 
ADD CONSTRAINT IF NOT EXISTS mcc_codes_kod_unique 
UNIQUE (kod);

-- Banks
ALTER TABLE banks 
ADD CONSTRAINT IF NOT EXISTS banks_kod_unique 
UNIQUE (kod);

-- EPK
ALTER TABLE epk 
ADD CONSTRAINT IF NOT EXISTS epk_kod_unique 
UNIQUE (kod);

-- OK
ALTER TABLE ok 
ADD CONSTRAINT IF NOT EXISTS ok_kod_unique 
UNIQUE (kod);

-- Sales Reps
ALTER TABLE sales_representatives 
ADD CONSTRAINT IF NOT EXISTS sales_representatives_name_unique 
UNIQUE (name);

-- Job Titles
ALTER TABLE job_titles 
ADD CONSTRAINT IF NOT EXISTS job_titles_title_unique 
UNIQUE (title);

-- Partnerships
ALTER TABLE partnerships 
ADD CONSTRAINT IF NOT EXISTS partnerships_partner_name_unique 
UNIQUE (partner_name);

-- Account Items
ALTER TABLE account_items 
ADD CONSTRAINT IF NOT EXISTS account_items_kod_unique 
UNIQUE (kod);

-- Sharings
ALTER TABLE sharings 
ADD CONSTRAINT IF NOT EXISTS sharings_tip_unique 
UNIQUE (tip);

-- Card Programs
ALTER TABLE card_programs 
ADD CONSTRAINT IF NOT EXISTS card_programs_kod_unique 
UNIQUE (kod);

-- Suspension Reasons
ALTER TABLE suspension_reasons 
ADD CONSTRAINT IF NOT EXISTS suspension_reasons_kod_unique 
UNIQUE (kod);
```

---

### **ADIM 6: VERİFİKASYON & RAPOR**

**Final kontrolü yap:**

```sql
-- 1. Duplicate kaldı mı?
SELECT * FROM duplicate_monitoring;
-- Beklenen: Boş sonuç (0 row)

-- 2. Constraint'ler aktif mi?
SELECT 
  conrelid::regclass AS tablo,
  conname AS constraint_adi,
  pg_get_constraintdef(oid) AS tanimlama
FROM pg_constraint
WHERE contype = 'u' 
AND conrelid::regclass::text IN (
  'customers', 'products', 'bank_accounts', 
  'mcc_codes', 'banks', 'epk', 'ok',
  'sales_representatives', 'job_titles',
  'partnerships', 'account_items', 'sharings',
  'card_programs', 'suspension_reasons'
)
ORDER BY tablo, constraint_adi;

-- 3. Toplam kayıt sayısı
SELECT 
  'customers' as tablo, COUNT(*) as kayit_sayisi 
FROM customers
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'bank_accounts', COUNT(*) FROM bank_accounts
UNION ALL
SELECT 'mcc_codes', COUNT(*) FROM mcc_codes
UNION ALL
SELECT 'banks', COUNT(*) FROM banks
UNION ALL
SELECT 'epk', COUNT(*) FROM epk
UNION ALL
SELECT 'ok', COUNT(*) FROM ok
UNION ALL
SELECT 'sales_representatives', COUNT(*) FROM sales_representatives
UNION ALL
SELECT 'job_titles', COUNT(*) FROM job_titles;
```

---

## 🚨 SORUN GİDERME

### **HATA 1: "duplicate key value violates unique constraint"**

**Sebep:** Constraint eklemeye çalışıyorsun ama hala duplicate kayıtlar var

**Çözüm:**
```sql
-- Önce cleanup yap
SELECT * FROM cleanup_duplicates('TABLE_NAME', 'COLUMN_NAME', 'latest');

-- Sonra constraint ekle
ALTER TABLE TABLE_NAME ADD CONSTRAINT ... UNIQUE (...);
```

---

### **HATA 2: "constraint already exists"**

**Sebep:** Constraint zaten eklenmiş

**Çözüm:**
```sql
-- Constraint'i kaldır
ALTER TABLE TABLE_NAME DROP CONSTRAINT IF EXISTS CONSTRAINT_NAME;

-- Cleanup yap
SELECT * FROM cleanup_duplicates('TABLE_NAME', 'COLUMN_NAME', 'latest');

-- Yeniden ekle
ALTER TABLE TABLE_NAME ADD CONSTRAINT CONSTRAINT_NAME UNIQUE (COLUMN_NAME);
```

---

### **HATA 3: "function cleanup_duplicates does not exist"**

**Sebep:** Migration script çalıştırılmamış

**Çözüm:**
```sql
-- Migration script'i çalıştır
-- Dosya: /supabase/migrations/20250124_add_unique_constraints_and_deduplication.sql
-- Tüm içeriği SQL Editor'e yapıştır ve çalıştır
```

---

## 📊 BAŞARI KRİTERLERİ

✅ **Cleanup Başarılı Sayılır Eğer:**

1. ✅ `SELECT * FROM duplicate_monitoring;` → 0 row
2. ✅ Tüm constraint'ler aktif
3. ✅ Uygulama çalışıyor ve hata yok
4. ✅ Yeni duplicate kayıt eklenemiyor (engelleniyor)

---

## 🎯 TEST SENARYOSU

**Cleanup'tan sonra duplicate eklemeyi test et:**

```sql
-- 1. Var olan bir customer ekle (BAŞARISIZ olmalı)
INSERT INTO customers (id, firma_unvan, cari_hesap_kodu)
VALUES ('test-id-1', 'Mevcut Firma', 'CARI-001');
-- Beklenen: ERROR: duplicate key value violates unique constraint

-- 2. Yeni customer ekle (BAŞARILI olmalı)
INSERT INTO customers (id, firma_unvan, cari_hesap_kodu)
VALUES ('test-id-2', 'Yeni Firma XYZ', 'CARI-NEW-001');
-- Beklenen: SUCCESS

-- 3. Test kayıtları sil
DELETE FROM customers WHERE id IN ('test-id-1', 'test-id-2');
```

---

## 💾 ROLLBACK (ACİL DURUM)

**Eğer bir şeyler ters giderse:**

```sql
-- 1. Constraint'leri kaldır
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  FOR constraint_name IN 
    SELECT conname 
    FROM pg_constraint 
    WHERE contype = 'u' 
    AND conname LIKE '%_unique'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %s CASCADE', 
      (SELECT conrelid::regclass FROM pg_constraint WHERE conname = constraint_name),
      constraint_name
    );
    RAISE NOTICE 'Dropped constraint: %', constraint_name;
  END LOOP;
END $$;

-- 2. Point-in-Time Recovery kullan
-- Supabase Dashboard → Settings → Backups → Restore
```

---

## 🎉 TAMAMLANDI!

**Cleanup başarılı olduğunda:**

1. ✅ Duplicate kayıtlar temizlendi
2. ✅ UNIQUE constraint'ler aktif
3. ✅ Gelecekte duplicate oluşamaz
4. ✅ Uygulama çalışıyor

**Frontend'de otomatik duplicate prevention zaten aktif:**
- `duplicateDetector.ts`
- `productDuplicateChecker.ts`
- API'lerde UPSERT kullanımı

---

## 📞 DESTEK

**Sorun yaşarsan:**
1. Console log'ları kontrol et
2. Supabase log'ları incele (Dashboard → Logs)
3. `duplicate_monitoring` view'ını çalıştır
4. Bu dosyayı tekrar oku

---

**Son Güncelleme:** 2025-01-25  
**Versiyun:** 1.0.0  
**Durum:** Production Ready ✅
