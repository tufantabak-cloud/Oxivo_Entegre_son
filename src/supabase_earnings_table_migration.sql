-- ========================================
-- HAKEDİŞ (EARNINGS) TABLOSU GÜNCELLEMESİ
-- ========================================
-- Bu script eksik kolonları mevcut tabloya ekler

-- ✅ Ek Gelir/Kesinti kolonlarını ekle
ALTER TABLE earnings 
  ADD COLUMN IF NOT EXISTS ek_gelir_aciklama TEXT,
  ADD COLUMN IF NOT EXISTS ek_gelir_pf_tl NUMERIC,
  ADD COLUMN IF NOT EXISTS ek_gelir_ox_tl NUMERIC,
  ADD COLUMN IF NOT EXISTS ek_kesinti_aciklama TEXT,
  ADD COLUMN IF NOT EXISTS ek_kesinti_pf_tl NUMERIC,
  ADD COLUMN IF NOT EXISTS ek_kesinti_ox_tl NUMERIC;

-- ✅ firma_id kolonunu NULL olabilir hale getir
ALTER TABLE earnings 
  ALTER COLUMN firma_id DROP NOT NULL;

-- ✅ Kolonlara comment ekle
COMMENT ON COLUMN earnings.ek_gelir_aciklama IS 'Ek gelir açıklaması';
COMMENT ON COLUMN earnings.ek_gelir_pf_tl IS 'Ek gelir PF payı (TL)';
COMMENT ON COLUMN earnings.ek_gelir_ox_tl IS 'Ek gelir OXİVO payı (TL)';
COMMENT ON COLUMN earnings.ek_kesinti_aciklama IS 'Ek kesinti açıklaması';
COMMENT ON COLUMN earnings.ek_kesinti_pf_tl IS 'Ek kesinti PF tutarı (TL)';
COMMENT ON COLUMN earnings.ek_kesinti_ox_tl IS 'Ek kesinti OXİVO tutarı (TL)';

-- ========================================
-- BAŞARI MESAJI
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '✅ EARNINGS tablosu başarıyla güncellendi!';
  RAISE NOTICE '📊 6 yeni kolon eklendi:';
  RAISE NOTICE '   - ek_gelir_aciklama';
  RAISE NOTICE '   - ek_gelir_pf_tl';
  RAISE NOTICE '   - ek_gelir_ox_tl';
  RAISE NOTICE '   - ek_kesinti_aciklama';
  RAISE NOTICE '   - ek_kesinti_pf_tl';
  RAISE NOTICE '   - ek_kesinti_ox_tl';
  RAISE NOTICE '🔓 firma_id kolonu NULL olabilir hale getirildi';
END $$;
