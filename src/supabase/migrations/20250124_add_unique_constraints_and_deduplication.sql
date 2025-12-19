-- =====================================================
-- DUPLICATE PREVENTION & CLEANUP MIGRATION
-- =====================================================
-- Bu migration tüm tablolara UNIQUE constraint'ler ekler
-- ve duplicate kayıtları temizleyen utility function'lar sağlar
-- 
-- Author: Oxivo System
-- Date: 2025-01-24
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- PART 1: DUPLICATE CLEANUP FUNCTION
-- =====================================================

-- Generic duplicate cleanup function
-- Bu function herhangi bir tablo için duplicate'leri temizler
CREATE OR REPLACE FUNCTION cleanup_duplicates(
  table_name TEXT,
  unique_column TEXT,
  keep_strategy TEXT DEFAULT 'latest' -- 'latest' or 'earliest'
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
  -- Build dynamic SQL to delete duplicates
  -- Keep the record with MAX(updated_at) or MIN(updated_at) based on strategy
  
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

  -- Execute deletion
  EXECUTE 'SELECT COUNT(*) FROM (' || sql_query || ') as deleted' INTO deleted_count;
  
  -- Count remaining unique records
  EXECUTE format('SELECT COUNT(DISTINCT %I) FROM %I WHERE %I IS NOT NULL', 
    unique_column, table_name, unique_column) INTO kept_count;

  RETURN QUERY SELECT deleted_count, kept_count;
END;
$$;

COMMENT ON FUNCTION cleanup_duplicates IS 'Removes duplicate records from any table based on a unique column, keeping the latest or earliest record';

-- =====================================================
-- PART 2: CLEANUP ALL DUPLICATES IN ALL TABLES
-- =====================================================

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
  SELECT * INTO cleanup_result FROM cleanup_duplicates('customers', 'cari_hesap_kodu', 'latest');
  RETURN QUERY SELECT 'customers'::TEXT, 'cari_hesap_kodu'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;

  -- Products
  SELECT * INTO cleanup_result FROM cleanup_duplicates('products', 'urun_kodu', 'latest');
  RETURN QUERY SELECT 'products'::TEXT, 'urun_kodu'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;

  -- Bank PF
  SELECT * INTO cleanup_result FROM cleanup_duplicates('bank_accounts', 'hesap_no', 'latest');
  RETURN QUERY SELECT 'bank_accounts'::TEXT, 'hesap_no'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;

  -- MCC Codes
  SELECT * INTO cleanup_result FROM cleanup_duplicates('mcc_codes', 'kod', 'latest');
  RETURN QUERY SELECT 'mcc_codes'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;

  -- Banks
  SELECT * INTO cleanup_result FROM cleanup_duplicates('banks', 'kod', 'latest');
  RETURN QUERY SELECT 'banks'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;

  -- EPK
  SELECT * INTO cleanup_result FROM cleanup_duplicates('epk', 'kod', 'latest');
  RETURN QUERY SELECT 'epk'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;

  -- OK
  SELECT * INTO cleanup_result FROM cleanup_duplicates('ok', 'kod', 'latest');
  RETURN QUERY SELECT 'ok'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;

  -- Card Programs
  SELECT * INTO cleanup_result FROM cleanup_duplicates('card_programs', 'kod', 'latest');
  RETURN QUERY SELECT 'card_programs'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;

  -- Partnerships
  SELECT * INTO cleanup_result FROM cleanup_duplicates('partnerships', 'partner_name', 'latest');
  RETURN QUERY SELECT 'partnerships'::TEXT, 'partner_name'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;

  -- Sharings
  SELECT * INTO cleanup_result FROM cleanup_duplicates('sharings', 'tip', 'latest');
  RETURN QUERY SELECT 'sharings'::TEXT, 'tip'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;

  -- Suspension Reasons
  SELECT * INTO cleanup_result FROM cleanup_duplicates('suspension_reasons', 'kod', 'latest');
  RETURN QUERY SELECT 'suspension_reasons'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;

  -- Account Items (if exists)
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('account_items', 'kod', 'latest');
    RETURN QUERY SELECT 'account_items'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION
    WHEN undefined_table THEN
      RETURN QUERY SELECT 'account_items'::TEXT, 'kod'::TEXT, 0::BIGINT, 0::BIGINT, 'table_not_exists'::TEXT;
  END;

  -- Fixed Commissions (if exists)
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('fixed_commissions', 'id', 'latest');
    RETURN QUERY SELECT 'fixed_commissions'::TEXT, 'id'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION
    WHEN undefined_table THEN
      RETURN QUERY SELECT 'fixed_commissions'::TEXT, 'id'::TEXT, 0::BIGINT, 0::BIGINT, 'table_not_exists'::TEXT;
  END;

  -- Additional Revenues (if exists)
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('additional_revenues', 'id', 'latest');
    RETURN QUERY SELECT 'additional_revenues'::TEXT, 'id'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION
    WHEN undefined_table THEN
      RETURN QUERY SELECT 'additional_revenues'::TEXT, 'id'::TEXT, 0::BIGINT, 0::BIGINT, 'table_not_exists'::TEXT;
  END;

  RETURN;
END;
$$;

COMMENT ON FUNCTION cleanup_all_duplicates IS 'Cleans up duplicates in all application tables';

-- =====================================================
-- PART 3: ADD UNIQUE CONSTRAINTS (IF NOT EXISTS)
-- =====================================================

-- Customers: cari_hesap_kodu must be unique
DO $$ 
BEGIN
  -- First cleanup existing duplicates
  PERFORM cleanup_duplicates('customers', 'cari_hesap_kodu', 'latest');
  
  -- Then add constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'customers_cari_hesap_kodu_unique'
  ) THEN
    ALTER TABLE customers 
    ADD CONSTRAINT customers_cari_hesap_kodu_unique 
    UNIQUE (cari_hesap_kodu);
    
    RAISE NOTICE '✅ Added UNIQUE constraint: customers.cari_hesap_kodu';
  ELSE
    RAISE NOTICE '⏭️ Constraint already exists: customers.cari_hesap_kodu';
  END IF;
