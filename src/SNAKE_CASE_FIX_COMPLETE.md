# ✅ Snake Case Converter Fix

## ❌ Sorun

### Önceki Converter:
```javascript
function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}
```

### Yaptığı Hata:
```javascript
linkedBankPFIds → linked_bank_p_f_i_ds  ❌
// Her büyük harf önüne underscore koyuyor
```

### Supabase'in Beklediği:
```javascript
linkedBankPFIds → linked_bank_pf_ids  ✅
```

### Console Error:
```
Could not find the 'linked_bank_p_f_ids' column  ❌
// Tablo 'linked_bank_pf_ids' bekliyor ama kod 'linked_bank_p_f_ids' gönderiyor
```

---

## ✅ Çözüm

### Yeni Converter:
```javascript
function toSnakeCase(str) {
  return str
    // Insert underscore before uppercase letter that follows a lowercase letter
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    // Insert underscore before uppercase letter that follows another uppercase letter and is followed by lowercase
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}
```

### Test Sonuçları:
```javascript
linkedBankPFIds            → linked_bank_pf_ids        ✅
serviceFeeSettings         → service_fee_settings      ✅
domainHierarchy           → domain_hierarchy           ✅
bankDeviceAssignments     → bank_device_assignments    ✅
cariHesapKodu             → cari_hesap_kodu            ✅
guncelMyPayterDomain      → guncel_my_payter_domain    ✅
salesRepId                → sales_rep_id               ✅
ignoreMainDomain          → ignore_main_domain         ✅
```

---

## 🎯 Şimdi Ne Yapmalı?

### 1️⃣ Tarayıcıyı Yenile
```
CTRL + SHIFT + R (Hard reload)
```

### 2️⃣ JSON Import Et

### 3️⃣ Console'da Göreceksin:
```
🔍 Sample record keys (without id): cari_hesap_kodu, sektor, mcc...
✅ Created 352 customers in Supabase
```

---

## 📝 Değişen Dosya

- `/utils/supabaseClient.ts` → `toSnakeCase()` fonksiyonu güncellendi

---

**Hazır! Şimdi tekrar test et.** 🚀
