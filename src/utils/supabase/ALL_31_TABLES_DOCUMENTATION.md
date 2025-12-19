# 📚 SUPABASE VERİTABANI - TÜM 31+ TABLO DOKÜMANTASYONU

> **Tarih:** 15 Aralık 2024  
> **Versiyon:** 2185  
> **Toplam Tablo:** 31+  
> **Schema:** public  

---

## 📊 TABLO KATEGORİLERİ

### 🏢 ANA İŞLEM TABLOLARI (8 Tablo)
Ana iş akışlarının yürütüldüğü tablolar.

1. **customers** - Müşteri Cari Kartları
2. **bank_accounts** - Banka/PF Hesapları
3. **signs** - TABELA Kayıtları
4. **earnings** - HAKEDİŞ Kayıtları
5. **products** - Ürün Kataloğu
6. **transactions** - İşlem Kayıtları 🆕
7. **contract_transactions** - Sözleşme İşlemleri 🆕
8. **income_records** - Gelir Kayıtları 🆕

---

### 🏷️ TANIMLAR TABLOLARI (12 Tablo)
Dropdown'lar, kod tabloları ve referans veriler.

9. **mcc_codes** - MCC Kod Tanımları
10. **banks** - Banka Tanımları
11. **epk_institutions** - EPK Kurum Tanımları
12. **ok_institutions** - OK Kurum Tanımları
13. **sales_representatives** - Satış Temsilcileri
14. **job_titles** - Unvan Tanımları
15. **partnerships** - Ortaklık Tanımları
16. **sharings** - Paylaşım Oranları
17. **card_programs** - Kart Program Tanımları
18. **suspension_reasons** - Askı Nedenleri
19. **revenue_models** - Gelir Modelleri 🆕
20. **categories** - Kategori Tanımları 🆕

---

### 📝 ŞABLON TABLOLARI (3 Tablo)
Döküman, email ve SMS şablonları.

21. **contract_templates** - Sözleşme Şablonları 🆕
22. **email_templates** - Email Şablonları 🆕
23. **sms_templates** - SMS Şablonları 🆕

---

### 📄 DÖKÜMAN ve LOG TABLOLARI (4 Tablo)
Dosya yönetimi ve audit trail.

24. **customer_documents** - Müşteri Dökümanları 🆕
25. **contract_transaction_documents** - Sözleşme İşlem Dökümanları 🆕
26. **contract_audit_logs** - Sözleşme Audit Logları 🆕
27. **duplicate_monitoring** - Duplikasyon Takibi 🆕

---

### 🔧 YARDIMCI TABLOLAR (2 Tablo)
Sistem ve yardımcı işlevler.

28. **domain_mappings** - Domain Eşleştirmeleri
29. **petty_cash** - Kasa Yönetimi 🆕

---

### 🔧 SİSTEM TABLOLARI (2+ Tablo)
Supabase ve sistem tabloları.

30. **kv_store_3ff25b67** - Key-Value Store (Sistem)
31. **kv_store_9ec5bbb3** - Key-Value Store 2 (Sistem)

---

## 🆕 YENİ KEŞFEDİLEN 13 TABLO

Önceki analizde olmayan tablolar:

| # | Tablo | Kategori | Amaç |
|---|-------|----------|------|
| 1 | `categories` | Tanımlar | Kategori tanımları |
| 2 | `contract_audit_logs` | Log | Sözleşme değişiklik kayıtları |
| 3 | `contract_templates` | Şablon | Sözleşme şablonları |
| 4 | `contract_transaction_documents` | Döküman | Sözleşme işlem dökümanları |
| 5 | `contract_transactions` | İşlem | Sözleşme işlemleri |
| 6 | `customer_documents` | Döküman | Müşteri dökümanları |
| 7 | `duplicate_monitoring` | Log | Duplikasyon kontrolü |
| 8 | `email_templates` | Şablon | Email şablonları |
| 9 | `income_records` | İşlem | Gelir kayıtları |
| 10 | `petty_cash` | Yardımcı | Kasa yönetimi |
| 11 | `revenue_models` | Tanımlar | Gelir modelleri |
| 12 | `sms_templates` | Şablon | SMS şablonları |
| 13 | `transactions` | İşlem | Genel işlem kayıtları |

---

## 📋 DETAYLI TABLO ANALİZİ

