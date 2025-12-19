# 🔄 Supabase-Frontend Sync & Audit Kılavuzu

**Version:** 1.0.0  
**Last Updated:** 2024-12-08  
**Status:** ✅ Ready for Production

---

## 📋 **İÇİNDEKİLER**

1. [Genel Bakış](#genel-bakış)
2. [Ne İşe Yarar?](#ne-işe-yarar)
3. [Kurulum](#kurulum)
4. [Kullanım](#kullanım)
5. [Rapor Yorumlama](#rapor-yorumlama)
6. [Sorun Giderme](#sorun-giderme)
7. [Type Definitions Rehberi](#type-definitions-rehberi)

---

## 🎯 **GENEL BAKIŞ**

Bu sistem, Supabase veritabanınız ile frontend TypeScript type definitions arasındaki uyumluluğu otomatik olarak kontrol eder ve raporlar.

**Temel Özellikler:**
- ✅ Tablo varlık kontrolü
- ✅ Eksik/fazla tablo tespiti  
- ✅ Sütun yapısı analizi
- ✅ Type safety validation
- ✅ Detaylı audit raporu

---

## 💡 **NE İŞE YARAR?**

### **Problem:**
Frontend'de TypeScript type'larınız varken Supabase'de tablolar eksikse veya tam tersi durumda, runtime hatalar alırsınız.

### **Çözüm:**
Bu modül otomatik olarak:
1. Supabase'deki tüm tabloları listeler
2. `/types/database.ts` dosyasındaki type definitions ile karşılaştırır
3. Uyumsuzlukları tespit eder
4. Düzeltme önerileri sunar

---

## 📦 **KURULUM**

### **1. Dosyalar Zaten Hazır:**
- ✅ `/types/database.ts` - Type definitions (11 yeni tablo eklendi)
- ✅ `/utils/syncAudit.ts` - Audit modülü
- ✅ `/scripts/run-sync-audit.ts` - Çalıştırılabilir script

### **2. Environment Variables:**

`.env` dosyanızda şunlar tanımlı olmalı:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### **3. Dependencies:**

Gerekli paketler zaten yüklü olmalı:
```bash
npm install @supabase/supabase-js
```

---

## 🚀 **KULLANIM**

### **Yöntem 1: Script Çalıştırma (Terminal)**

```bash
# TypeScript çalıştırma (tsx gerekli)
npx tsx scripts/run-sync-audit.ts

# Veya Node ile:
node --loader ts-node/esm scripts/run-sync-audit.ts
```

### **Yöntem 2: Kod İçinden Kullanma**

```typescript
import { runSyncAudit, quickTableCheck } from './utils/syncAudit';

// Hızlı kontrol
const { exists, missing } = await quickTableCheck(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

console.log('Mevcut tablolar:', exists);
console.log('Eksik tablolar:', missing);

// Detaylı audit
const report = await runSyncAudit(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

console.log('Audit Status:', report.status);
console.log('Öneriler:', report.recommendations);
```

### **Yöntem 3: Browser Console'dan**

Geliştirme sırasında browser console'dan da çalıştırabilirsiniz:

```javascript
import { quickTableCheck } from './utils/syncAudit';

// Hızlı kontrol
const result = await quickTableCheck(
  'https://your-project.supabase.co',
  'your-anon-key'
);

console.table(result);
```

---

## 📊 **RAPOR YORUMLAMA**

### **Audit Raporu Yapısı:**

```typescript
{
  timestamp: "2024-12-08T10:30:00.000Z",
  status: "success" | "warning" | "error",
  summary: {
    totalTables: 20,      // Beklenen toplam tablo sayısı
    existingTables: 18,   // Mevcut tablolar
    missingTables: 2,     // Eksik tablolar
    extraTables: 1        // Fazla tablolar (type'da yok ama DB'de var)
  },
  tables: [
    {
      tableName: "customers",
      status: "exists",
      columnCount: 42,
      columns: [...],
      issues: []
    },
    {
      tableName: "mcc_codes",
      status: "missing",
      issues: ["Table does not exist in database"]
    }
  ],
  recommendations: [
    "Create table: mcc_codes",
    "Add 'legacy_data' to types/database.ts"
  ]
}
```

### **Status Kodları:**

| Status | Anlam | Aksiyon |
|--------|-------|---------|
| `success` ✅ | Tüm tablolar uyumlu | Herhangi bir aksiyon gerekmez |
| `warning` ⚠️ | Fazla tablolar var | Type definitions'a ekle |
| `error` ❌ | Eksik tablolar var | Supabase'de tablo oluştur |

---

## 🔧 **SORUN GİDERME**

### **Hata: "Supabase credentials not found"**

**Çözüm:**
```bash
# .env dosyasını kontrol et
cat .env | grep VITE_SUPABASE

# Veya script'te hardcode et (sadece test için!)
const SUPABASE_URL = 'https://xxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGc...';
```

### **Hata: "relation does not exist"**

**Anlam:** Tablo Supabase'de mevcut değil.

**Çözüm:**  
Audit raporu size SQL create script'i önerecek. SQL Editor'de çalıştırın.

### **Hata: "RPC function not found"**

**Anlam:** Supabase'de custom RPC function yok.

**Çözüm:**  
Script otomatik olarak fallback method kullanır. Sorun yok.

---

## 📚 **TYPE DEFINITIONS REHBERİ**

### **Yeni Tablo Type'ı Nasıl Eklenir?**

#### **1. Row Interface Oluştur:**

```typescript
// /types/database.ts içinde

export interface YourTableRow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}
```

#### **2. Insert/Update Type'ları Ekle:**

```typescript
export type YourTableInsert = Omit<YourTableRow, 'id' | 'created_at'>;
export type YourTableUpdate = Partial<YourTableInsert>;
```

#### **3. Database Interface'ine Ekle:**

```typescript
export interface Database {
  public: {
    Tables: {
      // ... mevcut tablolar ...
      your_table: {
        Row: YourTableRow;
        Insert: YourTableInsert;
        Update: YourTableUpdate;
      };
    };
  };
}
```

#### **4. Sync Audit'e Ekle:**

```typescript
// /utils/syncAudit.ts içinde

const EXPECTED_TABLES = [
  // ... mevcut tablolar ...
  'your_table',
] as const;
```

---

## 🎯 **BEST PRACTICES**

### **1. Her Deploy Öncesi Çalıştır:**

```bash
# CI/CD pipeline'ınıza ekleyin
npm run audit:sync  # package.json'a script ekleyin
```

### **2. Periyodik Kontrol:**

Haftada bir otomatik audit çalıştırın:
```bash
# Cron job örneği (Linux/Mac)
0 9 * * 1 cd /path/to/project && npm run audit:sync
```

### **3. Pre-commit Hook:**

```bash
# .husky/pre-commit
#!/bin/sh
npm run audit:sync || exit 1
```

---

## 📝 **CHANGELOG**

### **v1.0.0 - 2024-12-08**
- ✅ İlk versiyon yayınlandı
- ✅ 11 tanım tablosu eklendi
- ✅ Full audit system implementasyonu
- ✅ Quick check fonksiyonu
- ✅ Detaylı raporlama sistemi

---

## 🤝 **DESTEK**

Sorularınız için:
1. İlk olarak bu dokümantasyonu okuyun
2. Audit raporundaki önerileri takip edin
3. Hata mesajlarını dikkatle okuyun

---

## ⚡ **HIZLI REFERANS**

```bash
# Hızlı kontrol
npx tsx scripts/run-sync-audit.ts

# Rapor kaydet
npx tsx scripts/run-sync-audit.ts > audit-report.txt

# Sadece eksik tabloları göster
npx tsx scripts/run-sync-audit.ts | grep "MISSING"
```

**Koddan kullanım:**
```typescript
import { quickTableCheck } from './utils/syncAudit';

const { exists, missing } = await quickTableCheck(url, key);

if (missing.length > 0) {
  console.error('Eksik tablolar:', missing);
}
```

---

**🎉 Artık Supabase ve frontend'iniz tamamen senkron!**
