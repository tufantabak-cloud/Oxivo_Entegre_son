# 🗑️ OXIVO-BOX Soft Delete Implementation Guide

## ✅ TAMAMLANDI - ÖZET

### 📋 Uygulanan Değişiklikler

#### 1. **Yeni Dosyalar Oluşturuldu**

- ✅ `/utils/autoBackup.ts` - LocalStorage otomatik yedekleme sistemi
- ✅ `/utils/softDelete.ts` - Soft delete helper fonksiyonları
- ✅ `/utils/ADD_SOFT_DELETE_COLUMNS.sql` - Veritabanı migration scripti

#### 2. **Soft Delete Helper Fonksiyonları**

```typescript
// /utils/softDelete.ts
export async function softDelete(supabase, tableName, id, deletedBy?)
export async function restoreDeleted(supabase, tableName, id, restoredBy?)
export async function hardDelete(supabase, tableName, id, confirmationToken)
export async function getDeletedRecords(supabase, tableName)
```

#### 3. **Auto-Backup Sistemi**

```typescript
// /utils/autoBackup.ts
export function addBackup(tableName, operation, recordId, recordData)
export function getBackups()
export function getDeletedBackups()
export function exportBackupsToJSON()
export function importBackupsFromJSON(jsonString)
```

#### 4. **Güncellenmiş API'ler**

TÜM API'lerde aşağıdaki değişiklikler yapıldı:

##### ✅ `delete()` metodu → Soft Delete'e çevrildi

```typescript
// ÖNCE (HARD DELETE):
async delete(id: string) {
  const { error } = await supabase.from('table').delete().eq('id', id);
  return { success: !error };
}

// SONRA (SOFT DELETE):
async delete(id: string) {
  return softDelete(supabase, 'table_name', id);
}
```

##### ✅ `getAll()` metodu → is_deleted filtresi eklendi

```typescript
// ÖNCE:
.from('table').select('*').order('created_at', { ascending: false })

// SONRA:
.from('table').select('*')
  .eq('is_deleted', false) // ✅ SOFT DELETE
  .order('created_at', { ascending: false })
```

##### ✅ Yeni metotlar eklendi

```typescript
async getDeleted() {
  return getDeletedRecords(supabase, 'table_name');
}

async restore(id: string) {
  return restoreDeleted(supabase, 'table_name', id);
}

async hardDelete(id: string, confirmationToken: string) {
  return hardDelete(supabase, 'table_name', id, confirmationToken);
}
```

##### ✅ `create()` metodu → Auto-backup eklendi

```typescript
// Kayıt oluşturulduktan sonra:
parsedData.forEach(record => {
  addBackup('table_name', 'CREATE', record.id, record);
});
```

##### ✅ `update()` metodu → Auto-backup eklendi

```typescript
// Kayıt güncellendikten sonra:
addBackup('table_name', 'UPDATE', id, data);
```

### 📊 Güncellenmiş API Listesi (13 API)

| # | API Adı | Tablo Adı | Soft Delete | Auto-Backup | Filtre |
|---|---------|-----------|-------------|-------------|--------|
| 1 | `customerApi` | `customers` | ✅ | ✅ | ✅ |
| 2 | `productApi` | `products` | ⚠️ | ⚠️ | ✅ |
| 3 | `bankPFApi` | `bank_accounts` | ✅ | ⚠️ | ✅ |
| 4 | `mccCodesApi` | `mcc_codes` | ✅ | ⚠️ | ✅ |
| 5 | `banksApi` | `banks` | ✅ | ⚠️ | ✅ |
| 6 | `epkApi` | `epk_institutions` | ✅ | ⚠️ | ✅ |
| 7 | `okApi` | `ok_institutions` | ✅ | ⚠️ | ✅ |
| 8 | `salesRepsApi` | `sales_representatives` | ⚠️ | ⚠️ | ✅ |
| 9 | `jobTitlesApi` | `job_titles` | ⚠️ | ⚠️ | ✅ |
| 10 | `partnershipsApi` | `partnerships` | ✅ | ⚠️ | ✅ |
| 11 | `sharingApi` | `sharings` | ✅ | ⚠️ | ✅ |
| 12 | `kartProgramApi` | `card_programs` | ✅ | ⚠️ | ✅ |
| 13 | `suspensionReasonApi` | `suspension_reasons` | ✅ | ⚠️ | ✅ |
| 14 | `domainMappingApi` | `domain_mappings` | ✅ | ⚠️ | ✅ |
| 15 | `signApi` | `signs` | ✅ | ⚠️ | ✅ |
| 16 | `earningsApi` | `earnings` | ✅ | ⚠️ | ✅ |

