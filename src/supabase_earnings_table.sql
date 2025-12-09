-- ========================================
-- HAKEDİŞ (EARNINGS) TABLOSU
-- ========================================
-- Bu tablo, TABELA gruplarına göre oluşturulan hakediş kayıtlarını tutar
-- Her hakediş kaydı bir firmaya ve bir TABELA grubuna aittir

CREATE TABLE IF NOT EXISTS earnings (
  -- Primary Key
  id TEXT PRIMARY KEY,
  
  -- İlişkiler
  firma_id TEXT,  -- Hangi firmaya ait (Banka/PF) - opsiyonel
  tabela_group_id TEXT NOT NULL,  -- Hangi TABELA grubuna ait
  tabela_group_ad TEXT NOT NULL,  -- Grup adı (görüntüleme için)
  
  -- Dönem ve Tarih Bilgileri
  donem TEXT NOT NULL,  -- YYYY-MM formatında (örn: "2025-10")
  olusturma_tarihi TIMESTAMPTZ DEFAULT NOW(),
  guncelleme_tarihi TIMESTAMPTZ,
  
  -- Vade Bilgisi
  vade TEXT NOT NULL,  -- Seçili vade (D+1, D+7, D+14, D+31, "Tüm Vadeler")
  
  -- İşlem Hacmi Verileri (JSONB)
  islem_hacmi_map JSONB NOT NULL DEFAULT '{}',  -- tabelaId -> hacim değeri map
  
  -- Durum ve Notlar
  durum TEXT NOT NULL DEFAULT 'Taslak',  -- 'Taslak' | 'Kesinleşmiş'
  notlar TEXT,
  olusturan_kullanici TEXT,
  
  -- PF ve OXİVO İşlem Hacmi
  pf_islem_hacmi TEXT,  -- PF İşlem Hacmi/TL
  oxivo_islem_hacmi TEXT,  -- OXİVO İşlem Hacmi/TL
  
  -- Ek Gelir/Kesinti Alanları
  ek_gelir_aciklama TEXT,  -- Ek gelir açıklaması
  ek_gelir_pf_tl NUMERIC,  -- Ek gelir PF payı (TL)
  ek_gelir_ox_tl NUMERIC,  -- Ek gelir OXİVO payı (TL)
  ek_kesinti_aciklama TEXT,  -- Ek kesinti açıklaması
  ek_kesinti_pf_tl NUMERIC,  -- Ek kesinti PF tutarı (TL)
  ek_kesinti_ox_tl NUMERIC,  -- Ek kesinti OXİVO tutarı (TL)
  
  -- Manuel Değerler (Kullanıcı tarafından manuel girilmiş toplam değerler)
  manual_ek_gelir_oxivo_total TEXT,  -- Manuel Ek Gelir OXİVO Payı
  manual_ana_tabela_oxivo_total TEXT,  -- Manuel Ana TABELA OXİVO Payı
  manual_ana_tabela_islem_hacmi TEXT,  -- Manuel Ana TABELA İşlem Hacmi
  
  -- Hesaplanmış Toplam Değerler (Rapor performansı için önbellekleme)
  total_islem_hacmi NUMERIC,  -- Toplam İşlem Hacmi
  total_pf_pay NUMERIC,  -- Toplam PF Payı
  total_oxivo_pay NUMERIC,  -- Toplam OXİVO Payı
  
  -- Sistem Alanları
  aktif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- İNDEXLER (Performans İçin)
-- ========================================

-- Firma bazlı sorgular için
CREATE INDEX IF NOT EXISTS idx_earnings_firma_id ON earnings(firma_id);

-- Dönem bazlı sorgular için
CREATE INDEX IF NOT EXISTS idx_earnings_donem ON earnings(donem);

-- TABELA grubu bazlı sorgular için
CREATE INDEX IF NOT EXISTS idx_earnings_tabela_group_id ON earnings(tabela_group_id);

-- Durum bazlı sorgular için
CREATE INDEX IF NOT EXISTS idx_earnings_durum ON earnings(durum);

-- Tarih bazlı sorgular için
CREATE INDEX IF NOT EXISTS idx_earnings_created_at ON earnings(created_at);

-- Aktif kayıtlar için
CREATE INDEX IF NOT EXISTS idx_earnings_aktif ON earnings(aktif);

-- Kompozit index: Firma + Dönem (en sık kullanılan sorgu)
CREATE INDEX IF NOT EXISTS idx_earnings_firma_donem ON earnings(firma_id, donem);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================
-- Not: RLS politikaları projeye göre özelleştirilmelidir

ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

-- Tüm işlemler için geçici policy (development için)
-- Production'da bu policy kaldırılmalı ve kullanıcı bazlı policy eklenmelidir
CREATE POLICY "Enable all operations for authenticated users" ON earnings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public erişim için policy (eğer gerekiyorsa)
CREATE POLICY "Enable read access for all users" ON earnings
  FOR SELECT
  TO anon
  USING (true);

-- ========================================
-- TRIGGER: updated_at otomatik güncelleme
-- ========================================

CREATE OR REPLACE FUNCTION update_earnings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER earnings_updated_at_trigger
  BEFORE UPDATE ON earnings
  FOR EACH ROW
  EXECUTE FUNCTION update_earnings_updated_at();

-- ========================================
-- COMMENTS (Dokümantasyon)
-- ========================================

COMMENT ON TABLE earnings IS 'HAKEDİŞ kayıtları - Firma ve TABELA grubuna göre dönemsel hakediş hesaplamaları';
COMMENT ON COLUMN earnings.id IS 'Unique hakediş ID (örn: hakedis-1702345678901)';
COMMENT ON COLUMN earnings.firma_id IS 'Banka/PF firma ID (foreign key to bank_pf table)';
COMMENT ON COLUMN earnings.tabela_group_id IS 'TABELA grubu ID';
COMMENT ON COLUMN earnings.donem IS 'Hakediş dönemi (YYYY-MM formatında)';
COMMENT ON COLUMN earnings.vade IS 'Seçili vade (D+1, D+7, D+14, D+31, Tüm Vadeler)';
COMMENT ON COLUMN earnings.islem_hacmi_map IS 'TABELA bazlı işlem hacmi değerleri (tabelaId -> hacim)';
COMMENT ON COLUMN earnings.durum IS 'Hakediş durumu: Taslak veya Kesinleşmiş';
COMMENT ON COLUMN earnings.manual_ek_gelir_oxivo_total IS 'Manuel girilmiş Ek Gelir OXİVO Payı (Excel export''ta işaretlenir)';
COMMENT ON COLUMN earnings.manual_ana_tabela_oxivo_total IS 'Manuel girilmiş Ana TABELA OXİVO Payı (Excel export''ta işaretlenir)';
COMMENT ON COLUMN earnings.manual_ana_tabela_islem_hacmi IS 'Manuel girilmiş Ana TABELA İşlem Hacmi (Excel export''ta işaretlenir)';
COMMENT ON COLUMN earnings.total_islem_hacmi IS 'Önbelleğe alınmış toplam işlem hacmi (rapor performansı için)';
COMMENT ON COLUMN earnings.total_pf_pay IS 'Önbelleğe alınmış toplam PF payı (rapor performansı için)';
COMMENT ON COLUMN earnings.total_oxivo_pay IS 'Önbelleğe alınmış toplam OXİVO payı (rapor performansı için)';

-- ========================================
-- ÖRNEK VERİ (Test İçin)
-- ========================================
-- Gerekirse test verisi eklenebilir
-- INSERT INTO earnings (id, firma_id, tabela_group_id, tabela_group_ad, donem, vade, islem_hacmi_map, durum)
-- VALUES 
-- ('hakedis-test-1', 'bp-001', 'tg-001', 'Ana TABELA', '2025-01', 'D+1', '{"t1": "1000000", "t2": "500000"}', 'Taslak');

-- ========================================
-- BAŞARI MESAJI
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '✅ EARNINGS (HAKEDİŞ) tablosu başarıyla oluşturuldu!';
  RAISE NOTICE '📋 Tablo: earnings';
  RAISE NOTICE '🔑 Primary Key: id';
  RAISE NOTICE '🔗 Foreign Key: firma_id -> bank_pf(id)';
  RAISE NOTICE '📊 Indexes: 7 index oluşturuldu';
  RAISE NOTICE '🔒 RLS: Etkinleştirildi (policy eklenmelidir)';
  RAISE NOTICE '⚡ Trigger: updated_at otomatik güncelleme aktif';
END $$;
