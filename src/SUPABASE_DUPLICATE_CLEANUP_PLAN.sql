-- =====================================================
-- 🧹 SUPABASE DUPLICATE CLEANUP & PREVENTION
-- =====================================================
-- Tüm tablolardaki duplicate kayıtları güvenli şekilde temizler
-- ve gelecekte oluşmasını engeller
-- 
-- EXECUTION ORDER:
-- 1. Backup check
-- 2. Duplicate analysis
-- 3. Safe cleanup
-- 4. Unique constraints
-- 5. Verification
-- =====================================================

-- =====================================================
-- STEP 1: BACKUP CHECK (SAFETY FIRST!)
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔒 STEP 1: BACKUP VERIFICATION';
  RAISE NOTICE '====================================';
  RAISE NOTICE '⚠️  IMPORTANT: Ensure you have a recent backup!';
  RAISE NOTICE '📋 Check backup status in Supabase Dashboard';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- STEP 2: DUPLICATE ANALYSIS (BEFORE CLEANUP)
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 STEP 2: DUPLICATE ANALYSIS';
  RAISE NOTICE '====================================';
END $$;

-- Check duplicates in all tables
SELECT 
  'customers' as tablo,
  'firma_unvan' as alan,
  COUNT(*) - COUNT(DISTINCT firma_unvan) as duplicate_count
FROM customers
WHERE firma_unvan IS NOT NULL

UNION ALL

SELECT 
  'customers' as tablo,
  'cari_hesap_kodu' as alan,
  COUNT(*) - COUNT(DISTINCT cari_hesap_kodu) as duplicate_count
FROM customers
WHERE cari_hesap_kodu IS NOT NULL

UNION ALL

SELECT 
  'products' as tablo,
  'urun_kodu' as alan,
  COUNT(*) - COUNT(DISTINCT urun_kodu) as duplicate_count
FROM products
WHERE urun_kodu IS NOT NULL

UNION ALL

SELECT 
  'products' as tablo,
  'serial_number' as alan,
  COUNT(*) - COUNT(DISTINCT serial_number) as duplicate_count
FROM products
WHERE serial_number IS NOT NULL

UNION ALL

SELECT 
  'bank_accounts' as tablo,
  'firma_unvan' as alan,
  COUNT(*) - COUNT(DISTINCT firma_unvan) as duplicate_count
FROM bank_accounts
WHERE firma_unvan IS NOT NULL

UNION ALL

SELECT 
  'bank_accounts' as tablo,
  'hesap_no' as alan,
  COUNT(*) - COUNT(DISTINCT hesap_no) as duplicate_count
FROM bank_accounts
WHERE hesap_no IS NOT NULL

UNION ALL

SELECT 
  'mcc_codes' as tablo,
  'kod' as alan,
  COUNT(*) - COUNT(DISTINCT kod) as duplicate_count
FROM mcc_codes
WHERE kod IS NOT NULL

UNION ALL

SELECT 
  'banks' as tablo,
  'kod' as alan,
  COUNT(*) - COUNT(DISTINCT kod) as duplicate_count
FROM banks
WHERE kod IS NOT NULL

UNION ALL

SELECT 
  'epk' as tablo,
  'kod' as alan,
  COUNT(*) - COUNT(DISTINCT kod) as duplicate_count
FROM epk
WHERE kod IS NOT NULL

UNION ALL

SELECT 
  'ok' as tablo,
  'kod' as alan,
  COUNT(*) - COUNT(DISTINCT kod) as duplicate_count
FROM ok
WHERE kod IS NOT NULL

UNION ALL

SELECT 
  'sales_representatives' as tablo,
  'name' as alan,
  COUNT(*) - COUNT(DISTINCT name) as duplicate_count
FROM sales_representatives
WHERE name IS NOT NULL

UNION ALL

SELECT 
  'job_titles' as tablo,
  'title' as alan,
  COUNT(*) - COUNT(DISTINCT title) as duplicate_count
FROM job_titles
WHERE title IS NOT NULL

