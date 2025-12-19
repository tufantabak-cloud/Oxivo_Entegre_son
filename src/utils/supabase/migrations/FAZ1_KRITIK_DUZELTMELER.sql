-- ============================================
-- FAZ 1: KRİTİK DÜZELTMELER (ÖNCELİK 1)
-- ============================================
-- Duplicate sütunlar ve yanlış veri tipleri
-- Süre: ~30 dakika
-- Risk: DÜŞÜK-ORTA
-- ============================================

-- ⚠️ UYARI: Bu script'i çalıştırmadan önce MUTLAKA BACKUP ALIN!
-- pg_dump -U postgres -d database_name > backup_$(date +%Y%m%d_%H%M%S).sql

-- Transaction başlat (hata varsa geri al)
BEGIN;

-- ============================================
-- 1️⃣ CUSTOMERS: Duplicate Sütun Temizliği
-- ============================================
DO $$
BEGIN
  -- linked_bank_p_f_ids kullanılıyor mu kontrol et
  IF EXISTS (
    SELECT 1 FROM customers 
    WHERE linked_bank_p_f_ids IS NOT NULL 
      AND linked_bank_p_f_ids != 'null'::jsonb
    LIMIT 1
  ) THEN
    RAISE WARNING '⚠️ UYARI: linked_bank_p_f_ids sütununda veri var! Manuel kontrol gerekiyor.';
  ELSE
    -- Kullanılmıyorsa sil
    ALTER TABLE customers DROP COLUMN IF EXISTS linked_bank_p_f_ids;
    RAISE NOTICE '✅ customers.linked_bank_p_f_ids silindi';
  END IF;
END $$;

-- ============================================
-- 2️⃣ EARNINGS: Duplicate Timestamp Temizliği
-- ============================================

-- 2a. Kontrol: Hangi sütunlar dolu?
DO $$
DECLARE
  turkce_dolu INT;
  ingilizce_dolu INT;
BEGIN
  SELECT 
    SUM(CASE WHEN olusturma_tarihi IS NOT NULL THEN 1 ELSE 0 END),
    SUM(CASE WHEN created_at IS NOT NULL THEN 1 ELSE 0 END)
  INTO turkce_dolu, ingilizce_dolu
  FROM earnings;
  
  RAISE NOTICE '📊 olusturma_tarihi dolu: %, created_at dolu: %', turkce_dolu, ingilizce_dolu;
END $$;

-- 2b. Veriyi birleştir (COALESCE: ilk NULL olmayan değeri al)
UPDATE earnings 
SET created_at = COALESCE(created_at, olusturma_tarihi)
WHERE created_at IS NULL AND olusturma_tarihi IS NOT NULL;

UPDATE earnings 
SET updated_at = COALESCE(updated_at, guncelleme_tarihi)
WHERE updated_at IS NULL AND guncelleme_tarihi IS NOT NULL;

RAISE NOTICE '✅ Timestamp verileri birleştirildi';

-- 2c. Türkçe sütunları sil
ALTER TABLE earnings DROP COLUMN IF EXISTS olusturma_tarihi;
ALTER TABLE earnings DROP COLUMN IF EXISTS guncelleme_tarihi;

RAISE NOTICE '✅ earnings.olusturma_tarihi ve guncelleme_tarihi silindi';

-- ============================================
-- 2.5️⃣ SIGNS: Duplicate Timestamp Temizliği (YENİ!)
-- ============================================

-- 2.5a. Kontrol: Hangi sütunlar dolu?
DO $$
DECLARE
  turkce_text_dolu INT;
  ingilizce_dolu INT;
BEGIN
  SELECT 
    SUM(CASE WHEN olusturma_tarihi IS NOT NULL AND olusturma_tarihi != '' THEN 1 ELSE 0 END),
    SUM(CASE WHEN created_at IS NOT NULL THEN 1 ELSE 0 END)
  INTO turkce_text_dolu, ingilizce_dolu
  FROM signs;
  
  RAISE NOTICE '📊 SIGNS olusturma_tarihi (TEXT) dolu: %, created_at dolu: %', turkce_text_dolu, ingilizce_dolu;
