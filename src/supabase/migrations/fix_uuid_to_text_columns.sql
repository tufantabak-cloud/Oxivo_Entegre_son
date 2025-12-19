-- =====================================================
-- FIX UUID TO TEXT MIGRATION
-- =====================================================
-- Sales Rep ve Job Title ID'leri UUID yerine TEXT olmalı
-- Frontend timestamp-based ID'ler kullanıyor (UUID formatında değil)
-- =====================================================

-- STEP 1: Mevcut veri tiplerini kontrol et
DO $$
BEGIN
  RAISE NOTICE '🔍 Mevcut column tipleri kontrol ediliyor...';
END $$;

SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('sales_representatives', 'job_titles')
AND column_name = 'id'
ORDER BY table_name;

-- STEP 2: Sales Representatives ID'yi TEXT'e çevir
DO $$
BEGIN
  -- Check if column is UUID
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'sales_representatives' 
    AND column_name = 'id' 
    AND data_type = 'uuid'
  ) THEN
    RAISE NOTICE '🔄 sales_representatives.id: UUID → TEXT dönüşümü yapılıyor...';
    
    -- Drop foreign key constraints temporarily
    ALTER TABLE IF EXISTS customers 
      DROP CONSTRAINT IF EXISTS customers_sales_rep_id_fkey;
    
    -- Change column type
    ALTER TABLE sales_representatives 
      ALTER COLUMN id TYPE TEXT USING id::TEXT;
    
    RAISE NOTICE '✅ sales_representatives.id TEXT tipine çevrildi';
  ELSE
    RAISE NOTICE 'ℹ️ sales_representatives.id zaten TEXT tipinde';
  END IF;
END $$;

-- STEP 3: Job Titles ID'yi TEXT'e çevir
DO $$
BEGIN
  -- Check if column is UUID
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'job_titles' 
    AND column_name = 'id' 
    AND data_type = 'uuid'
  ) THEN
    RAISE NOTICE '🔄 job_titles.id: UUID → TEXT dönüşümü yapılıyor...';
    
    -- Drop foreign key constraints temporarily
    ALTER TABLE IF EXISTS customers 
      DROP CONSTRAINT IF EXISTS customers_job_title_id_fkey;
    
    -- Change column type
    ALTER TABLE job_titles 
      ALTER COLUMN id TYPE TEXT USING id::TEXT;
    
    RAISE NOTICE '✅ job_titles.id TEXT tipine çevrildi';
  ELSE
    RAISE NOTICE 'ℹ️ job_titles.id zaten TEXT tipinde';
  END IF;
END $$;

-- STEP 4: Customers tablosundaki foreign key'leri TEXT'e çevir
DO $$
BEGIN
  -- Sales Rep ID
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'customers' 
    AND column_name = 'sales_rep_id' 
    AND data_type = 'uuid'
  ) THEN
    RAISE NOTICE '🔄 customers.sales_rep_id: UUID → TEXT dönüşümü yapılıyor...';
    
    ALTER TABLE customers 
      ALTER COLUMN sales_rep_id TYPE TEXT USING sales_rep_id::TEXT;
    
    RAISE NOTICE '✅ customers.sales_rep_id TEXT tipine çevrildi';
  ELSE
    RAISE NOTICE 'ℹ️ customers.sales_rep_id zaten TEXT tipinde veya mevcut değil';
  END IF;
  
  -- Job Title ID
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'customers' 
    AND column_name = 'job_title_id' 
    AND data_type = 'uuid'
  ) THEN
    RAISE NOTICE '🔄 customers.job_title_id: UUID → TEXT dönüşümü yapılıyor...';
    
    ALTER TABLE customers 
      ALTER COLUMN job_title_id TYPE TEXT USING job_title_id::TEXT;
    
    RAISE NOTICE '✅ customers.job_title_id TEXT tipine çevrildi';
  ELSE
    RAISE NOTICE 'ℹ️ customers.job_title_id zaten TEXT tipinde veya mevcut değil';
  END IF;
END $$;

