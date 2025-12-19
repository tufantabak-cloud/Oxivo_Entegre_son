-- ========================================
-- FAZ 3: BANK_ACCOUNTS (BankPF) OPTIMIZATION
-- ========================================
-- Created: 2025-12-10
-- Purpose: Index + RLS policies for BankPF module
-- ========================================

BEGIN;

-- ========================================
-- STEP 1: CREATE INDEXES for Performance
-- ========================================

-- Primary search indexes
CREATE INDEX IF NOT EXISTS idx_bank_accounts_firma_unvan 
ON bank_accounts(firma_unvan);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_muhasebe_kodu 
ON bank_accounts(muhasebe_kodu);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_banka_pf_ad 
ON bank_accounts(banka_pf_ad);

-- Filter index
CREATE INDEX IF NOT EXISTS idx_bank_accounts_durum 
ON bank_accounts(durum);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_banka_or_pf 
ON bank_accounts(banka_or_pf);

-- Search optimization (ILIKE queries)
CREATE INDEX IF NOT EXISTS idx_bank_accounts_firma_unvan_trgm 
ON bank_accounts USING gin(firma_unvan gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_banka_pf_ad_trgm 
ON bank_accounts USING gin(banka_pf_ad gin_trgm_ops);

-- Composite indexes for filtered lists
CREATE INDEX IF NOT EXISTS idx_bank_accounts_banka_or_pf_durum 
ON bank_accounts(banka_or_pf, durum);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_durum_firma_unvan 
ON bank_accounts(durum, firma_unvan);

-- ========================================
-- STEP 2: ENABLE RLS (Row Level Security)
-- ========================================

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 3: CREATE RLS POLICIES
-- ========================================

-- DROP existing policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON bank_accounts;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON bank_accounts;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON bank_accounts;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON bank_accounts;

-- READ: Allow all authenticated users to read
CREATE POLICY "Enable read access for all users"
ON bank_accounts FOR SELECT
USING (true);

-- CREATE: Allow authenticated users to insert
CREATE POLICY "Enable insert for authenticated users"
ON bank_accounts FOR INSERT
WITH CHECK (true);

-- UPDATE: Allow authenticated users to update
CREATE POLICY "Enable update for authenticated users"
ON bank_accounts FOR UPDATE
USING (true)
WITH CHECK (true);

-- DELETE: Allow authenticated users to delete
CREATE POLICY "Enable delete for authenticated users"
ON bank_accounts FOR DELETE
USING (true);

-- ========================================
-- STEP 4: VERIFY INDEXES
-- ========================================

-- Show all indexes on bank_accounts table
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'bank_accounts'
ORDER BY indexname;

COMMIT;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- 1. Test search performance
EXPLAIN ANALYZE
SELECT id, firma_unvan, banka_pf_ad
FROM bank_accounts
WHERE firma_unvan ILIKE '%LTD%'
LIMIT 10;

-- 2. Test filtered list (Banka only)
EXPLAIN ANALYZE
SELECT id, firma_unvan, banka_or_pf
FROM bank_accounts
WHERE banka_or_pf = 'Banka' AND durum = 'Aktif'
ORDER BY firma_unvan
LIMIT 20;

-- 3. Count by type
SELECT banka_or_pf, durum, COUNT(*) as count
FROM bank_accounts
GROUP BY banka_or_pf, durum
ORDER BY banka_or_pf, durum;