### 🆕 1. `transactions` (İşlem Kayıtları)

**Amaç:** Genel işlem kayıtlarının tutulduğu tablo.

**Muhtemel Sütunlar:**
- `id` - Benzersiz işlem ID
- `customer_id` - Müşteri referansı
- `transaction_type` - İşlem tipi
- `amount` - Tutar
- `transaction_date` - İşlem tarihi
- `status` - Durum
- `is_deleted` - Soft delete
- `created_at`, `updated_at` - Zaman damgaları

**İlişkiler:**
```
transactions.customer_id → customers.id
```

**Kullanım Senaryosu:**
- Müşteri bazlı tüm işlemleri takip etmek
- İşlem raporları oluşturmak
- Finansal analizler yapmak

---

### 🆕 2. `contract_transactions` (Sözleşme İşlemleri)

**Amaç:** Sözleşmeye bağlı işlemlerin kayıtları.

**Muhtemel Sütunlar:**
- `id` - Benzersiz ID
- `contract_id` - Sözleşme referansı
- `transaction_type` - İşlem tipi (ödeme, fatura, vb.)
- `amount` - Tutar
- `transaction_date` - İşlem tarihi
- `status` - Durum
- `notes` - Notlar
- `is_deleted` - Soft delete
- `created_at`, `updated_at` - Zaman damgaları

**İlişkiler:**
```
contract_transactions.contract_id → (muhtemelen bir contract tablosu)
```

**Kullanım Senaryosu:**
- Sözleşme bazlı ödeme takibi
- Fatura yönetimi
- Sözleşme performans analizi

---

### 🆕 3. `income_records` (Gelir Kayıtları)

**Amaç:** Gelir kayıtlarının detaylı tutulması.

**Muhtemel Sütunlar:**
- `id` - Benzersiz ID
- `source` - Gelir kaynağı
- `amount` - Tutar
- `income_date` - Gelir tarihi
- `category_id` - Kategori referansı
- `revenue_model_id` - Gelir modeli referansı
- `description` - Açıklama
- `is_deleted` - Soft delete
- `created_at`, `updated_at` - Zaman damgaları

**İlişkiler:**
```
income_records.category_id → categories.id
income_records.revenue_model_id → revenue_models.id
```

**Kullanım Senaryosu:**
- Detaylı gelir analizi
- Kaynak bazlı raporlama
- Bütçe takibi

---

### 🆕 4. `revenue_models` (Gelir Modelleri)

**Amaç:** Farklı gelir modellerinin tanımlanması.

**Muhtemel Sütunlar:**
- `id` - Benzersiz ID
- `name` - Model adı
- `description` - Açıklama
- `model_type` - Model tipi (komisyon, sabit, karma)
- `parameters` - JSONB - Model parametreleri
- `is_active` - Aktif/Pasif
- `is_deleted` - Soft delete
- `created_at`, `updated_at` - Zaman damgaları

**Kullanım Senaryosu:**
- Farklı gelir modellerini tanımlamak
- TABELA kayıtlarında kullanılmak
- Gelir hesaplama kuralları

---

### 🆕 5. `categories` (Kategoriler)

**Amaç:** Genel kategori tanımları.

**Muhtemel Sütunlar:**
- `id` - Benzersiz ID
- `name` - Kategori adı
- `description` - Açıklama
- `parent_id` - Üst kategori (ağaç yapısı için)
- `category_type` - Kategori tipi
- `is_active` - Aktif/Pasif
- `is_deleted` - Soft delete
- `created_at`, `updated_at` - Zaman damgaları

**Kullanım Senaryosu:**
- Gelir kategorileri
- Gider kategorileri
- Hiyerarşik kategori yapısı

---

### 🆕 6. `petty_cash` (Kasa)

**Amaç:** Kasa yönetimi ve nakit işlemler.

**Muhtemel Sütunlar:**
- `id` - Benzersiz ID
- `cash_date` - İşlem tarihi
- `transaction_type` - Giriş/Çıkış
- `amount` - Tutar
- `description` - Açıklama
- `category_id` - Kategori referansı
- `responsible_person` - Sorumlu kişi
- `is_deleted` - Soft delete
- `created_at`, `updated_at` - Zaman damgaları

**Kullanım Senaryosu:**
- Kasa giriş/çıkış takibi
- Nakit akış yönetimi
- Günlük kasa raporu

