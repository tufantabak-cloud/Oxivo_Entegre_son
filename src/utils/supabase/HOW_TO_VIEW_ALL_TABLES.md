# 🎯 HER TABLONUN İÇERİĞİNİ GÖRME KILAVUZU

## ✅ DURUM: 30 TABLO TESPİT EDİLDİ!

Tebrikler! SQL raporu başarıyla çalıştı ve **30 tablo** bulundu.

---

## 📁 HAZIR DOSYALAR

İhtiyacınıza göre 2 farklı SQL dosyası hazırladım:

### 1️⃣ **EACH_TABLE_DETAILS.sql** ⭐ ÖNERİLEN
**Amaç:** Her tablonun detaylarını TEK TEK göster

**İçerik:**
- ✅ 30 tablonun her biri için ayrı bölüm
- ✅ Her tablonun TÜM sütunları
- ✅ Her tablonun örnek verileri (ilk 3-5 kayıt)
- ✅ Her tablonun kayıt sayısı
- ✅ Aktif/Silinen kayıt istatistikleri

**Çıktı Formatı:**
```
═══════════════════════════════════════
📋 TABLO 1/30: account_items
═══════════════════════════════════════

Sütunlar:
- id (text) NOT NULL 🔑 PK
- adi (text) NOT NULL
- aciklama (text) NULL
- is_deleted (boolean) NOT NULL
- created_at (timestamp) NOT NULL
...

İstatistikler:
KAYIT SAYISI: 5
AKTİF KAYIT: 5

📊 İLK 3 KAYIT:
| id | adi | aciklama | ...
|----|----|----------|----
| 1  | ... | ...      | ...
```

**Kullanım:**
```bash
1. Supabase SQL Editor → Yeni Query
2. EACH_TABLE_DETAILS.sql içeriğini kopyala
3. Yapıştır ve RUN'a bas
4. Yukarıdan aşağıya 30 tablo detayını gör
```

---

### 2️⃣ **DETAILED_TABLE_CONTENTS.sql** 📊 GELİŞMİŞ
**Amaç:** Daha detaylı ve yapılandırılmış rapor

**İçerik:**
- ✅ BÖLÜM 1: Tüm tabloların sütun listesi (özet)
- ✅ BÖLÜM 2: Her tablo için ilk 5 kayıt
- ✅ BÖLÜM 3: JSONB sütunların içeriği (bank_accounts, customers, signs, earnings)
- ✅ BÖLÜM 4: Tüm Foreign Key ilişkileri
- ✅ BÖLÜM 5: Boş olmayan tablolar listesi
- ✅ BÖLÜM 6: Primary Key tanımları
- ✅ BÖLÜM 7: Veri tipi dağılımı
- ✅ BÖLÜM 8: Timestamp sütunları

**Kullanım:**
```bash
1. Supabase SQL Editor → Yeni Query
2. DETAILED_TABLE_CONTENTS.sql içeriğini kopyala
3. Yapıştır ve RUN'a bas
4. 8 farklı bölümü incele
```

---

## 🚀 HEMEN ŞİMDİ: İLK ADIMLAR

### Adım 1: Basit Bir Başlangıç (30 saniye)
Önce hangi tablolarda veri olduğunu görelim:

```sql
-- Bu kodu Supabase SQL Editor'de çalıştırın
SELECT 
    relname AS "Tablo",
    n_live_tup AS "Kayıt Sayısı",
    CASE 
        WHEN n_live_tup = 0 THEN '🔴 BOŞ'
        WHEN n_live_tup < 10 THEN '🟡 AZ'
        WHEN n_live_tup < 100 THEN '🟢 NORMAL'
        ELSE '🟣 ÇOK'
    END AS "Durum"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

**Beklenen Sonuç:**
```
Tablo          | Kayıt Sayısı | Durum
---------------|--------------|-------
customers      | 127          | 🟣 ÇOK
signs          | 85           | 🟢 NORMAL
bank_accounts  | 45           | 🟢 NORMAL
earnings       | 23           | 🟡 AZ
mcc_codes      | 15           | 🟡 AZ
banks          | 12           | 🟡 AZ
categories     | 0            | 🔴 BOŞ
...
```

---

### Adım 2: Bir Tabloyu Detaylı İncele (1 dakika)
Örnek: `customers` tablosunu görelim:

```sql
-- 1. Sütunları göster
SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'customers'
ORDER BY ordinal_position;

