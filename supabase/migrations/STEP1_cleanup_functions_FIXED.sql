-- =====================================================
-- STEP 1: CLEANUP FUNCTIONS (FIXED)
-- =====================================================
-- Run this first in Supabase SQL Editor

-- Generic cleanup function (FIXED)
CREATE OR REPLACE FUNCTION cleanup_duplicates(
  table_name TEXT,
  unique_column TEXT,
  keep_strategy TEXT DEFAULT 'latest'
)
RETURNS TABLE(
  deleted_count BIGINT,
  kept_count BIGINT
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted_count BIGINT := 0;
  v_kept_count BIGINT := 0;
  sql_query TEXT;
BEGIN
  -- Build DELETE query
  IF keep_strategy = 'latest' THEN
    sql_query := format('
      WITH duplicates AS (
        SELECT 
          id,
          ROW_NUMBER() OVER (
            PARTITION BY %I 
            ORDER BY 
              COALESCE(updated_at, created_at, NOW()) DESC,
              created_at DESC
          ) as rn
        FROM %I
        WHERE %I IS NOT NULL
      )
      DELETE FROM %I
      WHERE id IN (SELECT id FROM duplicates WHERE rn > 1)
    ', unique_column, table_name, unique_column, table_name);
  ELSE
    sql_query := format('
      WITH duplicates AS (
        SELECT 
          id,
          ROW_NUMBER() OVER (
            PARTITION BY %I 
            ORDER BY 
              COALESCE(created_at, updated_at, NOW()) ASC,
              updated_at ASC
          ) as rn
        FROM %I
        WHERE %I IS NOT NULL
      )
      DELETE FROM %I
      WHERE id IN (SELECT id FROM duplicates WHERE rn > 1)
    ', unique_column, table_name, unique_column, table_name);
  END IF;

  -- Execute DELETE and get affected rows
  EXECUTE sql_query;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Count remaining unique records
  EXECUTE format('SELECT COUNT(DISTINCT %I) FROM %I WHERE %I IS NOT NULL', 
    unique_column, table_name, unique_column) INTO v_kept_count;

  RETURN QUERY SELECT v_deleted_count, v_kept_count;
END;
$$;

-- Cleanup all duplicates function
CREATE OR REPLACE FUNCTION cleanup_all_duplicates()
RETURNS TABLE(
  table_name TEXT,
  unique_field TEXT,
  deleted_count BIGINT,
  kept_count BIGINT,
  status TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  cleanup_result RECORD;
BEGIN
  -- Customers
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('customers', 'cari_hesap_kodu', 'latest');
    RETURN QUERY SELECT 'customers'::TEXT, 'cari_hesap_kodu'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'customers'::TEXT, 'cari_hesap_kodu'::TEXT, 0::BIGINT, 0::BIGINT, 'error'::TEXT;
  END;

  -- Products
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('products', 'urun_kodu', 'latest');
    RETURN QUERY SELECT 'products'::TEXT, 'urun_kodu'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'products'::TEXT, 'urun_kodu'::TEXT, 0::BIGINT, 0::BIGINT, 'error'::TEXT;
  END;

  -- Bank Accounts
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('bank_accounts', 'hesap_no', 'latest');
    RETURN QUERY SELECT 'bank_accounts'::TEXT, 'hesap_no'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'bank_accounts'::TEXT, 'hesap_no'::TEXT, 0::BIGINT, 0::BIGINT, 'error'::TEXT;
  END;

  -- MCC Codes
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('mcc_codes', 'kod', 'latest');
    RETURN QUERY SELECT 'mcc_codes'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'mcc_codes'::TEXT, 'kod'::TEXT, 0::BIGINT, 0::BIGINT, 'error'::TEXT;
  END;

  -- Banks
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('banks', 'kod', 'latest');
    RETURN QUERY SELECT 'banks'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'banks'::TEXT, 'kod'::TEXT, 0::BIGINT, 0::BIGINT, 'error'::TEXT;
  END;

  -- EPK Institutions
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('epk_institutions', 'kod', 'latest');
    RETURN QUERY SELECT 'epk_institutions'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'epk_institutions'::TEXT, 'kod'::TEXT, 0::BIGINT, 0::BIGINT, 'error'::TEXT;
  END;

  -- OK Institutions
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('ok_institutions', 'kod', 'latest');
    RETURN QUERY SELECT 'ok_institutions'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'ok_institutions'::TEXT, 'kod'::TEXT, 0::BIGINT, 0::BIGINT, 'error'::TEXT;
  END;

  -- Card Programs
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('card_programs', 'kod', 'latest');
    RETURN QUERY SELECT 'card_programs'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'card_programs'::TEXT, 'kod'::TEXT, 0::BIGINT, 0::BIGINT, 'error'::TEXT;
  END;

  -- Partnerships
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('partnerships', 'partner_name', 'latest');
    RETURN QUERY SELECT 'partnerships'::TEXT, 'partner_name'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'partnerships'::TEXT, 'partner_name'::TEXT, 0::BIGINT, 0::BIGINT, 'error'::TEXT;
  END;

  -- Sharings
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('sharings', 'tip', 'latest');
    RETURN QUERY SELECT 'sharings'::TEXT, 'tip'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'sharings'::TEXT, 'tip'::TEXT, 0::BIGINT, 0::BIGINT, 'error'::TEXT;
  END;

  -- Suspension Reasons
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('suspension_reasons', 'kod', 'latest');
    RETURN QUERY SELECT 'suspension_reasons'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'suspension_reasons'::TEXT, 'kod'::TEXT, 0::BIGINT, 0::BIGINT, 'error'::TEXT;
  END;

  RETURN;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION cleanup_duplicates TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_all_duplicates TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ STEP 1 COMPLETE: Cleanup functions created';
  RAISE NOTICE '   - cleanup_duplicates() function ready';
  RAISE NOTICE '   - cleanup_all_duplicates() function ready';
  RAISE NOTICE '   - Permissions granted';
  RAISE NOTICE '';
END $$;
