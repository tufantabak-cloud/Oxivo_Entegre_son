-- ========================================
-- KRİTİK BULGULAR ANALİZİ
-- ========================================
-- Tarih: 15 Aralık 2024
-- Toplam Tablo: 30
-- Toplam Kayıt: 3,350
-- Toplam Boyut: 23 MB
-- ========================================

-- ========================================
-- BULGU 1: SOFT DELETE YOK!
-- ========================================
-- RAPOR: "Soft Delete Kullanan: 0"
-- SONUÇ: is_deleted sütunu HİÇBİR tabloda yok!

SELECT '🚨 KRİTİK BULGU 1: SOFT DELETE YOK!' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

-- is_deleted sütunu olan tabloları kontrol et
SELECT 
    'is_deleted sütunu olan tablo sayısı:' AS "Kontrol",
    COUNT(DISTINCT table_name)::TEXT AS "Sonuç"
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND column_name = 'is_deleted';

-- deleted_at sütunu olan tabloları kontrol et
SELECT 
    'deleted_at sütunu olan tablo sayısı:' AS "Kontrol",
    COUNT(DISTINCT table_name)::TEXT AS "Sonuç"
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND column_name = 'deleted_at';

-- Sonuç
SELECT 
    '💡 SONUÇ' AS "Başlık",
    'Veritabanında SOFT DELETE mekanizması YOK! HARD DELETE kullanılıyor.' AS "Açıklama";


-- ========================================
-- BULGU 2: JSONB KULLANIMI
-- ========================================
-- RAPOR: "JSONB Kullanan: 12 tablo"

SELECT '📊 KRİTİK BULGU 2: JSONB KULLANIMI (12 Tablo)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

-- Hangi tablolarda JSONB var?
SELECT 
    table_name AS "📋 Tablo",
    STRING_AGG(column_name, ', ' ORDER BY column_name) AS "📊 JSONB Sütunlar",
    COUNT(*) AS "🔢 Adet"
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND data_type = 'jsonb'
GROUP BY table_name
ORDER BY COUNT(*) DESC;


-- ========================================
-- BULGU 3: FOREIGN KEY İLİŞKİLERİ
-- ========================================
-- RAPOR: "Foreign Key Sayısı: 13"

SELECT '🔗 KRİTİK BULGU 3: FOREIGN KEY İLİŞKİLERİ (13 Adet)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

-- Tüm Foreign Key'leri listele
SELECT 
    tc.table_name AS "📋 Ana Tablo",
    kcu.column_name AS "🏷️ Ana Sütun",
    ccu.table_name AS "🎯 Referans Tablo",
    ccu.column_name AS "🎯 Referans Sütun"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;


-- ========================================
-- BULGU 4: INDEX DURUMU
-- ========================================
-- RAPOR: "Index Sayısı: 162"

SELECT '📇 KRİTİK BULGU 4: INDEX DURUMU (162 Index)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

-- Tablo başına index sayısı
SELECT 
    tablename AS "📋 Tablo",
    COUNT(*) AS "📇 Index Sayısı",
    STRING_AGG(indexname, ', ' ORDER BY indexname) AS "📝 Index İsimleri"
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY COUNT(*) DESC;


-- ========================================
-- BULGU 5: BOŞ TABLOLAR
-- ========================================

SELECT '🔴 KRİTİK BULGU 5: BOŞ TABLOLAR (Henüz Kullanılmayan)' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

-- Boş tabloları listele
SELECT 
    relname AS "📋 Boş Tablo",
    pg_size_pretty(pg_total_relation_size('public.' || relname)) AS "💾 Boyut",
    (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_schema = 'public' AND c.table_name = relname) AS "🏷️ Sütun"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND n_live_tup = 0
ORDER BY relname;


-- ========================================
-- BULGU 6: EN BÜYÜK TABLOLAR
-- ========================================

SELECT '💾 KRİTİK BULGU 6: EN BÜYÜK 10 TABLO' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

-- En büyük 10 tablo
SELECT 
    relname AS "📋 Tablo",
    n_live_tup AS "🔢 Kayıt",
    pg_size_pretty(pg_total_relation_size('public.' || relname)) AS "💾 Toplam Boyut",
    pg_size_pretty(pg_relation_size('public.' || relname)) AS "📊 Tablo Boyutu",
    pg_size_pretty(pg_total_relation_size('public.' || relname) - pg_relation_size('public.' || relname)) AS "📇 Index Boyutu"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.' || relname) DESC
LIMIT 10;


-- ========================================
-- BULGU 7: VERI DAĞILIMI
-- ========================================

SELECT '📊 KRİTİK BULGU 7: VERİ DAĞILIMI' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

-- Kayıt sayısına göre dağılım
SELECT 
    relname AS "📋 Tablo",
    n_live_tup AS "🔢 Kayıt Sayısı",
    ROUND(100.0 * n_live_tup / NULLIF((SELECT SUM(n_live_tup) FROM pg_stat_user_tables WHERE schemaname = 'public'), 0), 2) AS "📊 Yüzde %",
    CASE 
        WHEN n_live_tup = 0 THEN '🔴 BOŞ'
        WHEN n_live_tup < 10 THEN '🟡 ÇOK AZ (<10)'
        WHEN n_live_tup < 100 THEN '🟢 AZ (10-99)'
        WHEN n_live_tup < 1000 THEN '🔵 ORTA (100-999)'
        ELSE '🟣 YÜKSEK (1000+)'
    END AS "📈 Kategori"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;


