-- ========================================
-- SUPABASE COMPLETE DATABASE ANALYSIS
-- TÜM TABLOLAR (31+ Tablo)
-- ========================================
-- Tarih: 15 Aralık 2024
-- Versiyon: 2185
-- ========================================

-- ========================================
-- BÖLÜM 1: TÜM TABLOLARIN LİSTESİ
-- ========================================
SELECT 
    '📊 TÜM TABLOLAR - GENEL BAKIŞ' AS "RAPOR BAŞLIĞI";

WITH table_stats AS (
    SELECT 
        schemaname,
        relname AS tablename,
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
        WHEN tablename LIKE 'kv_store_%' THEN '🔧 Sistem (KV Store)'
        WHEN tablename IN (
            'customers', 'bank_accounts', 'signs', 'earnings', 'products',
            'transactions', 'contract_transactions', 'income_records'
        ) THEN '🏢 Ana İşlem'
        WHEN tablename IN (
            'mcc_codes', 'banks', 'epk_institutions', 'ok_institutions',
            'sales_representatives', 'job_titles', 'partnerships', 
            'sharings', 'card_programs', 'suspension_reasons',
            'revenue_models', 'categories'
        ) THEN '🏷️ Tanımlar'
        WHEN tablename IN (
            'contract_templates', 'email_templates', 'sms_templates'
        ) THEN '📝 Şablonlar'
        WHEN tablename IN (
            'customer_documents', 'contract_transaction_documents',
            'contract_audit_logs', 'duplicate_monitoring'
        ) THEN '📄 Dökümanlar/Log'
        WHEN tablename IN (
            'domain_mappings', 'petty_cash'
        ) THEN '🔧 Yardımcı'
        ELSE '❓ Diğer'
    END AS "📁 Kategori",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns c 
            WHERE c.table_schema = 'public' 
                AND c.table_name = tablename 
                AND c.column_name = 'is_deleted'
        ) THEN '✅ Soft'
        ELSE '❌ Hard'
    END AS "🗑️ Delete"
FROM table_stats
ORDER BY tablename;


-- ========================================
-- BÖLÜM 2: KATEGORİ BAZLI ÖZET
-- ========================================
SELECT 
    '📊 KATEGORİ BAZLI TABLO ÖZETİ' AS "RAPOR BAŞLIĞI";

WITH table_stats AS (
    SELECT 
        relname AS tablename,
        COALESCE(n_live_tup, 0) AS row_count
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
),
categorized AS (
    SELECT 
        tablename,
        row_count,
        CASE 
            WHEN tablename LIKE 'kv_store_%' THEN '🔧 Sistem (KV Store)'
            WHEN tablename IN (
                'customers', 'bank_accounts', 'signs', 'earnings', 'products',
                'transactions', 'contract_transactions', 'income_records'
            ) THEN '🏢 Ana İşlem'
            WHEN tablename IN (
                'mcc_codes', 'banks', 'epk_institutions', 'ok_institutions',
                'sales_representatives', 'job_titles', 'partnerships', 
                'sharings', 'card_programs', 'suspension_reasons',
                'revenue_models', 'categories'
            ) THEN '🏷️ Tanımlar'
            WHEN tablename IN (
                'contract_templates', 'email_templates', 'sms_templates'
            ) THEN '📝 Şablonlar'
            WHEN tablename IN (
                'customer_documents', 'contract_transaction_documents',
                'contract_audit_logs', 'duplicate_monitoring'
            ) THEN '📄 Dökümanlar/Log'
            WHEN tablename IN (
                'domain_mappings', 'petty_cash'
            ) THEN '🔧 Yardımcı'
            ELSE '❓ Diğer'
        END AS category
    FROM table_stats
)
SELECT 
    category AS "📁 Kategori",
    COUNT(*) AS "📋 Tablo Sayısı",
    SUM(row_count) AS "🔢 Toplam Kayıt",
    STRING_AGG(tablename, ', ' ORDER BY tablename) AS "📝 Tablolar"