END $$;

-- 2.5b. TEXT timestamp'i TIMESTAMPTZ'ye çevir ve created_at'e ata
UPDATE signs 
SET created_at = COALESCE(
  created_at, 
  CASE 
    WHEN olusturma_tarihi IS NOT NULL AND olusturma_tarihi != '' 
    THEN olusturma_tarihi::timestamptz 
    ELSE NULL 
  END
)
WHERE created_at IS NULL;

UPDATE signs 
SET updated_at = COALESCE(updated_at, guncelleme_tarihi)
WHERE updated_at IS NULL AND guncelleme_tarihi IS NOT NULL;

RAISE NOTICE '✅ SIGNS timestamp verileri birleştirildi';

-- 2.5c. Türkçe sütunları sil
ALTER TABLE signs DROP COLUMN IF EXISTS olusturma_tarihi;
ALTER TABLE signs DROP COLUMN IF EXISTS guncelleme_tarihi;

RAISE NOTICE '✅ signs.olusturma_tarihi ve guncelleme_tarihi silindi';

-- ============================================
-- 3️⃣ EARNINGS: TEXT → NUMERIC Migration
-- ============================================

-- 3a. Veriyi kontrol et (geçersiz değer var mı?)
DO $$
DECLARE
  invalid_count INT;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM earnings
  WHERE (pf_islem_hacmi IS NOT NULL AND pf_islem_hacmi !~ '^[0-9.]+$')
     OR (oxivo_islem_hacmi IS NOT NULL AND oxivo_islem_hacmi !~ '^[0-9.]+$')
     OR (manual_ek_gelir_oxivo_total IS NOT NULL AND manual_ek_gelir_oxivo_total !~ '^[0-9.]+$')
     OR (manual_ana_tabela_oxivo_total IS NOT NULL AND manual_ana_tabela_oxivo_total !~ '^[0-9.]+$')
     OR (manual_ana_tabela_islem_hacmi IS NOT NULL AND manual_ana_tabela_islem_hacmi !~ '^[0-9.]+$');
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION '❌ HATA: % kayıtta geçersiz sayısal değer var! Manuel düzeltme gerekiyor.', invalid_count;
  ELSE
    RAISE NOTICE '✅ Tüm sayısal değerler geçerli';
  END IF;
END $$;

-- 3b. TEXT → NUMERIC dönüşümü
ALTER TABLE earnings 
  ALTER COLUMN pf_islem_hacmi TYPE NUMERIC 
  USING CASE 
    WHEN pf_islem_hacmi IS NULL OR pf_islem_hacmi = '' THEN NULL 
    ELSE pf_islem_hacmi::numeric 
  END;

ALTER TABLE earnings 
  ALTER COLUMN oxivo_islem_hacmi TYPE NUMERIC 
  USING CASE 
    WHEN oxivo_islem_hacmi IS NULL OR oxivo_islem_hacmi = '' THEN NULL 
    ELSE oxivo_islem_hacmi::numeric 
  END;

ALTER TABLE earnings 
  ALTER COLUMN manual_ek_gelir_oxivo_total TYPE NUMERIC 
  USING CASE 
    WHEN manual_ek_gelir_oxivo_total IS NULL OR manual_ek_gelir_oxivo_total = '' THEN NULL 
    ELSE manual_ek_gelir_oxivo_total::numeric 
  END;

ALTER TABLE earnings 
  ALTER COLUMN manual_ana_tabela_oxivo_total TYPE NUMERIC 
  USING CASE 
    WHEN manual_ana_tabela_oxivo_total IS NULL OR manual_ana_tabela_oxivo_total = '' THEN NULL 
    ELSE manual_ana_tabela_oxivo_total::numeric 
  END;

