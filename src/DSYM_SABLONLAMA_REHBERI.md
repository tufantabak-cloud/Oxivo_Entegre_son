# 📝 DSYM Sözleşme Şablonlama Rehberi

## 🎯 Genel Bakış

DSYM (Dijital Sözleşme Yönetim Modülü) ile sözleşme şablonları oluşturabilir ve müşteri bilgileriyle otomatik doldurabilirsiniz.

## 🔧 Değişken Sistemi

Sözleşme şablonlarınızda aşağıdaki değişkenleri kullanabilirsiniz. Bu değişkenler, müşteri detayında görüntülendiğinde otomatik olarak doldurulur.

### 👤 Müşteri Bilgileri

| Değişken | Açıklama | Örnek Değer |
|----------|----------|-------------|
| `{{MUSTERI_UNVAN}}` | Müşteri ünvanı | ABC Teknoloji A.Ş. |
| `{{MUSTERI_ADI}}` | Müşteri adı (ünvan ile aynı) | ABC Teknoloji A.Ş. |
| `{{CARI_HESAP_KODU}}` | Cari hesap kodu | 120.01.001 |
| `{{VERGI_DAIRESI}}` | Vergi dairesi | Kadıköy Vergi Dairesi |
| `{{VERGI_NO}}` | Vergi numarası | 1234567890 |
| `{{ADRES}}` | Adres | Bağdat Cad. No:123... |
| `{{TELEFON}}` | Telefon | 0216 123 45 67 |
| `{{EMAIL}}` | Email | info@abc.com |
| `{{YETKILI_ADI_SOYADI}}` | Yetkili adı soyadı | Ahmet Yılmaz |

### 📅 Tarih Bilgileri

| Değişken | Açıklama | Örnek Değer |
|----------|----------|-------------|
| `{{BUGUN}}` | Bugünün tarihi (TR format) | 09.12.2024 |
| `{{TARIH}}` | Tarih (BUGUN ile aynı) | 09.12.2024 |
| `{{YIL}}` | Yıl | 2024 |
| `{{AY}}` | Ay (2 basamak) | 12 |
| `{{GUN}}` | Gün (2 basamak) | 09 |

### 🏢 Firma Bilgileri (OXİVO)

| Değişken | Açıklama | Örnek Değer |
|----------|----------|-------------|
| `{{FIRMA_UNVAN}}` | Firma ünvanı | OXİVO Ödeme ve Elektronik Para Hizmetleri A.Ş. |
| `{{FIRMA_ADRES}}` | Firma adresi | Büyükdere Cad. No:127... |
| `{{FIRMA_TELEFON}}` | Firma telefonu | +90 212 123 45 67 |
| `{{FIRMA_EMAIL}}` | Firma emaili | info@oxivo.com.tr |
| `{{FIRMA_VERGI_DAIRESI}}` | Firma vergi dairesi | Mecidiyeköy Vergi Dairesi |
| `{{FIRMA_VERGI_NO}}` | Firma vergi no | 1234567890 |

## 📄 Örnek Şablon

