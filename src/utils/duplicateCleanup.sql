-- ========================================
-- DUPLICATE CLEANUP & PREVENTION SCRIPT
-- ========================================
-- Bu script Supabase tablolarındaki duplicate verileri temizler
-- Supabase Dashboard → SQL Editor'a kopyalayıp çalıştırın
-- 
-- UYARI: Script önce rapor verir, sonra temizler
-- Her bölümü dikkatle gözden geçirin!
-- ========================================

-- ========================================
-- 1. DUPLICATE DETECTION (RAPOR)
-- ========================================

-- 1A. CUSTOMERS tablosu - ID bazlı duplicate'ler
SELECT 'CUSTOMERS - ID Duplicates' as table_name, id, COUNT(*) as duplicate_count
FROM customers
GROUP BY id
HAVING COUNT(*) > 1;

-- 1B. PRODUCTS tablosu - ID bazlı duplicate'ler
SELECT 'PRODUCTS - ID Duplicates' as table_name, id, COUNT(*) as duplicate_count
FROM products
GROUP BY id
HAVING COUNT(*) > 1;

-- 1C. BANK_ACCOUNTS tablosu - ID bazlı duplicate'ler
SELECT 'BANK_ACCOUNTS - ID Duplicates' as table_name, id, COUNT(*) as duplicate_count
FROM bank_accounts
GROUP BY id
HAVING COUNT(*) > 1;

-- 1D. MCC_CODES tablosu - Kod bazlı duplicate'ler
SELECT 'MCC_CODES - Kod Duplicates' as table_name, kod, COUNT(*) as duplicate_count
FROM mcc_codes
GROUP BY kod
HAVING COUNT(*) > 1;

-- 1E. BANKS tablosu - Kod bazlı duplicate'ler
SELECT 'BANKS - Kod Duplicates' as table_name, kod, COUNT(*) as duplicate_count
FROM banks
GROUP BY kod
HAVING COUNT(*) > 1;

-- 1F. EPK_INSTITUTIONS tablosu - Kod bazlı duplicate'ler
SELECT 'EPK_INSTITUTIONS - Kod Duplicates' as table_name, kod, COUNT(*) as duplicate_count
FROM epk_institutions
GROUP BY kod
HAVING COUNT(*) > 1;

-- 1G. OK_INSTITUTIONS tablosu - Kod bazlı duplicate'ler
SELECT 'OK_INSTITUTIONS - Kod Duplicates' as table_name, kod, COUNT(*) as duplicate_count
FROM ok_institutions
GROUP BY kod
HAVING COUNT(*) > 1;

-- 1H. SALES_REPRESENTATIVES tablosu - Ad Soyad bazlı duplicate'ler
SELECT 'SALES_REPRESENTATIVES - Name Duplicates' as table_name, ad_soyad, COUNT(*) as duplicate_count
FROM sales_representatives
GROUP BY ad_soyad
HAVING COUNT(*) > 1;

-- 1I. JOB_TITLES tablosu - Görev bazlı duplicate'ler
SELECT 'JOB_TITLES - Title Duplicates' as table_name, gorev, COUNT(*) as duplicate_count
FROM job_titles
GROUP BY gorev
HAVING COUNT(*) > 1;

-- 1J. PARTNERSHIPS tablosu - Ad bazlı duplicate'ler
SELECT 'PARTNERSHIPS - Name Duplicates' as table_name, ortaklik_adi, COUNT(*) as duplicate_count
FROM partnerships
GROUP BY ortaklik_adi
HAVING COUNT(*) > 1;

-- 1K. ACCOUNT_ITEMS tablosu - Ad bazlı duplicate'ler
SELECT 'ACCOUNT_ITEMS - Name Duplicates' as table_name, kalem_adi, COUNT(*) as duplicate_count
FROM account_items
GROUP BY kalem_adi
HAVING COUNT(*) > 1;

-- 1L. FIXED_COMMISSIONS tablosu - Ad bazlı duplicate'ler
SELECT 'FIXED_COMMISSIONS - Name Duplicates' as table_name, komisyon_adi, COUNT(*) as duplicate_count
FROM fixed_commissions
GROUP BY komisyon_adi
HAVING COUNT(*) > 1;

