# 🔧 SUPABASE SYNC SORUN GİDERME KILAVUZU

## ✅ OTOMATIK ÇÖZÜLEN SORUNLAR

Aşağıdaki sorunlar kod güncellemeleri ile otomatik olarak düzeltildi:

### 1. Duplicate Row Hatası (Banks, EPK, OK)
**Sorun:** "ON CONFLICT DO UPDATE command cannot affect row a second time"
**Çözüm:** 3-step deduplication stratejisi
- Step 1: Raw data'da duplicate kontrolü
- Step 2: objectToSnakeCase transformation
- Step 3: Sanitization sonrası duplicate kontrolü

### 2. Schema Uyumsuzlukları
**Sorun:** Yanlış kolon adları gönderiliyordu

| Tablo | ❌ Yanlış Kolonlar | ✅ Doğru Kolonlar |
|-------|-------------------|-------------------|
| partnerships | firma_adi, anlasma_tarihi, anlasma_turu | kod, model_adi, oran, aciklama, calculation_rows |
| sharings | firma_adi, paylasim_orani | kod, model_adi, oran, aciklama |
| card_programs | program_adi, program_kodu | kart_adi, aciklama |

**Çözüm:** `fieldSanitizer.ts` güncellendi, doğru kolonlar kullanılıyor

---

## ⚠️ MANUEL MÜDAHİLE GEREKLİ

### UUID Type Hatası (CRITICAL)

**Sorun:** 
- `sales_representatives` ve `job_titles` tablolarında ID kolonu UUID type
- Frontend string ID kullanıyor (örn: "salesrep-1762358874555-mkt8s27ye")
- Hata: `invalid input syntax for type uuid`

**Çözüm:**
1. Supabase Dashboard'a gidin
2. SQL Editor'ü açın
3. `/SUPABASE_UUID_FIX.sql` dosyasındaki SQL komutlarını çalıştırın:

```sql
ALTER TABLE sales_representatives ALTER COLUMN id TYPE TEXT;
ALTER TABLE job_titles ALTER COLUMN id TYPE TEXT;
```

**Verification:**
```sql
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('sales_representatives', 'job_titles')
  AND column_name = 'id';
```

Expected output:
```
table_name            | column_name | data_type
----------------------+-------------+-----------
sales_representatives | id          | text
job_titles            | id          | text
```

---

## 🧪 TEST ADIMLARI

SQL fix'i uyguladıktan sonra:

1. **Tarayıcıyı yenileyin** (Hard refresh: Ctrl+Shift+R)
2. **Console'u açın** (F12)
3. **Auto-sync loglarını izleyin:**
   ```
   ✅ Banks synced: X records
   ✅ EPK List synced: X records
   ✅ OK List synced: X records
   ✅ Sales Representatives synced: X records
   ✅ Job Titles synced: X records
   ✅ Partnerships synced: X records
   ✅ Sharings synced: X records
   ✅ Card Programs synced: X records
   ```

4. **Hata yoksa başarılı! ✅**

---

## 🔍 DEBUGGING

Eğer hala hatalar alıyorsanız:

### Console'da şunları kontrol edin:

1. **Duplicate warnings:**
   ```
   ⚠️ Step 1: Removed X duplicate banks (by kod)
   ⚠️ Step 3: Removed X duplicate banks AFTER sanitization
   ```
   → Normal, bu beklenen bir durum. Deduplication çalışıyor demektir.

2. **UUID warnings:**
   ```
   ⚠️ Sales Rep ID "salesrep-xxx" is not UUID format
   ⚠️ Job Title ID "title-xxx" is not UUID format
   ```
   → `/SUPABASE_UUID_FIX.sql` script'ini çalıştırmadıysanız çalıştırın!

3. **Schema errors:**
   ```
   ❌ Could not find the 'XXX' column
   ```
   → fieldSanitizer.ts'de o tablo için kolonları kontrol edin
   → Supabase'de gerçek şemayı kontrol edin

---

## 📋 TABLO ŞEMALARI

### Partnerships
```typescript
{
  id: string,
  kod: string,
  model_adi: string,  // ❌ NOT firma_adi
  oran: string,
  aciklama: string,
  aktif: boolean,
  calculation_rows: array,  // JSONB
  created_at: timestamp,
  updated_at: timestamp
}
```

### Sharings
```typescript
{
  id: string,
  kod: string,
  model_adi: string,  // ❌ NOT firma_adi
  oran: string,       // ❌ NOT paylasim_orani
  aciklama: string,
  aktif: boolean,
  created_at: timestamp,
  updated_at: timestamp
}
```

### Card Programs
```typescript
{
  id: string,
  kart_adi: string,   // ❌ NOT program_adi
  aciklama: string,
  aktif: boolean,
  created_at: timestamp,
  updated_at: timestamp
}
```

### Sales Representatives & Job Titles
```typescript
{
  id: TEXT,  // ✅ IMPORTANT: Must be TEXT, not UUID!
  ...other_columns
}
```

---

## 🚀 SONRAKI ADIMLAR

Tüm sync sorunları çözüldükten sonra:

1. ✅ localStorage → Supabase migration tamamlanmış
2. ✅ Real-time sync aktif
3. ✅ Tüm tanımlar (definitions) Supabase'de
4. ✅ Multi-device support hazır

Artık uygulama production-ready! 🎉

---

## 💡 NOTLAR

- **Deduplication otomatik:** Duplicate kayıtlar otomatik olarak temizleniyor
- **JSONB support:** calculation_rows gibi nested object'ler otomatik handle ediliyor
- **Case conversion:** camelCase ↔ snake_case otomatik yapılıyor
- **Field mapping:** Eksik kolonlar otomatik filtreleniyor (sanitizer sayesinde)

Herhangi bir sorun yaşarsanız console log'larını kontrol edin - detaylı debugging bilgisi var!
