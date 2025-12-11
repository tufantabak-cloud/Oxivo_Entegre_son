# 📊 HAKEDİŞ V2 SİSTEMİ - DOKÜMANTASYON

## 🎯 GENEL BAKIŞ

HakedisV2 sistemi, Excel formatındaki hakediş tablolarını web uygulamasına dönüştüren yeni nesil bir sistemdir. Her tabela ve aktif vadesi için ayrı satırlar oluşturarak detaylı hakediş hesaplaması yapar.

---

## 📁 DOSYA YAPISI

```
/components/hakedis/
├── HakedisV2.tsx          # Ana component (Liste, Görüntüleme, Form)
├── types.ts               # TypeScript tipleri
├── calculations.ts        # Hesaplama fonksiyonları
├── demo-data.ts          # Test/demo verileri
└── README.md             # Bu dosya

/hooks/
└── useHakedisV2.ts       # Supabase CRUD hook
```

---

## 🗂️ VERİ YAPISI

### HakedisV2Record

```typescript
{
  id: string;
  firmaId: string;           // FK → bank_accounts.id
  tabelaGroupId: string;     // TABELA grup ID
  tabelaGroupAd: string;     // Grup adı
  donem: string;             // "2024-12" format
  vade: string;              // "Tüm Vadeler"
  durum: 'Taslak' | 'Kesinleşmiş';
  
  // 🆕 YENİ FORMAT: Her tabela × aktif vade için ayrı entry
  islemHacmiMap: {
    "tabelaId1_D+1": 50000,
    "tabelaId1_D+7": 30000,
    "tabelaId2_D+1": 100000,
    "tabelaId2_D+14": 80000
  }
}
```

---

## 📊 EXCEL FORMATINDA TABLO YAPISI

### Sütun Yapısı (13 Sütun)

| # | Sütun Adı | Kaynak | Renk | Açıklama |
|---|-----------|--------|------|----------|
| 1 | KLM | Sıra No | 🟨 Sarı | Otomatik sıra numarası |
| 2 | Grup | Tabela | 🟨 Sarı | Tabela grubu adı |
| 3 | Kısa Açıklama | Tabela | 🟨 Sarı | Tabela kısa açıklaması |
| 4 | Ürün | Tabela | 🟨 Sarı | SoftPOS, UnattendedPOS vb. |
| 5 | Gelir Modeli | Tabela | 🟨 Sarı | Gelir Ortaklığı / Sabit Komisyon |
| 6 | Kart Tipi | Tabela | 🟨 Sarı | Credit / Debit / Paçal |
| 7 | Yurt İçi/Dışı | Tabela | 🟨 Sarı | Yurt İçi / Yurt Dışı |
| 8 | Vade | Tabela | 🟨 Sarı | D+1, D+7, D+14, D+31 |
| 9 | Tabela Oranları | Tabela | 🟨 Sarı | Komisyon % veya Satış TL |
| 10 | İşlem Hacmi | Manuel | ⚪ Beyaz | Kullanıcı girişi |
| 11 | Kazanç (TL) | Hesaplama | 🟦 Mavi | Otomatik hesap |
| 12 | **PF Payı** | - | - | **ÇİFT SATIRLI HEADER** |
| 12a | └─ Kuruluş % | Tabela | 🟨 Sarı | Kuruluş oranı |
| 12b | └─ Hesaplama (TL) | Hesaplama | 🟦 Mavi | PF payı tutarı |
| 13 | **OXIVO Payı** | - | - | **ÇİFT SATIRLI HEADER** |
| 13a | └─ OXIVO % | Tabela | 🟨 Sarı | OXIVO oranı |
| 13b | └─ Hesaplama (TL) | Hesaplama | 🟪 Mor | OXIVO payı tutarı |

### Örnek Tablo Görünümü

