-- ========================================
-- FAZ 3: SIGNS TABLE OPTIMIZATION (TABELA)
-- ========================================
-- Created: 2025-12-10
-- Purpose: Index + RLS policies for Tabela/Signs module
-- ========================================

BEGIN;

-- ========================================
-- STEP 1: CREATE INDEXES for Performance
-- ========================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_signs_firma_id 
ON signs(firma_id);

CREATE INDEX IF NOT EXISTS idx_signs_tabela_group_id 
ON signs(tabela_group_id);

CREATE INDEX IF NOT EXISTS idx_signs_domain 
ON signs(domain);

CREATE INDEX IF NOT EXISTS idx_signs_mid 
ON signs(mid);

-- Status filter
CREATE INDEX IF NOT EXISTS idx_signs_durum 
ON signs(durum);

-- Time-based queries
CREATE INDEX IF NOT EXISTS idx_signs_created_at 
ON signs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_signs_updated_at 
ON signs(updated_at DESC);

-- Search optimization (ILIKE on domain)
CREATE INDEX IF NOT EXISTS idx_signs_domain_trgm 
ON signs USING gin(domain gin_trgm_ops);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_signs_firma_tabela_group 
ON signs(firma_id, tabela_group_id);

CREATE INDEX IF NOT EXISTS idx_signs_firma_durum 
ON signs(firma_id, durum);

CREATE INDEX IF NOT EXISTS idx_signs_tabela_group_durum 
ON signs(tabela_group_id, durum);

-- ========================================
-- STEP 2: ENABLE RLS (Row Level Security)
-- ========================================

ALTER TABLE signs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 3: CREATE RLS POLICIES
-- ========================================

-- DROP existing policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON signs;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON signs;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON signs;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON signs;

-- READ: Allow all authenticated users to read
CREATE POLICY "Enable read access for all users"
ON signs FOR SELECT
USING (true);

-- CREATE: Allow authenticated users to insert
CREATE POLICY "Enable insert for authenticated users"
ON signs FOR INSERT
WITH CHECK (true);

-- UPDATE: Allow authenticated users to update
CREATE POLICY "Enable update for authenticated users"
ON signs FOR UPDATE
USING (true)
WITH CHECK (true);

-- DELETE: Allow authenticated users to delete
CREATE POLICY "Enable delete for authenticated users"
ON signs FOR DELETE
USING (true);

-- ========================================
-- STEP 4: VERIFY INDEXES
-- ========================================

-- Show all indexes on signs table
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'signs'
ORDER BY indexname;

COMMIT;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- 1. Test firma signs query
EXPLAIN ANALYZE
SELECT id, firma_id, domain, mid
FROM signs
WHERE firma_id = (SELECT id FROM bank_accounts LIMIT 1)
ORDER BY created_at DESC
LIMIT 10;

-- 2. Test tabela group query
EXPLAIN ANALYZE
SELECT id, tabela_group_id, domain, durum
FROM signs
WHERE tabela_group_id = (SELECT id FROM signs LIMIT 1)
ORDER BY domain;

-- 3. Count by status and firma
SELECT firma_id, durum, COUNT(*) as count
FROM signs
GROUP BY firma_id, durum
ORDER BY firma_id, durum;
