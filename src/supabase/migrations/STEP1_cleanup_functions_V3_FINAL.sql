-- =====================================================
-- STEP 1: CLEANUP FUNCTIONS V3 FINAL (Fixed Ambiguity)
-- =====================================================
-- Run this to replace the previous function

-- Generic cleanup function (with fixed parameter names)
CREATE OR REPLACE FUNCTION cleanup_duplicates(
  p_table_name TEXT,
  p_unique_column TEXT,
  p_keep_strategy TEXT DEFAULT 'latest'
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
  v_sql_query TEXT;
  v_has_updated_at BOOLEAN;
BEGIN
  -- Check if updated_at column exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = p_table_name
      AND column_name = 'updated_at'
  ) INTO v_has_updated_at;

  -- Build DELETE query based on available columns
  IF p_keep_strategy = 'latest' THEN
    IF v_has_updated_at THEN
      -- Use both updated_at and created_at
      v_sql_query := format('
        WITH duplicates AS (
          SELECT 
            id,
            ROW_NUMBER() OVER (
              PARTITION BY %I 
              ORDER BY 
                COALESCE(updated_at, created_at) DESC,
                created_at DESC
            ) as rn
          FROM %I
          WHERE %I IS NOT NULL
        )
        DELETE FROM %I
        WHERE id IN (SELECT id FROM duplicates WHERE rn > 1)
      ', p_unique_column, p_table_name, p_unique_column, p_table_name);
    ELSE
      -- Use only created_at
      v_sql_query := format('
        WITH duplicates AS (
          SELECT 
            id,
            ROW_NUMBER() OVER (
              PARTITION BY %I 
              ORDER BY created_at DESC
            ) as rn
          FROM %I
          WHERE %I IS NOT NULL
        )
        DELETE FROM %I
        WHERE id IN (SELECT id FROM duplicates WHERE rn > 1)
      ', p_unique_column, p_table_name, p_unique_column, p_table_name);
    END IF;
  ELSE
    -- Keep oldest
    IF v_has_updated_at THEN
      v_sql_query := format('
        WITH duplicates AS (
          SELECT 
            id,
            ROW_NUMBER() OVER (
              PARTITION BY %I 
              ORDER BY 
                COALESCE(created_at, updated_at) ASC,
                updated_at ASC
            ) as rn
          FROM %I
          WHERE %I IS NOT NULL
        )
        DELETE FROM %I
        WHERE id IN (SELECT id FROM duplicates WHERE rn > 1)
      ', p_unique_column, p_table_name, p_unique_column, p_table_name);
    ELSE
      v_sql_query := format('
        WITH duplicates AS (
          SELECT 
            id,
            ROW_NUMBER() OVER (
              PARTITION BY %I 
              ORDER BY created_at ASC
            ) as rn
          FROM %I
          WHERE %I IS NOT NULL
        )
        DELETE FROM %I
        WHERE id IN (SELECT id FROM duplicates WHERE rn > 1)
      ', p_unique_column, p_table_name, p_unique_column, p_table_name);
    END IF;
  END IF;

  -- Execute DELETE and get affected rows
  EXECUTE v_sql_query;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Count remaining unique records
  EXECUTE format('SELECT COUNT(DISTINCT %I) FROM %I WHERE %I IS NOT NULL', 
    p_unique_column, p_table_name, p_unique_column) INTO v_kept_count;

  RETURN QUERY SELECT v_deleted_count, v_kept_count;
END;
$$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ STEP 1 V3 FINAL: Function updated with fixed parameter names';
  RAISE NOTICE '   - Fixed ambiguity error';
  RAISE NOTICE '   - Handles tables with/without updated_at column';
  RAISE NOTICE '';
END $$;
