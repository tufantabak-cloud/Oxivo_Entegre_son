-- ========================================
-- FAZ 3: CUSTOMERS TABLE OPTIMIZATION
-- ========================================
-- Created: 2025-12-10
-- Purpose: Index + RLS policies for Customers module
-- ========================================

BEGIN;

-- ========================================
-- STEP 1: CREATE INDEXES for Performance
-- ========================================

-- Primary search indexes
CREATE INDEX IF NOT EXISTS idx_customers_cari_adi 
ON customers(cari_adi);

CREATE INDEX IF NOT EXISTS idx_customers_cari_hesap_kodu 
ON customers(cari_hesap_kodu);

-- Status filter index
CREATE INDEX IF NOT EXISTS idx_customers_durum 
ON customers(durum);

-- Search optimization (ILIKE queries)
CREATE INDEX IF NOT EXISTS idx_customers_cari_adi_trgm 
ON customers USING gin(cari_adi gin_trgm_ops);

-- Composite index for filtered lists
CREATE INDEX IF NOT EXISTS idx_customers_durum_cari_adi 
ON customers(durum, cari_adi);

-- ========================================
-- STEP 2: ENABLE RLS (Row Level Security)
-- ========================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 3: CREATE RLS POLICIES
-- ========================================

-- DROP existing policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON customers;

-- READ: Allow all authenticated users to read
CREATE POLICY "Enable read access for all users"
ON customers FOR SELECT
USING (true);

-- CREATE: Allow authenticated users to insert
CREATE POLICY "Enable insert for authenticated users"
ON customers FOR INSERT
WITH CHECK (true);

-- UPDATE: Allow authenticated users to update
CREATE POLICY "Enable update for authenticated users"
ON customers FOR UPDATE
USING (true)
WITH CHECK (true);

-- DELETE: Allow authenticated users to delete
CREATE POLICY "Enable delete for authenticated users"
ON customers FOR DELETE
USING (true);

-- ========================================
-- STEP 4: VERIFY INDEXES
-- ========================================

-- Show all indexes on customers table
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'customers'
ORDER BY indexname;

COMMIT;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- 1. Test search performance
EXPLAIN ANALYZE
SELECT id, cari_adi, cari_hesap_kodu
FROM customers
WHERE cari_adi ILIKE '%MARKET%'
LIMIT 10;

-- 2. Test filtered list
EXPLAIN ANALYZE
SELECT id, cari_adi, durum
FROM customers
WHERE durum = 'Aktif'
ORDER BY cari_adi
LIMIT 20;

-- 3. Count active customers
SELECT durum, COUNT(*) as count
FROM customers
GROUP BY durum;
