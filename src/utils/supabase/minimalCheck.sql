-- ============================================
-- MINIMAL SCHEMA CHECK
-- ============================================
-- En hızlı kontrol: Sadece tablo isimleri ve sütun sayıları
-- ============================================

-- HIZLI KONTROL: Tablo listesi ve sütun sayıları
SELECT 
  table_name as "📋 Tablo",
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name AND table_schema = 'public') as "📊 Sütun",
  (SELECT n_live_tup FROM pg_stat_user_tables 
   WHERE relname = t.table_name AND schemaname = 'public') as "📈 Kayıt"
FROM 
  information_schema.tables t
WHERE 
  table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY 
  table_name;

-- ============================================
-- BEKLENEN SONUÇ:
-- ============================================
-- 📋 Tablo                    | 📊 Sütun | 📈 Kayıt
-- ----------------------------+----------+----------
-- account_items               | ~5       | ?
-- additional_revenues         | ~12      | ?
-- bank_accounts               | ~15      | ?
-- banks                       | ~5       | ?
-- customers                   | ~18      | ?
-- documents                   | ~7       | ?
-- domain_mappings             | ~5       | ?
-- earnings                    | ~10      | ?
-- epk_institutions            | ~5       | ?
-- fixed_commissions           | ~5       | ?
-- job_titles                  | ~4       | ?
-- kart_programlar             | ~5       | ?
-- mcc_codes                   | ~5       | ?
-- ok_institutions             | ~5       | ?
-- partnerships                | ~5       | ?
-- products                    | ~10      | ?
-- sales_representatives       | ~6       | ?
-- sharing                     | ~5       | ?
-- signs                       | ~20+     | ?
-- suspension_reasons          | ~4       | ?
-- ============================================
-- TOPLAM: 20 TABLO OLMALI
-- ============================================