```
┌─────┬────────┬─────────────┬─────────┬──────────────────┬──────────┬──────────────┬──────┬─────────────┬────────────┬──────────┬────────────┬────────────┬──────────┬────────────┐
│ KLM │  Grup  │  Kısa Açık  │  Ürün   │  Gelir Modeli    │ Kart Tip │ Yurt İçi/Dışı│ Vade │ Tabela Oran │ İşlem Hacmi│  Kazanç  │  Kuruluş % │  PF Payı   │ OXIVO %  │ OXIVO Payı │
│     │        │             │         │                  │          │              │      │             │            │          │    🟨      │    🟦      │   🟨     │    🟪      │
├─────┼────────┼─────────────┼─────────┼──────────────────┼──────────┼──────────────┼──────┼─────────────┼────────────┼──────────┼────────────┼────────────┼──────────┼────────────┤
│  1  │ Grup A │  ABC EPK    │ SoftPOS │ Gelir Ortaklığı  │  Credit  │  Yurt İçi    │ D+1  │  0.03 TL    │  50,000.00 │ 1,500.00 │    90%     │  1,350.00  │   10%    │   150.00   │
│  2  │ Grup A │  ABC EPK    │ SoftPOS │ Gelir Ortaklığı  │  Credit  │  Yurt İçi    │ D+7  │  0.025 TL   │  30,000.00 │   750.00 │    90%     │    675.00  │   10%    │    75.00   │
│  3  │ Grup B │  XYZ OK     │ Unatted │ Sabit Komisyon   │  Debit   │  Yurt Dışı   │ D+1  │  1.5%       │ 100,000.00 │ 1,500.00 │    85%     │  1,275.00  │   15%    │   225.00   │
│  4  │ Grup B │  XYZ OK     │ Unatted │ Sabit Komisyon   │  Debit   │  Yurt Dışı   │ D+14 │  1.2%       │  80,000.00 │   960.00 │    85%     │    816.00  │   15%    │   144.00   │
├─────┴────────┴─────────────┴─────────┴──────────────────┴──────────┴──────────────┴──────┴─────────────┼────────────┼──────────┼────────────┼────────────┼──────────┼────────────┤
│                                                            KÜMÜLE TOPLAMLAR:                            │ 260,000.00 │ 4,710.00 │            │  4,116.00  │          │   594.00   │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┴────────────┴──────────┴────────────┴────────────┴──────────┴────────────┘
```

---

## 🧮 HESAPLAMA FORMÜLLERİ

### 1. Kazanç Hesaplama

#### Gelir Ortaklığı:
```
Kazanç = İşlem Hacmi × Satış TL

Örnek:
İşlem Hacmi: 50,000
Satış TL: 0.03
Kazanç = 50,000 × 0.03 = 1,500 TL
```

#### Sabit Komisyon:
```
Kazanç = İşlem Hacmi × (Komisyon % / 100)

Örnek:
İşlem Hacmi: 100,000
Komisyon: 1.5%
Kazanç = 100,000 × (1.5 / 100) = 1,500 TL
```

### 2. PF Payı Hesaplama
```
PF Payı = Kazanç × (Kuruluş % / 100)

Örnek:
Kazanç: 1,500 TL
Kuruluş Oranı: 90%
PF Payı = 1,500 × (90 / 100) = 1,350 TL
```

### 3. OXIVO Payı Hesaplama
```
OXIVO Payı = Kazanç × (OXIVO % / 100)

Örnek:
Kazanç: 1,500 TL
OXIVO Oranı: 10%
OXIVO Payı = 1,500 × (10 / 100) = 150 TL
```

---

## 🔄 VERİ AKIŞI

### 1. Satır Oluşturma Süreci

```typescript
// 1. Her TABELA kaydı için:
tabelaRecords.forEach(tabela => {
  
  // 2. Aktif vadeleri bul
  const aktifVadeler = tabela.komisyonOranları.filter(k => k.aktif);
  
  // 3. Her aktif vade için ayrı satır oluştur
  aktifVadeler.forEach(vade => {
    const satir = {
      tabelaId: tabela.id,
      vade: vade.vade,            // D+1, D+7 vb.
      islemHacmi: islemHacmiMap[`${tabela.id}_${vade.vade}`] || 0,
      // ... diğer alanlar
    };
  });
});
```

### 2. Veri Kaynak Mapping

```typescript
// islemHacmiMap yapısı:
{
  "abc123_D+1": 50000,   // Tabela 1 - D+1 vadesi
  "abc123_D+7": 30000,   // Tabela 1 - D+7 vadesi
  "xyz456_D+1": 100000,  // Tabela 2 - D+1 vadesi
  "xyz456_D+14": 80000   // Tabela 2 - D+14 vadesi
}

// Her satır için key:
const mapKey = `${tabelaId}_${vade}`;
const islemHacmi = islemHacmiMap[mapKey] || 0;
```

---

## 🎨 RENK KODLAMASI

| Renk | Hexcode | Kullanım Alanı | Anlamı |
|------|---------|----------------|--------|
| 🟨 Sarı | `bg-yellow-50` | TABELA verileri | Sistemden gelen, değiştirilemez |
| ⚪ Beyaz | `bg-white` | İşlem Hacmi | Kullanıcı manuel girişi |
| 🟦 Mavi | `bg-blue-50/100` | Kazanç, PF Payı | Otomatik hesaplanan (PF tarafı) |
| 🟪 Mor | `bg-purple-100` | OXIVO Payı | Otomatik hesaplanan (OXIVO tarafı) |

---

## 🔌 KULLANIM