---

### 🆕 7. `contract_templates` (Sözleşme Şablonları)

**Amaç:** Standart sözleşme şablonlarının saklanması.

**Muhtemel Sütunlar:**
- `id` - Benzersiz ID
- `name` - Şablon adı
- `description` - Açıklama
- `template_content` - TEXT/JSONB - Şablon içeriği
- `template_type` - Şablon tipi
- `variables` - JSONB - Değişken listesi
- `is_active` - Aktif/Pasif
- `is_deleted` - Soft delete
- `created_at`, `updated_at` - Zaman damgaları

**Kullanım Senaryosu:**
- Standart sözleşme oluşturma
- Değişken değiştirme (merge fields)
- Sözleşme versiyonlama

---

### 🆕 8. `email_templates` (Email Şablonları)

**Amaç:** Email şablonlarının yönetimi.

**Muhtemel Sütunlar:**
- `id` - Benzersiz ID
- `name` - Şablon adı
- `subject` - Email konusu
- `body_html` - HTML içerik
- `body_text` - Metin içerik
- `variables` - JSONB - Değişken listesi
- `category` - Şablon kategorisi
- `is_active` - Aktif/Pasif
- `is_deleted` - Soft delete
- `created_at`, `updated_at` - Zaman damgaları

**Kullanım Senaryosu:**
- Otomatik email gönderimi
- Müşteri bildirimleri
- Sistem email'leri

---

### 🆕 9. `sms_templates` (SMS Şablonları)

**Amaç:** SMS şablonlarının yönetimi.

**Muhtemel Sütunlar:**
- `id` - Benzersiz ID
- `name` - Şablon adı
- `message_content` - SMS içeriği
- `variables` - JSONB - Değişken listesi
- `character_count` - Karakter sayısı
- `category` - Şablon kategorisi
- `is_active` - Aktif/Pasif
- `is_deleted` - Soft delete
- `created_at`, `updated_at` - Zaman damgaları

**Kullanım Senaryosu:**
- Otomatik SMS gönderimi
- Bildirimler
- Hatırlatmalar

---

### 🆕 10. `customer_documents` (Müşteri Dökümanları)

**Amaç:** Müşterilere ait dökümanların saklanması.

**Muhtemel Sütunlar:**
- `id` - Benzersiz ID
- `customer_id` - Müşteri referansı
- `document_type` - Döküman tipi
- `document_name` - Dosya adı
- `file_path` - Dosya yolu (Supabase Storage)
- `file_size` - Dosya boyutu
- `upload_date` - Yükleme tarihi
- `uploaded_by` - Yükleyen kullanıcı
- `is_deleted` - Soft delete
- `created_at`, `updated_at` - Zaman damgaları

**İlişkiler:**
```
customer_documents.customer_id → customers.id
```

**Kullanım Senaryosu:**
- Müşteri evrak yönetimi
- Dosya saklama
- Döküman versiyonlama

---

### 🆕 11. `contract_transaction_documents` (Sözleşme İşlem Dökümanları)

**Amaç:** Sözleşme işlemlerine ait dökümanlar.

**Muhtemel Sütunlar:**
- `id` - Benzersiz ID
- `contract_transaction_id` - Sözleşme işlem referansı
- `document_type` - Döküman tipi
- `document_name` - Dosya adı
- `file_path` - Dosya yolu
- `file_size` - Dosya boyutu
- `upload_date` - Yükleme tarihi
- `is_deleted` - Soft delete
- `created_at`, `updated_at` - Zaman damgaları

**İlişkiler:**
```
contract_transaction_documents.contract_transaction_id → contract_transactions.id
```

**Kullanım Senaryosu:**
- Fatura ekleri
- Ödeme makbuzları
- Sözleşme ekleri

---

### 🆕 12. `contract_audit_logs` (Sözleşme Audit Logları)

**Amaç:** Sözleşme değişikliklerinin takibi.

**Muhtemel Sütunlar:**
- `id` - Benzersiz ID
- `contract_id` - Sözleşme referansı
- `action` - Yapılan işlem (create, update, delete)
- `field_name` - Değişen alan
- `old_value` - Eski değer
- `new_value` - Yeni değer
- `changed_by` - Değiştiren kullanıcı
- `change_date` - Değişiklik tarihi
- `ip_address` - IP adresi
- `created_at` - Zaman damgası

