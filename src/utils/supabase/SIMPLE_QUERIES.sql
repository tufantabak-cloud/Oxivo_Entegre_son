-- ========================================
-- HER TABLO İÇİN BASİT SORGULAR
-- Her sorguyu TEK TEK çalıştırın
-- ========================================

-- ========================================
-- GENEL BAKIŞ: TÜM TABLOLAR VE KAYIT SAYILARI
-- ========================================
-- Bu sorguyu ÖNCE çalıştırın:

SELECT 
    ROW_NUMBER() OVER (ORDER BY tablename) AS "#",
    tablename AS "📋 Tablo",
    COALESCE(s.n_live_tup, 0) AS "🔢 Kayıt",
    (SELECT COUNT(*) FROM information_schema.columns c 
     WHERE c.table_schema = 'public' AND c.table_name = t.tablename) AS "🏷️ Sütun",
    pg_size_pretty(pg_total_relation_size('public.' || t.tablename)) AS "💾 Boyut",
    CASE 
        WHEN COALESCE(s.n_live_tup, 0) = 0 THEN '🔴 BOŞ'
        WHEN COALESCE(s.n_live_tup, 0) < 10 THEN '🟡 AZ'
        WHEN COALESCE(s.n_live_tup, 0) < 100 THEN '🟢 ORTA'
        ELSE '🟣 ÇOK'
    END AS "📊 Durum"
FROM pg_tables t
LEFT JOIN pg_stat_user_tables s 
    ON s.schemaname = t.schemaname 
    AND s.relname = t.tablename
WHERE t.schemaname = 'public'
ORDER BY tablename;


-- ========================================
-- SONRA, İSTEDİĞİNİZ TABLOYU İNCELEYİN:
-- Aşağıdaki sorguları TEK TEK kopyalayıp çalıştırın
-- ========================================


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLO: customers
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. Sütunları gör:
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'customers'
ORDER BY ordinal_position;

-- 2. İlk 5 kaydı gör:
SELECT * FROM customers LIMIT 5;

-- 3. Toplam kayıt:
SELECT COUNT(*) FROM customers;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLO: bank_accounts
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. Sütunları gör:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'bank_accounts'
ORDER BY ordinal_position;

-- 2. İlk 5 kaydı gör:
SELECT * FROM bank_accounts LIMIT 5;

-- 3. Toplam kayıt:
SELECT COUNT(*) FROM bank_accounts;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLO: signs
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. Sütunları gör:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'signs'
ORDER BY ordinal_position;

-- 2. İlk 5 kaydı gör:
SELECT * FROM signs LIMIT 5;

-- 3. Toplam kayıt:
SELECT COUNT(*) FROM signs;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLO: earnings
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. Sütunları gör:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'earnings'
ORDER BY ordinal_position;

-- 2. İlk 5 kaydı gör:
SELECT * FROM earnings LIMIT 5;

-- 3. Toplam kayıt:
SELECT COUNT(*) FROM earnings;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLO: banks
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'banks'
ORDER BY ordinal_position;

SELECT * FROM banks;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLO: mcc_codes
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'mcc_codes'
ORDER BY ordinal_position;

SELECT * FROM mcc_codes LIMIT 10;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLO: card_programs
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'card_programs'
ORDER BY ordinal_position;

SELECT * FROM card_programs;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLO: epk_institutions
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'epk_institutions'
ORDER BY ordinal_position;

SELECT * FROM epk_institutions;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLO: ok_institutions
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ok_institutions'
ORDER BY ordinal_position;

SELECT * FROM ok_institutions;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLO: sales_representatives
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sales_representatives'
ORDER BY ordinal_position;

SELECT * FROM sales_representatives;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLO: job_titles
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'job_titles'
ORDER BY ordinal_position;

SELECT * FROM job_titles;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLO: partnerships
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'partnerships'
ORDER BY ordinal_position;

SELECT * FROM partnerships;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLO: sharings
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sharings'
ORDER BY ordinal_position;

SELECT * FROM sharings;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLO: suspension_reasons
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'suspension_reasons'
ORDER BY ordinal_position;

SELECT * FROM suspension_reasons;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLO: products
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'products'
ORDER BY ordinal_position;

SELECT * FROM products LIMIT 10;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLO: domain_mappings
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'domain_mappings'
ORDER BY ordinal_position;

SELECT * FROM domain_mappings;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- YENİ TABLOLAR (Muhtemelen Boş)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- categories
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'categories'
ORDER BY ordinal_position;
SELECT * FROM categories LIMIT 3;

-- contract_audit_logs
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'contract_audit_logs'
ORDER BY ordinal_position;
SELECT * FROM contract_audit_logs LIMIT 3;

-- contract_templates
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'contract_templates'
ORDER BY ordinal_position;
SELECT * FROM contract_templates LIMIT 3;

-- contract_transaction_documents
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'contract_transaction_documents'
ORDER BY ordinal_position;
SELECT * FROM contract_transaction_documents LIMIT 3;

-- contract_transactions
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'contract_transactions'
ORDER BY ordinal_position;
SELECT * FROM contract_transactions LIMIT 3;

-- customer_documents
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'customer_documents'
ORDER BY ordinal_position;
SELECT * FROM customer_documents LIMIT 3;

-- duplicate_monitoring
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'duplicate_monitoring'
ORDER BY ordinal_position;
SELECT * FROM duplicate_monitoring LIMIT 3;

-- email_templates
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'email_templates'
ORDER BY ordinal_position;
SELECT * FROM email_templates LIMIT 3;

-- income_records
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'income_records'
ORDER BY ordinal_position;
SELECT * FROM income_records LIMIT 3;

-- petty_cash
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'petty_cash'
ORDER BY ordinal_position;
SELECT * FROM petty_cash LIMIT 3;

-- revenue_models
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'revenue_models'
ORDER BY ordinal_position;
SELECT * FROM revenue_models LIMIT 3;

-- sms_templates
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sms_templates'
ORDER BY ordinal_position;
SELECT * FROM sms_templates LIMIT 3;
