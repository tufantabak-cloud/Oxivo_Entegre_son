-- ========================================
-- ÖRNEK VERİ GÖSTERME RAPORU (DÜZELTİLMİŞ)
-- is_deleted sütunu KALDIRILDI
-- ========================================

-- ========================================
-- KRİTİK TABLOLAR
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
SELECT 'TOPLAM KAYIT' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM customers;

-- Örnek 5 kayıt
SELECT '📊 İLK 5 MÜŞTERİ:' AS "ÖRNEK VERİ";
SELECT * FROM customers ORDER BY created_at DESC LIMIT 5;


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
SELECT 'BANKA TİPİ', COUNT(*)::TEXT FROM bank_accounts WHERE tip = 'banka'
UNION ALL
SELECT 'PF TİPİ', COUNT(*)::TEXT FROM bank_accounts WHERE tip = 'pf';

-- Örnek 5 kayıt (sadece önemli sütunlar)
SELECT '📊 İLK 5 BANKA/PF (Önemli Sütunlar):' AS "ÖRNEK VERİ";
SELECT 
    id, tip, adi, customer_id, aktif,
    CASE 
        WHEN tabela_records IS NOT NULL THEN jsonb_array_length(tabela_records)
        ELSE 0
    END AS "TABELA Sayısı",
    CASE 
        WHEN earning_records IS NOT NULL THEN jsonb_array_length(earning_records)
        ELSE 0
    END AS "HAKEDİŞ Sayısı"
FROM bank_accounts 
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
SELECT 'AKTİF ÜRÜN (aktif=true)', COUNT(*)::TEXT FROM signs WHERE aktif = true;

-- Örnek 5 kayıt (önemli sütunlar)
SELECT '📊 İLK 5 TABELA:' AS "ÖRNEK VERİ";
SELECT 
    id, firma_id, tabela_group_id, urun, aktif,
    komisyon_yuzdesi, alis_fiyati, satis_fiyati
FROM signs 
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
SELECT 'ONAYLANAN (durum=Onaylı)', COUNT(*)::TEXT FROM earnings WHERE durum = 'Onaylı'
UNION ALL
SELECT 'TASLAK (durum=Taslak)', COUNT(*)::TEXT FROM earnings WHERE durum = 'Taslak';

-- Örnek 5 kayıt
SELECT '📊 İLK 5 HAKEDİŞ:' AS "ÖRNEK VERİ";
SELECT 
    id, firma_id, donem, tabela_group_id,
    toplam_islem_hacmi, toplam_gelir, durum
FROM earnings 
ORDER BY created_at DESC 
LIMIT 5;


-- ========================================
-- TANIM TABLOLARI
-- ========================================

-- TABLO: banks
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: banks (Banka Tanımları)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM banks;

SELECT '📊 TÜM BANKALAR:' AS "ÖRNEK VERİ";
SELECT * FROM banks ORDER BY adi;


-- TABLO: mcc_codes
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: mcc_codes (MCC Kodları)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM mcc_codes;

SELECT '📊 İLK 10 MCC:' AS "ÖRNEK VERİ";
SELECT * FROM mcc_codes ORDER BY kod LIMIT 10;


-- TABLO: card_programs
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: card_programs (Kart Programları)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM card_programs;

SELECT '📊 TÜM KART PROGRAMLARI:' AS "ÖRNEK VERİ";
SELECT * FROM card_programs ORDER BY adi;


-- TABLO: epk_institutions
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: epk_institutions (EPK Kurumları)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM epk_institutions;

SELECT '📊 TÜM EPK:' AS "ÖRNEK VERİ";
SELECT * FROM epk_institutions ORDER BY adi;


-- TABLO: ok_institutions
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: ok_institutions (OK Kurumları)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM ok_institutions;

SELECT '📊 TÜM OK:' AS "ÖRNEK VERİ";
SELECT * FROM ok_institutions ORDER BY adi;


-- TABLO: sales_representatives
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: sales_representatives (Satış Temsilcileri)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM sales_representatives;

SELECT '📊 TÜM TEMSİLCİLER:' AS "ÖRNEK VERİ";
SELECT * FROM sales_representatives ORDER BY adi;


-- TABLO: job_titles
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: job_titles (Unvanlar)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM job_titles;

SELECT '📊 TÜM UNVANLAR:' AS "ÖRNEK VERİ";
SELECT * FROM job_titles ORDER BY unvan;


-- TABLO: partnerships
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: partnerships (Ortaklıklar)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM partnerships;

SELECT '📊 TÜM ORTAKLIKLAR:' AS "ÖRNEK VERİ";
SELECT * FROM partnerships ORDER BY adi;


-- TABLO: sharings
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: sharings (Paylaşım Oranları)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM sharings;

SELECT '📊 TÜM PAYLAŞIMLAR:' AS "ÖRNEK VERİ";
SELECT * FROM sharings;


-- TABLO: suspension_reasons
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: suspension_reasons (Askı Nedenleri)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM suspension_reasons;

SELECT '📊 TÜM NEDENLER:' AS "ÖRNEK VERİ";
SELECT * FROM suspension_reasons;


-- TABLO: products
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: products (Ürünler)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM products;

SELECT '📊 İLK 10 ÜRÜN:' AS "ÖRNEK VERİ";
SELECT * FROM products ORDER BY created_at DESC LIMIT 10;


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

-- TABLO: categories
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: categories (Kategoriler) 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM categories;
SELECT * FROM categories LIMIT 5;


-- TABLO: contract_audit_logs
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: contract_audit_logs 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM contract_audit_logs;
SELECT * FROM contract_audit_logs LIMIT 5;


-- TABLO: contract_templates
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: contract_templates 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM contract_templates;
SELECT * FROM contract_templates LIMIT 3;


-- TABLO: contract_transaction_documents
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: contract_transaction_documents 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM contract_transaction_documents;
SELECT * FROM contract_transaction_documents LIMIT 3;


-- TABLO: contract_transactions
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: contract_transactions 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM contract_transactions;
SELECT * FROM contract_transactions LIMIT 5;


-- TABLO: customer_documents
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: customer_documents 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM customer_documents;
SELECT * FROM customer_documents LIMIT 3;


-- TABLO: duplicate_monitoring
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: duplicate_monitoring 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM duplicate_monitoring;
SELECT * FROM duplicate_monitoring LIMIT 5;


-- TABLO: email_templates
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: email_templates 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM email_templates;
SELECT * FROM email_templates LIMIT 3;


-- TABLO: income_records
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: income_records 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM income_records;
SELECT * FROM income_records LIMIT 5;


-- TABLO: petty_cash
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: petty_cash 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM petty_cash;
SELECT * FROM petty_cash LIMIT 5;


-- TABLO: revenue_models
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: revenue_models 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM revenue_models;
SELECT * FROM revenue_models LIMIT 3;


-- TABLO: sms_templates
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO: sms_templates 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 'KAYIT SAYISI' AS "Metrik", COUNT(*)::TEXT AS "Değer" FROM sms_templates;
SELECT * FROM sms_templates LIMIT 3;


-- ========================================
-- RAPOR SONU
-- ========================================
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '✅ ÖRNEK VERİ RAPORU TAMAMLANDI!' AS "DURUM";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    'Rapor Zamanı' AS "Bilgi",
    NOW()::TEXT AS "Değer"
UNION ALL
SELECT 
    'İncelenen Tablo Sayısı',
    '30'::TEXT;
