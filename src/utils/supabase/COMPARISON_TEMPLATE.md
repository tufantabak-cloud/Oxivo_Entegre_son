# 🔍 SUPABASE SCHEMA VALIDATION SONUÇ RAPORU

**Tarih:** [BURAYA TARİH YAZIN]  
**Kontrol Eden:** [BURAYA İSİM YAZIN]  
**SQL Dosyası:** [minimalCheck.sql / quickSchemaCheck.sql / SCHEMA_VALIDATION_COMPLETE.sql]

---

## 📊 ÖZET

| Metrik | Beklenen | Gerçek | Durum |
|--------|----------|--------|-------|
| **Toplam Tablo** | 20 | [BURAYA YAZIN] | ✅/❌ |
| **Toplam Sütun** | ~200+ | [BURAYA YAZIN] | ✅/❌ |
| **Toplam Kayıt** | Değişken | [BURAYA YAZIN] | ℹ️ |
| **Primary Keys** | 20 (hepsi UUID) | [BURAYA YAZIN] | ✅/❌ |
| **Unique Constraints** | 4 (kod sütunları) | [BURAYA YAZIN] | ✅/❌ |
| **Foreign Keys** | 0-3 (opsiyonel) | [BURAYA YAZIN] | ℹ️ |

---

## 📋 TABLO KONTROLÜ

### ✅ MEVCUT TABLOLAR
[BURAYA SQL SONUÇLARINDAN TABLO LİSTESİNİ KOPYALAYIN]

Örnek:
```
1.  account_items           ✅ 5 sütun
2.  additional_revenues     ✅ 12 sütun
3.  bank_accounts           ✅ 15 sütun
4.  banks                   ✅ 5 sütun
5.  customers               ✅ 18 sütun
...
20. suspension_reasons      ✅ 4 sütun
```

### ❌ EKSIK TABLOLAR
[YOKSA "YOK" YAZIN, VARSA LİSTELEYİN]

---

## 🔍 DETAYLI KARŞILAŞTIRMA

### 1️⃣ CUSTOMERS Tablosu

| Sütun (Frontend) | Sütun (Supabase) | Beklenen Tip | Gerçek Tip | Durum |
|------------------|------------------|--------------|------------|-------|
| `id` | `id` | UUID | [BURAYA YAZIN] | ✅/❌ |
| `cariAdi` | `cari_adi` | TEXT NOT NULL | [BURAYA YAZIN] | ✅/❌ |
| `vergiDairesi` | `vergi_dairesi` | TEXT | [BURAYA YAZIN] | ✅/❌ |
| `linkedBankPFIds` | `linked_bank_pf_ids` | JSONB | [BURAYA YAZIN] | ✅/❌ |
| ... | ... | ... | ... | ... |

**NOTLAR:**
[BURAYA ÖZEL NOTLAR YAZIN]

---

### 2️⃣ BANK_ACCOUNTS Tablosu

| Sütun (Frontend) | Sütun (Supabase) | Beklenen Tip | Gerçek Tip | Durum |
|------------------|------------------|--------------|------------|-------|
| `id` | `id` | UUID | [BURAYA YAZIN] | ✅/❌ |
| `firmaUnvan` | `firma_unvan` | TEXT NOT NULL | [BURAYA YAZIN] | ✅/❌ |
| `agreementBanks` | `agreement_banks` | JSONB | [BURAYA YAZIN] | ✅/❌ |
| ... | ... | ... | ... | ... |

**NOTLAR:**
[BURAYA ÖZEL NOTLAR YAZIN]

---

### 3️⃣ SIGNS Tablosu (TABELA - KRİTİK!)

| Sütun (Frontend) | Sütun (Supabase) | Beklenen Tip | Gerçek Tip | Durum |
|------------------|------------------|--------------|------------|-------|
| `id` | `id` | UUID | [BURAYA YAZIN] | ✅/❌ |
| `firmaId` | `firma_id` | UUID | [BURAYA YAZIN] | ✅/❌ |
| `kurulus` | `kurulus` | JSONB NOT NULL | [BURAYA YAZIN] | ✅/❌ |
| `gelirModeli` | `gelir_modeli` | JSONB NOT NULL | [BURAYA YAZIN] | ✅/❌ |
| `komisyonOranları` | `komisyon_oranlari` | JSONB NOT NULL | [BURAYA YAZIN] | ✅/❌ |
| `kartProgramIds` | `kart_program_ids` | JSONB | [BURAYA YAZIN] | ✅/❌ |
| ... | ... | ... | ... | ... |

