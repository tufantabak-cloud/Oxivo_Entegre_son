# 🗑️ OXIVO-BOX SOFT DELETE MİGRASYON REHBERİ

## ✅ TAMAMLANAN İŞLEMLER

### 1. Soft Delete Yardımcı Fonksiyonlar ✅
- `/utils/softDelete.ts` - Soft delete, restore, hard delete fonksiyonları
- `/utils/autoBackup.ts` - LocalStorage otomatik yedekleme sistemi

### 2. SQL Script ✅
- `/utils/ADD_SOFT_DELETE_COLUMNS.sql` - Tüm tablolara kolonlar ekleyen script

**ÖNEMLI:** Bu SQL script'i Supabase SQL Editor'da çalıştırılmalıdır!

### 3. API Güncellemeleri ✅

#### İmport Edilen Modüller:
```typescript
import { softDelete, restoreDeleted, hardDelete, getDeletedRecords } from './softDelete';
import { addBackup } from './autoBackup';
```

#### Güncellenen API'ler:

##### ✅ customerApi
- `getAll()` - is_deleted=false filtresi eklendi
- `delete()` - Soft delete'e çevrildi
- `getDeleted()` - Yeni metot
- `restore()` - Yeni metot
- `hardDelete()` - Yeni metot (SADECE ADMIN!)
- `create()` - Auto-backup eklendi
- `update()` - Auto-backup eklendi

##### ✅ productApi
- `getAll()` - is_deleted=false filtresi eklendi

##### ✅ bankPFApi
- `getAll()` - is_deleted=false filtresi eklendi
- `delete()` - Soft delete'e çevrildi
- `getDeleted()`, `restore()`, `hardDelete()` eklendi

##### ✅ mccCodesApi
- `getAll()` - is_deleted=false filtresi eklendi
- `delete()` - Soft delete'e çevrildi
- `getDeleted()`, `restore()`, `hardDelete()` eklendi

##### ✅ banksApi
- `getAll()` - is_deleted=false filtresi eklendi
- `delete()` - Soft delete'e çevrildi
- `getDeleted()`, `restore()`, `hardDelete()` eklendi

##### ✅ epkApi
- `getAll()` - is_deleted=false filtresi eklendi
- `delete()` - Soft delete'e çevrildi
- `getDeleted()`, `restore()`, `hardDelete()` eklendi

##### ✅ okApi
- `getAll()` - is_deleted=false filtresi eklendi
- `delete()` - Soft delete'e çevrildi
- `getDeleted()`, `restore()`, `hardDelete()` eklendi

##### ✅ salesRepsApi
- `getAll()` - is_deleted=false filtresi eklendi

##### ✅ jobTitlesApi
- `getAll()` - is_deleted=false filtresi eklendi

##### ✅ partnershipsApi
- `getAll()` - is_deleted=false filtresi eklendi
- `delete()` - Soft delete'e çevrildi
- `getDeleted()`, `restore()`, `hardDelete()` eklendi

##### ✅ sharingApi
- `getAll()` - is_deleted=false filtresi eklendi
- `delete()` - Soft delete'e çevrildi
- `getDeleted()`, `restore()`, `hardDelete()` eklendi

##### ✅ kartProgramApi
- `getAll()` - is_deleted=false filtresi eklendi
- `delete()` - Soft delete'e çevrildi
- `getDeleted()`, `restore()`, `hardDelete()` eklendi

##### ✅ suspensionReasonApi
- `getAll()` - is_deleted=false filtresi eklendi
- `delete()` - Soft delete'e çevrildi
- `getDeleted()`, `restore()`, `hardDelete()` eklendi

##### ✅ domainMappingApi
- `getAll()` - is_deleted=false filtresi eklendi
- `delete()` - Soft delete'e çevrildi
- `getDeleted()`, `restore()`, `hardDelete()` eklendi

##### ✅ signApi (TABELA)
- `getAll()` - is_deleted=false filtresi eklendi
- `delete()` - Soft delete'e çevrildi
- `getDeleted()`, `restore()`, `hardDelete()` eklendi

##### ✅ earningsApi
- `getAll()` - is_deleted=false filtresi eklendi
- `getByFirmaId()` - is_deleted=false filtresi eklendi
- `delete()` - Soft delete'e çevrildi
- `getDeleted()`, `restore()`, `hardDelete()` eklendi

---

## 📋 YAPILACAKLAR LİSTESİ

### 1. Supabase SQL Script'i Çalıştır ⏳
```bash
# Supabase Dashboard > SQL Editor'da çalıştır:
/utils/ADD_SOFT_DELETE_COLUMNS.sql
```

### 2. Diğer API'lere Auto-Backup Ekle ⏳
Aşağıdaki API'lerin `create()` ve `update()` metotlarına `addBackup()` çağrısı eklenecek:
- [ ] productApi.create()
- [ ] productApi.update()
- [ ] bankPFApi.create()
- [ ] bankPFApi.update()
- [ ] mccCodesApi.create()
- [ ] banksApi.create()
- [ ] epkApi.create()
- [ ] okApi.create()
- [ ] salesRepsApi.create()
- [ ] jobTitlesApi.create()
- [ ] partnershipsApi.create()
- [ ] partnershipsApi.update()
- [ ] sharingApi.create()
- [ ] kartProgramApi.create()
- [ ] suspensionReasonApi.create()
- [ ] domainMappingApi.create()
- [ ] signApi.create()
- [ ] signApi.update()
- [ ] earningsApi.create()
- [ ] earningsApi.update()

