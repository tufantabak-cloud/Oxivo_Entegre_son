-- ========================================
-- HER TABLO TEK TEK DETAYLI ANALİZ
-- 30 Tablonun Her Biri İçin Tam Rapor
-- ========================================

-- ========================================
-- BASITLEŞTIRILMIŞ RAPOR: HER TABLO AYRI
-- ========================================

-- TABLO 1: account_items
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 1/30: account_items' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable",
    column_default AS "Default"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'account_items'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM account_items
UNION ALL
SELECT 'AKTİF KAYIT:', COUNT(*)::TEXT FROM account_items WHERE is_deleted = false;

SELECT '📊 İLK 3 KAYIT:' AS "ÖRNEK VERİLER";
SELECT * FROM account_items LIMIT 3;


-- TABLO 2: additional_revenues
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 2/30: additional_revenues' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable",
    column_default AS "Default"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'additional_revenues'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM additional_revenues
UNION ALL
SELECT 'AKTİF KAYIT:', COUNT(*)::TEXT FROM additional_revenues WHERE is_deleted = false;

SELECT '📊 İLK 3 KAYIT:' AS "ÖRNEK VERİLER";
SELECT * FROM additional_revenues LIMIT 3;


-- TABLO 3: bank_accounts
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 3/30: bank_accounts (Banka/PF)' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable",
    column_default AS "Default"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'bank_accounts'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM bank_accounts
UNION ALL
SELECT 'AKTİF KAYIT:', COUNT(*)::TEXT FROM bank_accounts WHERE is_deleted = false
UNION ALL
SELECT 'BANKA TİPİ:', COUNT(*)::TEXT FROM bank_accounts WHERE tip = 'banka' AND is_deleted = false
UNION ALL
SELECT 'PF TİPİ:', COUNT(*)::TEXT FROM bank_accounts WHERE tip = 'pf' AND is_deleted = false;

SELECT '📊 İLK 3 KAYIT:' AS "ÖRNEK VERİLER";
SELECT id, tip, adi, customer_id, aktif, created_at FROM bank_accounts WHERE is_deleted = false LIMIT 3;


-- TABLO 4: banks
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 4/30: banks (Banka Tanımları)' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'banks'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM banks
UNION ALL
SELECT 'AKTİF KAYIT:', COUNT(*)::TEXT FROM banks WHERE is_deleted = false;

SELECT '📊 TÜM BANKALAR:' AS "ÖRNEK VERİLER";
SELECT kod, adi, created_at FROM banks WHERE is_deleted = false ORDER BY adi;


-- TABLO 5: card_programs
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 5/30: card_programs (Kart Programları)' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'card_programs'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM card_programs
UNION ALL
SELECT 'AKTİF KAYIT:', COUNT(*)::TEXT FROM card_programs WHERE is_deleted = false;

SELECT '📊 TÜM KART PROGRAMLARI:' AS "ÖRNEK VERİLER";
SELECT id, adi, aciklama FROM card_programs WHERE is_deleted = false ORDER BY adi;


-- TABLO 6: categories
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 6/30: categories (Kategoriler) 🆕' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'categories'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM categories;

SELECT '📊 İLK 5 KAYIT:' AS "ÖRNEK VERİLER";
SELECT * FROM categories LIMIT 5;


-- TABLO 7: contract_audit_logs
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 7/30: contract_audit_logs (Sözleşme Logları) 🆕' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'contract_audit_logs'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM contract_audit_logs;

SELECT '📊 İLK 5 KAYIT:' AS "ÖRNEK VERİLER";
SELECT * FROM contract_audit_logs LIMIT 5;


-- TABLO 8: contract_templates
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 8/30: contract_templates (Sözleşme Şablonları) 🆕' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'contract_templates'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM contract_templates;

SELECT '📊 İLK 3 KAYIT:' AS "ÖRNEK VERİLER";
SELECT * FROM contract_templates LIMIT 3;


-- TABLO 9: contract_transaction_documents
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 9/30: contract_transaction_documents 🆕' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'contract_transaction_documents'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM contract_transaction_documents;

SELECT '📊 İLK 3 KAYIT:' AS "ÖRNEK VERİLER";
SELECT * FROM contract_transaction_documents LIMIT 3;


-- TABLO 10: contract_transactions
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 10/30: contract_transactions (Sözleşme İşlemleri) 🆕' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'contract_transactions'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM contract_transactions;

SELECT '📊 İLK 5 KAYIT:' AS "ÖRNEK VERİLER";
SELECT * FROM contract_transactions LIMIT 5;


