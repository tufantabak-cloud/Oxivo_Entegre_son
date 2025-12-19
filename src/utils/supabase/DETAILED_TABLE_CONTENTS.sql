-- ========================================
-- DETAYLI TABLO İÇERİKLERİ RAPORU
-- Her Tablonun Sütunları, Verileri ve Özellikleri
-- ========================================
-- Tarih: 15 Aralık 2024
-- Toplam Tablo: 30
-- ========================================

-- ========================================
-- RAPOR BAŞLANGIÇ
-- ========================================
SELECT '🎯 DETAYLI TABLO İÇERİKLERİ RAPORU BAŞLIYOR...' AS "DURUM";

-- ========================================
-- HER TABLO İÇİN DETAYLI RAPOR
-- Bu bölüm her tablo için:
-- 1. Sütun listesi
-- 2. Örnek 5 kayıt
-- 3. İlişkiler
-- 4. JSONB yapıları
-- ========================================

-- ŞABLON: Her tablo için aşağıdaki yapıyı tekrarlayın
-- ========================================

DO $$
DECLARE
    tbl_name TEXT;
    tbl_count INTEGER;
    col_count INTEGER;
    has_jsonb BOOLEAN;
    has_soft_delete BOOLEAN;
BEGIN
    -- Geçici rapor tablosu oluştur
    DROP TABLE IF EXISTS temp_table_report;
    CREATE TEMP TABLE temp_table_report (
        section_order INTEGER,
        table_name TEXT,
        report_section TEXT,
        report_content TEXT
    );

    -- Her tablo için rapor oluştur
    FOR tbl_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        -- Tablo istatistikleri
        SELECT 
            COALESCE(n_live_tup, 0),
            (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl_name),
            EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl_name AND data_type = 'jsonb'),
            EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl_name AND column_name = 'is_deleted')
        INTO tbl_count, col_count, has_jsonb, has_soft_delete
        FROM pg_stat_user_tables
        WHERE schemaname = 'public' AND relname = tbl_name;

        -- Rapor başlığı
        INSERT INTO temp_table_report VALUES (
            1,
            tbl_name,
            'BAŞLIK',
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        );
        
        INSERT INTO temp_table_report VALUES (
            2,
            tbl_name,
            'TABLO ADI',
            '📋 TABLO: ' || UPPER(tbl_name)
        );
        
        INSERT INTO temp_table_report VALUES (
            3,
            tbl_name,
            'İSTATİSTİK',
            '🔢 Kayıt Sayısı: ' || tbl_count || ' | 🏷️ Sütun Sayısı: ' || col_count || 
            ' | 📊 JSONB: ' || CASE WHEN has_jsonb THEN '✅' ELSE '❌' END ||
            ' | 🗑️ Soft Delete: ' || CASE WHEN has_soft_delete THEN '✅' ELSE '❌' END
        );
        
        INSERT INTO temp_table_report VALUES (
            4,
            tbl_name,
            'SEPERATÖRCopyright',
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        );
    END LOOP;
    
    RAISE NOTICE 'Rapor hazırlandı!';
END $$;

-- Rapor çıktısı
SELECT 
    report_content AS "📊 DETAYLI RAPOR"
FROM temp_table_report
ORDER BY table_name, section_order;


-- ========================================
-- BÖLÜM 1: TÜM TABLOLARIN SÜTUN LİSTESİ
-- ========================================
SELECT 
    '📋 BÖLÜM 1: TÜM TABLOLARIN SÜTUN LİSTESİ' AS "RAPOR BÖLÜMÜ";

SELECT 
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' AS "AYRAC",
    table_name AS "📋 TABLO",
    STRING_AGG(
        column_name || ' (' || data_type || 
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.key_column_usage kcu
                JOIN information_schema.table_constraints tc 
                    ON tc.constraint_name = kcu.constraint_name
                WHERE tc.constraint_type = 'PRIMARY KEY'
                    AND kcu.table_schema = 'public'
                    AND kcu.table_name = c.table_name
                    AND kcu.column_name = c.column_name
            ) THEN ' 🔑 PK'
            ELSE ''
        END ||
        ')',
        E'\n    '
        ORDER BY ordinal_position
    ) AS "🏷️ SÜTUNLAR"