### Component Entegrasyonu

```tsx
import { HakedisV2 } from './components/hakedis/HakedisV2';

function BankPFDetail() {
  return (
    <HakedisV2
      firmaId="firma-uuid-123"
      kurumAdi="Örnek Firma A.Ş."
      tabelaRecords={tabelaRecords}
      tabelaGroups={tabelaGroups}
    />
  );
}
```

### Hook Kullanımı

```typescript
import { useHakedisV2 } from '../hooks/useHakedisV2';

function MyComponent() {
  const {
    hakedisler,
    loading,
    error,
    createHakedis,
    updateHakedis,
    deleteHakedis,
    confirmHakedis,
    refresh
  } = useHakedisV2('firma-uuid-123');
  
  // Yeni hakediş oluştur
  await createHakedis({
    tabelaGroupId: 'grup-uuid',
    donem: '2024-12',
    vade: 'Tüm Vadeler',
    islemHacmiMap: {
      'tabela1_D+1': 50000,
      'tabela1_D+7': 30000
    }
  });
}
```

### Hesaplama Fonksiyonları

```typescript
import { 
  generateHakedisDetayRows,
  calculateHakedis,
  formatCurrency 
} from './components/hakedis/calculations';

// Detay satırları oluştur
const rows = generateHakedisDetayRows(
  tabelaRecords,
  tabelaGroups,
  islemHacmiMap
);

// Finansal hesaplamalar
const hesap = calculateHakedis(hakedisRecord, tabelaRecords, tabelaGroups);
console.log(formatCurrency(hesap.toplamNetTutar)); // "₺4.710,00"
```

---

## 🧪 TEST VERİSİ

```typescript
import { createDemoHakedis } from './components/hakedis/demo-data';

// Demo hakediş oluştur
const demoHakedis = createDemoHakedis(
  'firma-uuid',
  'grup-uuid',
  'Demo Grup',
  ['tabela1-uuid', 'tabela2-uuid']
);

// Supabase'e kaydet
await createHakedis(demoHakedis);
```

---

## 🗄️ SUPABASE TABLO YAPISI

```sql
CREATE TABLE earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id UUID REFERENCES bank_accounts(id),
  tabela_group_id TEXT NOT NULL,
  tabela_group_ad TEXT,
  donem TEXT NOT NULL,
  vade TEXT NOT NULL,
  durum TEXT CHECK (durum IN ('Taslak', 'Kesinleşmiş')),
  aktif BOOLEAN DEFAULT true,
  
  -- JSONB: Her tabela × vade için işlem hacmi
  islem_hacmi_map JSONB DEFAULT '{}'::jsonb,
  
  -- Ek alanlar
  pf_islem_hacmi NUMERIC,
  oxivo_islem_hacmi NUMERIC,
  ek_gelir_aciklama TEXT,
  ek_gelir_pf_tl NUMERIC,
  ek_gelir_ox_tl NUMERIC,
  ek_kesinti_aciklama TEXT,
  ek_kesinti_pf_tl NUMERIC,
  ek_kesinti_ox_tl NUMERIC,
  notlar TEXT,
  olusturan_kullanici TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_earnings_firma_id ON earnings(firma_id);
CREATE INDEX idx_earnings_donem ON earnings(donem);
CREATE INDEX idx_earnings_aktif ON earnings(aktif);
```

---

## ✅ ÖZELLIKLER

- ✅ Her tabela × aktif vade için ayrı satır oluşturma
- ✅ Çift başlıklı Excel formatı tablo
- ✅ Renk kodlaması ile veri kaynağı ayrımı
- ✅ Gelir Ortaklığı ve Sabit Komisyon desteği
- ✅ Otomatik hesaplama (Kazanç, PF Payı, OXIVO Payı)
- ✅ Kümüle toplamlar satırı
- ✅ Supabase entegrasyonu
- ✅ Soft delete (aktif/pasif)
- ✅ Taslak/Kesinleşmiş durum yönetimi
- ✅ TypeScript type safety
- ✅ Responsive tasarım

---

## 🚀 GELECEKTEKİ GELİŞTİRMELER

- [ ] Excel export özelliği
- [ ] Toplu işlem hacmi girişi
- [ ] Dönemsel karşılaştırma raporları
- [ ] Grafik ve dashboard
- [ ] E-posta bildirimleri
- [ ] Onay akışı sistemi

---

## 📞 DESTEK

Sorunlar veya öneriler için:
- Proje Yöneticisi ile iletişime geçin
- GitHub Issues kullanın
- Dokümantasyonu güncel tutun

---

**Son Güncelleme:** Aralık 2024  
**Versiyon:** 2.0  
**Durum:** ✅ Aktif Geliştirme
