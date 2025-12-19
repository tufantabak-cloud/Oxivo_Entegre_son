-- =====================================================
-- STEP 2: ADD UNIQUE CONSTRAINTS
-- =====================================================
-- Run this AFTER Step 1

-- Customers
DO $$ 
BEGIN
  PERFORM cleanup_duplicates('customers', 'cari_hesap_kodu', 'latest');
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'customers_cari_hesap_kodu_unique'
  ) THEN
    ALTER TABLE customers 
    ADD CONSTRAINT customers_cari_hesap_kodu_unique 
    UNIQUE (cari_hesap_kodu);
    RAISE NOTICE '✅ Added UNIQUE constraint: customers.cari_hesap_kodu';
  END IF;
END $$;

-- Products
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
  END IF;
END $$;

-- Bank Accounts
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
  END IF;
END $$;

-- MCC Codes
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
  END IF;
END $$;

-- Banks
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
  END IF;
END $$;

-- EPK
DO $$ 
BEGIN
  PERFORM cleanup_duplicates('epk_institutions', 'kod', 'latest');
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'epk_institutions_kod_unique'
  ) THEN
    ALTER TABLE epk_institutions 
    ADD CONSTRAINT epk_institutions_kod_unique 
    UNIQUE (kod);
    RAISE NOTICE '✅ Added UNIQUE constraint: epk_institutions.kod';
  END IF;
END $$;

-- OK
DO $$ 
BEGIN
  PERFORM cleanup_duplicates('ok_institutions', 'kod', 'latest');
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ok_institutions_kod_unique'
  ) THEN
    ALTER TABLE ok_institutions 
    ADD CONSTRAINT ok_institutions_kod_unique 
    UNIQUE (kod);
    RAISE NOTICE '✅ Added UNIQUE constraint: ok_institutions.kod';
  END IF;
END $$;

-- Card Programs
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
  END IF;
END $$;

-- Partnerships
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
  END IF;
END $$;

-- Sharings
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
  END IF;
END $$;

-- Suspension Reasons
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
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ STEP 2 COMPLETE: UNIQUE constraints added to 11 tables';
END $$;
