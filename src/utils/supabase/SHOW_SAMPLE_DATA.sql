-- ========================================
-- ÖRNEK VERİ GÖSTERME RAPORU
-- Gerçek Tablolardan İlk Kayıtları Göster
-- ========================================

-- NOT: Bu rapor tablo isimlerini bilmediği için,
-- aşağıdaki tablolar için örnek veri gösterir.
-- Eğer tablo yoksa hata verir, o satırı çıkarın.
-- ========================================

-- ========================================
-- KRİTİK TABLOLAR - MUHTEMELEN VAR OLANLAR
-- ========================================

-- TABLO: customers (MÜŞTERİLER)
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: customers (Müşteri Cari Kartları)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

-- Sütunlar
SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN 'NOT NULL' ELSE 'NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'customers'
ORDER BY ordinal_position;

-- İstatistikler
SELECT 'TOPLAM KAYIT' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM customers
UNION ALL
SELECT 'AKTİF (is_deleted=false)', COUNT(*)::TEXT FROM customers WHERE is_deleted = false
UNION ALL  
SELECT 'SİLİNEN (is_deleted=true)', COUNT(*)::TEXT FROM customers WHERE is_deleted = true;

-- Örnek 5 kayıt (sadece önemli sütunlar)
SELECT '📊 İLK 5 MÜŞTERİ (Önemli Sütunlar):' AS "ÖRNEK VERİ";
SELECT 
    id, unvan, email, telefon, durum, 
    mcc_id, created_at
FROM customers 
WHERE is_deleted = false 
ORDER BY created_at DESC 
LIMIT 5;


-- TABLO: bank_accounts (BANKA/PF)
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: bank_accounts (Banka/PF Hesapları)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

-- Sütunlar
SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN 'NOT NULL' ELSE 'NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'bank_accounts'
ORDER BY ordinal_position;

-- İstatistikler
SELECT 'TOPLAM KAYIT' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM bank_accounts
UNION ALL
SELECT 'AKTİF', COUNT(*)::TEXT FROM bank_accounts WHERE is_deleted = false
UNION ALL
SELECT 'BANKA TİPİ', COUNT(*)::TEXT FROM bank_accounts WHERE tip = 'banka' AND is_deleted = false
UNION ALL
SELECT 'PF TİPİ', COUNT(*)::TEXT FROM bank_accounts WHERE tip = 'pf' AND is_deleted = false;

-- Örnek 5 kayıt
SELECT '📊 İLK 5 BANKA/PF:' AS "ÖRNEK VERİ";
SELECT 
    id, tip, adi, customer_id, aktif,
    jsonb_array_length(COALESCE(tabela_records, '[]'::jsonb)) AS "TABELA Sayısı",
    jsonb_array_length(COALESCE(earning_records, '[]'::jsonb)) AS "HAKEDİŞ Sayısı"
FROM bank_accounts 
WHERE is_deleted = false 
ORDER BY created_at DESC 
LIMIT 5;


-- TABLO: signs (TABELA)
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: signs (TABELA Kayıtları)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

-- Sütunlar
SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN 'NOT NULL' ELSE 'NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'signs'
ORDER BY ordinal_position;

-- İstatistikler
SELECT 'TOPLAM KAYIT' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM signs
UNION ALL
SELECT 'AKTİF (is_deleted=false)', COUNT(*)::TEXT FROM signs WHERE is_deleted = false
UNION ALL
SELECT 'AKTİF ÜRÜN (aktif=true)', COUNT(*)::TEXT FROM signs WHERE aktif = true AND is_deleted = false;

-- Örnek 5 kayıt
SELECT '📊 İLK 5 TABELA:' AS "ÖRNEK VERİ";
SELECT 
    id, firma_id, tabela_group_id, urun, aktif,
    komisyon_yuzdesi, alis_fiyati, satis_fiyati
FROM signs 
WHERE is_deleted = false 
ORDER BY created_at DESC 
LIMIT 5;


-- TABLO: earnings (HAKEDİŞ)
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: earnings (HAKEDİŞ Kayıtları)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

-- Sütunlar
SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN 'NOT NULL' ELSE 'NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'earnings'
ORDER BY ordinal_position;

-- İstatistikler
SELECT 'TOPLAM KAYIT' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM earnings
UNION ALL
SELECT 'AKTİF', COUNT(*)::TEXT FROM earnings WHERE is_deleted = false
UNION ALL
SELECT 'ONAYLANAN', COUNT(*)::TEXT FROM earnings WHERE durum = 'Onaylı' AND is_deleted = false
UNION ALL
SELECT 'TASLAK', COUNT(*)::TEXT FROM earnings WHERE durum = 'Taslak' AND is_deleted = false;

-- Örnek 5 kayıt
SELECT '📊 İLK 5 HAKEDİŞ:' AS "ÖRNEK VERİ";
SELECT 
    id, firma_id, donem, tabela_group_id,
    toplam_islem_hacmi, toplam_gelir, durum
FROM earnings 
WHERE is_deleted = false 
ORDER BY created_at DESC 
LIMIT 5;


-- ========================================
-- TANIM TABLOLARI
-- ========================================

