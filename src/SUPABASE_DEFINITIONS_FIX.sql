-- ========================================
-- SUPABASE DEFINITIONS TABLES FIX
-- ========================================
-- Bu SQL, frontend interface'leriyle TAM UYUMLU tablolar oluşturur
-- ❌ ÖNCE ESKİ TABLOLARI SİL
-- ✅ SONRA YENİ TABLOLARI OLUŞTUR

-- ========================================
-- 1. ESKİ TABLOLARI SİL (varsa)
-- ========================================

DROP TABLE IF EXISTS mcc_codes CASCADE;
DROP TABLE IF EXISTS banks CASCADE;
DROP TABLE IF EXISTS epk_list CASCADE;
DROP TABLE IF EXISTS epk_institutions CASCADE;
DROP TABLE IF EXISTS ok_list CASCADE;
DROP TABLE IF EXISTS ok_institutions CASCADE;
DROP TABLE IF EXISTS sales_representatives CASCADE;
DROP TABLE IF EXISTS job_titles CASCADE;
DROP TABLE IF EXISTS partnerships CASCADE;
DROP TABLE IF EXISTS account_items CASCADE;
DROP TABLE IF EXISTS fixed_commissions CASCADE;
DROP TABLE IF EXISTS additional_revenues CASCADE;

