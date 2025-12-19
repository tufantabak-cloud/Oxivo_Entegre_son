-- ========================================
-- SUPABASE DATABASE FULL ANALYSIS
-- ========================================
-- Bu SQL kodu Supabase'deki tüm tabloları, sütunları, 
-- constraintleri, indexleri ve ilişkileri detaylı listeler
-- 
-- KULLANIM: Supabase SQL Editor'de çalıştırın
-- ========================================

-- ========================================
-- BÖLÜM 1: TABLO LİSTESİ ve KAYIT SAYILARI
-- ========================================
SELECT 
    '📊 TABLO LİSTESİ ve KAYIT SAYILARI' AS "RAPOR BAŞLIĞI";

WITH table_stats AS (
    SELECT 
        schemaname,
        relname AS tablename,  -- ✅ FIX: relname → tablename
        -- Satır sayısı tahmini (hızlı)
        COALESCE(n_live_tup, 0) AS estimated_row_count
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
)
SELECT 
    ROW_NUMBER() OVER (ORDER BY tablename) AS "#",
    tablename AS "📋 Tablo Adı",
    estimated_row_count AS "🔢 Tahmini Kayıt",
    pg_size_pretty(pg_total_relation_size('public.' || tablename)) AS "💾 Boyut",
    CASE 
        WHEN tablename IN (
            'customers', 'products', 'bank_accounts', 'signs', 'earnings',
            'mcc_codes', 'banks', 'epk_institutions', 'ok_institutions',
            'sales_representatives', 'job_titles', 'partnerships', 
            'sharings', 'card_programs', 'suspension_reasons', 'domain_mappings'
        ) THEN '✅ Aktif'
        ELSE '⚠️ Bilinmiyor'
    END AS "📡 Durum"
FROM table_stats
ORDER BY tablename;


-- ========================================
-- BÖLÜM 2: DETAYLI SÜTUN ANALİZİ
-- ========================================
SELECT 
    '📋 DETAYLI SÜTUN ANALİZİ' AS "RAPOR BAŞLIĞI";

SELECT 
    c.table_name AS "📋 Tablo",
    c.ordinal_position AS "#",
    c.column_name AS "🏷️ Sütun Adı",
    c.data_type AS "📦 Veri Tipi",
    CASE 
        WHEN c.character_maximum_length IS NOT NULL 
        THEN '(' || c.character_maximum_length || ')'
        WHEN c.numeric_precision IS NOT NULL 
        THEN '(' || c.numeric_precision || ',' || COALESCE(c.numeric_scale, 0) || ')'
        ELSE ''
    END AS "📏 Boyut",
    CASE 
        WHEN c.is_nullable = 'NO' THEN '❌ NOT NULL'
        ELSE '✅ NULL'
    END AS "⚡ Nullable",
    COALESCE(c.column_default, '-') AS "🔧 Default",
    CASE 
        WHEN pk.constraint_type = 'PRIMARY KEY' THEN '🔑 PRIMARY KEY'
        WHEN fk.constraint_type = 'FOREIGN KEY' THEN '🔗 FOREIGN KEY'
        WHEN uq.constraint_type = 'UNIQUE' THEN '⭐ UNIQUE'
        ELSE '-'
    END AS "🎯 Constraint",
    CASE 
        WHEN c.column_name = 'is_deleted' THEN '🗑️ Soft Delete'
        WHEN c.column_name IN ('created_at', 'updated_at', 'deleted_at') THEN '⏰ Timestamp'
        WHEN c.data_type = 'jsonb' THEN '📊 JSON Data'
        WHEN c.data_type = 'uuid' THEN '🆔 UUID'
        ELSE '-'
    END AS "💡 Özellik"