END $$;

-- Products: urun_kodu must be unique
DO $$ 
BEGIN
  PERFORM cleanup_duplicates('products', 'urun_kodu', 'latest');
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_urun_kodu_unique'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_urun_kodu_unique 
    UNIQUE (urun_kodu);
    
    RAISE NOTICE '✅ Added UNIQUE constraint: products.urun_kodu';
  ELSE
    RAISE NOTICE '⏭️ Constraint already exists: products.urun_kodu';
  END IF;
END $$;

-- Bank Accounts: hesap_no must be unique
DO $$ 
BEGIN
  PERFORM cleanup_duplicates('bank_accounts', 'hesap_no', 'latest');
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bank_accounts_hesap_no_unique'
  ) THEN
    ALTER TABLE bank_accounts 
    ADD CONSTRAINT bank_accounts_hesap_no_unique 
    UNIQUE (hesap_no);
    
    RAISE NOTICE '✅ Added UNIQUE constraint: bank_accounts.hesap_no';
  ELSE
    RAISE NOTICE '⏭️ Constraint already exists: bank_accounts.hesap_no';
  END IF;
END $$;

-- MCC Codes: kod must be unique
DO $$ 
BEGIN
  PERFORM cleanup_duplicates('mcc_codes', 'kod', 'latest');
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'mcc_codes_kod_unique'
  ) THEN
    ALTER TABLE mcc_codes 
    ADD CONSTRAINT mcc_codes_kod_unique 
    UNIQUE (kod);
    
    RAISE NOTICE '✅ Added UNIQUE constraint: mcc_codes.kod';
  ELSE
    RAISE NOTICE '⏭️ Constraint already exists: mcc_codes.kod';
  END IF;
END $$;

-- Banks: kod must be unique
DO $$ 
BEGIN
  PERFORM cleanup_duplicates('banks', 'kod', 'latest');
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'banks_kod_unique'
  ) THEN
    ALTER TABLE banks 
    ADD CONSTRAINT banks_kod_unique 
    UNIQUE (kod);
    
    RAISE NOTICE '✅ Added UNIQUE constraint: banks.kod';
  ELSE
    RAISE NOTICE '⏭️ Constraint already exists: banks.kod';
  END IF;
END $$;

-- EPK: kod must be unique
DO $$ 
BEGIN
  PERFORM cleanup_duplicates('epk', 'kod', 'latest');
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'epk_kod_unique'
  ) THEN
    ALTER TABLE epk 
    ADD CONSTRAINT epk_kod_unique 
    UNIQUE (kod);
    
    RAISE NOTICE '✅ Added UNIQUE constraint: epk.kod';
  ELSE
    RAISE NOTICE '⏭️ Constraint already exists: epk.kod';
  END IF;