-- TABLO 11: customer_documents
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 11/30: customer_documents (Müşteri Evrakları) 🆕' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'customer_documents'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM customer_documents;

SELECT '📊 İLK 3 KAYIT:' AS "ÖRNEK VERİLER";
SELECT * FROM customer_documents LIMIT 3;


-- TABLO 12: customers
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 12/30: customers (Müşteri Cari Kartları) ⭐ ANA' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'customers'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM customers
UNION ALL
SELECT 'AKTİF KAYIT:', COUNT(*)::TEXT FROM customers WHERE is_deleted = false
UNION ALL
SELECT 'AKTİF DURUM:', COUNT(*)::TEXT FROM customers WHERE durum = 'Aktif' AND is_deleted = false
UNION ALL
SELECT 'ASKIDA:', COUNT(*)::TEXT FROM customers WHERE durum = 'Askıda' AND is_deleted = false;

SELECT '📊 İLK 3 MÜŞTERİ:' AS "ÖRNEK VERİLER";
SELECT id, unvan, email, durum, created_at FROM customers WHERE is_deleted = false ORDER BY created_at DESC LIMIT 3;


-- TABLO 13: domain_mappings
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 13/30: domain_mappings' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'domain_mappings'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM domain_mappings;

SELECT '📊 TÜM KAYITLAR:' AS "ÖRNEK VERİLER";
SELECT * FROM domain_mappings;


-- TABLO 14: duplicate_monitoring
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 14/30: duplicate_monitoring 🆕' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'duplicate_monitoring'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM duplicate_monitoring;

SELECT '📊 İLK 5 KAYIT:' AS "ÖRNEK VERİLER";
SELECT * FROM duplicate_monitoring LIMIT 5;


-- TABLO 15: earnings
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 15/30: earnings (HAKEDİŞ) ⭐ ANA' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'earnings'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM earnings
UNION ALL
SELECT 'AKTİF KAYIT:', COUNT(*)::TEXT FROM earnings WHERE is_deleted = false
UNION ALL
SELECT 'ONAYLANAN:', COUNT(*)::TEXT FROM earnings WHERE durum = 'Onaylı' AND is_deleted = false
UNION ALL
SELECT 'TASLAK:', COUNT(*)::TEXT FROM earnings WHERE durum = 'Taslak' AND is_deleted = false;

SELECT '📊 İLK 3 HAKEDİŞ:' AS "ÖRNEK VERİLER";
SELECT id, firma_id, donem, tabela_group_id, toplam_islem_hacmi, toplam_gelir, durum 
FROM earnings WHERE is_deleted = false ORDER BY created_at DESC LIMIT 3;


-- TABLO 16: email_templates
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 16/30: email_templates 🆕' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'email_templates'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM email_templates;

SELECT '📊 İLK 3 KAYIT:' AS "ÖRNEK VERİLER";
SELECT * FROM email_templates LIMIT 3;


-- TABLO 17: epk_institutions
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 17/30: epk_institutions (EPK Tanımları)' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'epk_institutions'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM epk_institutions
UNION ALL
SELECT 'AKTİF KAYIT:', COUNT(*)::TEXT FROM epk_institutions WHERE is_deleted = false;

SELECT '📊 TÜM EPK:' AS "ÖRNEK VERİLER";
SELECT kod, adi FROM epk_institutions WHERE is_deleted = false ORDER BY adi;


-- TABLO 18: fixed_commissions
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 18/30: fixed_commissions' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'fixed_commissions'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM fixed_commissions;

SELECT '📊 İLK 3 KAYIT:' AS "ÖRNEK VERİLER";
SELECT * FROM fixed_commissions LIMIT 3;


-- TABLO 19: income_records
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 19/30: income_records (Gelir Kayıtları) 🆕' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'income_records'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM income_records;

SELECT '📊 İLK 5 KAYIT:' AS "ÖRNEK VERİLER";
SELECT * FROM income_records LIMIT 5;


-- TABLO 20: job_titles
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 20/30: job_titles (Unvanlar)' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'job_titles'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM job_titles
UNION ALL
SELECT 'AKTİF KAYIT:', COUNT(*)::TEXT FROM job_titles WHERE is_deleted = false;

SELECT '📊 TÜM UNVANLAR:' AS "ÖRNEK VERİLER";
SELECT id, unvan FROM job_titles WHERE is_deleted = false ORDER BY unvan;


-- TABLO 21: mcc_codes
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 21/30: mcc_codes (MCC Kodları)' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'mcc_codes'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM mcc_codes
UNION ALL
SELECT 'AKTİF KAYIT:', COUNT(*)::TEXT FROM mcc_codes WHERE is_deleted = false;