FROM information_schema.columns c
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;


-- ========================================
-- BÖLÜM 2: HER TABLO İÇİN İLK 5 KAYIT
-- ========================================
SELECT 
    '📊 BÖLÜM 2: HER TABLO İÇİN ÖRNEK VERİLER (İlk 5 Kayıt)' AS "RAPOR BÖLÜMÜ";

-- NOT: Bu kısım her tablo için dinamik olarak çalıştırılmalı
-- Örnek: account_items tablosu
SELECT '━━━━ TABLO: account_items ━━━━' AS "BAŞLIK";
SELECT * FROM account_items LIMIT 5;

SELECT '━━━━ TABLO: additional_revenues ━━━━' AS "BAŞLIK";
SELECT * FROM additional_revenues LIMIT 5;

SELECT '━━━━ TABLO: bank_accounts ━━━━' AS "BAŞLIK";
SELECT * FROM bank_accounts LIMIT 5;

SELECT '━━━━ TABLO: banks ━━━━' AS "BAŞLIK";
SELECT * FROM banks LIMIT 5;

SELECT '━━━━ TABLO: card_programs ━━━━' AS "BAŞLIK";
SELECT * FROM card_programs LIMIT 5;

SELECT '━━━━ TABLO: categories ━━━━' AS "BAŞLIK";
SELECT * FROM categories LIMIT 5;

SELECT '━━━━ TABLO: contract_audit_logs ━━━━' AS "BAŞLIK";
SELECT * FROM contract_audit_logs LIMIT 5;

SELECT '━━━━ TABLO: contract_templates ━━━━' AS "BAŞLIK";
SELECT * FROM contract_templates LIMIT 5;

SELECT '━━━━ TABLO: contract_transaction_documents ━━━━' AS "BAŞLIK";
SELECT * FROM contract_transaction_documents LIMIT 5;

SELECT '━━━━ TABLO: contract_transactions ━━━━' AS "BAŞLIK";
SELECT * FROM contract_transactions LIMIT 5;

SELECT '━━━━ TABLO: customer_documents ━━━━' AS "BAŞLIK";
SELECT * FROM customer_documents LIMIT 5;

SELECT '━━━━ TABLO: customers ━━━━' AS "BAŞLIK";
SELECT * FROM customers LIMIT 5;

SELECT '━━━━ TABLO: domain_mappings ━━━━' AS "BAŞLIK";
SELECT * FROM domain_mappings LIMIT 5;

SELECT '━━━━ TABLO: duplicate_monitoring ━━━━' AS "BAŞLIK";
SELECT * FROM duplicate_monitoring LIMIT 5;

SELECT '━━━━ TABLO: earnings ━━━━' AS "BAŞLIK";
SELECT * FROM earnings LIMIT 5;

SELECT '━━━━ TABLO: email_templates ━━━━' AS "BAŞLIK";
SELECT * FROM email_templates LIMIT 5;

SELECT '━━━━ TABLO: epk_institutions ━━━━' AS "BAŞLIK";
SELECT * FROM epk_institutions LIMIT 5;

SELECT '━━━━ TABLO: fixed_commissions ━━━━' AS "BAŞLIK";
SELECT * FROM fixed_commissions LIMIT 5;

SELECT '━━━━ TABLO: income_records ━━━━' AS "BAŞLIK";
SELECT * FROM income_records LIMIT 5;

SELECT '━━━━ TABLO: job_titles ━━━━' AS "BAŞLIK";
SELECT * FROM job_titles LIMIT 5;

