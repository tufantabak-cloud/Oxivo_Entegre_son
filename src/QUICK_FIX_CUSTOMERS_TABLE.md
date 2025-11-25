# ⚡ HIZLI ÇÖZÜM: Customers Tablosu 404 Hatası

## 🔴 Hata
```
❌ Error creating customers: Could not find the table 'public.customers' in the schema cache
```

## ✅ Çözüm (2 Dakika)

### 1. Supabase Dashboard'a Git
```
https://supabase.com/dashboard
→ Projeniz (tveqpmzgqtoyagtpapev)
→ SQL Editor
```

### 2. Script'i Çalıştır
1. **Kopyala:** `/SUPABASE_CUSTOMERS_FIX.sql` dosyasının TÜM içeriğini
2. **Yapıştır:** SQL Editor'e
3. **Çalıştır:** "Run" butonuna bas (veya Ctrl+Enter)

### 3. Başarı Kontrolü
Şu mesajı görmelisiniz:
```
✅ MIGRATION COMPLETED SUCCESSFULLY!
customers: +5 JSONB fields + 1 type fix
```

### 4. Uygulamayı Yeniden Başlat
1. Tarayıcıyı **tamamen kapat** (tüm sekmeler)
2. Yeniden aç
3. Console'da bak:
```
✅ Auto-sync successful: 352 customers synced to Supabase
```

---

## 🎯 Beklenen Sonuç

### ✅ Başarılı İse:
- Console: `✅ Created 352 customers in Supabase`
- Supabase Table Editor'de 352 kayıt görünür
- Müşteri listesi uygulama içinde yüklenir

### ❌ Hâlâ Hata Varsa:
`/SUPABASE_CUSTOMERS_FIX_README.md` dosyasına bakın (detaylı troubleshooting).

---

## 📋 Script Ne Yapıyor?

1. ✅ Eski hatalı tabloyu siler (veri kaybı yok - localStorage'da duruyor)
2. ✅ Doğru kolonlarla yeni tablo oluşturur (32 field)
3. ✅ 10 index ekler (performance için)
4. ✅ RLS aktif eder (security)
5. ✅ Auto-update trigger ekler

---

## 🔧 Kolon Eşleştirme

| Frontend (camelCase) | Supabase (snake_case) |
|---------------------|----------------------|
| `cariHesapKodu` | `cari_hesap_kodu` |
| `cariAdi` | `cari_adi` |
| `guncelMyPayterDomain` | `guncel_my_payter_domain` |
| `salesRepId` | `sales_rep_id` |
| `bankDeviceAssignments` | `bank_device_assignments` |

**Dönüşüm:** Otomatik (caseConverter.ts)

---

## ⏱️ Süre: ~2 dakika
1. SQL script çalıştır: 30 saniye
2. Doğrula: 30 saniye
3. App restart + sync: 1 dakika

✅ **Hazır!**