UNION ALL

SELECT 
  'partnerships' as tablo,
  'partner_name' as alan,
  COUNT(*) - COUNT(DISTINCT partner_name) as duplicate_count
FROM partnerships
WHERE partner_name IS NOT NULL

UNION ALL

SELECT 
  'account_items' as tablo,
  'kod' as alan,
  COUNT(*) - COUNT(DISTINCT kod) as duplicate_count
FROM account_items
WHERE kod IS NOT NULL

UNION ALL

SELECT 
  'sharings' as tablo,
  'tip' as alan,
  COUNT(*) - COUNT(DISTINCT tip) as duplicate_count
FROM sharings
WHERE tip IS NOT NULL

UNION ALL

SELECT 
  'card_programs' as tablo,
  'kod' as alan,
  COUNT(*) - COUNT(DISTINCT kod) as duplicate_count
FROM card_programs
WHERE kod IS NOT NULL

UNION ALL

SELECT 
  'suspension_reasons' as tablo,
  'kod' as alan,
  COUNT(*) - COUNT(DISTINCT kod) as duplicate_count
FROM suspension_reasons
WHERE kod IS NOT NULL

ORDER BY duplicate_count DESC;

-- =====================================================
-- STEP 3: DETAILED DUPLICATE INSPECTION
-- =====================================================

-- Show exact duplicate records with IDs
-- Customers - firma_unvan duplicates
SELECT 
  'customers' as tablo,
  firma_unvan as duplicate_value,
  COUNT(*) as count,
  ARRAY_AGG(id ORDER BY created_at ASC) as all_ids,
  ARRAY_AGG(id ORDER BY created_at ASC)[1] as keep_id,
  ARRAY_AGG(id ORDER BY created_at ASC)[2:] as delete_ids
FROM customers
WHERE firma_unvan IS NOT NULL
GROUP BY firma_unvan
HAVING COUNT(*) > 1;

-- Products - urun_kodu duplicates
SELECT 
  'products' as tablo,
  urun_kodu as duplicate_value,
  COUNT(*) as count,
  ARRAY_AGG(id ORDER BY created_at ASC) as all_ids,
  ARRAY_AGG(id ORDER BY created_at ASC)[1] as keep_id,
  ARRAY_AGG(id ORDER BY created_at ASC)[2:] as delete_ids
FROM products
WHERE urun_kodu IS NOT NULL
GROUP BY urun_kodu
HAVING COUNT(*) > 1;

-- Bank PF - firma_unvan duplicates
SELECT 
  'bank_accounts' as tablo,
  firma_unvan as duplicate_value,
  COUNT(*) as count,
  ARRAY_AGG(id ORDER BY created_at ASC) as all_ids,
  ARRAY_AGG(id ORDER BY created_at ASC)[1] as keep_id,
  ARRAY_AGG(id ORDER BY created_at ASC)[2:] as delete_ids
FROM bank_accounts
WHERE firma_unvan IS NOT NULL
GROUP BY firma_unvan
HAVING COUNT(*) > 1;

-- =====================================================
-- STEP 4: SAFE CLEANUP (EXECUTE AFTER REVIEWING ABOVE)
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧹 STEP 4: SAFE DUPLICATE CLEANUP';
  RAISE NOTICE '====================================';
  RAISE NOTICE '⚠️  This will delete duplicate records!';
  RAISE NOTICE '📋 Keeping oldest record (by created_at)';
  RAISE NOTICE '';
END $$;

-- Cleanup function is already created by migration
-- Just run it for all tables
SELECT * FROM cleanup_all_duplicates();

-- =====================================================
-- STEP 5: ADD UNIQUE CONSTRAINTS (PREVENTION)
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔒 STEP 5: ADDING UNIQUE CONSTRAINTS';
  RAISE NOTICE '====================================';
END $$;

-- Already added by migration script, but double-check

