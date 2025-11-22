-- ========================================
-- STEP 1: CHECK CURRENT COLUMN TYPE
-- ========================================

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers'
  AND column_name = 'bankDeviceAssignments';

-- ========================================
-- STEP 2: SAFE MIGRATION SCRIPT
-- ========================================
-- Bu script bankDeviceAssignments'ın tipini kontrol edip
-- sadece gerekirse dönüştürüyor

DO $$ 
DECLARE 
  current_type text;
BEGIN
  -- Get current column type
  SELECT data_type INTO current_type
  FROM information_schema.columns 
  WHERE table_name = 'customers'
    AND column_name = 'bankDeviceAssignments';
  
  -- Only convert if it's TEXT
  IF current_type = 'text' THEN
    RAISE NOTICE 'Converting bankDeviceAssignments from TEXT to JSONB...';
    
    -- Clean invalid values
    UPDATE customers 
    SET "bankDeviceAssignments" = NULL
    WHERE "bankDeviceAssignments" IS NULL
       OR length("bankDeviceAssignments") = 0
       OR left(trim("bankDeviceAssignments"), 1) NOT IN ('[', '{');
    
    -- Convert to JSONB
    EXECUTE 'ALTER TABLE customers ALTER COLUMN "bankDeviceAssignments" TYPE jsonb USING "bankDeviceAssignments"::jsonb';
    
    RAISE NOTICE 'bankDeviceAssignments converted to JSONB successfully!';
  ELSE
    RAISE NOTICE 'bankDeviceAssignments is already %, skipping conversion', current_type;
  END IF;
END $$;

COMMENT ON COLUMN customers."bankDeviceAssignments" IS 'JSONB: Array of BankDeviceAssignment objects';

-- ========================================
-- STEP 3: ADD NEW COLUMNS TO CUSTOMERS
-- ========================================

ALTER TABLE customers ADD COLUMN IF NOT EXISTS device_subscriptions jsonb;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS service_fee_invoices jsonb;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_reminders jsonb;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS reminder_settings jsonb;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS suspension_history jsonb;

COMMENT ON COLUMN customers.device_subscriptions IS 'JSONB: Array of DeviceSubscription objects';
COMMENT ON COLUMN customers.service_fee_invoices IS 'JSONB: Array of ServiceFeeInvoice objects';
COMMENT ON COLUMN customers.payment_reminders IS 'JSONB: Array of PaymentReminder objects';
COMMENT ON COLUMN customers.reminder_settings IS 'JSONB: ReminderSettings object';
COMMENT ON COLUMN customers.suspension_history IS 'JSONB: Array of SuspensionHistoryRecord objects';

-- ========================================
-- STEP 4: ADD COLUMNS TO PRODUCTS
-- ========================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS serial_number text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tid text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS mid text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS domain text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS firmware text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sam1 text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sam2 text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sam3 text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sim text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS terminal_type text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS online_status text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sync_status text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS terminal_model text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS mac_address text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ptid text;

CREATE INDEX IF NOT EXISTS idx_products_serial_number ON products(serial_number);
CREATE INDEX IF NOT EXISTS idx_products_tid ON products(tid);
CREATE INDEX IF NOT EXISTS idx_products_mid ON products(mid);
CREATE INDEX IF NOT EXISTS idx_products_domain ON products(domain);

COMMENT ON COLUMN products.serial_number IS 'Payter: Device serial number';
COMMENT ON COLUMN products.tid IS 'Payter: Terminal ID';
COMMENT ON COLUMN products.mid IS 'Payter: Merchant ID';
COMMENT ON COLUMN products.domain IS 'Payter: Domain/URL';

-- ========================================
-- STEP 5: ADD COLUMNS TO BANK_ACCOUNTS
-- ========================================

ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS firma_unvan text;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS muhasebe_kodu text;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS banka_or_pf text;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS banka_pf_ad text;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS odeme_kurulusu_tipi text;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS odeme_kurulusu_ad text;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS vergi_dairesi text;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS vergi_no text;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS adres text;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS telefon text;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS durum text;

ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS iletisim_matrisi jsonb;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS dokumanlar jsonb;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS isbirlikleri jsonb;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS tabela_records jsonb;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS tabela_groups jsonb;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS hakedis_records jsonb;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS agreement_banks jsonb;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS agreement_epks jsonb;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS agreement_oks jsonb;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS linked_bank_ids jsonb;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS linked_epk_ids jsonb;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS linked_ok_ids jsonb;

CREATE INDEX IF NOT EXISTS idx_bank_accounts_firma_unvan ON bank_accounts(firma_unvan);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_banka_or_pf ON bank_accounts(banka_or_pf);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_muhasebe_kodu ON bank_accounts(muhasebe_kodu);

COMMENT ON COLUMN bank_accounts.iletisim_matrisi IS 'JSONB: Array of ContactPerson objects';
COMMENT ON COLUMN bank_accounts.tabela_records IS 'JSONB: Array of TabelaRecord objects';
COMMENT ON COLUMN bank_accounts.tabela_groups IS 'JSONB: Array of TabelaGroup objects';
COMMENT ON COLUMN bank_accounts.hakedis_records IS 'JSONB: Array of HakedisRecord objects';

-- ========================================
-- STEP 6: VERIFICATION
-- ========================================

SELECT 
  'customers' AS table_name,
  COUNT(*) FILTER (WHERE "bankDeviceAssignments" IS NOT NULL) AS has_bank_device_assignments,
  COUNT(*) FILTER (WHERE device_subscriptions IS NOT NULL) AS has_device_subscriptions,
  COUNT(*) FILTER (WHERE suspension_history IS NOT NULL) AS has_suspension_history
FROM customers;

SELECT 
  'products' AS table_name,
  COUNT(*) FILTER (WHERE serial_number IS NOT NULL) AS has_serial_number,
  COUNT(*) FILTER (WHERE tid IS NOT NULL) AS has_tid,
  COUNT(*) FILTER (WHERE mid IS NOT NULL) AS has_mid
FROM products;

SELECT 
  'bank_accounts' AS table_name,
  COUNT(*) FILTER (WHERE firma_unvan IS NOT NULL) AS has_firma_unvan,
  COUNT(*) FILTER (WHERE tabela_records IS NOT NULL) AS has_tabela_records,
  COUNT(*) FILTER (WHERE hakedis_records IS NOT NULL) AS has_hakedis_records
FROM bank_accounts;

-- ========================================
-- STEP 7: FINAL COLUMN LIST
-- ========================================

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers'
  AND column_name IN (
    'bankDeviceAssignments', 'device_subscriptions', 'service_fee_invoices',
    'payment_reminders', 'reminder_settings', 'suspension_history'
  )
ORDER BY column_name;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'products'
  AND column_name IN (
    'serial_number', 'tid', 'mid', 'domain'
  )
ORDER BY column_name;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'bank_accounts'
  AND column_name IN (
    'firma_unvan', 'tabela_records', 'hakedis_records', 'agreement_banks'
  )
ORDER BY column_name;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================

DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'customers: +5 JSONB fields (bankDeviceAssignments checked)';
  RAISE NOTICE 'products: +15 Payter fields';
  RAISE NOTICE 'bank_accounts: +24 BankPF fields';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next: Test the app and run Migration Panel!';
  RAISE NOTICE '========================================';
END $$;
