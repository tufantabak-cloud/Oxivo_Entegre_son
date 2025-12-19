-- ============================================================================
-- 🗑️ OXIVO-BOX SOFT DELETE COLUMNS - TÜM TABLOLARA EKLE
-- ============================================================================
-- Bu script tüm tablolara soft delete için gerekli kolonları ekler
-- 
-- ✅ is_deleted: BOOLEAN - Kayıt silinmiş mi?
-- ✅ deleted_at: TIMESTAMP - Ne zaman silinmiş?
-- ✅ deleted_by: TEXT - Kim silmiş? (opsiyonel)
-- ✅ restored_at: TIMESTAMP - Ne zaman geri getirilmiş?
-- ✅ restored_by: TEXT - Kim geri getirmiş? (opsiyonel)
--
-- KULLANIM: Supabase SQL Editor'da çalıştırın
-- ============================================================================

-- ============================================================================
-- 1. CUSTOMERS
-- ============================================================================
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS restored_by TEXT;

COMMENT ON COLUMN customers.is_deleted IS 'Soft delete flag - true if record is deleted';
COMMENT ON COLUMN customers.deleted_at IS 'Timestamp when record was soft deleted';

-- ============================================================================
-- 2. PRODUCTS
-- ============================================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 3. BANK_ACCOUNTS
-- ============================================================================
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 4. BANKS
-- ============================================================================
ALTER TABLE banks ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE banks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE banks ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE banks ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE banks ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 5. CARD_PROGRAMS
-- ============================================================================
ALTER TABLE card_programs ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE card_programs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE card_programs ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE card_programs ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE card_programs ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 6. MCC_CODES
-- ============================================================================
ALTER TABLE mcc_codes ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE mcc_codes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE mcc_codes ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE mcc_codes ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE mcc_codes ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 7. EPK_INSTITUTIONS
-- ============================================================================
ALTER TABLE epk_institutions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE epk_institutions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE epk_institutions ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE epk_institutions ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE epk_institutions ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 8. OK_INSTITUTIONS
-- ============================================================================
ALTER TABLE ok_institutions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE ok_institutions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE ok_institutions ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE ok_institutions ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE ok_institutions ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 9. PARTNERSHIPS
-- ============================================================================
ALTER TABLE partnerships ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE partnerships ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE partnerships ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE partnerships ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE partnerships ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 10. EARNINGS
-- ============================================================================
ALTER TABLE earnings ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE earnings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE earnings ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE earnings ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE earnings ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 11. SIGNS (TABELA)
-- ============================================================================
ALTER TABLE signs ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE signs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE signs ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE signs ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE signs ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 12. SHARINGS
-- ============================================================================
ALTER TABLE sharings ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE sharings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sharings ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE sharings ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sharings ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 13. SUSPENSION_REASONS
-- ============================================================================
ALTER TABLE suspension_reasons ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE suspension_reasons ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE suspension_reasons ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE suspension_reasons ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE suspension_reasons ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 14. SALES_REPRESENTATIVES
-- ============================================================================
ALTER TABLE sales_representatives ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE sales_representatives ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sales_representatives ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE sales_representatives ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sales_representatives ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 15. JOB_TITLES
-- ============================================================================
ALTER TABLE job_titles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE job_titles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE job_titles ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE job_titles ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE job_titles ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 16. CUSTOMER_DOCUMENTS
-- ============================================================================
ALTER TABLE customer_documents ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE customer_documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE customer_documents ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE customer_documents ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE customer_documents ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 17. DOMAIN_MAPPINGS
-- ============================================================================
ALTER TABLE domain_mappings ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE domain_mappings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE domain_mappings ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE domain_mappings ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE domain_mappings ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 18. CATEGORIES
-- ============================================================================
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 19. CONTRACT_AUDIT_LOGS
-- ============================================================================
ALTER TABLE contract_audit_logs ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE contract_audit_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contract_audit_logs ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE contract_audit_logs ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contract_audit_logs ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 20. CONTRACT_TEMPLATES
-- ============================================================================
ALTER TABLE contract_templates ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE contract_templates ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contract_templates ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE contract_templates ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contract_templates ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 21. CONTRACT_TRANSACTION_DOCUMENTS
-- ============================================================================
ALTER TABLE contract_transaction_documents ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE contract_transaction_documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contract_transaction_documents ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE contract_transaction_documents ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contract_transaction_documents ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 22. CONTRACT_TRANSACTIONS
-- ============================================================================
ALTER TABLE contract_transactions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE contract_transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contract_transactions ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE contract_transactions ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contract_transactions ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 23. EMAIL_TEMPLATES
-- ============================================================================
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 24. INCOME_RECORDS
-- ============================================================================
ALTER TABLE income_records ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE income_records ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE income_records ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE income_records ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE income_records ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 25. PETTY_CASH
-- ============================================================================
ALTER TABLE petty_cash ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE petty_cash ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE petty_cash ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE petty_cash ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE petty_cash ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 26. REVENUE_MODELS
-- ============================================================================
ALTER TABLE revenue_models ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE revenue_models ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE revenue_models ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE revenue_models ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE revenue_models ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 27. SMS_TEMPLATES
-- ============================================================================
ALTER TABLE sms_templates ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE sms_templates ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sms_templates ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE sms_templates ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sms_templates ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- 28. TRANSACTIONS
-- ============================================================================
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- ============================================================================
-- INDEXLER - Soft delete sorgularını hızlandırmak için
-- ============================================================================

