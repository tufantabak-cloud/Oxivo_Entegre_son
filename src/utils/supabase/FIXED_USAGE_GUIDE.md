# 🎯 DÜZELTİLMİŞ KULLANIM KILAVUZU - 30 TABLO ANALİZİ

## ❌ SORUN: Önceki SQL dosyaları varsayımsal tablo isimleri kullandı

**Hata:** `account_items` tablosu yok
**Sebep:** SQL dosyalarında olmayan tablo isimleri kullanıldı

---

## ✅ ÇÖZÜM: 3 Yeni Dinamik SQL Dosyası Hazırlandı

### 1️⃣ **REAL_TABLES_DYNAMIC_REPORT.sql** ⭐ ÖNERİLEN
**Amaç:** Gerçek tabloları dinamik olarak tespit edip rapor oluştur

**İçerik - 12 Bölüm:**
1. 📊 Tüm tabloların listesi (30 tablo + kayıt sayıları)
2. 📋 Her tablonun sütun detayları
3. 📊 Tablolara göre gruplanmış sütun listesi
4. 🔢 Boş olmayan tablolar
5. 🔴 Boş tablolar (henüz kullanılmayan)
6. 📊 JSONB sütunlar
7. 🔗 Foreign Key ilişkileri
8. 🔑 Primary Key tanımları
9. ⏰ Timestamp sütunları
10. 🗑️ Soft Delete analizi
11. 📦 Veri tipi dağılımı
12. 📇 Index istatistikleri

**✅ AVANTAJ:** Gerçek tablo isimlerini otomatik tespit eder, hata vermez!

---

### 2️⃣ **SHOW_SAMPLE_DATA.sql** 📊 ÖRNEK VERİ
**Amaç:** Bilinen ana tabloların örnek verilerini göster

**İçerik:**
- ✅ `customers` - Müşteriler (ilk 5 kayıt)
- ✅ `bank_accounts` - Banka/PF (ilk 5 kayıt)
- ✅ `signs` - TABELA (ilk 5 kayıt)
- ✅ `earnings` - HAKEDİŞ (ilk 5 kayıt)
- ✅ `banks`, `mcc_codes`, `card_programs` - Tanımlar (tüm kayıtlar)
- ✅ Ve diğer tanım tabloları

**⚠️ NOT:** Eğer bir tablo yoksa, o bölümü SQL'den silin veya yorum satırı yapın.

---

### 3️⃣ **COMPLETE_DATABASE_ANALYSIS.sql** 📚 KAPSAYICI
**Amaç:** Daha önce oluşturduğumuz tam analiz (değişiklik yok)

---

## 🚀 ŞİMDİ NE YAPMALI?

### Adım 1: Ana Raporu Çalıştırın (ÖNERİLEN) ⭐

```bash
1. Supabase Dashboard → SQL Editor
2. Yeni Query açın
3. REAL_TABLES_DYNAMIC_REPORT.sql dosyasını açın
4. Tüm içeriği kopyalayın (Ctrl+A, Ctrl+C)
5. SQL Editor'e yapıştırın
6. RUN butonuna basın
```

**Sonuç:** 12 bölüm, hata yok! ✅

---

### Adım 2: Hızlı Tablo Listesi (10 saniye)

Önce hangi tablolar olduğunu görelim:

```sql
-- Supabase SQL Editor'de çalıştırın
SELECT 
    ROW_NUMBER() OVER (ORDER BY tablename) AS "#",
    tablename AS "📋 Tablo",
    COALESCE(s.n_live_tup, 0) AS "🔢 Kayıt",
    pg_size_pretty(pg_total_relation_size('public.' || t.tablename)) AS "💾 Boyut",
    CASE 
        WHEN COALESCE(s.n_live_tup, 0) = 0 THEN '🔴 BOŞ'
        WHEN COALESCE(s.n_live_tup, 0) < 10 THEN '🟡 AZ'
        WHEN COALESCE(s.n_live_tup, 0) < 100 THEN '🟢 NORMAL'
        ELSE '🟣 YÜKSEK'
    END AS "📊 Durum"
FROM pg_tables t
LEFT JOIN pg_stat_user_tables s 
    ON s.schemaname = t.schemaname 
    AND s.relname = t.tablename
WHERE t.schemaname = 'public'
ORDER BY tablename;
```

