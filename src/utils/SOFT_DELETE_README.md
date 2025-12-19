# 🗑️ OXIVO-BOX Soft Delete & Auto-Backup Sistemi

## 🎯 Genel Bakış

OXIVO-BOX uygulamasında **hiçbir veri asla kalıcı olarak silinmez**. Tüm silme işlemleri "soft delete" yöntemi ile yapılır ve her işlem otomatik olarak yedeklenir.

## ✅ Uygulanan Sistemler

### 1. **Soft Delete Mekanizması**

Kayıtlar veritabanından silinmez, sadece işaretlenir:

```typescript
// Silme işlemi
await customerApi.delete('customer-id');
// → is_deleted = true, deleted_at = '2024-12-17T10:30:00Z'

// Geri getirme
await customerApi.restore('customer-id');
// → is_deleted = false, deleted_at = null
```

**Veritabanı Kolonları:**
- `is_deleted` (BOOLEAN) - Kayıt silinmiş mi?
- `deleted_at` (TIMESTAMP) - Ne zaman silinmiş?
- `deleted_by` (TEXT) - Kim silmiş? (opsiyonel)
- `restored_at` (TIMESTAMP) - Ne zaman geri getirilmiş?
- `restored_by` (TEXT) - Kim geri getirmiş? (opsiyonel)

### 2. **Otomatik Yedekleme (Auto-Backup)**

Her işlem otomatik olarak LocalStorage'a yedeklenir:

```typescript
// CREATE işlemi
await customerApi.create({ name: 'Müşteri A' });
// → LocalStorage'a CREATE olarak yedeklenir

// UPDATE işlemi
await customerApi.update('id', { name: 'Müşteri B' });
// → LocalStorage'a UPDATE olarak yedeklenir

// SOFT_DELETE işlemi
await customerApi.delete('id');
// → LocalStorage'a SOFT_DELETE olarak yedeklenir
```

**Yedekleme Özellikleri:**
- Maksimum 1000 yedek saklanır
- JSON formatında export/import edilebilir
- Tablo ve işlem bazlı istatistikler
- Otomatik temizleme (30 gün+)

## 📁 Dosya Yapısı

```
/utils/
  ├── softDelete.ts              # Soft delete helper fonksiyonları
  ├── autoBackup.ts              # LocalStorage otomatik yedekleme
  ├── supabaseClient.ts          # TÜM API'ler güncellendi
  ├── ADD_SOFT_DELETE_COLUMNS.sql # Veritabanı migration script
  ├── SOFT_DELETE_IMPLEMENTATION_GUIDE.md
  ├── API_BACKUP_SUMMARY.md
  └── SOFT_DELETE_README.md      # Bu dosya

/components/
  ├── BackupManager.tsx          # Yedek yönetimi UI
  └── DeletedRecordsPanel.tsx    # Silinen kayıtlar paneli
```

## 🚀 Kurulum

### Adım 1: Veritabanı Güncellemesi

`/utils/ADD_SOFT_DELETE_COLUMNS.sql` dosyasını Supabase SQL Editor'da çalıştırın:

```sql
-- Tüm tablolara soft delete kolonları ekler
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
-- ... (28 tablo için tekrarlanır)
```

Bu script:
- ✅ 28 tabloya soft delete kolonları ekler
- ✅ Performans için indexler oluşturur
- ✅ Hiçbir mevcut veriyi bozmaz (IF NOT EXISTS kullanır)

### Adım 2: API Kullanımı

Tüm API'ler otomatik olarak güncellenmiştir. Hiçbir değişiklik yapmanıza gerek yok!

```typescript
// Müşteri sil (soft delete)
const result = await customerApi.delete('customer-id');

// Silinen müşterileri listele
const deleted = await customerApi.getDeleted();

// Müşteriyi geri getir
const restored = await customerApi.restore('customer-id');
```

## 📊 Güncellenmiş API'ler

Aşağıdaki API'ler soft delete ve auto-backup destekler:

