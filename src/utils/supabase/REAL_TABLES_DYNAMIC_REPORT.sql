-- ========================================
-- DİNAMİK TABLO RAPORU - GERÇEK TABLOLAR
-- Önce tablo listesini alır, sonra her birini gösterir
-- ========================================

-- ========================================
-- BÖLÜM 1: TÜM TABLOLARIN LİSTESİ
-- ========================================
SELECT '📊 BÖLÜM 1: TÜM TABLOLARIN LİSTESİ (30 Tablo)' AS "RAPOR BAŞLIĞI";

SELECT 
    ROW_NUMBER() OVER (ORDER BY tablename) AS "#",
    tablename AS "📋 Tablo Adı",
    COALESCE(s.n_live_tup, 0) AS "🔢 Kayıt",
    pg_size_pretty(pg_total_relation_size('public.' || t.tablename)) AS "💾 Boyut",
    CASE 
        WHEN COALESCE(s.n_live_tup, 0) = 0 THEN '🔴 BOŞ'
        WHEN COALESCE(s.n_live_tup, 0) < 10 THEN '🟡 AZ'
        WHEN COALESCE(s.n_live_tup, 0) < 100 THEN '🟢 NORMAL'
        ELSE '🟣 YÜKSEK'
    END AS "📊 Durum",
    (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = t.tablename) AS "🏷️ Sütun"
FROM pg_tables t
LEFT JOIN pg_stat_user_tables s ON s.schemaname = t.schemaname AND s.relname = t.tablename
WHERE t.schemaname = 'public'
ORDER BY tablename;


-- ========================================
-- BÖLÜM 2: HER TABLONUN SÜTUN LİSTESİ
-- ========================================
SELECT '📋 BÖLÜM 2: HER TABLONUN SÜTUN DETAYLARI' AS "RAPOR BAŞLIĞI";

SELECT 
    c.table_name AS "📋 Tablo",
    c.column_name AS "🏷️ Sütun",
    c.data_type AS "📦 Veri Tipi",
    CASE WHEN c.character_maximum_length IS NOT NULL 
        THEN '(' || c.character_maximum_length || ')'
        ELSE ''
    END AS "📏 Uzunluk",
    CASE WHEN c.is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "⚡ Nullable",
    CASE 
        WHEN pk.constraint_type = 'PRIMARY KEY' THEN '🔑 PK'
        WHEN fk.constraint_type = 'FOREIGN KEY' THEN '🔗 FK'
        ELSE ''
    END AS "🎯 Key",
    c.column_default AS "🔧 Default"
FROM information_schema.columns c
LEFT JOIN (
    SELECT kcu.table_name, kcu.column_name, tc.constraint_type
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.table_constraints tc 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
) pk ON pk.table_name = c.table_name AND pk.column_name = c.column_name
LEFT JOIN (
    SELECT kcu.table_name, kcu.column_name, tc.constraint_type
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.table_constraints tc 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
) fk ON fk.table_name = c.table_name AND fk.column_name = c.column_name
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;


-- ========================================
-- BÖLÜM 3: TABLOLARA GÖRE GRUPLANAN SÜTUNLAR
-- ========================================
SELECT '📊 BÖLÜM 3: TABLOLARA GÖRE GRUPLANAN SÜTUN LİSTESİ' AS "RAPOR BAŞLIĞI";

SELECT 
    table_name AS "📋 Tablo",
    STRING_AGG(
        column_name || ' (' || data_type || 
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END || ')',
        E',\n    '
        ORDER BY ordinal_position
    ) AS "🏷️ Sütunlar"
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;


-- ========================================
-- BÖLÜM 4: BOŞ OLMAYAN TABLOLAR VE KAYIT SAYILARI
-- ========================================
SELECT '🔢 BÖLÜM 4: BOŞ OLMAYAN TABLOLAR' AS "RAPOR BAŞLIĞI";

SELECT 
    relname AS "📋 Tablo",
    n_live_tup AS "🔢 Aktif Kayıt",
    n_dead_tup AS "💀 Ölü Kayıt",
    pg_size_pretty(pg_total_relation_size('public.' || relname)) AS "💾 Boyut",
    seq_scan AS "🔍 Seq Scan",
    idx_scan AS "📇 Index Scan"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND n_live_tup > 0
ORDER BY n_live_tup DESC;


-- ========================================
-- BÖLÜM 5: BOŞ TABLOLAR
-- ========================================
SELECT '🔴 BÖLÜM 5: BOŞ TABLOLAR (Henüz Kullanılmayan)' AS "RAPOR BAŞLIĞI";

SELECT 
    relname AS "📋 Tablo",
    pg_size_pretty(pg_total_relation_size('public.' || relname)) AS "💾 Boyut",
    (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = relname) AS "🏷️ Sütun Sayısı"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND n_live_tup = 0
ORDER BY relname;


-- ========================================
-- BÖLÜM 6: JSONB SÜTUNLAR
-- ========================================
SELECT '📊 BÖLÜM 6: JSONB SÜTUNLAR' AS "RAPOR BAŞLIĞI";

SELECT 
    table_name AS "📋 Tablo",
    column_name AS "🏷️ JSONB Sütun",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "⚡ Nullable"
FROM information_schema.columns
WHERE table_schema = 'public'
    AND data_type = 'jsonb'
ORDER BY table_name, column_name;


-- ========================================
-- BÖLÜM 7: FOREIGN KEY İLİŞKİLERİ
-- ========================================
SELECT '🔗 BÖLÜM 7: FOREIGN KEY İLİŞKİLERİ' AS "RAPOR BAŞLIĞI";