END $$;

-- OK: kod must be unique
DO $$ 
BEGIN
  PERFORM cleanup_duplicates('ok', 'kod', 'latest');
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ok_kod_unique'
  ) THEN
    ALTER TABLE ok 
    ADD CONSTRAINT ok_kod_unique 
    UNIQUE (kod);
    
    RAISE NOTICE '✅ Added UNIQUE constraint: ok.kod';
  ELSE
    RAISE NOTICE '⏭️ Constraint already exists: ok.kod';
  END IF;
END $$;

-- Card Programs: kod must be unique
DO $$ 
BEGIN
  PERFORM cleanup_duplicates('card_programs', 'kod', 'latest');
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'card_programs_kod_unique'
  ) THEN
    ALTER TABLE card_programs 
    ADD CONSTRAINT card_programs_kod_unique 
    UNIQUE (kod);
    
    RAISE NOTICE '✅ Added UNIQUE constraint: card_programs.kod';
  ELSE
    RAISE NOTICE '⏭️ Constraint already exists: card_programs.kod';
  END IF;
END $$;

-- Partnerships: partner_name must be unique
DO $$ 
BEGIN
  PERFORM cleanup_duplicates('partnerships', 'partner_name', 'latest');
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'partnerships_partner_name_unique'
  ) THEN
    ALTER TABLE partnerships 
    ADD CONSTRAINT partnerships_partner_name_unique 
    UNIQUE (partner_name);
    
    RAISE NOTICE '✅ Added UNIQUE constraint: partnerships.partner_name';
  ELSE
    RAISE NOTICE '⏭️ Constraint already exists: partnerships.partner_name';
  END IF;
END $$;

-- Sharings: tip must be unique
DO $$ 
BEGIN
  PERFORM cleanup_duplicates('sharings', 'tip', 'latest');
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sharings_tip_unique'
  ) THEN
    ALTER TABLE sharings 
    ADD CONSTRAINT sharings_tip_unique 
    UNIQUE (tip);
    
    RAISE NOTICE '✅ Added UNIQUE constraint: sharings.tip';
  ELSE
    RAISE NOTICE '⏭️ Constraint already exists: sharings.tip';
  END IF;
END $$;

-- Suspension Reasons: kod must be unique
DO $$ 
BEGIN
  PERFORM cleanup_duplicates('suspension_reasons', 'kod', 'latest');
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'suspension_reasons_kod_unique'
  ) THEN
    ALTER TABLE suspension_reasons 
    ADD CONSTRAINT suspension_reasons_kod_unique 
    UNIQUE (kod);
    
    RAISE NOTICE '✅ Added UNIQUE constraint: suspension_reasons.kod';
  ELSE
    RAISE NOTICE '⏭️ Constraint already exists: suspension_reasons.kod';
  END IF;
END $$;

-- Sales Representatives: id is already primary key (unique by default)
-- Job Titles: id is already primary key (unique by default)

-- =====================================================
-- PART 4: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes on unique columns for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_cari_hesap_kodu ON customers(cari_hesap_kodu);
CREATE INDEX IF NOT EXISTS idx_products_urun_kodu ON products(urun_kodu);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_hesap_no ON bank_accounts(hesap_no);
CREATE INDEX IF NOT EXISTS idx_mcc_codes_kod ON mcc_codes(kod);
CREATE INDEX IF NOT EXISTS idx_banks_kod ON banks(kod);
CREATE INDEX IF NOT EXISTS idx_epk_kod ON epk(kod);
CREATE INDEX IF NOT EXISTS idx_ok_kod ON ok(kod);
CREATE INDEX IF NOT EXISTS idx_card_programs_kod ON card_programs(kod);
CREATE INDEX IF NOT EXISTS idx_partnerships_partner_name ON partnerships(partner_name);
CREATE INDEX IF NOT EXISTS idx_sharings_tip ON sharings(tip);
CREATE INDEX IF NOT EXISTS idx_suspension_reasons_kod ON suspension_reasons(kod);

-- =====================================================
-- PART 5: CREATE ADMIN VIEW FOR DUPLICATE MONITORING
-- =====================================================

-- View to check for potential duplicates (before adding constraints)
CREATE OR REPLACE VIEW duplicate_monitoring AS
SELECT 
  'customers' as table_name,
  'cari_hesap_kodu' as unique_field,
  cari_hesap_kodu as duplicate_value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id) as duplicate_ids
