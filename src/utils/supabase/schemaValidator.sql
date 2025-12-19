-- ============================================
-- SUPABASE DATABASE SCHEMA VALIDATOR
-- ============================================
-- Bu SQL komutu mevcut veritabanı şemasını tam olarak döker
-- Kullanım: Supabase SQL Editor'da çalıştırın
-- ============================================

-- 1️⃣ TABLOLAR VE KOLONLAR
SELECT 
  '📊 TABLES & COLUMNS' as section,
  t.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default,
  c.character_maximum_length,
  c.numeric_precision,
  c.numeric_scale,
  c.ordinal_position
FROM 
  information_schema.tables t
  JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
WHERE 
  t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY 
  t.table_name, c.ordinal_position;

-- 2️⃣ PRIMARY KEYS
SELECT 
  '🔑 PRIMARY KEYS' as section,
  tc.table_name,
  kcu.column_name,
  tc.constraint_name
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

-- 3️⃣ UNIQUE CONSTRAINTS
SELECT 
  '🎯 UNIQUE CONSTRAINTS' as section,
  tc.table_name,
  kcu.column_name,
  tc.constraint_name
FROM 
  information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE 
  tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
ORDER BY 
  tc.table_name;

-- 4️⃣ FOREIGN KEYS
SELECT 
  '🔗 FOREIGN KEYS' as section,
  tc.table_name as source_table,
  kcu.column_name as source_column,
  ccu.table_name as target_table,
  ccu.column_name as target_column,
  tc.constraint_name
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

-- 5️⃣ INDEXES
SELECT 
  '📇 INDEXES' as section,
  tablename as table_name,
  indexname as index_name,
  indexdef as index_definition
FROM 
  pg_indexes
WHERE 
  schemaname = 'public'
ORDER BY 
  tablename, indexname;

-- 6️⃣ TABLO SATIR SAYILARI
SELECT 
  '📈 ROW COUNTS' as section,
  schemaname as schema_name,
  relname as table_name,
  n_live_tup as row_count,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size
FROM 
  pg_stat_user_tables
WHERE 
  schemaname = 'public'
ORDER BY 
  n_live_tup DESC;

-- 7️⃣ ÖZET: TABLO LİSTESİ
SELECT 
  '📋 TABLE SUMMARY' as section,
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_name = t.table_name 
   AND table_schema = 'public') as column_count
FROM 
  information_schema.tables t
WHERE 
  table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY 
  table_name;
