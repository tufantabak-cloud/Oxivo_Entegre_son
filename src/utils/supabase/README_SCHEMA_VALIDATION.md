# 🔍 SUPABASE SCHEMA VALIDATION - KULLANIM KILAVUZU

## 📋 AMAÇ
Supabase veritabanınızdaki mevcut şemayı kontrol etmek ve `DATABASE_SCHEMA_MAP.md` dosyasının güncel olup olmadığını doğrulamak.

---

## 🚀 HIZLI BAŞLANGIÇ

### Adım 1: Supabase Dashboard'a Gidin
1. Tarayıcınızda Supabase Dashboard'u açın
2. Projenizi seçin
3. Sol menüden **SQL Editor**'e tıklayın

### Adım 2: SQL Sorgusunu Seçin

**ÜÇ SEÇENEK VAR:**

#### 🟢 SEÇENEK 1: Minimal Check (En Hızlı - ÖNERİLİR)
```sql
-- minimalCheck.sql dosyasını açın ve içeriği kopyalayıp yapıştırın
-- Sadece tablo isimlerini, sütun sayılarını ve kayıt sayılarını gösterir
```

#### 🟡 SEÇENEK 2: Quick Schema Check (Orta Seviye)
```sql
-- quickSchemaCheck.sql dosyasını açın
-- Tabloları ve temel constraint'leri gösterir
```

#### 🔴 SEÇENEK 3: Complete Validation (En Detaylı)
```sql
-- SCHEMA_VALIDATION_COMPLETE.sql dosyasını açın
-- TÜM detayları gösterir (10 farklı rapor)
```

### Adım 3: Sorguyu Çalıştırın
1. SQL Editor'e yapıştırın
2. **RUN** butonuna basın (veya Ctrl+Enter / Cmd+Enter)
3. Sonuçları inceleyin

---

## 📊 BEKLENEN SONUÇLAR

### ✅ BAŞARILI DURUM:
```
Toplam Tablo: 20
```

**TABLO LİSTESİ (Alfabetik):**
1. ✅ account_items
2. ✅ additional_revenues
3. ✅ bank_accounts
4. ✅ banks
5. ✅ customers
6. ✅ documents
7. ✅ domain_mappings
8. ✅ earnings
9. ✅ epk_institutions
10. ✅ fixed_commissions
11. ✅ job_titles
12. ✅ kart_programlar
13. ✅ mcc_codes
14. ✅ ok_institutions
15. ✅ partnerships
16. ✅ products
17. ✅ sales_representatives
18. ✅ sharing
19. ✅ signs
20. ✅ suspension_reasons

---

## 🔍 KONTROL NOKTALARI

### 1️⃣ PRIMARY KEYS
**Tüm tablolarda `id` sütunu UUID olmalı:**
```sql
-- Beklenen:
id UUID NOT NULL DEFAULT gen_random_uuid()
```

### 2️⃣ UNIQUE CONSTRAINTS
**Aşağıdaki tablolarda `kod` sütunu UNIQUE olmalı:**
- ✅ `mcc_codes.kod`
- ✅ `banks.kod`
- ✅ `epk_institutions.kod`
- ✅ `ok_institutions.kod`

### 3️⃣ FOREIGN KEYS (Opsiyonel - Şu anda runtime enrichment kullanılıyor)
**Eksik olabilir (Normal):**
- `signs.firma_id` → `bank_accounts.id`
- `earnings.firma_id` → `bank_accounts.id`
- `kart_programlar.banka_id` → `banks.id`

**Neden eksik?**
Bu ilişkiler **App.tsx'de runtime'da enrichment** ile yapılıyor:
```typescript
// App.tsx satır ~310-330
const signsByFirmaId = new Map();
signsResult.data.forEach(sign => {
  if (sign.firmaId) {
    const existing = signsByFirmaId.get(sign.firmaId) || [];
    signsByFirmaId.set(sign.firmaId, [...existing, sign]);
  }
});
```

### 4️⃣ JSONB SÜTUNLAR
**Aşağıdaki tablolarda JSONB sütunlar olmalı:**