-- 1M. ADDITIONAL_REVENUES tablosu - Ad bazlı duplicate'ler
SELECT 'ADDITIONAL_REVENUES - Name Duplicates' as table_name, gelir_adi, COUNT(*) as duplicate_count
FROM additional_revenues
GROUP BY gelir_adi
HAVING COUNT(*) > 1;

-- 1N. SHARINGS tablosu - Ad bazlı duplicate'ler
SELECT 'SHARINGS - Name Duplicates' as table_name, paylasim_adi, COUNT(*) as duplicate_count
FROM sharings
GROUP BY paylasim_adi
HAVING COUNT(*) > 1;

-- 1O. KART_PROGRAMS tablosu - Ad bazlı duplicate'ler
SELECT 'KART_PROGRAMS - Name Duplicates' as table_name, program_adi, COUNT(*) as duplicate_count
FROM kart_programs
GROUP BY program_adi
HAVING COUNT(*) > 1;

-- 1P. SUSPENSION_REASONS tablosu - Sebep bazlı duplicate'ler
SELECT 'SUSPENSION_REASONS - Reason Duplicates' as table_name, sebep, COUNT(*) as duplicate_count
FROM suspension_reasons
GROUP BY sebep
HAVING COUNT(*) > 1;

-- ========================================
-- 2. DUPLICATE CLEANUP (TEMİZLİK)
-- ========================================
-- UYARI: Aşağıdaki komutlar duplicate'leri SİLER!
-- Her bir tablodan en son oluşturulan kaydı koruyup
-- eski duplicate'leri siler
-- ========================================

-- 2A. CUSTOMERS - ID bazlı temizlik
WITH duplicates AS (
  SELECT id, 
         ctid,
         ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at DESC, ctid DESC) as rn
  FROM customers
)
DELETE FROM customers
WHERE ctid IN (
  SELECT ctid FROM duplicates WHERE rn > 1
);

-- 2B. PRODUCTS - ID bazlı temizlik
WITH duplicates AS (
  SELECT id, 
         ctid,
         ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at DESC, ctid DESC) as rn
  FROM products
)
DELETE FROM products
WHERE ctid IN (
  SELECT ctid FROM duplicates WHERE rn > 1
);

-- 2C. BANK_ACCOUNTS - ID bazlı temizlik
WITH duplicates AS (
  SELECT id, 
         ctid,
         ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at DESC, ctid DESC) as rn
  FROM bank_accounts
)
DELETE FROM bank_accounts
WHERE ctid IN (
  SELECT ctid FROM duplicates WHERE rn > 1
);

-- 2D. MCC_CODES - Kod bazlı temizlik
WITH duplicates AS (
  SELECT kod,
         ctid,
         ROW_NUMBER() OVER (PARTITION BY kod ORDER BY created_at DESC, ctid DESC) as rn
  FROM mcc_codes
)
DELETE FROM mcc_codes
WHERE ctid IN (
  SELECT ctid FROM duplicates WHERE rn > 1
);

-- 2E. BANKS - Kod bazlı temizlik
WITH duplicates AS (
  SELECT kod,
         ctid,
         ROW_NUMBER() OVER (PARTITION BY kod ORDER BY created_at DESC, ctid DESC) as rn
  FROM banks
)
DELETE FROM banks
WHERE ctid IN (
  SELECT ctid FROM duplicates WHERE rn > 1
);

-- 2F. EPK_INSTITUTIONS - Kod bazlı temizlik
WITH duplicates AS (
  SELECT kod,
         ctid,
         ROW_NUMBER() OVER (PARTITION BY kod ORDER BY created_at DESC, ctid DESC) as rn
  FROM epk_institutions
)
DELETE FROM epk_institutions
WHERE ctid IN (
  SELECT ctid FROM duplicates WHERE rn > 1
);

-- 2G. OK_INSTITUTIONS - Kod bazlı temizlik
WITH duplicates AS (
  SELECT kod,
         ctid,
         ROW_NUMBER() OVER (PARTITION BY kod ORDER BY created_at DESC, ctid DESC) as rn
  FROM ok_institutions
)
DELETE FROM ok_institutions
WHERE ctid IN (
  SELECT ctid FROM duplicates WHERE rn > 1
);

