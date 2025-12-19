-- =====================================================
-- STEP 1: CLEANUP FUNCTIONS
-- =====================================================
-- Run this first in Supabase SQL Editor

-- Generic cleanup function
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
  deleted_count BIGINT := 0;
  kept_count BIGINT := 0;
  sql_query TEXT;
BEGIN
  IF keep_strategy = 'latest' THEN
    sql_query := format('
      WITH duplicates AS (
        SELECT 
          id,
          %I as unique_val,
          ROW_NUMBER() OVER (
            PARTITION BY %I 
            ORDER BY 
              COALESCE(updated_at, created_at, NOW()) DESC,
              created_at DESC
          ) as rn
        FROM %I
        WHERE %I IS NOT NULL
      ),
      to_delete AS (
        SELECT id FROM duplicates WHERE rn > 1
      )
      DELETE FROM %I
      WHERE id IN (SELECT id FROM to_delete)
      RETURNING 1
    ', unique_column, unique_column, table_name, unique_column, table_name);
  ELSE
    sql_query := format('
      WITH duplicates AS (
        SELECT 
          id,
          %I as unique_val,
          ROW_NUMBER() OVER (
            PARTITION BY %I 
            ORDER BY 
              COALESCE(created_at, updated_at, NOW()) ASC,
              updated_at ASC
          ) as rn
        FROM %I
        WHERE %I IS NOT NULL
      ),
      to_delete AS (
        SELECT id FROM duplicates WHERE rn > 1
      )
      DELETE FROM %I
      WHERE id IN (SELECT id FROM to_delete)
      RETURNING 1
    ', unique_column, unique_column, table_name, unique_column, table_name);
  END IF;

  EXECUTE 'SELECT COUNT(*) FROM (' || sql_query || ') as deleted' INTO deleted_count;
  EXECUTE format('SELECT COUNT(DISTINCT %I) FROM %I WHERE %I IS NOT NULL', 
    unique_column, table_name, unique_column) INTO kept_count;

  RETURN QUERY SELECT deleted_count, kept_count;
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
  SELECT * INTO cleanup_result FROM cleanup_duplicates('customers', 'cari_hesap_kodu', 'latest');
  RETURN QUERY SELECT 'customers'::TEXT, 'cari_hesap_kodu'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;

  SELECT * INTO cleanup_result FROM cleanup_duplicates('products', 'urun_kodu', 'latest');
  RETURN QUERY SELECT 'products'::TEXT, 'urun_kodu'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;

  SELECT * INTO cleanup_result FROM cleanup_duplicates('bank_accounts', 'hesap_no', 'latest');
  RETURN QUERY SELECT 'bank_accounts'::TEXT, 'hesap_no'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;

  SELECT * INTO cleanup_result FROM cleanup_duplicates('mcc_codes', 'kod', 'latest');
  RETURN QUERY SELECT 'mcc_codes'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;

  SELECT * INTO cleanup_result FROM cleanup_duplicates('banks', 'kod', 'latest');
  RETURN QUERY SELECT 'banks'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;

  SELECT * INTO cleanup_result FROM cleanup_duplicates('epk_institutions', 'kod', 'latest');
  RETURN QUERY SELECT 'epk_institutions'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;

  SELECT * INTO cleanup_result FROM cleanup_duplicates('ok_institutions', 'kod', 'latest');
  RETURN QUERY SELECT 'ok_institutions'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;

  SELECT * INTO cleanup_result FROM cleanup_duplicates('card_programs', 'kod', 'latest');
  RETURN QUERY SELECT 'card_programs'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;

  SELECT * INTO cleanup_result FROM cleanup_duplicates('partnerships', 'partner_name', 'latest');
  RETURN QUERY SELECT 'partnerships'::TEXT, 'partner_name'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;

  SELECT * INTO cleanup_result FROM cleanup_duplicates('sharings', 'tip', 'latest');
  RETURN QUERY SELECT 'sharings'::TEXT, 'tip'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;

  SELECT * INTO cleanup_result FROM cleanup_duplicates('suspension_reasons', 'kod', 'latest');
  RETURN QUERY SELECT 'suspension_reasons'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;

  RETURN;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION cleanup_duplicates TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_all_duplicates TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ STEP 1 COMPLETE: Cleanup functions created';
END $$;
