-- ============================================
-- DETAYLI TUTARSIZLIK ANALİZİ
-- ============================================
-- Hangi sütunlar FAZLA, hangileri EKSİK?
-- ============================================

-- 1️⃣ BANK_ACCOUNTS - 26 sütun (Beklenen: ~15)
SELECT 
  '🔍 BANK_ACCOUNTS' as "Tablo",
  column_name as "Sütun Adı",
  data_type as "Tip",
  is_nullable as "Nullable",
  column_default as "Varsayılan"
FROM information_schema.columns
WHERE table_name = 'bank_accounts' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2️⃣ CUSTOMERS - 40 sütun (Beklenen: ~18)
SELECT 
  '🔍 CUSTOMERS' as "Tablo",
  column_name as "Sütun Adı",
  data_type as "Tip",
  is_nullable as "Nullable",
  column_default as "Varsayılan"
FROM information_schema.columns
WHERE table_name = 'customers' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3️⃣ DOMAIN_MAPPINGS - 28 sütun (Beklenen: ~5)
SELECT 
  '🔍 DOMAIN_MAPPINGS' as "Tablo",
  column_name as "Sütun Adı",
  data_type as "Tip",
  is_nullable as "Nullable",
  column_default as "Varsayılan"
FROM information_schema.columns
WHERE table_name = 'domain_mappings' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4️⃣ EARNINGS - 29 sütun (Beklenen: ~10)
SELECT 
  '🔍 EARNINGS' as "Tablo",
  column_name as "Sütun Adı",
  data_type as "Tip",
  is_nullable as "Nullable",
  column_default as "Varsayılan"
FROM information_schema.columns
WHERE table_name = 'earnings' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5️⃣ YENİ TABLOLARIN YAPISI
SELECT 
  '🆕 YENİ TABLOLAR' as "Kategori",
  table_name as "Tablo",
  column_name as "Sütun",
  data_type as "Tip"
FROM information_schema.columns
WHERE table_name IN (
  'categories',
  'contract_audit_logs',
  'contract_templates',
  'contract_transaction_documents',
  'contract_transactions',
  'customer_documents',
  'email_templates',
  'income_records',
  'petty_cash',
  'revenue_models',
  'sms_templates',
  'transactions'
)
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 6️⃣ İSİM FARKLILIKLARI
SELECT 
  '⚠️ İSİM FARKLILIKLARI' as "Kategori",
  'card_programs' as "Gerçek İsim",
  'kart_programlar' as "Beklenen İsim",
  'İngilizce isim kullanılmış' as "Not"
UNION ALL
SELECT 
  '⚠️ İSİM FARKLILIKLARI',
  'sharings',
  'sharing',
  'Çoğul isim kullanılmış';
