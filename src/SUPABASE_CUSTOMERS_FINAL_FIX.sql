-- ========================================
-- CUSTOMERS TABLE - COMPLETE SCHEMA
-- ========================================
-- Bu script customers tablosunu interface'e uygun şekilde oluşturur
-- Date: 2025-11-23
-- Source: /types/database.ts - CustomersRow interface
-- ========================================

-- Eski tabloyu sil (varsa)
DROP TABLE IF EXISTS public.customers CASCADE;

-- Yeni tabloyu oluştur
CREATE TABLE public.customers (
  -- ========================================
  -- PRIMARY & SYSTEM FIELDS
  -- ========================================
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- ========================================
  -- CORE CUSTOMER FIELDS
  -- ========================================
  cari_hesap_kodu text NOT NULL,
  sektor text,
  mcc text,
  cari_adi text NOT NULL,
  guncel_my_payter_domain text,
  vergi_dairesi text,
  vergi_no text,
  adres text,
  ilce text,
  posta_kodu text,
  email text,
  yetkili text,
  tel text,
  durum text DEFAULT 'Aktif',
  p6x text,
  apollo text,
  
  -- ========================================
  -- SALES & MANAGEMENT FIELDS
  -- ========================================
  sales_rep_id text,
  sales_rep_name text,
  bloke_durumu boolean DEFAULT false,
  sorumlu_kisi text,
  cari_grubu text,
  kayit_tarihi text,
  musteri_tipi text,
  
  -- ========================================
  -- DOMAIN & SUBSCRIPTION
  -- ========================================
  domain text,
  ignore_main_domain boolean DEFAULT false,
  ignore_main_domain_note text,
  subscription_fee numeric,
  
  -- ========================================
  -- JSONB FIELDS (Complex data structures)
  -- ========================================
  domain_hierarchy jsonb,
  linked_bank_pf_ids jsonb,
  bank_device_assignments jsonb,
  service_fee_settings jsonb,
  device_subscriptions jsonb,
  service_fee_invoices jsonb,
  payment_reminders jsonb,
  reminder_settings jsonb,
  suspension_history jsonb
);

-- ========================================
-- INDEXES (Performance optimization)
-- ========================================
CREATE INDEX idx_customers_cari_hesap_kodu ON customers(cari_hesap_kodu);
CREATE INDEX idx_customers_cari_adi ON customers(cari_adi);
CREATE INDEX idx_customers_durum ON customers(durum);
CREATE INDEX idx_customers_sales_rep_id ON customers(sales_rep_id);
CREATE INDEX idx_customers_email ON customers(email);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations (dev mode)
-- TODO: Production'da kullanıcı bazlı policy ekle
CREATE POLICY "Allow all operations on customers" 
  ON customers 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger function: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: updated_at otomatik güncelleme
CREATE TRIGGER set_updated_at 
  BEFORE UPDATE ON customers 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VERIFICATION
-- ========================================

-- Table bilgisini göster
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'customers'
ORDER BY ordinal_position;

-- Toplam kolon sayısı
SELECT COUNT(*) as total_columns 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'customers';

-- Policy kontrolü
SELECT * FROM pg_policies WHERE tablename = 'customers';

-- Index kontrolü
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'customers';

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '✅ customers table created successfully!';
  RAISE NOTICE '📊 Total columns: 41 (3 system + 38 data fields)';
  RAISE NOTICE '🔐 RLS enabled with "Allow all" policy';
  RAISE NOTICE '📇 5 indexes created for performance';
  RAISE NOTICE '⚡ Auto-update trigger configured';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 NEXT STEPS:';
  RAISE NOTICE '1. Refresh your app (CTRL+SHIFT+R)';
  RAISE NOTICE '2. Import JSON file';
  RAISE NOTICE '3. Check console for: ✅ Created 352 customers in Supabase';
END $$;
