-- ============================================
-- VERİ TUTARLILIĞI KONTROLÜ (BASİTLEŞTİRİLMİŞ)
-- ============================================
-- TABELA verileri nerede? Duplicate var mı?
-- ============================================

-- ============================================
-- 1️⃣ CUSTOMERS: Duplicate Sütun Kontrolü
-- ============================================
SELECT 
  '🔍 CUSTOMERS: Duplicate Sütun Kontrolü' as "Analiz",
  COUNT(*) as "Toplam Kayıt",
  SUM(CASE WHEN linked_bank_p_f_ids IS NOT NULL THEN 1 ELSE 0 END) as "linked_bank_p_f_ids DOLU",
  SUM(CASE WHEN linked_bank_pf_ids IS NOT NULL THEN 1 ELSE 0 END) as "linked_bank_pf_ids DOLU",
  SUM(CASE WHEN linked_bank_p_f_ids IS NOT NULL AND linked_bank_pf_ids IS NOT NULL THEN 1 ELSE 0 END) as "Her İkisi de DOLU"
FROM customers;

-- Örnek veri
SELECT 
  '📋 CUSTOMERS: Örnek Veri (İlk 3 Kayıt)' as "Analiz",
  id,
  cari_adi,
  linked_bank_p_f_ids,
  linked_bank_pf_ids
FROM customers
WHERE linked_bank_p_f_ids IS NOT NULL OR linked_bank_pf_ids IS NOT NULL
LIMIT 3;

-- ============================================
-- 2️⃣ EARNINGS: Duplicate Timestamp Kontrolü
-- ============================================
SELECT 
  '🔍 EARNINGS: Duplicate Timestamp Kontrolü' as "Analiz",
  COUNT(*) as "Toplam Kayıt",
  SUM(CASE WHEN olusturma_tarihi IS NOT NULL THEN 1 ELSE 0 END) as "olusturma_tarihi DOLU",
  SUM(CASE WHEN created_at IS NOT NULL THEN 1 ELSE 0 END) as "created_at DOLU",
  SUM(CASE WHEN guncelleme_tarihi IS NOT NULL THEN 1 ELSE 0 END) as "guncelleme_tarihi DOLU",
  SUM(CASE WHEN updated_at IS NOT NULL THEN 1 ELSE 0 END) as "updated_at DOLU"
FROM earnings;

-- Örnek veri
SELECT 
  '📋 EARNINGS: Örnek Veri' as "Analiz",
  id,
  olusturma_tarihi,
  created_at,
  guncelleme_tarihi,
  updated_at
FROM earnings
LIMIT 3;

-- ============================================
-- 3️⃣ EARNINGS: TEXT Sütun Kontrolü
-- ============================================
SELECT 
  '🔍 EARNINGS: TEXT Sütun Veri Tipleri' as "Analiz",
  column_name as "Sütun",
  data_type as "Tip",
  CASE 
    WHEN data_type = 'numeric' THEN '✅ NUMERIC (Doğru)'
    WHEN data_type = 'text' THEN '⚠️ TEXT (NUMERIC olmalı)'
    ELSE '❓ Diğer'
  END as "Durum"
FROM information_schema.columns
WHERE table_name = 'earnings' 
  AND column_name IN (
    'pf_islem_hacmi',
    'oxivo_islem_hacmi',
    'manual_ek_gelir_oxivo_total',
    'manual_ana_tabela_oxivo_total',
    'manual_ana_tabela_islem_hacmi'
  )
ORDER BY column_name;

-- ============================================
-- 4️⃣ BANK_ACCOUNTS: JSONB TABELA Kontrolü
-- ============================================
SELECT 
  '🔍 BANK_ACCOUNTS: JSONB TABELA Kontrolü' as "Analiz",
  COUNT(*) as "Toplam Kayıt",
  SUM(CASE WHEN tabela_records IS NOT NULL AND tabela_records != 'null'::jsonb THEN 1 ELSE 0 END) as "tabela_records DOLU",
  SUM(CASE WHEN tabela_groups IS NOT NULL AND tabela_groups != 'null'::jsonb THEN 1 ELSE 0 END) as "tabela_groups DOLU",
  SUM(CASE WHEN hakedis_records IS NOT NULL AND hakedis_records != 'null'::jsonb THEN 1 ELSE 0 END) as "hakedis_records DOLU"
FROM bank_accounts;

-- Örnek veri (varsa)
SELECT 
  '📋 BANK_ACCOUNTS: Örnek TABELA Verileri' as "Analiz",
  id,
  firma_unvan,
  CASE 
    WHEN tabela_records IS NOT NULL AND tabela_records != 'null'::jsonb 
    THEN '✅ DOLU' 
    ELSE '❌ BOŞ' 
  END as "tabela_records_durum"