SELECT 
    tc.table_name AS "📋 Ana Tablo",
    kcu.column_name AS "🏷️ Ana Sütun",
    ccu.table_name AS "🎯 Referans Tablo",
    ccu.column_name AS "🎯 Referans Sütun",
    rc.update_rule AS "🔄 ON UPDATE",
    rc.delete_rule AS "🗑️ ON DELETE"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;


-- ========================================
-- BÖLÜM 8: PRIMARY KEY TANIMLARI
-- ========================================
SELECT '🔑 BÖLÜM 8: PRIMARY KEY TANIMLARI' AS "RAPOR BAŞLIĞI";

SELECT 
    tc.table_name AS "📋 Tablo",
    STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS "🔑 Primary Key Sütunlar"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
    AND tc.constraint_type = 'PRIMARY KEY'
GROUP BY tc.table_name
ORDER BY tc.table_name;


-- ========================================
-- BÖLÜM 9: TIMESTAMP SÜTUNLARI
-- ========================================
SELECT '⏰ BÖLÜM 9: TIMESTAMP SÜTUNLARI' AS "RAPOR BAŞLIĞI";

SELECT 
    table_name AS "📋 Tablo",
    column_name AS "⏰ Timestamp Sütun",
    data_type AS "📦 Veri Tipi",
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
-- BÖLÜM 10: SOFT DELETE ANALİZİ
-- ========================================
SELECT '🗑️ BÖLÜM 10: SOFT DELETE ANALİZİ' AS "RAPOR BAŞLIĞI";

WITH soft_delete_check AS (
    SELECT 
        table_name,
        MAX(CASE WHEN column_name = 'is_deleted' THEN 1 ELSE 0 END) AS has_is_deleted,
        MAX(CASE WHEN column_name = 'deleted_at' THEN 1 ELSE 0 END) AS has_deleted_at
    FROM information_schema.columns
    WHERE table_schema = 'public'
    GROUP BY table_name
)
SELECT 
    table_name AS "📋 Tablo",
    CASE WHEN has_is_deleted = 1 THEN '✅ VAR' ELSE '❌ YOK' END AS "🗑️ is_deleted",
    CASE WHEN has_deleted_at = 1 THEN '✅ VAR' ELSE '❌ YOK' END AS "⏰ deleted_at",
    CASE 
        WHEN has_is_deleted = 1 AND has_deleted_at = 1 THEN '🟢 FULL Soft Delete'
        WHEN has_is_deleted = 1 THEN '🟡 BASIC Soft Delete'
        ELSE '🔴 HARD Delete'
    END AS "💡 Delete Stratejisi"
FROM soft_delete_check
ORDER BY table_name;


-- ========================================
-- BÖLÜM 11: VERİ TİPİ İSTATİSTİKLERİ
-- ========================================
SELECT '📦 BÖLÜM 11: VERİ TİPİ DAĞILIMI' AS "RAPOR BAŞLIĞI";

SELECT 
    data_type AS "📦 Veri Tipi",
    COUNT(*) AS "🔢 Toplam Sütun",
    COUNT(DISTINCT table_name) AS "📋 Kaç Tabloda",
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS "📊 Yüzde %"
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY data_type
ORDER BY COUNT(*) DESC;


-- ========================================
-- BÖLÜM 12: INDEX İSTATİSTİKLERİ
-- ========================================
SELECT '📇 BÖLÜM 12: INDEX İSTATİSTİKLERİ' AS "RAPOR BAŞLIĞI";

SELECT 
    tablename AS "📋 Tablo",
    indexname AS "📇 Index Adı",
    indexdef AS "🔧 Index Tanımı"
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;


-- ========================================
-- RAPOR SONU - ÖZET
-- ========================================
SELECT '✅ RAPOR TAMAMLANDI - ÖZET' AS "DURUM";

SELECT 
    '📊 Toplam Tablo' AS "Metrik",
    COUNT(*)::TEXT AS "Değer"
FROM pg_tables
WHERE schemaname = 'public'

UNION ALL

SELECT 
    '📋 Toplam Sütun',
    COUNT(*)::TEXT
FROM information_schema.columns
WHERE table_schema = 'public'

UNION ALL

SELECT 
    '🔢 Toplam Kayıt',
    SUM(n_live_tup)::TEXT
FROM pg_stat_user_tables
WHERE schemaname = 'public'

UNION ALL

SELECT 
    '💾 Toplam Boyut',
    pg_size_pretty(SUM(pg_total_relation_size('public.' || tablename)))
FROM pg_tables
WHERE schemaname = 'public'

UNION ALL

SELECT 
    '🗑️ Soft Delete Kullanan',
    COUNT(DISTINCT table_name)::TEXT
FROM information_schema.columns
WHERE table_schema = 'public' AND column_name = 'is_deleted'

UNION ALL

SELECT 
    '📊 JSONB Kullanan',
    COUNT(DISTINCT table_name)::TEXT
FROM information_schema.columns
WHERE table_schema = 'public' AND data_type = 'jsonb'

UNION ALL

SELECT 
    '🔗 Foreign Key Sayısı',
    COUNT(*)::TEXT
FROM information_schema.table_constraints
WHERE table_schema = 'public' AND constraint_type = 'FOREIGN KEY'

UNION ALL

SELECT 
    '📇 Index Sayısı',
    COUNT(*)::TEXT
FROM pg_indexes
WHERE schemaname = 'public';
