# ✅ Supabase Proje Değişikliği Tamamlandı

**Tarih:** 2025-11-23  
**Değişiklik:** Kod `okgeyuhmumlkkcpoholh` projesine yönlendirildi

---

## 🔄 Yapılan Değişiklikler

### ❌ ESKİ (Silinmeyen, Sadece Değiştirilen)
- **Proje ID:** `tveqpmzgqtoyagtpapev`
- **URL:** `https://tveqpmzgqtoyagtpapev.supabase.co`
- **Durum:** Artık kullanılmıyor

### ✅ YENİ (Aktif)
- **Proje ID:** `okgeyuhmumlkkcpoholh`
- **URL:** `https://okgeyuhmumlkkcpoholh.supabase.co`
- **Durum:** Kod şimdi buraya bağlanıyor

---

## 📁 Güncellenen Dosyalar

1. **`/utils/supabaseClient.ts`**
   - `PROJECT_ID`: `"okgeyuhmumlkkcpoholh"`
   - `ANON_KEY`: `"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
   - `storageKey`: `'sb-okgeyuhmumlkkcpoholh-auth-token'`

2. **`/lib/supabase/info.tsx`**
   - `projectId`: `"okgeyuhmumlkkcpoholh"`
   - `publicAnonKey`: `"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`

3. **`/utils/supabase/info.tsx`**
   - ✅ Zaten doğruydu, değişiklik yapılmadı

---

## 🎯 Şimdi Ne Yapacaksınız?

### 1️⃣ SQL Script'i Çalıştırın (ÖNEMLİ!)

**DOĞRU projede SQL çalıştırmanız gerekiyor:**

1. Gidin: https://supabase.com/dashboard/project/okgeyuhmumlkkcpoholh
2. Sol menü → **"SQL Editor"**
3. **"+ New query"** butonuna basın
4. Aşağıdaki kodu kopyalayıp yapıştırın:

```sql
-- customers tablosunu oluştur
DROP TABLE IF EXISTS public.customers CASCADE;

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  cari_hesap_kodu text NOT NULL,
  sektor text,
  mcc text,
  cari_adi text NOT NULL,
  guncel_my_payter_domain text,
  vergi_dairesi text,
  vergi_no text,
  adres text,
  ilce text,
  posta_kodu text,
  email text,
  yetkili text,
  tel text,
  durum text DEFAULT 'Aktif',
  p6x text,
  apollo text,
  sales_rep_id text,
  sales_rep_name text,
  bloke_durumu boolean DEFAULT false,
  sorumlu_kisi text,
  cari_grubu text,
  kayit_tarihi text,
  musteri_tipi text,
  domain text,
  ignore_main_domain boolean DEFAULT false,
  ignore_main_domain_note text,
  subscription_fee numeric,
  
  domain_hierarchy jsonb,
  linked_bank_pf_ids jsonb,
  bank_device_assignments jsonb,
  service_fee_settings jsonb,
  device_subscriptions jsonb,
  service_fee_invoices jsonb,
  payment_reminders jsonb,
  reminder_settings jsonb,
  suspension_history jsonb
);

CREATE INDEX idx_customers_cari_hesap_kodu ON customers(cari_hesap_kodu);
CREATE INDEX idx_customers_cari_adi ON customers(cari_adi);
CREATE INDEX idx_customers_durum ON customers(durum);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON customers FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

5. **"RUN"** butonuna basın
6. Yeşil "Success" mesajını bekleyin

---

### 2️⃣ Uygulamayı Yeniden Başlatın

1. **Tarayıcıyı TAMAMEN kapatın** (tüm sekmeler)
2. Yeniden açın
3. Uygulamaya giriş yapın
4. **F12** basıp Console'a bakın

**Görmek istediğiniz:**
```
✅ System health check passed
☁️ Auto-syncing 352 customers to Supabase...
📤 Converting 352 customers to snake_case...
✅ Created 352 customers in Supabase
✅ Auto-sync successful: 352 customers synced to Supabase
```

---

### 3️⃣ Supabase'de Doğrulayın

1. Gidin: https://supabase.com/dashboard/project/okgeyuhmumlkkcpoholh
2. Sol menü → **"Table Editor"**
3. **"customers"** tablosuna tıklayın
4. **352 kayıt** görmelisiniz

---

## 🔍 Troubleshooting

### ❌ "table 'customers' not found" Hatası

**Çözüm:** SQL script'i çalıştırmayı unutmuşsunuzdur.
- Adım 1'deki SQL'i tekrar çalıştırın
- Uygulamayı yeniden başlatın

### ❌ "Connection refused" Hatası

**Çözüm:** Supabase projesi duraklatılmış olabilir.
- Dashboard'a gidin
- Proje aktif mi kontrol edin
- Gerekirse "Resume project" deyin

### ❌ Veriler sync olmuyor

**Çözüm:** localStorage temizleyin ve JSON'u tekrar import edin.
1. Console'da: `localStorage.clear()`
2. Sayfayı yenileyin
3. JSON dosyasını tekrar import edin

---

## 📊 Karşılaştırma Tablosu

| Özellik | Eski Proje | Yeni Proje |
|---------|-----------|-----------|
| **Proje ID** | tveqpmzgqtoyagtpapev | okgeyuhmumlkkcpoholh |
| **URL** | https://tveqpmzgqtoyagtpapev.supabase.co | https://okgeyuhmumlkkcpoholh.supabase.co |
| **customers tablosu** | ❌ Yok veya yanlış | ✅ SQL ile oluşturulacak |
| **Kod bağlantısı** | ❌ Eski | ✅ Yeni (güncellendi) |

---

## ✅ Başarı Kriterleri

Aşağıdaki 5 madde tamamlanırsa sorun çözülmüş demektir:

- [ ] SQL script'i **okgeyuhmumlkkcpoholh** projesinde çalıştırıldı
- [ ] Supabase Table Editor'de `customers` tablosu görünüyor
- [ ] Uygulama yeniden başlatıldı
- [ ] Console'da "✅ Auto-sync successful: 352 customers" mesajı var
- [ ] Table Editor'de 352 müşteri kaydı var

---

## 🔐 Güvenlik Notu

**ANON KEY'ler güvenli mi?**
✅ Evet! Anon key'ler frontend'de kullanılmak için tasarlanmıştır.
✅ Row Level Security (RLS) ile korunurlar.
⚠️ Production'da RLS policy'lerini sıkılaştırın!

---

## 📝 Commit Mesajı (Referans)

```
feat: Switch Supabase project to okgeyuhmumlkkcpoholh

- Update PROJECT_ID and ANON_KEY in supabaseClient.ts
- Update projectId in lib/supabase/info.tsx
- Update auth storage key to new project
- Previous project (tveqpmzgqtoyagtpapev) no longer used
- Customer table SQL script must be run in new project
```

---

**Hazırlayan:** AI Assistant  
**Tarih:** 2025-11-23  
**Durum:** ✅ Kod güncellemesi tamamlandı - SQL çalıştırılması bekleniyor
