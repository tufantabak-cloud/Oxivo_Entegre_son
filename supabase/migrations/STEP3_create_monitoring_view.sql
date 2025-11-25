-- =====================================================
-- STEP 3: CREATE MONITORING VIEW
-- =====================================================
-- Run this AFTER Step 2

-- Create duplicate monitoring view
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
  'epk_institutions' as table_name,
  'kod' as unique_field,
  kod as duplicate_value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id) as duplicate_ids
FROM epk_institutions
WHERE kod IS NOT NULL
GROUP BY kod
HAVING COUNT(*) > 1

UNION ALL

SELECT 
  'ok_institutions' as table_name,
  'kod' as unique_field,
  kod as duplicate_value,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id) as duplicate_ids
FROM ok_institutions
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

-- Grant permissions
GRANT SELECT ON duplicate_monitoring TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ STEP 3 COMPLETE: duplicate_monitoring view created';
END $$;