FROM information_schema.columns c
-- Primary Key kontrolü
LEFT JOIN (
    SELECT 
        kcu.table_name, 
        kcu.column_name, 
        tc.constraint_type
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.table_constraints tc 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
) pk ON pk.table_name = c.table_name AND pk.column_name = c.column_name
-- Foreign Key kontrolü
LEFT JOIN (
    SELECT 
        kcu.table_name, 
        kcu.column_name, 
        tc.constraint_type
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.table_constraints tc 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
) fk ON fk.table_name = c.table_name AND fk.column_name = c.column_name
-- Unique kontrolü
LEFT JOIN (
    SELECT 
        kcu.table_name, 
        kcu.column_name, 
        tc.constraint_type
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.table_constraints tc 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_schema = 'public'
) uq ON uq.table_name = c.table_name AND uq.column_name = c.column_name
WHERE c.table_schema = 'public'
    AND c.table_name IN (
        'customers', 'products', 'bank_accounts', 'signs', 'earnings',
        'mcc_codes', 'banks', 'epk_institutions', 'ok_institutions',
        'sales_representatives', 'job_titles', 'partnerships', 
        'account_items', 'fixed_commissions', 'additional_revenues',
        'sharings', 'card_programs', 'suspension_reasons', 'domain_mappings'
    )
ORDER BY c.table_name, c.ordinal_position;


-- ========================================
-- BÖLÜM 3: PRIMARY KEY ve UNIQUE CONSTRAINTS
-- ========================================
SELECT 
    '🔑 PRIMARY KEY ve UNIQUE CONSTRAINTS' AS "RAPOR BAŞLIĞI";

SELECT 
    tc.table_name AS "📋 Tablo",
    tc.constraint_name AS "🏷️ Constraint Adı",
    tc.constraint_type AS "📦 Tip",
    STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS "🎯 Sütunlar",
    CASE 
        WHEN tc.constraint_type = 'PRIMARY KEY' THEN '🔑 Ana Anahtar'
        WHEN tc.constraint_type = 'UNIQUE' THEN '⭐ Benzersiz'
        ELSE '❓'
    END AS "💡 Açıklama"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
    AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
    AND tc.table_name IN (
        'customers', 'products', 'bank_accounts', 'signs', 'earnings',
        'mcc_codes', 'banks', 'epk_institutions', 'ok_institutions',
        'sales_representatives', 'job_titles', 'partnerships', 
        'account_items', 'fixed_commissions', 'additional_revenues',
        'sharings', 'card_programs', 'suspension_reasons', 'domain_mappings'
    )
GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
ORDER BY tc.table_name, tc.constraint_type;


-- ========================================
-- BÖLÜM 4: FOREIGN KEY İLİŞKİLERİ
-- ========================================
SELECT 
    '🔗 FOREIGN KEY İLİŞKİLERİ' AS "RAPOR BAŞLIĞI";

SELECT 
    tc.table_name AS "📋 Ana Tablo",
    kcu.column_name AS "🏷️ Ana Sütun",
    ccu.table_name AS "🎯 Referans Tablo",
    ccu.column_name AS "🎯 Referans Sütun",
    tc.constraint_name AS "🔗 Constraint Adı",
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
    AND rc.constraint_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;


-- ========================================
-- BÖLÜM 5: INDEX ANALİZİ
-- ========================================
SELECT 
    '📇 INDEX ANALİZİ' AS "RAPOR BAŞLIĞI";

SELECT 
    schemaname AS "📂 Schema",
    tablename AS "📋 Tablo",
    indexname AS "🏷️ Index Adı",
    indexdef AS "🔧 Index Tanımı",
    pg_size_pretty(pg_relation_size((schemaname || '.' || indexname)::regclass)) AS "💾 Index Boyutu"  -- ✅ FIX: indexrelid yerine regclass kullanımı
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN (
        'customers', 'products', 'bank_accounts', 'signs', 'earnings',
        'mcc_codes', 'banks', 'epk_institutions', 'ok_institutions',
        'sales_representatives', 'job_titles', 'partnerships', 
        'account_items', 'fixed_commissions', 'additional_revenues',
        'sharings', 'card_programs', 'suspension_reasons', 'domain_mappings'
    )
ORDER BY tablename, indexname;


-- ========================================
-- BÖLÜM 6: JSONB SÜTUN ANALİZİ
-- ========================================
SELECT 
    '📊 JSONB SÜTUN ANALİZİ' AS "RAPOR BAŞLIĞI";