```html
<h1 style="text-align: center;">HİZMET SÖZLEŞMESİ</h1>

<p><strong>TARİH:</strong> {{BUGUN}}</p>

<h2>TARAFLAR</h2>

<p><strong>FİRMA:</strong></p>
<ul>
  <li>Ünvan: {{FIRMA_UNVAN}}</li>
  <li>Adres: {{FIRMA_ADRES}}</li>
  <li>Vergi Dairesi: {{FIRMA_VERGI_DAIRESI}}</li>
  <li>Vergi No: {{FIRMA_VERGI_NO}}</li>
  <li>Telefon: {{FIRMA_TELEFON}}</li>
  <li>Email: {{FIRMA_EMAIL}}</li>
</ul>

<p><strong>MÜŞTERİ:</strong></p>
<ul>
  <li>Ünvan: {{MUSTERI_UNVAN}}</li>
  <li>Cari Hesap Kodu: {{CARI_HESAP_KODU}}</li>
  <li>Adres: {{ADRES}}</li>
  <li>Vergi Dairesi: {{VERGI_DAIRESI}}</li>
  <li>Vergi No: {{VERGI_NO}}</li>
  <li>Telefon: {{TELEFON}}</li>
  <li>Email: {{EMAIL}}</li>
</ul>

<h2>KONU</h2>

<p>
  İşbu sözleşme, {{MUSTERI_UNVAN}} (bundan böyle "Müşteri" olarak anılacaktır) 
  ile {{FIRMA_UNVAN}} (bundan böyle "Firma" olarak anılacaktır) arasında 
  {{BUGUN}} tarihinde akdedilmiştir.
</p>

<h2>HÜKÜMLER</h2>

<p><strong>Madde 1 - Sözleşmenin Konusu</strong></p>
<p>
  Bu sözleşme, Firma tarafından Müşteri'ye sağlanacak ödeme hizmetlerinin 
  şartlarını belirlemek amacıyla düzenlenmiştir.
</p>

<p><strong>Madde 2 - Tarafların Hak ve Yükümlülükleri</strong></p>
<p>
  2.1. Firma, Müşteri'ye kesintisiz hizmet sağlamayı taahhüt eder.<br>
  2.2. Müşteri, aylık hizmet bedelini düzenli olarak ödemeyi kabul eder.
</p>

<h2>İMZALAR</h2>

<table style="width: 100%; margin-top: 40px;">
  <tr>
    <td style="width: 50%; text-align: center;">
      <p><strong>FİRMA</strong></p>
      <p>{{FIRMA_UNVAN}}</p>
      <p style="margin-top: 60px;">_____________________</p>
      <p>İmza ve Kaşe</p>
    </td>
    <td style="width: 50%; text-align: center;">
      <p><strong>MÜŞTERİ</strong></p>
      <p>{{MUSTERI_UNVAN}}</p>
      <p style="margin-top: 60px;">_____________________</p>
      <p>{{YETKILI_ADI_SOYADI}}</p>
      <p>İmza ve Kaşe</p>
    </td>
  </tr>
</table>
```

## 🚀 Kullanım Adımları

### 1️⃣ Şablon Oluşturma (DSYM Modülü)

1. Ana menüden **DSYM** modülüne gidin
2. **Sözleşme Şablonları** sekmesine tıklayın
3. **Yeni Şablon** butonuna basın
4. Şablon adı ve kategori belirleyin
5. Zengin metin editöründe şablonunuzu yazın
6. **Değişken Ekle** butonunu kullanarak otomatik alanları ekleyin
7. **Kaydet** butonuna basın

### 2️⃣ Müşteri Bazlı Görüntüleme

1. **Müşteri Cari Kart** modülünden bir müşteri seçin
2. **DSYM** sekmesine gidin
3. **Sözleşmeler** alt sekmesini açın
4. Tanımlanmış tüm şablonlar müşteri bilgileriyle birlikte görünür
5. **Önizle** butonuna basarak doldurulmuş hali görün

### 3️⃣ Sözleşme Gönderimi

1. Müşteri detayında **Sözleşme Gönder** butonuna basın
2. Gönderilecek şablonları seçin
3. Email/SMS ile gönderim yapın
4. Müşteri dijital onay + SMS doğrulama yapar
5. İsteğe bağlı hard copy (ıslak imza) beklenir

## ✨ İpuçları

- Değişkenleri eklerken **ctrl+space** ile menüyü açabilirsiniz
- Şablonlarda HTML formatlaması yapabilirsiniz
- Tablolar, listeler ve görseller ekleyebilirsiniz
- Her şablon için versiyon takibi otomatik yapılır
- Müşteri bazlı önizleme özelliği ile değişkenleri test edebilirsiniz

## ⚠️ Önemli Notlar

- Değişken isimleri **büyük harf** olmalı (örn: `{{MUSTERI_UNVAN}}`)
- Değişkenler **çift süslü parantez** içinde yazılmalı
- Boş olan müşteri alanları şablonda boş string olarak görünür
- Tarih bilgileri otomatik olarak sistem tarihinden alınır

---

**Versiyon:** 1.0  
**Tarih:** 09.12.2024  
**Hazırlayan:** OXİVO Development Team
