# 🔍 Moka United TABELA Kontrolü - Console Yöntemi

Uygulamayı açıp tarayıcı console'unda (F12) aşağıdaki komutları çalıştırarak kontrol edebilirsiniz.

---

## ✅ YÖNTEM 1: Console'dan Kontrol

### 1️⃣ Önce Moka United firma ID'sini bulun:

```javascript
// Tüm müşterileri kontrol et
const customers = await window.__OXIVO_SUPABASE__.apis.customerApi.getAll();
console.log('Toplam müşteri sayısı:', customers.data.length);

// Moka United'ı bul
const mokaCustomer = customers.data.find(c => 
  c.firmaAdi?.toLowerCase().includes('moka') && 
  c.firmaAdi?.toLowerCase().includes('united')
);

if (mokaCustomer) {
  console.log('✅ Moka United bulundu:', mokaCustomer);
  console.log('Firma ID:', mokaCustomer.id);
  console.log('Firma Adı:', mokaCustomer.firmaAdi);
} else {
  console.log('❌ Moka United bulunamadı!');
  // Moka içeren tüm firmaları göster
  const mokaFirms = customers.data.filter(c => 
    c.firmaAdi?.toLowerCase().includes('moka')
  );
  console.log('Moka içeren firmalar:', mokaFirms);
}
```

---

### 2️⃣ Moka United'ın TABELA kayıtlarını kontrol edin:

```javascript
// Önce firma ID'sini yukarıdan kopyalayın
const mokaFirmaId = 'BURAYA_FIRMA_ID_YAPIŞTIRIN';

// Tüm TABELA kayıtlarını al
const allSigns = await window.__OXIVO_SUPABASE__.apis.signApi.getAll();
console.log('Toplam TABELA sayısı:', allSigns.data.length);

// Moka United'a ait TABELA'ları filtrele
const mokaSigns = allSigns.data.filter(s => s.firmaId === mokaFirmaId);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Moka United TABELA Kayıtları:', mokaSigns.length);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (mokaSigns.length > 0) {
  mokaSigns.forEach((sign, index) => {
    console.log(`\n📋 TABELA ${index + 1}:`);
    console.log('  ID:', sign.id);
    console.log('  Ürün:', sign.urun);
    console.log('  Aktif:', sign.aktif ? '✅' : '❌');
    console.log('  Kart Tipi:', sign.kartTipi);
    console.log('  Yurt İçi/Dışı:', sign.yurtIciDisi);
    console.log('  Kısa Açıklama:', sign.kisaAciklama);
    console.log('  Gelir Modeli:', sign.gelirModeli);
    console.log('  Komisyon Oranları:', sign.komisyonOranlari);
    console.log('  Paylaşım Oranları:', sign.paylasimOranlari);
    console.log('  Hazine Geliri:', sign.hazineGeliri);
    console.log('  Ek Gelir Detay:', sign.ekGelirDetay);
    console.log('  Oluşturma Tarihi:', sign.createdAt);
  });
} else {
  console.log('❌ Moka United için TABELA kaydı bulunamadı!');
}
```

---

### 3️⃣ HIZLI KONTROL - Tek komutla her şeyi göster:

```javascript
// Tek seferde tüm kontrol
(async () => {
  try {
    // Müşterileri al
    const customers = await window.__OXIVO_SUPABASE__.apis.customerApi.getAll();
    
    // TABELA kayıtlarını al
    const signs = await window.__OXIVO_SUPABASE__.apis.signApi.getAll();
    
    // Moka United'ı bul
    const moka = customers.data.find(c => 
      c.firmaAdi?.toLowerCase().includes('moka') && 
      c.firmaAdi?.toLowerCase().includes('united')
    );
    
    if (!moka) {
      console.error('❌ Moka United müşterisi bulunamadı!');
      const mokaFirms = customers.data.filter(c => 
        c.firmaAdi?.toLowerCase().includes('moka')
      );
      console.log('Moka içeren firmalar:', mokaFirms.map(f => f.firmaAdi));
      return;
    }
    
    // Moka United'ın TABELA'larını filtrele
    const mokaSigns = signs.data.filter(s => s.firmaId === moka.id);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 MOKA UNITED TABELA RAPORU');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Firma ID:', moka.id);
    console.log('Firma Adı:', moka.firmaAdi);
    console.log('Toplam TABELA Sayısı:', mokaSigns.length);
    console.log('Aktif TABELA:', mokaSigns.filter(s => s.aktif).length);
    console.log('Pasif TABELA:', mokaSigns.filter(s => !s.aktif).length);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (mokaSigns.length > 0) {
      console.table(mokaSigns.map(s => ({
        'Ürün': s.urun,
        'Aktif': s.aktif ? '✅' : '❌',
        'Kart Tipi': s.kartTipi,
        'Gelir Modeli': s.gelirModeli,
        'Oluşturma Tarihi': new Date(s.createdAt).toLocaleDateString('tr-TR')
      })));
    } else {
      console.warn('⚠️ Moka United için TABELA kaydı bulunamadı!');
    }
    
    // Detaylı veriyi göster
    console.log('\n📋 Detaylı TABELA Verileri:');
    console.log(mokaSigns);
    
  } catch (error) {
    console.error('❌ Hata:', error);
  }
})();
```

---

## ✅ YÖNTEM 2: Supabase Dashboard'dan Kontrol

1. **Supabase Dashboard'a gidin**: https://supabase.com/dashboard
2. **Table Editor** → **signs** tablosunu açın
3. **Filter** butonuna tıklayın:
   - Column: `firma_id`
   - Operator: `equals`
   - Value: `<MOKA_UNITED_FIRMA_ID>` (yukarıdan bulun)
4. **Apply** butonuna basın

---

## ✅ YÖNTEM 3: App.tsx State'inden Kontrol

Uygulama çalışırken React DevTools'dan kontrol edin:

1. **React DevTools** (Chrome Extension) kurun
2. **Components** sekmesini açın
3. **App** componentini seçin
4. Sağ panelde **hooks** → **signs** array'ini görün
5. `firmaId` field'ına göre filtreleyin

---

## 🔍 Beklenen Sonuç

Eğer Moka United için TABELA verisi varsa, şunları görmelisiniz:

```javascript
{
  id: "uuid-string",
  firmaId: "moka-firma-id",
  urun: "POS / CRM / vb.",
  aktif: true,
  kartTipi: "Kredi / Banka / vb.",
  yurtIciDisi: "Yurt İçi / Dışı",
  kisaAciklama: "Açıklama metni",
  gelirModeli: "Komisyon / Sabit / vb.",
  komisyonOranlari: { /* object */ },
  paylasimOranlari: { /* object */ },
  hazineGeliri: 123.45,
  ekGelirDetay: { /* object */ },
  createdAt: "2025-XX-XX...",
  updatedAt: "2025-XX-XX..."
}
```

---

## ⚠️ Sorun Giderme

### Eğer `window.__OXIVO_SUPABASE__` undefined ise:

1. Sayfayı yenileyin (F5)
2. Console'da şunu çalıştırın:
   ```javascript
   // Supabase client'ı manuel import edin
   import { signApi } from './utils/supabaseClient.ts';
   const result = await signApi.getAll();
   console.log(result);
   ```

### Eğer Moka United bulunamazsa:

```javascript
// Tüm firma adlarını listeleyin
const allCustomers = await window.__OXIVO_SUPABASE__.apis.customerApi.getAll();
const firmNames = allCustomers.data.map(c => c.firmaAdi).sort();
console.log('Tüm firma adları:', firmNames);
```
