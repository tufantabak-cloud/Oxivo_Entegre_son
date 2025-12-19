-- ========================================
-- IS_DELETED SÜTUN KONTROL SORGUSU
-- ========================================
-- Tüm tablolarda is_deleted sütunu var mı kontrol et

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND column_name = 'is_deleted'
ORDER BY 
    table_name;

-- ========================================
-- EĞER SONUÇ BOŞ İSE: is_deleted hiçbir tabloda yok
-- EĞER SONUÇ VARSA: Hangi tablolarda olduğunu gösterir
-- ========================================