SELECT '━━━━ TABLO: mcc_codes ━━━━' AS "BAŞLIK";
SELECT * FROM mcc_codes LIMIT 5;

SELECT '━━━━ TABLO: ok_institutions ━━━━' AS "BAŞLIK";
SELECT * FROM ok_institutions LIMIT 5;

SELECT '━━━━ TABLO: partnerships ━━━━' AS "BAŞLIK";
SELECT * FROM partnerships LIMIT 5;

SELECT '━━━━ TABLO: petty_cash ━━━━' AS "BAŞLIK";
SELECT * FROM petty_cash LIMIT 5;

SELECT '━━━━ TABLO: products ━━━━' AS "BAŞLIK";
SELECT * FROM products LIMIT 5;

SELECT '━━━━ TABLO: revenue_models ━━━━' AS "BAŞLIK";
SELECT * FROM revenue_models LIMIT 5;

SELECT '━━━━ TABLO: sales_representatives ━━━━' AS "BAŞLIK";
SELECT * FROM sales_representatives LIMIT 5;

SELECT '━━━━ TABLO: sharings ━━━━' AS "BAŞLIK";
SELECT * FROM sharings LIMIT 5;

SELECT '━━━━ TABLO: signs ━━━━' AS "BAŞLIK";
SELECT * FROM signs LIMIT 5;

SELECT '━━━━ TABLO: sms_templates ━━━━' AS "BAŞLIK";
SELECT * FROM sms_templates LIMIT 5;

SELECT '━━━━ TABLO: suspension_reasons ━━━━' AS "BAŞLIK";
SELECT * FROM suspension_reasons LIMIT 5;


-- ========================================
-- BÖLÜM 3: JSONB SÜTUNLARIN İÇERİĞİ
-- ========================================
SELECT 
    '📊 BÖLÜM 3: JSONB SÜTUNLARIN ÖRNEK İÇERİĞİ' AS "RAPOR BÖLÜMÜ";

-- bank_accounts tablosu JSONB
SELECT '━━━━ JSONB: bank_accounts ━━━━' AS "BAŞLIK";
SELECT 
    id,
    adi,
    bank_pf_ids,
    tabela_records,
    earning_records
FROM bank_accounts 
WHERE (bank_pf_ids IS NOT NULL AND bank_pf_ids::text != '[]')
   OR (tabela_records IS NOT NULL AND tabela_records::text != '[]')
   OR (earning_records IS NOT NULL AND earning_records::text != '[]')
LIMIT 3;

-- customers tablosu JSONB
SELECT '━━━━ JSONB: customers ━━━━' AS "BAŞLIK";
SELECT 
    id,
    unvan,
    bank_pf_ids
FROM customers 
WHERE bank_pf_ids IS NOT NULL AND bank_pf_ids::text != '[]'
LIMIT 3;

-- signs tablosu JSONB
SELECT '━━━━ JSONB: signs ━━━━' AS "BAŞLIK";
SELECT 
    id,
    urun,
    kart_program_ids,
    bank_ids,
    gelir_modeli,
    komisyon_oranlari,
    paylasim_oranlari
FROM signs 
WHERE is_deleted = false
LIMIT 3;

-- earnings tablosu JSONB
SELECT '━━━━ JSONB: earnings ━━━━' AS "BAŞLIK";
SELECT 
    id,
    donem,
    islem_hacmi_map,
    toplam_islem_hacmi,
    toplam_gelir
FROM earnings 
WHERE is_deleted = false
LIMIT 3;


-- ========================================
-- BÖLÜM 4: TABLO İLİŞKİLERİ (Her Tablo İçin)
-- ========================================
SELECT 
    '🔗 BÖLÜM 4: TABLO İLİŞKİLERİ (Foreign Keys)' AS "RAPOR BÖLÜMÜ";

