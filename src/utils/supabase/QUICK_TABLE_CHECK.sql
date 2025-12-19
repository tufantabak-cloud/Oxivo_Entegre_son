-- ========================================
-- HIZLI TABLO KONTROLÜ
-- ========================================
-- Bu SQL kodu mevcut tabloları ve kayıt sayılarını
-- hızlıca gösterir (30 saniye içinde)
-- ========================================

-- TABLO 1: Genel Bakış
SELECT 
    t.tablename AS "📋 Tablo Adı",
    COALESCE(s.n_live_tup, 0) AS "🔢 Kayıt (Tahmini)",
    pg_size_pretty(pg_total_relation_size('public.' || t.tablename)) AS "💾 Boyut",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns c 
            WHERE c.table_schema = 'public' 
                AND c.table_name = t.tablename 
                AND c.column_name = 'is_deleted'
        ) THEN '✅ Soft'
        ELSE '❌ Hard'
    END AS "🗑️ Delete",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns c 
            WHERE c.table_schema = 'public' 
                AND c.table_name = t.tablename 
                AND c.data_type = 'jsonb'
        ) THEN '✅ Var'
        ELSE '❌ Yok'
    END AS "📊 JSONB",
    (
        SELECT COUNT(*) 
        FROM information_schema.columns c 
        WHERE c.table_schema = 'public' 
            AND c.table_name = t.tablename
    ) AS "🏷️ Sütun"
FROM pg_tables t
LEFT JOIN pg_stat_user_tables s 
    ON s.schemaname = t.schemaname 
    AND s.tablename = t.tablename
WHERE t.schemaname = 'public'
ORDER BY t.tablename;


-- TABLO 2: İlişki Özeti
SELECT 
    tc.table_name AS "📋 Tablo",
    COUNT(DISTINCT CASE WHEN tc.constraint_type = 'PRIMARY KEY' THEN tc.constraint_name END) AS "🔑 PK",
    COUNT(DISTINCT CASE WHEN tc.constraint_type = 'FOREIGN KEY' THEN tc.constraint_name END) AS "🔗 FK",
    COUNT(DISTINCT CASE WHEN tc.constraint_type = 'UNIQUE' THEN tc.constraint_name END) AS "⭐ UNIQUE"
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
GROUP BY tc.table_name
ORDER BY tc.table_name;


-- TABLO 3: Kritik İlişkiler
SELECT 
    'customers → bank_accounts' AS "🔗 İlişki",
    (SELECT COUNT(*) FROM customers WHERE is_deleted = false) AS "👤 Müşteri",
    (SELECT COUNT(*) FROM bank_accounts WHERE is_deleted = false) AS "🏦 Banka/PF",
    '1:N' AS "Tip"

UNION ALL

SELECT 
    'bank_accounts → signs',
    (SELECT COUNT(*) FROM bank_accounts WHERE is_deleted = false),
    (SELECT COUNT(*) FROM signs WHERE is_deleted = false),
    '1:N'

UNION ALL

SELECT 
    'bank_accounts → earnings',
    (SELECT COUNT(*) FROM bank_accounts WHERE is_deleted = false),
    (SELECT COUNT(*) FROM earnings WHERE is_deleted = false),
    '1:N'

UNION ALL

SELECT 
    'signs ↔ earnings (GRUP)',
    (SELECT COUNT(DISTINCT tabela_group_id) FROM signs WHERE is_deleted = false AND tabela_group_id IS NOT NULL),
    (SELECT COUNT(DISTINCT tabela_group_id) FROM earnings WHERE is_deleted = false AND tabela_group_id IS NOT NULL),
    'N:N';


