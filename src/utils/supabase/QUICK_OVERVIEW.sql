-- ========================================
-- HIZLI GENEL BAKIŞ - 30 TABLO ÖZETİ
-- Bu sorguyu çalıştırın, sonucu buraya yapıştırın
-- ========================================

SELECT 
    ROW_NUMBER() OVER (ORDER BY tablename) AS "#",
    tablename AS "📋 Tablo",
    COALESCE(s.n_live_tup, 0) AS "🔢 Kayıt",
    (SELECT COUNT(*) FROM information_schema.columns c 
     WHERE c.table_schema = 'public' AND c.table_name = t.tablename) AS "🏷️ Sütun",
    pg_size_pretty(pg_total_relation_size('public.' || t.tablename)) AS "💾 Boyut",
    CASE 
        WHEN COALESCE(s.n_live_tup, 0) = 0 THEN '🔴 BOŞ'
        WHEN COALESCE(s.n_live_tup, 0) < 10 THEN '🟡 AZ (<10)'
        WHEN COALESCE(s.n_live_tup, 0) < 100 THEN '🟢 ORTA (10-99)'
        WHEN COALESCE(s.n_live_tup, 0) < 1000 THEN '🔵 ÇOK (100-999)'
        ELSE '🟣 ÇOK FAZLA (1000+)'
    END AS "📊 Durum",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns c2
            WHERE c2.table_schema = 'public' 
                AND c2.table_name = t.tablename 
                AND c2.data_type = 'jsonb'
        ) THEN '✅'
        ELSE '❌'
    END AS "📊 JSONB"
FROM pg_tables t
LEFT JOIN pg_stat_user_tables s 
    ON s.schemaname = t.schemaname 
    AND s.relname = t.tablename
WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE 'kv_store%'
ORDER BY COALESCE(s.n_live_tup, 0) DESC, tablename;