SELECT 
    table_name AS "📋 Tablo",
    column_name AS "🏷️ JSONB Sütun",
    data_type AS "📦 Veri Tipi",
    CASE 
        WHEN column_name LIKE '%_ids' THEN '🔢 ID Array - İlişkisel veri dizisi'
        WHEN column_name LIKE '%_map' THEN '🗺️ Map Object - Anahtar-değer eşleştirmesi'
        WHEN column_name LIKE '%_oranlari' THEN '📈 Percentage Object - Oran verileri'
        WHEN column_name LIKE '%_detay' THEN '📝 Detail Object - Detay verileri'
        WHEN column_name LIKE '%_modeli' THEN '🎯 Model Object - Model tanımları'
        ELSE '📊 Generic JSON - Genel JSON verisi'
    END AS "💡 Kullanım Amacı"
FROM information_schema.columns
WHERE table_schema = 'public'
    AND data_type = 'jsonb'
    AND table_name IN (
        'customers', 'products', 'bank_accounts', 'signs', 'earnings',
        'mcc_codes', 'banks', 'epk_institutions', 'ok_institutions',
        'sales_representatives', 'job_titles', 'partnerships', 
        'account_items', 'fixed_commissions', 'additional_revenues',
        'sharings', 'card_programs', 'suspension_reasons', 'domain_mappings'
    )
ORDER BY table_name, column_name;


-- ========================================
-- BÖLÜM 7: SOFT DELETE ANALİZİ
-- ========================================
SELECT 
    '🗑️ SOFT DELETE ANALİZİ' AS "RAPOR BAŞLIĞI";

WITH soft_delete_check AS (
    SELECT 
        table_name,
        EXISTS (
            SELECT 1 
            FROM information_schema.columns c2
            WHERE c2.table_schema = 'public'
                AND c2.table_name = c.table_name
                AND c2.column_name = 'is_deleted'
        ) AS has_is_deleted,
        EXISTS (
            SELECT 1 
            FROM information_schema.columns c2
            WHERE c2.table_schema = 'public'
                AND c2.table_name = c.table_name
                AND c2.column_name = 'deleted_at'
        ) AS has_deleted_at
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
        AND c.table_name IN (
            'customers', 'products', 'bank_accounts', 'signs', 'earnings',
            'mcc_codes', 'banks', 'epk_institutions', 'ok_institutions',
            'sales_representatives', 'job_titles', 'partnerships', 
            'account_items', 'fixed_commissions', 'additional_revenues',
            'sharings', 'card_programs', 'suspension_reasons', 'domain_mappings'
        )
    GROUP BY table_name
)
SELECT 
    table_name AS "📋 Tablo",
    CASE 
        WHEN has_is_deleted THEN '✅ VAR'
        ELSE '❌ YOK'
    END AS "🗑️ is_deleted",
    CASE 
        WHEN has_deleted_at THEN '✅ VAR'
        ELSE '❌ YOK'
    END AS "⏰ deleted_at",
    CASE 
        WHEN has_is_deleted AND has_deleted_at THEN '🟢 FULL Soft Delete'
        WHEN has_is_deleted THEN '🟡 BASIC Soft Delete'
        ELSE '🔴 HARD Delete'
    END AS "💡 Delete Stratejisi"
FROM soft_delete_check
ORDER BY table_name;


-- ========================================
-- BÖLÜM 8: TIMESTAMP SÜTUN ANALİZİ
-- ========================================
SELECT 
    '⏰ TIMESTAMP SÜTUN ANALİZİ' AS "RAPOR BAŞLIĞI";

SELECT 
    table_name AS "📋 Tablo",
    column_name AS "🏷️ Sütun",
    data_type AS "📦 Tip",
    column_default AS "🔧 Default Değer",
    CASE 
        WHEN column_name = 'created_at' THEN '🆕 Oluşturma zamanı'
        WHEN column_name = 'updated_at' THEN '🔄 Güncelleme zamanı'
        WHEN column_name = 'deleted_at' THEN '🗑️ Silme zamanı'
        WHEN column_name = 'olusturma_tarihi' THEN '🆕 Custom oluşturma'
        WHEN column_name = 'guncelleme_tarihi' THEN '🔄 Custom güncelleme'
        WHEN column_name = 'onay_tarihi' THEN '✅ Onay zamanı'
        WHEN column_name LIKE '%_baslangic' THEN '▶️ Başlangıç zamanı'
        WHEN column_name LIKE '%_bitis' THEN '⏹️ Bitiş zamanı'
        ELSE '📅 Tarih/Zaman'
    END AS "💡 Kullanım"
