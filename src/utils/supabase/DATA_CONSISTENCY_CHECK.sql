-- ============================================
-- VERİ TUTARLILIĞI KONTROLÜ
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
  '📋 CUSTOMERS: Örnek Veri' as "Analiz",
  id,
  cari_adi,
  linked_bank_p_f_ids,
  linked_bank_pf_ids
FROM customers
WHERE linked_bank_p_f_ids IS NOT NULL OR linked_bank_pf_ids IS NOT NULL
LIMIT 5;

-- ============================================
-- 2️⃣ BANK_ACCOUNTS: JSONB TABELA Kontrolü
-- ============================================
SELECT 
  '🔍 BANK_ACCOUNTS: JSONB TABELA Kontrolü' as "Analiz",
  COUNT(*) as "Toplam Kayıt",
  SUM(CASE WHEN tabela_records IS NOT NULL AND tabela_records != 'null'::jsonb THEN 1 ELSE 0 END) as "tabela_records DOLU",
  SUM(CASE WHEN tabela_groups IS NOT NULL AND tabela_groups != 'null'::jsonb THEN 1 ELSE 0 END) as "tabela_groups DOLU",
  SUM(CASE WHEN hakedis_records IS NOT NULL AND hakedis_records != 'null'::jsonb THEN 1 ELSE 0 END) as "hakedis_records DOLU"
FROM bank_accounts;

-- Örnek veri
SELECT 
  '📋 BANK_ACCOUNTS: Örnek TABELA Verileri' as "Analiz",
  id,
  firma_unvan,
  tabela_records,
  tabela_groups,
  hakedis_records
FROM bank_accounts
WHERE tabela_records IS NOT NULL 
   OR tabela_groups IS NOT NULL 
   OR hakedis_records IS NOT NULL
LIMIT 3;

-- ============================================
-- 3️⃣ SIGNS TABLOSU: TABELA Kayıtları
-- ============================================
SELECT 
  '🔍 SIGNS: TABELA Kayıtları' as "Analiz",
  COUNT(*) as "Toplam TABELA Kayıt",
  COUNT(DISTINCT bank_pf_id) as "Kaç Farklı BankPF",
  MIN(created_at) as "İlk Kayıt",
  MAX(updated_at) as "Son Güncelleme"
FROM signs;

-- Detaylı örnek
SELECT 
  '📋 SIGNS: Örnek Kayıtlar' as "Analiz",
  id,
  bank_pf_id,
  tabela_no,
  sektor,
  mal_hizmet,
  created_at
FROM signs
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 4️⃣ KARŞILAŞTIRMA: JSONB vs SIGNS
-- ============================================
-- Bank PF'lerde hem JSONB hem SIGNS var mı?
WITH bank_pf_with_jsonb AS (
  SELECT id, firma_unvan
  FROM bank_accounts
  WHERE tabela_records IS NOT NULL AND tabela_records != 'null'::jsonb
),
bank_pf_with_signs AS (
  SELECT DISTINCT bank_pf_id
  FROM signs
)
SELECT 
  '⚠️ KARŞILAŞTIRMA' as "Analiz",
  (SELECT COUNT(*) FROM bank_pf_with_jsonb) as "JSONB kullanan BankPF",
  (SELECT COUNT(*) FROM bank_pf_with_signs) as "SIGNS kullanan BankPF",
  (SELECT COUNT(*) FROM bank_pf_with_jsonb b 
   INNER JOIN bank_pf_with_signs s ON b.id = s.bank_pf_id) as "Her İkisinde de Var";

-- ============================================
-- 5️⃣ ID TİP KONTROLÜ
-- ============================================
SELECT 
  '🔍 ID TİPLERİ' as "Analiz",
  table_name,
  column_name,
  data_type,
  CASE 
    WHEN data_type = 'uuid' THEN '✅ UUID'
    WHEN data_type = 'text' THEN '⚠️ TEXT (UUID olmalı)'
    ELSE '❓ Diğer'
  END as "Durum"
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'id'
  AND table_name IN ('customers', 'bank_accounts', 'signs', 'earnings')
ORDER BY table_name;

-- ============================================
-- 6️⃣ FOREIGN KEY İLİŞKİLERİ
-- ============================================
SELECT 
  '🔍 FOREIGN KEY İLİŞKİLERİ' as "Analiz",
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('customers', 'bank_accounts', 'signs', 'earnings')
ORDER BY tc.table_name;

-- ============================================
-- SONUÇ ÖZETİ
-- ============================================
SELECT 
  '📊 SONUÇ ÖZETİ' as "Kategori",
  'Toplam Tablo' as "Metrik",
  COUNT(DISTINCT table_name) as "Değer"
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'

UNION ALL

SELECT 
  '📊 SONUÇ ÖZETİ',
  'Toplam Müşteri',
  COUNT(*)
FROM customers

UNION ALL

SELECT 
  '📊 SONUÇ ÖZETİ',
  'Toplam Bank/PF',
  COUNT(*)
FROM bank_accounts

UNION ALL

SELECT 
  '📊 SONUÇ ÖZETİ',
  'Toplam TABELA (SIGNS)',
  COUNT(*)
FROM signs

UNION ALL

SELECT 
  '📊 SONUÇ ÖZETİ',
  'Toplam Hakediş (EARNINGS)',
  COUNT(*)
FROM earnings;
