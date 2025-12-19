/**
 * 🧪 TEST: objectToCamelCase Nested JSONB Dönüşümü
 */

import { objectToCamelCase } from './utils/caseConverter';

// Production'daki gerçek veri (Supabase'den gelen format)
const supabaseData = {
  cari_adi: "Test Müşteri",
  bank_device_assignments: [
    {
      id: "1765884758743ewgoxz71m",
      bank_id: "bank-bf261dcf-e6aa-4a57-a5fd-661c8951e0c8",
      bank_code: "010",
      bank_name: "QNB Bank",
      created_at: "2025-12-16T11:32:38.743Z",
      device_ids: ["1764069695312rvc8wc3nk"]
    }
  ]
};

console.log('🔹 SUPABASE VERİSİ (snake_case):');
console.log(JSON.stringify(supabaseData, null, 2));

// objectToCamelCase uygula
const convertedData = objectToCamelCase(supabaseData);

console.log('\n✅ DÖNÜŞTÜRÜLMÜŞ VERİ (camelCase):');
console.log(JSON.stringify(convertedData, null, 2));

console.log('\n🔍 KONTROL:');
console.log('bankDeviceAssignments[0].bankName:', convertedData.bankDeviceAssignments?.[0]?.bankName);
console.log('bankDeviceAssignments[0].deviceIds:', convertedData.bankDeviceAssignments?.[0]?.deviceIds);

// Test et
if (convertedData.bankDeviceAssignments?.[0]?.bankName === 'QNB Bank') {
  console.log('\n✅ TEST BAŞARILI: Nested key'ler camelCase'e dönüştü!');
} else {
  console.log('\n❌ TEST BAŞARISIZ: Nested key'ler dönüşmedi!');
  console.log('Beklenmeyen sonuç:', convertedData.bankDeviceAssignments);
}