**KRİTİK KONTROL:**
- [ ] `firma_id` sütunu var mı? → [EVET/HAYIR]
- [ ] `firma_id` UUID tipinde mi? → [EVET/HAYIR]
- [ ] `firma_id` NULL değer alabilir mi? → [EVET/HAYIR - Almamalı!]
- [ ] Foreign Key constraint var mı? → [EVET/HAYIR - Yoksa normal]

**NOTLAR:**
[BURAYA ÖZEL NOTLAR YAZIN]

---

### 4️⃣ EARNINGS Tablosu (Hakediş)

| Sütun (Frontend) | Sütun (Supabase) | Beklenen Tip | Gerçek Tip | Durum |
|------------------|------------------|--------------|------------|-------|
| `id` | `id` | UUID | [BURAYA YAZIN] | ✅/❌ |
| `firmaId` | `firma_id` | UUID | [BURAYA YAZIN] | ✅/❌ |
| `donem` | `donem` | TEXT NOT NULL | [BURAYA YAZIN] | ✅/❌ |
| `detaylar` | `detaylar` | JSONB | [BURAYA YAZIN] | ✅/❌ |
| ... | ... | ... | ... | ... |

**KRİTİK KONTROL:**
- [ ] `firma_id` sütunu var mı? → [EVET/HAYIR]
- [ ] `firma_id` UUID tipinde mi? → [EVET/HAYIR]

**NOTLAR:**
[BURAYA ÖZEL NOTLAR YAZIN]

---

## 🔗 CONSTRAINT KONTROLÜ

### PRIMARY KEYS
[BURAYA SQL SONUÇLARINDAN PRIMARY KEY LİSTESİNİ KOPYALAYIN]

Örnek:
```
account_items.id           ✅ UUID
additional_revenues.id     ✅ UUID
bank_accounts.id           ✅ UUID
...
```

**Durum:** [TÜMÜ UUID İSE ✅, DEĞİLSE ❌]

---

### UNIQUE CONSTRAINTS
[BURAYA SQL SONUÇLARINDAN UNIQUE CONSTRAINT LİSTESİNİ KOPYALAYIN]

Beklenen:
```
mcc_codes.kod              ✅ UNIQUE
banks.kod                  ✅ UNIQUE
epk_institutions.kod       ✅ UNIQUE
ok_institutions.kod        ✅ UNIQUE
```

**Durum:** [4 TANE VARSA ✅, EKSIK VARSA ❌]

---

### FOREIGN KEYS
[BURAYA SQL SONUÇLARINDAN FOREIGN KEY LİSTESİNİ KOPYALAYIN]

**Beklenen (Opsiyonel):**
- `signs.firma_id` → `bank_accounts.id`
- `earnings.firma_id` → `bank_accounts.id`
- `kart_programlar.banka_id` → `banks.id`

**Gerçek:**
[VARSA LİSTELEYİN, YOKSA "YOK (NORMAL - Runtime enrichment kullanılıyor)" YAZIN]

---

## 📦 JSONB SÜTUNLAR

| Tablo | Sütun | Durum | Not |
|-------|-------|-------|-----|
| `customers` | `linked_bank_pf_ids` | [✅/❌] | |
| `bank_accounts` | `agreement_banks` | [✅/❌] | |
| `bank_accounts` | `agreement_epks` | [✅/❌] | |
| `bank_accounts` | `agreement_oks` | [✅/❌] | |
| `bank_accounts` | `isbirlikleri` | [✅/❌] | |
| `signs` | `kurulus` | [✅/❌] | **KRİTİK** |
| `signs` | `gelir_modeli` | [✅/❌] | **KRİTİK** |
| `signs` | `komisyon_oranlari` | [✅/❌] | **KRİTİK** |
| `signs` | `kart_program_ids` | [✅/❌] | |
| `signs` | `hazine_geliri` | [✅/❌] | Nullable |
| `signs` | `paylasim_oranlari` | [✅/❌] | |
| `earnings` | `detaylar` | [✅/❌] | |

