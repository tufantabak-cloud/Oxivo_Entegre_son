# ⚡ HIZLI AUTO-BACKUP EKLENMESİ TALİMATI

## ✅ YAPILMASI GEREKEN

Tüm API'lerin `create()` ve `update()` metotlarına aşağıdaki kodu ekle:

### CREATE metotlarında (upsert sonrasında):
```typescript
// ✅ AUTO-BACKUP: Kayıtları yedekle
if (data) {
  const records = Array.isArray(data) ? data : [data];
  records.forEach(record => {
    addBackup('TABLO_ADI', 'CREATE', record.id, record);
  });
}
```

### UPDATE metotlarında (update sonrasında):
```typescript
// ✅ AUTO-BACKUP: Güncellenmiş kaydı yedekle
if (data) {
  addBackup('TABLO_ADI', 'UPDATE', id, data);
}
```

---

## 📋 TABLO ADI REFERANSI

| API              | Tablo Adı                |
|------------------|--------------------------|
| customerApi      | customers                |
| productApi       | products                 |
| bankPFApi        | bank_accounts            |
| mccCodesApi      | mcc_codes                |
| banksApi         | banks                    |
| epkApi           | epk_institutions         |
| okApi            | ok_institutions          |
| salesRepsApi     | sales_representatives    |
| jobTitlesApi     | job_titles               |
| partnershipsApi  | partnerships             |
| sharingApi       | sharings                 |
| kartProgramApi   | card_programs            |
| suspensionReasonApi | suspension_reasons    |
| domainMappingApi | domain_mappings          |
| signApi          | signs                    |
| earningsApi      | earnings                 |
| documentApi      | customer_documents       |

---

## 🎯 ÖNCELİK SIRASI

1. **YÜKSEK ÖNCELİK** (Sık kullanılan):
   - ✅ customerApi (YAPILDI)
   - ✅ productApi (YAPILDI)
   - [ ] earningsApi
   - [ ] signApi
   - [ ] partnershipsApi

2. **ORTA ÖNCELİK**:
   - [ ] bankPFApi
   - [ ] sharingApi
   - [ ] kartProgramApi

3. **DÜŞÜK ÖNCELİK** (Tanım tabloları):
   - [ ] mccCodesApi
   - [ ] banksApi
   - [ ] epkApi
   - [ ] okApi
   - [ ] salesRepsApi
   - [ ] jobTitlesApi
   - [ ] suspensionReasonApi
   - [ ] domainMappingApi

---

## 💡 İPUCU

Çoğu API'nin `create()` metodu `upsert` kullanıyor, bu yüzden:
- Hem CREATE hem UPDATE için çalışır
- Aynı kod her ikisini de kapsar

---

## ⚠️ DİKKAT

- `addBackup()` çağrısı **Supabase işlemi BAŞARILI olduktan sonra** yapılmalı!
- `error` varsa yedekleme yapma
- `data` null kontrolü yap

---

## ✅ BAŞARI KONTROL

Her API için:
1. create() metodu var mı? ➡️ Auto-backup ekle
2. update() metodu var mı? ➡️ Auto-backup ekle
3. Tablo adı doğru mu? ➡️ Kontrol et
4. error kontrolü var mı? ➡️ Kontrol et

**Toplam yapılacak:** ~30 metot
**Süre:** ~15-20 dakika