**customers:**
- `linked_bank_pf_ids` JSONB

**bank_accounts:**
- `agreement_banks` JSONB
- `agreement_epks` JSONB
- `agreement_oks` JSONB
- `isbirlikleri` JSONB

**signs:**
- `kurulus` JSONB
- `gelir_modeli` JSONB
- `komisyon_oranlari` JSONB
- `hazine_geliri` JSONB (nullable)
- `ek_gelir_detay` JSONB (nullable)
- `paylasim_oranlari` JSONB
- `kart_program_ids` JSONB

**earnings:**
- `detaylar` JSONB

### 5️⃣ TIMESTAMP SÜTUNLAR
**Tüm tablolarda olmalı:**
- `created_at` TIMESTAMP DEFAULT now()
- `updated_at` TIMESTAMP DEFAULT now()

**signs tablosunda ek:**
- `olusturma_tarihi` TIMESTAMP
- `kapanma_tarihi` TIMESTAMP (nullable)

---

## 📤 SONUÇLARI PAYLAŞMA

### Yöntem 1: CSV Export
1. Sorgu sonuçlarının sağ üstünde **Download CSV** butonuna tıklayın
2. Dosyayı kaydedin

### Yöntem 2: Screenshot
1. Sorgu sonuçlarının ekran görüntüsünü alın
2. Geliştiriciyle paylaşın

### Yöntem 3: Metin Kopyala
1. Sonuçları seçin (Ctrl+A / Cmd+A)
2. Kopyalayın (Ctrl+C / Cmd+C)
3. Bir metin dosyasına yapıştırın

---

## ⚠️ SORUN GİDERME

### Hata: "permission denied for table"
**Çözüm:** Supabase Service Role Key kullanıyor olmalısınız. SQL Editor otomatik olarak kullanır.

### Hata: "relation does not exist"
**Çözüm:** Tablo henüz oluşturulmamış. Supabase Migration'ları kontrol edin.

### Toplam Tablo 20'den Az
**Çözüm:** Eksik tabloları manuel olarak oluşturun veya migration çalıştırın.

### JSONB Sütunlar Eksik
**Çözüm:** Supabase Table Editor'de sütunu ekleyin:
```sql
ALTER TABLE table_name 
ADD COLUMN column_name JSONB DEFAULT '[]'::jsonb;
```

---

## 🔄 DATABASE_SCHEMA_MAP.md GÜNCELLEME

### Sonuçlar Eşleşiyorsa:
✅ `DATABASE_SCHEMA_MAP.md` dosyası güncel!

### Farklar Varsa:
1. Eksik tabloları tespit edin
2. Eksik sütunları tespit edin
3. Veri tiplerini karşılaştırın
4. `DATABASE_SCHEMA_MAP.md` dosyasını güncelleyin

---

## 📝 SQL DOSYALARI

| Dosya | Açıklama | Kullanım |
|-------|----------|----------|
| `minimalCheck.sql` | En hızlı kontrol | Günlük kullanım |
| `quickSchemaCheck.sql` | Orta seviye detay | Haftalık kontrol |
| `SCHEMA_VALIDATION_COMPLETE.sql` | Tam detay | Aylık audit |
| `schemaValidator.sql` | Modüler sorgular | Özel kontrol |
| `schemaValidatorCompact.sql` | JSON çıktı | API entegrasyon |

---

## 🎯 ÖNERİLEN KONTROL SIKLIĞI

- **Günlük:** `minimalCheck.sql` - Hızlı tablo kontrolü
- **Haftalık:** `quickSchemaCheck.sql` - Constraint kontrolü
- **Aylık:** `SCHEMA_VALIDATION_COMPLETE.sql` - Tam audit
- **Migration Sonrası:** `SCHEMA_VALIDATION_COMPLETE.sql` - Zorunlu

---

## 📞 DESTEK

Sorularınız için:
1. `DATABASE_SCHEMA_MAP.md` dosyasını inceleyin
2. Supabase Documentation: https://supabase.com/docs
3. Geliştirici ekibine ulaşın

---

**Son Güncelleme:** 2025-12-10  
**Versiyon:** 3.2.0