FROM categorized
GROUP BY category
ORDER BY COUNT(*) DESC;


-- ========================================
-- BÖLÜM 3: YENİ TABLOLARIN DETAYLI ANALİZİ
-- ========================================
SELECT 
    '🆕 YENİ KEŞFEDILEN TABLOLAR' AS "RAPOR BAŞLIĞI";

SELECT 
    t.tablename AS "📋 Tablo",
    COUNT(DISTINCT c.column_name) AS "🏷️ Sütun Sayısı",
    COALESCE(s.n_live_tup, 0) AS "🔢 Kayıt",
    pg_size_pretty(pg_total_relation_size('public.' || t.tablename)) AS "💾 Boyut",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns c2
            WHERE c2.table_schema = 'public' 
                AND c2.table_name = t.tablename 
                AND c2.column_name = 'is_deleted'
        ) THEN '✅ Soft Delete'
        ELSE '❌ Hard Delete'
    END AS "🗑️ Delete Stratejisi",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns c2
            WHERE c2.table_schema = 'public' 
                AND c2.table_name = t.tablename 
                AND c2.data_type = 'jsonb'
        ) THEN '✅ Var'
        ELSE '❌ Yok'
    END AS "📊 JSONB"
FROM pg_tables t
LEFT JOIN information_schema.columns c 
    ON c.table_schema = t.schemaname 
    AND c.table_name = t.tablename
LEFT JOIN pg_stat_user_tables s
    ON s.schemaname = t.schemaname
    AND s.relname = t.tablename
WHERE t.schemaname = 'public'
    AND t.tablename IN (
        'categories',
        'contract_audit_logs',
        'contract_templates',
        'contract_transaction_documents',
        'contract_transactions',
        'customer_documents',
        'duplicate_monitoring',
        'email_templates',
        'income_records',
        'petty_cash',
        'revenue_models',
        'sms_templates',
        'transactions'
    )
GROUP BY t.tablename, s.n_live_tup
ORDER BY t.tablename;


-- ========================================
-- BÖLÜM 4: TÜM TABLOLARIN SÜTUN DETAYLARI
-- ========================================
SELECT 
    '📋 TÜM TABLOLARIN SÜTUN DETAYLARI' AS "RAPOR BAŞLIĞI";

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
    CASE 
        WHEN pk.constraint_type = 'PRIMARY KEY' THEN '🔑 PK'
        WHEN fk.constraint_type = 'FOREIGN KEY' THEN '🔗 FK'
        WHEN uq.constraint_type = 'UNIQUE' THEN '⭐ UNIQUE'
        ELSE '-'
    END AS "🎯 Constraint",
    CASE 
        WHEN c.column_name = 'is_deleted' THEN '🗑️ Soft Delete'
        WHEN c.column_name IN ('created_at', 'updated_at', 'deleted_at') THEN '⏰ Timestamp'
        WHEN c.data_type = 'jsonb' THEN '📊 JSON Data'
        WHEN c.data_type = 'uuid' THEN '🆔 UUID'
        WHEN c.column_name LIKE '%_id' OR c.column_name LIKE '%_kod' THEN '🔗 Referans'
        ELSE '-'
    END AS "💡 Özellik"
FROM information_schema.columns c
LEFT JOIN (
    SELECT kcu.table_name, kcu.column_name, tc.constraint_type
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.table_constraints tc 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
) pk ON pk.table_name = c.table_name AND pk.column_name = c.column_name
LEFT JOIN (
    SELECT kcu.table_name, kcu.column_name, tc.constraint_type
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.table_constraints tc 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
) fk ON fk.table_name = c.table_name AND fk.column_name = c.column_name
LEFT JOIN (
    SELECT kcu.table_name, kcu.column_name, tc.constraint_type
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.table_constraints tc 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_schema = 'public'
) uq ON uq.table_name = c.table_name AND uq.column_name = c.column_name
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;


