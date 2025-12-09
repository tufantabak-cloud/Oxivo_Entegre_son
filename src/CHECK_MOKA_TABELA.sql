-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MOKA UNITED TABELA VERİSİ KONTROL SORGUSU
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Bu sorguları Supabase SQL Editor'de çalıştırın
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ✅ ADIM 1: Önce Moka United firma ID'sini bulalım
SELECT 
  id,
  firma_adi,
  yetkililer,
  cep_tel,
  created_at
FROM customers
WHERE firma_adi ILIKE '%Moka%United%'
   OR firma_adi ILIKE '%United%Moka%'
   OR firma_adi = 'Moka United'
ORDER BY created_at DESC;

-- 📝 Yukarıdaki sorgudan gelen 'id' değerini not alın (örn: '123e4567-e89b-12d3-a456-426614174000')


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ ADIM 2: Moka United'ın Banka/PF kayıtlarını kontrol edelim
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ⚠️ Aşağıdaki sorguda 'MOKA_FIRMA_ID' yerine yukarıdaki id'yi yazın
SELECT 
  id,
  firma_id,
  banka,
  merchant_no,
  terminal_no,
  aktif,
  created_at
FROM bank_accounts
WHERE firma_id = 'MOKA_FIRMA_ID'  -- ⚠️ BURAYA GERÇEK ID'Yİ YAZIN
ORDER BY created_at DESC;

-- 📝 Yukarıdaki sorgudan gelen bank_accounts.id değerlerini not alın


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ ADIM 3: Moka United TABELA kayıtlarını kontrol edelim
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ⚠️ Aşağıdaki sorguda 'MOKA_FIRMA_ID' yerine yukarıdaki id'yi yazın
SELECT 
  id,
  firma_id,
  urun,
  aktif,
  kart_tipi,
  yurt_ici_disi,
  kisa_aciklama,
  gelir_modeli,
  komisyon_oranlari,
  paylasim_oranlari,
  hazine_geliri,
  ek_gelir_detay,
  aciklama,
  created_at,
  updated_at
FROM signs
WHERE firma_id = 'MOKA_FIRMA_ID'  -- ⚠️ BURAYA GERÇEK ID'Yİ YAZIN
ORDER BY created_at DESC;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ ADIM 4: HIZLI KONTROL - Tüm firmaların TABELA sayıları
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
  c.firma_adi,
  c.id as firma_id,
  COUNT(s.id) as tabela_sayisi,
  COUNT(CASE WHEN s.aktif = true THEN 1 END) as aktif_tabela,
  COUNT(CASE WHEN s.aktif = false THEN 1 END) as pasif_tabela,
  MAX(s.created_at) as son_tabela_tarihi
FROM customers c
LEFT JOIN signs s ON c.id = s.firma_id
WHERE c.firma_adi ILIKE '%Moka%'
GROUP BY c.id, c.firma_adi
ORDER BY tabela_sayisi DESC;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ ADIM 5: DETAYLI RAPOR - Moka United'ın tüm TABELA detayları
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WITH moka_firma AS (
  SELECT id, firma_adi
  FROM customers
  WHERE firma_adi ILIKE '%Moka%United%'
  LIMIT 1
)
SELECT 
  mf.firma_adi,
  s.id as tabela_id,
  s.urun,
  s.aktif,
  s.kart_tipi,
  s.yurt_ici_disi,
  s.kisa_aciklama,
  s.gelir_modeli,
  s.komisyon_oranlari::text as komisyon_detay,
  s.paylasim_oranlari::text as paylasim_detay,
  s.hazine_geliri,
  s.ek_gelir_detay::text as ek_gelir,
  s.created_at,
  s.updated_at
FROM moka_firma mf
LEFT JOIN signs s ON mf.id = s.firma_id
ORDER BY s.created_at DESC;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ BONUS: Tüm signs tablosunu göster (küçük veri setleri için)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
  COUNT(*) as toplam_tabela_sayisi,
  COUNT(DISTINCT firma_id) as firma_sayisi,
  COUNT(CASE WHEN aktif = true THEN 1 END) as aktif_tabela,
  COUNT(CASE WHEN aktif = false THEN 1 END) as pasif_tabela
FROM signs;

-- Tüm TABELA kayıtlarını göster
SELECT * FROM signs ORDER BY created_at DESC LIMIT 50;
