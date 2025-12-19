-- ============================================
-- FAZ 2: FOREIGN KEY & INDEX EKLEME (ÖNCELİK 2)
-- ============================================
-- Veri bütünlüğü ve performans iyileştirmeleri
-- Süre: ~1 saat
-- Risk: ORTA
-- ============================================

-- ⚠️ UYARI: FAZ 1 tamamlanmadan bu script'i ÇALIŞTIRMAYIN!
-- ⚠️ UYARI: Bu script'i çalıştırmadan önce MUTLAKA BACKUP ALIN!

BEGIN;

-- ============================================
-- 1️⃣ ORPHAN KAYIT KONTROLÜ
-- ============================================

-- 1a. domain_mappings → customers orphan kontrolü
DO $$
DECLARE
  orphan_count INT;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM domain_mappings dm
  LEFT JOIN customers c ON dm.customer_id = c.id
  WHERE dm.customer_id IS NOT NULL AND c.id IS NULL;
  
  IF orphan_count > 0 THEN
    RAISE WARNING '⚠️ UYARI: % orphan customer_id bulundu!', orphan_count;
    
    -- Orphan kayıtları göster
    RAISE NOTICE '📋 Orphan domain_mappings.customer_id:';
    FOR rec IN 
      SELECT dm.id, dm.customer_id, dm.full_domain
      FROM domain_mappings dm
      LEFT JOIN customers c ON dm.customer_id = c.id
      WHERE dm.customer_id IS NOT NULL AND c.id IS NULL
    LOOP
      RAISE NOTICE '   - ID: %, customer_id: %, domain: %', rec.id, rec.customer_id, rec.full_domain;
    END LOOP;
    
    -- Orphan kayıtları temizle (veya NULL yap)
    UPDATE domain_mappings
    SET customer_id = NULL
    WHERE customer_id NOT IN (SELECT id FROM customers);
    
    RAISE NOTICE '✅ Orphan customer_id değerleri NULL yapıldı';
  ELSE
    RAISE NOTICE '✅ Orphan customer_id yok';
  END IF;
END $$;

-- 1b. domain_mappings → signs orphan kontrolü
DO $$
DECLARE
  orphan_count INT;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM domain_mappings dm
  LEFT JOIN signs s ON dm.sign_id = s.id
  WHERE dm.sign_id IS NOT NULL AND s.id IS NULL;
  
  IF orphan_count > 0 THEN
    RAISE WARNING '⚠️ UYARI: % orphan sign_id bulundu!', orphan_count;
    
    UPDATE domain_mappings
    SET sign_id = NULL
    WHERE sign_id NOT IN (SELECT id FROM signs);
    
    RAISE NOTICE '✅ Orphan sign_id değerleri NULL yapıldı';
  ELSE
    RAISE NOTICE '✅ Orphan sign_id yok';
  END IF;
END $$;

-- 1c. earnings → bank_accounts orphan kontrolü
DO $$
DECLARE
  orphan_count INT;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM earnings e
  LEFT JOIN bank_accounts b ON e.firma_id = b.id
  WHERE e.firma_id IS NOT NULL AND b.id IS NULL;
  
  IF orphan_count > 0 THEN
    RAISE WARNING '⚠️ UYARI: % orphan firma_id bulundu!', orphan_count;
    
    -- Bu durumda DELETE etmek daha mantıklı (hakediş kayıtları firmaya bağlı)
    DELETE FROM earnings
    WHERE firma_id NOT IN (SELECT id FROM bank_accounts);
    
    RAISE NOTICE '✅ Orphan earnings kayıtları silindi';
  ELSE
    RAISE NOTICE '✅ Orphan firma_id yok';
  END IF;
END $$;