FROM information_schema.columns
WHERE table_schema = 'public'
    AND (data_type LIKE '%timestamp%' OR data_type = 'date')
    AND table_name IN (
        'customers', 'products', 'bank_accounts', 'signs', 'earnings',
        'mcc_codes', 'banks', 'epk_institutions', 'ok_institutions',
        'sales_representatives', 'job_titles', 'partnerships', 
        'account_items', 'fixed_commissions', 'additional_revenues',
        'sharings', 'card_programs', 'suspension_reasons', 'domain_mappings'
    )
ORDER BY table_name, 
    CASE 
        WHEN column_name = 'created_at' THEN 1
        WHEN column_name = 'updated_at' THEN 2
        WHEN column_name = 'deleted_at' THEN 3
        ELSE 4
    END,
    column_name;


-- ========================================
-- BÖLÜM 9: GERÇEK KAYIT SAYILARI (Yavaş ama Doğru)
-- ========================================
SELECT 
    '🔢 GERÇEK KAYIT SAYILARI (Yavaş Ama Doğru)' AS "RAPOR BAŞLIĞI";

-- NOT: Bu sorgu yavaş çalışabilir, büyük tablolarda dikkatli kullanın!
DO $$
DECLARE
    tbl_name TEXT;
    tbl_count BIGINT;
    active_count BIGINT;
    deleted_count BIGINT;
BEGIN
    -- Geçici sonuç tablosu oluştur
    DROP TABLE IF EXISTS temp_record_counts;
    CREATE TEMP TABLE temp_record_counts (
        table_name TEXT,
        total_records BIGINT,
        active_records BIGINT,
        deleted_records BIGINT
    );

    -- Her tablo için kayıt say
    FOR tbl_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
            AND tablename IN (
                'customers', 'products', 'bank_accounts', 'signs', 'earnings',
                'mcc_codes', 'banks', 'epk_institutions', 'ok_institutions',
                'sales_representatives', 'job_titles', 'partnerships', 
                'account_items', 'fixed_commissions', 'additional_revenues',
                'sharings', 'card_programs', 'suspension_reasons', 'domain_mappings'
            )
    LOOP
        -- Toplam kayıt
        EXECUTE format('SELECT COUNT(*) FROM public.%I', tbl_name) INTO tbl_count;
        
        -- is_deleted sütunu var mı kontrol et
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = tbl_name 
                AND column_name = 'is_deleted'
        ) THEN
            -- Aktif kayıtlar
            EXECUTE format('SELECT COUNT(*) FROM public.%I WHERE is_deleted = false', tbl_name) INTO active_count;
            -- Silinmiş kayıtlar
            EXECUTE format('SELECT COUNT(*) FROM public.%I WHERE is_deleted = true', tbl_name) INTO deleted_count;
        ELSE
            -- Soft delete yok
            active_count := tbl_count;
            deleted_count := 0;
        END IF;
        
        INSERT INTO temp_record_counts VALUES (tbl_name, tbl_count, active_count, deleted_count);
    END LOOP;
END $$;

SELECT 
    table_name AS "📋 Tablo",
    total_records AS "🔢 Toplam Kayıt",
    active_records AS "✅ Aktif Kayıt",
    deleted_records AS "🗑️ Silinmiş Kayıt",
    CASE 
        WHEN total_records > 0 
        THEN ROUND((active_records::NUMERIC / total_records::NUMERIC) * 100, 2) || '%'
        ELSE '0%'
    END AS "📊 Aktif Oran"
FROM temp_record_counts
ORDER BY table_name;


-- ========================================
-- B��LÜM 10: İLİŞKİSEL BAĞLANTILAR HARİTASI
-- ========================================
SELECT 
    '🗺️ İLİŞKİSEL BAĞLANTILAR HARİTASI' AS "RAPOR BAŞLIĞI";

