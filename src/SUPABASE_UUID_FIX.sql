-- ========================================
-- SUPABASE UUID FIX SCRIPT
-- ========================================
-- 
-- PROBLEM: sales_representatives ve job_titles tablolarında ID kolonu UUID type
--          ama frontend string ID kullanıyor (örn: "salesrep-1762358874555-mkt8s27ye")
--
-- SOLUTION: ID kolonlarını UUID'den TEXT'e çevir
--
-- ⚠️ IMPORTANT: Bu script'i Supabase Dashboard > SQL Editor'de çalıştırın
-- ========================================

-- Fix 1: Sales Representatives ID column
ALTER TABLE sales_representatives 
  ALTER COLUMN id TYPE TEXT;

-- Fix 2: Job Titles ID column
ALTER TABLE job_titles 
  ALTER COLUMN id TYPE TEXT;

-- ✅ Verification: Check column types
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('sales_representatives', 'job_titles')
  AND column_name = 'id';

-- Expected output:
-- table_name            | column_name | data_type
-- ----------------------+-------------+-----------
-- sales_representatives | id          | text
-- job_titles            | id          | text
