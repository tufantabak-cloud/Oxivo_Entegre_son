# 🔧 DEFINITIONS SYNC - KURULUM TALİMATLARI

## ⚠️ ŞU ANDA DURUM

**Definitions sync GEÇİCİ OLARAK DEVRE DIŞI BIRAKILDI!**

✅ **Çalışıyor:**
- `customers` → Supabase sync ✅
- `products` → Supabase sync ✅
- `bank_accounts` → Supabase sync ✅

❌ **Devre dışı:**
- `mccCodes`, `banks`, `epkList`, `okList`, `salesReps`, `jobTitles`, `partnerships`, `hesapKalemleri`, `sabitKomisyonlar`, `ekGelirler`

---

## 🚀 DEFINITIONS SYNC'İNİ AÇMAK İÇİN

### **ADIM 1: SQL'i Çalıştır**

1. Supabase Dashboard → **SQL Editor**
2. `/SUPABASE_DEFINITIONS_FIX.sql` dosyasını aç
3. **Tüm içeriği** kopyala-yapıştır
4. **RUN** tıkla ✅

**SQL neler yapar:**
```sql
-- 1. Eski tabloları siler
DROP TABLE IF EXISTS mcc_codes CASCADE;
DROP TABLE IF EXISTS banks CASCADE;
DROP TABLE IF EXISTS epk_list CASCADE;
DROP TABLE IF EXISTS ok_list CASCADE;
-- ... (10 tablo)

-- 2. Yeni tabloları oluşturur (doğru şema ile)
CREATE TABLE mcc_codes (...);
CREATE TABLE banks (...);
CREATE TABLE epk_institutions (...);  -- ⚠️ DİKKAT: "epk_institutions"
CREATE TABLE ok_institutions (...);   -- ⚠️ DİKKAT: "ok_institutions"
-- ... (10 tablo)

-- 3. RLS politikalarını ekler
ALTER TABLE mcc_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for anon" ON mcc_codes ...;
-- ... (10 tablo)
```

---

### **ADIM 2: Tabloları Doğrula**

Supabase Dashboard → **Table Editor** → Şu tabloların olduğunu kontrol et:

- ✅ `mcc_codes`
- ✅ `banks`
- ✅ `epk_institutions` (⚠️ `epk_list` DEĞİL!)
- ✅ `ok_institutions` (⚠️ `ok_list` DEĞİL!)
- ✅ `sales_representatives`
- ✅ `job_titles`
- ✅ `partnerships`
- ✅ `account_items`
- ✅ `fixed_commissions`
- ✅ `additional_revenues`

---

### **ADIM 3: App.tsx'i Güncelle**

`/App.tsx` dosyasında 367. satırı aç (yorumu kaldır):

**ŞU ANDA (Kapalı):**
```typescript
syncAllData({
  customers,
  products: payterProducts,
  bankPF: bankPFRecords,
  // ⚠️ DEFINITIONS SYNC TEMPORARILY DISABLED
  // Uncomment after running /SUPABASE_DEFINITIONS_FIX.sql
  // mccCodes: mccList,
  // banks: banks,
  // epkList: epkList,
  // okList: okList,
  // salesReps: salesReps,
  // jobTitles: jobTitles,
  // partnerships: partnerships,
  // accountItems: hesapKalemleri,
  // fixedCommissions: sabitKomisyonlar,
  // additionalRevenues: ekGelirler
});
```

**AÇILACAK (SQL çalıştırdıktan sonra):**
```typescript
syncAllData({
  customers,
  products: payterProducts,
  bankPF: bankPFRecords,
  mccCodes: mccList,
  banks: banks,
  epkList: epkList,
  okList: okList,
  salesReps: salesReps,
  jobTitles: jobTitles,
  partnerships: partnerships,
  accountItems: hesapKalemleri,
  fixedCommissions: sabitKomisyonlar,
  additionalRevenues: ekGelirler
});
```

**VE 375. satırdaki dependency array'i de güncelle:**

```typescript
}, [
  customers, 
  payterProducts, 
  bankPFRecords, 
  mccList,          // ← EKLE
  banks,            // ← EKLE
  epkList,          // ← EKLE
  okList,           // ← EKLE
  salesReps,        // ← EKLE
  jobTitles,        // ← EKLE
  partnerships,     // ← EKLE
  hesapKalemleri,   // ← EKLE
  sabitKomisyonlar, // ← EKLE
  ekGelirler,       // ← EKLE
  dataLoaded
]);
```

**VE 362. satırdaki logger.debug'u da güncelle:**

```typescript
logger.debug('🔄 Auto-syncing all data to Supabase...', {
  customers: customers.length,
  products: payterProducts.length,
  bankPF: bankPFRecords.length,
  mccCodes: mccList.length,           // ← EKLE
  banks: banks.length,                 // ← EKLE
  epkList: epkList.length,             // ← EKLE
  okList: okList.length,               // ← EKLE
  salesReps: salesReps.length,         // ← EKLE
  jobTitles: jobTitles.length,         // ← EKLE
  partnerships: partnerships.length,   // ← EKLE
  accountItems: hesapKalemleri.length, // ← EKLE
  fixedCommissions: sabitKomisyonlar.length, // ← EKLE
  additionalRevenues: ekGelirler.length      // ← EKLE
});
```

---

### **ADIM 4: Test Et**

```bash
npm run dev
```

**Beklenen Konsol Çıktısı:**

```
✅ Customers synced: 352 records
✅ Products synced: 2883 records
✅ BankPF records synced: 4 records
✅ MCC Codes synced: 15 records
✅ Banks synced: 25 records
✅ EPK List synced: 10 records
✅ OK List synced: 8 records
✅ Sales Representatives synced: 5 records
✅ Job Titles synced: 14 records
✅ Partnerships synced: 6 records
✅ Account Items synced: 20 records
✅ Fixed Commissions synced: 15 records
✅ Additional Revenues synced: 10 records

✅ Batch sync complete!
📊 Summary: {
  operations: 13,
  successful: 13,
  failed: 0,
  totalRecords: 3571
}
```

---

## 🔍 SORUN GİDERME

### Hata: "Could not find the table"
✅ **Çözüm:** SQL'i çalıştırmadın! ADIM 1'i yap.

### Hata: "Could not find the column"
✅ **Çözüm:** Eski tablolar mevcut! SQL'de `DROP TABLE` komutlarını çalıştır.

### Hata: "epk_list not found"
✅ **Çözüm:** Tablo ismi `epk_institutions` olmalı! SQL'i kontrol et.

---

## 📊 ÖZET

| Durum | Açıklama |
|---|---|
| 🔴 **ŞİMDİ** | Definitions sync kapalı, sadece customers/products/bankPF sync |
| 🟢 **HEDEF** | SQL çalıştır → App.tsx'i güncelle → Tüm sync açık |

**SQL'i çalıştır ve bana haber ver! 🚀**