-- 2H. SALES_REPRESENTATIVES - Ad Soyad bazlı temizlik
WITH duplicates AS (
  SELECT ad_soyad,
         ctid,
         ROW_NUMBER() OVER (PARTITION BY ad_soyad ORDER BY created_at DESC, ctid DESC) as rn
  FROM sales_representatives
)
DELETE FROM sales_representatives
WHERE ctid IN (
  SELECT ctid FROM duplicates WHERE rn > 1
);

-- 2I. JOB_TITLES - Görev bazlı temizlik
WITH duplicates AS (
  SELECT gorev,
         ctid,
         ROW_NUMBER() OVER (PARTITION BY gorev ORDER BY created_at DESC, ctid DESC) as rn
  FROM job_titles
)
DELETE FROM job_titles
WHERE ctid IN (
  SELECT ctid FROM duplicates WHERE rn > 1
);

-- 2J. PARTNERSHIPS - Ad bazlı temizlik
WITH duplicates AS (
  SELECT ortaklik_adi,
         ctid,
         ROW_NUMBER() OVER (PARTITION BY ortaklik_adi ORDER BY created_at DESC, ctid DESC) as rn
  FROM partnerships
)
DELETE FROM partnerships
WHERE ctid IN (
  SELECT ctid FROM duplicates WHERE rn > 1
);

-- 2K. ACCOUNT_ITEMS - Ad bazlı temizlik
WITH duplicates AS (
  SELECT kalem_adi,
         ctid,
         ROW_NUMBER() OVER (PARTITION BY kalem_adi ORDER BY created_at DESC, ctid DESC) as rn
  FROM account_items
)
DELETE FROM account_items
WHERE ctid IN (
  SELECT ctid FROM duplicates WHERE rn > 1
);

-- 2L. FIXED_COMMISSIONS - Ad bazlı temizlik
WITH duplicates AS (
  SELECT komisyon_adi,
         ctid,
         ROW_NUMBER() OVER (PARTITION BY komisyon_adi ORDER BY created_at DESC, ctid DESC) as rn
  FROM fixed_commissions
)
DELETE FROM fixed_commissions
WHERE ctid IN (
  SELECT ctid FROM duplicates WHERE rn > 1
);

-- 2M. ADDITIONAL_REVENUES - Ad bazlı temizlik
WITH duplicates AS (
  SELECT gelir_adi,
         ctid,
         ROW_NUMBER() OVER (PARTITION BY gelir_adi ORDER BY created_at DESC, ctid DESC) as rn
  FROM additional_revenues
)
DELETE FROM additional_revenues
WHERE ctid IN (
  SELECT ctid FROM duplicates WHERE rn > 1
);

-- 2N. SHARINGS - Ad bazlı temizlik
WITH duplicates AS (
  SELECT paylasim_adi,
         ctid,
         ROW_NUMBER() OVER (PARTITION BY paylasim_adi ORDER BY created_at DESC, ctid DESC) as rn
  FROM sharings
)
DELETE FROM sharings
WHERE ctid IN (
  SELECT ctid FROM duplicates WHERE rn > 1
);

-- 2O. KART_PROGRAMS - Ad bazlı temizlik
WITH duplicates AS (
  SELECT program_adi,
         ctid,
         ROW_NUMBER() OVER (PARTITION BY program_adi ORDER BY created_at DESC, ctid DESC) as rn
  FROM kart_programs
)
DELETE FROM kart_programs
WHERE ctid IN (
  SELECT ctid FROM duplicates WHERE rn > 1
);

-- 2P. SUSPENSION_REASONS - Sebep bazlı temizlik
WITH duplicates AS (
  SELECT sebep,
         ctid,
         ROW_NUMBER() OVER (PARTITION BY sebep ORDER BY created_at DESC, ctid DESC) as rn
  FROM suspension_reasons
)
DELETE FROM suspension_reasons
WHERE ctid IN (
  SELECT ctid FROM duplicates WHERE rn > 1
);

-- ========================================
-- 3. UNIQUE CONSTRAINTS (ÖNLEME)
-- ========================================
-- Bu constraintler duplicate oluşmasını engeller
-- ========================================

-- ⚠️ NOT: ID kolonları zaten PRIMARY KEY olduğu için
-- unique constraint eklemiyoruz (zaten vardır)

-- 3A. MCC_CODES - kod unique constraint (zaten var mı kontrol et)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'mcc_codes_kod_unique'
  ) THEN
    ALTER TABLE mcc_codes ADD CONSTRAINT mcc_codes_kod_unique UNIQUE (kod);
  END IF;
