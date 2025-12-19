-- =====================================================
-- 🚀 ÖNCELİKLE BU SCRIPT'İ ÇALIŞTIR!
-- =====================================================
-- Bu script cleanup fonksiyonlarını ve monitoring view'ini oluşturur
-- Supabase SQL Editor'e kopyala ve RUN'a bas
-- =====================================================

-- =====================================================
-- 1. CLEANUP FONKSİYONU (Tek bir tablo için)
-- =====================================================

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

-- =====================================================
-- 2. TÜM TABLOLAR İÇİN CLEANUP FONKSİYONU
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
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('customers', 'cari_hesap_kodu', 'latest');
    RETURN QUERY SELECT 'customers'::TEXT, 'cari_hesap_kodu'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'customers'::TEXT, 'cari_hesap_kodu'::TEXT, 0::BIGINT, 0::BIGINT, ('error: ' || SQLERRM)::TEXT;
  END;

  -- Products
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('products', 'urun_kodu', 'latest');
    RETURN QUERY SELECT 'products'::TEXT, 'urun_kodu'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'products'::TEXT, 'urun_kodu'::TEXT, 0::BIGINT, 0::BIGINT, ('error: ' || SQLERRM)::TEXT;
  END;

  -- Bank Accounts
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('bank_accounts', 'hesap_no', 'latest');
    RETURN QUERY SELECT 'bank_accounts'::TEXT, 'hesap_no'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'bank_accounts'::TEXT, 'hesap_no'::TEXT, 0::BIGINT, 0::BIGINT, ('error: ' || SQLERRM)::TEXT;
  END;

  -- MCC Codes
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('mcc_codes', 'kod', 'latest');
    RETURN QUERY SELECT 'mcc_codes'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'mcc_codes'::TEXT, 'kod'::TEXT, 0::BIGINT, 0::BIGINT, ('error: ' || SQLERRM)::TEXT;
  END;

  -- Banks
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('banks', 'kod', 'latest');
    RETURN QUERY SELECT 'banks'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'banks'::TEXT, 'kod'::TEXT, 0::BIGINT, 0::BIGINT, ('error: ' || SQLERRM)::TEXT;
  END;

  -- EPK
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('epk', 'kod', 'latest');
    RETURN QUERY SELECT 'epk'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'epk'::TEXT, 'kod'::TEXT, 0::BIGINT, 0::BIGINT, ('error: ' || SQLERRM)::TEXT;
  END;

  -- OK
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('ok', 'kod', 'latest');
    RETURN QUERY SELECT 'ok'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'ok'::TEXT, 'kod'::TEXT, 0::BIGINT, 0::BIGINT, ('error: ' || SQLERRM)::TEXT;
  END;

  -- Sales Representatives
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('sales_representatives', 'name', 'latest');
    RETURN QUERY SELECT 'sales_representatives'::TEXT, 'name'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'sales_representatives'::TEXT, 'name'::TEXT, 0::BIGINT, 0::BIGINT, ('error: ' || SQLERRM)::TEXT;
  END;

  -- Job Titles
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('job_titles', 'title', 'latest');
    RETURN QUERY SELECT 'job_titles'::TEXT, 'title'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'job_titles'::TEXT, 'title'::TEXT, 0::BIGINT, 0::BIGINT, ('error: ' || SQLERRM)::TEXT;
  END;

  -- Partnerships
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('partnerships', 'partner_name', 'latest');
    RETURN QUERY SELECT 'partnerships'::TEXT, 'partner_name'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'partnerships'::TEXT, 'partner_name'::TEXT, 0::BIGINT, 0::BIGINT, ('error: ' || SQLERRM)::TEXT;
  END;

  -- Account Items
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('account_items', 'kod', 'latest');
    RETURN QUERY SELECT 'account_items'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'account_items'::TEXT, 'kod'::TEXT, 0::BIGINT, 0::BIGINT, ('error: ' || SQLERRM)::TEXT;
  END;

  -- Sharings
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('sharings', 'tip', 'latest');
    RETURN QUERY SELECT 'sharings'::TEXT, 'tip'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'sharings'::TEXT, 'tip'::TEXT, 0::BIGINT, 0::BIGINT, ('error: ' || SQLERRM)::TEXT;
  END;

  -- Card Programs
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('card_programs', 'kod', 'latest');
    RETURN QUERY SELECT 'card_programs'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'card_programs'::TEXT, 'kod'::TEXT, 0::BIGINT, 0::BIGINT, ('error: ' || SQLERRM)::TEXT;
  END;

  -- Suspension Reasons
  BEGIN
    SELECT * INTO cleanup_result FROM cleanup_duplicates('suspension_reasons', 'kod', 'latest');
    RETURN QUERY SELECT 'suspension_reasons'::TEXT, 'kod'::TEXT, cleanup_result.deleted_count, cleanup_result.kept_count, 'success'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'suspension_reasons'::TEXT, 'kod'::TEXT, 0::BIGINT, 0::BIGINT, ('error: ' || SQLERRM)::TEXT;
  END;

  RETURN;
END;
$$;

-- =====================================================
-- 3. MONİTORİNG VIEW (Duplicate'leri göster)
-- =====================================================

CREATE OR REPLACE VIEW duplicate_monitoring AS

-- Customers (cari_hesap_kodu)
SELECT 
  'customers' as table_name,
  'cari_hesap_kodu' as unique_field,
  cari_hesap_kodu as value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id ORDER BY COALESCE(updated_at, created_at) DESC) as duplicate_ids
