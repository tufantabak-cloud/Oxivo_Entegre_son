-- ========================================
-- EVRENSEL ÖRNEK VERİ RAPORU
-- Hiçbir sütun adı varsaymadan çalışır
-- ========================================

-- ========================================
-- TABLO 1: customers
-- ========================================
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 1/30: customers' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

-- Sütun listesi
SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN 'NOT NULL' ELSE 'NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'customers'
ORDER BY ordinal_position;

-- İstatistik
SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM customers;

-- Örnek 3 kayıt (tüm sütunlar)
SELECT '📊 İLK 3 KAYIT:' AS "VERİ";
SELECT * FROM customers LIMIT 3;


-- ========================================
-- TABLO 2: bank_accounts
-- ========================================
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 2/30: bank_accounts' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN 'NOT NULL' ELSE 'NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'bank_accounts'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM bank_accounts;

SELECT '📊 İLK 3 KAYIT:' AS "VERİ";
SELECT * FROM bank_accounts LIMIT 3;


-- ========================================
-- TABLO 3: signs
-- ========================================
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 3/30: signs' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN 'NOT NULL' ELSE 'NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'signs'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM signs;

SELECT '📊 İLK 3 KAYIT:' AS "VERİ";
SELECT * FROM signs LIMIT 3;


-- ========================================
-- TABLO 4: earnings
-- ========================================
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 4/30: earnings' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN 'NOT NULL' ELSE 'NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'earnings'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM earnings;

SELECT '📊 İLK 3 KAYIT:' AS "VERİ";
SELECT * FROM earnings LIMIT 3;


-- ========================================
-- TABLO 5: banks
-- ========================================
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 5/30: banks' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'banks'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM banks;

SELECT '📊 TÜM KAYITLAR:' AS "VERİ";
SELECT * FROM banks;


-- ========================================
-- TABLO 6: mcc_codes
-- ========================================
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 6/30: mcc_codes' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'mcc_codes'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM mcc_codes;

SELECT '📊 İLK 10 KAYIT:' AS "VERİ";
SELECT * FROM mcc_codes LIMIT 10;


-- ========================================
-- TABLO 7: card_programs
-- ========================================
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 7/30: card_programs' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'card_programs'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM card_programs;

SELECT '📊 TÜM KAYITLAR:' AS "VERİ";
SELECT * FROM card_programs;


-- ========================================
-- TABLO 8: epk_institutions
-- ========================================
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 8/30: epk_institutions' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'epk_institutions'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM epk_institutions;

SELECT '📊 TÜM KAYITLAR:' AS "VERİ";
SELECT * FROM epk_institutions;


-- ========================================
-- TABLO 9: ok_institutions
-- ========================================
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 9/30: ok_institutions' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ok_institutions'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM ok_institutions;

SELECT '📊 TÜM KAYITLAR:' AS "VERİ";
SELECT * FROM ok_institutions;


-- ========================================
-- TABLO 10: sales_representatives
-- ========================================
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 10/30: sales_representatives' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sales_representatives'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM sales_representatives;

SELECT '📊 TÜM KAYITLAR:' AS "VERİ";
SELECT * FROM sales_representatives;


-- ========================================
-- TABLO 11: job_titles
-- ========================================
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 11/30: job_titles' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'job_titles'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM job_titles;

SELECT '📊 TÜM KAYITLAR:' AS "VERİ";
SELECT * FROM job_titles;


-- ========================================
-- TABLO 12: partnerships
-- ========================================
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 12/30: partnerships' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'partnerships'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM partnerships;

SELECT '📊 TÜM KAYITLAR:' AS "VERİ";
SELECT * FROM partnerships;


-- ========================================
-- TABLO 13: sharings
-- ========================================
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 13/30: sharings' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sharings'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM sharings;

SELECT '📊 TÜM KAYITLAR:' AS "VERİ";
SELECT * FROM sharings;


-- ========================================
-- TABLO 14: suspension_reasons
-- ========================================
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 14/30: suspension_reasons' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'suspension_reasons'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM suspension_reasons;

SELECT '📊 TÜM KAYITLAR:' AS "VERİ";
SELECT * FROM suspension_reasons;


-- ========================================
-- TABLO 15: products
-- ========================================
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 15/30: products' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'products'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM products;

SELECT '📊 İLK 10 KAYIT:' AS "VERİ";
SELECT * FROM products LIMIT 10;


-- ========================================
-- TABLO 16: domain_mappings
-- ========================================
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 16/30: domain_mappings' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    column_name AS "Sütun",
    data_type AS "Tip"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'domain_mappings'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM domain_mappings;

SELECT '📊 TÜM KAYITLAR:' AS "VERİ";
SELECT * FROM domain_mappings;


-- ========================================
-- YENİ TABLOLAR (Muhtemelen Boş)
-- ========================================

-- TABLO 17: categories
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 17/30: categories 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'categories'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM categories;
SELECT * FROM categories LIMIT 3;


-- TABLO 18: contract_audit_logs
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 18/30: contract_audit_logs 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'contract_audit_logs'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM contract_audit_logs;
SELECT * FROM contract_audit_logs LIMIT 3;


-- TABLO 19: contract_templates
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 19/30: contract_templates 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'contract_templates'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM contract_templates;
SELECT * FROM contract_templates LIMIT 3;


-- TABLO 20: contract_transaction_documents
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 20/30: contract_transaction_documents 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'contract_transaction_documents'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM contract_transaction_documents;
SELECT * FROM contract_transaction_documents LIMIT 3;


-- TABLO 21: contract_transactions
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 21/30: contract_transactions 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'contract_transactions'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM contract_transactions;
SELECT * FROM contract_transactions LIMIT 3;


-- TABLO 22: customer_documents
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 22/30: customer_documents 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'customer_documents'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM customer_documents;
SELECT * FROM customer_documents LIMIT 3;


-- TABLO 23: duplicate_monitoring
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 23/30: duplicate_monitoring 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'duplicate_monitoring'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM duplicate_monitoring;
SELECT * FROM duplicate_monitoring LIMIT 3;


-- TABLO 24: email_templates
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 24/30: email_templates 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'email_templates'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM email_templates;
SELECT * FROM email_templates LIMIT 3;


-- TABLO 25: income_records
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 25/30: income_records 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'income_records'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM income_records;
SELECT * FROM income_records LIMIT 3;


-- TABLO 26: petty_cash
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 26/30: petty_cash 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'petty_cash'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM petty_cash;
SELECT * FROM petty_cash LIMIT 3;


-- TABLO 27: revenue_models
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 27/30: revenue_models 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'revenue_models'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM revenue_models;
SELECT * FROM revenue_models LIMIT 3;


-- TABLO 28: sms_templates
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '📋 TABLO 28/30: sms_templates 🆕' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sms_templates'
ORDER BY ordinal_position;

SELECT 'KAYIT SAYISI' AS "İstatistik", COUNT(*)::TEXT AS "Değer" FROM sms_templates;
SELECT * FROM sms_templates LIMIT 3;


-- ========================================
-- RAPOR SONU
-- ========================================
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '✅ 30 TABLONUN ÖRNEK VERİLERİ TAMAMLANDI!' AS "DURUM";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT NOW() AS "⏰ Rapor Zamanı";