-- ========================================
-- BÖLÜM 5: TÜM FOREIGN KEY İLİŞKİLERİ
-- ========================================
SELECT 
    '🔗 TÜM FOREIGN KEY İLİŞKİLERİ' AS "RAPOR BAŞLIĞI";

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
-- BÖLÜM 6: TÜM JSONB SÜTUNLAR
-- ========================================
SELECT 
    '📊 TÜM JSONB SÜTUNLAR' AS "RAPOR BAŞLIĞI";

SELECT 
    table_name AS "📋 Tablo",
    column_name AS "🏷️ JSONB Sütun",
    CASE 
        WHEN column_name LIKE '%_ids' THEN '🔢 ID Array - ID listesi'
        WHEN column_name LIKE '%_map' THEN '🗺️ Map Object - Anahtar-değer'
        WHEN column_name LIKE '%_oranlari' THEN '📈 Percentage - Oran verileri'
        WHEN column_name LIKE '%_detay%' THEN '📝 Detail - Detay verileri'
        WHEN column_name LIKE '%_modeli' THEN '🎯 Model - Model tanımı'
        WHEN column_name LIKE '%_data' THEN '💾 Data - Genel veri'
        WHEN column_name LIKE '%_settings' THEN '⚙️ Settings - Ayarlar'
        WHEN column_name LIKE '%_metadata' THEN '📋 Metadata - Meta veri'
        WHEN column_name LIKE '%_content' THEN '📄 Content - İçerik'
        ELSE '📊 Generic - Genel JSON'
    END AS "💡 Kullanım Amacı",
    CASE 
        WHEN is_nullable = 'NO' THEN '❌ NOT NULL'
        ELSE '✅ NULL'
    END AS "⚡ Nullable"
FROM information_schema.columns
WHERE table_schema = 'public'
    AND data_type = 'jsonb'
ORDER BY table_name, column_name;


-- ========================================
-- BÖLÜM 7: SOFT DELETE ANALİZİ (TÜM TABLOLAR)
-- ========================================
SELECT 
    '🗑️ SOFT DELETE ANALİZİ (TÜM TABLOLAR)' AS "RAPOR BAŞLIĞI";