SELECT '📊 İLK 5 MCC:' AS "ÖRNEK VERİLER";
SELECT kod, aciklama FROM mcc_codes WHERE is_deleted = false ORDER BY kod LIMIT 5;


-- TABLO 22: ok_institutions
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 22/30: ok_institutions (OK Tanımları)' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ok_institutions'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM ok_institutions
UNION ALL
SELECT 'AKTİF KAYIT:', COUNT(*)::TEXT FROM ok_institutions WHERE is_deleted = false;

SELECT '📊 TÜM OK:' AS "ÖRNEK VERİLER";
SELECT kod, adi FROM ok_institutions WHERE is_deleted = false ORDER BY adi;


-- TABLO 23: partnerships
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 23/30: partnerships (Ortaklıklar)' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'partnerships'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM partnerships
UNION ALL
SELECT 'AKTİF KAYIT:', COUNT(*)::TEXT FROM partnerships WHERE is_deleted = false;

SELECT '📊 TÜM ORTAKLIKLAR:' AS "ÖRNEK VERİLER";
SELECT id, adi FROM partnerships WHERE is_deleted = false ORDER BY adi;


-- TABLO 24: petty_cash
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 24/30: petty_cash (Kasa) 🆕' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'petty_cash'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM petty_cash;

SELECT '📊 İLK 5 KAYIT:' AS "ÖRNEK VERİLER";
SELECT * FROM petty_cash LIMIT 5;


-- TABLO 25: products
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 25/30: products (Ürünler)' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'products'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM products
UNION ALL
SELECT 'AKTİF KAYIT:', COUNT(*)::TEXT FROM products WHERE is_deleted = false;

SELECT '📊 İLK 5 ÜRÜN:' AS "ÖRNEK VERİLER";
SELECT id, urun_adi, kategori, fiyat FROM products WHERE is_deleted = false LIMIT 5;


-- TABLO 26: revenue_models
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 26/30: revenue_models (Gelir Modelleri) 🆕' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'revenue_models'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM revenue_models;

SELECT '📊 İLK 3 KAYIT:' AS "ÖRNEK VERİLER";
SELECT * FROM revenue_models LIMIT 3;


-- TABLO 27: sales_representatives
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 27/30: sales_representatives (Satış Temsilcileri)' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sales_representatives'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM sales_representatives
UNION ALL
SELECT 'AKTİF KAYIT:', COUNT(*)::TEXT FROM sales_representatives WHERE is_deleted = false;

SELECT '📊 TÜM TEMSİLCİLER:' AS "ÖRNEK VERİLER";
SELECT id, adi FROM sales_representatives WHERE is_deleted = false ORDER BY adi;


-- TABLO 28: sharings
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 28/30: sharings (Paylaşım Oranları)' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sharings'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM sharings
UNION ALL
SELECT 'AKTİF KAYIT:', COUNT(*)::TEXT FROM sharings WHERE is_deleted = false;

SELECT '📊 TÜM PAYLAŞIMLAR:' AS "ÖRNEK VERİLER";
SELECT * FROM sharings WHERE is_deleted = false;


-- TABLO 29: signs
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 29/30: signs (TABELA) ⭐ ANA' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'signs'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM signs
UNION ALL
SELECT 'AKTİF KAYIT:', COUNT(*)::TEXT FROM signs WHERE is_deleted = false
UNION ALL
SELECT 'AKTİF ÜRÜN:', COUNT(*)::TEXT FROM signs WHERE aktif = true AND is_deleted = false;

SELECT '📊 İLK 3 TABELA:' AS "ÖRNEK VERİLER";
SELECT id, firma_id, tabela_group_id, urun, aktif, komisyon_yuzdesi 
FROM signs WHERE is_deleted = false ORDER BY created_at DESC LIMIT 3;


-- TABLO 30: sms_templates
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 30/30: sms_templates 🆕' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sms_templates'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM sms_templates;

SELECT '📊 İLK 3 KAYIT:' AS "ÖRNEK VERİLER";
SELECT * FROM sms_templates LIMIT 3;


-- BONUS: suspension_reasons (eğer varsa)
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 BONUS: suspension_reasons (Askı Nedenleri)' AS "TABLO ADI";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'suspension_reasons'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI:' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM suspension_reasons;

SELECT '📊 TÜM NEDENLER:' AS "ÖRNEK VERİLER";
SELECT * FROM suspension_reasons WHERE is_deleted = false;


-- ========================================
-- RAPOR SONU
-- ========================================
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '✅ 30 TABLONUN DETAYLI ANALİZİ TAMAMLANDI!' AS "DURUM";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