-- 2. İlk 5 kaydı göster
SELECT * FROM customers WHERE is_deleted = false LIMIT 5;

-- 3. İstatistikleri göster
SELECT 
    'Toplam' AS "Metrik", 
    COUNT(*)::TEXT AS "Değer" 
FROM customers
UNION ALL
SELECT 'Aktif', COUNT(*)::TEXT FROM customers WHERE is_deleted = false
UNION ALL
SELECT 'Silinen', COUNT(*)::TEXT FROM customers WHERE is_deleted = true;
```

---

### Adım 3: Tüm Tabloları Göster (5 dakika)
```bash
EACH_TABLE_DETAILS.sql dosyasını çalıştırın
```

Bu size **30 tablo x 3 bilgi** = 90+ sonuç tablosu verecek!

---

## 📊 HANGİ TABLOLARDA VERİ VAR?

SQL raporunuzdan gelen sonuca göre muhtemelen:

### ✅ VERİ DOLU TABLOLAR (Tahmini)
- `customers` - Müşteri kayıtları
- `bank_accounts` - Banka/PF hesapları
- `signs` - TABELA kayıtları
- `earnings` - HAKEDİŞ kayıtları
- `mcc_codes` - MCC tanımları
- `banks` - Banka tanımları
- `epk_institutions` - EPK tanımları
- `ok_institutions` - OK tanımları
- `sales_representatives` - Satış temsilcileri
- `job_titles` - Unvanlar
- `partnerships` - Ortaklıklar
- `sharings` - Paylaşım oranları
- `card_programs` - Kart programları
- `suspension_reasons` - Askı nedenleri
- `domain_mappings` - Domain eşleştirmeleri
- `products` - Ürünler

### ❓ MUHTEMELEN BOŞ TABLOLAR (Yeni Eklenenler)
- `categories` 🆕
- `contract_audit_logs` 🆕
- `contract_templates` 🆕
- `contract_transaction_documents` 🆕
- `contract_transactions` 🆕
- `customer_documents` 🆕
- `duplicate_monitoring` 🆕
- `email_templates` 🆕
- `income_records` 🆕
- `petty_cash` 🆕
- `revenue_models` 🆕
- `sms_templates` 🆕
- `account_items`
- `additional_revenues`
- `fixed_commissions`

---

## 🎯 ÖNEMLİ TABLOLAR VE İÇERİKLERİ

### 1. `customers` (Müşteri Cari Kartları) ⭐
**Sütunlar (Tahmin):**
- `id`, `unvan`, `email`, `telefon`, `adres`
- `vergi_dairesi`, `vergi_no`
- `mcc_id`, `yetkili_unvan_id`, `satis_temsilcisi_id`
- `durum` ('Aktif' | 'Pasif' | 'Askıda')
- `bank_pf_ids` (JSONB - Bağlı firmalar)
- `is_deleted`, `created_at`, `updated_at`

**İçeriği görmek için:**
```sql
SELECT * FROM customers WHERE is_deleted = false LIMIT 10;
```

---

### 2. `bank_accounts` (Banka/PF) ⭐
**Sütunlar (Tahmin):**
- `id`, `tip` ('banka' | 'pf'), `adi`
- `customer_id`, `uye_isyeri_yonetimi`, `sozlesme_no`
- `banka_kod`, `epk_kod`, `ok_kod`, `ortaklik_id`
- `tabela_records` (JSONB - Enriched!)
- `earning_records` (JSONB - Enriched!)
- `aktif`, `is_deleted`, `created_at`, `updated_at`

**İçeriği görmek için:**
```sql
SELECT 
    id, tip, adi, customer_id, aktif,
    jsonb_array_length(tabela_records) AS "TABELA Sayısı",
    jsonb_array_length(earning_records) AS "HAKEDİŞ Sayısı"
FROM bank_accounts 
WHERE is_deleted = false;
```

---

### 3. `signs` (TABELA) ⭐
**Sütunlar (Tahmin):**
- `id`, `firma_id`, `tabela_group_id` (KRİTİK!)
- `urun`, `aktif`, `kart_tipi`, `yurt_ici_disi`
- `kart_program_ids` (JSONB), `bank_ids` (JSONB)
- `gelir_modeli` (JSONB), `komisyon_oranlari` (JSONB)
- `paylasim_oranlari` (JSONB)
- `komisyon_yuzdesi`, `alis_fiyati`, `satis_fiyati`, `kar_fiyati`
- `is_deleted`, `created_at`, `updated_at`

**İçeriği görmek için:**
```sql
SELECT 
    id, firma_id, tabela_group_id, urun, 
    komisyon_yuzdesi, alis_fiyati, satis_fiyati,
    jsonb_array_length(kart_program_ids) AS "Kart Program Sayısı"
