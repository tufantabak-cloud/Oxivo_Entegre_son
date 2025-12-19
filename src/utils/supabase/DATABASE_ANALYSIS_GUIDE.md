# 📊 SUPABASE DATABASE ANALİZ KILAVUZU

## 🎯 Amaç

Bu SQL raporu, Supabase PostgreSQL veritabanınızdaki **tüm tabloları, sütunları, ilişkileri, indexleri ve performans metriklerini** detaylı bir şekilde analiz eder.

---

## 🚀 KULLANIM TALİMATLARI

### Adım 1: Supabase Dashboard'a Giriş Yapın
1. [https://supabase.com](https://supabase.com) adresine gidin
2. Projenizi seçin
3. Sol menüden **"SQL Editor"** sekmesine tıklayın

### Adım 2: SQL Kodunu Kopyalayın
1. `/utils/supabase/FULL_DATABASE_ANALYSIS.sql` dosyasını açın
2. **Tüm içeriği kopyalayın** (Ctrl+A, Ctrl+C)

### Adım 3: SQL Editor'de Çalıştırın
1. Supabase SQL Editor'de **"New Query"** butonuna tıklayın
2. Kopyaladığınız SQL kodunu yapıştırın
3. **"RUN"** butonuna tıklayın veya **Ctrl+Enter** tuşuna basın

### Adım 4: Sonuçları İnceleyin
- SQL birden fazla sorgu içerir
- Her sorgu farklı bir bölümü analiz eder
- Sonuçlar **tablo formatında** görüntülenir

---

## 📋 RAPOR BÖLÜMLERİ

| # | Bölüm | Açıklama | Süre |
|---|-------|----------|------|
| **1** | 📊 Tablo Listesi | Tüm tabloların kayıt sayıları ve boyutları | ⚡ Hızlı |
| **2** | 📋 Sütun Analizi | Her tablonun tüm sütunları ve özellikleri | ⚡ Hızlı |
| **3** | 🔑 Primary Keys | PRIMARY KEY ve UNIQUE constraintler | ⚡ Hızlı |
| **4** | 🔗 Foreign Keys | Tablolar arası ilişkiler | ⚡ Hızlı |
| **5** | 📇 Indexler | Tüm index tanımları ve boyutları | ⚡ Hızlı |
| **6** | 📊 JSONB Analizi | JSONB sütunları ve kullanım amaçları | ⚡ Hızlı |
| **7** | 🗑️ Soft Delete | Soft delete mekanizması analizi | ⚡ Hızlı |
| **8** | ⏰ Timestamps | Tüm tarih/zaman sütunları | ⚡ Hızlı |
| **9** | 🔢 Kayıt Sayıları | Gerçek kayıt sayıları (aktif/silinmiş) | 🐢 Yavaş |
| **10** | 🗺️ İlişki Haritası | Tablolar arası bağlantılar | ⚡ Hızlı |
| **11** | ⚡ Performans | Scan/index kullanım istatistikleri | ⚡ Hızlı |
| **12** | 📊 Özet | Tüm tabloların özet istatistikleri | ⚡ Hızlı |

---

## ⚠️ ÖNEMLİ NOTLAR

### 🐢 Yavaş Çalışan Bölümler
**BÖLÜM 9 (Gerçek Kayıt Sayıları)** yavaş çalışabilir çünkü:
- Her tabloda `COUNT(*)` sorgusu çalıştırır
- Büyük tablolarda dakikalar sürebilir
- İlk seferde bu bölümü **atlayabilirsiniz**

**Çözüm:** İsterseniz BÖLÜM 9'u komut satırı yapın:
```sql
-- BÖLÜM 9'u devre dışı bırakmak için:
-- Satır 299-400 arası /* ile */ arasına alın
```

### ✅ Hızlı Alternatif
BÖLÜM 1'deki **"Tahmini Kayıt"** sütunu çok daha hızlıdır:
- PostgreSQL istatistiklerini kullanır
- %95 doğrulukla tahmin verir
- Saniyeler içinde sonuç döner

---

## 📊 ÖRNEK SONUÇLAR

### Bölüm 1: Tablo Listesi
```
#  | Tablo Adı          | Tahmini Kayıt | Boyut    | Durum
---|--------------------|---------------|----------|----------
1  | bank_accounts      | 45            | 128 kB   | ✅ Aktif
2  | banks              | 12            | 32 kB    | ✅ Aktif
3  | card_programs      | 8             | 24 kB    | ✅ Aktif
4  | customers          | 127           | 256 kB   | ✅ Aktif
5  | earnings           | 23            | 96 kB    | ✅ Aktif
...
```

### Bölüm 2: Sütun Analizi (Örnek)
```
Tablo     | # | Sütun         | Veri Tipi | Nullable | Constraint    | Özellik
----------|---|---------------|-----------|----------|---------------|------------------
customers | 1 | id            | uuid      | NOT NULL | PRIMARY KEY   | 🆔 UUID
customers | 2 | unvan         | text      | NOT NULL | -             | -
customers | 3 | mcc_id        | text      | NULL     | FOREIGN KEY   | -
customers | 4 | is_deleted    | boolean   | NOT NULL | -             | 🗑️ Soft Delete
customers | 5 | created_at    | timestamp | NOT NULL | -             | ⏰ Timestamp
...
```

### Bölüm 4: Foreign Key İlişkileri
```
Ana Tablo     | Ana Sütun    | Referans Tablo | Referans Sütun | ON DELETE
--------------|--------------|----------------|----------------|-------------
customers     | mcc_id       | mcc_codes      | kod            | SET NULL
bank_accounts | customer_id  | customers      | id             | CASCADE
signs         | firma_id     | bank_accounts  | id             | CASCADE
earnings      | firma_id     | bank_accounts  | id             | CASCADE
```

### Bölüm 7: Soft Delete Analizi
```
Tablo              | is_deleted | deleted_at | Delete Stratejisi
-------------------|------------|------------|-------------------
customers          | ✅ VAR     | ✅ VAR     | 🟢 FULL Soft Delete
bank_accounts      | ✅ VAR     | ✅ VAR     | 🟢 FULL Soft Delete
signs              | ✅ VAR     | ✅ VAR     | 🟢 FULL Soft Delete
earnings           | ✅ VAR     | ✅ VAR     | 🟢 FULL Soft Delete
domain_mappings    | ❌ YOK     | ❌ YOK     | 🔴 HARD Delete
```

### Bölüm 10: İlişki Haritası
```
Sıra | Ana Tablo     | Hedef Tablo  | Bağlantı          | İlişki | Açıklama
-----|---------------|--------------|-------------------|--------|----------------------------------
1️⃣   | customers     | bank_accounts| customer_id       | 1:N    | Müşteri → Banka/PF
2️⃣   | bank_accounts | signs        | firma_id          | 1:N    | Firma → TABELA kayıtları
3️⃣   | bank_accounts | earnings     | firma_id          | 1:N    | Firma → HAKEDİŞ kayıtları
4️⃣   | signs         | earnings     | tabela_group_id   | N:N    | TABELA grupları ↔ HAKEDİŞ (KRİTİK!)
...
```

---

## 🎯 KULLANIM SENARYOLARI

### Senaryo 1: Yeni Geliştirici Onboarding
**Amaç:** Veritabanı yapısını öğrenmek
**Çalıştır:** BÖLÜM 1, 2, 10, 12
**Sonuç:** Tablolar, sütunlar ve ilişkiler hakkında genel bakış

### Senaryo 2: Performans Analizi
**Amaç:** Yavaş sorguları tespit etmek
**Çalıştır:** BÖLÜM 5, 11
**Sonuç:** Index kullanımı ve sequential scan oranları

### Senaryo 3: Veri Temizleme
**Amaç:** Silinmiş kayıtları görmek
**Çalıştır:** BÖLÜM 7, 9
**Sonuç:** Soft delete durumu ve gerçek kayıt sayıları

### Senaryo 4: Schema Değişikliği
**Amaç:** Yeni sütun eklemeden önce mevcut yapıyı görmek
**Çalıştır:** BÖLÜM 2, 3, 4, 12
**Sonuç:** Mevcut sütunlar, constraintler ve ilişkiler

### Senaryo 5: Debugging
**Amaç:** "Ekim 2025 grubu boş" hatasını araştırmak
**Çalıştır:**
```sql
-- ÖZEL SORGU (BÖLÜM 9'dan sonra)
SELECT 
    sg.tabela_group_id AS "TABELA Grup ID",
    COUNT(sg.id) AS "TABELA Kayıt Sayısı",
    COUNT(er.id) AS "HAKEDİŞ Kayıt Sayısı"
FROM signs sg
FULL OUTER JOIN earnings er ON er.tabela_group_id = sg.tabela_group_id
WHERE sg.is_deleted = false OR er.is_deleted = false
GROUP BY sg.tabela_group_id
ORDER BY "TABELA Kayıt Sayısı" ASC;
```

---

## 🔧 SORUN GİDERME

### Hata: "permission denied for table ..."
**Çözüm:** Supabase kullanıcınızın `postgres` rolünde olduğundan emin olun.

### Hata: "timeout" veya sorgu çok yavaş
**Çözüm:** BÖLÜM 9'u devre dışı bırakın veya tek başına çalıştırın.

### Hata: "table does not exist"
**Çözüm:** SQL'deki tablo listesini (`IN (...)`) kendi tablolarınıza göre güncelleyin.

### Sonuç: Bazı tablolar eksik
**Çözüm:** SQL'deki tablo listesine (`IN (...)`) eksik tabloları ekleyin:
```sql
-- Satır 31, 60, 129 vb. yerlerde:
AND tablename IN (
    'customers', 'products', 'bank_accounts', 'signs', 'earnings',
    'YENİ_TABLO_ADINIZ_BURAYA'  -- ✅ Ekleyin
)
```

---

## 📝 RAPOR ÇIKTISINI KAYDETME

### Excel'e Aktarma
1. Supabase SQL Editor'de sonuçları görüntüleyin
2. Sağ üst köşedeki **"Download CSV"** butonuna tıklayın
3. CSV dosyasını Excel'de açın

### Google Sheets'e Aktarma
1. CSV dosyasını indirin
2. Google Drive'a yükleyin
3. "Open with → Google Sheets" seçin

### PDF Raporu Oluşturma
1. Sonuçları kopyalayın
2. Google Docs veya Word'e yapıştırın
3. "File → Download → PDF" seçin

---

## 🎓 SON NOTLAR

- **İlk Kez Çalıştırıyorsanız:** Tüm bölümleri sırayla çalıştırın
- **Hızlı Genel Bakış İçin:** Sadece BÖLÜM 1, 10, 12'yi çalıştırın
- **Detaylı Analiz İçin:** Tüm bölümleri çalıştırın (BÖLÜM 9 hariç)
- **Production'da:** BÖLÜM 9'u düşük trafikte çalıştırın

---

## 📞 DESTEK

Sorularınız için:
- **Uygulama:** `/App.tsx` → Console loglarına bakın
- **Database:** Supabase Dashboard → Logs
- **Bu Rapor:** `/utils/supabase/FULL_DATABASE_ANALYSIS.sql`

✅ Başarılar! 🚀
