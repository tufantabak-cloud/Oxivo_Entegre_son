-- ============================================
-- 🔍 COMPLETE SCHEMA VALIDATION
-- ============================================
-- Supabase SQL Editor'da çalıştırın
-- Tüm tabloları, kolonları, constraint'leri kontrol eder
-- ============================================

-- ============================================
-- PART 1: TABLO ÖZET LİSTESİ
-- ============================================
SELECT 
  '🎯 GENEL DURUM' as "Bölüm",
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as "Toplam Tablo",
  (SELECT SUM((SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name AND table_schema = 'public'))
   FROM information_schema.tables t
   WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE') as "Toplam Sütun",
  (SELECT SUM(n_live_tup) FROM pg_stat_user_tables 
   WHERE schemaname = 'public') as "Toplam Kayıt";

-- ============================================
-- PART 2: DETAYLI TABLO LİSTESİ
-- ============================================
SELECT 
  '📋 DETAYLI TABLO LİSTESİ' as "Bölüm",
  t.table_name as "Tablo Adı",
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name AND table_schema = 'public') as "Sütun Sayısı",
  (SELECT STRING_AGG(kcu.column_name, ', ')
   FROM information_schema.table_constraints tc
   JOIN information_schema.key_column_usage kcu
     ON tc.constraint_name = kcu.constraint_name
   WHERE tc.table_name = t.table_name 
     AND tc.constraint_type = 'PRIMARY KEY'
     AND tc.table_schema = 'public') as "Primary Key",
  (SELECT COUNT(*)
   FROM information_schema.table_constraints tc
   WHERE tc.table_name = t.table_name 
     AND tc.constraint_type = 'UNIQUE'
     AND tc.table_schema = 'public') as "Unique Count",
  (SELECT COUNT(*)
   FROM information_schema.table_constraints tc
   WHERE tc.table_name = t.table_name 
     AND tc.constraint_type = 'FOREIGN KEY'
     AND tc.table_schema = 'public') as "Foreign Key Count",
  (SELECT n_live_tup FROM pg_stat_user_tables 
   WHERE relname = t.table_name AND schemaname = 'public') as "Kayıt Sayısı",
  (SELECT pg_size_pretty(pg_total_relation_size(relid)) 
   FROM pg_stat_user_tables 
   WHERE relname = t.table_name AND schemaname = 'public') as "Tablo Boyutu"
FROM 
  information_schema.tables t
WHERE 
  t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY 
  t.table_name;

