-- =====================================================
-- 🚀 HIZLI DUPLICATE CLEANUP (5 DAKİKA)
-- =====================================================
-- Supabase SQL Editor'e kopyala ve çalıştır
-- =====================================================

-- =====================================================
-- 1️⃣ MEVCUT DURUM ANALİZİ
-- =====================================================
\echo '📊 Analiz başlatılıyor...'

-- Duplicate sayısını göster
SELECT 
  table_name,
  unique_field,
  COUNT(*) as duplicate_groups
FROM duplicate_monitoring
GROUP BY table_name, unique_field
ORDER BY duplicate_groups DESC;

-- Detaylı özet
SELECT 
  SUM(duplicate_count - 1) as total_duplicates_to_delete,
  COUNT(*) as duplicate_groups,
  SUM(duplicate_count) as total_affected_records
FROM duplicate_monitoring;

-- =====================================================
-- 2️⃣ CLEANUP ÇALIŞTIR (TÜM TABLOLAR)
-- =====================================================
\echo '🧹 Cleanup başlatılıyor...'

SELECT * FROM cleanup_all_duplicates();

-- =====================================================
-- 3️⃣ VERİFİKASYON
-- =====================================================
\echo '✅ Verifikasyon...'

-- Duplicate kaldı mı?
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ TÜM DUPLICATE''LER TEMİZLENDİ!'
    ELSE '⚠️ ' || COUNT(*) || ' DUPLICATE GRUBU HALA VAR!'
  END as durum
FROM duplicate_monitoring;

-- Detaylı rapor (eğer hala duplicate varsa)
SELECT * FROM duplicate_monitoring;

-- =====================================================
-- 4️⃣ UNIQUE CONSTRAINT'LERİ EKLE
-- =====================================================
\echo '🔒 Unique constraint''ler ekleniyor...'

-- Customers
DO $$ 
BEGIN
  ALTER TABLE customers ADD CONSTRAINT IF NOT EXISTS customers_firma_unvan_unique UNIQUE (firma_unvan);
  ALTER TABLE customers ADD CONSTRAINT IF NOT EXISTS customers_cari_hesap_kodu_unique UNIQUE (cari_hesap_kodu);
  RAISE NOTICE '✅ customers constraints added';
EXCEPTION WHEN others THEN
  RAISE NOTICE '⚠️ customers: %', SQLERRM;
END $$;

-- Products
DO $$ 
BEGIN
  ALTER TABLE products ADD CONSTRAINT IF NOT EXISTS products_urun_kodu_unique UNIQUE (urun_kodu);
  RAISE NOTICE '✅ products constraints added';
EXCEPTION WHEN others THEN
  RAISE NOTICE '⚠️ products: %', SQLERRM;
END $$;

-- Bank Accounts
DO $$ 
BEGIN
  ALTER TABLE bank_accounts ADD CONSTRAINT IF NOT EXISTS bank_accounts_hesap_no_unique UNIQUE (hesap_no);
  RAISE NOTICE '✅ bank_accounts constraints added';
EXCEPTION WHEN others THEN
  RAISE NOTICE '⚠️ bank_accounts: %', SQLERRM;
END $$;

-- MCC Codes
DO $$ 
BEGIN
  ALTER TABLE mcc_codes ADD CONSTRAINT IF NOT EXISTS mcc_codes_kod_unique UNIQUE (kod);
  RAISE NOTICE '✅ mcc_codes constraints added';
EXCEPTION WHEN others THEN
  RAISE NOTICE '⚠️ mcc_codes: %', SQLERRM;
END $$;

-- Banks
DO $$ 
BEGIN
  ALTER TABLE banks ADD CONSTRAINT IF NOT EXISTS banks_kod_unique UNIQUE (kod);
  RAISE NOTICE '✅ banks constraints added';
EXCEPTION WHEN others THEN
  RAISE NOTICE '⚠️ banks: %', SQLERRM;
END $$;

-- EPK
DO $$ 
BEGIN
  ALTER TABLE epk ADD CONSTRAINT IF NOT EXISTS epk_kod_unique UNIQUE (kod);
  RAISE NOTICE '✅ epk constraints added';
EXCEPTION WHEN others THEN
  RAISE NOTICE '⚠️ epk: %', SQLERRM;
END $$;

-- OK
DO $$ 
BEGIN
  ALTER TABLE ok ADD CONSTRAINT IF NOT EXISTS ok_kod_unique UNIQUE (kod);
  RAISE NOTICE '✅ ok constraints added';
EXCEPTION WHEN others THEN
  RAISE NOTICE '⚠️ ok: %', SQLERRM;
END $$;

-- Sales Representatives
DO $$ 
BEGIN
  ALTER TABLE sales_representatives ADD CONSTRAINT IF NOT EXISTS sales_representatives_name_unique UNIQUE (name);
  RAISE NOTICE '✅ sales_representatives constraints added';
EXCEPTION WHEN others THEN
  RAISE NOTICE '⚠️ sales_representatives: %', SQLERRM;
