-- ========================================
-- ANA TABLOLARIN DETAYLI İNCELEMESİ
-- Her sorguyu TEK TEK çalıştırın
-- ========================================

-- ========================================
-- TABLO 1: customers (321 kayıt, 39 sütun!)
-- ========================================

-- Sütunları göster:
SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable",
    CASE 
        WHEN column_name LIKE '%_id' THEN '🔗 Foreign Key'
        WHEN column_name LIKE '%_ids' THEN '📊 JSONB Array'
        WHEN data_type = 'jsonb' THEN '📊 JSONB'
        WHEN data_type LIKE '%timestamp%' THEN '⏰ Timestamp'
        WHEN column_name = 'id' THEN '🔑 Primary Key'
        ELSE ''
    END AS "💡 Not"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'customers'
ORDER BY ordinal_position;

-- İlk 3 müşteri (TÜM sütunlar):
SELECT * FROM customers LIMIT 3;


-- ========================================
-- TABLO 2: products (2883 kayıt, 18 sütun)
-- ========================================

-- Sütunları göster:
SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'products'
ORDER BY ordinal_position;

-- İlk 10 ürün:
SELECT * FROM products LIMIT 10;

-- Ürün kategorileri:
SELECT DISTINCT kategori, COUNT(*) AS "Adet"
FROM products
GROUP BY kategori
ORDER BY COUNT(*) DESC;


-- ========================================
-- TABLO 3: signs (15 kayıt, 18 sütun, JSONB)
-- ========================================

-- Sütunları göster:
SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable",
    CASE 
        WHEN data_type = 'jsonb' THEN '📊 JSONB'
        ELSE ''
    END AS "💡 Not"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'signs'
ORDER BY ordinal_position;

-- TÜM TABELA kayıtları:
SELECT * FROM signs;


-- ========================================
-- TABLO 4: bank_accounts (11 kayıt, 26 sütun, JSONB)
-- ========================================

-- Sütunları göster:
SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable",
    CASE 
        WHEN data_type = 'jsonb' THEN '📊 JSONB'
        ELSE ''
    END AS "💡 Not"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'bank_accounts'
ORDER BY ordinal_position;

-- TÜM BANKA/PF kayıtları:
SELECT * FROM bank_accounts;


-- ========================================
-- TABLO 5: earnings (9 kayıt, 27 sütun, JSONB)
-- ========================================

-- Sütunları göster:
SELECT 
    column_name AS "Sütun",
    data_type AS "Tip",
    CASE WHEN is_nullable = 'NO' THEN '❌ NOT NULL' ELSE '✅ NULL' END AS "Nullable",
    CASE 
        WHEN data_type = 'jsonb' THEN '📊 JSONB'
        ELSE ''
    END AS "💡 Not"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'earnings'
ORDER BY ordinal_position;

-- TÜM HAKEDİŞ kayıtları:
SELECT * FROM earnings;


-- ========================================
-- JSONB İÇERİKLERİNİ İNCELEME
-- ========================================

-- customers tablosundaki JSONB sütunları:
SELECT 
    id,
    unvan,
    bank_pf_ids
FROM customers
WHERE bank_pf_ids IS NOT NULL AND bank_pf_ids::text != 'null'
LIMIT 5;

-- signs tablosundaki JSONB sütunları:
SELECT 
    id,
    urun,
    kart_program_ids,
    bank_ids,
    gelir_modeli,
    komisyon_oranlari,
    paylasim_oranlari
FROM signs
LIMIT 5;

-- bank_accounts tablosundaki JSONB sütunları:
SELECT 
    id,
    adi,
    tabela_records,
    earning_records
FROM bank_accounts
LIMIT 5;

-- earnings tablosundaki JSONB sütunları:
SELECT 
    id,
    donem,
    islem_hacmi_map,
    toplam_gelir
FROM earnings
LIMIT 5;


-- ========================================
-- İLİŞKİLER ANALİZİ
-- ========================================

-- Foreign Key ilişkileri:
SELECT 
    tc.table_name AS "Ana Tablo",
    kcu.column_name AS "Ana Sütun",
    ccu.table_name AS "Referans Tablo",
    ccu.column_name AS "Referans Sütun"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;


-- ========================================
-- KRİTİK SORU: TABELA_GROUP_ID İLİŞKİSİ
-- ========================================

-- signs tablosunda tabela_group_id değerleri:
SELECT 
    tabela_group_id,
    COUNT(*) AS "TABELA Sayısı",
    STRING_AGG(id::text, ', ') AS "TABELA IDs"
FROM signs
WHERE tabela_group_id IS NOT NULL
GROUP BY tabela_group_id
ORDER BY COUNT(*) DESC;

-- earnings tablosunda tabela_group_id değerleri:
SELECT 
    tabela_group_id,
    COUNT(*) AS "HAKEDİŞ Sayısı",
    STRING_AGG(donem, ', ') AS "Dönemler"
FROM earnings
WHERE tabela_group_id IS NOT NULL
GROUP BY tabela_group_id
ORDER BY COUNT(*) DESC;

-- ÖNEMLİ: Hangi tabela_group_id'ler eşleşmiyor?
SELECT DISTINCT
    s.tabela_group_id AS "Signs'da Var",
    e.tabela_group_id AS "Earnings'da Var",
    CASE 
        WHEN s.tabela_group_id IS NOT NULL AND e.tabela_group_id IS NULL THEN '⚠️ Earnings YOK'
        WHEN s.tabela_group_id IS NULL AND e.tabela_group_id IS NOT NULL THEN '⚠️ Signs YOK'
        ELSE '✅ Her İkisinde de Var'
    END AS "Durum"
FROM (SELECT DISTINCT tabela_group_id FROM signs) s
FULL OUTER JOIN (SELECT DISTINCT tabela_group_id FROM earnings) e
    ON s.tabela_group_id = e.tabela_group_id
ORDER BY "Durum", s.tabela_group_id;
