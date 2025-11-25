-- =====================================================
-- PRODUCTS DUPLICATE REMOVAL MIGRATION
-- =====================================================
-- Bu script products tablosundaki duplicate kayıtları temizler
-- ve gelecekte duplicate oluşmasını önlemek için constraint ekler
-- =====================================================

-- STEP 1: Duplicate kayıtları tespit et ve logla
-- =====================================================
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT 
      urun_adi,
      COUNT(*) as count
    FROM products
    WHERE urun_adi IS NOT NULL
    GROUP BY urun_adi
    HAVING COUNT(*) > 1
  ) duplicates;
  
  RAISE NOTICE '🔍 Toplam % duplicate ürün adı tespit edildi', duplicate_count;
END $$;

-- STEP 2: Duplicate kayıtları göster (log için)
-- =====================================================
SELECT 
  urun_adi as "Ürün Adı",
  COUNT(*) as "Duplicate Sayısı",
  array_agg(id ORDER BY created_at) as "ID'ler",
  array_agg(created_at ORDER BY created_at) as "Tarihler"
FROM products
WHERE urun_adi IS NOT NULL
GROUP BY urun_adi
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- STEP 3: Backup tablosu oluştur (güvenlik için)
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products_backup_before_dedup') THEN
    CREATE TABLE products_backup_before_dedup AS 
    SELECT * FROM products;
    
    RAISE NOTICE '✅ Backup tablosu oluşturuldu: products_backup_before_dedup';
  ELSE
    RAISE NOTICE 'ℹ️ Backup tablosu zaten mevcut';
  END IF;
END $$;

-- STEP 4: Duplicate kayıtları temizle (en eskisini sakla)
-- =====================================================
-- Her duplicate grup için en eski kaydı (ilk created_at) sakla, diğerlerini sil
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH duplicates AS (
    SELECT 
      id,
      urun_adi,
      ROW_NUMBER() OVER (
        PARTITION BY urun_adi 
        ORDER BY created_at ASC, id ASC  -- En eski kayıt
      ) as row_num
    FROM products
    WHERE urun_adi IS NOT NULL
  ),
  to_delete AS (
    SELECT id 
    FROM duplicates 
    WHERE row_num > 1  -- İlk kayıt hariç diğerleri
  )
  DELETE FROM products
  WHERE id IN (SELECT id FROM to_delete);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '🗑️ % duplicate kayıt silindi', deleted_count;
END $$;

-- STEP 5: NULL veya boş ürün adlarını kontrol et
-- =====================================================
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM products
  WHERE urun_adi IS NULL OR TRIM(urun_adi) = '';
  
  IF null_count > 0 THEN
    RAISE WARNING '⚠️ % kayıtta ürün adı NULL veya boş!', null_count;
  ELSE
    RAISE NOTICE '✅ Tüm kayıtlarda ürün adı mevcut';
  END IF;
END $$;

-- STEP 6: Unique constraint ekle (gelecekteki duplicateleri önle)
-- =====================================================
DO $$
BEGIN
  -- Önce mevcut constraint'i kontrol et
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'products_urun_adi_unique' 
    AND conrelid = 'products'::regclass
  ) THEN
    -- NULL değerler için partial unique index kullan
    -- (NULL değerlere izin verir ama duplicate non-NULL değerleri engeller)
    CREATE UNIQUE INDEX products_urun_adi_unique 
    ON products (LOWER(TRIM(urun_adi)))
    WHERE urun_adi IS NOT NULL AND TRIM(urun_adi) != '';
    
    RAISE NOTICE '✅ Unique constraint eklendi: products_urun_adi_unique';
    RAISE NOTICE '   → Case-insensitive ve trim edilmiş değerlere göre unique';
    RAISE NOTICE '   → NULL/boş değerlere izin verir';
  ELSE
    RAISE NOTICE 'ℹ️ Unique constraint zaten mevcut';
  END IF;
END $$;

-- STEP 7: Final verification
-- =====================================================
DO $$
DECLARE
  total_count INTEGER;
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM products;
  
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT 
      LOWER(TRIM(urun_adi)) as normalized_name,
      COUNT(*) as count
    FROM products
    WHERE urun_adi IS NOT NULL AND TRIM(urun_adi) != ''
    GROUP BY LOWER(TRIM(urun_adi))
    HAVING COUNT(*) > 1
  ) duplicates;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '✅ MIGRATION TAMAMLANDI';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE 'Toplam Ürün: %', total_count;
  RAISE NOTICE 'Kalan Duplicate: %', duplicate_count;
  
  IF duplicate_count = 0 THEN
    RAISE NOTICE '🎉 Tüm duplicate kayıtlar temizlendi!';
  ELSE
    RAISE WARNING '⚠️ Hala % duplicate kayıt var!', duplicate_count;
  END IF;
END $$;

-- STEP 8: İstatistik göster
-- =====================================================
SELECT 
  COUNT(*) as "Toplam Ürün",
  COUNT(DISTINCT urun_adi) as "Unique Ürün Adı",
  COUNT(*) - COUNT(DISTINCT urun_adi) as "Temizlenen Duplicate",
  COUNT(*) FILTER (WHERE urun_adi IS NULL) as "NULL Ürün Adı",
  COUNT(*) FILTER (WHERE aktif = true) as "Aktif Ürün",
  COUNT(*) FILTER (WHERE aktif = false) as "Pasif Ürün"
FROM products;

-- ROLLBACK INSTRUCTIONS (ihtiyaç halinde):
-- =====================================================
-- Eğer bir sorun olursa, backup'tan geri yükleme:
-- 
-- TRUNCATE products;
-- INSERT INTO products SELECT * FROM products_backup_before_dedup;
-- 
-- Not: Backup tablosu 30 gün sonra silinebilir:
-- DROP TABLE IF EXISTS products_backup_before_dedup;