-- ========================================
-- BULGU 8: TIMESTAMP SÜTUNLARI
-- ========================================

SELECT '⏰ KRİTİK BULGU 8: TIMESTAMP SÜTUNLARI' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

-- Hangi tablolarda timestamp var?
WITH timestamp_summary AS (
    SELECT 
        table_name,
        MAX(CASE WHEN column_name = 'created_at' THEN 1 ELSE 0 END) AS has_created_at,
        MAX(CASE WHEN column_name = 'updated_at' THEN 1 ELSE 0 END) AS has_updated_at,
        MAX(CASE WHEN column_name = 'deleted_at' THEN 1 ELSE 0 END) AS has_deleted_at
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND (data_type LIKE '%timestamp%' OR data_type = 'date')
    GROUP BY table_name
)
SELECT 
    table_name AS "📋 Tablo",
    CASE WHEN has_created_at = 1 THEN '✅' ELSE '❌' END AS "🆕 created_at",
    CASE WHEN has_updated_at = 1 THEN '✅' ELSE '❌' END AS "🔄 updated_at",
    CASE WHEN has_deleted_at = 1 THEN '✅' ELSE '❌' END AS "🗑️ deleted_at",
    CASE 
        WHEN has_created_at = 1 AND has_updated_at = 1 THEN '🟢 FULL'
        WHEN has_created_at = 1 THEN '🟡 BASIC'
        ELSE '🔴 YOK'
    END AS "💡 Timestamp Durumu"
FROM timestamp_summary
ORDER BY table_name;


-- ========================================
-- BULGU 9: PRIMARY KEY KONTROL
-- ========================================

SELECT '🔑 KRİTİK BULGU 9: PRIMARY KEY KONTROL' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

-- Hangi tablolarda PK yok?
WITH all_tables AS (
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
),
tables_with_pk AS (
    SELECT DISTINCT table_name
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
        AND constraint_type = 'PRIMARY KEY'
)
SELECT 
    at.tablename AS "📋 Tablo",
    CASE 
        WHEN tp.table_name IS NOT NULL THEN '✅ VAR'
        ELSE '❌ YOK'
    END AS "🔑 Primary Key"
FROM all_tables at
LEFT JOIN tables_with_pk tp ON tp.table_name = at.tablename
ORDER BY 
    CASE WHEN tp.table_name IS NULL THEN 0 ELSE 1 END,
    at.tablename;


-- ========================================
-- BULGU 10: PERFORMANS ANALİZİ
-- ========================================

SELECT '⚡ KRİTİK BULGU 10: PERFORMANS ANALİZİ' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

-- Sequential Scan vs Index Scan
SELECT 
    relname AS "📋 Tablo",
    seq_scan AS "🔍 Seq Scan",
    idx_scan AS "📇 Index Scan",
    CASE 
        WHEN (seq_scan + COALESCE(idx_scan, 0)) = 0 THEN 0
        ELSE ROUND(100.0 * COALESCE(idx_scan, 0) / (seq_scan + COALESCE(idx_scan, 0)), 2)
    END AS "📊 Index Kullanım %",
    CASE 
        WHEN seq_scan > idx_scan AND n_live_tup > 100 THEN '⚠️ Index Ekle'
        WHEN idx_scan > seq_scan THEN '✅ İyi'
        ELSE '🟡 Normal'
    END AS "💡 Öneri"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND n_live_tup > 0
ORDER BY seq_scan DESC;


-- ========================================
-- ÖZET RAPOR
-- ========================================

SELECT '✅ KRİTİK BULGULAR ÖZETİ' AS "BAŞLIK";
SELECT '═══════════════════════════════════════════════════════════════' AS "═";

SELECT 
    '📊 Toplam Tablo' AS "Metrik",
    '30' AS "Değer",
    '✅ Normal' AS "Durum"
UNION ALL
SELECT 
    '📋 Toplam Sütun',
    '420',
    '✅ Normal'
UNION ALL
SELECT 
    '🔢 Toplam Kayıt',
    '3,350',
    '✅ Normal'
UNION ALL
SELECT 
    '💾 Toplam Boyut',
    '23 MB',
    '✅ Küçük - İyi'
UNION ALL
SELECT 
    '🗑️ Soft Delete',
    '0 tablo',
    '⚠️ HARD DELETE kullanılıyor!'
UNION ALL
SELECT 
    '📊 JSONB Kullanımı',
    '12 tablo',
    '✅ İyi - Esnek yapı'
UNION ALL
SELECT 
    '🔗 Foreign Key',
    '13 adet',
    '⚠️ Az - Daha fazla ilişki kurulabilir'
UNION ALL
SELECT 
    '📇 Index',
    '162 adet',
    '✅ İyi - Yeterli indexleme'
UNION ALL
SELECT 
    '🔴 Boş Tablo',
    '~12 tablo',
    '🟡 Yeni tablolar henüz kullanılmamış';


-- ========================================
-- RAPOR SONU
-- ========================================
SELECT '═══════════════════════════════════════════════════════════════' AS "═";
SELECT '✅ KRİTİK BULGULAR ANALİZİ TAMAMLANDI!' AS "DURUM";
SELECT NOW() AS "⏰ Rapor Zamanı";
