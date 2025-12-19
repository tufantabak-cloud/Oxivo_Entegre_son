# 🌐 Browser'da Sync Audit Testi

**Not:** Windows PowerShell'de `tsx` çalışmadığı için browser console üzerinden test yapacağız.

---

## 📋 **ADıMLAR:**

### **ADIM 1: Uygulamayı Çalıştır**

```bash
# PowerShell veya CMD'de:
npm run dev
```

Uygulama `http://localhost:5173` adresinde açılacak.

---

### **ADIM 2: Browser Console'u Aç**

1. Browser'ı aç (Chrome/Edge/Firefox)
2. `http://localhost:5173` adresine git
3. **F12** tuşuna bas (veya sağ tık → "Inspect")
4. **Console** sekmesine geç

---

### **ADIM 3: Test Script'ini Çalıştır**

Console'a şu kodu **yapıştır ve ENTER'a bas**:

```javascript
// 1. Test modülünü import et
import('./utils/testSyncAudit.js').then(async (module) => {
  // 2. Test fonksiyonunu çalıştır
  const result = await module.testSyncAuditInBrowser();
  
  // 3. Sonuçları global değişkene kaydet (tekrar erişmek için)
  window.syncAuditResult = result;
  
  console.log('✅ Test tamamlandı! Sonuçlara "window.syncAuditResult" ile erişebilirsiniz.');
}).catch(err => {
  console.error('❌ Test hatası:', err);
});
```

---

### **ADIM 4: Sonuçları İncele**

Console'da şu bilgileri göreceksiniz:

```
🔍 Testing Sync Audit in Browser...

📡 Supabase URL: https://xxx...
🔑 Key: eyJhbGc...

⏳ Running quick table check...

═══════════════════════════════════════════════════════════
📊 QUICK CHECK RESULTS
═══════════════════════════════════════════════════════════

✅ EXISTING TABLES (18):
   1. customers
   2. bank_accounts
   3. products
   4. mcc_codes
   5. banks
   ...

❌ MISSING TABLES (2):
   1. earnings
   2. partnerships

📈 SUMMARY: 18/20 tables exist (90.0%)
⚠️  Some tables are missing. Check Supabase setup.

═══════════════════════════════════════════════════════════
```

---

### **ADIM 5: Detaylı Sonuçlara Erişim**

Console'da şunu yaz:

```javascript
// Mevcut tabloları göster
console.table(window.syncAuditResult.exists);

// Eksik tabloları göster
console.table(window.syncAuditResult.missing);

// JSON formatında göster
console.log(JSON.stringify(window.syncAuditResult, null, 2));
```

---

## 🔧 **SORUN GİDERME**

### **Hata: "Module not found"**

**Çözüm:** Vite dev server'ın çalıştığından emin ol.

```bash
npm run dev
```

### **Hata: "Supabase credentials not found"**

**Çözüm:** `.env` dosyasını kontrol et:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### **Hata: "Cannot read properties of undefined"**

**Çözüm:** Test modülü henüz yüklenmemiş. Sayfayı yenile ve tekrar dene.

---

## 🎯 **ALTERNATİF YOL: Manual Check**

Eğer yukarıdaki yöntem çalışmazsa, manuel kontrolü dene:

```javascript
// 1. Supabase client'ı import et
import { supabase } from './utils/supabaseClient.js';

// 2. Her tabloyu manuel kontrol et
const tables = [
  'customers', 'bank_accounts', 'products', 'signs', 'domain_mappings',
  'mcc_codes', 'banks', 'epk_institutions', 'ok_institutions',
  'sales_representatives', 'job_titles', 'partnerships', 'sharings',
  'card_programs', 'suspension_reasons', 'earnings'
];

// 3. Kontrol fonksiyonu
async function checkTable(tableName) {
  try {
    const { error } = await supabase.from(tableName).select('id').limit(1);
    return error ? '❌' : '✅';
  } catch {
    return '❌';
  }
}

// 4. Tüm tabloları kontrol et
for (const table of tables) {
  const status = await checkTable(table);
  console.log(`${status} ${table}`);
}
```

---

## 📊 **BEKLENEN SONUÇ**

Tüm tablolar varsa:

```
✅ customers
✅ bank_accounts
✅ products
✅ signs
✅ domain_mappings
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
```

---

## 💡 **SONRAKI ADIMLAR**

Eğer eksik tablolar varsa:

1. Supabase Dashboard'a git: https://supabase.com/dashboard
2. SQL Editor'ü aç
3. Eksik tabloları oluştur (gerekirse SQL script'leri sağlarım)

---

**🎉 Test başarıyla tamamlandı mı? Sonuçları bana gönder!**
