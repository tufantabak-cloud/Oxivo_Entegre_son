-- ========================================
-- SUPABASE DATABASE CLEANUP
-- ========================================
-- Purpose: Remove duplicate tables and use ONLY kv_store_9ec5bbb3
-- Date: 2025-11-22
-- Architecture: Single KV Store (Key-Value JSON storage)
--
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire script
-- 3. Click "Run" to execute
-- ========================================

-- ========================================
-- STEP 1: DROP OLD TABLES (if they exist)
-- ========================================
-- These tables are NOT USED by the current backend
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS bank_accounts CASCADE;
DROP TABLE IF EXISTS payterProducts CASCADE;
DROP TABLE IF EXISTS bankPFRecords CASCADE;
DROP TABLE IF EXISTS domains CASCADE;

-- ========================================
-- STEP 2: CREATE KV STORE TABLE
-- ========================================
-- This is the ONLY table the backend uses
CREATE TABLE IF NOT EXISTS kv_store_9ec5bbb3 (
    key TEXT NOT NULL PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_kv_store_key ON kv_store_9ec5bbb3(key);
CREATE INDEX IF NOT EXISTS idx_kv_store_created_at ON kv_store_9ec5bbb3(created_at);

-- ========================================
-- STEP 4: ADD COMMENTS
-- ========================================
COMMENT ON TABLE kv_store_9ec5bbb3 IS 'Key-Value store for all application data (customers, products, bankPF, etc.)';
COMMENT ON COLUMN kv_store_9ec5bbb3.key IS 'Unique key (e.g., "customers", "payterProducts", "bankPFRecords")';
COMMENT ON COLUMN kv_store_9ec5bbb3.value IS 'JSON data stored as JSONB';

-- ========================================
-- STEP 5: CREATE UPDATED_AT TRIGGER
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_kv_store_updated_at ON kv_store_9ec5bbb3;
CREATE TRIGGER update_kv_store_updated_at
    BEFORE UPDATE ON kv_store_9ec5bbb3
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VERIFICATION
-- ========================================
-- Check table structure
SELECT 
    table_name,
    column_name,
    data_type 
FROM information_schema.columns 
WHERE table_name = 'kv_store_9ec5bbb3'
ORDER BY ordinal_position;

-- Check if table is empty
SELECT COUNT(*) as total_keys FROM kv_store_9ec5bbb3;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
SELECT '✅ Supabase cleanup completed! Only kv_store_9ec5bbb3 table exists.' as status;
