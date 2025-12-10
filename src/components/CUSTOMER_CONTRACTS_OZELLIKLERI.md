# 🎯 MÜŞTERİ ÖZELİNDE SÖZLEŞME DÜZENLEyİCİ - ÖZELLİKLER

## ✅ Tamamlanan Özellikler

### 1. **Tam Ekran Düzenleyici** (`/components/FullscreenContractEditor.tsx`)
- TipTap editor ile zengin metin düzenleme
- Toolbar ile formatlama özellikleri:
  - **Kalın**, *İtalik* 
  - Madde işaretli liste
  - Numaralı liste
  - Geri al / İleri al
  - Tablo desteği
- Tam ekran görünüm (varsayılan) veya normal görünüm
- A4 kağıt boyutunda (210mm) içerik görüntüleme

### 2. **Otomatik Veri Doldurma**
- Şablon değişkenleri müşteri verileriyle otomatik doldurulur
- 50+ değişken desteği (büyük/küçük harf)
- Tarih ve firma bilgileri otomatik eklenir

### 3. **Kaydetme Sistemi**
- Supabase `customer_contracts` tablosuna kaydedilir
- Mevcut kayıt varsa günceller
- Yeni kayıt ise insert yapar
- Kaydedilmemiş değişiklik kontrolü (çıkışta uyarı)

### 4. **Kullanıcı Deneyimi**
- "Önizle" butonu ile hızlı görüntüleme
- "Düzenle" butonu ile tam ekran düzenleme
- Modal içinden "Tam Ekran Düzenle" ile geçiş
- 3 farklı buton konumu:
  1. Şablon kartında "Düzenle"
  2. Önizleme modalında "Tam Ekran Düzenle"
  3. Tam ekran editörde "Kaydet"

---

## 📊 Veri Yapısı

### Supabase Tablo: `customer_contracts`

Aşağıdaki sütunların olması gerekir:

```sql
CREATE TABLE customer_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  template_id UUID NOT NULL REFERENCES contract_templates(id),
  filled_content_html TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler
CREATE INDEX idx_customer_contracts_customer ON customer_contracts(customer_id);
CREATE INDEX idx_customer_contracts_template ON customer_contracts(template_id);
CREATE UNIQUE INDEX idx_customer_contracts_unique ON customer_contracts(customer_id, template_id);
```

---

## 🎬 Kullanım Akışı

### Adım 1: Müşteri Detayında Sözleşmeler Sekmesi
```
Müşteri Cari Kart > [Müşteri Seç] > DSYM>Sözleşmeler Sekmesi
```

### Adım 2: Şablon Görüntüleme
- **Önizle** butonuna tıkla → Modal açılır (Read-only)
- Müşteri bilgileri otomatik doldurulmuş halde görünür

### Adım 3: Düzenleme
**YOL 1:** Şablon kartında "Düzenle" butonuna tıkla
**YOL 2:** Önizleme modalında "Tam Ekran Düzenle" butonuna tıkla

### Adım 4: Tam Ekran Editörde
1. İçeriği düzenle (metin ekle/sil, formatla)
2. Toolbar ile biçimlendirme yap
3. "Kaydet" butonuna tıkla
4. Sözleşme Supabase'e kaydedilir

### Adım 5: Kontrol
- Kaydedilen sözleşme `customer_contracts` tablosunda görünür
- `customer_id` ve `template_id` ile ilişkilendirilmiş halde

---

## 🔥 Teknik Detaylar

### 1. Değişken Doldurma Fonksiyonu
```typescript
fillTemplateVariables(htmlContent: string, customerData: CustomerData): string
```
- Regex ile tüm değişkenleri bulur ve değiştirir
- Hem `{{MUSTERI_UNVAN}}` hem `{{unvan}}` desteklenir

### 2. Kaydetme Mantığı
```typescript
// Önce kontrol et
const existingContract = await supabase
  .from('customer_contracts')
  .select('id')
  .eq('customer_id', customerId)
  .eq('template_id', templateId)
  .maybeSingle();

if (existingContract) {
  // Güncelle
  await supabase.from('customer_contracts').update({...})
} else {
  // Yeni kayıt
  await supabase.from('customer_contracts').insert({...})
}
```

### 3. State Yönetimi
```typescript
const [fullscreenEditorOpen, setFullscreenEditorOpen] = useState(false);
const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
```

---

## 🎨 UI/UX Özellikleri

### Butonlar
| Buton | Konum | İkon | Renk | Aksiyon |
|-------|-------|------|------|---------|
| **Önizle** | Şablon Kartı | 👁️ Eye | Outline | Modal Aç (Read-only) |
| **Düzenle** | Şablon Kartı | ✏️ Edit | Outline | Tam Ekran Editör Aç |
| **Tam Ekran Düzenle** | Önizleme Modal | ⛶ Maximize2 | Outline | Modal Kapat → Editör Aç |
| **Kaydet** | Tam Ekran Editör | 💾 Save | Primary | Supabase'e Yaz |
| **İptal** | Tam Ekran Editör | ✕ X | Outline | Editörü Kapat |

### Renkler
- **Mavi Badge**: Versiyon (v1, v2...)
- **Yeşil Badge**: Otomatik alanlar (21 alan otomatik)
- **Sarı Badge**: Manuel alanlar (3 alan manuel)
- **Mor İkon**: FileText (Sözleşme başlığında)

---

## 🚀 Sonraki Adımlar (Öneriler)

1. **PDF Export**: Düzenlenmiş sözleşmeyi PDF olarak indir
2. **Email Gönderimi**: Kaydedilen sözleşmeyi müşteriye email at
3. **Versiyon Geçmişi**: Her kaydı ayrı bir versiyon olarak sakla
4. **Digital İmza**: İmza alanı ekle ve müşteri onayı al
5. **Toplu Sözleşme**: Birden fazla müşteriye aynı şablonu gönder
6. **Şablon Seçimi**: Müşteri bazında hangi şablonların kullanılacağını seç

---

**Versiyon:** 1.0  
**Tarih:** 09.12.2024  
**Hazırlayan:** OXİVO Development Team  
**Durum:** ✅ Aktif ve Çalışıyor