WITH soft_delete_check AS (
    SELECT 
        table_name,
        EXISTS (
            SELECT 1 FROM information_schema.columns c2
            WHERE c2.table_schema = 'public'
                AND c2.table_name = c.table_name
                AND c2.column_name = 'is_deleted'
        ) AS has_is_deleted,
        EXISTS (
            SELECT 1 FROM information_schema.columns c2
            WHERE c2.table_schema = 'public'
                AND c2.table_name = c.table_name
                AND c2.column_name = 'deleted_at'
        ) AS has_deleted_at
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
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
-- BÖLÜM 8: YENİ TABLOLARIN ÖZEL ANALİZİ
-- ========================================
SELECT 
    '🔍 YENİ TABLOLAR - ÖZEL ANALİZ' AS "RAPOR BAŞLIĞI";

-- TRANSACTIONS (İşlemler)
SELECT 
    'transactions' AS "📋 Tablo",
    'İşlem Kayıtları' AS "🎯 Amaç",
    COUNT(*) AS "🔢 Sütun Sayısı"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'transactions'

UNION ALL

-- CONTRACT_TRANSACTIONS (Sözleşme İşlemleri)
SELECT 
    'contract_transactions',
    'Sözleşme İşlem Kayıtları',
    COUNT(*)
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'contract_transactions'

UNION ALL

-- INCOME_RECORDS (Gelir Kayıtları)
SELECT 
    'income_records',
    'Gelir Kayıt Sistemi',
    COUNT(*)
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'income_records'

UNION ALL

-- REVENUE_MODELS (Gelir Modelleri)
SELECT 
    'revenue_models',
    'Gelir Model Tanımları',
    COUNT(*)
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'revenue_models'

UNION ALL

-- CATEGORIES (Kategoriler)
SELECT 
    'categories',
    'Kategori Tanımları',
    COUNT(*)
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'categories'

UNION ALL

-- PETTY_CASH (Kasa)
SELECT 
    'petty_cash',
    'Kasa Yönetimi',
    COUNT(*)
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'petty_cash'

UNION ALL

-- CONTRACT_TEMPLATES (Sözleşme Şablonları)
SELECT 
    'contract_templates',
    'Sözleşme Şablon Yönetimi',
    COUNT(*)
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'contract_templates'

UNION ALL

-- EMAIL_TEMPLATES (Email Şablonları)
SELECT 
    'email_templates',
    'Email Şablon Yönetimi',
    COUNT(*)
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'email_templates'

UNION ALL

-- SMS_TEMPLATES (SMS Şablonları)
SELECT 
    'sms_templates',
    'SMS Şablon Yönetimi',
    COUNT(*)
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sms_templates'

UNION ALL

-- CUSTOMER_DOCUMENTS (Müşteri Dökümanları)
SELECT 
    'customer_documents',
    'Müşteri Döküman Yönetimi',
    COUNT(*)
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'customer_documents'

UNION ALL

-- CONTRACT_TRANSACTION_DOCUMENTS (Sözleşme İşlem Dökümanları)
SELECT 
    'contract_transaction_documents',
    'Sözleşme İşlem Döküman Yönetimi',
    COUNT(*)
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'contract_transaction_documents'

UNION ALL

-- CONTRACT_AUDIT_LOGS (Sözleşme Audit Logları)
SELECT 
    'contract_audit_logs',
    'Sözleşme Değişiklik Logları',
    COUNT(*)
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'contract_audit_logs'

UNION ALL

-- DUPLICATE_MONITORING (Duplikasyon Takibi)
SELECT 
    'duplicate_monitoring',
    'Duplikasyon Kontrolü',
    COUNT(*)
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'duplicate_monitoring';


-- ========================================
-- BÖLÜM 9: TABLO BOYUTLARI (EN BÜYÜKTEN EN KÜÇÜĞE)
-- ========================================
SELECT 
    '💾 TABLO BOYUTLARI (Sıralı)' AS "RAPOR BAŞLIĞI";

SELECT 
    tablename AS "📋 Tablo",
    pg_size_pretty(pg_total_relation_size('public.' || tablename)) AS "💾 Toplam Boyut",
    pg_size_pretty(pg_relation_size('public.' || tablename)) AS "📊 Tablo Boyutu",
    pg_size_pretty(pg_total_relation_size('public.' || tablename) - pg_relation_size('public.' || tablename)) AS "📇 Index Boyutu",
    ROUND(
        100.0 * (pg_total_relation_size('public.' || tablename) - pg_relation_size('public.' || tablename)) / 
        NULLIF(pg_total_relation_size('public.' || tablename), 0), 
        2
    ) AS "📊 Index Oranı %"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.' || tablename) DESC;


-- ========================================
-- BÖLÜM 10: PERFORMANS İSTATİSTİKLERİ
-- ========================================
SELECT 
    '⚡ PERFORMANS İSTATİSTİKLERİ (TÜM TABLOLAR)' AS "RAPOR BAŞLIĞI";

SELECT 
    schemaname AS "📂 Schema",
    relname AS "📋 Tablo",
    seq_scan AS "🔍 Sequential Scan",
    idx_scan AS "📇 Index Scan",
    CASE 
        WHEN (seq_scan + COALESCE(idx_scan, 0)) > 0 
        THEN ROUND((COALESCE(idx_scan, 0)::NUMERIC / (seq_scan + COALESCE(idx_scan, 0))::NUMERIC) * 100, 2)
        ELSE 0
    END AS "📊 Index Kullanım %",
    n_tup_ins AS "➕ Insert",
    n_tup_upd AS "🔄 Update",
    n_tup_del AS "➖ Delete",
    n_live_tup AS "✅ Live Rows",
    n_dead_tup AS "💀 Dead Rows"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;


-- ========================================
-- BÖLÜM 11: İLİŞKİ HARİTASI GRAFİĞİ
-- ========================================
SELECT 
    '🗺️ TABLO İLİŞKİ HARİTASI' AS "RAPOR BAŞLIĞI";

WITH fk_relations AS (
    SELECT 
        tc.table_name,
        COUNT(DISTINCT tc.constraint_name) AS fk_to_others,
        COUNT(DISTINCT CASE WHEN ccu.table_name = tc.table_name THEN NULL ELSE ccu.table_name END) AS referenced_tables
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
),
referenced_by AS (
    SELECT 
        ccu.table_name,
        COUNT(DISTINCT tc.table_name) AS referenced_by_count
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    GROUP BY ccu.table_name
)
SELECT 
    t.tablename AS "📋 Tablo",
    COALESCE(fk.fk_to_others, 0) AS "🔗 Diğerlerine FK",
    COALESCE(rb.referenced_by_count, 0) AS "⬅️ Bu Tabloya Referans",
    CASE 
        WHEN COALESCE(fk.fk_to_others, 0) = 0 AND COALESCE(rb.referenced_by_count, 0) = 0 THEN '🔴 İzole'
        WHEN COALESCE(rb.referenced_by_count, 0) > 5 THEN '🌟 Merkezi (Ana Tablo)'
        WHEN COALESCE(fk.fk_to_others, 0) > 5 THEN '🔗 Çok İlişkili'
        ELSE '🟢 Normal'
    END AS "💡 İlişki Durumu"
FROM pg_tables t
LEFT JOIN fk_relations fk ON fk.table_name = t.tablename
LEFT JOIN referenced_by rb ON rb.table_name = t.tablename
WHERE t.schemaname = 'public'
ORDER BY (COALESCE(rb.referenced_by_count, 0) + COALESCE(fk.fk_to_others, 0)) DESC;


-- ========================================
-- BÖLÜM 12: SON ÖZET RAPORU
-- ========================================
SELECT 
    '📊 VERİTABANI SON ÖZET' AS "RAPOR BAŞLIĞI";

SELECT 
    'Toplam Tablo Sayısı' AS "📋 Metrik",
    COUNT(*)::TEXT AS "🔢 Değer"
FROM pg_tables
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Soft Delete Kullanan',
    COUNT(DISTINCT table_name)::TEXT
FROM information_schema.columns
WHERE table_schema = 'public' AND column_name = 'is_deleted'

UNION ALL

SELECT 
    'JSONB Kullanan',
    COUNT(DISTINCT table_name)::TEXT
FROM information_schema.columns
WHERE table_schema = 'public' AND data_type = 'jsonb'

UNION ALL

SELECT 
    'Toplam Sütun Sayısı',
    COUNT(*)::TEXT
FROM information_schema.columns
WHERE table_schema = 'public'

UNION ALL

SELECT 
    'Toplam Foreign Key',
    COUNT(*)::TEXT
FROM information_schema.table_constraints
WHERE table_schema = 'public' AND constraint_type = 'FOREIGN KEY'

UNION ALL

SELECT 
    'Toplam Index',
    COUNT(*)::TEXT
FROM pg_indexes
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Toplam Kayıt (Tahmini)',
    SUM(n_live_tup)::TEXT
FROM pg_stat_user_tables
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Toplam Boyut',
    pg_size_pretty(SUM(pg_total_relation_size('public.' || tablename)))
FROM pg_tables
WHERE schemaname = 'public';


-- ========================================
-- RAPOR SONU
-- ========================================
SELECT 
    '✅ RAPOR TAMAMLANDI' AS "DURUM",
    NOW() AS "⏰ Rapor Zamanı",
    CURRENT_USER AS "👤 Kullanıcı",
    CURRENT_DATABASE() AS "🗄️ Database",
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') AS "📊 Toplam Tablo";
