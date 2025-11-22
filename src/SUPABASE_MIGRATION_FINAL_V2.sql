-- ========================================
-- SUPABASE MIGRATION SCRIPT - FINAL V2
-- ========================================
-- Project: Yönetim Uygulaması
-- Date: 2025-11-22
-- Purpose: Add missing fields for Hybrid Storage Architecture
-- Tables: customers, products, bank_accounts
-- FIX: bankDeviceAssignments TEXT -> JSONB conversion error
-- ========================================

-- ========================================
-- PART 1: CUSTOMERS TABLE
-- ========================================

-- 🔧 FIX: bankDeviceAssignments TEXT -> JSONB (SAFE VERSION)
-- Step 1: Set empty strings and invalid JSON to NULL
UPDATE customers 
SET "bankDeviceAssignments" = NULL
WHERE "bankDeviceAssignments" = '' 
   OR "bankDeviceAssignments" IS NULL
   OR "bankDeviceAssignments"::text !~ '^\s*[\[\{]';

-- Step 2: Now safely convert to JSONB
ALTER TABLE customers 
ALTER COLUMN "bankDeviceAssignments" 
TYPE jsonb 
USING "bankDeviceAssignments"::jsonb;

COMMENT ON COLUMN customers."bankDeviceAssignments" IS 'JSONB: Array of BankDeviceAssignment objects';

-- ✅ ADD: Missing JSONB fields
ALTER TABLE customers ADD COLUMN IF NOT EXISTS device_subscriptions jsonb;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS service_fee_invoices jsonb;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_reminders jsonb;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS reminder_settings jsonb;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS suspension_history jsonb;

-- 📝 Add comments
COMMENT ON COLUMN customers.device_subscriptions IS 'JSONB: Array of DeviceSubscription objects';
COMMENT ON COLUMN customers.service_fee_invoices IS 'JSONB: Array of ServiceFeeInvoice objects';
COMMENT ON COLUMN customers.payment_reminders IS 'JSONB: Array of PaymentReminder objects';
COMMENT ON COLUMN customers.reminder_settings IS 'JSONB: ReminderSettings object';
COMMENT ON COLUMN customers.suspension_history IS 'JSONB: Array of SuspensionHistoryRecord objects';

-- ========================================
-- PART 2: PRODUCTS TABLE
-- ========================================

-- ✅ ADD: Payter Product Fields
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

-- 🔍 CREATE: Performance indexes
CREATE INDEX IF NOT EXISTS idx_products_serial_number ON products(serial_number);
CREATE INDEX IF NOT EXISTS idx_products_tid ON products(tid);
CREATE INDEX IF NOT EXISTS idx_products_mid ON products(mid);
CREATE INDEX IF NOT EXISTS idx_products_domain ON products(domain);

-- 📝 Add comments
COMMENT ON COLUMN products.serial_number IS 'Payter: Device serial number';
COMMENT ON COLUMN products.tid IS 'Payter: Terminal ID';
COMMENT ON COLUMN products.mid IS 'Payter: Merchant ID';
COMMENT ON COLUMN products.domain IS 'Payter: Domain/URL';

-- ========================================
-- PART 3: BANK_ACCOUNTS TABLE
-- ========================================

-- ✅ ADD: BankPF Specific Fields (Text)
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

-- ✅ ADD: BankPF JSONB Fields
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

-- 🔍 CREATE: Performance indexes
CREATE INDEX IF NOT EXISTS idx_bank_accounts_firma_unvan ON bank_accounts(firma_unvan);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_banka_or_pf ON bank_accounts(banka_or_pf);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_muhasebe_kodu ON bank_accounts(muhasebe_kodu);

-- 📝 Add comments
COMMENT ON COLUMN bank_accounts.iletisim_matrisi IS 'JSONB: Array of ContactPerson objects';
COMMENT ON COLUMN bank_accounts.tabela_records IS 'JSONB: Array of TabelaRecord objects';
COMMENT ON COLUMN bank_accounts.tabela_groups IS 'JSONB: Array of TabelaGroup objects';
COMMENT ON COLUMN bank_accounts.hakedis_records IS 'JSONB: Array of HakedisRecord objects';