END $$;

-- 3B. BANKS - kod unique constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'banks_kod_unique'
  ) THEN
    ALTER TABLE banks ADD CONSTRAINT banks_kod_unique UNIQUE (kod);
  END IF;
END $$;

-- 3C. EPK_INSTITUTIONS - kod unique constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'epk_institutions_kod_unique'
  ) THEN
    ALTER TABLE epk_institutions ADD CONSTRAINT epk_institutions_kod_unique UNIQUE (kod);
  END IF;
END $$;

-- 3D. OK_INSTITUTIONS - kod unique constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ok_institutions_kod_unique'
  ) THEN
    ALTER TABLE ok_institutions ADD CONSTRAINT ok_institutions_kod_unique UNIQUE (kod);
  END IF;
END $$;

-- 3E. SALES_REPRESENTATIVES - ad_soyad unique constraint (opsiyonel)
-- NOT: Aynı isimde farklı satış temsilcileri olabilir, bu constraint'i dikkatli kullanın
-- İstenirse aşağıdaki kodu açın:
/*
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sales_representatives_ad_soyad_unique'
  ) THEN
    ALTER TABLE sales_representatives ADD CONSTRAINT sales_representatives_ad_soyad_unique UNIQUE (ad_soyad);
  END IF;
END $$;
*/

-- 3F. JOB_TITLES - gorev unique constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'job_titles_gorev_unique'
  ) THEN
    ALTER TABLE job_titles ADD CONSTRAINT job_titles_gorev_unique UNIQUE (gorev);
  END IF;
END $$;

-- 3G. PARTNERSHIPS - ortaklik_adi unique constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'partnerships_ortaklik_adi_unique'
  ) THEN
    ALTER TABLE partnerships ADD CONSTRAINT partnerships_ortaklik_adi_unique UNIQUE (ortaklik_adi);
  END IF;
END $$;

-- 3H. ACCOUNT_ITEMS - kalem_adi unique constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'account_items_kalem_adi_unique'
  ) THEN
    ALTER TABLE account_items ADD CONSTRAINT account_items_kalem_adi_unique UNIQUE (kalem_adi);
  END IF;
END $$;

-- 3I. FIXED_COMMISSIONS - komisyon_adi unique constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fixed_commissions_komisyon_adi_unique'
  ) THEN
    ALTER TABLE fixed_commissions ADD CONSTRAINT fixed_commissions_komisyon_adi_unique UNIQUE (komisyon_adi);
  END IF;
END $$;

-- 3J. ADDITIONAL_REVENUES - gelir_adi unique constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'additional_revenues_gelir_adi_unique'
  ) THEN
    ALTER TABLE additional_revenues ADD CONSTRAINT additional_revenues_gelir_adi_unique UNIQUE (gelir_adi);
  END IF;
END $$;

-- 3K. SHARINGS - paylasim_adi unique constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sharings_paylasim_adi_unique'
  ) THEN
    ALTER TABLE sharings ADD CONSTRAINT sharings_paylasim_adi_unique UNIQUE (paylasim_adi);
  END IF;
END $$;

-- 3L. KART_PROGRAMS - program_adi unique constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'kart_programs_program_adi_unique'
  ) THEN
    ALTER TABLE kart_programs ADD CONSTRAINT kart_programs_program_adi_unique UNIQUE (program_adi);
  END IF;
END $$;

-- 3M. SUSPENSION_REASONS - sebep unique constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'suspension_reasons_sebep_unique'
  ) THEN
    ALTER TABLE suspension_reasons ADD CONSTRAINT suspension_reasons_sebep_unique UNIQUE (sebep);
  END IF;
END $$;

-- ========================================
-- 4. VERİFİKASYON (DOĞRULAMA)
-- ========================================
-- Temizlik sonrası kontrolü
-- ========================================

-- 4A. Tüm tablolarda duplicate kalmadığını doğrula
SELECT 
  'CUSTOMERS' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT id) as unique_ids,
  COUNT(*) - COUNT(DISTINCT id) as duplicate_count
FROM customers

UNION ALL

SELECT 
  'PRODUCTS',
  COUNT(*),
  COUNT(DISTINCT id),
  COUNT(*) - COUNT(DISTINCT id)
FROM products

