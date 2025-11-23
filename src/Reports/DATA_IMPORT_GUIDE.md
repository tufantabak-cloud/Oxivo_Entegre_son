# 📥 Supabase Veri İçe Aktarma Rehberi

## 🚀 Hızlı Başlangıç

Uygulamanızı yayına aldıktan sonra, artık verilerinizi Supabase'e aktarabilirsiniz!

### 1️⃣ Tarayıcıdan İçe Aktarma (Önerilen - En Kolay)

1. Uygulamayı açın: https://oxivo-entegre-son.vercel.app
2. **Tanımlar** modülüne gidin
3. **📥 Veri İçe Aktar** tab'ına tıklayın
4. Excel veya JSON dosyanızı seçin
5. Aktarım otomatik olarak başlar!

**Avantajlar:**
- ✅ Kolay kullanım - Kod bilgisi gerektirmez
- ✅ Progress bar ile takip
- ✅ Hata raporlama
- ✅ Duplicate kontrolü otomatik

---

## 📄 Desteklenen Dosya Formatları

### Excel (.xlsx, .xls)
```
İlk sayfa kullanılır
Başlıklar ilk satırda olmalı
```

### JSON (.json)
```json
// Array formatı
[
  { "musteriKodu": "M001", "firmaUnvan": "Örnek Ltd." },
  { "musteriKodu": "M002", "firmaUnvan": "Test A.Ş." }
]

// Object formatı
{
  "customers": [...],
  "products": [...],
  "bankpf": [...]
}
```

---

## 📋 Veri Mapping Kuralları

### 1. Müşteriler (Customers)

#### Excel Sütun Adları (Desteklenen)
- `musteriKodu` / `customerCode` / `customer_code` → customer_code
- `firmaUnvan` / `name` / `firma_unvan` → name
- `vergiDairesi` / `taxOffice` / `tax_office` → tax_office
- `vergiNo` / `taxNumber` / `tax_number` → tax_number
- `telefon` / `phone` → phone
- `email` / `eposta` → email
- `adres` / `address` → address
- `il` / `city` → city
- `ilce` / `district` → district
- `durum` / `status` → status
- `temsilci` / `salesRep` / `sales_rep` → sales_rep
- `cihazSayisi` / `deviceCount` / `device_count` → device_count
- `aylikGelir` / `monthlyRevenue` / `monthly_revenue` → monthly_revenue
- `sozlesmeBaslangic` / `contractStartDate` / `contract_start_date` → contract_start_date
- `notlar` / `notes` → notes

#### Örnek Excel Yapısı
```
| musteriKodu | firmaUnvan      | vergiNo    | telefon         | email           | durum |
|-------------|-----------------|------------|-----------------|-----------------|-------|
| M001        | Örnek Ltd.      | 1234567890 | 0212 XXX XX XX  | info@ornek.com  | Aktif |
| M002        | Test A.Ş.       | 9876543210 | 0216 YYY YY YY  | info@test.com   | Aktif |
```

#### Örnek JSON
```json
[
  {
    "musteriKodu": "M001",
    "firmaUnvan": "Örnek Ltd. Şti.",
    "vergiDairesi": "Kadıköy",
    "vergiNo": "1234567890",
    "telefon": "0212 XXX XX XX",
    "email": "info@ornek.com",
    "adres": "Acıbadem Mah. Çeçen Sok. No:25",
    "il": "İstanbul",
    "ilce": "Kadıköy",
    "durum": "Aktif",
    "temsilci": "Ahmet Yılmaz",
    "cihazSayisi": 5,
    "aylikGelir": 2500,
    "sozlesmeBaslangic": "2024-01-15",
    "notlar": "VIP müşteri"
  }
]
```

---

### 2. Ürünler (Products)

#### Excel Sütun Adları
- `serialNumber` / `seriNo` / `serial_number` → serial_number
- `urunAdi` / `productName` / `product_name` → product_name
- `model` → model
- `marka` / `brand` → brand
- `musteriId` / `customerId` / `customer_id` → customer_id
- `durum` / `status` → status
- `kurulumTarihi` / `installationDate` / `installation_date` → installation_date
- `aylikUcret` / `monthlyFee` / `monthly_fee` → monthly_fee
- `notlar` / `notes` → notes

#### Örnek Excel
```
| serialNumber | urunAdi        | marka   | model  | aylikUcret | durum |
|--------------|----------------|---------|--------|------------|-------|
| SN001234     | POS Terminal   | Ingenico| iWL250 | 150.00     | Aktif |
| SN005678     | Kart Okuyucu   | PAX     | D200   | 100.00     | Aktif |
```

#### Örnek JSON
```json
[
  {
    "serialNumber": "SN001234",
    "urunAdi": "POS Terminal",
    "marka": "Ingenico",
    "model": "iWL250",
    "musteriId": "M001",
    "durum": "Aktif",
    "kurulumTarihi": "2024-01-15",
    "aylikUcret": 150.00,
    "notlar": "4G bağlantı"
  }
]
```

---

### 3. Banka/PF Kayıtları

#### Excel Sütun Adları
- `firmaUnvan` / `institutionName` / `institution_name` → institution_name
- `tip` / `type` / `institution_type` → institution_type (Banka/EPK/ÖK)
- `yetkili` / `contactPerson` / `contact_person` → contact_person
- `telefon` / `phone` → phone
- `email` / `eposta` → email
- `adres` / `address` → address
- `il` / `city` → city
- `notlar` / `notes` → notes

