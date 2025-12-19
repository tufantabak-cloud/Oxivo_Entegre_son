# ⚡ Hızlı Tablo Kontrolü - PowerShell Rehberi

**Windows PowerShell'de çalışan basitleştirilmiş kontrol scripti**

---

## 📋 **ADIM 1: Supabase Bilgilerini Al**

### **1.1 Supabase Dashboard'a Git:**
```
https://supabase.com/dashboard
```

### **1.2 Projenizi Seçin**

### **1.3 Settings → API:**
Şu bilgileri kopyala:
- **Project URL**: `https://xxx.supabase.co`
- **anon public key**: `eyJhbGc...` (uzun bir token)

---

## 📋 **ADIM 2: Script'i Düzenle**

### **2.1 Dosyayı Aç:**
```
scripts/quick-check.mjs
```

### **2.2 Şu satırları değiştir:**

```javascript
// ÖNCESİ:
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY_HERE';

// SONRASI (senin bilgilerinle):
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**⚠️ NOT:** Gerçek URL ve Key'i yapıştır!

---

## 📋 **ADIM 3: Script'i Çalıştır**

PowerShell'de:

```powershell
node scripts/quick-check.mjs
```

---

## 📊 **BEKLENEN ÇIKTI:**

### **✅ Başarılı Durum:**

```
🔍 Quick Table Check

📡 Supabase URL: https://xxx.supabase.co...
🔑 Key: eyJhbGc...

⏳ Checking tables...

✅ mcc_codes
✅ banks
✅ epk_institutions
✅ ok_institutions
✅ sales_representatives
✅ job_titles
✅ partnerships
✅ sharings
✅ card_programs
✅ suspension_reasons
✅ earnings
✅ customers
✅ bank_accounts
✅ petty_cash
✅ categories
✅ transactions
✅ signs
✅ income_records
✅ products
✅ domain_mappings

═══════════════════════════════════════════════════════════
📊 SUMMARY
═══════════════════════════════════════════════════════════

✅ Existing: 20
❌ Missing: 0
📈 Total: 20
📊 Coverage: 100.0%

🎉 All tables exist in Supabase!
```

---

### **❌ Eksik Tablolar Varsa:**

```
🔍 Quick Table Check

📡 Supabase URL: https://xxx.supabase.co...
🔑 Key: eyJhbGc...

⏳ Checking tables...

✅ mcc_codes
✅ banks
❌ earnings
✅ customers
...

═══════════════════════════════════════════════════════════
📊 SUMMARY
═══════════════════════════════════════════════════════════

✅ Existing: 18
❌ Missing: 2
📈 Total: 20
📊 Coverage: 90.0%

❌ MISSING TABLES:
   1. earnings
   2. partnerships

⚠️  These tables need to be created in Supabase.
```

**Bu durumda:** Bana eksik tablo isimlerini söyle, SQL script'lerini vereceğim!

---

## 🔧 **SORUN GİDERME**

### **Hata: "Cannot find module '@supabase/supabase-js'"**

**Çözüm:** Bağımlılıkları yükle:

```powershell
npm install
```

### **Hata: "SUPABASE_URL not configured"**

**Çözüm:** Script'i düzenlemeyi unuttun. ADIM 2'yi tekrar oku.

### **Hata: "Fetch failed"**

**Çözüm:** İnternet bağlantını kontrol et veya Supabase URL'in doğru olduğundan emin ol.

### **Hata: "Invalid API key"**

**Çözüm:** Supabase anon key'i yanlış kopyalanmış. Tekrar kontrol et.

---

## 🎯 **ALTERNATİF: Browser Test**

Eğer Node.js script'i çalışmazsa, browser üzerinden test edebilirsin:

1. Uygulamayı başlat:
   ```powershell
   npm run dev
   ```

2. Browser'da aç: `http://localhost:5173`

3. F12 → Console

4. Şu kodu yapıştır:
   ```javascript
   import('./utils/testSyncAudit.js').then(m => m.testSyncAuditInBrowser());
   ```

Detaylı talimatlar: `/docs/BROWSER-SYNC-TEST.md`

---

## 📝 **ÖZET**

1. ✅ Supabase URL ve Key'i al
2. ✅ `scripts/quick-check.mjs` dosyasını düzenle
3. ✅ `node scripts/quick-check.mjs` çalıştır
4. ✅ Sonuçları bana gönder!

---

**🚀 Hadi başla! Sonuçları merakla bekliyorum!**