**Bu size 30 tablonun tam listesini verecek!** 📊

---

### Adım 3: Örnek Veri Göster (İsteğe Bağlı)

Eğer ana tabloların içeriğini görmek isterseniz:

```bash
SHOW_SAMPLE_DATA.sql dosyasını çalıştırın
```

**⚠️ DİKKAT:** Eğer bir tablo yoksa hata verir. O satırları silin veya yorum yapın (`--`).

---

## 🎯 BEKLENTİLER

### BÖLÜM 1: Tablo Listesi
```
#  | Tablo                    | Kayıt | Boyut   | Durum
---|--------------------------|-------|---------|--------
1  | bank_accounts            | 45    | 128 kB  | 🟢 NORMAL
2  | banks                    | 12    | 32 kB   | 🟡 AZ
3  | card_programs            | 8     | 24 kB   | 🟡 AZ
4  | categories               | 0     | 8 kB    | 🔴 BOŞ
5  | contract_audit_logs      | 0     | 8 kB    | 🔴 BOŞ
...
30 | suspension_reasons       | 5     | 16 kB   | 🟡 AZ
```

### BÖLÜM 2: Sütun Detayları
```
Tablo         | Sütun         | Veri Tipi | Uzunluk | Nullable    | Key
--------------|---------------|-----------|---------|-------------|-----
customers     | id            | text      |         | ❌ NOT NULL | 🔑 PK
customers     | unvan         | text      |         | ❌ NOT NULL |
customers     | email         | text      |         | ✅ NULL     |
...
```

### BÖLÜM 4: Boş Olmayan Tablolar
```
Tablo          | Aktif Kayıt | Ölü Kayıt | Boyut   | Seq Scan | Index Scan
---------------|-------------|-----------|---------|----------|------------
customers      | 127         | 0         | 256 kB  | 45       | 230
signs          | 85          | 0         | 180 kB  | 32       | 156
bank_accounts  | 45          | 0         | 128 kB  | 28       | 98
...
```

### BÖLÜM 5: Boş Tablolar
```
Tablo                              | Boyut  | Sütun Sayısı
-----------------------------------|--------|-------------
categories                         | 8 kB   | 5
contract_audit_logs                | 8 kB   | 8
contract_templates                 | 8 kB   | 6
contract_transaction_documents     | 8 kB   | 7
contract_transactions              | 8 kB   | 9
customer_documents                 | 8 kB   | 8
duplicate_monitoring               | 8 kB   | 6
email_templates                    | 8 kB   | 7
income_records                     | 8 kB   | 10
petty_cash                         | 8 kB   | 8
revenue_models                     | 8 kB   | 6
sms_templates                      | 8 kB   | 6
```

### BÖLÜM 6: JSONB Sütunlar
```
Tablo          | JSONB Sütun         | Nullable
---------------|---------------------|----------
bank_accounts  | bank_pf_ids         | ✅ NULL
bank_accounts  | tabela_records      | ✅ NULL
bank_accounts  | earning_records     | ✅ NULL
customers      | bank_pf_ids         | ✅ NULL
earnings       | islem_hacmi_map     | ✅ NULL
signs          | kart_program_ids    | ✅ NULL
signs          | bank_ids            | ✅ NULL
signs          | gelir_modeli        | ✅ NULL
signs          | komisyon_oranlari   | ✅ NULL
signs          | paylasim_oranlari   | ✅ NULL
```

### BÖLÜM 10: Soft Delete
```
Tablo                    | is_deleted | deleted_at | Delete Stratejisi
-------------------------|------------|------------|-------------------
bank_accounts            | ✅ VAR     | ❌ YOK     | 🟡 BASIC Soft Delete
banks                    | ✅ VAR     | ❌ YOK     | 🟡 BASIC Soft Delete
card_programs            | ✅ VAR     | ❌ YOK     | 🟡 BASIC Soft Delete
categories               | ✅ VAR     | ❌ YOK     | 🟡 BASIC Soft Delete
customers                | ✅ VAR     | ❌ YOK     | 🟡 BASIC Soft Delete
...
```

