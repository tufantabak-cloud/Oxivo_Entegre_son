-- ========================================
-- ADIM 3: signs (TABELA) Tablosunun Sütunları
-- ========================================

SELECT 
    ordinal_position AS "#",
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable",
    CASE 
        WHEN column_name = 'id' THEN '🔑 PK'
        WHEN column_name LIKE '%_id' THEN '🔗 FK?'
        WHEN column_name LIKE '%_ids' THEN '📊 JSONB Array?'
        WHEN data_type = 'jsonb' THEN '📊 JSONB'
        WHEN data_type LIKE '%timestamp%' THEN '⏰ Timestamp'
        ELSE ''
    END AS "💡 Not"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'signs'
ORDER BY ordinal_position;