ALTER TABLE earnings 
  ALTER COLUMN manual_ana_tabela_islem_hacmi TYPE NUMERIC 
  USING CASE 
    WHEN manual_ana_tabela_islem_hacmi IS NULL OR manual_ana_tabela_islem_hacmi = '' THEN NULL 
    ELSE manual_ana_tabela_islem_hacmi::numeric 
  END;

RAISE NOTICE '✅ Tüm TEXT sütunlar NUMERIC tipine çevrildi';

-- ============================================
-- 4️⃣ BANK_ACCOUNTS: JSONB TABELA Kontrolü
-- ============================================

-- 4a. JSONB sütunları kullanılıyor mu kontrol et
DO $$
DECLARE
  tabela_records_count INT;
  tabela_groups_count INT;
  hakedis_records_count INT;
BEGIN
  SELECT 
    SUM(CASE WHEN tabela_records IS NOT NULL AND tabela_records != 'null'::jsonb THEN 1 ELSE 0 END),
    SUM(CASE WHEN tabela_groups IS NOT NULL AND tabela_groups != 'null'::jsonb THEN 1 ELSE 0 END),
    SUM(CASE WHEN hakedis_records IS NOT NULL AND hakedis_records != 'null'::jsonb THEN 1 ELSE 0 END)
  INTO tabela_records_count, tabela_groups_count, hakedis_records_count
  FROM bank_accounts;
  
  RAISE NOTICE '📊 JSONB Kullanımı:';
  RAISE NOTICE '   - tabela_records: % kayıt', tabela_records_count;
  RAISE NOTICE '   - tabela_groups: % kayıt', tabela_groups_count;
  RAISE NOTICE '   - hakedis_records: % kayıt', hakedis_records_count;
  
  -- Hiçbiri kullanılmıyorsa sil
  IF tabela_records_count = 0 AND tabela_groups_count = 0 AND hakedis_records_count = 0 THEN
    ALTER TABLE bank_accounts DROP COLUMN IF EXISTS tabela_records;
    ALTER TABLE bank_accounts DROP COLUMN IF EXISTS tabela_groups;
    ALTER TABLE bank_accounts DROP COLUMN IF EXISTS hakedis_records;
    RAISE NOTICE '✅ JSONB TABELA sütunları silindi (kullanılmıyordu)';
  ELSE
    RAISE WARNING '⚠️ UYARI: JSONB sütunlarında veri var! Manuel karar gerekiyor.';
  END IF;
END $$;

-- ============================================
-- ✅ BAŞARILI - Transaction COMMIT
-- ============================================
COMMIT;

RAISE NOTICE '🎉 FAZ 1 TAMAMLANDI!';
RAISE NOTICE '📊 Değişiklikler:';
RAISE NOTICE '   - customers.linked_bank_p_f_ids → SİLİNDİ';
RAISE NOTICE '   - earnings.olusturma_tarihi → SİLİNDİ';
RAISE NOTICE '   - earnings.guncelleme_tarihi → SİLİNDİ';
RAISE NOTICE '   - earnings.pf_islem_hacmi → NUMERIC';
RAISE NOTICE '   - earnings.oxivo_islem_hacmi → NUMERIC';
RAISE NOTICE '   - earnings.manual_* sütunlar → NUMERIC';
RAISE NOTICE '   - bank_accounts JSONB temizlendi';

-- ============================================
-- SON KONTROL
-- ============================================
SELECT 
  '✅ FAZ 1 SONUÇ' as "Kategori",
  'TAMAMLANDI' as "Durum",
  NOW() as "Tamamlanma Zamanı";

-- Tablo yapılarını kontrol et
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('customers', 'earnings', 'bank_accounts', 'signs')
  AND table_schema = 'public'
  AND column_name IN (
    'linked_bank_p_f_ids', 'linked_bank_pf_ids',
    'olusturma_tarihi', 'created_at',
    'guncelleme_tarihi', 'updated_at',
    'pf_islem_hacmi', 'oxivo_islem_hacmi',
    'tabela_records', 'tabela_groups', 'hakedis_records'
  )
ORDER BY table_name, column_name;