-- ========================================
-- PART 4: DATA MIGRATION HELPERS
-- ========================================

-- 🔄 OPTIONAL: Migrate data from bankPFRecords to bank_accounts
-- IMPORTANT: Bu sorguyu çalıştırmadan önce yedek alın!
-- COMMENT OUT if you want to keep bankPFRecords separate

/*
UPDATE bank_accounts ba
SET 
  tabela_records = bpf."tabelaRecords",
  tabela_groups = bpf."tabelaGroups",
  hakedis_records = bpf."hakedisRecords",
  agreement_banks = bpf."agreementBanks",
  firma_unvan = bpf."firmaUnvan",
  banka_pf_ad = bpf."selectedBanka",
  odeme_kurulusu_ad = bpf.epk
FROM "bankPFRecords" bpf
WHERE ba.firma_unvan = bpf."firmaUnvan"
  OR ba.bank_name = bpf."selectedBanka";

-- Log migration results
DO $$ 
DECLARE 
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count
  FROM bank_accounts
  WHERE tabela_records IS NOT NULL;
  
  RAISE NOTICE 'Migrated % records from bankPFRecords to bank_accounts', migrated_count;
END $$;
*/

-- ========================================
-- PART 5: VERIFICATION QUERIES
-- ========================================

-- ✅ Verify customers table
SELECT 
  'customers' AS table_name,
  COUNT(*) FILTER (WHERE "bankDeviceAssignments" IS NOT NULL) AS has_bank_device_assignments,
  COUNT(*) FILTER (WHERE device_subscriptions IS NOT NULL) AS has_device_subscriptions,
  COUNT(*) FILTER (WHERE suspension_history IS NOT NULL) AS has_suspension_history
FROM customers;

-- ✅ Verify products table
SELECT 
  'products' AS table_name,
  COUNT(*) FILTER (WHERE serial_number IS NOT NULL) AS has_serial_number,
  COUNT(*) FILTER (WHERE tid IS NOT NULL) AS has_tid,
  COUNT(*) FILTER (WHERE mid IS NOT NULL) AS has_mid
FROM products;

-- ✅ Verify bank_accounts table
SELECT 
  'bank_accounts' AS table_name,
  COUNT(*) FILTER (WHERE firma_unvan IS NOT NULL) AS has_firma_unvan,
  COUNT(*) FILTER (WHERE tabela_records IS NOT NULL) AS has_tabela_records,
  COUNT(*) FILTER (WHERE hakedis_records IS NOT NULL) AS has_hakedis_records
FROM bank_accounts;

-- ========================================
-- PART 6: COLUMN LISTING (Verification)
-- ========================================

-- List all new columns added to customers
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers'
  AND column_name IN (
    'bankDeviceAssignments', 'device_subscriptions', 'service_fee_invoices',
    'payment_reminders', 'reminder_settings', 'suspension_history'
  )
ORDER BY column_name;

-- List all new columns added to products
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'products'
  AND column_name IN (
    'serial_number', 'tid', 'mid', 'domain', 'firmware',
    'sam1', 'sam2', 'sam3', 'sim', 'terminal_type',
    'online_status', 'sync_status', 'terminal_model', 'mac_address', 'ptid'
  )
ORDER BY column_name;

-- List all new columns added to bank_accounts
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'bank_accounts'
  AND column_name IN (
    'firma_unvan', 'tabela_records', 'hakedis_records', 
    'iletisim_matrisi', 'agreement_banks', 'durum'
  )
ORDER BY column_name;

-- ========================================
-- ✅ MIGRATION COMPLETE
-- ========================================

DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'customers: +5 JSONB fields + 1 type fix';
  RAISE NOTICE 'products: +15 Payter fields';
  RAISE NOTICE 'bank_accounts: +24 BankPF fields';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run verification queries (PART 5)';
  RAISE NOTICE '2. Test Migration Panel in app';
  RAISE NOTICE '3. Optionally merge bankPFRecords data (PART 4)';
  RAISE NOTICE '========================================';
END $$;