FROM customers
WHERE cari_hesap_kodu IS NOT NULL
GROUP BY cari_hesap_kodu
HAVING COUNT(*) > 1

UNION ALL

-- Products (urun_kodu)
SELECT 
  'products' as table_name,
  'urun_kodu' as unique_field,
  urun_kodu as value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id ORDER BY COALESCE(updated_at, created_at) DESC) as duplicate_ids
FROM products
WHERE urun_kodu IS NOT NULL
GROUP BY urun_kodu
HAVING COUNT(*) > 1

UNION ALL

-- Bank Accounts (hesap_no)
SELECT 
  'bank_accounts' as table_name,
  'hesap_no' as unique_field,
  hesap_no as value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id ORDER BY COALESCE(updated_at, created_at) DESC) as duplicate_ids
FROM bank_accounts
WHERE hesap_no IS NOT NULL
GROUP BY hesap_no
HAVING COUNT(*) > 1

UNION ALL

-- MCC Codes (kod)
SELECT 
  'mcc_codes' as table_name,
  'kod' as unique_field,
  kod as value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id ORDER BY COALESCE(updated_at, created_at) DESC) as duplicate_ids
FROM mcc_codes
WHERE kod IS NOT NULL
GROUP BY kod
HAVING COUNT(*) > 1

UNION ALL

-- Banks (kod)
SELECT 
  'banks' as table_name,
  'kod' as unique_field,
  kod as value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id ORDER BY COALESCE(updated_at, created_at) DESC) as duplicate_ids
FROM banks
WHERE kod IS NOT NULL
GROUP BY kod
HAVING COUNT(*) > 1

UNION ALL

-- EPK (kod)
SELECT 
  'epk' as table_name,
  'kod' as unique_field,
  kod as value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id ORDER BY COALESCE(updated_at, created_at) DESC) as duplicate_ids
FROM epk
WHERE kod IS NOT NULL
GROUP BY kod
HAVING COUNT(*) > 1

UNION ALL

-- OK (kod)
SELECT 
  'ok' as table_name,
  'kod' as unique_field,
  kod as value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id ORDER BY COALESCE(updated_at, created_at) DESC) as duplicate_ids
FROM ok
WHERE kod IS NOT NULL
GROUP BY kod
HAVING COUNT(*) > 1

UNION ALL

-- Sales Representatives (name)
SELECT 
  'sales_representatives' as table_name,
  'name' as unique_field,
  name as value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id ORDER BY COALESCE(updated_at, created_at) DESC) as duplicate_ids
FROM sales_representatives
WHERE name IS NOT NULL
GROUP BY name
HAVING COUNT(*) > 1

UNION ALL

-- Job Titles (title)
SELECT 
  'job_titles' as table_name,
  'title' as unique_field,
  title as value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id ORDER BY COALESCE(updated_at, created_at) DESC) as duplicate_ids
FROM job_titles
WHERE title IS NOT NULL
GROUP BY title
HAVING COUNT(*) > 1

UNION ALL

-- Partnerships (partner_name)
SELECT 
  'partnerships' as table_name,
  'partner_name' as unique_field,
  partner_name as value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id ORDER BY COALESCE(updated_at, created_at) DESC) as duplicate_ids
FROM partnerships
WHERE partner_name IS NOT NULL
GROUP BY partner_name
HAVING COUNT(*) > 1

UNION ALL

-- Account Items (kod)
SELECT 
  'account_items' as table_name,
  'kod' as unique_field,
  kod as value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id ORDER BY COALESCE(updated_at, created_at) DESC) as duplicate_ids
FROM account_items
WHERE kod IS NOT NULL
GROUP BY kod
HAVING COUNT(*) > 1

UNION ALL

-- Sharings (tip)
SELECT 
  'sharings' as table_name,
  'tip' as unique_field,
  tip as value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id ORDER BY COALESCE(updated_at, created_at) DESC) as duplicate_ids
FROM sharings
WHERE tip IS NOT NULL
GROUP BY tip
HAVING COUNT(*) > 1

UNION ALL

-- Card Programs (kod)
SELECT 
  'card_programs' as table_name,
  'kod' as unique_field,
  kod as value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id ORDER BY COALESCE(updated_at, created_at) DESC) as duplicate_ids
FROM card_programs
WHERE kod IS NOT NULL
GROUP BY kod
HAVING COUNT(*) > 1

UNION ALL

-- Suspension Reasons (kod)
SELECT 
  'suspension_reasons' as table_name,
  'kod' as unique_field,
  kod as value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id ORDER BY COALESCE(updated_at, created_at) DESC) as duplicate_ids
FROM suspension_reasons
WHERE kod IS NOT NULL
GROUP BY kod
HAVING COUNT(*) > 1;

-- =====================================================
-- ✅ MİGRATİON TAMAMLANDI!
-- =====================================================

-- Test et:
SELECT 'Migration başarılı!' as message;

-- Fonksiyonlar çalışıyor mu?
SELECT 
  'cleanup_duplicates' as function_name,
  'exists' as status
FROM pg_proc 
WHERE proname = 'cleanup_duplicates'

UNION ALL

SELECT 
  'cleanup_all_duplicates' as function_name,
  'exists' as status
FROM pg_proc 
WHERE proname = 'cleanup_all_duplicates'

UNION ALL

SELECT 
  'duplicate_monitoring' as view_name,
  'exists' as status
FROM pg_views 
WHERE viewname = 'duplicate_monitoring';

-- Şimdi duplicate'leri kontrol et:
-- SELECT * FROM duplicate_monitoring;