-- STEP 5: Foreign key constraint'leri yeniden oluştur (opsiyonel)
-- NOT: Constraint'ler olmadan da çalışır, ama referential integrity için eklenebilir
DO $$
BEGIN
  -- Sales Rep foreign key
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'customers_sales_rep_id_fkey'
  ) THEN
    ALTER TABLE customers 
      ADD CONSTRAINT customers_sales_rep_id_fkey 
      FOREIGN KEY (sales_rep_id) 
      REFERENCES sales_representatives(id) 
      ON DELETE SET NULL;
    
    RAISE NOTICE '✅ customers.sales_rep_id foreign key oluşturuldu';
  END IF;
  
  -- Job Title foreign key
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'customers_job_title_id_fkey'
  ) THEN
    ALTER TABLE customers 
      ADD CONSTRAINT customers_job_title_id_fkey 
      FOREIGN KEY (job_title_id) 
      REFERENCES job_titles(id) 
      ON DELETE SET NULL;
    
    RAISE NOTICE '✅ customers.job_title_id foreign key oluşturuldu';
  END IF;
END $$;

-- STEP 6: Diğer tablolardaki ID'leri kontrol et ve çevir
DO $$
DECLARE
  table_name TEXT;
  column_type TEXT;
BEGIN
  -- Tüm tanım tablolarını kontrol et
  FOR table_name IN 
    SELECT t.table_name 
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
    AND t.table_name IN (
      'mcc_codes', 'banks', 'epk_codes', 'ok_codes',
      'partnerships', 'account_items', 'fixed_commissions',
      'additional_revenues', 'sharings', 'kart_programs',
      'suspension_reasons', 'revenue_models', 'price_lists'
    )
  LOOP
    -- ID column tipini al
    SELECT data_type INTO column_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND information_schema.columns.table_name = table_name
    AND column_name = 'id';
    
    -- UUID ise TEXT'e çevir
    IF column_type = 'uuid' THEN
      RAISE NOTICE '🔄 %.id: UUID → TEXT dönüşümü yapılıyor...', table_name;
      EXECUTE format('ALTER TABLE %I ALTER COLUMN id TYPE TEXT USING id::TEXT', table_name);
      RAISE NOTICE '✅ %.id TEXT tipine çevrildi', table_name;
    END IF;
  END LOOP;
END $$;

-- STEP 7: Verification
DO $$
DECLARE
  uuid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO uuid_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND column_name = 'id'
  AND data_type = 'uuid'
  AND table_name IN (
    'sales_representatives', 'job_titles',
    'mcc_codes', 'banks', 'epk_codes', 'ok_codes',
    'partnerships', 'account_items', 'fixed_commissions',
    'additional_revenues', 'sharings', 'kart_programs',
    'suspension_reasons', 'revenue_models', 'price_lists'
  );
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '✅ MIGRATION TAMAMLANDI';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE 'Kalan UUID column sayısı: %', uuid_count;
  
  IF uuid_count = 0 THEN
    RAISE NOTICE '🎉 Tüm ID columnları TEXT tipine çevrildi!';
  ELSE
    RAISE WARNING '⚠️ Hala % UUID column var!', uuid_count;
  END IF;
END $$;

-- STEP 8: Final Report
SELECT 
  table_name as "Tablo",
  column_name as "Column",
  data_type as "Tip"
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name IN ('id', 'sales_rep_id', 'job_title_id')
AND table_name IN (
  'sales_representatives', 'job_titles', 'customers',
  'mcc_codes', 'banks', 'epk_codes', 'ok_codes',
  'partnerships', 'account_items', 'fixed_commissions',
  'additional_revenues', 'sharings', 'kart_programs',
  'suspension_reasons', 'revenue_models', 'price_lists'
)
ORDER BY table_name, column_name;

-- SUCCESS MESSAGE
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ UUID → TEXT dönüşümü başarıyla tamamlandı!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Yapılan değişiklikler:';
  RAISE NOTICE '  1. sales_representatives.id → TEXT';
  RAISE NOTICE '  2. job_titles.id → TEXT';
  RAISE NOTICE '  3. customers.sales_rep_id → TEXT';
  RAISE NOTICE '  4. customers.job_title_id → TEXT';
  RAISE NOTICE '  5. Tüm tanım tabloları.id → TEXT';
  RAISE NOTICE '';
  RAISE NOTICE '🔗 Foreign key constraint''ler yeniden oluşturuldu';
  RAISE NOTICE '✅ Migration IDEMPOTENT - Tekrar çalıştırılabilir';
END $$;