-- 1d. signs → bank_accounts orphan kontrolü
DO $$
DECLARE
  orphan_count INT;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM signs s
  LEFT JOIN bank_accounts b ON s.firma_id = b.id
  WHERE s.firma_id IS NOT NULL AND b.id IS NULL;
  
  IF orphan_count > 0 THEN
    RAISE WARNING '⚠️ UYARI: % orphan firma_id bulundu!', orphan_count;
    
    -- TABELA kayıtları için firma_id NULL yapabiliriz (veya sileriz)
    UPDATE signs
    SET firma_id = NULL
    WHERE firma_id NOT IN (SELECT id FROM bank_accounts);
    
    RAISE NOTICE '✅ Orphan firma_id değerleri NULL yapıldı';
  ELSE
    RAISE NOTICE '✅ Orphan firma_id yok';
  END IF;
END $$;

-- ============================================
-- 2️⃣ FOREIGN KEY CONSTRAINT'LERİ EKLE
-- ============================================

-- 2a. domain_mappings → customers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_domain_customer' 
    AND table_name = 'domain_mappings'
  ) THEN
    ALTER TABLE domain_mappings 
      ADD CONSTRAINT fk_domain_customer 
      FOREIGN KEY (customer_id) 
      REFERENCES customers(id) 
      ON DELETE CASCADE;
    
    RAISE NOTICE '✅ fk_domain_customer eklendi';
  ELSE
    RAISE NOTICE '⏭️ fk_domain_customer zaten var';
  END IF;
END $$;

-- 2b. domain_mappings → signs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_domain_sign' 
    AND table_name = 'domain_mappings'
  ) THEN
    ALTER TABLE domain_mappings 
      ADD CONSTRAINT fk_domain_sign 
      FOREIGN KEY (sign_id) 
      REFERENCES signs(id) 
      ON DELETE SET NULL;
    
    RAISE NOTICE '✅ fk_domain_sign eklendi';
  ELSE
    RAISE NOTICE '⏭️ fk_domain_sign zaten var';
  END IF;
END $$;

-- 2c. earnings → bank_accounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_earnings_firma' 
    AND table_name = 'earnings'
  ) THEN
    ALTER TABLE earnings 
      ADD CONSTRAINT fk_earnings_firma 
      FOREIGN KEY (firma_id) 
      REFERENCES bank_accounts(id) 
      ON DELETE CASCADE;
    
    RAISE NOTICE '✅ fk_earnings_firma eklendi';
  ELSE
    RAISE NOTICE '⏭️ fk_earnings_firma zaten var';
  END IF;
END $$;

-- 2d. signs → bank_accounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_signs_firma' 
    AND table_name = 'signs'
  ) THEN
    ALTER TABLE signs 
      ADD CONSTRAINT fk_signs_firma 
      FOREIGN KEY (firma_id) 
      REFERENCES bank_accounts(id) 
      ON DELETE SET NULL;
    
    RAISE NOTICE '✅ fk_signs_firma eklendi';
  ELSE
    RAISE NOTICE '⏭️ fk_signs_firma zaten var';
  END IF;
END $$;

-- ============================================
-- 3️⃣ INDEX'LERİ EKLE
-- ============================================

-- 3a. domain_mappings index'leri
CREATE INDEX IF NOT EXISTS idx_domain_mappings_customer_id 
  ON domain_mappings(customer_id);

CREATE INDEX IF NOT EXISTS idx_domain_mappings_sign_id 
  ON domain_mappings(sign_id);

CREATE INDEX IF NOT EXISTS idx_domain_mappings_full_domain 
  ON domain_mappings(full_domain);