-- customers → bank_accounts
SELECT 
    '1️⃣' AS "Sıra",
    'customers' AS "📋 Ana Tablo",
    'bank_accounts' AS "🎯 Hedef Tablo",
    'customer_id' AS "🔗 Bağlantı Sütunu",
    '1:N' AS "📊 İlişki Tipi",
    'Bir müşterinin birden fazla banka/PF hesabı olabilir' AS "💡 Açıklama"

UNION ALL

-- bank_accounts → signs
SELECT 
    '2️⃣',
    'bank_accounts',
    'signs',
    'firma_id',
    '1:N',
    'Bir firma/hesabın birden fazla TABELA kaydı olabilir'

UNION ALL

-- bank_accounts → earnings
SELECT 
    '3️⃣',
    'bank_accounts',
    'earnings',
    'firma_id',
    '1:N',
    'Bir firma/hesabın birden fazla HAKEDİŞ kaydı olabilir'

UNION ALL

-- signs → earnings (via tabela_group_id)
SELECT 
    '4️⃣',
    'signs',
    'earnings',
    'tabela_group_id',
    'N:N',
    'TABELA grupları ile HAKEDİŞ kayıtları arasında çoka-çok ilişki (GRUP BAZLI)'

UNION ALL

-- customers → mcc_codes
SELECT 
    '5️⃣',
    'customers',
    'mcc_codes',
    'mcc_id',
    'N:1',
    'Birden fazla müşteri aynı MCC kodunu kullanabilir'

UNION ALL

-- customers → suspension_reasons
SELECT 
    '6️⃣',
    'customers',
    'suspension_reasons',
    'aski_nedeni_id',
    'N:1',
    'Birden fazla müşteri aynı askı nedenine sahip olabilir'

UNION ALL

-- customers → sales_representatives
SELECT 
    '7️⃣',
    'customers',
    'sales_representatives',
    'satis_temsilcisi_id',
    'N:1',
    'Bir satış temsilcisi birden fazla müşteriyle ilgilenebilir'

UNION ALL

-- customers → job_titles
SELECT 
    '8️⃣',
    'customers',
    'job_titles',
    'yetkili_unvan_id',
    'N:1',
    'Birden fazla müşteri yetkilisi aynı unvana sahip olabilir'

UNION ALL

-- bank_accounts → partnerships
SELECT 
    '9️⃣',
    'bank_accounts',
    'partnerships',
    'ortaklik_id',
    'N:1',
    'Birden fazla banka/PF hesabı aynı ortaklığa bağlı olabilir'

UNION ALL

-- signs → card_programs (JSONB array)
SELECT 
    '🔟',
    'signs',
    'card_programs',
    'kart_program_ids (JSONB)',
    'N:N',
    'TABELA kaydı birden fazla kart programına sahip olabilir (JSON array)'

UNION ALL

-- signs → banks (JSONB array)
SELECT 
    '1️⃣1️⃣',
    'signs',
    'banks',
    'bank_ids (JSONB)',
    'N:N',
    'TABELA kaydı birden fazla bankaya sahip olabilir (JSON array)'

UNION ALL

-- signs → sharings
SELECT 
    '1️⃣2️⃣',
    'signs',
    'sharings',
    'paylasim_oranlari (JSONB)',
    'N:1',
    'TABELA kayıtları paylaşım oranlarını JSON olarak tutar'

ORDER BY "Sıra";


-- ========================================
-- BÖLÜM 11: PERFORMANS İSTATİSTİKLERİ
-- ========================================
SELECT 
    '⚡ PERFORMANS İSTATİSTİKLERİ' AS "RAPOR BAŞLIĞI";