-- ============================================
-- PART 3: TÜM SÜTUNLAR (DETAYLI)
-- ============================================
SELECT 
  '📊 TÜM SÜTUNLAR' as "Bölüm",
  c.table_name as "Tablo",
  c.column_name as "Sütun",
  CASE 
    WHEN c.data_type = 'character varying' THEN 'VARCHAR'
    WHEN c.data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
    WHEN c.data_type = 'timestamp with time zone' THEN 'TIMESTAMPTZ'
    WHEN c.data_type = 'USER-DEFINED' THEN 'UUID'
    WHEN c.data_type = 'numeric' THEN 'NUMERIC'
    WHEN c.data_type = 'boolean' THEN 'BOOLEAN'
    WHEN c.data_type = 'text' THEN 'TEXT'
    WHEN c.data_type = 'jsonb' THEN 'JSONB'
    WHEN c.data_type = 'integer' THEN 'INTEGER'
    ELSE UPPER(c.data_type)
  END as "Tip",
  CASE 
    WHEN c.is_nullable = 'NO' THEN '✅ NOT NULL'
    ELSE '❌ NULL'
  END as "Zorunlu",
  CASE 
    WHEN c.column_default LIKE '%gen_random_uuid()%' THEN '🔑 UUID'
    WHEN c.column_default LIKE '%now()%' THEN '⏰ NOW()'
    WHEN c.column_default = 'true' THEN '✅ TRUE'
    WHEN c.column_default = 'false' THEN '❌ FALSE'
    WHEN c.column_default LIKE '''[]''::jsonb' THEN '📦 []'
    WHEN c.column_default IS NOT NULL THEN '📌 ' || LEFT(c.column_default, 20)
    ELSE '-'
  END as "Varsayılan",
  c.ordinal_position as "Sıra"
FROM 
  information_schema.columns c
WHERE 
  c.table_schema = 'public'
ORDER BY 
  c.table_name, c.ordinal_position;

-- ============================================
-- PART 4: PRIMARY KEYS
-- ============================================
SELECT 
  '🔑 PRIMARY KEYS' as "Bölüm",
  tc.table_name as "Tablo",
  kcu.column_name as "Sütun",
  tc.constraint_name as "Constraint Adı"
FROM 
  information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE 
  tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema = 'public'
ORDER BY 
  tc.table_name;

-- ============================================
-- PART 5: UNIQUE CONSTRAINTS
-- ============================================
SELECT 
  '🎯 UNIQUE CONSTRAINTS' as "Bölüm",
  tc.table_name as "Tablo",
  kcu.column_name as "Sütun",
  tc.constraint_name as "Constraint Adı"
FROM 
  information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE 
  tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
ORDER BY 
  tc.table_name, kcu.column_name;

-- ============================================
-- PART 6: FOREIGN KEYS
-- ============================================
SELECT 
  '🔗 FOREIGN KEYS' as "Bölüm",
  tc.table_name as "Kaynak Tablo",
  kcu.column_name as "Kaynak Sütun",
  ccu.table_name as "Hedef Tablo",
  ccu.column_name as "Hedef Sütun",
  tc.constraint_name as "Constraint Adı"
FROM 
  information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE 
  tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY 
  tc.table_name;

-- ============================================
-- PART 7: INDEXES
-- ============================================
SELECT 
  '📇 INDEXES' as "Bölüm",
  tablename as "Tablo",
  indexname as "Index Adı",
  indexdef as "Tanım"
FROM 
  pg_indexes
WHERE 
  schemaname = 'public'
ORDER BY 
  tablename, indexname;

-- ============================================
-- PART 8: JSONB SÜTUNLAR (ÖZEL KONTROL)
-- ============================================
SELECT 
  '📦 JSONB SÜTUNLAR' as "Bölüm",
  c.table_name as "Tablo",
  c.column_name as "JSONB Sütun",
  c.is_nullable as "Nullable",
  c.column_default as "Varsayılan"
FROM 
  information_schema.columns c
WHERE 
  c.table_schema = 'public'
  AND c.data_type = 'jsonb'
ORDER BY 
  c.table_name, c.column_name;

-- ============================================
-- PART 9: EKSIK CONSTRAINT'LER (ÖNERILER)
-- ============================================
SELECT 
  '⚠️ ÖNERİLER' as "Bölüm",
  'signs' as "Tablo",
  'firma_id' as "Sütun",
  'bank_accounts' as "Referans Tablo",
  'id' as "Referans Sütun",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'signs' 
        AND kcu.column_name = 'firma_id'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    ) THEN '✅ FK VAR'
    ELSE '❌ FK YOK (Önerilir)'
  END as "Durum"

UNION ALL

SELECT 
  '⚠️ ÖNERİLER',
  'earnings',
  'firma_id',
  'bank_accounts',
  'id',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'earnings' 
        AND kcu.column_name = 'firma_id'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    ) THEN '✅ FK VAR'
    ELSE '❌ FK YOK (Önerilir)'
  END

UNION ALL

SELECT 
  '⚠️ ÖNERİLER',
  'kart_programlar',
  'banka_id',
  'banks',
  'id',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'kart_programlar' 
        AND kcu.column_name = 'banka_id'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    ) THEN '✅ FK VAR'
    ELSE '❌ FK YOK (Önerilir)'
  END;

-- ============================================
-- PART 10: FINAL KONTROL - BEKLENEN TABLOLAR
-- ============================================
WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'account_items',
    'additional_revenues',
    'bank_accounts',
    'banks',
    'customers',
    'documents',
    'domain_mappings',
    'earnings',
    'epk_institutions',
    'fixed_commissions',
    'job_titles',
    'kart_programlar',
    'mcc_codes',
    'ok_institutions',
    'partnerships',
    'products',
    'sales_representatives',
    'sharing',
    'signs',
    'suspension_reasons'
  ]) as expected_table
),
actual_tables AS (
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
)
SELECT 
  '✅ FINAL KONTROL' as "Bölüm",
  e.expected_table as "Beklenen Tablo",
  CASE 
    WHEN a.table_name IS NOT NULL THEN '✅ VAR'
    ELSE '❌ YOK'
  END as "Durum",
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = e.expected_table AND table_schema = 'public') as "Sütun Sayısı"
FROM 
  expected_tables e
  LEFT JOIN actual_tables a ON e.expected_table = a.table_name
ORDER BY 
  e.expected_table;

-- ============================================
-- BITTI! Sonuçları inceleyin:
-- 1. 20 tablo olmalı
-- 2. Primary Key'ler UUID olmalı
-- 3. JSONB alanlar doğru olmalı
-- 4. Foreign Key'ler eksik olabilir (runtime enrichment)
-- ============================================
