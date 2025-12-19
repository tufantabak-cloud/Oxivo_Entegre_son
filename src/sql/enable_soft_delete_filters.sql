-- ========================================
-- TÜM TABLOLARDA SOFT DELETE FİLTRELERİNİ AKTİF ET
-- ========================================
-- Her SELECT sorgusunda is_deleted = false filtresi otomatik eklenecek

-- NOT: Bu bir VIEW yaklaşımı değil, sadece uygulamada is_deleted filtreleri eklenmeli
-- Aşağıdaki SQL sadece test amaçlıdır

-- TEST: is_deleted = true olan kayıtları listele
SELECT 'customers' as table_name, COUNT(*) as deleted_count FROM customers WHERE is_deleted = true
UNION ALL
SELECT 'products', COUNT(*) FROM products WHERE is_deleted = true
UNION ALL
SELECT 'bank_accounts', COUNT(*) FROM bank_accounts WHERE is_deleted = true
UNION ALL
SELECT 'signs', COUNT(*) FROM signs WHERE is_deleted = true
UNION ALL
SELECT 'mcc_codes', COUNT(*) FROM mcc_codes WHERE is_deleted = true
UNION ALL
SELECT 'banks', COUNT(*) FROM banks WHERE is_deleted = true
UNION ALL
SELECT 'earnings', COUNT(*) FROM earnings WHERE is_deleted = true;