| API | Tablo | Soft Delete | Auto-Backup | Filtre |
|-----|-------|-------------|-------------|--------|
| `customerApi` | customers | ✅ | ✅ | ✅ |
| `productApi` | products | ✅ | ✅ | ✅ |
| `bankPFApi` | bank_accounts | ✅ | ✅ | ✅ |
| `mccCodesApi` | mcc_codes | ✅ | ✅ | ✅ |
| `banksApi` | banks | ✅ | ✅ | ✅ |
| `epkApi` | epk_institutions | ✅ | ✅ | ✅ |
| `okApi` | ok_institutions | ✅ | ✅ | ✅ |
| `salesRepsApi` | sales_representatives | ✅ | ✅ | ✅ |
| `jobTitlesApi` | job_titles | ✅ | ✅ | ✅ |
| `partnershipsApi` | partnerships | ✅ | ⚠️ | ✅ |
| `sharingApi` | sharings | ✅ | ⚠️ | ✅ |
| `kartProgramApi` | card_programs | ✅ | ⚠️ | ✅ |
| `suspensionReasonApi` | suspension_reasons | ✅ | ⚠️ | ✅ |
| `domainMappingApi` | domain_mappings | ✅ | ⚠️ | ✅ |
| `signApi` | signs | ✅ | ⚠️ | ✅ |
| `earningsApi` | earnings | ✅ | ⚠️ | ✅ |

