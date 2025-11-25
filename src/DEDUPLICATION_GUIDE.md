# 🧹 Duplicate Cleanup Guide

## Nedir?

Supabase'deki duplicate (tekrar eden) kayıtları otomatik olarak tespit edip temizleyen bir sistem.

## Ne Zaman Kullanılır?

- JSON/Excel import işlemlerinden sonra
- Farklı sistemlerden veri aktarımı yapıldığında
- Veritabanında "unique" olması gereken field'larda duplicate'ler oluştuğunda

## Nasıl Çalışır?

### 1. **Duplicate Detection Logic**

Her tablo için unique field'lar tanımlı:

| Tablo | Unique Field | Açıklama |
|-------|--------------|----------|
| `customers` | `cari_hesap_kodu` | Cari hesap kodu benzersiz olmalı |
| `products` | `urun_kodu` | Ürün kodu benzersiz olmalı |
| `bank_pf` | `hesap_no` | Hesap numarası benzersiz olmalı |
| `mcc_codes` | `kod` | MCC kodu benzersiz olmalı |
| `banks` | `kod` | Banka kodu benzersiz olmalı |
| `epk` | `kod` | EPK kodu benzersiz olmalı |
| `ok` | `kod` | ÖK kodu benzersiz olmalı |
| `card_programs` | `kod` | Kart program kodu benzersiz olmalı |
| `partnerships` | `partner_name` | Partner adı benzersiz olmalı |
| `sharings` | `tip` | Sharing tipi benzersiz olmalı |
| `sales_representatives` | `id` | ID benzersiz olmalı |
| `job_titles` | `id` | ID benzersiz olmalı |
| `suspension_reasons` | `kod` | Kod benzersiz olmalı |

### 2. **Temizleme Stratejisi**

```
1. Tüm kayıtları çek (updated_at DESC sıralı)
2. Duplicate'leri tespit et (unique field'a göre)
3. En SON güncellenen kayıt KORUNUR
4. Diğer duplicate'ler SİLİNİR
```

### 3. **Kullanım**

#### UI Üzerinden:
1. Ana sayfada (Home) sağ üst köşedeki **"Duplicate Temizle"** butonuna tıklayın
2. İşlem otomatik başlar
3. Sonuç bildirim olarak gösterilir
4. Sayfa otomatik yenilenir

#### Kod İle:
```typescript
import { deduplicateAllTables } from './utils/deduplicateSupabase';

const result = await deduplicateAllTables();

console.log(result.summary);
// {
//   totalTables: 13,
//   successfulTables: 13,
//   failedTables: 0,
//   totalDuplicatesRemoved: 42
// }
```

## Önleme (Prevention)

### UPSERT Kullanımı

Sistemde tüm API'lar **UPSERT** kullanıyor:

```typescript
// ✅ DOĞRU: UPSERT ile duplicate önlenir
await supabase
  .from('customers')
  .upsert(records, { onConflict: 'id' });

// ❌ YANLIŞ: INSERT duplicate oluşturabilir
await supabase
  .from('customers')
  .insert(records);
```

### Supabase Schema Constraints

SQL tarafında UNIQUE constraint'ler eklenmiş:

```sql
-- Customers unique constraint
ALTER TABLE customers 
ADD CONSTRAINT customers_cari_hesap_kodu_unique 
UNIQUE (cari_hesap_kodu);

-- Products unique constraint
ALTER TABLE products 
ADD CONSTRAINT products_urun_kodu_unique 
UNIQUE (urun_kodu);

-- MCC Codes unique constraint
ALTER TABLE mcc_codes 
ADD CONSTRAINT mcc_codes_kod_unique 
UNIQUE (kod);
```

## Console Çıktısı Örneği

```
🚀 Starting comprehensive duplicate cleanup...
🧹 Cleaning duplicates in customers...
✅ customers: 5 duplicate kayıt silindi
🧹 Cleaning duplicates in products...
✅ products: 12 duplicate kayıt silindi
🧹 Cleaning duplicates in mcc_codes...
✅ mcc_codes: 0 duplicate kayıt silindi

📊 DUPLICATE CLEANUP SUMMARY:
⏱️ Duration: 2.45s
📋 Total Tables: 13
✅ Successful: 13
❌ Failed: 0
🗑️ Total Duplicates Removed: 17

📋 Details:
  - customers: 5 duplicate(s) removed
  - products: 12 duplicate(s) removed
```

## Güvenlik

- ✅ En son güncellenen kayıt **her zaman korunur**
- ✅ İşlem **transaction-safe** değildir (tek tek silme)
- ✅ Silinen kayıtlar geri getirilemez (backup alın!)
- ✅ Read-only kullanıcılar çalıştıramaz

## Troubleshooting

### Hata: "duplicate key value violates unique constraint"

**Sebep:** Aynı unique field'a sahip 2 kayıt eklemeye çalışıyorsunuz

**Çözüm:**
```typescript
// 1. Duplicate cleanup çalıştır
await deduplicateAllTables();

// 2. Sonra yeniden dene
await customerApi.create(newCustomer);
```

### Hata: "Permission denied for table"

**Sebep:** Supabase kullanıcısının DELETE yetkisi yok

**Çözüm:** RLS Policy'leri kontrol edin:
```sql
-- DELETE policy ekle
CREATE POLICY "Allow authenticated delete" 
ON customers 
FOR DELETE 
TO authenticated 
USING (true);
```

## Best Practices

1. **Düzenli Temizlik:** Ayda bir duplicate cleanup çalıştırın
2. **Backup Alın:** Büyük temizlik öncesi JSON export yapın
3. **Test Edin:** Production'da çalıştırmadan önce staging'de test edin
4. **Log Tutun:** Console output'u kaydedin
5. **UPSERT Kullanın:** Yeni kod yazarken her zaman UPSERT kullanın

## Performans

| Kayıt Sayısı | Süre (ortalama) |
|--------------|-----------------|
| 1,000 | ~1s |
| 5,000 | ~3s |
| 10,000 | ~6s |
| 50,000 | ~25s |

## Changelog

### v1.0.0 (2025-01-24)
- ✅ İlk sürüm
- ✅ 13 tablo desteği
- ✅ UI button eklendi
- ✅ Toast notifications
- ✅ Detailed logging