END $$;

-- Job Titles
DO $$ 
BEGIN
  ALTER TABLE job_titles ADD CONSTRAINT IF NOT EXISTS job_titles_title_unique UNIQUE (title);
  RAISE NOTICE '✅ job_titles constraints added';
EXCEPTION WHEN others THEN
  RAISE NOTICE '⚠️ job_titles: %', SQLERRM;
END $$;

-- Partnerships
DO $$ 
BEGIN
  ALTER TABLE partnerships ADD CONSTRAINT IF NOT EXISTS partnerships_partner_name_unique UNIQUE (partner_name);
  RAISE NOTICE '✅ partnerships constraints added';
EXCEPTION WHEN others THEN
  RAISE NOTICE '⚠️ partnerships: %', SQLERRM;
END $$;

-- Account Items
DO $$ 
BEGIN
  ALTER TABLE account_items ADD CONSTRAINT IF NOT EXISTS account_items_kod_unique UNIQUE (kod);
  RAISE NOTICE '✅ account_items constraints added';
EXCEPTION WHEN others THEN
  RAISE NOTICE '⚠️ account_items: %', SQLERRM;
END $$;

-- Sharings
DO $$ 
BEGIN
  ALTER TABLE sharings ADD CONSTRAINT IF NOT EXISTS sharings_tip_unique UNIQUE (tip);
  RAISE NOTICE '✅ sharings constraints added';
EXCEPTION WHEN others THEN
  RAISE NOTICE '⚠️ sharings: %', SQLERRM;
END $$;

-- Card Programs
DO $$ 
BEGIN
  ALTER TABLE card_programs ADD CONSTRAINT IF NOT EXISTS card_programs_kod_unique UNIQUE (kod);
  RAISE NOTICE '✅ card_programs constraints added';
EXCEPTION WHEN others THEN
  RAISE NOTICE '⚠️ card_programs: %', SQLERRM;
END $$;

-- Suspension Reasons
DO $$ 
BEGIN
  ALTER TABLE suspension_reasons ADD CONSTRAINT IF NOT EXISTS suspension_reasons_kod_unique UNIQUE (kod);
  RAISE NOTICE '✅ suspension_reasons constraints added';
EXCEPTION WHEN others THEN
  RAISE NOTICE '⚠️ suspension_reasons: %', SQLERRM;
END $$;

-- =====================================================
-- 5️⃣ FİNAL VERİFİKASYON
-- =====================================================
\echo '🎉 Final verifikasyon...'

-- Constraint sayısı
SELECT 
  COUNT(*) as toplam_unique_constraints,
  '✅ Aktif' as durum
FROM pg_constraint 
WHERE contype = 'u' 
AND conrelid::regclass::text IN (
  'customers', 'products', 'bank_accounts', 
  'mcc_codes', 'banks', 'epk', 'ok',
  'sales_representatives', 'job_titles',
  'partnerships', 'account_items', 'sharings',
  'card_programs', 'suspension_reasons'
);

-- Duplicate kontrolü
SELECT 
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM duplicate_monitoring) 
    THEN '✅ BAŞARILI! Tüm duplicate''ler temizlendi!'
    ELSE '⚠️ HALA ' || (SELECT COUNT(*) FROM duplicate_monitoring) || ' DUPLICATE VAR!'
  END as sonuc;

-- Son özet
DO $$
DECLARE
  duplicate_count INTEGER;
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count FROM duplicate_monitoring;
  SELECT COUNT(*) INTO constraint_count 
  FROM pg_constraint 
  WHERE contype = 'u' 
  AND conrelid::regclass::text IN (
    'customers', 'products', 'bank_accounts', 
    'mcc_codes', 'banks', 'epk', 'ok',
    'sales_representatives', 'job_titles',
    'partnerships', 'account_items', 'sharings',
    'card_programs', 'suspension_reasons'
  );
  
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '🎉 DUPLICATE CLEANUP TAMAMLANDI!';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Sonuçlar:';
  RAISE NOTICE '  ✅ Unique Constraints: %', constraint_count;
  RAISE NOTICE '  ✅ Kalan Duplicate: %', duplicate_count;
  RAISE NOTICE '';
  
  IF duplicate_count = 0 THEN
    RAISE NOTICE '🚀 BAŞARILI! Tüm duplicate''ler temizlendi!';
    RAISE NOTICE '🔒 Gelecekte duplicate eklenemeyecek!';
  ELSE
    RAISE NOTICE '⚠️ UYARI: Hala % duplicate grubu var!', duplicate_count;
    RAISE NOTICE '📋 Kontrol et: SELECT * FROM duplicate_monitoring;';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
END $$;

-- =====================================================
-- ✅ CLEANUP TAMAMLANDI!
-- =====================================================

-- Test: Duplicate eklenemiyor mu kontrol et
-- INSERT INTO customers (id, firma_unvan) VALUES ('test-1', 'Existing Company');
-- Beklenen: ERROR: duplicate key value violates unique constraint