SELECT 
    schemaname AS "📂 Schema",
    relname AS "📋 Tablo",  -- ✅ FIX: tablename → relname
    seq_scan AS "🔍 Sequential Scan",
    seq_tup_read AS "📖 Sequential Read",
    idx_scan AS "📇 Index Scan",
    idx_tup_fetch AS "📇 Index Fetch",
    n_tup_ins AS "➕ Insert",
    n_tup_upd AS "🔄 Update",
    n_tup_del AS "➖ Delete",
    n_live_tup AS "✅ Live Rows",
    n_dead_tup AS "💀 Dead Rows",
    last_vacuum AS "🧹 Last Vacuum",
    last_autovacuum AS "🧹 Last AutoVacuum"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND relname IN (  -- ✅ FIX: tablename → relname
        'customers', 'products', 'bank_accounts', 'signs', 'earnings',
        'mcc_codes', 'banks', 'epk_institutions', 'ok_institutions',
        'sales_representatives', 'job_titles', 'partnerships', 
        'account_items', 'fixed_commissions', 'additional_revenues',
        'sharings', 'card_programs', 'suspension_reasons', 'domain_mappings'
    )
ORDER BY relname;  -- ✅ FIX: tablename → relname


-- ========================================
-- BÖLÜM 12: TABLO DETAY ÖZETİ
-- ========================================
SELECT 
    '📊 TABLO DETAY ÖZETİ' AS "RAPOR BAŞLIĞI";

WITH table_info AS (
    SELECT 
        t.tablename,
        COUNT(DISTINCT c.column_name) AS column_count,
        COUNT(DISTINCT CASE WHEN c.data_type = 'jsonb' THEN c.column_name END) AS jsonb_count,
        COUNT(DISTINCT CASE WHEN c.column_name = 'is_deleted' THEN 1 END) AS has_soft_delete,
        COUNT(DISTINCT CASE WHEN c.column_name IN ('created_at', 'updated_at') THEN c.column_name END) AS timestamp_count,
        COUNT(DISTINCT pk.constraint_name) AS pk_count,
        COUNT(DISTINCT fk.constraint_name) AS fk_count,
        COALESCE(s.n_live_tup, 0) AS row_count,
        pg_size_pretty(pg_total_relation_size('public.' || t.tablename)) AS total_size
    FROM pg_tables t
    LEFT JOIN information_schema.columns c 
        ON c.table_schema = t.schemaname 
        AND c.table_name = t.tablename
    LEFT JOIN information_schema.table_constraints pk
        ON pk.table_schema = t.schemaname
        AND pk.table_name = t.tablename
        AND pk.constraint_type = 'PRIMARY KEY'
    LEFT JOIN information_schema.table_constraints fk
        ON fk.table_schema = t.schemaname
        AND fk.table_name = t.tablename
        AND fk.constraint_type = 'FOREIGN KEY'
    LEFT JOIN pg_stat_user_tables s
        ON s.schemaname = t.schemaname
        AND s.relname = t.tablename  -- ✅ FIX: s.tablename → s.relname
    WHERE t.schemaname = 'public'
        AND t.tablename IN (
            'customers', 'products', 'bank_accounts', 'signs', 'earnings',
            'mcc_codes', 'banks', 'epk_institutions', 'ok_institutions',
            'sales_representatives', 'job_titles', 'partnerships', 
            'account_items', 'fixed_commissions', 'additional_revenues',
            'sharings', 'card_programs', 'suspension_reasons', 'domain_mappings'
        )
    GROUP BY t.tablename, s.n_live_tup
)
SELECT 
    tablename AS "📋 Tablo",
    column_count AS "🏷️ Sütun Sayısı",
    jsonb_count AS "📊 JSONB Sayısı",
    CASE WHEN has_soft_delete > 0 THEN '✅' ELSE '❌' END AS "🗑️ Soft Delete",
    timestamp_count AS "⏰ Timestamp",
    pk_count AS "🔑 PK",
    fk_count AS "🔗 FK",
    row_count AS "🔢 Kayıt",
    total_size AS "💾 Boyut"
FROM table_info
ORDER BY tablename;


-- ========================================
-- RAPOR SONU
-- ========================================
SELECT 
    '✅ RAPOR TAMAMLANDI' AS "DURUM",
    NOW() AS "⏰ Rapor Zamanı",
    CURRENT_USER AS "👤 Kullanıcı",
    CURRENT_DATABASE() AS "🗄️ Database";