#### Örnek Excel
```
| firmaUnvan                  | tip    | yetkili        | telefon         | email              |
|-----------------------------|--------|----------------|-----------------|---------------------|
| Akbank T.A.Ş.               | Banka  | Mehmet Demir   | 0212 XXX XX XX  | mehmet@akbank.com  |
| Papara Elektronik Para A.Ş. | EPK    | Ayşe Kaya      | 0216 YYY YY YY  | ayse@papara.com    |
```

#### Örnek JSON
```json
[
  {
    "firmaUnvan": "Akbank T.A.Ş.",
    "tip": "Banka",
    "yetkili": "Mehmet Demir",
    "telefon": "0212 XXX XX XX",
    "email": "mehmet@akbank.com",
    "adres": "Sabancı Center, Levent",
    "il": "İstanbul",
    "notlar": "Kurumsal müşteri yöneticisi"
  }
]
```

---

## 🔧 Komut Satırından İçe Aktarma (İleri Seviye)

### Gereksinimler
```bash
npm install -g tsx
```

### Environment Variables
```bash
# .env dosyasına ekleyin
VITE_SUPABASE_URL=https://tveqpmzgqtoyagtpapev.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Kullanım
```bash
# Müşterileri içe aktar
npx tsx scripts/supabase-import.ts customers data/musteriler.xlsx

# Ürünleri içe aktar
npx tsx scripts/supabase-import.ts products data/urunler.json

# Banka/PF kayıtlarını içe aktar
npx tsx scripts/supabase-import.ts bankpf data/bankalar.xlsx
```

---

## 📊 İçe Aktarma Davranışı

### Duplicate Handling (Upsert)
- **Müşteriler:** `customer_code` kolonuna göre upsert
- **Ürünler:** `serial_number` kolonuna göre upsert
- **Banka/PF:** Yeni kayıt olarak eklenir

**Upsert Nedir?**  
Eğer kayıt varsa günceller, yoksa ekler. Veri kaybı olmaz!

### Batch Processing
- Veriler 50'şerli gruplar halinde işlenir
- Bir batch başarısız olursa diğerleri devam eder
- Progress bar ile takip edilir

### Error Handling
- Hatalı kayıtlar atlanır
- Hata detayları raporlanır
- Başarılı kayıtlar yine de aktarılır

---

## ✅ Best Practices

### 1. Önce Test Verisi
İlk aktarımda 10-20 satırlık test verisi kullanın:
```bash
✅ Test.xlsx (10 satır) → İnceleme → Hepsini Aktar
❌ Tümü.xlsx (10,000 satır) → Direkt aktarma
```

### 2. Backup Alın
Mevcut verilerinizi yedekleyin:
- Tanımlar > Sistem Ayarları > Veriyi Dışa Aktar

### 3. Veri Temizliği
Excel'de temizlik yapın:
- ✅ Boş satırları silin
- ✅ Başlıkları kontrol edin
- ✅ Tarih formatlarını düzeltin (YYYY-MM-DD)
- ✅ Sayısal alanlarda virgül yerine nokta kullanın

### 4. Encoding
Türkçe karakterler için:
- Excel: **UTF-8 CSV** olarak kaydedin
- JSON: **UTF-8 encoding** kullanın

---

## 🐛 Sık Karşılaşılan Hatalar

### "File is empty"
**Sebep:** Excel'in ilk sayfası boş  
**Çözüm:** Verilerinizi ilk sayfaya taşıyın

### "Invalid date format"
**Sebep:** Tarih formatı yanlış  
**Çözüm:** YYYY-MM-DD formatını kullanın (örn: 2024-01-15)

### "Duplicate key violation"
**Sebep:** Aynı müşteri kodu/seri numarası iki kez  
**Çözüm:** Excel'de COUNTIF ile kontrol edin

### "Foreign key violation"
**Sebep:** customer_id yanlış (ürünler için)  
**Çözüm:** customer_id'leri Supabase'deki id'lerle eşleştirin

---

## 📞 Destek

### Hata Raporlama
1. Browser Console'u açın (F12)
2. Hata mesajını kopyalayın
3. Örnek veri satırı (gizlenmiş) ekleyin
4. Destek ekibine iletin

### Veri Kontrolü
Supabase Dashboard:
1. https://supabase.com/dashboard
2. Table Editor > İlgili tablo
3. Aktarılan verileri inceleyin

---

## 🎉 Başarı Kriterleri

✅ Aktarım tamamlandı mesajı  
✅ Supabase'de veriler görünüyor  
✅ Uygulama listelerinde kayıtlar var  
✅ Müşteri detayları açılıyor  
✅ Raporlarda veriler çıkıyor  

---

## 📝 Örnek Veri Seti

### Hızlı Test İçin Minimal Örnek

**musteriler.json**
```json
[
  {
    "musteriKodu": "TEST001",
    "firmaUnvan": "Test Müşteri A.Ş.",
    "vergiNo": "1234567890",
    "telefon": "0212 XXX XX XX",
    "email": "test@example.com",
    "durum": "Aktif"
  },
  {
    "musteriKodu": "TEST002",
    "firmaUnvan": "Örnek Ltd. Şti.",
    "vergiNo": "9876543210",
    "telefon": "0216 YYY YY YY",
    "email": "ornek@example.com",
    "durum": "Aktif"
  }
]
```

**urunler.json**
```json
[
  {
    "serialNumber": "TEST-SN-001",
    "urunAdi": "Test POS",
    "marka": "Ingenico",
    "model": "iWL250",
    "durum": "Aktif",
    "aylikUcret": 150
  }
]
```

---

**Son Güncelleme:** 2025-11-23  
**Versiyon:** 1.0  
**Destek:** Figma Make AI Integration
