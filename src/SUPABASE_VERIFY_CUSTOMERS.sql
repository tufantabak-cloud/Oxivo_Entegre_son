-- ========================================
-- SUPABASE CUSTOMERS TABLE VERIFICATION
-- ========================================
-- Purpose: Verify customers table structure after migration
-- Run this AFTER /SUPABASE_CUSTOMERS_FIX.sql
-- ========================================

-- ========================================
-- CHECK 1: Table Exists
-- ========================================
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'customers'
    ) 
    THEN '✅ PASS: Table "customers" exists'
    ELSE '❌ FAIL: Table "customers" NOT FOUND'
  END AS check_result;

-- ========================================
-- CHECK 2: Column Count
-- ========================================
SELECT 
  COUNT(*) AS total_columns,
  CASE 
    WHEN COUNT(*) >= 34 
    THEN '✅ PASS: Expected 34+ columns'
    ELSE '❌ FAIL: Missing columns (expected 34+)'
  END AS check_result
FROM information_schema.columns 
WHERE table_name = 'customers' 
  AND table_schema = 'public';

-- ========================================
-- CHECK 3: Critical Columns Exist
-- ========================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN column_name IN (
      'id', 'created_at', 'updated_at',
      'cari_hesap_kodu', 'cari_adi', 'guncel_my_payter_domain',
      'durum', 'domain_hierarchy', 'bank_device_assignments'
    )
    THEN '✅'
    ELSE '⚠️'
  END AS importance
FROM information_schema.columns 
WHERE table_name = 'customers' 
  AND table_schema = 'public'
  AND column_name IN (
    'id', 'created_at', 'updated_at',
    'cari_hesap_kodu', 'sektor', 'mcc', 'cari_adi',
    'guncel_my_payter_domain', 'vergi_dairesi', 'vergi_no',
    'adres', 'ilce', 'posta_kodu', 'email', 'yetkili', 'tel',
    'durum', 'p6x', 'apollo', 'sales_rep_id', 'sales_rep_name',
    'bloke_durumu', 'sorumlu_kisi', 'cari_grubu',
    'domain', 'ignore_main_domain', 'subscription_fee',
    'domain_hierarchy', 'linked_bank_pf_ids', 'bank_device_assignments',
    'service_fee_settings', 'device_subscriptions'
  )
ORDER BY 
  CASE importance
    WHEN '✅' THEN 1
    ELSE 2
  END,
  column_name;

-- ========================================
-- CHECK 4: JSONB Columns
-- ========================================
SELECT 
  column_name,
  data_type,
  CASE 
    WHEN data_type = 'jsonb' 
    THEN '✅ PASS: Correct type'
    ELSE '❌ FAIL: Wrong type'
  END AS check_result
FROM information_schema.columns 
WHERE table_name = 'customers' 
  AND table_schema = 'public'
  AND column_name IN (
    'domain_hierarchy', 
    'linked_bank_pf_ids', 
    'bank_device_assignments',
    'service_fee_settings',
    'device_subscriptions',
    'service_fee_invoices',
    'payment_reminders',
    'reminder_settings',
    'suspension_history'
  )
ORDER BY column_name;

-- ========================================
-- CHECK 5: Indexes Exist
-- ========================================
SELECT 
  indexname,
  indexdef,
  CASE 
    WHEN indexname LIKE 'idx_customers_%' 
    THEN '✅'
    ELSE '⚠️'
  END AS custom_index
FROM pg_indexes 
WHERE tablename = 'customers'
  AND schemaname = 'public'
ORDER BY indexname;

-- ========================================
-- CHECK 6: Index Count
-- ========================================
SELECT 
  COUNT(*) AS total_indexes,
  CASE 
    WHEN COUNT(*) >= 11  -- 1 primary key + 10 custom indexes
    THEN '✅ PASS: Expected 11+ indexes (1 PK + 10 custom)'
    ELSE '❌ FAIL: Missing indexes'
  END AS check_result
FROM pg_indexes 
WHERE tablename = 'customers'
  AND schemaname = 'public';

-- ========================================
-- CHECK 7: RLS Enabled
-- ========================================
SELECT 
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity = true 
    THEN '✅ PASS: RLS enabled'
    ELSE '❌ FAIL: RLS disabled'
  END AS check_result
FROM pg_tables 
WHERE tablename = 'customers'
  AND schemaname = 'public';

-- ========================================
-- CHECK 8: RLS Policies Exist
-- ========================================
SELECT 
  policyname,
  cmd,
  qual,
  with_check,
  CASE 
    WHEN policyname IS NOT NULL 
    THEN '✅ PASS: Policy exists'
    ELSE '❌ FAIL: No policies'
  END AS check_result