-- SSL expiry için composite index (sadece aktif SSL'ler)
CREATE INDEX IF NOT EXISTS idx_domain_mappings_ssl_expiry 
  ON domain_mappings(ssl_certificate_expiry) 
  WHERE ssl_enabled = true;

-- DNS records için GIN index (JSONB query için)
CREATE INDEX IF NOT EXISTS idx_domain_mappings_dns_records 
  ON domain_mappings USING GIN(dns_records);

RAISE NOTICE '✅ domain_mappings index''leri eklendi';

-- 3b. earnings index'leri
CREATE INDEX IF NOT EXISTS idx_earnings_firma_id 
  ON earnings(firma_id);

CREATE INDEX IF NOT EXISTS idx_earnings_tabela_group_id 
  ON earnings(tabela_group_id);

CREATE INDEX IF NOT EXISTS idx_earnings_donem 
  ON earnings(donem);

-- Aktif hakediş kayıtları için
CREATE INDEX IF NOT EXISTS idx_earnings_aktif_donem 
  ON earnings(donem, aktif) 
  WHERE aktif = true;

RAISE NOTICE '✅ earnings index''leri eklendi';

-- 3c. signs index'leri
CREATE INDEX IF NOT EXISTS idx_signs_firma_id 
  ON signs(firma_id);

CREATE INDEX IF NOT EXISTS idx_signs_urun 
  ON signs(urun);

-- JSONB index'ler (bank_ids, kart_program_ids)
CREATE INDEX IF NOT EXISTS idx_signs_bank_ids 
  ON signs USING GIN(bank_ids);

CREATE INDEX IF NOT EXISTS idx_signs_kart_program_ids 
  ON signs USING GIN(kart_program_ids);

RAISE NOTICE '✅ signs index''leri eklendi';

-- 3d. customers index'leri
CREATE INDEX IF NOT EXISTS idx_customers_sales_rep_id 
  ON customers(sales_rep_id);

CREATE INDEX IF NOT EXISTS idx_customers_cari_hesap_kodu 
  ON customers(cari_hesap_kodu);

CREATE INDEX IF NOT EXISTS idx_customers_domain 
  ON customers(domain);

-- JSONB index'ler
CREATE INDEX IF NOT EXISTS idx_customers_linked_bank_pf_ids 
  ON customers USING GIN(linked_bank_pf_ids);

RAISE NOTICE '✅ customers index''leri eklendi';

-- 3e. bank_accounts index'leri
CREATE INDEX IF NOT EXISTS idx_bank_accounts_odeme_kurulusu_tipi 
  ON bank_accounts(odeme_kurulusu_tipi);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_banka_or_pf 
  ON bank_accounts(banka_or_pf);

-- ARRAY index'ler
CREATE INDEX IF NOT EXISTS idx_bank_accounts_agreement_banks 
  ON bank_accounts USING GIN(agreement_banks);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_agreement_ep_ks 
  ON bank_accounts USING GIN(agreement_ep_ks);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_agreement_o_ks 
  ON bank_accounts USING GIN(agreement_o_ks);

RAISE NOTICE '✅ bank_accounts index''leri eklendi';

-- ============================================
-- ✅ BAŞARILI - Transaction COMMIT
-- ============================================
COMMIT;

RAISE NOTICE '🎉 FAZ 2 TAMAMLANDI!';
RAISE NOTICE '📊 Değişiklikler:';
RAISE NOTICE '   - 4 Foreign Key constraint eklendi';
RAISE NOTICE '   - 20+ Index eklendi';
RAISE NOTICE '   - Orphan kayıtlar temizlendi';

-- ============================================
-- SON KONTROL
-- ============================================

-- Foreign key'leri listele
SELECT 
  '🔗 FOREIGN KEYS' as "Kategori",
  tc.table_name as "Tablo",
  kcu.column_name as "Sütun",
  ccu.table_name as "Referans Tablo",
  ccu.column_name as "Referans Sütun"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('domain_mappings', 'earnings', 'signs')
ORDER BY tc.table_name;

-- Index'leri listele
SELECT 
  '📊 INDEXES' as "Kategori",
  tablename as "Tablo",
  indexname as "Index Adı",
  indexdef as "Tanım"
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('domain_mappings', 'earnings', 'signs', 'customers', 'bank_accounts')
ORDER BY tablename, indexname;