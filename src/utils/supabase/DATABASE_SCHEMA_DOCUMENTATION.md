# 📚 SUPABASE DATABASE SCHEMA - TAM DOKÜMANTASYON

> **Versiyon:** 2185  
> **Son Güncelleme:** 15 Aralık 2024  
> **Toplam Tablo:** 19  
> **Delete Stratejisi:** Soft Delete (18/19 tablo)  

---

## 📋 İÇİNDEKİLER

1. [Temel Tablolar](#temel-tablolar)
   - [customers (Müşteriler)](#1-customers-müşteriler)
   - [products (Ürünler)](#2-products-ürünler)
   - [bank_accounts (Banka/PF)](#3-bank_accounts-bankapf)
2. [TABELA ve HAKEDİŞ](#tabela-ve-hakediş)
   - [signs (TABELA)](#4-signs-tabela)
   - [earnings (HAKEDİŞ)](#5-earnings-hakediş)
3. [Tanımlar Tabloları](#tanımlar-tabloları)
   - [mcc_codes](#6-mcc_codes)
   - [banks](#7-banks)
   - [epk_institutions](#8-epk_institutions)
   - [ok_institutions](#9-ok_institutions)
   - [sales_representatives](#10-sales_representatives)
   - [job_titles](#11-job_titles)
   - [partnerships](#12-partnerships)
   - [account_items](#13-account_items)
   - [fixed_commissions](#14-fixed_commissions)
   - [additional_revenues](#15-additional_revenues)
   - [sharings](#16-sharings)
   - [card_programs](#17-card_programs)
   - [suspension_reasons](#18-suspension_reasons)
4. [Yardımcı Tablolar](#yardımcı-tablolar)
   - [domain_mappings](#19-domain_mappings)
5. [İlişkiler Haritası](#i̇lişkiler-haritası)

---

## TEMEL TABLOLAR

### 1. `customers` (Müşteriler)

**Amaç:** Müşteri Cari Kartları - Şirket bilgileri ve müşteri yönetimi

#### Sütunlar

| Sütun | Tip | Nullable | Default | Constraint | Açıklama |
|-------|-----|----------|---------|------------|----------|
| `id` | text/uuid | ❌ | - | PRIMARY KEY | Benzersiz müşteri ID |
| `unvan` | text | ❌ | - | - | Şirket ünvanı |
| `mcc_id` | text | ✅ | null | FK → mcc_codes.kod | MCC kod referansı |
| `email` | text | ✅ | null | - | E-posta adresi |
| `telefon` | text | ✅ | null | - | Telefon numarası |
| `adres` | text | ✅ | null | - | Adres |
| `vergi_dairesi` | text | ✅ | null | - | Vergi dairesi adı |
| `vergi_no` | text | ✅ | null | - | Vergi numarası |
| `yetkili_adi` | text | ✅ | null | - | Yetkili kişi adı |
| `yetkili_unvan_id` | text | ✅ | null | FK → job_titles.id | Yetkili unvan referansı |
| `satis_temsilcisi_id` | text | ✅ | null | FK → sales_representatives.id | Satış temsilcisi referansı |
| `durum` | text | ✅ | 'Aktif' | - | 'Aktif' \| 'Pasif' \| 'Askıda' |
| `aski_nedeni_id` | text | ✅ | null | FK → suspension_reasons.id | Askı nedeni referansı |
| `notlar` | text | ✅ | null | - | Serbest notlar |
| `bank_pf_ids` | jsonb | ✅ | '[]' | - | Bağlı Banka/PF ID dizisi |
| `is_deleted` | boolean | ❌ | false | - | Soft delete flag |
| `deleted_at` | timestamp | ✅ | null | - | Silinme zamanı |
| `created_at` | timestamp | ❌ | now() | - | Oluşturma zamanı |
| `updated_at` | timestamp | ❌ | now() | - | Güncelleme zamanı |

#### İlişkiler
```
customers.mcc_id → mcc_codes.kod (N:1)
customers.yetkili_unvan_id → job_titles.id (N:1)
customers.satis_temsilcisi_id → sales_representatives.id (N:1)
customers.aski_nedeni_id → suspension_reasons.id (N:1)
customers.id ← bank_accounts.customer_id (1:N)
```

#### Indexler
- PRIMARY KEY: `id`
- INDEX: `is_deleted`
- INDEX: `mcc_id`
- INDEX: `durum`

#### Örnek Veri
```json
{
  "id": "customer-1702123456789",
  "unvan": "ACME Teknoloji A.Ş.",
  "mcc_id": "5411",
  "email": "info@acme.com",
  "telefon": "+90 212 123 4567",
  "vergi_dairesi": "Kadıköy",
  "vergi_no": "1234567890",
  "yetkili_adi": "Ahmet Yılmaz",
  "yetkili_unvan_id": "unvan-001",
  "satis_temsilcisi_id": "sales-001",
  "durum": "Aktif",
  "bank_pf_ids": ["firma-001", "firma-002"],
  "is_deleted": false,
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-15T14:30:00Z"
}
```

---

### 2. `products` (Ürünler)

**Amaç:** Ürün kataloğu ve stok yönetimi

#### Sütunlar

| Sütun | Tip | Nullable | Default | Constraint | Açıklama |
|-------|-----|----------|---------|------------|----------|
| `id` | text/uuid | ❌ | - | PRIMARY KEY | Benzersiz ürün ID |
| `urun_adi` | text | ❌ | - | - | Ürün adı |
| `kategori` | text | ✅ | null | - | Ürün kategorisi |
| `aciklama` | text | ✅ | null | - | Ürün açıklaması |
| `fiyat` | numeric | ✅ | 0 | - | Ürün fiyatı |
| `stok_durumu` | text | ✅ | 'Mevcut' | - | Stok durumu |
| `is_deleted` | boolean | ❌ | false | - | Soft delete flag |
| `deleted_at` | timestamp | ✅ | null | - | Silinme zamanı |
| `created_at` | timestamp | ❌ | now() | - | Oluşturma zamanı |
| `updated_at` | timestamp | ❌ | now() | - | Güncelleme zamanı |

#### Indexler
- PRIMARY KEY: `id`
- INDEX: `is_deleted`
- INDEX: `kategori`

---

### 3. `bank_accounts` (Banka/PF)

**Amaç:** Banka hesapları ve Ödeme Kuruluşu (PF) firmalarının yönetimi

#### Sütunlar

| Sütun | Tip | Nullable | Default | Constraint | Açıklama |
|-------|-----|----------|---------|------------|----------|
| `id` | text/uuid | ❌ | - | PRIMARY KEY | Benzersiz firma ID |
| `tip` | text | ❌ | - | - | 'banka' \| 'pf' |
| `adi` | text | ❌ | - | - | Firma/hesap adı |
| `uye_isyeri_yonetimi` | text | ✅ | null | - | ÜİY numarası |
| `sozlesme_no` | text | ✅ | null | - | Sözleşme numarası |
| `banka_kod` | text | ✅ | null | FK → banks.kod | Banka kod referansı |
| `epk_kod` | text | ✅ | null | FK → epk_institutions.kod | EPK kod referansı |
| `ok_kod` | text | ✅ | null | FK → ok_institutions.kod | OK kod referansı |
| `ortaklik_id` | text | ✅ | null | FK → partnerships.id | Ortaklık referansı |
| `sozlesme_baslangic` | date | ✅ | null | - | Sözleşme başlangıç tarihi |
| `sozlesme_bitis` | date | ✅ | null | - | Sözleşme bitiş tarihi |
| `aktif` | boolean | ❌ | true | - | Aktif/Pasif durum |
| `notlar` | text | ✅ | null | - | Notlar |
| `customer_id` | text | ✅ | null | FK → customers.id | Müşteri referansı |
| `tabela_records` | jsonb | ✅ | '[]' | - | **🔥 Enriched: İlişkili TABELA kayıtları** |
| `earning_records` | jsonb | ✅ | '[]' | - | **🔥 Enriched: İlişkili HAKEDİŞ kayıtları** |
| `is_deleted` | boolean | ❌ | false | - | Soft delete flag |
| `deleted_at` | timestamp | ✅ | null | - | Silinme zamanı |
| `created_at` | timestamp | ❌ | now() | - | Oluşturma zamanı |
| `updated_at` | timestamp | ❌ | now() | - | Güncelleme zamanı |

#### İlişkiler
```
bank_accounts.customer_id → customers.id (N:1)
bank_accounts.banka_kod → banks.kod (N:1)
bank_accounts.epk_kod → epk_institutions.kod (N:1)
bank_accounts.ok_kod → ok_institutions.kod (N:1)
bank_accounts.ortaklik_id → partnerships.id (N:1)
bank_accounts.id ← signs.firma_id (1:N)
bank_accounts.id ← earnings.firma_id (1:N)
```

#### ⚡ Realtime Enrichment
Bu tablo **realtime listener** ile otomatik zenginleştiriliyor:
```typescript
// App.tsx içinde:
bankPFChannel.on('postgres_changes', { table: 'bank_accounts' }, async (payload) => {
  // 1. signs tablosundan firma_id = bank_accounts.id olan kayıtları getir
  const relatedSigns = await supabase
    .from('signs')
    .select('*')
    .eq('firma_id', payload.new.id);
  
  // 2. earnings tablosundan firma_id = bank_accounts.id olan kayıtları getir
  const relatedEarnings = await supabase
    .from('earnings')
    .select('*')
    .eq('firma_id', payload.new.id);
  
  // 3. tabela_records ve earning_records alanlarına ekle
  payload.new.tabela_records = relatedSigns;
  payload.new.earning_records = relatedEarnings;
});
```

#### Örnek Veri
```json
{
  "id": "firma-1702123456789",
  "tip": "banka",
  "adi": "Garanti BBVA - ACME Hesap",
  "uye_isyeri_yonetimi": "UY12345",
  "sozlesme_no": "SZ2024-001",
  "banka_kod": "GARANTI",
  "epk_kod": "EPK001",
  "ok_kod": null,
  "ortaklik_id": "partner-001",
  "sozlesme_baslangic": "2024-01-01",
  "sozlesme_bitis": "2025-12-31",
  "aktif": true,
  "customer_id": "customer-1702123456789",
  "tabela_records": [
    { "id": "tabela-001", "urun": "Visa Kredi" },
    { "id": "tabela-002", "urun": "MasterCard Debit" }
  ],
  "earning_records": [
    { "id": "hakedis-001", "donem": "2024-12" }
  ],
  "is_deleted": false,
  "created_at": "2024-12-01T10:00:00Z"
}
```

---

## TABELA ve HAKEDİŞ

### 4. `signs` (TABELA)

**Amaç:** Firma bazlı ürün tabela kayıtları - Komisyon ve gelir modeli tanımları

#### Sütunlar

| Sütun | Tip | Nullable | Default | Constraint | Açıklama |
|-------|-----|----------|---------|------------|----------|
| `id` | text/uuid | ❌ | - | PRIMARY KEY | Benzersiz TABELA ID |
| `firma_id` | text | ❌ | - | FK → bank_accounts.id | **🔥 Firma referansı (KRİTİK!)** |
| `tabela_group_id` | text | ✅ | null | - | **🔥🔥 TABELA grup ID (HAKEDİŞ bağlantısı!)** |
| `urun` | text | ❌ | - | - | Ürün adı |
| `aktif` | boolean | ❌ | true | - | Aktif/Pasif |
| `kart_tipi` | text | ✅ | null | - | 'Kredi' \| 'Debit' |
| `yurt_ici_disi` | text | ✅ | null | - | 'Yurt İçi' \| 'Yurt Dışı' |
| `kisa_aciklama` | text | ✅ | null | - | Kısa açıklama |
| `kart_program_ids` | jsonb | ✅ | '[]' | - | Kart program ID dizisi |
| `bank_ids` | jsonb | ✅ | '[]' | - | Banka ID dizisi |
| `gelir_modeli` | jsonb | ✅ | '{}' | - | **Gelir modeli detayları** |
| `komisyon_oranlari` | jsonb | ✅ | '{}' | - | **Vade bazlı komisyon oranları** |
| `paylasim_oranlari` | jsonb | ✅ | '{}' | - | **Paylaşım oranları (OX/PF)** |
| `hazine_geliri` | numeric | ✅ | 0 | - | Hazine geliri tutarı |
| `ek_gelir_detay` | jsonb | ✅ | '{}' | - | Ek gelir detayları |
| `komisyon_yuzdesi` | numeric | ✅ | 0 | - | **Hesaplanan toplam komisyon %** |
| `alis_fiyati` | numeric | ✅ | 0 | - | **Hesaplanan alış fiyatı** |
| `satis_fiyati` | numeric | ✅ | 0 | - | **Hesaplanan satış fiyatı** |
| `kar_fiyati` | numeric | ✅ | 0 | - | **Hesaplanan kar fiyatı** |
| `aciklama` | text | ✅ | null | - | Genel açıklama |
| `fotograf` | text | ✅ | null | - | Fotoğraf URL |
| `olusturma_tarihi` | timestamp | ✅ | null | - | İlk oluşturma zamanı |
| `guncelleme_tarihi` | timestamp | ✅ | null | - | Son güncelleme zamanı |
| `is_deleted` | boolean | ❌ | false | - | Soft delete flag |
| `deleted_at` | timestamp | ✅ | null | - | Silinme zamanı |
| `created_at` | timestamp | ❌ | now() | - | Supabase oluşturma |
| `updated_at` | timestamp | ❌ | now() | - | Supabase güncelleme |

#### İlişkiler
```
signs.firma_id → bank_accounts.id (N:1) ⭐ KRİTİK
signs.tabela_group_id ↔ earnings.tabela_group_id (N:N) ⭐⭐ GRUP BAĞLANTISI
signs.kart_program_ids → card_programs.id[] (N:N via JSONB)
signs.bank_ids → banks.kod[] (N:N via JSONB)
```

#### JSONB Yapıları

**`gelir_modeli`:**
```json
{
  "tip": "komisyon", // "komisyon" | "sabit_gelir" | "karma"
  "detaylar": { ... }
}
```

**`komisyon_oranlari`:**
```json
{
  "taksit1": 2.5,    // %2.5
  "taksit3": 3.2,    // %3.2
  "taksit6": 4.1,    // %4.1
  "taksit9": 5.0,
  "taksit12": 5.8
}
```

**`paylasim_oranlari`:**
```json
{
  "ox_yuzdesi": 60,  // OX payı %60
  "pf_yuzdesi": 40   // PF payı %40
}
```

#### ⚠️ KRİTİK: TABELA Grup Mantığı

**Senaryo:**
1. "Ekim 2025" adında bir TABELA grubu oluşturulur
2. Grup ID: `d6e88a06-d6e2-4cdf-8870-e2c872180feb`
3. Bu gruba 3 ürün eklenir:
   - Visa Kredi (tabela_group_id = d6e88a06...)
   - MasterCard Debit (tabela_group_id = d6e88a06...)
   - Troy Kredi (tabela_group_id = d6e88a06...)
4. Bir HAKEDİŞ kaydı oluşturulur ve grup seçilir:
   - earnings.tabela_group_id = d6e88a06...
5. HAKEDİŞ ön izlemede, bu grup ID'sine sahip tüm signs kayıtları listelenir

**SORUN:**
- Eğer `tabela_group_id = d6e88a06...` olan hiç `signs` kaydı yoksa
- HAKEDİŞ ön izlemede "Grup boş" hatası verilir
- **ÇÖZÜM:** Ya gruba kayıt ekleyin ya da HAKEDİŞ'in grubunu değiştirin

#### Örnek Veri
```json
{
  "id": "tabela-1702123456789",
  "firma_id": "firma-1702123456789",
  "tabela_group_id": "d6e88a06-d6e2-4cdf-8870-e2c872180feb",
  "urun": "Visa Kredi Kartı",
  "aktif": true,
  "kart_tipi": "Kredi",
  "yurt_ici_disi": "Yurt İçi",
  "kart_program_ids": ["visa-gold", "visa-platinum"],
  "bank_ids": ["GARANTI", "AKBANK"],
  "gelir_modeli": { "tip": "komisyon" },
  "komisyon_oranlari": {
    "taksit1": 2.5,
    "taksit3": 3.2,
    "taksit6": 4.1
  },
  "paylasim_oranlari": {
    "ox_yuzdesi": 60,
    "pf_yuzdesi": 40
  },
  "komisyon_yuzdesi": 3.5,
  "alis_fiyati": 1.8,
  "satis_fiyati": 2.5,
  "kar_fiyati": 0.7,
  "is_deleted": false
}
```

---

### 5. `earnings` (HAKEDİŞ)

**Amaç:** Dönemsel gelir/hakediş kayıtları - İşlem hacmi ve gelir hesaplamaları

#### Sütunlar

| Sütun | Tip | Nullable | Default | Constraint | Açıklama |
|-------|-----|----------|---------|------------|----------|
| `id` | text/uuid | ❌ | - | PRIMARY KEY | Benzersiz HAKEDİŞ ID |
| `firma_id` | text | ❌ | - | FK → bank_accounts.id | **🔥 Firma referansı (KRİTİK!)** |
| `tabela_group_id` | text | ✅ | null | - | **🔥🔥 TABELA grup ID (signs ile bağlantı!)** |
| `donem` | text | ❌ | - | - | Dönem (YYYY-MM format) |
| `islem_hacmi_map` | jsonb | ✅ | '{}' | - | **🔥🔥🔥 Vade bazlı işlem hacimleri** |
| `toplam_islem_hacmi` | numeric | ✅ | 0 | - | Toplam işlem hacmi (hesaplanan) |
| `toplam_gelir` | numeric | ✅ | 0 | - | Toplam gelir (hesaplanan) |
| `notlar` | text | ✅ | null | - | Notlar |
| `durum` | text | ✅ | 'Taslak' | - | 'Taslak' \| 'Onaylı' \| 'İptal' |
| `onay_tarihi` | timestamp | ✅ | null | - | Onay tarihi |
| `onaylayan` | text | ✅ | null | - | Onaylayan kullanıcı |
| `is_deleted` | boolean | ❌ | false | - | Soft delete flag |
| `deleted_at` | timestamp | ✅ | null | - | Silinme zamanı |
| `created_at` | timestamp | ❌ | now() | - | Oluşturma zamanı |
| `updated_at` | timestamp | ❌ | now() | - | Güncelleme zamanı |

#### İlişkiler
```
earnings.firma_id → bank_accounts.id (N:1) ⭐ KRİTİK
earnings.tabela_group_id ↔ signs.tabela_group_id (N:N) ⭐⭐ GRUP BAĞLANTISI
```

#### JSONB Yapısı: `islem_hacmi_map`

**Amaç:** Her vade (taksit) için işlem hacmini saklar

```json
{
  "taksit1": 1500000,   // 1.5M TL tek çekim
  "taksit3": 800000,    // 800K TL 3 taksit
  "taksit6": 450000,    // 450K TL 6 taksit
  "taksit9": 200000,    // 200K TL 9 taksit
  "taksit12": 100000    // 100K TL 12 taksit
}
```

#### HAKEDİŞ Hesaplama Mantığı

**Adım 1:** TABELA grup ID'sine göre signs kayıtlarını getir
```sql
SELECT * FROM signs 
WHERE tabela_group_id = 'd6e88a06-d6e2-4cdf-8870-e2c872180feb'
  AND is_deleted = false;
```

**Adım 2:** Her TABELA kaydı için vade bazlı gelir hesapla
```typescript
// Örnek: Visa Kredi
const vadeGelir = Object.entries(islemHacmiMap).map(([vade, hacim]) => {
  const komisyonOrani = sign.komisyon_oranlari[vade] || 0; // %3.5
  const gelir = hacim * (komisyonOrani / 100); // 1500000 * 0.035 = 52500
  return { vade, hacim, komisyonOrani, gelir };
});
```

**Adım 3:** Toplam geliri hesapla
```typescript
const toplamGelir = vadeGelir.reduce((sum, v) => sum + v.gelir, 0);
```

**Adım 4:** Excel export'ta her vade için ayrı satır oluştur
```typescript
// HER VADE İÇİN AYRI SATIR
vadeGelir.forEach(({ vade, hacim, komisyonOrani, gelir }) => {
  excelData.push({
    'Ürün': sign.urun,
    'Vade': vade,
    'İşlem Hacmi': hacim,
    'Komisyon %': komisyonOrani,
    'Gelir': gelir
  });
});
```

#### Örnek Veri
```json
{
  "id": "hakedis-1765480411780",
  "firma_id": "firma-1702123456789",
  "tabela_group_id": "d6e88a06-d6e2-4cdf-8870-e2c872180feb",
  "donem": "2024-12",
  "islem_hacmi_map": {
    "taksit1": 1500000,
    "taksit3": 800000,
    "taksit6": 450000
  },
  "toplam_islem_hacmi": 2750000,
  "toplam_gelir": 95500,
  "durum": "Taslak",
  "is_deleted": false,
  "created_at": "2024-12-11T08:00:00Z"
}
```

---

## TANIMLAR TABLOLARI

### 6. `mcc_codes`
### 7. `banks`
### 8. `epk_institutions`
### 9. `ok_institutions`
### 10. `sales_representatives`
### 11. `job_titles`
### 12. `partnerships`
### 13. `account_items`
### 14. `fixed_commissions`
### 15. `additional_revenues`
### 16. `sharings`
### 17. `card_programs`
### 18. `suspension_reasons`

*(Tüm tanımlar tabloları benzer yapıdadır, kısaltılmıştır)*

---

## YARDIMCI TABLOLAR

### 19. `domain_mappings`

**Amaç:** Domain adı - Müşteri eşleştirmeleri

⚠️ **ÖZEL:** Bu tablo **HARD DELETE** kullanır (is_deleted yok!)

---

## İLİŞKİLER HARİTASI

```
                    ┌─────────────┐
                    │  customers  │
                    │  (Müşteri)  │
                    └──────┬──────┘
                           │ 1:N
                           ▼
                    ┌──────────────┐
                    │bank_accounts │
                    │  (Banka/PF)  │
                    │              │
                    │ • id         │◄─────┐
                    └──────┬───────┘      │
                           │              │
           ┌───────────────┼──────────────┤
           │ 1:N           │ 1:N          │
           ▼               ▼              │
    ┌─────────────┐ ┌─────────────┐      │
    │   signs     │ │  earnings   │      │
    │  (TABELA)   │ │  (HAKEDİŞ)  │      │
    │             │ │             │      │
    │• firma_id ──┼─┘• firma_id ──┘      │
    │• tabela_────┼───• tabela_          │
    │  group_id   │   group_id           │
    └─────────────┘ └─────────────┘      │
                                          │
           KRİTİK BAĞLANTI:               │
           tabela_group_id ile            │
           signs ↔ earnings               │
           N:N ilişkisi                   │
```

---

## 🎯 ÖZET İSTATİSTİKLER

| Kategori | Değer |
|----------|-------|
| Toplam Tablo | 19 |
| Soft Delete | 18 |
| Hard Delete | 1 (domain_mappings) |
| JSONB Kullanan | 8 |
| Realtime Enrichment | 1 (bank_accounts) |
| Foreign Key İlişkisi | 15+ |
| Index Sayısı | 50+ |

---

**Dokümantasyon Sonu** ✅
