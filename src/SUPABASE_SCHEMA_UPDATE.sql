-- ========================================
-- SUPABASE SCHEMA UPDATE - ALTER EXISTING TABLES
-- ========================================
-- Bu SQL, mevcut tabloları DROP etmeden eksik kolonları ekler
-- ✅ Veri kaybı olmadan schema güncelleme

-- ========================================
-- 1. MCC_CODES - Eksik kolonları ekle
-- ========================================

-- olusturma_tarihi kolonu yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mcc_codes' AND column_name = 'olusturma_tarihi'
    ) THEN
        ALTER TABLE mcc_codes ADD COLUMN olusturma_tarihi TEXT;
        RAISE NOTICE 'Added olusturma_tarihi to mcc_codes';
    END IF;
END $$;

-- aciklama kolonu yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mcc_codes' AND column_name = 'aciklama'
    ) THEN
        ALTER TABLE mcc_codes ADD COLUMN aciklama TEXT;
        RAISE NOTICE 'Added aciklama to mcc_codes';
    END IF;
END $$;

-- ========================================
-- 2. BANKS - Eksik kolonları ekle
-- ========================================

-- aciklama kolonu yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'banks' AND column_name = 'aciklama'
    ) THEN
        ALTER TABLE banks ADD COLUMN aciklama TEXT;
        RAISE NOTICE 'Added aciklama to banks';
    END IF;
END $$;

-- olusturma_tarihi kolonu yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'banks' AND column_name = 'olusturma_tarihi'
    ) THEN
        ALTER TABLE banks ADD COLUMN olusturma_tarihi TEXT;
        RAISE NOTICE 'Added olusturma_tarihi to banks';
    END IF;
END $$;

-- ========================================
-- 3. EPK_INSTITUTIONS - Eksik kolonları ekle
-- ========================================

-- aciklama kolonu yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'epk_institutions' AND column_name = 'aciklama'
    ) THEN
        ALTER TABLE epk_institutions ADD COLUMN aciklama TEXT;
        RAISE NOTICE 'Added aciklama to epk_institutions';
    END IF;
END $$;

-- olusturma_tarihi kolonu yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'epk_institutions' AND column_name = 'olusturma_tarihi'
    ) THEN
        ALTER TABLE epk_institutions ADD COLUMN olusturma_tarihi TEXT;
        RAISE NOTICE 'Added olusturma_tarihi to epk_institutions';
    END IF;
END $$;

-- ========================================
-- 4. OK_INSTITUTIONS - Eksik kolonları ekle
-- ========================================

-- aciklama kolonu yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ok_institutions' AND column_name = 'aciklama'
    ) THEN
        ALTER TABLE ok_institutions ADD COLUMN aciklama TEXT;
        RAISE NOTICE 'Added aciklama to ok_institutions';
    END IF;
END $$;

-- olusturma_tarihi kolonu yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ok_institutions' AND column_name = 'olusturma_tarihi'
    ) THEN
        ALTER TABLE ok_institutions ADD COLUMN olusturma_tarihi TEXT;
        RAISE NOTICE 'Added olusturma_tarihi to ok_institutions';
    END IF;
END $$;

-- ========================================
-- 5. SALES_REPRESENTATIVES - Eksik kolonları ekle
-- ========================================

-- departman kolonu yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_representatives' AND column_name = 'departman'
    ) THEN
        ALTER TABLE sales_representatives ADD COLUMN departman TEXT;
        RAISE NOTICE 'Added departman to sales_representatives';
    END IF;
END $$;

-- bolge kolonu yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_representatives' AND column_name = 'bolge'
    ) THEN
        ALTER TABLE sales_representatives ADD COLUMN bolge TEXT;
        RAISE NOTICE 'Added bolge to sales_representatives';
    END IF;
END $$;

-- notlar kolonu yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_representatives' AND column_name = 'notlar'
    ) THEN
        ALTER TABLE sales_representatives ADD COLUMN notlar TEXT;
        RAISE NOTICE 'Added notlar to sales_representatives';
    END IF;
END $$;

-- ad_soyad kolonu yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_representatives' AND column_name = 'ad_soyad'
    ) THEN
        ALTER TABLE sales_representatives ADD COLUMN ad_soyad TEXT;
        RAISE NOTICE 'Added ad_soyad to sales_representatives';
    END IF;
END $$;

-- olusturma_tarihi kolonu yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_representatives' AND column_name = 'olusturma_tarihi'
    ) THEN
        ALTER TABLE sales_representatives ADD COLUMN olusturma_tarihi TEXT;
        RAISE NOTICE 'Added olusturma_tarihi to sales_representatives';
    END IF;
END $$;

-- ========================================
-- 6. JOB_TITLES - Eksik kolonları ekle
-- ========================================

-- olusturma_tarihi kolonu yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_titles' AND column_name = 'olusturma_tarihi'
    ) THEN
        ALTER TABLE job_titles ADD COLUMN olusturma_tarihi TEXT;
        RAISE NOTICE 'Added olusturma_tarihi to job_titles';
    END IF;
END $$;

-- aciklama kolonu yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_titles' AND column_name = 'aciklama'
    ) THEN
        ALTER TABLE job_titles ADD COLUMN aciklama TEXT;
        RAISE NOTICE 'Added aciklama to job_titles';
    END IF;
END $$;

-- ========================================
-- 7. PARTNERSHIPS - Eksik kolonları ekle
-- ========================================

-- aciklama kolonu yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'partnerships' AND column_name = 'aciklama'
    ) THEN
        ALTER TABLE partnerships ADD COLUMN aciklama TEXT;
        RAISE NOTICE 'Added aciklama to partnerships';
    END IF;
END $$;

-- olusturma_tarihi kolonu yoksa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'partnerships' AND column_name = 'olusturma_tarihi'
    ) THEN
        ALTER TABLE partnerships ADD COLUMN olusturma_tarihi TEXT;
        RAISE NOTICE 'Added olusturma_tarihi to partnerships';
    END IF;
END $$;

-- ========================================
-- ✅ TAMAMLANDI!
-- ========================================
-- Artık tüm tablolar eksik kolonlara sahip!
-- Mevcut veriler korundu, sadece yeni kolonlar eklendi!