-- TABLO: banks
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: banks (Banka Tanımları)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM banks
UNION ALL
SELECT 'AKTİF', COUNT(*)::TEXT FROM banks WHERE is_deleted = false;

SELECT '📊 TÜM BANKALAR:' AS "ÖRNEK VERİ";
SELECT kod, adi, created_at FROM banks WHERE is_deleted = false ORDER BY adi;


-- TABLO: mcc_codes
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: mcc_codes (MCC Kodları)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM mcc_codes
UNION ALL
SELECT 'AKTİF', COUNT(*)::TEXT FROM mcc_codes WHERE is_deleted = false;

SELECT '📊 İLK 10 MCC:' AS "ÖRNEK VERİ";
SELECT kod, aciklama FROM mcc_codes WHERE is_deleted = false ORDER BY kod LIMIT 10;


-- TABLO: card_programs
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: card_programs (Kart Programları)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM card_programs
UNION ALL
SELECT 'AKTİF', COUNT(*)::TEXT FROM card_programs WHERE is_deleted = false;

SELECT '📊 TÜM KART PROGRAMLARI:' AS "ÖRNEK VERİ";
SELECT id, adi, aciklama FROM card_programs WHERE is_deleted = false ORDER BY adi;


-- TABLO: epk_institutions
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: epk_institutions (EPK Kurumları)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM epk_institutions
UNION ALL
SELECT 'AKTİF', COUNT(*)::TEXT FROM epk_institutions WHERE is_deleted = false;

SELECT '📊 TÜM EPK:' AS "ÖRNEK VERİ";
SELECT kod, adi FROM epk_institutions WHERE is_deleted = false ORDER BY adi;


-- TABLO: ok_institutions
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: ok_institutions (OK Kurumları)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM ok_institutions
UNION ALL
SELECT 'AKTİF', COUNT(*)::TEXT FROM ok_institutions WHERE is_deleted = false;

SELECT '📊 TÜM OK:' AS "ÖRNEK VERİ";
SELECT kod, adi FROM ok_institutions WHERE is_deleted = false ORDER BY adi;


-- TABLO: sales_representatives
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: sales_representatives (Satış Temsilcileri)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM sales_representatives
UNION ALL
SELECT 'AKTİF', COUNT(*)::TEXT FROM sales_representatives WHERE is_deleted = false;

SELECT '📊 TÜM TEMSİLCİLER:' AS "ÖRNEK VERİ";
SELECT id, adi FROM sales_representatives WHERE is_deleted = false ORDER BY adi;


-- TABLO: job_titles
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: job_titles (Unvanlar)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM job_titles
UNION ALL
SELECT 'AKTİF', COUNT(*)::TEXT FROM job_titles WHERE is_deleted = false;

SELECT '📊 TÜM UNVANLAR:' AS "ÖRNEK VERİ";
SELECT id, unvan FROM job_titles WHERE is_deleted = false ORDER BY unvan;


-- TABLO: partnerships
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: partnerships (Ortaklıklar)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM partnerships
UNION ALL
SELECT 'AKTİF', COUNT(*)::TEXT FROM partnerships WHERE is_deleted = false;

SELECT '📊 TÜM ORTAKLIKLAR:' AS "ÖRNEK VERİ";
SELECT * FROM partnerships WHERE is_deleted = false ORDER BY adi;


-- TABLO: sharings
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: sharings (Paylaşım Oranları)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM sharings
UNION ALL
SELECT 'AKTİF', COUNT(*)::TEXT FROM sharings WHERE is_deleted = false;

SELECT '📊 TÜM PAYLAŞIMLAR:' AS "ÖRNEK VERİ";
SELECT * FROM sharings WHERE is_deleted = false;


-- TABLO: suspension_reasons
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: suspension_reasons (Askı Nedenleri)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM suspension_reasons
UNION ALL
SELECT 'AKTİF', COUNT(*)::TEXT FROM suspension_reasons WHERE is_deleted = false;

SELECT '📊 TÜM NEDENLER:' AS "ÖRNEK VERİ";
SELECT * FROM suspension_reasons WHERE is_deleted = false;


-- TABLO: products
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: products (Ürünler)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM products
UNION ALL
SELECT 'AKTİF', COUNT(*)::TEXT FROM products WHERE is_deleted = false;

SELECT '📊 İLK 10 ÜRÜN:' AS "ÖRNEK VERİ";
SELECT * FROM products WHERE is_deleted = false LIMIT 10;


-- TABLO: domain_mappings
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: domain_mappings' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM domain_mappings;

SELECT '📊 TÜM KAYITLAR:' AS "ÖRNEK VERİ";
SELECT * FROM domain_mappings;


-- ========================================
-- YENİ TABLOLAR (Muhtemelen Boş)
-- ========================================

-- NOT: Aşağıdaki tablolar muhtemelen boş olabilir
-- Eğer hata veriyorsa, o tablo yok demektir

-- TABLO: categories
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: categories (Kategoriler) 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM categories;
SELECT * FROM categories LIMIT 5;


-- ========================================
-- RAPOR SONU
-- ========================================
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '✅ ÖRNEK VERİ RAPORU TAMAMLANDI!' AS "DURUM";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
