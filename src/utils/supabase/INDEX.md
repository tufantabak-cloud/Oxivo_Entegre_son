# 📚 SUPABASE SCHEMA VALIDATION - DOSYA İNDEXİ

Bu klasör Supabase veritabanı şemasını doğrulamak için gerekli tüm SQL sorguları ve dokümantasyonu içerir.

---

## 📁 DOSYA YAPISI

```
/utils/supabase/
├── 📘 INDEX.md (bu dosya)
├── 📗 README_SCHEMA_VALIDATION.md
├── 📊 COMPARISON_TEMPLATE.md
├── 🔍 SQL DOSYALARI:
│   ├── minimalCheck.sql ⭐ ÖNERİLİR
│   ├── quickSchemaCheck.sql
│   ├── SCHEMA_VALIDATION_COMPLETE.sql
│   ├── schemaValidator.sql
│   └── schemaValidatorCompact.sql
```

---

## 🎯 HIZLI ERİŞİM

### 1️⃣ YENİ BAŞLIYORSANIZ:
👉 **Önce okuyun:** `README_SCHEMA_VALIDATION.md`

### 2️⃣ HIZLI KONTROL İÇİN:
👉 **Şunu çalıştırın:** `minimalCheck.sql`

### 3️⃣ DETAYLI RAPOR İÇİN:
👉 **Şunu çalıştırın:** `SCHEMA_VALIDATION_COMPLETE.sql`

### 4️⃣ SONUÇLARI RAPORLAMAK İÇİN:
👉 **Şunu kullanın:** `COMPARISON_TEMPLATE.md`

---

## 📄 DOSYA AÇIKLAMALARI

### 📗 README_SCHEMA_VALIDATION.md
**Açıklama:** Kullanım kılavuzu - Tüm SQL dosyalarının nasıl kullanılacağını açıklar  
**Ne zaman kullanılır:** İlk defa kontrol yapıyorsanız veya hatırlamak istiyorsanız  
**Okuma Süresi:** 5 dakika

---

### 📊 COMPARISON_TEMPLATE.md
**Açıklama:** Sonuç raporu şablonu - SQL sonuçlarını buraya doldurarak rapor oluşturun  
**Ne zaman kullanılır:** SQL sorgusunu çalıştırdıktan sonra sonuçları kaydetmek için  
**Doldurma Süresi:** 10-15 dakika

---

### 🔍 SQL DOSYALARI

#### ⭐ minimalCheck.sql (ÖNERİLİR)
**Açıklama:** En hızlı kontrol - Sadece tablo isimleri, sütun sayıları ve kayıt sayıları  
**Ne zaman kullanılır:** Günlük kontrol, hızlı durum tespiti  
**Çalışma Süresi:** < 1 saniye  
**Çıktı:** Tek tablo - 20 satır

**Örnek Çıktı:**
```
📋 Tablo               | 📊 Sütun | 📈 Kayıt
-----------------------+----------+----------
account_items          | 5        | 12
bank_accounts          | 15       | 8
customers              | 18       | 45
...
```

---

#### quickSchemaCheck.sql
**Açıklama:** Orta seviye detay - Tablolar + Primary Keys + Unique Constraints  
**Ne zaman kullanılır:** Haftalık kontrol, constraint doğrulama  
**Çalışma Süresi:** ~2 saniye  
**Çıktı:** Tek tablo - Tüm tablolar ve constraint'leri

**Örnek Çıktı:**
```
Tablo Adı     | Sütunlar                      | Primary Key | Unique Columns | Kayıt
--------------+-------------------------------+-------------+----------------+-------
customers     | id (UUID), cari_adi (TEXT)... | id          | -              | 45
mcc_codes     | id (UUID), kod (TEXT)...      | id          | kod            | 120
```

---