SELECT 
    tc.table_name AS "📋 Ana Tablo",
    STRING_AGG(
        kcu.column_name || ' → ' || ccu.table_name || '.' || ccu.column_name,
        E'\n    '
        ORDER BY kcu.column_name
    ) AS "🔗 Foreign Key İlişkileri"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
GROUP BY tc.table_name
ORDER BY tc.table_name;


-- ========================================
-- BÖLÜM 5: BOŞ OLMAYAN TABLOLAR
-- ========================================
SELECT 
    '📊 BÖLÜM 5: BOŞ OLMAYAN TABLOLAR (Aktif Kullanımda)' AS "RAPOR BÖLÜMÜ";

SELECT 
    relname AS "📋 Tablo",
    n_live_tup AS "🔢 Kayıt Sayısı",
    pg_size_pretty(pg_total_relation_size('public.' || relname)) AS "💾 Boyut",
    CASE 
        WHEN n_live_tup = 0 THEN '🔴 BOŞ'
        WHEN n_live_tup < 10 THEN '🟡 AZ VERİ'
        WHEN n_live_tup < 100 THEN '🟢 NORMAL'
        ELSE '🟣 YÜKSEK'
    END AS "📊 Durum"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;


-- ========================================
-- BÖLÜM 6: HER TABLONUN PRIMARY KEY'İ
-- ========================================
SELECT 
    '🔑 BÖLÜM 6: PRIMARY KEY TANIMLARI' AS "RAPOR BÖLÜMÜ";

SELECT 
    tc.table_name AS "📋 Tablo",
    STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS "🔑 Primary Key Sütunlar",
    tc.constraint_name AS "🏷️ Constraint Adı"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
    AND tc.constraint_type = 'PRIMARY KEY'
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name;


-- ========================================
-- BÖLÜM 7: HER TABLONUN VERİ TİPİ DAĞILIMI
-- ========================================
SELECT 
    '📦 BÖLÜM 7: VERİ TİPİ DAĞILIMI' AS "RAPOR BÖLÜMÜ";

SELECT 
    table_name AS "📋 Tablo",
    data_type AS "📦 Veri Tipi",
    COUNT(*) AS "🔢 Sütun Sayısı",
    STRING_AGG(column_name, ', ' ORDER BY column_name) AS "🏷️ Sütunlar"
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name, data_type
ORDER BY table_name, COUNT(*) DESC;


-- ========================================
-- BÖLÜM 8: TIMESTAMP SÜTUNLARI
-- ========================================
SELECT 
    '⏰ BÖLÜM 8: TIMESTAMP SÜTUNLARI' AS "RAPOR BÖLÜMÜ";

SELECT 
    table_name AS "📋 Tablo",
    column_name AS "⏰ Timestamp Sütun",
    column_default AS "🔧 Default Değer",
    CASE 
        WHEN column_name = 'created_at' THEN '🆕 Oluşturma'
        WHEN column_name = 'updated_at' THEN '🔄 Güncelleme'
        WHEN column_name = 'deleted_at' THEN '🗑️ Silme'
        ELSE '📅 Diğer'
    END AS "💡 Amaç"
FROM information_schema.columns
WHERE table_schema = 'public'
    AND (data_type LIKE '%timestamp%' OR data_type = 'date')
ORDER BY table_name, 
    CASE 
        WHEN column_name = 'created_at' THEN 1
        WHEN column_name = 'updated_at' THEN 2
        WHEN column_name = 'deleted_at' THEN 3
        ELSE 4
    END;


-- ========================================
-- RAPOR SONU
-- ========================================
SELECT 
    '✅ DETAYLI TABLO İÇERİKLERİ RAPORU TAMAMLANDI' AS "DURUM",
    NOW() AS "⏰ Rapor Zamanı",
    CURRENT_USER AS "👤 Kullanıcı",
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') AS "📊 Toplam Tablo",
    (SELECT SUM(n_live_tup) FROM pg_stat_user_tables WHERE schemaname = 'public') AS "🔢 Toplam Kayıt";
