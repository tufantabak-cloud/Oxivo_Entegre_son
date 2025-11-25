-- =====================================================
-- STEP 1: CLEANUP FUNCTIONS V2 (Dynamic Column Check)
-- =====================================================
-- Run this to replace the previous function

-- Generic cleanup function (with dynamic column check)
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
  has_updated_at BOOLEAN;
BEGIN
  -- Check if updated_at column exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = $1
      AND column_name = 'updated_at'
  ) INTO has_updated_at;

  -- Build DELETE query based on available columns
  IF keep_strategy = 'latest' THEN
    IF has_updated_at THEN
      -- Use both updated_at and created_at
      sql_query := format('
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
      ', unique_column, table_name, unique_column, table_name);
    ELSE
      -- Use only created_at
      sql_query := format('
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
      ', unique_column, table_name, unique_column, table_name);
    END IF;
  ELSE
    -- Keep oldest
    IF has_updated_at THEN
      sql_query := format('
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
      ', unique_column, table_name, unique_column, table_name);
    ELSE
      sql_query := format('
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
      ', unique_column, table_name, unique_column, table_name);
    END IF;
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

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ STEP 1 V2 COMPLETE: Function updated with dynamic column check';
  RAISE NOTICE '   - Now handles tables without updated_at column';
  RAISE NOTICE '';
END $$;