#### SCHEMA_VALIDATION_COMPLETE.sql (EN DETAYLI)
**Açıklama:** Tam doğrulama - 10 farklı rapor (tablolar, sütunlar, constraint'ler, index'ler, JSONB'ler...)  
**Ne zaman kullanılır:** Aylık audit, migration sonrası, tam kontrol gerektiğinde  
**Çalışma Süresi:** ~5 saniye  
**Çıktı:** 10 ayrı tablo - Toplamda 200+ satır

**Raporlar:**
1. 🎯 Genel Durum (özet)
2. 📋 Detaylı Tablo Listesi
3. 📊 Tüm Sütunlar
4. 🔑 Primary Keys
5. 🎯 Unique Constraints
6. 🔗 Foreign Keys
7. 📇 Indexes
8. 📦 JSONB Sütunlar
9. ⚠️ Öneriler (eksik FK'ler)
10. ✅ Final Kontrol (20 tablo kontrolü)

---

#### schemaValidator.sql
**Açıklama:** Modüler sorgular - Her bölüm ayrı ayrı çalıştırılabilir  
**Ne zaman kullanılır:** Özel kontrol gerektiğinde (sadece FK'leri kontrol etmek gibi)  
**Çalışma Süresi:** Değişken (hangi bölümü çalıştırdığınıza bağlı)  
**Çıktı:** 7 ayrı bölüm

**Bölümler:**
1. Tablolar ve Kolonlar
2. Primary Keys
3. Unique Constraints
4. Foreign Keys
5. Indexes
6. Tablo Satır Sayıları
7. Tablo Özet Listesi

---

#### schemaValidatorCompact.sql
**Açıklama:** JSON çıktı - Tüm şemayı tek JSON objesi olarak döker  
**Ne zaman kullanılır:** API entegrasyon, otomatik kontrol scriptleri için  
**Çalışma Süresi:** ~3 saniye  
**Çıktı:** Tek satır - Büyük JSON objesi

**JSON Yapısı:**
```json
{
  "timestamp": "2025-12-10T...",
  "database": "postgres",
  "schema_version": "3.2.0",
  "total_tables": 20,
  "tables": [
    {
      "table_name": "customers",
      "column_count": 18,
      "row_count": 45,
      "columns": [...],
      "primary_keys": ["id"],
      "unique_columns": [],
      "foreign_keys": []
    },
    ...
  ]
}
```

---

## 🚀 KULLANIM SENARYOLARI

### Senaryo 1: İlk Kurulum Sonrası Doğrulama
1. `README_SCHEMA_VALIDATION.md` dosyasını okuyun
2. `SCHEMA_VALIDATION_COMPLETE.sql` çalıştırın
3. `COMPARISON_TEMPLATE.md` dosyasını doldurun
4. Sonuçları geliştiriciyle paylaşın

**Tahmini Süre:** 20 dakika

---

### Senaryo 2: Günlük Sağlık Kontrolü
1. `minimalCheck.sql` çalıştırın
2. 20 tablo var mı kontrol edin
3. Kayıt sayıları mantıklı mı kontrol edin

**Tahmini Süre:** 1 dakika

---

### Senaryo 3: Migration Sonrası Doğrulama
1. Migration öncesi `SCHEMA_VALIDATION_COMPLETE.sql` çalıştırın (ÖNCE)
2. Migration'ı uygulayın
3. Migration sonrası `SCHEMA_VALIDATION_COMPLETE.sql` çalıştırın (SONRA)
4. Sonuçları karşılaştırın
5. `COMPARISON_TEMPLATE.md` doldurun

**Tahmini Süre:** 30 dakika

---

### Senaryo 4: Sorun Giderme
1. Hangi tablo/sütunda sorun var belirleyin
2. `schemaValidator.sql` dosyasında ilgili bölümü bulun
3. Sadece o bölümü çalıştırın
4. Sorunu tespit edin ve düzeltin

**Tahmini Süre:** 5-10 dakika

---

### Senaryo 5: Otomasyonlu Kontrol (Gelişmiş)
1. `schemaValidatorCompact.sql` çalıştırın
2. JSON çıktısını kaydedin
3. Python/Node.js script ile parse edin
4. Beklenen şema ile karşılaştırın
5. Farkları otomatik raporlayın

**Tahmini Süre:** Script kurulumu 1 saat, sonrası otomatik

---

## 📊 KARŞILAŞTIRMA TABLOSU

| Dosya | Hız | Detay Seviyesi | Kullanım | Çıktı Formatı |
|-------|-----|----------------|----------|---------------|
| `minimalCheck.sql` | ⚡⚡⚡ | ⭐ | Günlük | Tablo |
| `quickSchemaCheck.sql` | ⚡⚡ | ⭐⭐ | Haftalık | Tablo |
| `SCHEMA_VALIDATION_COMPLETE.sql` | ⚡ | ⭐⭐⭐⭐⭐ | Aylık/Audit | 10 Tablo |
| `schemaValidator.sql` | ⚡⚡ | ⭐⭐⭐⭐ | Modüler | 7 Tablo |
| `schemaValidatorCompact.sql` | ⚡ | ⭐⭐⭐⭐⭐ | API/Otomasyon | JSON |

---

## 🎯 ÖNERİLEN İŞ AKIŞI

### 🟢 1. HAFTA: İlk Kurulum
```
1. README_SCHEMA_VALIDATION.md oku
2. SCHEMA_VALIDATION_COMPLETE.sql çalıştır
3. DATABASE_SCHEMA_MAP.md ile karşılaştır
4. COMPARISON_TEMPLATE.md doldur
5. Sonuçları kaydet (baseline)
```

### 🔵 2. HAFTA: Haftalık Kontrol
```
1. quickSchemaCheck.sql çalıştır
2. Constraint'leri kontrol et
3. Kayıt sayıları mantıklı mı bak
```

### 🟡 HER GÜN: Hızlı Kontrol
```
1. minimalCheck.sql çalıştır
2. 20 tablo var mı kontrol et
```

### 🔴 MIGRATION SONRASI: Tam Doğrulama
```
1. SCHEMA_VALIDATION_COMPLETE.sql çalıştır
2. ÖNCE ve SONRA sonuçları karşılaştır
3. COMPARISON_TEMPLATE.md doldur
```

---

## ⚠️ ÖNEMLİ NOTLAR

### 1. SQL Editor Kullanımı
- Supabase Dashboard → SQL Editor
- Query'leri kopyalayıp yapıştırın
- RUN butonuna basın (veya Ctrl+Enter / Cmd+Enter)

### 2. Sonuçları Kaydetme
- CSV olarak indir (Download CSV)
- Screenshot al
- Veya metin olarak kopyala

### 3. Güvenlik
- SQL Editor otomatik olarak Service Role Key kullanır
- Public API Key ile çalışmaz
- Sadece read-only sorgular kullanın

### 4. Performans
- Büyük veritabanlarında sorgular yavaş olabilir
- `minimalCheck.sql` her zaman hızlıdır
- `SCHEMA_VALIDATION_COMPLETE.sql` 5-10 saniye alabilir

---

## 📞 YARDIM VE DESTEK

### Sorun mu yaşıyorsunuz?

1. **"Permission denied" hatası:**
   - SQL Editor'de çalıştırdığınızdan emin olun
   - Service Role Key aktif mi kontrol edin

2. **"Relation does not exist" hatası:**
   - Tablo henüz oluşturulmamış olabilir
   - Tablo adını kontrol edin (snake_case mi?)

3. **Sonuçlar boş:**
   - `WHERE table_schema = 'public'` doğru mu kontrol edin
   - Veritabanında veri var mı kontrol edin

4. **Çok yavaş:**
   - `minimalCheck.sql` kullanın
   - Veya sorguyu bölümlere ayırın

---

## 🔄 GÜNCELLENMİŞ DOSYALAR

### Versiyon 3.2.0 (2025-12-10)
- ✅ 5 SQL dosyası eklendi
- ✅ README ve template dosyaları oluşturuldu
- ✅ INDEX.md eklendi
- ✅ 20 tablo doğrulama kontrolü eklendi

---

## 📝 YAPILACAKLAR (TODO)

- [ ] Otomatik doğrulama script'i (Python/Node.js)
- [ ] CI/CD entegrasyonu
- [ ] Slack/Email bildirim sistemi
- [ ] Grafik raporlama (chart.js)
- [ ] Version diff (önceki şema ile karşılaştırma)

---

**Son Güncelleme:** 2025-12-10  
**Versiyon:** 3.2.0  
**Bakım:** Aktif
