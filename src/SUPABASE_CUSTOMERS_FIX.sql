-- ========================================
-- SUPABASE CUSTOMERS TABLE FIX
-- ========================================
-- Purpose: Create/recreate customers table with correct Turkish field names
-- Date: 2025-11-23
-- Critical Fix: Match Customer interface (camelCase → snake_case)
-- ========================================

-- 🗑️ STEP 1: Drop existing table if structure is wrong
DROP TABLE IF EXISTS public.customers CASCADE;

-- ✅ STEP 2: Create customers table with correct columns
CREATE TABLE public.customers (
  -- Primary & System Fields
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- ========================================
  -- CORE CUSTOMER FIELDS (Turkish names → snake_case)
  -- ========================================
  cari_hesap_kodu text NOT NULL, -- Customer code
  sektor text, -- Sector
  mcc text, -- MCC code
  cari_adi text NOT NULL, -- Customer name
  guncel_my_payter_domain text, -- Current MyPayter domain
  vergi_dairesi text, -- Tax office
  vergi_no text, -- Tax number
  adres text, -- Address
  ilce text, -- District
  posta_kodu text, -- Postal code
  email text, -- Email
  yetkili text, -- Contact person
  tel text, -- Phone
  durum text DEFAULT 'Aktif' CHECK (durum IN ('Aktif', 'Pasif')), -- Status
  p6x text, -- P6X info
  apollo text, -- Apollo info
  
  -- ========================================
  -- SALES & MANAGEMENT FIELDS
  -- ========================================
  sales_rep_id text, -- Sales rep ID
  sales_rep_name text, -- Sales rep name (cached)
  bloke_durumu boolean DEFAULT false, -- Blocked status
  sorumlu_kisi text, -- Responsible person
  cari_grubu text, -- Customer group
  kayit_tarihi text, -- Registration date (ISO string)
  musteri_tipi text, -- Customer type (Büyük İşletme, etc.)
  
  -- ========================================
  -- DOMAIN & SUBSCRIPTION
  -- ========================================
  domain text, -- Alias for guncel_my_payter_domain
  ignore_main_domain boolean DEFAULT false, -- Ignore main domain flag
  ignore_main_domain_note text, -- Reason for ignoring main domain
  subscription_fee numeric, -- Monthly subscription fee (₺)
  
  -- ========================================
  -- JSONB FIELDS (Complex data structures)
  -- ========================================
  domain_hierarchy jsonb, -- DomainNode[] tree structure
  linked_bank_pf_ids jsonb, -- string[] - Related Bank/PF IDs
  bank_device_assignments jsonb, -- BankDeviceAssignment[]
  service_fee_settings jsonb, -- ServiceFeeSettings object
  device_subscriptions jsonb, -- DeviceSubscription[]
  service_fee_invoices jsonb, -- ServiceFeeInvoice[]
  payment_reminders jsonb, -- PaymentReminder[]
  reminder_settings jsonb, -- ReminderSettings object
  suspension_history jsonb -- SuspensionHistoryRecord[]
);

-- ========================================
-- STEP 3: Create Indexes for Performance
-- ========================================
CREATE INDEX idx_customers_cari_hesap_kodu ON customers(cari_hesap_kodu);
CREATE INDEX idx_customers_cari_adi ON customers(cari_adi);
CREATE INDEX idx_customers_vergi_no ON customers(vergi_no);
CREATE INDEX idx_customers_durum ON customers(durum);
CREATE INDEX idx_customers_sales_rep_id ON customers(sales_rep_id);
CREATE INDEX idx_customers_domain ON customers(domain);
CREATE INDEX idx_customers_guncel_my_payter_domain ON customers(guncel_my_payter_domain);
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);

-- GIN indexes for JSONB fields
CREATE INDEX idx_customers_domain_hierarchy ON customers USING gin(domain_hierarchy);
CREATE INDEX idx_customers_bank_device_assignments ON customers USING gin(bank_device_assignments);

-- ========================================
-- STEP 4: Add Comments (Documentation)
-- ========================================
COMMENT ON TABLE customers IS 'Customer records - Turkish field names (camelCase → snake_case)';
COMMENT ON COLUMN customers.cari_hesap_kodu IS 'Customer account code (120.01.001)';
COMMENT ON COLUMN customers.cari_adi IS 'Customer name';
COMMENT ON COLUMN customers.guncel_my_payter_domain IS 'Current MyPayter domain URL';
COMMENT ON COLUMN customers.domain_hierarchy IS 'JSONB: DomainNode[] tree structure';
COMMENT ON COLUMN customers.bank_device_assignments IS 'JSONB: BankDeviceAssignment[] - Bank device relationships';
COMMENT ON COLUMN customers.service_fee_settings IS 'JSONB: ServiceFeeSettings - Monthly fee configuration';
COMMENT ON COLUMN customers.device_subscriptions IS 'JSONB: DeviceSubscription[] - Device subscription records';

-- ========================================
-- STEP 5: Enable Row Level Security (RLS)
-- ========================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations with valid ANON key (for development)
CREATE POLICY "Allow all for authenticated users"
  ON customers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ========================================
-- STEP 6: Create Updated At Trigger
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- STEP 7: Verification Query
-- ========================================
DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CUSTOMERS TABLE CREATED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table: public.customers';
  RAISE NOTICE 'Columns: 32 fields (19 text, 8 jsonb, 5 system)';
  RAISE NOTICE 'Indexes: 10 indexes created';
  RAISE NOTICE 'RLS: Enabled with allow-all policy';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify table structure in Supabase Dashboard';
  RAISE NOTICE '2. Test data import from application';
  RAISE NOTICE '3. Adjust RLS policies for production';
  RAISE NOTICE '========================================';
END $$;

-- List all columns for verification
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'customers'
  AND table_schema = 'public'
ORDER BY ordinal_position;