-- ========================================
-- 2. YENİ TABLOLARI OLUŞTUR (Frontend interface'leriyle uyumlu)
-- ========================================

-- MCC Codes (Frontend: MCC interface)
-- { id, kod, kategori, aciklama, aktif, olusturmaTarihi }
CREATE TABLE IF NOT EXISTS mcc_codes (
  id TEXT PRIMARY KEY,
  kod TEXT,
  kategori TEXT,
  aciklama TEXT,
  aktif BOOLEAN DEFAULT true,
  olusturma_tarihi TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Banks (Frontend: Bank interface)
-- { id, kod, bankaAdi, aciklama, aktif, olusturmaTarihi }
CREATE TABLE IF NOT EXISTS banks (
  id TEXT PRIMARY KEY,
  kod TEXT,
  banka_adi TEXT NOT NULL,
  aciklama TEXT,
  aktif BOOLEAN DEFAULT true,
  olusturma_tarihi TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EPK List (Frontend: EPK interface)
-- { id, kod, kurumAdi, aciklama, aktif, olusturmaTarihi }
CREATE TABLE IF NOT EXISTS epk_institutions (
  id TEXT PRIMARY KEY,
  kod TEXT,
  kurum_adi TEXT NOT NULL,
  aciklama TEXT,
  aktif BOOLEAN DEFAULT true,
  olusturma_tarihi TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OK List (Frontend: OK interface)
-- { id, kod, kurumAdi, aciklama, aktif, olusturmaTarihi }
CREATE TABLE IF NOT EXISTS ok_institutions (
  id TEXT PRIMARY KEY,
  kod TEXT,
  kurum_adi TEXT NOT NULL,
  aciklama TEXT,
  aktif BOOLEAN DEFAULT true,
  olusturma_tarihi TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales Representatives (Frontend: SalesRepresentative interface)
-- { id, adSoyad, email, telefon, departman, bolge, aktif, olusturmaTarihi, notlar }
CREATE TABLE IF NOT EXISTS sales_representatives (
  id TEXT PRIMARY KEY,
  ad_soyad TEXT,
  email TEXT,
  telefon TEXT,
  departman TEXT,
  bolge TEXT,
  aktif BOOLEAN DEFAULT true,
  olusturma_tarihi TEXT,
  notlar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Titles (Frontend: JobTitle interface)
-- { id, unvan, aciklama, aktif, olusturmaTarihi }
CREATE TABLE IF NOT EXISTS job_titles (
  id TEXT PRIMARY KEY,
  unvan TEXT NOT NULL,
  aciklama TEXT,
  aktif BOOLEAN DEFAULT true,
  olusturma_tarihi TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partnerships (Frontend: Partnership interface)
-- { id, firmaAdi, anlasmaTarihi, anlasmaTuru, aciklama, aktif, olusturmaTarihi }
CREATE TABLE IF NOT EXISTS partnerships (
  id TEXT PRIMARY KEY,
  firma_adi TEXT NOT NULL,
  anlasma_tarihi TEXT,
  anlasma_turu TEXT,
  aciklama TEXT,
  aktif BOOLEAN DEFAULT true,
  olusturma_tarihi TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Account Items (Frontend: HesapKalemi interface)
-- { id, kod, ad, kategori, formul, aciklama, aktif, olusturmaTarihi }
CREATE TABLE IF NOT EXISTS account_items (
  id TEXT PRIMARY KEY,
  kod TEXT,
  ad TEXT NOT NULL,
  kategori TEXT,
  formul TEXT,
  aciklama TEXT,
  aktif BOOLEAN DEFAULT true,
  olusturma_tarihi TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fixed Commissions (Frontend: SabitKomisyon interface)
-- { id, ad, oran, tutar, kategori, aciklama, aktif, olusturmaTarihi }
CREATE TABLE IF NOT EXISTS fixed_commissions (
  id TEXT PRIMARY KEY,
  ad TEXT NOT NULL,
  oran DECIMAL(10, 4),
  tutar DECIMAL(15, 2),
  kategori TEXT,
  aciklama TEXT,
  aktif BOOLEAN DEFAULT true,
  olusturma_tarihi TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Additional Revenues (Frontend: EkGelir interface)
-- { id, ad, tutar, kategori, hesaplamaYontemi, aciklama, aktif, olusturmaTarihi }
CREATE TABLE IF NOT EXISTS additional_revenues (
  id TEXT PRIMARY KEY,
  ad TEXT NOT NULL,
  tutar DECIMAL(15, 2),
  kategori TEXT,
  hesaplama_yontemi TEXT,
  aciklama TEXT,
  aktif BOOLEAN DEFAULT true,
  olusturma_tarihi TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. INDEXES (Performance için)
-- ========================================

CREATE INDEX IF NOT EXISTS mcc_codes_kod_idx ON mcc_codes(kod);
CREATE INDEX IF NOT EXISTS banks_kod_idx ON banks(kod);
CREATE INDEX IF NOT EXISTS epk_institutions_kod_idx ON epk_institutions(kod);
CREATE INDEX IF NOT EXISTS ok_institutions_kod_idx ON ok_institutions(kod);
CREATE INDEX IF NOT EXISTS sales_reps_email_idx ON sales_representatives(email);
CREATE INDEX IF NOT EXISTS job_titles_unvan_idx ON job_titles(unvan);
CREATE INDEX IF NOT EXISTS partnerships_firma_idx ON partnerships(firma_adi);
CREATE INDEX IF NOT EXISTS account_items_kod_idx ON account_items(kod);
CREATE INDEX IF NOT EXISTS fixed_commissions_ad_idx ON fixed_commissions(ad);
CREATE INDEX IF NOT EXISTS additional_revenues_ad_idx ON additional_revenues(ad);

-- ========================================
-- 4. RLS POLİTİKALARI (Tüm tablolar için)
-- ========================================

-- MCC Codes
ALTER TABLE mcc_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for anon" ON mcc_codes;
CREATE POLICY "Enable all for anon" ON mcc_codes FOR ALL TO anon USING (true) WITH CHECK (true);

-- Banks
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for anon" ON banks;
CREATE POLICY "Enable all for anon" ON banks FOR ALL TO anon USING (true) WITH CHECK (true);

-- EPK Institutions
ALTER TABLE epk_institutions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for anon" ON epk_institutions;
CREATE POLICY "Enable all for anon" ON epk_institutions FOR ALL TO anon USING (true) WITH CHECK (true);

-- OK Institutions
ALTER TABLE ok_institutions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for anon" ON ok_institutions;
CREATE POLICY "Enable all for anon" ON ok_institutions FOR ALL TO anon USING (true) WITH CHECK (true);

-- Sales Representatives
ALTER TABLE sales_representatives ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for anon" ON sales_representatives;
CREATE POLICY "Enable all for anon" ON sales_representatives FOR ALL TO anon USING (true) WITH CHECK (true);

-- Job Titles
ALTER TABLE job_titles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for anon" ON job_titles;
CREATE POLICY "Enable all for anon" ON job_titles FOR ALL TO anon USING (true) WITH CHECK (true);

-- Partnerships
ALTER TABLE partnerships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for anon" ON partnerships;
CREATE POLICY "Enable all for anon" ON partnerships FOR ALL TO anon USING (true) WITH CHECK (true);

-- Account Items
ALTER TABLE account_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for anon" ON account_items;
CREATE POLICY "Enable all for anon" ON account_items FOR ALL TO anon USING (true) WITH CHECK (true);

-- Fixed Commissions
ALTER TABLE fixed_commissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for anon" ON fixed_commissions;
CREATE POLICY "Enable all for anon" ON fixed_commissions FOR ALL TO anon USING (true) WITH CHECK (true);

-- Additional Revenues
ALTER TABLE additional_revenues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for anon" ON additional_revenues;
CREATE POLICY "Enable all for anon" ON additional_revenues FOR ALL TO anon USING (true) WITH CHECK (true);

-- ========================================
-- ✅ TAMAMLANDI!
-- ========================================
-- Artık tüm tablolar frontend interface'leriyle %100 uyumlu!
-- Sync hatası almayacaksın!