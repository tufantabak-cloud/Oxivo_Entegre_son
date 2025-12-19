-- =====================================================
-- Customer Documents Table (Müşteri Evrakları)
-- =====================================================
-- Created: 2024-12-04
-- Purpose: Müşterilerin zorunlu evraklarını takip etmek için
--          (Vergi levhası, ticaret sicil gazetesi, faaliyet belgesi vb.)

CREATE TABLE IF NOT EXISTS customer_documents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- İlişkiler
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Evrak Bilgileri
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
    'vergi_levhasi',           -- Vergi Levhası (ZORUNLU)
    'ticaret_sicil_gazetesi',  -- Ticaret Sicil Gazetesi (ZORUNLU)
    'faaliyet_belgesi',        -- Faaliyet Belgesi (OPSİYONEL)
    'imza_sirküleri',          -- İmza Sirkuleri
    'other'                    -- Diğer evraklar
  )),
  
  -- Dosya Bilgileri
  file_name VARCHAR(255) NOT NULL,                    -- Orijinal dosya adı
  file_path TEXT NOT NULL,                            -- Supabase Storage'daki path
  file_size INTEGER,                                  -- Dosya boyutu (bytes)
  file_type VARCHAR(50),                              -- MIME type (application/pdf, image/jpeg vb.)
  
  -- Durum
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Bekliyor (yüklendi ama kontrol edilmedi)
    'approved',     -- Onaylandı
    'rejected',     -- Reddedildi
    'expired'       -- Süresi doldu
  )),
  
  -- Zorunluluk
  is_required BOOLEAN DEFAULT false,                  -- Zorunlu evrak mı?
  
  -- İnceleme Notları
  notes TEXT,                                         -- Yönetici notları
  reviewed_by TEXT,                                   -- İnceleyen kullanıcı
  reviewed_at TIMESTAMP WITH TIME ZONE,               -- İnceleme tarihi
  
  -- Geçerlilik
  expiry_date DATE,                                   -- Geçerlilik süresi (varsa)
  
  -- Metadata
  uploaded_by TEXT,                                   -- Yükleyen kullanıcı
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexler
  CONSTRAINT unique_customer_document UNIQUE (customer_id, document_type, created_at)
);

-- Indexler
CREATE INDEX idx_customer_documents_customer ON customer_documents(customer_id);
CREATE INDEX idx_customer_documents_type ON customer_documents(document_type);
CREATE INDEX idx_customer_documents_status ON customer_documents(status);
CREATE INDEX idx_customer_documents_created ON customer_documents(created_at DESC);

-- Updated_at trigger
CREATE TRIGGER update_customer_documents_updated_at
  BEFORE UPDATE ON customer_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (Row Level Security)
ALTER TABLE customer_documents ENABLE ROW LEVEL SECURITY;

-- SELECT: Tüm authenticated kullanıcılar görebilir
CREATE POLICY "Allow authenticated users to view documents"
  ON customer_documents FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Tüm authenticated kullanıcılar ekleyebilir
CREATE POLICY "Allow authenticated users to upload documents"
  ON customer_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Tüm authenticated kullanıcılar güncelleyebilir
CREATE POLICY "Allow authenticated users to update documents"
  ON customer_documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: Tüm authenticated kullanıcılar silebilir
CREATE POLICY "Allow authenticated users to delete documents"
  ON customer_documents FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- Supabase Storage Bucket için NOT
-- =====================================================
-- Supabase Dashboard'dan manuel olarak şu bucket'ı oluşturun:
-- 
-- Bucket Name: customer-documents
-- Public: false (private bucket)
-- File size limit: 5MB
-- Allowed MIME types: application/pdf, image/jpeg, image/png, image/jpg
--
-- Storage Policies:
-- 1. SELECT: authenticated users can read
-- 2. INSERT: authenticated users can upload
-- 3. UPDATE: authenticated users can update
-- 4. DELETE: authenticated users can delete
-- =====================================================

COMMENT ON TABLE customer_documents IS 'Müşteri evrakları (vergi levhası, ticaret sicil gazetesi vb.)';
COMMENT ON COLUMN customer_documents.document_type IS 'Evrak tipi: vergi_levhasi, ticaret_sicil_gazetesi, faaliyet_belgesi vb.';
COMMENT ON COLUMN customer_documents.file_path IS 'Supabase Storage bucket path (customer-documents/...)';
COMMENT ON COLUMN customer_documents.is_required IS 'Zorunlu evrak mı? (vergi_levhasi ve ticaret_sicil_gazetesi zorunlu)';