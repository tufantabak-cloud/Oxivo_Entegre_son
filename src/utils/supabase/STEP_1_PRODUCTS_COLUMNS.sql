-- ========================================
-- ADIM 1: products Tablosunun Sütunlarını Gör
-- ========================================

SELECT 
    ordinal_position AS "#",
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable",
    character_maximum_length AS "Max Length"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'products'
ORDER BY ordinal_position;
