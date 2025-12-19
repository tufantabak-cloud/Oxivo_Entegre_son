-- ============================================
-- SUPABASE SCHEMA VALIDATOR - COMPACT VERSION
-- ============================================
-- Tek sorgu ile tüm şemayı JSON formatında döker
-- Supabase SQL Editor'da çalıştırın ve sonucu kopyalayın
-- ============================================

WITH table_info AS (
  SELECT 
    t.table_name,
    json_agg(
      json_build_object(
        'column_name', c.column_name,
        'data_type', c.data_type,
        'is_nullable', c.is_nullable,
        'column_default', c.column_default,
        'ordinal_position', c.ordinal_position
      ) ORDER BY c.ordinal_position
    ) as columns
  FROM 
    information_schema.tables t
    JOIN information_schema.columns c 
      ON t.table_name = c.table_name 
      AND t.table_schema = c.table_schema
  WHERE 
    t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
  GROUP BY t.table_name
),
pk_info AS (
  SELECT 
    tc.table_name,
    json_agg(kcu.column_name) as primary_keys
  FROM 
    information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
  WHERE 
    tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
  GROUP BY tc.table_name
),
unique_info AS (
  SELECT 
    tc.table_name,
    json_agg(kcu.column_name) as unique_columns
  FROM 
    information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
  WHERE 
    tc.constraint_type = 'UNIQUE'
    AND tc.table_schema = 'public'
  GROUP BY tc.table_name
),
fk_info AS (
  SELECT 
    tc.table_name,
    json_agg(
      json_build_object(
        'source_column', kcu.column_name,
        'target_table', ccu.table_name,
        'target_column', ccu.column_name
      )
    ) as foreign_keys
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
  GROUP BY tc.table_name
),
row_counts AS (
  SELECT 
    relname as table_name,
    n_live_tup as row_count
  FROM 
    pg_stat_user_tables
  WHERE 
    schemaname = 'public'
)

SELECT 
  json_build_object(
    'timestamp', NOW(),
    'database', current_database(),
    'schema_version', '3.2.0',
    'total_tables', COUNT(ti.table_name),
    'tables', json_agg(
      json_build_object(
        'table_name', ti.table_name,
        'column_count', json_array_length(ti.columns),
        'row_count', COALESCE(rc.row_count, 0),
        'columns', ti.columns,
        'primary_keys', COALESCE(pk.primary_keys, '[]'::json),
        'unique_columns', COALESCE(ui.unique_columns, '[]'::json),
        'foreign_keys', COALESCE(fk.foreign_keys, '[]'::json)
      ) ORDER BY ti.table_name
    )
  ) as database_schema
FROM 
  table_info ti
  LEFT JOIN pk_info pk ON ti.table_name = pk.table_name
  LEFT JOIN unique_info ui ON ti.table_name = ui.table_name
  LEFT JOIN fk_info fk ON ti.table_name = fk.table_name
  LEFT JOIN row_counts rc ON ti.table_name = rc.table_name;