FROM signs 
WHERE is_deleted = false
ORDER BY created_at DESC 
LIMIT 10;
```

---

### 4. `earnings` (HAKEDİŞ) ⭐
**Sütunlar (Tahmin):**
- `id`, `firma_id`, `tabela_group_id` (KRİTİK!)
- `donem` (YYYY-MM), `islem_hacmi_map` (JSONB)
- `toplam_islem_hacmi`, `toplam_gelir`
- `durum` ('Taslak' | 'Onaylı' | 'İptal')
- `is_deleted`, `created_at`, `updated_at`

**İçeriği görmek için:**
```sql
SELECT 
    id, firma_id, donem, tabela_group_id,
    toplam_islem_hacmi, toplam_gelir, durum
FROM earnings 
WHERE is_deleted = false
ORDER BY created_at DESC;
```

---

## 💡 JSONB SÜTUNLARIN İÇERİĞİNİ GÖRME

### Örnek 1: `signs.komisyon_oranlari`
```sql
SELECT 
    id, urun,
    komisyon_oranlari,
    komisyon_oranlari->>'taksit1' AS "Taksit 1",
    komisyon_oranlari->>'taksit3' AS "Taksit 3",
    komisyon_oranlari->>'taksit6' AS "Taksit 6"
FROM signs 
WHERE is_deleted = false 
    AND komisyon_oranlari IS NOT NULL
LIMIT 5;
```

### Örnek 2: `earnings.islem_hacmi_map`
```sql
SELECT 
    id, donem,
    islem_hacmi_map,
    islem_hacmi_map->>'taksit1' AS "Taksit 1 Hacim",
    islem_hacmi_map->>'taksit3' AS "Taksit 3 Hacim"
FROM earnings 
WHERE is_deleted = false 
    AND islem_hacmi_map IS NOT NULL
LIMIT 5;
```

### Örnek 3: `bank_accounts.tabela_records`
```sql
SELECT 
    id, adi,
    jsonb_array_length(tabela_records) AS "TABELA Sayısı",
    tabela_records
FROM bank_accounts 
WHERE is_deleted = false 
    AND tabela_records IS NOT NULL 
    AND jsonb_array_length(tabela_records) > 0
LIMIT 3;
```

---

## 🔍 BOŞTABLOLARI KONTROL ETME

```sql
-- Boş olan tüm tabloları göster
SELECT 
    relname AS "Boş Tablo",
    pg_size_pretty(pg_total_relation_size('public.' || relname)) AS "Boyut"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND n_live_tup = 0
ORDER BY relname;
```

**Sonuç:** Yeni eklenen 13 tablonun çoğu muhtemelen burada görünecek.

---

## ✅ CHECKLIST

- [ ] **EACH_TABLE_DETAILS.sql** çalıştırıldı
- [ ] 30 tablonun hepsi görüldü
- [ ] Her tablonun sütunları incelendi
- [ ] Örnek veriler görüldü
- [ ] Boş tablolar tespit edildi
- [ ] JSONB alanların içeriği kontrol edildi
- [ ] İlişkiler anlaşıldı

---

## 🎁 BONUS: TEK KOMUTTA HER ŞEYİ GÖR

```sql
-- Mega rapor: Her tablo için özet
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename
    LOOP
        RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
        RAISE NOTICE 'TABLO: %', tbl.tablename;
        RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
        
        EXECUTE format('
            SELECT 
                COUNT(*) AS kayit_sayisi,
                pg_size_pretty(pg_total_relation_size(''public.%I'')) AS boyut
            FROM %I
        ', tbl.tablename, tbl.tablename);
    END LOOP;
END $$;
```

**Not:** Bu komut `RAISE NOTICE` kullanır, sonuçlar "Messages" sekmesinde görünür.

---

## 🚀 HAZIRSINIZ!

Şimdi **EACH_TABLE_DETAILS.sql** dosyasını çalıştırın ve 30 tablonun tüm detaylarını görün!

**Hangi tabloyu önce incelemek istersiniz?** 🎯