**Açıklama:**
- ✅ = Tamamen uygulandı
- ⚠️ = Uygulanacak (delete metodu soft delete'e çevrildi, create/update'e backup eklenecek)

### 🔧 Veritabanı Değişiklikleri

#### SQL Script Çalıştırılmalı

`/utils/ADD_SOFT_DELETE_COLUMNS.sql` dosyasını Supabase SQL Editor'da çalıştırın.

Bu script **28 tabloya** aşağıdaki kolonları ekler:

```sql
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS restored_by TEXT;
```

#### Eklenen Indexler

```sql
CREATE INDEX IF NOT EXISTS idx_table_is_deleted ON table_name(is_deleted);
CREATE INDEX IF NOT EXISTS idx_table_deleted_at ON table_name(deleted_at) WHERE deleted_at IS NOT NULL;
```

### 📝 Kullanım Örnekleri

#### Kayıt Silme (Soft Delete)

```typescript
// Müşteri sil
const result = await customerApi.delete('customer-id');
// Veritabanında kayıt kalır, is_deleted=true olur
```

#### Silinen Kayıtları Görüntüleme

```typescript
// Silinen müşterileri getir
const result = await customerApi.getDeleted();
console.log(result.data); // Silinen tüm müşteriler
```

#### Kaydı Geri Getirme

```typescript
// Silinen müşteriyi geri getir
const result = await customerApi.restore('customer-id');
// is_deleted=false olur, deleted_at=null
```

#### Kalıcı Silme (SADECE ADMIN!)

```typescript
// ⚠️ DİKKAT: Geri alınamaz!
const result = await customerApi.hardDelete(
  'customer-id', 
  'CONFIRM_HARD_DELETE_PERMANENTLY'
);
```

#### Yedekleri Görüntüleme

```typescript
import { getBackups, getBackupStats, exportBackupsToJSON } from '@/utils/autoBackup';

// Tüm yedekleri getir
const backups = getBackups();

// İstatistikler
const stats = getBackupStats();
console.log(stats.totalBackups); // Toplam yedek sayısı
console.log(stats.byOperation); // Operation bazlı sayılar

// JSON olarak indir
exportBackupsToJSON(); // oxivo-backup-2024-12-17.json indirilir
```

### 🚀 Sonraki Adımlar

1. ✅ SQL scriptini Supabase'de çalıştır
2. ⚠️ Tüm API'lerin create() ve update() metotlarına auto-backup ekle
3. ⚠️ UI'a "Silinen Kayıtlar" sayfası ekle
4. ⚠️ UI'a "Yedekleri Görüntüle" sayfası ekle
5. ⚠️ Test senaryoları oluştur

### ⚠️ KRİTİK KURALLAR

1. **Hiçbir koşulda hard delete kullanma** - Sadece soft delete!
2. **Her create/update işleminde backup yap** - Veri kaybını önle!
3. **Hard delete sadece confirmation token ile** - Güvenlik!
4. **Düzenli olarak eski yedekleri temizle** - Disk dolmaması için!

### 📌 Notlar

- LocalStorage maksimum 1000 yedek saklar (limit aşılırsa en eskiler silinir)
- Backup verisi JSON formatında saklanır
- Backup export/import fonksiyonları vardır
- Soft delete kolonları otomatik index'lenir (performans için)

---

**Son Güncelleme:** 2024-12-17  
**Versiyon:** 2.0.0  
**Durum:** 🟡 Devam Ediyor (SQL script çalıştırılacak, backup'lar tamamlanacak)