FROM customers
WHERE cari_hesap_kodu IS NOT NULL
GROUP BY cari_hesap_kodu
HAVING COUNT(*) > 1

UNION ALL

SELECT 
  'products' as table_name,
  'urun_kodu' as unique_field,
  urun_kodu as duplicate_value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id) as duplicate_ids
FROM products
WHERE urun_kodu IS NOT NULL
GROUP BY urun_kodu
HAVING COUNT(*) > 1

UNION ALL

SELECT 
  'bank_accounts' as table_name,
  'hesap_no' as unique_field,
  hesap_no as duplicate_value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id) as duplicate_ids
FROM bank_accounts
WHERE hesap_no IS NOT NULL
GROUP BY hesap_no
HAVING COUNT(*) > 1

UNION ALL

SELECT 
  'mcc_codes' as table_name,
  'kod' as unique_field,
  kod as duplicate_value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id) as duplicate_ids
FROM mcc_codes
WHERE kod IS NOT NULL
GROUP BY kod
HAVING COUNT(*) > 1

UNION ALL

SELECT 
  'banks' as table_name,
  'kod' as unique_field,
  kod as duplicate_value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id) as duplicate_ids
FROM banks
WHERE kod IS NOT NULL
GROUP BY kod
HAVING COUNT(*) > 1

UNION ALL

SELECT 
  'epk' as table_name,
  'kod' as unique_field,
  kod as duplicate_value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id) as duplicate_ids
FROM epk
WHERE kod IS NOT NULL
GROUP BY kod
HAVING COUNT(*) > 1

UNION ALL

SELECT 
  'ok' as table_name,
  'kod' as unique_field,
  kod as duplicate_value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id) as duplicate_ids
FROM ok
WHERE kod IS NOT NULL
GROUP BY kod
HAVING COUNT(*) > 1

UNION ALL

SELECT 
  'card_programs' as table_name,
  'kod' as unique_field,
  kod as duplicate_value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id) as duplicate_ids
FROM card_programs
WHERE kod IS NOT NULL
GROUP BY kod
HAVING COUNT(*) > 1

UNION ALL

SELECT 
  'partnerships' as table_name,
  'partner_name' as unique_field,
  partner_name as duplicate_value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id) as duplicate_ids
FROM partnerships
WHERE partner_name IS NOT NULL
GROUP BY partner_name
HAVING COUNT(*) > 1

UNION ALL

SELECT 
  'sharings' as table_name,
  'tip' as unique_field,
  tip as duplicate_value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id) as duplicate_ids
FROM sharings
WHERE tip IS NOT NULL
GROUP BY tip
HAVING COUNT(*) > 1

UNION ALL

SELECT 
  'suspension_reasons' as table_name,
  'kod' as unique_field,
  kod as duplicate_value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id) as duplicate_ids
FROM suspension_reasons
WHERE kod IS NOT NULL
GROUP BY kod
HAVING COUNT(*) > 1;

COMMENT ON VIEW duplicate_monitoring IS 'Real-time view of duplicate records across all tables';

-- =====================================================
-- PART 6: GRANT PERMISSIONS
-- =====================================================

-- Grant execute permission on cleanup functions to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_duplicates TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_all_duplicates TO authenticated;

-- Grant select permission on duplicate monitoring view
GRANT SELECT ON duplicate_monitoring TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check duplicate monitoring view
-- SELECT * FROM duplicate_monitoring;

-- Run cleanup for all tables
-- SELECT * FROM cleanup_all_duplicates();

-- Run cleanup for specific table
-- SELECT * FROM cleanup_duplicates('customers', 'cari_hesap_kodu', 'latest');

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '✅ DUPLICATE PREVENTION MIGRATION COMPLETE';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '  - Created cleanup_duplicates() function';
  RAISE NOTICE '  - Created cleanup_all_duplicates() function';
  RAISE NOTICE '  - Added UNIQUE constraints to 11 tables';
  RAISE NOTICE '  - Created performance indexes';
  RAISE NOTICE '  - Created duplicate_monitoring view';
  RAISE NOTICE '  - Granted permissions to authenticated users';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Usage:';
  RAISE NOTICE '  - Check duplicates: SELECT * FROM duplicate_monitoring;';
  RAISE NOTICE '  - Cleanup all: SELECT * FROM cleanup_all_duplicates();';
  RAISE NOTICE '  - Cleanup one: SELECT * FROM cleanup_duplicates(''table'', ''column'', ''latest'');';
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
END $$;