FROM pg_policies 
WHERE tablename = 'customers'
  AND schemaname = 'public';

-- ========================================
-- CHECK 9: Policy Count
-- ========================================
SELECT 
  COUNT(*) AS total_policies,
  CASE 
    WHEN COUNT(*) >= 1 
    THEN '✅ PASS: At least 1 policy exists'
    ELSE '❌ FAIL: No policies configured'
  END AS check_result
FROM pg_policies 
WHERE tablename = 'customers';

-- ========================================
-- CHECK 10: Trigger Exists
-- ========================================
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  CASE 
    WHEN trigger_name = 'set_updated_at' 
    THEN '✅ PASS: Auto-update trigger exists'
    ELSE '⚠️ WARN: Unexpected trigger'
  END AS check_result
FROM information_schema.triggers 
WHERE event_object_table = 'customers'
  AND event_object_schema = 'public';

-- ========================================
-- CHECK 11: Row Count (After Sync)
-- ========================================
-- Note: This will return 0 until app does auto-sync
SELECT 
  COUNT(*) AS total_rows,
  CASE 
    WHEN COUNT(*) = 0 
    THEN '⏳ PENDING: No data yet (run app to auto-sync)'
    WHEN COUNT(*) > 0 AND COUNT(*) < 352
    THEN '⚠️ PARTIAL: Some data synced'
    WHEN COUNT(*) >= 352
    THEN '✅ PASS: All data synced (352+ rows)'
    ELSE '❓ UNKNOWN'
  END AS check_result
FROM customers;

-- ========================================
-- CHECK 12: Sample Data Preview
-- ========================================
-- Show first 3 rows to verify data structure
SELECT 
  id,
  cari_hesap_kodu,
  cari_adi,
  guncel_my_payter_domain,
  durum,
  created_at
FROM customers 
ORDER BY created_at DESC 
LIMIT 3;

-- ========================================
-- CHECK 13: Data Type Verification
-- ========================================
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  numeric_precision,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ========================================
-- SUMMARY REPORT
-- ========================================
DO $$ 
DECLARE
  table_exists boolean;
  column_count integer;
  index_count integer;
  rls_enabled boolean;
  policy_count integer;
  trigger_exists boolean;
  row_count integer;
BEGIN
  -- Check table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'customers'
  ) INTO table_exists;
  
  -- Count columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'customers' AND table_schema = 'public';
  
  -- Count indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE tablename = 'customers' AND schemaname = 'public';
  
  -- Check RLS
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables 
  WHERE tablename = 'customers' AND schemaname = 'public';
  
  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'customers';
  
  -- Check trigger
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE event_object_table = 'customers' 
    AND trigger_name = 'set_updated_at'
  ) INTO trigger_exists;
  
  -- Count rows
  SELECT COUNT(*) INTO row_count FROM customers;
  
  -- Print report
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICATION REPORT: customers table';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Table Structure:';
  RAISE NOTICE '  ✓ Table exists: %', CASE WHEN table_exists THEN 'YES' ELSE 'NO' END;
  RAISE NOTICE '  ✓ Total columns: % (expected: 34+)', column_count;
  RAISE NOTICE '  ✓ Total indexes: % (expected: 11+)', index_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Security:';
  RAISE NOTICE '  ✓ RLS enabled: %', CASE WHEN rls_enabled THEN 'YES' ELSE 'NO' END;
  RAISE NOTICE '  ✓ Total policies: % (expected: 1+)', policy_count;
  RAISE NOTICE '  ✓ Auto-update trigger: %', CASE WHEN trigger_exists THEN 'YES' ELSE 'NO' END;
  RAISE NOTICE '';
  RAISE NOTICE 'Data:';
  RAISE NOTICE '  ✓ Total rows: % (expected: 352 after app sync)', row_count;
  RAISE NOTICE '';
  
  -- Final verdict
  IF table_exists AND column_count >= 34 AND index_count >= 11 
     AND rls_enabled AND policy_count >= 1 AND trigger_exists THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ALL CHECKS PASSED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    IF row_count = 0 THEN
      RAISE NOTICE 'Next step: Restart your app to auto-sync data';
    ELSE
      RAISE NOTICE 'Next step: Verify data in Table Editor';
    END IF;
  ELSE
    RAISE NOTICE '========================================';
    RAISE NOTICE '❌ SOME CHECKS FAILED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Review the detailed checks above';
    RAISE NOTICE 'Consider re-running /SUPABASE_CUSTOMERS_FIX.sql';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