UNION ALL

SELECT 
  'BANK_ACCOUNTS',
  COUNT(*),
  COUNT(DISTINCT id),
  COUNT(*) - COUNT(DISTINCT id)
FROM bank_accounts

UNION ALL

SELECT 
  'MCC_CODES',
  COUNT(*),
  COUNT(DISTINCT kod),
  COUNT(*) - COUNT(DISTINCT kod)
FROM mcc_codes

UNION ALL

SELECT 
  'BANKS',
  COUNT(*),
  COUNT(DISTINCT kod),
  COUNT(*) - COUNT(DISTINCT kod)
FROM banks

UNION ALL

SELECT 
  'EPK_INSTITUTIONS',
  COUNT(*),
  COUNT(DISTINCT kod),
  COUNT(*) - COUNT(DISTINCT kod)
FROM epk_institutions

UNION ALL

SELECT 
  'OK_INSTITUTIONS',
  COUNT(*),
  COUNT(DISTINCT kod),
  COUNT(*) - COUNT(DISTINCT kod)
FROM ok_institutions

UNION ALL

SELECT 
  'SALES_REPRESENTATIVES',
  COUNT(*),
  COUNT(DISTINCT ad_soyad),
  COUNT(*) - COUNT(DISTINCT ad_soyad)
FROM sales_representatives

UNION ALL

SELECT 
  'JOB_TITLES',
  COUNT(*),
  COUNT(DISTINCT gorev),
  COUNT(*) - COUNT(DISTINCT gorev)
FROM job_titles

UNION ALL

SELECT 
  'PARTNERSHIPS',
  COUNT(*),
  COUNT(DISTINCT ortaklik_adi),
  COUNT(*) - COUNT(DISTINCT ortaklik_adi)
FROM partnerships

UNION ALL

SELECT 
  'ACCOUNT_ITEMS',
  COUNT(*),
  COUNT(DISTINCT kalem_adi),
  COUNT(*) - COUNT(DISTINCT kalem_adi)
FROM account_items

UNION ALL

SELECT 
  'FIXED_COMMISSIONS',
  COUNT(*),
  COUNT(DISTINCT komisyon_adi),
  COUNT(*) - COUNT(DISTINCT komisyon_adi)
FROM fixed_commissions

UNION ALL

SELECT 
  'ADDITIONAL_REVENUES',
  COUNT(*),
  COUNT(DISTINCT gelir_adi),
  COUNT(*) - COUNT(DISTINCT gelir_adi)
FROM additional_revenues

UNION ALL

SELECT 
  'SHARINGS',
  COUNT(*),
  COUNT(DISTINCT paylasim_adi),
  COUNT(*) - COUNT(DISTINCT paylasim_adi)
FROM sharings

UNION ALL

SELECT 
  'KART_PROGRAMS',
  COUNT(*),
  COUNT(DISTINCT program_adi),
  COUNT(*) - COUNT(DISTINCT program_adi)
FROM kart_programs

UNION ALL

SELECT 
  'SUSPENSION_REASONS',
  COUNT(*),
  COUNT(DISTINCT sebep),
  COUNT(*) - COUNT(DISTINCT sebep)
FROM suspension_reasons;

-- ========================================
-- KULLANIM TALİMATLARI
-- ========================================
-- 
-- 1. ADIM: RAPOR OLUŞTUR
--    Bölüm 1'deki SELECT sorguları tek tek çalıştırın
--    Her tabloda kaç duplicate olduğunu görün
-- 
-- 2. ADIM: TEMİZLE
--    Bölüm 2'deki DELETE komutlarını çalıştırın
--    Her komut sadece ilgili tabloyu temizler
-- 
-- 3. ADIM: UNIQUE CONSTRAINT EKLE
--    Bölüm 3'teki ALTER TABLE komutlarını çalıştırın
--    Bu, gelecekte duplicate oluşmasını engeller
-- 
-- 4. ADIM: DOĞRULA
--    Bölüm 4'teki doğrulama sorgusunu çalıştırın
--    duplicate_count kolonunda hepsi 0 olmalı
-- 
-- ⚠️ DİKKAT:
-- - DELETE komutları geri alınamaz!
-- - Production'da çalıştırmadan önce mutlaka backup alın
-- - İlk olarak test ortamında deneyin
-- 
-- ========================================