**Kullanım Senaryosu:**
- Sözleşme değişiklik geçmişi
- Compliance ve denetim
- Kullanıcı aktivite takibi

---

### 🆕 13. `duplicate_monitoring` (Duplikasyon Takibi)

**Amaç:** Duplikasyon kontrolü ve izleme.

**Muhtemel Sütunlar:**
- `id` - Benzersiz ID
- `table_name` - İzlenen tablo
- `record_id` - Kayıt ID
- `duplicate_check_field` - Kontrol edilen alan
- `duplicate_value` - Duplike değer
- `status` - Durum (potential, confirmed, resolved)
- `detected_date` - Tespit tarihi
- `resolved_date` - Çözüm tarihi
- `is_deleted` - Soft delete
- `created_at`, `updated_at` - Zaman damgaları

**Kullanım Senaryosu:**
- Duplike kayıt tespiti
- Veri kalitesi kontrolü
- Otomatik uyarılar

---

## 🔗 KRİTİK İLİŞKİLER

### Ana İlişki Zinciri

```
customers (1)
    ↓
bank_accounts (N)
    ↓
    ├─→ signs (N) - TABELA kayıtları
    │   ↕
    └─→ earnings (N) - HAKEDİŞ kayıtları
        ↕ (tabela_group_id ile bağlı)

customers (1)
    ↓
transactions (N)
    ↓
customer_documents (N)

contract_transactions (1)
    ↓
contract_transaction_documents (N)
```

### Yeni İlişkiler

```
categories (1) ← income_records (N)
revenue_models (1) ← income_records (N)
revenue_models (1) ← signs (N) - gelir_modeli referansı

contract_templates (1) → Sözleşme oluşturma
email_templates (1) → Email gönderimi
sms_templates (1) → SMS gönderimi
```

---

## 📊 TABLO İSTATİSTİKLERİ

| Kategori | Tablo Sayısı | Soft Delete | JSONB Kullanımı |
|----------|--------------|-------------|-----------------|
| Ana İşlem | 8 | ✅ Çoğu | ✅ Yüksek |
| Tanımlar | 12 | ✅ Hepsi | ✅ Orta |
| Şablonlar | 3 | ✅ Hepsi | ✅ Yüksek |
| Döküman/Log | 4 | ✅ Çoğu | ✅ Düşük |
| Yardımcı | 2 | ⚠️ Karışık | ✅ Düşük |
| Sistem | 2+ | ❌ Hayır | ✅ Tam |

**TOPLAM:** 31+ Tablo

---

## 🎯 KULLANIM SENARYOLARI

### Senaryo 1: Müşteri İşlemleri
```
customers → bank_accounts → signs → earnings
         → transactions
         → customer_documents
```

### Senaryo 2: Sözleşme Yönetimi
```
contract_templates → Sözleşme oluştur
                  → contract_transactions
                  → contract_transaction_documents
                  → contract_audit_logs
```

### Senaryo 3: Gelir Takibi
```
revenue_models → signs (TABELA gelir modeli)
              → income_records
                  ↓
              categories
```

### Senaryo 4: İletişim Yönetimi
```
email_templates → Müşteriye email gönder
sms_templates → Müşteriye SMS gönder
```

### Senaryo 5: Kasa Yönetimi
```
petty_cash → categories
          → Kasa raporu
```

---

## 🚀 SONRAKİ ADIMLAR

1. **SQL Raporunu Çalıştırın:**
   ```bash
   COMPLETE_DATABASE_ANALYSIS.sql
   ```

2. **Her Tabloyu İnceleyin:**
   - Hangi sütunlar var?
   - Hangi ilişkiler kurulmuş?
   - JSONB alanlarında ne tutuluyor?

3. **Yeni Tabloların Amacını Anlayın:**
   - `transactions` vs `contract_transactions` farkı nedir?
   - `income_records` nasıl kullanılıyor?
   - Şablon tabloları hangi modülde kullanılıyor?

4. **Uygulamada Kullanımı Kontrol Edin:**
   - Hangi tablolar aktif kullanılıyor?
   - Hangi tablolar henüz boş?
   - Realtime listener'lar hangi tabloları dinliyor?

---

**Dokümantasyon Sonu** ✅

Daha detaylı bilgi için **COMPLETE_DATABASE_ANALYSIS.sql** raporunu çalıştırın!