### 3. UI Oluştur (Opsiyonel) ⏳
- [ ] Silinen kayıtları görüntüleme sayfası
- [ ] Restore butonu
- [ ] Yedekleri dışa aktarma butonu
- [ ] Yedekleme istatistikleri

---

## 🎯 SOFT DELETE KULLANIMI

### Kayıt Silme (Soft Delete)
```typescript
import { customerApi } from './utils/supabaseClient';

// Soft delete - Kayıt silinmez, sadece işaretlenir
await customerApi.delete('customer-id-123');
```

### Silinen Kayıtları Getirme
```typescript
const result = await customerApi.getDeleted();
console.log('Silinen müşteriler:', result.data);
```

### Kayıt Geri Getirme (Restore)
```typescript
await customerApi.restore('customer-id-123');
```

### Kalıcı Silme (Hard Delete - SADECE ADMIN!)
```typescript
// ⚠️ DİKKAT: Bu işlem geri alınamaz!
await customerApi.hardDelete(
  'customer-id-123',
  'CONFIRM_HARD_DELETE_PERMANENTLY'
);
```

---

## 💾 OTOMATIK YEDEKLEME KULLANIMI

### Yedekleri Görüntüleme
```typescript
import { getBackups, getBackupStats } from './utils/autoBackup';

// Tüm yedekleri getir
const backups = getBackups();
console.log('Toplam yedek:', backups.backups.length);

// İstatistikler
const stats = getBackupStats();
console.log('İstatistikler:', stats);
```

### Yedekleri Dışa Aktarma
```typescript
import { exportBackupsToJSON } from './utils/autoBackup';

// JSON dosyası olarak indir
exportBackupsToJSON();
```

### Yedekleri İçe Aktarma
```typescript
import { importBackupsFromJSON } from './utils/autoBackup';

// JSON string'den geri yükle
const jsonString = '...'; // JSON dosyasından oku
importBackupsFromJSON(jsonString);
```

### Eski Yedekleri Temizleme
```typescript
import { cleanOldBackups } from './utils/autoBackup';

// 30 günden eski yedekleri temizle
const removedCount = cleanOldBackups(30);
console.log(`${removedCount} eski yedek temizlendi`);
```

---

## ⚠️ ÖNEMLİ NOTLAR

1. **HİÇBİR VERİ KALICI OLARAK SİLİNMEZ!**
   - Tüm delete işlemleri soft delete olarak çalışır
   - Veriler sadece `is_deleted=true` olarak işaretlenir
   
2. **Otomatik Yedekleme**
   - Her CREATE, UPDATE, DELETE işleminde otomatik yedekleme yapılır
   - Maksimum 1000 yedek saklanır (disk dolmaması için)
   
3. **Hard Delete**
   - Sadece kritik durumlarda kullanılmalıdır
   - Confirmation token gerektirir
   - Geri alınamaz!

4. **SQL Script**
   - Supabase Dashboard > SQL Editor'da çalıştırılmalıdır
   - Tüm tablolara is_deleted, deleted_at, deleted_by kolonlarını ekler
   - Performans için indexler oluşturur

---

## 🔧 TROUBLESHOOTING

### "column is_deleted does not exist" Hatası
➡️ Çözüm: SQL script'i henüz çalıştırılmamış. `/utils/ADD_SOFT_DELETE_COLUMNS.sql` dosyasını Supabase SQL Editor'da çalıştırın.

### LocalStorage Dolu Hatası
➡️ Çözüm: Eski yedekleri temizleyin:
```typescript
import { cleanOldBackups } from './utils/autoBackup';
cleanOldBackups(7); // 7 günden eski yedekleri sil
```

### Soft Delete Çalışmıyor
➡️ Kontrol: 
1. SQL script çalıştırıldı mı?
2. API'ler doğru import edildi mi?
3. Supabase bağlantısı çalışıyor mu?

---

## 📊 VERİ AKIŞI

```
[KULLANICI SİLME İSTEĞİ]
         ↓
[customerApi.delete(id)]
         ↓
[softDelete() fonksiyonu]
         ↓
[1. Kaydı Supabase'den getir]
         ↓
[2. LocalStorage'a yedekle]
         ↓
[3. is_deleted=true, deleted_at=NOW() olarak güncelle]
         ↓
[TAMAMLANDI ✅]
```

---

## 🎉 BAŞARILI MİGRASYON KONTROL LİSTESİ

- [x] Soft delete yardımcı fonksiyonları oluşturuldu
- [x] Auto-backup sistemi oluşturuldu
- [x] SQL migration script'i hazırlandı
- [x] Tüm API'ler soft delete kullanacak şekilde güncellendi
- [x] Tüm getAll() metotlarına is_deleted filtresi eklendi
- [ ] SQL script Supabase'de çalıştırıldı
- [ ] Tüm API'lere auto-backup eklendi
- [ ] Test edildi ve çalıştığı doğrulandı

---

**Son Güncelleme:** 2024-12-17
**Versiyon:** 2071+