---

## 🔍 ÖZEL KONTROLLER

### ✅ snake_case İsimlendirme
- [ ] Tüm tablo isimleri snake_case (küçük harf + underscore)
- [ ] Tüm sütun isimleri snake_case
- [ ] Türkçe karakterler ASCII'ye dönüşmüş (ı→i, ö→o, ü→u, ş→s, ğ→g, ç→c)

**Durum:** [✅/❌]

---

### ✅ Timestamp Sütunlar
- [ ] Tüm tablolarda `created_at` var
- [ ] Tüm tablolarda `updated_at` var
- [ ] `signs` tablosunda `olusturma_tarihi` var
- [ ] Default değeri `now()` veya `CURRENT_TIMESTAMP`

**Durum:** [✅/❌]

---

### ✅ Aktif/Pasif Sütunu
- [ ] Tüm tanım tablolarında `aktif` sütunu var
- [ ] `aktif` BOOLEAN tipinde
- [ ] Default değeri `true`

**Durum:** [✅/❌]

---

## ⚠️ TESPİT EDİLEN SORUNLAR

### 🔴 KRİTİK SORUNLAR
[VARSA LİSTELEYİN, YOKSA "YOK" YAZIN]

Örnek:
```
1. signs.firma_id sütunu eksik
2. customers.linked_bank_pf_ids JSONB değil
```

---

### 🟡 UYARILAR
[VARSA LİSTELEYİN, YOKSA "YOK" YAZIN]

Örnek:
```
1. Foreign Key constraint eksik (Normal - Runtime enrichment)
2. Index eksik olabilir (Performans için eklenebilir)
```

---

### 🟢 ÖNERİLER
[VARSA LİSTELEYİN, YOKSA "YOK" YAZIN]

Örnek:
```
1. signs.firma_id için index eklenebilir
2. Foreign Key constraint eklenebilir (veri bütünlüğü için)
```

---

## 📈 VERİ İSTATİSTİKLERİ

| Tablo | Kayıt Sayısı | Tablo Boyutu |
|-------|--------------|--------------|
| `customers` | [BURAYA YAZIN] | [BURAYA YAZIN] |
| `products` | [BURAYA YAZIN] | [BURAYA YAZIN] |
| `bank_accounts` | [BURAYA YAZIN] | [BURAYA YAZIN] |
| `signs` | [BURAYA YAZIN] | [BURAYA YAZIN] |
| `earnings` | [BURAYA YAZIN] | [BURAYA YAZIN] |
| ... | ... | ... |
| **TOPLAM** | [BURAYA YAZIN] | [BURAYA YAZIN] |

---

## ✅ SONUÇ

### GENEL DURUM: [✅ BAŞARILI / ⚠️ UYARILAR VAR / ❌ KRİTİK SORUN]

**Özet:**
[BURAYA GENEL DEĞERLENDİRME YAZIN]

Örnek:
```
✅ 20 tablo mevcut
✅ Tüm Primary Key'ler UUID
✅ JSONB sütunlar doğru
⚠️ Foreign Key constraint'ler eksik (Normal - Runtime enrichment kullanılıyor)
✅ snake_case isimlendirme doğru
```

### DATABASE_SCHEMA_MAP.md DURUMU: [✅ GÜNCEL / ❌ GÜNCELLENMELİ]

**Açıklama:**
[BURAYA AÇIKLAMA YAZIN]

---

## 🎯 YAPILACAKLAR

### Kısa Vadeli (1 Hafta)
- [ ] [BURAYA EKLEYIN]
- [ ] [BURAYA EKLEYIN]

### Orta Vadeli (1 Ay)
- [ ] [BURAYA EKLEYIN]
- [ ] [BURAYA EKLEYIN]

### Uzun Vadeli (3 Ay)
- [ ] [BURAYA EKLEYIN]
- [ ] [BURAYA EKLEYIN]

---

**Rapor Hazırlayan:** [İSİM]  
**Tarih:** [TARİH]  
**Versiyon:** 3.2.0  
**Sonraki Kontrol:** [TARİH]
