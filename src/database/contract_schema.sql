-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DSYM (Dijital Sözleşme Yönetim Modülü) - Veritabanı Şeması
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Supabase SQL Editor'de çalıştırın
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. SÖZLEŞME ŞABLONLARı (Template Management)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  content_html TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  
  -- Dinamik Alanlar (Sistemden otomatik dolacak)
  auto_fill_fields JSONB DEFAULT '[]'::jsonb,
  
  -- Manuel Alanlar (Admin doldurur)
  manual_fields JSONB DEFAULT '[]'::jsonb,
  
  is_active BOOLEAN DEFAULT true,
  requires_hard_copy BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. SÖZLEŞME İŞLEMLERİ (Transaction Management)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS contract_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Müşteri Bilgisi
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  sales_rep_id TEXT,
  
  -- Sözleşme Paketi
  transaction_name VARCHAR(255),
  
  -- Durum Takibi
  status VARCHAR(50) DEFAULT 'draft',
  
  -- Gönderim Bilgileri
  unique_token VARCHAR(255) UNIQUE NOT NULL,
  sent_via VARCHAR(50),
  sent_to_email VARCHAR(255),
  sent_to_phone VARCHAR(20),
  sent_at TIMESTAMP,
  expires_at TIMESTAMP,
  
  -- Dijital Onay
  sms_code VARCHAR(6),
  sms_code_sent_at TIMESTAMP,
  sms_verified_at TIMESTAMP,
  digital_signed_at TIMESTAMP,
  digital_signature_ip VARCHAR(45),
  
  -- Hard Copy Takibi
  hard_copy_deadline TIMESTAMP,
  hard_copy_received_at TIMESTAMP,
  hard_copy_notes TEXT,
  
  -- Versiyon Yönetimi
  version INTEGER DEFAULT 1,
  parent_transaction_id UUID REFERENCES contract_transactions(id),
  
  -- Admin Notları
  admin_notes TEXT,
  
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. İŞLEM-ŞABLON İLİŞKİSİ (Çoklu Döküman Desteği)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS contract_transaction_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES contract_transactions(id) ON DELETE CASCADE,
  template_id UUID REFERENCES contract_templates(id),
  
  -- İçerik (Admin düzenlemesi ile birleştirilmiş)
  final_content_html TEXT NOT NULL,
  
  -- Manuel Değerler
  manual_field_values JSONB DEFAULT '{}'::jsonb,
  
  -- PDF
  pdf_url TEXT,
  pdf_hash VARCHAR(64),
  pdf_generated_at TIMESTAMP,
  
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. DENETİM LOGLARI (Audit Trail)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS contract_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES contract_transactions(id) ON DELETE CASCADE,
  
  action VARCHAR(100),
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. EMAIL ŞABLONLARı
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  body_html TEXT,
  
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 6. SMS ŞABLONLARı
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  content TEXT,
  
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- İNDEXLER (Performans)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON contract_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON contract_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_token ON contract_transactions(unique_token);
CREATE INDEX IF NOT EXISTS idx_documents_transaction ON contract_transaction_documents(transaction_id);
CREATE INDEX IF NOT EXISTS idx_audit_transaction ON contract_audit_logs(transaction_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- VARSAYILAN KAYITLAR (Seed Data)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Varsayılan Email Şablonu
INSERT INTO email_templates (name, subject, body_html, is_default)
VALUES (
  'Standart Sözleşme Maili',
  '{{firma_adi}} - Sözleşme Onayı',
  '<html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Sayın {{musteri_adi}},</h2>
      <p>Aşağıdaki dökümanları inceleyip dijital olarak onaylamanız rica olunur.</p>
      <p>Sözleşme linkiniz: <a href="{{link}}">{{link}}</a></p>
      <p><strong>ÖNEMLİ:</strong> Dijital onay sonrasında dökümanları yazdırıp ıslak imzalayarak 5 iş günü içinde adresimize göndermeniz gerekmektedir.</p>
      <br>
      <p>Saygılarımızla,<br>{{firma_adi}}</p>
    </body>
  </html>',
  true
)
ON CONFLICT DO NOTHING;

-- Varsayılan SMS Şablonu
INSERT INTO sms_templates (name, content, is_default)
VALUES (
  'Standart Bilgilendirme',
  'Sayın {{musteri_adi}}, sözleşme dökümanlarınız hazır. Lütfen email adresinizi kontrol edin. {{firma_adi}}',
  true
)
ON CONFLICT DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TAMAMLANDI
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Bu SQL dosyasını Supabase Dashboard > SQL Editor'de çalıştırın
-- 7 tablo + indexler + varsayılan kayıtlar oluşturulacak
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━