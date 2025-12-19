-- ========================================
-- FAZ 3: DEFINITIONS TABLES OPTIMIZATION
-- ========================================
-- Created: 2025-12-10
-- Purpose: Index + RLS policies for 11 definition tables
-- ========================================

BEGIN;

-- ========================================
-- MCC_CODES TABLE
-- ========================================

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mcc_codes_kod ON mcc_codes(kod);
CREATE INDEX IF NOT EXISTS idx_mcc_codes_kategori ON mcc_codes(kategori);
CREATE INDEX IF NOT EXISTS idx_mcc_codes_aktif ON mcc_codes(aktif);

-- RLS
ALTER TABLE mcc_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON mcc_codes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON mcc_codes;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON mcc_codes;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON mcc_codes;

CREATE POLICY "Enable read access for all users" ON mcc_codes FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON mcc_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON mcc_codes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON mcc_codes FOR DELETE USING (true);

-- ========================================
-- BANKS TABLE
-- ========================================

-- Indexes
CREATE INDEX IF NOT EXISTS idx_banks_kod ON banks(kod);
CREATE INDEX IF NOT EXISTS idx_banks_ad ON banks(ad);
CREATE INDEX IF NOT EXISTS idx_banks_aktif ON banks(aktif);
CREATE INDEX IF NOT EXISTS idx_banks_ad_trgm ON banks USING gin(ad gin_trgm_ops);

-- RLS
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON banks;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON banks;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON banks;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON banks;

CREATE POLICY "Enable read access for all users" ON banks FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON banks FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON banks FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON banks FOR DELETE USING (true);

-- ========================================
-- EPK_INSTITUTIONS TABLE
-- ========================================

-- Indexes
CREATE INDEX IF NOT EXISTS idx_epk_institutions_kod ON epk_institutions(kod);
CREATE INDEX IF NOT EXISTS idx_epk_institutions_ad ON epk_institutions(ad);
CREATE INDEX IF NOT EXISTS idx_epk_institutions_aktif ON epk_institutions(aktif);

-- RLS
ALTER TABLE epk_institutions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON epk_institutions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON epk_institutions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON epk_institutions;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON epk_institutions;

CREATE POLICY "Enable read access for all users" ON epk_institutions FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON epk_institutions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON epk_institutions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON epk_institutions FOR DELETE USING (true);

-- ========================================
-- OK_INSTITUTIONS TABLE
-- ========================================

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ok_institutions_kod ON ok_institutions(kod);
CREATE INDEX IF NOT EXISTS idx_ok_institutions_ad ON ok_institutions(ad);
CREATE INDEX IF NOT EXISTS idx_ok_institutions_aktif ON ok_institutions(aktif);

-- RLS
ALTER TABLE ok_institutions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON ok_institutions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON ok_institutions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON ok_institutions;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON ok_institutions;

CREATE POLICY "Enable read access for all users" ON ok_institutions FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON ok_institutions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON ok_institutions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON ok_institutions FOR DELETE USING (true);

-- ========================================
-- SALES_REPRESENTATIVES TABLE
-- ========================================

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sales_representatives_kod ON sales_representatives(kod);
CREATE INDEX IF NOT EXISTS idx_sales_representatives_ad_soyad ON sales_representatives(ad_soyad);
CREATE INDEX IF NOT EXISTS idx_sales_representatives_aktif ON sales_representatives(aktif);

-- RLS
ALTER TABLE sales_representatives ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON sales_representatives;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON sales_representatives;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON sales_representatives;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON sales_representatives;

CREATE POLICY "Enable read access for all users" ON sales_representatives FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON sales_representatives FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON sales_representatives FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON sales_representatives FOR DELETE USING (true);

-- ========================================
-- JOB_TITLES TABLE
-- ========================================

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_titles_unvan ON job_titles(unvan);
CREATE INDEX IF NOT EXISTS idx_job_titles_aktif ON job_titles(aktif);

-- RLS
ALTER TABLE job_titles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON job_titles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON job_titles;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON job_titles;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON job_titles;

CREATE POLICY "Enable read access for all users" ON job_titles FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON job_titles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON job_titles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON job_titles FOR DELETE USING (true);

-- ========================================
-- PARTNERSHIPS TABLE
-- ========================================

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partnerships_partner_name ON partnerships(partner_name);
CREATE INDEX IF NOT EXISTS idx_partnerships_aktif ON partnerships(aktif);

-- RLS
ALTER TABLE partnerships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON partnerships;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON partnerships;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON partnerships;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON partnerships;

CREATE POLICY "Enable read access for all users" ON partnerships FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON partnerships FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON partnerships FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON partnerships FOR DELETE USING (true);

-- ========================================
-- SHARINGS TABLE
-- ========================================

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sharings_kod ON sharings(kod);
CREATE INDEX IF NOT EXISTS idx_sharings_ad ON sharings(ad);
CREATE INDEX IF NOT EXISTS idx_sharings_aktif ON sharings(aktif);
CREATE INDEX IF NOT EXISTS idx_sharings_sira ON sharings(sira);

-- RLS
ALTER TABLE sharings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON sharings;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON sharings;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON sharings;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON sharings;

CREATE POLICY "Enable read access for all users" ON sharings FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON sharings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON sharings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON sharings FOR DELETE USING (true);

-- ========================================
-- CARD_PROGRAMS TABLE
-- ========================================

-- Indexes
CREATE INDEX IF NOT EXISTS idx_card_programs_kod ON card_programs(kod);
CREATE INDEX IF NOT EXISTS idx_card_programs_ad ON card_programs(ad);
CREATE INDEX IF NOT EXISTS idx_card_programs_aktif ON card_programs(aktif);

-- RLS
ALTER TABLE card_programs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON card_programs;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON card_programs;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON card_programs;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON card_programs;

CREATE POLICY "Enable read access for all users" ON card_programs FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON card_programs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON card_programs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON card_programs FOR DELETE USING (true);

-- ========================================
-- SUSPENSION_REASONS TABLE
-- ========================================

-- Indexes
CREATE INDEX IF NOT EXISTS idx_suspension_reasons_neden ON suspension_reasons(neden);
CREATE INDEX IF NOT EXISTS idx_suspension_reasons_aktif ON suspension_reasons(aktif);

-- RLS
ALTER TABLE suspension_reasons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON suspension_reasons;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON suspension_reasons;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON suspension_reasons;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON suspension_reasons;

CREATE POLICY "Enable read access for all users" ON suspension_reasons FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON suspension_reasons FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON suspension_reasons FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON suspension_reasons FOR DELETE USING (true);

-- ========================================
-- REVENUE_MODELS TABLE
-- ========================================

-- Indexes
CREATE INDEX IF NOT EXISTS idx_revenue_models_model_adi ON revenue_models(model_adi);
CREATE INDEX IF NOT EXISTS idx_revenue_models_aktif ON revenue_models(aktif);

-- RLS
ALTER TABLE revenue_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON revenue_models;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON revenue_models;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON revenue_models;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON revenue_models;

CREATE POLICY "Enable read access for all users" ON revenue_models FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON revenue_models FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON revenue_models FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON revenue_models FOR DELETE USING (true);

COMMIT;

-- ========================================
-- VERIFICATION
-- ========================================

-- Show all indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN (
    'mcc_codes', 'banks', 'epk_institutions', 'ok_institutions', 
    'sales_representatives', 'job_titles', 'partnerships', 
    'sharings', 'card_programs', 'suspension_reasons', 'revenue_models'
)
ORDER BY tablename, indexname;
