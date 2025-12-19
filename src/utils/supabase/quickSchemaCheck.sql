-- ============================================
-- QUICK SCHEMA CHECK - SUPABASE
-- ============================================
-- Kullanım: Supabase SQL Editor → Run Query
-- Tüm tabloları ve sütunları listeler
-- ============================================

SELECT 
  t.table_name AS "Tablo Adı",
  STRING_AGG(
    c.column_name || ' (' || 
    CASE 
      WHEN c.data_type = 'character varying' THEN 'VARCHAR'
      WHEN c.data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
      WHEN c.data_type = 'timestamp with time zone' THEN 'TIMESTAMPTZ'
      WHEN c.data_type = 'USER-DEFINED' THEN 'UUID'
      ELSE UPPER(c.data_type)
    END ||
    CASE 
      WHEN c.is_nullable = 'NO' THEN ' NOT NULL'
      ELSE ''
    END ||
    CASE 
      WHEN c.column_default LIKE 'gen_random_uuid()%' THEN ' DEFAULT UUID'
      WHEN c.column_default LIKE 'now()%' THEN ' DEFAULT NOW()'
      WHEN c.column_default = 'true' THEN ' DEFAULT TRUE'
      WHEN c.column_default = 'false' THEN ' DEFAULT FALSE'
      WHEN c.column_default LIKE '''%''::text%' THEN ' DEFAULT '''
      WHEN c.column_default IS NOT NULL THEN ' DEFAULT ' || c.column_default
      ELSE ''
    END ||
    ')',
    ', ' ORDER BY c.ordinal_position
  ) AS "Sütunlar",
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name AND table_schema = 'public') AS "Sütun Sayısı",
  (SELECT STRING_AGG(kcu.column_name, ', ')
   FROM information_schema.table_constraints tc
   JOIN information_schema.key_column_usage kcu
     ON tc.constraint_name = kcu.constraint_name
   WHERE tc.table_name = t.table_name 
     AND tc.constraint_type = 'PRIMARY KEY'
     AND tc.table_schema = 'public') AS "Primary Key",
  (SELECT STRING_AGG(kcu.column_name, ', ')
   FROM information_schema.table_constraints tc
   JOIN information_schema.key_column_usage kcu
     ON tc.constraint_name = kcu.constraint_name
   WHERE tc.table_name = t.table_name 
     AND tc.constraint_type = 'UNIQUE'
     AND tc.table_schema = 'public') AS "Unique Columns",
  (SELECT n_live_tup FROM pg_stat_user_tables 
   WHERE relname = t.table_name AND schemaname = 'public') AS "Kayıt Sayısı"
FROM 
  information_schema.tables t
  JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
WHERE 
  t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
GROUP BY 
  t.table_name
ORDER BY 
  t.table_name;

-- ============================================
-- BEKLENEN TABLOLAR (Kontrol için)
-- ============================================
-- Aşağıdaki 20 tablo olmalı:
-- 1.  account_items
-- 2.  additional_revenues
-- 3.  bank_accounts
-- 4.  banks
-- 5.  customers
-- 6.  documents
-- 7.  domain_mappings
-- 8.  earnings
-- 9.  epk_institutions
-- 10. fixed_commissions
-- 11. job_titles
-- 12. kart_programlar
-- 13. mcc_codes
-- 14. ok_institutions
-- 15. partnerships
-- 16. products
-- 17. sales_representatives
-- 18. sharing
-- 19. signs
-- 20. suspension_reasons
-- ============================================
