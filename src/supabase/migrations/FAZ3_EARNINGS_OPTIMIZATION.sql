-- ========================================
-- FAZ 3: EARNINGS TABLE OPTIMIZATION
-- ========================================
-- Created: 2025-12-10
-- Purpose: Index + RLS policies for Earnings module
-- ========================================

BEGIN;

-- ========================================
-- STEP 1: CREATE INDEXES for Performance
-- ========================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_earnings_firma_id 
ON earnings(firma_id);

CREATE INDEX IF NOT EXISTS idx_earnings_tabela_group_id 
ON earnings(tabela_group_id);

CREATE INDEX IF NOT EXISTS idx_earnings_donem 
ON earnings(donem);

CREATE INDEX IF NOT EXISTS idx_earnings_vade 
ON earnings(vade);

-- Status filter
CREATE INDEX IF NOT EXISTS idx_earnings_durum 
ON earnings(durum);

-- Time-based queries
CREATE INDEX IF NOT EXISTS idx_earnings_created_at 
ON earnings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_earnings_updated_at 
ON earnings(updated_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_earnings_firma_donem 
ON earnings(firma_id, donem);

CREATE INDEX IF NOT EXISTS idx_earnings_firma_durum 
ON earnings(firma_id, durum);

CREATE INDEX IF NOT EXISTS idx_earnings_donem_durum 
ON earnings(donem, durum);

-- ========================================
-- STEP 2: ENABLE RLS (Row Level Security)
-- ========================================

ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 3: CREATE RLS POLICIES
-- ========================================

-- DROP existing policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON earnings;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON earnings;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON earnings;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON earnings;

-- READ: Allow all authenticated users to read
CREATE POLICY "Enable read access for all users"
ON earnings FOR SELECT
USING (true);

-- CREATE: Allow authenticated users to insert
CREATE POLICY "Enable insert for authenticated users"
ON earnings FOR INSERT
WITH CHECK (true);

-- UPDATE: Allow authenticated users to update
CREATE POLICY "Enable update for authenticated users"
ON earnings FOR UPDATE
USING (true)
WITH CHECK (true);

-- DELETE: Allow authenticated users to delete
CREATE POLICY "Enable delete for authenticated users"
ON earnings FOR DELETE
USING (true);

-- ========================================
-- STEP 4: VERIFY INDEXES
-- ========================================

-- Show all indexes on earnings table
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'earnings'
ORDER BY indexname;

COMMIT;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- 1. Test firma earnings query
EXPLAIN ANALYZE
SELECT id, firma_id, donem, durum
FROM earnings
WHERE firma_id = (SELECT id FROM bank_accounts LIMIT 1)
ORDER BY created_at DESC
LIMIT 10;

-- 2. Test period query
EXPLAIN ANALYZE
SELECT id, firma_id, tabela_group_ad, donem
FROM earnings
WHERE donem = '2025-12'
ORDER BY firma_id;

-- 3. Count by status
SELECT durum, COUNT(*) as count, SUM(total_islem_hacmi) as total_volume
FROM earnings
GROUP BY durum
ORDER BY durum;
