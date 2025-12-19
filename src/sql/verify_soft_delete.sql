-- ============================================
-- SOFT DELETE VERIFICATION QUERIES
-- ============================================
-- Bu SQL dosyası soft delete mekanizmasının
-- doğru çalıştığını doğrulamak için kullanılır
-- ============================================

-- 1. TÜM TABLOLARDA SOFT DELETE DURUMU
-- ============================================
SELECT 
  'customers' as table_name,
  COUNT(*) as total_records,
  SUM(CASE WHEN is_deleted = true THEN 1 ELSE 0 END) as deleted_records,
  SUM(CASE WHEN is_deleted = false THEN 1 ELSE 0 END) as active_records
FROM customers
UNION ALL
SELECT 
  'bank_accounts',
  COUNT(*),
  SUM(CASE WHEN is_deleted = true THEN 1 ELSE 0 END),
  SUM(CASE WHEN is_deleted = false THEN 1 ELSE 0 END)
FROM bank_accounts
UNION ALL
SELECT 
  'signs',
  COUNT(*),
  SUM(CASE WHEN is_deleted = true THEN 1 ELSE 0 END),
  SUM(CASE WHEN is_deleted = false THEN 1 ELSE 0 END)
FROM signs
UNION ALL
SELECT 
  'earnings',
  COUNT(*),
  SUM(CASE WHEN is_deleted = true THEN 1 ELSE 0 END),
  SUM(CASE WHEN is_deleted = false THEN 1 ELSE 0 END)
FROM earnings
UNION ALL
SELECT 
  'customer_documents',
  COUNT(*),
  SUM(CASE WHEN is_deleted = true THEN 1 ELSE 0 END),
  SUM(CASE WHEN is_deleted = false THEN 1 ELSE 0 END)
FROM customer_documents
UNION ALL
SELECT 
  'mcc_codes',
  COUNT(*),
  SUM(CASE WHEN is_deleted = true THEN 1 ELSE 0 END),
  SUM(CASE WHEN is_deleted = false THEN 1 ELSE 0 END)
FROM mcc_codes
UNION ALL
SELECT 
  'banks',
  COUNT(*),
  SUM(CASE WHEN is_deleted = true THEN 1 ELSE 0 END),
  SUM(CASE WHEN is_deleted = false THEN 1 ELSE 0 END)
FROM banks
UNION ALL
SELECT 
  'epk_institutions',
  COUNT(*),
  SUM(CASE WHEN is_deleted = true THEN 1 ELSE 0 END),
  SUM(CASE WHEN is_deleted = false THEN 1 ELSE 0 END)
FROM epk_institutions
UNION ALL
SELECT 
  'ok_institutions',
  COUNT(*),
  SUM(CASE WHEN is_deleted = true THEN 1 ELSE 0 END),
  SUM(CASE WHEN is_deleted = false THEN 1 ELSE 0 END)
FROM ok_institutions
UNION ALL
SELECT 
  'sales_representatives',
  COUNT(*),
  SUM(CASE WHEN is_deleted = true THEN 1 ELSE 0 END),
  SUM(CASE WHEN is_deleted = false THEN 1 ELSE 0 END)
FROM sales_representatives
UNION ALL
SELECT 
  'job_titles',
  COUNT(*),
  SUM(CASE WHEN is_deleted = true THEN 1 ELSE 0 END),
  SUM(CASE WHEN is_deleted = false THEN 1 ELSE 0 END)
FROM job_titles
UNION ALL
SELECT 
  'partnerships',
  COUNT(*),
  SUM(CASE WHEN is_deleted = true THEN 1 ELSE 0 END),
  SUM(CASE WHEN is_deleted = false THEN 1 ELSE 0 END)
FROM partnerships
UNION ALL
SELECT 
  'sharings',
  COUNT(*),
  SUM(CASE WHEN is_deleted = true THEN 1 ELSE 0 END),
  SUM(CASE WHEN is_deleted = false THEN 1 ELSE 0 END)
FROM sharings
UNION ALL
SELECT 
  'card_programs',
  COUNT(*),
  SUM(CASE WHEN is_deleted = true THEN 1 ELSE 0 END),
  SUM(CASE WHEN is_deleted = false THEN 1 ELSE 0 END)
