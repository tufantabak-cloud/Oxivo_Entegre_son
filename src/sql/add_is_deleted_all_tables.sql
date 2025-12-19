-- ========================================
-- TÜM TABLOLARA IS_DELETED SÜTUNU EKLE
-- ========================================
-- Soft delete için is_deleted sütunu ekler
-- Default: false (silinmemiş)

-- 1. CUSTOMERS
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 2. PRODUCTS  
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 3. BANK_ACCOUNTS
ALTER TABLE bank_accounts 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 4. SIGNS (TABELA)
ALTER TABLE signs 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 5. MCC_CODES
ALTER TABLE mcc_codes 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 6. BANKS
ALTER TABLE banks 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 7. EPK_INSTITUTIONS
ALTER TABLE epk_institutions 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 8. OK_INSTITUTIONS
ALTER TABLE ok_institutions 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 9. SALES_REPRESENTATIVES
ALTER TABLE sales_representatives 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 10. JOB_TITLES
ALTER TABLE job_titles 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 11. PARTNERSHIPS
ALTER TABLE partnerships 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 12. SHARINGS
ALTER TABLE sharings 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 13. CARD_PROGRAMS
ALTER TABLE card_programs 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 14. SUSPENSION_REASONS
ALTER TABLE suspension_reasons 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 15. EARNINGS
ALTER TABLE earnings 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 16. DOMAIN_MAPPINGS
ALTER TABLE domain_mappings 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 17. ACCOUNT_ITEMS
ALTER TABLE account_items 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 18. FIXED_COMMISSIONS
ALTER TABLE fixed_commissions 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 19. ADDITIONAL_REVENUES
ALTER TABLE additional_revenues 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- ========================================
-- KONTROL: Eklenen sütunları doğrula
-- ========================================
SELECT 
    table_name,
    column_name,
    data_type,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND column_name = 'is_deleted'
ORDER BY 
    table_name;
