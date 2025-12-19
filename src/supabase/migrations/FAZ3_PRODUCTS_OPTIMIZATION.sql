-- ========================================
-- FAZ 3: PRODUCTS TABLE OPTIMIZATION
-- ========================================
-- Created: 2025-12-10
-- Purpose: Index + RLS policies for Products module
-- ========================================

BEGIN;

-- ========================================
-- STEP 1: CREATE INDEXES for Performance
-- ========================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_products_product_code 
ON products(product_code);

CREATE INDEX IF NOT EXISTS idx_products_barcode 
ON products(barcode);

CREATE INDEX IF NOT EXISTS idx_products_serial_number 
ON products(serial_number);

CREATE INDEX IF NOT EXISTS idx_products_tid 
ON products(tid);

CREATE INDEX IF NOT EXISTS idx_products_mid 
ON products(mid);

CREATE INDEX IF NOT EXISTS idx_products_domain 
ON products(domain);

-- Filter indexes
CREATE INDEX IF NOT EXISTS idx_products_is_active 
ON products(is_active);

CREATE INDEX IF NOT EXISTS idx_products_terminal_type 
ON products(terminal_type);

-- Search optimization (ILIKE queries)
CREATE INDEX IF NOT EXISTS idx_products_name_trgm 
ON products USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_domain_trgm 
ON products USING gin(domain gin_trgm_ops);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_is_active_domain 
ON products(is_active, domain);

CREATE INDEX IF NOT EXISTS idx_products_terminal_type_is_active 
ON products(terminal_type, is_active);

-- Time-based queries
CREATE INDEX IF NOT EXISTS idx_products_created_at 
ON products(created_at DESC);

-- ========================================
-- STEP 2: ENABLE RLS (Row Level Security)
-- ========================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 3: CREATE RLS POLICIES
-- ========================================

-- DROP existing policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON products;

-- READ: Allow all authenticated users to read
CREATE POLICY "Enable read access for all users"
ON products FOR SELECT
USING (true);

-- CREATE: Allow authenticated users to insert
CREATE POLICY "Enable insert for authenticated users"
ON products FOR INSERT
WITH CHECK (true);

-- UPDATE: Allow authenticated users to update
CREATE POLICY "Enable update for authenticated users"
ON products FOR UPDATE
USING (true)
WITH CHECK (true);

-- DELETE: Allow authenticated users to delete
CREATE POLICY "Enable delete for authenticated users"
ON products FOR DELETE
USING (true);

-- ========================================
-- STEP 4: VERIFY INDEXES
-- ========================================

-- Show all indexes on products table
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'products'
ORDER BY indexname;

COMMIT;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- 1. Test serial number lookup
EXPLAIN ANALYZE
SELECT id, serial_number, tid, domain
FROM products
WHERE serial_number = (SELECT serial_number FROM products WHERE serial_number IS NOT NULL LIMIT 1);

-- 2. Test domain search
EXPLAIN ANALYZE
SELECT id, domain, terminal_type, is_active
FROM products
WHERE domain ILIKE '%payter%' AND is_active = true
LIMIT 20;

-- 3. Count by terminal type
SELECT terminal_type, is_active, COUNT(*) as count
FROM products
GROUP BY terminal_type, is_active
ORDER BY terminal_type, is_active;