**Notlar:**
- ✅ = Tamamen uygulandı
- ⚠️ = create() metoduna backup eklenecek (delete() soft delete'e çevrildi)

## 🎨 UI Bileşenleri

### BackupManager

Yedekleri görüntüle ve yönet:

```tsx
import { BackupManager } from '@/components/BackupManager';

function App() {
  return <BackupManager />;
}
```

**Özellikler:**
- 📊 Toplam yedek istatistikleri
- 📋 Tablo bazlı istatistikler
- 📥 JSON export
- 🗑️ Eski yedekleri temizle
- ⚠️ Tüm yedekleri sil (onay ile)

### DeletedRecordsPanel

Silinen kayıtları görüntüle ve geri getir:

```tsx
import { DeletedRecordsPanel } from '@/components/DeletedRecordsPanel';

function App() {
  return <DeletedRecordsPanel />;
}
```

**Özellikler:**
- 🗂️ Tablo seçici
- 📋 Silinen kayıtlar listesi
- ♻️ Geri getirme (restore)
- 🚨 Kalıcı silme (hard delete)

## 📖 API Referansı

### Soft Delete Fonksiyonları

```typescript
import { 
  softDelete, 
  restoreDeleted, 
  hardDelete, 
  getDeletedRecords 
} from '@/utils/softDelete';

// Soft delete
await softDelete(supabase, 'customers', 'customer-id');

// Restore
await restoreDeleted(supabase, 'customers', 'customer-id');

// Hard delete (GERİ ALINAMAZ!)
await hardDelete(supabase, 'customers', 'customer-id', 'CONFIRM_HARD_DELETE_PERMANENTLY');

// Get deleted records
const deleted = await getDeletedRecords(supabase, 'customers');
```

### Auto-Backup Fonksiyonları

```typescript
import {
  addBackup,
  getBackups,
  getBackupStats,
  exportBackupsToJSON,
  cleanOldBackups
} from '@/utils/autoBackup';

// Yedek ekle
addBackup('customers', 'CREATE', 'customer-id', recordData);

// Tüm yedekleri getir
const backups = getBackups();

// İstatistikler
const stats = getBackupStats();
console.log(stats.totalBackups); // 150
console.log(stats.byOperation); // { CREATE: 50, UPDATE: 80, SOFT_DELETE: 20 }

// JSON export
exportBackupsToJSON(); // oxivo-backup-2024-12-17.json indirilir

// Eski yedekleri temizle (30 gün+)
const removed = cleanOldBackups(30);
```

## ⚠️ Önemli Notlar

### 1. Hard Delete Kullanımı

Hard delete **sadece kritik durumlarda** kullanılmalıdır:

```typescript
// ⚠️ DİKKAT: Geri alınamaz!
await customerApi.hardDelete(
  'customer-id',
  'CONFIRM_HARD_DELETE_PERMANENTLY'
);
```

Token olmadan hard delete yapılamaz (güvenlik).

### 2. LocalStorage Limiti

- Maksimum 1000 yedek saklanır
- Limit aşılırsa en eski kayıtlar otomatik silinir
- Düzenli olarak JSON export yapın

### 3. Performans

- `is_deleted` kolonları index'lidir
- getAll() sorguları `eq('is_deleted', false)` filtresi kullanır
- Silinen kayıtlar normal sorgularda görünmez

## 🧪 Test Senaryoları

### 1. Soft Delete Testi

```typescript
// 1. Kayıt oluştur
const created = await customerApi.create({ name: 'Test Müşteri' });
console.log(created.data); // { id: '...', name: 'Test Müşteri' }

// 2. Sil (soft delete)
await customerApi.delete(created.data.id);

// 3. Normal listede görünmemeli
const all = await customerApi.getAll();
console.log(all.data.find(c => c.id === created.data.id)); // undefined

// 4. Silinen kayıtlarda görünmeli
const deleted = await customerApi.getDeleted();
console.log(deleted.data.find(c => c.id === created.data.id)); // { id: '...', isDeleted: true }

// 5. Geri getir
await customerApi.restore(created.data.id);

// 6. Tekrar normal listede görünmeli
const all2 = await customerApi.getAll();
console.log(all2.data.find(c => c.id === created.data.id)); // { id: '...', isDeleted: false }
```

### 2. Auto-Backup Testi

```typescript
import { getBackups } from '@/utils/autoBackup';

// 1. İlk durum
const before = getBackups();
console.log(before.backups.length); // örn: 50

// 2. Kayıt oluştur
await customerApi.create({ name: 'Test' });

// 3. Backup eklenmiş olmalı
const after = getBackups();
console.log(after.backups.length); // 51
console.log(after.backups[0].operation); // 'CREATE'
console.log(after.backups[0].tableName); // 'customers'
```

## 🐛 Sorun Giderme

### Sorun: "is_deleted column does not exist"

**Çözüm:** SQL migration scriptini çalıştırmadınız.

```sql
-- /utils/ADD_SOFT_DELETE_COLUMNS.sql dosyasını Supabase'de çalıştırın
```

### Sorun: Silinen kayıtlar hala görünüyor

**Çözüm:** getAll() metodunda filtre eksik.

```typescript
// YANLIŞ:
.from('table').select('*')

// DOĞRU:
.from('table').select('*').eq('is_deleted', false)
```

### Sorun: Backup çalışmıyor

**Çözüm:** import eksik.

```typescript
// supabaseClient.ts dosyasının başında:
import { addBackup } from './autoBackup';

// create() metodunun sonunda:
data.forEach(record => {
  addBackup('table_name', 'CREATE', record.id, record);
});
```

## 📝 Changelog

### v2.0.0 (2024-12-17)

- ✅ Soft delete sistemi eklendi (28 tablo)
- ✅ Auto-backup sistemi eklendi (LocalStorage)
- ✅ 16 API güncellendi (delete → softDelete)
- ✅ getAll() metotlarına is_deleted filtresi eklendi
- ✅ BackupManager UI komponenti eklendi
- ✅ DeletedRecordsPanel UI komponenti eklendi
- ✅ SQL migration scripti oluşturuldu
- ✅ Dokümantasyon tamamlandı

### Sonraki Adımlar

- ⚠️ Kalan API'lerin create() metotlarına backup ekle
- ⚠️ UI'a backup ve deleted records panellerini entegre et
- ⚠️ Test senaryolarını çalıştır
- ⚠️ Production ortamında SQL scriptini çalıştır

## 📞 Destek

Sorularınız için:
- 📄 `/utils/SOFT_DELETE_IMPLEMENTATION_GUIDE.md` dosyasına bakın
- 📊 `/utils/API_BACKUP_SUMMARY.md` dosyasına bakın

---

**Son Güncelleme:** 2024-12-17  
**Versiyon:** 2.0.0  
**Durum:** ✅ Kullanıma Hazır (SQL script çalıştırılmalı)