-- Sales Representatives - name
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sales_representatives_name_unique'
  ) THEN
    -- First cleanup
    PERFORM cleanup_duplicates('sales_representatives', 'name', 'latest');
    
    -- Then add constraint
    ALTER TABLE sales_representatives 
    ADD CONSTRAINT sales_representatives_name_unique 
    UNIQUE (name);
    
    RAISE NOTICE '✅ Added: sales_representatives.name UNIQUE';
  ELSE
    RAISE NOTICE '⏭️  Exists: sales_representatives.name UNIQUE';
  END IF;
END $$;

-- Job Titles - title
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'job_titles_title_unique'
  ) THEN
    PERFORM cleanup_duplicates('job_titles', 'title', 'latest');
    
    ALTER TABLE job_titles 
    ADD CONSTRAINT job_titles_title_unique 
    UNIQUE (title);
    
    RAISE NOTICE '✅ Added: job_titles.title UNIQUE';
  ELSE
    RAISE NOTICE '⏭️  Exists: job_titles.title UNIQUE';
  END IF;
END $$;

-- Account Items - kod
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'account_items_kod_unique'
  ) THEN
    PERFORM cleanup_duplicates('account_items', 'kod', 'latest');
    
    ALTER TABLE account_items 
    ADD CONSTRAINT account_items_kod_unique 
    UNIQUE (kod);
    
    RAISE NOTICE '✅ Added: account_items.kod UNIQUE';
  ELSE
    RAISE NOTICE '⏭️  Exists: account_items.kod UNIQUE';
  END IF;
END $$;

-- =====================================================
-- STEP 6: VERIFICATION & FINAL REPORT
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ STEP 6: VERIFICATION REPORT';
  RAISE NOTICE '====================================';
END $$;

-- Check if any duplicates remain
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ NO DUPLICATES FOUND!'
    ELSE '⚠️  DUPLICATES STILL EXIST'
  END as status,
  COUNT(*) as duplicate_tables
FROM duplicate_monitoring;

-- Count unique constraints added
SELECT 
  COUNT(*) as total_unique_constraints,
  '✅ Constraints active' as status
FROM pg_constraint 
WHERE contype = 'u' 
AND conrelid::regclass::text IN (
  'customers', 'products', 'bank_accounts', 
  'mcc_codes', 'banks', 'epk', 'ok',
  'sales_representatives', 'job_titles',
  'partnerships', 'account_items', 'sharings',
  'card_programs', 'suspension_reasons'
);

-- =====================================================
-- FINAL SUMMARY
-- =====================================================

DO $$
DECLARE
  total_constraints INTEGER;
  remaining_duplicates INTEGER;
BEGIN
  -- Count constraints
  SELECT COUNT(*) INTO total_constraints
  FROM pg_constraint 
  WHERE contype = 'u' 
  AND conrelid::regclass::text IN (
    'customers', 'products', 'bank_accounts', 
    'mcc_codes', 'banks', 'epk', 'ok',
    'sales_representatives', 'job_titles',
    'partnerships', 'account_items', 'sharings',
    'card_programs', 'suspension_reasons'
  );
  
  -- Count remaining duplicates
  SELECT COUNT(*) INTO remaining_duplicates
  FROM duplicate_monitoring;
  
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '🎉 DUPLICATE CLEANUP COMPLETE!';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Final Statistics:';
  RAISE NOTICE '  ✅ Unique Constraints: %', total_constraints;
  RAISE NOTICE '  ✅ Remaining Duplicates: %', remaining_duplicates;
  RAISE NOTICE '';
  
  IF remaining_duplicates > 0 THEN
    RAISE NOTICE '⚠️  WARNING: Some duplicates remain!';
    RAISE NOTICE '  Run: SELECT * FROM duplicate_monitoring;';
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE '✅ SUCCESS: All duplicates removed!';
    RAISE NOTICE '  🔒 Future duplicates will be prevented';
    RAISE NOTICE '';
  END IF;
  
  RAISE NOTICE '📋 Monitoring:';
  RAISE NOTICE '  SELECT * FROM duplicate_monitoring;';
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
END $$;