FROM card_programs
UNION ALL
SELECT 
  'suspension_reasons',
  COUNT(*),
  SUM(CASE WHEN is_deleted = true THEN 1 ELSE 0 END),
  SUM(CASE WHEN is_deleted = false THEN 1 ELSE 0 END)
FROM suspension_reasons
UNION ALL
SELECT 
  'domain_mappings',
  COUNT(*),
  SUM(CASE WHEN is_deleted = true THEN 1 ELSE 0 END),
  SUM(CASE WHEN is_deleted = false THEN 1 ELSE 0 END)
FROM domain_mappings
ORDER BY table_name;

-- ============================================
-- 2. SİLİNEN KAYITLAR BACKUP TABLOSUNDA MI?
-- ============================================
SELECT 
  table_name,
  COUNT(*) as backup_count
FROM deleted_records_backup
GROUP BY table_name
ORDER BY backup_count DESC;

-- ============================================
-- 3. SON 10 SİLME İŞLEMİ
-- ============================================
SELECT 
  table_name,
  record_id,
  deleted_at,
  reason,
  deleted_by
FROM deleted_records_backup
ORDER BY deleted_at DESC
LIMIT 10;

-- ============================================
-- 4. SİLİNMİŞ KAYITLARI GERİ YÜKLEME TESTİ
-- (Örnek: Bir müşteri kaydını geri yükle)
-- ============================================
-- UYARI: Bu sorguyu çalıştırmadan önce ID'yi değiştirin!
/*
UPDATE customers
SET is_deleted = false
WHERE id = 'BURAYA_ID_YAZIN'
AND is_deleted = true;
*/

-- ============================================
-- 5. HER TABLO İÇİN SİLİNMİŞ KAYIT DETAYı
-- ============================================

-- Müşteriler
SELECT id, firma_adi, is_deleted, created_at, updated_at
FROM customers
WHERE is_deleted = true
ORDER BY updated_at DESC
LIMIT 5;

-- Banka Hesapları
SELECT id, hesap_adi, is_deleted, created_at, updated_at
FROM bank_accounts
WHERE is_deleted = true
ORDER BY updated_at DESC
LIMIT 5;

-- Tabelalar
SELECT id, tabela_adi, is_deleted, created_at, updated_at
FROM signs
WHERE is_deleted = true
ORDER BY updated_at DESC
LIMIT 5;

-- ============================================
-- 6. ORPHAN KONTROL (Silinmiş ama backup'ta olmayan)
-- ============================================
SELECT 
  c.id,
  c.firma_adi,
  c.updated_at
FROM customers c
LEFT JOIN deleted_records_backup b 
  ON c.id = b.record_id AND b.table_name = 'customers'
WHERE c.is_deleted = true
  AND b.id IS NULL
ORDER BY c.updated_at DESC;

-- ============================================
-- 7. TABLOLARDA is_deleted KOLONU VAR MI?
-- ============================================
SELECT 
  table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'is_deleted'
ORDER BY table_name;

-- ============================================
-- 8. ÖZET İSTATİSTİK
-- ============================================
SELECT 
  (SELECT COUNT(*) FROM customers WHERE is_deleted = false) as active_customers,
  (SELECT COUNT(*) FROM customers WHERE is_deleted = true) as deleted_customers,
  (SELECT COUNT(*) FROM signs WHERE is_deleted = false) as active_signs,
  (SELECT COUNT(*) FROM signs WHERE is_deleted = true) as deleted_signs,
  (SELECT COUNT(*) FROM earnings WHERE is_deleted = false) as active_earnings,
  (SELECT COUNT(*) FROM earnings WHERE is_deleted = true) as deleted_earnings,
  (SELECT COUNT(*) FROM deleted_records_backup) as total_backups;

-- ============================================
-- 9. SİLİNEN KAYITLARI TEMİZLE (DİKKATLİ!)
-- ============================================
-- UYARI: Bu sorgular hard delete yapar!
-- Sadece eski kayıtları temizlemek için kullanın
-- 
-- -- 90 günden eski silinen kayıtları backup'tan temizle
-- DELETE FROM deleted_records_backup
-- WHERE deleted_at < NOW() - INTERVAL '90 days';
-- 
-- -- 90 günden eski silinen müşterileri temizle (ÇOK DİKKATLİ!)
-- DELETE FROM customers
-- WHERE is_deleted = true
--   AND updated_at < NOW() - INTERVAL '90 days';