FROM bank_accounts
WHERE tabela_records IS NOT NULL 
   OR tabela_groups IS NOT NULL 
   OR hakedis_records IS NOT NULL
LIMIT 3;

-- ============================================
-- 5️⃣ SIGNS TABLOSU: Sütun Yapısını Kontrol Et
-- ============================================
SELECT 
  '🔍 SIGNS: Sütun Yapısı' as "Analiz",
  column_name as "Sütun Adı",
  data_type as "Tip"
FROM information_schema.columns
WHERE table_name = 'signs' 
  AND table_schema = 'public'
  AND (column_name LIKE '%bank%' OR column_name LIKE '%pf%' OR column_name LIKE '%firma%' OR column_name LIKE '%tarihi%' OR column_name LIKE '%_at')
ORDER BY ordinal_position;

-- SIGNS kayıt sayısı
SELECT 
  '🔍 SIGNS: TABELA Kayıtları' as "Analiz",
  COUNT(*) as "Toplam TABELA Kayıt"
FROM signs;

-- SIGNS duplicate timestamp kontrolü
SELECT 
  '🔍 SIGNS: Duplicate Timestamp Kontrolü' as "Analiz",
  COUNT(*) as "Toplam Kayıt",
  SUM(CASE WHEN olusturma_tarihi IS NOT NULL AND olusturma_tarihi != '' THEN 1 ELSE 0 END) as "olusturma_tarihi DOLU",
  SUM(CASE WHEN created_at IS NOT NULL THEN 1 ELSE 0 END) as "created_at DOLU",
  SUM(CASE WHEN guncelleme_tarihi IS NOT NULL THEN 1 ELSE 0 END) as "guncelleme_tarihi DOLU",
  SUM(CASE WHEN updated_at IS NOT NULL THEN 1 ELSE 0 END) as "updated_at DOLU"
FROM signs;

-- SIGNS örnek veri
SELECT 
  '📋 SIGNS: Örnek Veri (İlk 3)' as "Analiz",
  id,
  urun,
  firma_id,
  olusturma_tarihi,
  created_at
FROM signs
LIMIT 3;

-- ============================================
-- 6️⃣ ID TİP KONTROLÜ
-- ============================================
SELECT 
  '🔍 ID TİPLERİ' as "Analiz",
  table_name as "Tablo",
  data_type as "ID Tipi",
  CASE 
    WHEN data_type = 'uuid' THEN '✅ UUID (Doğru)'
    WHEN data_type = 'text' THEN '⚠️ TEXT (UUID olmalı)'
    ELSE '❓ Diğer'
  END as "Durum"
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'id'
  AND table_name IN ('customers', 'bank_accounts', 'signs', 'earnings', 'domain_mappings')
ORDER BY table_name;

-- ============================================
-- 7️⃣ FOREIGN KEY KONTROLÜ
-- ============================================
SELECT 
  '🔍 FOREIGN KEY KONTROLÜ' as "Analiz",
  COUNT(*) as "Toplam FK",
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ Yeterli FK var'
    ELSE '⚠️ FK eksik (FAZ 2 gerekli)'
  END as "Durum"
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
  AND table_schema = 'public'
  AND table_name IN ('domain_mappings', 'earnings', 'signs');

-- FK detayları
SELECT 
  '📋 MEVCUT FOREIGN KEY''LER' as "Kategori",
  tc.table_name as "Tablo",
  kcu.column_name as "Sütun",
  ccu.table_name as "Referans Tablo"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('domain_mappings', 'earnings', 'signs')
ORDER BY tc.table_name;

-- ============================================
-- 8️⃣ SONUÇ ÖZETİ
-- ============================================
SELECT 
  '📊 SONUÇ ÖZETİ' as "Kategori",
  'Toplam Tablo' as "Metrik",
  COUNT(DISTINCT table_name)::text as "Değer"
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'

UNION ALL

SELECT 
  '📊 SONUÇ ÖZETİ',
  'Toplam Müşteri',
  COUNT(*)::text
FROM customers

UNION ALL

SELECT 
  '📊 SONUÇ ÖZETİ',
  'Toplam Bank/PF',
  COUNT(*)::text
FROM bank_accounts

UNION ALL

SELECT 
  '📊 SONUÇ ÖZETİ',
  'Toplam TABELA (SIGNS)',
  COUNT(*)::text
FROM signs

UNION ALL

SELECT 
  '📊 SONUÇ ÖZETİ',
  'Toplam Hakediş (EARNINGS)',
  COUNT(*)::text
FROM earnings

UNION ALL

SELECT 
  '📊 SONUÇ ÖZETİ',
  'Toplam Domain Mappings',
  COUNT(*)::text
FROM domain_mappings;