-- TABLO 4: TABELA Grup Analizi (HAKEDİŞ sorunu için)
WITH tabela_groups AS (
    SELECT 
        tabela_group_id,
        COUNT(*) AS sign_count
    FROM signs
    WHERE is_deleted = false
        AND tabela_group_id IS NOT NULL
    GROUP BY tabela_group_id
),
earnings_groups AS (
    SELECT 
        tabela_group_id,
        COUNT(*) AS earnings_count
    FROM earnings
    WHERE is_deleted = false
        AND tabela_group_id IS NOT NULL
    GROUP BY tabela_group_id
)
SELECT 
    COALESCE(t.tabela_group_id, e.tabela_group_id) AS "🏷️ Grup ID",
    SUBSTRING(COALESCE(t.tabela_group_id, e.tabela_group_id)::TEXT, 1, 13) || '...' AS "🔑 Kısa ID",
    COALESCE(t.sign_count, 0) AS "📊 TABELA Kayıt",
    COALESCE(e.earnings_count, 0) AS "💰 HAKEDİŞ Kayıt",
    CASE 
        WHEN COALESCE(t.sign_count, 0) = 0 AND COALESCE(e.earnings_count, 0) > 0 
        THEN '⚠️ SORUN: HAKEDİŞ var, TABELA YOK!'
        WHEN COALESCE(t.sign_count, 0) > 0 AND COALESCE(e.earnings_count, 0) = 0 
        THEN '✅ Normal: TABELA var, HAKEDİŞ henüz yok'
        WHEN COALESCE(t.sign_count, 0) > 0 AND COALESCE(e.earnings_count, 0) > 0 
        THEN '✅ İYİ: Her ikisi de var'
        ELSE '❓ Bilinmiyor'
    END AS "🎯 Durum"
FROM tabela_groups t
FULL OUTER JOIN earnings_groups e 
    ON e.tabela_group_id = t.tabela_group_id
ORDER BY "🎯 Durum", "📊 TABELA Kayıt" DESC;


-- TABLO 5: Tanımlar Tabloları
SELECT 
    'mcc_codes' AS "📋 Tablo",
    (SELECT COUNT(*) FROM mcc_codes WHERE is_deleted = false) AS "✅ Aktif",
    (SELECT COUNT(*) FROM mcc_codes WHERE is_deleted = true) AS "🗑️ Silinmiş"

UNION ALL

SELECT 'banks',
    (SELECT COUNT(*) FROM banks WHERE is_deleted = false),
    (SELECT COUNT(*) FROM banks WHERE is_deleted = true)

UNION ALL

SELECT 'epk_institutions',
    (SELECT COUNT(*) FROM epk_institutions WHERE is_deleted = false),
    (SELECT COUNT(*) FROM epk_institutions WHERE is_deleted = true)

UNION ALL

SELECT 'ok_institutions',
    (SELECT COUNT(*) FROM ok_institutions WHERE is_deleted = false),
    (SELECT COUNT(*) FROM ok_institutions WHERE is_deleted = true)

UNION ALL

SELECT 'sales_representatives',
    (SELECT COUNT(*) FROM sales_representatives WHERE is_deleted = false),
    (SELECT COUNT(*) FROM sales_representatives WHERE is_deleted = true)

UNION ALL

SELECT 'job_titles',
    (SELECT COUNT(*) FROM job_titles WHERE is_deleted = false),
    (SELECT COUNT(*) FROM job_titles WHERE is_deleted = true)

UNION ALL

SELECT 'partnerships',
    (SELECT COUNT(*) FROM partnerships WHERE is_deleted = false),
    (SELECT COUNT(*) FROM partnerships WHERE is_deleted = true)

UNION ALL

SELECT 'sharings',
    (SELECT COUNT(*) FROM sharings WHERE is_deleted = false),
    (SELECT COUNT(*) FROM sharings WHERE is_deleted = true)

UNION ALL

SELECT 'card_programs',
    (SELECT COUNT(*) FROM card_programs WHERE is_deleted = false),
    (SELECT COUNT(*) FROM card_programs WHERE is_deleted = true)

UNION ALL

SELECT 'suspension_reasons',
    (SELECT COUNT(*) FROM suspension_reasons WHERE is_deleted = false),
    (SELECT COUNT(*) FROM suspension_reasons WHERE is_deleted = true);


-- TABLO 6: Performans Özet
SELECT 
    tablename AS "📋 Tablo",
    seq_scan AS "🔍 Seq Scan",
    idx_scan AS "📇 Index Scan",
    CASE 
        WHEN idx_scan > 0 
        THEN ROUND((idx_scan::NUMERIC / (seq_scan + idx_scan)::NUMERIC) * 100, 2)
        ELSE 0
    END AS "📊 Index Kullanım %",
    n_tup_ins AS "➕ Insert",
    n_tup_upd AS "🔄 Update",
    n_tup_del AS "➖ Delete"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC
LIMIT 20;


-- ========================================
-- RAPOR TAMAMLANDI ✅
-- ========================================