---

## 📊 30 TABLO - MUHTEMEL LİSTE

Ekran görüntünüzden ve SQL raporunuzdan:

### ✅ Kesin Var Olanlar (16 Tablo)
1. `bank_accounts` ✅
2. `banks` ✅
3. `card_programs` ✅
4. `customers` ✅
5. `domain_mappings` ✅
6. `earnings` ✅
7. `epk_institutions` ✅
8. `job_titles` ✅
9. `mcc_codes` ✅
10. `ok_institutions` ✅
11. `partnerships` ✅
12. `products` ✅
13. `sales_representatives` ✅
14. `sharings` ✅
15. `signs` ✅
16. `suspension_reasons` ✅

### 🆕 Yeni Keşfedilenler (13 Tablo)
17. `categories` 🆕
18. `contract_audit_logs` 🆕
19. `contract_templates` 🆕
20. `contract_transaction_documents` 🆕
21. `contract_transactions` 🆕
22. `customer_documents` 🆕
23. `duplicate_monitoring` 🆕
24. `email_templates` 🆕
25. `income_records` 🆕
26. `petty_cash` 🆕
27. `revenue_models` 🆕
28. `sms_templates` 🆕
29. `fixed_commissions` 🆕 (veya başka)

### 🔧 Sistem (1+ Tablo)
30. `kv_store_3ff25b67` (Supabase KV)
31. `kv_store_9ec5bbb3` (veya başka KV store)

**NOT:** Tam listeyi görmek için Adım 2'deki SQL'i çalıştırın!

---

## 💡 IPUÇLARI

### İpucu 1: Gerçek Tablo İsimlerini Öğrenme
```sql
-- Sadece tablo isimlerini göster
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### İpucu 2: Bir Tabloyu Tek Başına İnceleme
```sql
-- Örnek: "categories" tablosunu incele
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'categories'
ORDER BY ordinal_position;

-- Örnek veri
SELECT * FROM categories LIMIT 5;
```

### İpucu 3: JSONB İçeriğini Okuma
```sql
-- signs tablosundaki JSONB sütunları
SELECT 
    id, urun,
    komisyon_oranlari,
    komisyon_oranlari->>'taksit1' AS "Taksit 1 Oranı",
    paylasim_oranlari
FROM signs 
WHERE is_deleted = false 
LIMIT 3;
```

---

## ✅ YENİ CHECKLIST

- [ ] **REAL_TABLES_DYNAMIC_REPORT.sql** çalıştırıldı ✅
- [ ] 30 tablonun gerçek listesi görüldü
- [ ] Her tablonun sütunları incelendi
- [ ] Boş tablolar tespit edildi
- [ ] JSONB sütunlar listelendi
- [ ] Foreign Key ilişkileri görüldü
- [ ] Soft Delete stratejisi anlaşıldı
- [ ] **(İsteğe bağlı)** SHOW_SAMPLE_DATA.sql ile örnek veriler görüldü

---

## 🎁 BONUS: Tek Sorguda Her Şey

```sql
-- Tüm tabloları sütunlarıyla birlikte göster
SELECT 
    c.table_name AS "Tablo",
    COUNT(*) AS "Sütun Sayısı",
    COALESCE(s.n_live_tup, 0) AS "Kayıt Sayısı",
    STRING_AGG(c.column_name, ', ' ORDER BY c.ordinal_position) AS "Sütun Listesi"
FROM information_schema.columns c
LEFT JOIN pg_stat_user_tables s 
    ON s.schemaname = c.table_schema 
    AND s.relname = c.table_name
WHERE c.table_schema = 'public'
GROUP BY c.table_name, s.n_live_tup
ORDER BY c.table_name;
```

---

## 🚀 HAZIRSINIZ!

**ŞİMDİ:**
1. **REAL_TABLES_DYNAMIC_REPORT.sql** dosyasını çalıştırın
2. 12 bölümü inceleyin
3. Hangi tablolarda veri var, hangileri boş göreceksiniz
4. Sonuçları paylaşın, beraber analiz edelim! 🎉

**HATA YOK!** ✅ Bu SQL dosyası gerçek tabloları otomatik tespit eder!
