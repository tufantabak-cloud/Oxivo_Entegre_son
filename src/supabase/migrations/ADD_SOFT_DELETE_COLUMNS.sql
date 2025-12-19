-- ============================================
-- SOFT DELETE MIGRATION
-- ============================================
-- Purpose: Add is_deleted and deleted_at columns to all tables
-- Date: 2025-12-13
-- Author: System
--
-- CRITICAL RULE: NO HARD DELETE - Always use soft delete
-- ============================================

-- ============================================
-- CUSTOMERS TABLE
-- ============================================
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_is_deleted ON customers(is_deleted);
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================
-- BANK ACCOUNTS (Bank/PF) TABLE
-- ============================================
ALTER TABLE bank_accounts 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_bank_accounts_is_deleted ON bank_accounts(is_deleted);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_deleted_at ON bank_accounts(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================
-- PRODUCTS TABLE
-- ============================================
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_products_is_deleted ON products(is_deleted);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================
-- MCC CODES TABLE
-- ============================================
ALTER TABLE mcc_codes 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_mcc_codes_is_deleted ON mcc_codes(is_deleted);

-- ============================================
-- BANKS TABLE
-- ============================================
ALTER TABLE banks 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_banks_is_deleted ON banks(is_deleted);

-- ============================================
-- EPK INSTITUTIONS TABLE
-- ============================================
ALTER TABLE epk_institutions 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_epk_institutions_is_deleted ON epk_institutions(is_deleted);

-- ============================================
-- OK INSTITUTIONS TABLE
-- ============================================
ALTER TABLE ok_institutions 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_ok_institutions_is_deleted ON ok_institutions(is_deleted);

-- ============================================
-- SALES REPRESENTATIVES TABLE
-- ============================================
ALTER TABLE sales_representatives 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_sales_representatives_is_deleted ON sales_representatives(is_deleted);

-- ============================================
-- JOB TITLES TABLE
-- ============================================
ALTER TABLE job_titles 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_job_titles_is_deleted ON job_titles(is_deleted);

-- ============================================
-- PARTNERSHIPS TABLE
-- ============================================
ALTER TABLE partnerships 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_partnerships_is_deleted ON partnerships(is_deleted);

-- ============================================
-- SHARINGS TABLE
-- ============================================
ALTER TABLE sharings 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_sharings_is_deleted ON sharings(is_deleted);

-- ============================================
-- CARD PROGRAMS TABLE
-- ============================================
ALTER TABLE card_programs 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_card_programs_is_deleted ON card_programs(is_deleted);

-- ============================================
-- SUSPENSION REASONS TABLE
-- ============================================
ALTER TABLE suspension_reasons 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_suspension_reasons_is_deleted ON suspension_reasons(is_deleted);

-- ============================================
-- DOMAIN MAPPINGS TABLE
-- ============================================
ALTER TABLE domain_mappings 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_domain_mappings_is_deleted ON domain_mappings(is_deleted);

-- ============================================
-- SIGNS (TABELA) TABLE
-- ============================================
ALTER TABLE signs 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_signs_is_deleted ON signs(is_deleted);
CREATE INDEX IF NOT EXISTS idx_signs_deleted_at ON signs(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================
-- EARNINGS (GELIR) TABLE
-- ============================================
ALTER TABLE earnings 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_earnings_is_deleted ON earnings(is_deleted);
CREATE INDEX IF NOT EXISTS idx_earnings_deleted_at ON earnings(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================
-- REVENUE MODELS TABLE (if exists)
-- ============================================
ALTER TABLE revenue_models 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_revenue_models_is_deleted ON revenue_models(is_deleted);

-- ============================================
-- CONTRACT TEMPLATES TABLE (if exists)
-- ============================================
ALTER TABLE contract_templates 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_contract_templates_is_deleted ON contract_templates(is_deleted);

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
DECLARE
    table_name TEXT;
    column_exists BOOLEAN;
BEGIN
    FOR table_name IN 
        SELECT unnest(ARRAY[
            'customers', 'bank_accounts', 'products', 'mcc_codes', 'banks',
            'epk_institutions', 'ok_institutions', 'sales_representatives',
            'job_titles', 'partnerships', 'sharings', 'card_programs',
            'suspension_reasons', 'domain_mappings', 'signs', 'earnings'
        ])
    LOOP
        -- Check if is_deleted column exists
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = table_name 
            AND column_name = 'is_deleted'
        ) INTO column_exists;
        
        IF column_exists THEN
            RAISE NOTICE '✅ Table % has is_deleted column', table_name;
        ELSE
            RAISE WARNING '❌ Table % is missing is_deleted column', table_name;
        END IF;
    END LOOP;
END $$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ SOFT DELETE MIGRATION COMPLETED';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'All tables now have:';
    RAISE NOTICE '  - is_deleted (BOOLEAN, default FALSE)';
    RAISE NOTICE '  - deleted_at (TIMESTAMPTZ, default NULL)';
    RAISE NOTICE '  - Indexes on is_deleted for performance';
    RAISE NOTICE '';
    RAISE NOTICE 'CRITICAL RULE: NO HARD DELETE';
    RAISE NOTICE 'Always use: UPDATE table SET is_deleted = true';
    RAISE NOTICE 'Never use: DELETE FROM table';
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
END $$;