-- is_deleted indexleri (tüm tablolar için)
CREATE INDEX IF NOT EXISTS idx_customers_is_deleted ON customers(is_deleted);
CREATE INDEX IF NOT EXISTS idx_products_is_deleted ON products(is_deleted);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_is_deleted ON bank_accounts(is_deleted);
CREATE INDEX IF NOT EXISTS idx_banks_is_deleted ON banks(is_deleted);
CREATE INDEX IF NOT EXISTS idx_card_programs_is_deleted ON card_programs(is_deleted);
CREATE INDEX IF NOT EXISTS idx_mcc_codes_is_deleted ON mcc_codes(is_deleted);
CREATE INDEX IF NOT EXISTS idx_epk_institutions_is_deleted ON epk_institutions(is_deleted);
CREATE INDEX IF NOT EXISTS idx_ok_institutions_is_deleted ON ok_institutions(is_deleted);
CREATE INDEX IF NOT EXISTS idx_partnerships_is_deleted ON partnerships(is_deleted);
CREATE INDEX IF NOT EXISTS idx_earnings_is_deleted ON earnings(is_deleted);
CREATE INDEX IF NOT EXISTS idx_signs_is_deleted ON signs(is_deleted);
CREATE INDEX IF NOT EXISTS idx_sharings_is_deleted ON sharings(is_deleted);
CREATE INDEX IF NOT EXISTS idx_suspension_reasons_is_deleted ON suspension_reasons(is_deleted);
CREATE INDEX IF NOT EXISTS idx_sales_representatives_is_deleted ON sales_representatives(is_deleted);
CREATE INDEX IF NOT EXISTS idx_job_titles_is_deleted ON job_titles(is_deleted);
CREATE INDEX IF NOT EXISTS idx_customer_documents_is_deleted ON customer_documents(is_deleted);
CREATE INDEX IF NOT EXISTS idx_domain_mappings_is_deleted ON domain_mappings(is_deleted);
CREATE INDEX IF NOT EXISTS idx_categories_is_deleted ON categories(is_deleted);
CREATE INDEX IF NOT EXISTS idx_contract_audit_logs_is_deleted ON contract_audit_logs(is_deleted);
CREATE INDEX IF NOT EXISTS idx_contract_templates_is_deleted ON contract_templates(is_deleted);
CREATE INDEX IF NOT EXISTS idx_contract_transaction_documents_is_deleted ON contract_transaction_documents(is_deleted);
CREATE INDEX IF NOT EXISTS idx_contract_transactions_is_deleted ON contract_transactions(is_deleted);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_deleted ON email_templates(is_deleted);
CREATE INDEX IF NOT EXISTS idx_income_records_is_deleted ON income_records(is_deleted);
CREATE INDEX IF NOT EXISTS idx_petty_cash_is_deleted ON petty_cash(is_deleted);
CREATE INDEX IF NOT EXISTS idx_revenue_models_is_deleted ON revenue_models(is_deleted);
CREATE INDEX IF NOT EXISTS idx_sms_templates_is_deleted ON sms_templates(is_deleted);
CREATE INDEX IF NOT EXISTS idx_transactions_is_deleted ON transactions(is_deleted);

-- deleted_at indexleri (silme tarihine göre sıralama için)
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bank_accounts_deleted_at ON bank_accounts(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_banks_deleted_at ON banks(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================================================
-- BAŞARI MESAJI
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ TÜM TABLOLARA SOFT DELETE KOLONLARI EKLENDİ!';
  RAISE NOTICE '✅ 28 tablo güncellendi';
  RAISE NOTICE '✅ is_deleted, deleted_at, deleted_by, restored_at, restored_by kolonları eklendi';
  RAISE NOTICE '✅ Performans indexleri oluşturuldu';
  RAISE NOTICE '';
  RAISE NOTICE '📌 ÖNEMLİ: Artık tüm API''ler soft delete kullanacak!';
  RAISE NOTICE '📌 Hiçbir veri asla kalıcı olarak silinmeyecek!';
END $$;
