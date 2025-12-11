/**
 * HAKEDİŞ V2 - DEMO/TEST VERİSİ
 * Test amaçlı örnek hakediş kayıtları
 */

import { HakedisV2Record } from './types';

/**
 * Örnek Hakediş Kaydı Oluştur
 * 
 * Kullanım:
 * ```ts
 * const demoHakedis = createDemoHakedis('firma-uuid-123', 'grup-uuid-456', 'Grup A');
 * ```
 */
export function createDemoHakedis(
  firmaId: string,
  tabelaGroupId: string,
  tabelaGroupAd: string,
  tabelaIds: string[] = [],
): HakedisV2Record {
  const now = new Date();
  const donem = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // 🆕 Yeni Format: tabelaId_vade → hacim
  // Örnek: 2 tabela × 2 vade = 4 entry
  const islemHacmiMap: Record<string, number> = {};
  
  if (tabelaIds.length > 0) {
    // İlk tabela için D+1 ve D+7 vadeleri
    islemHacmiMap[`${tabelaIds[0]}_D+1`] = 50000;
    islemHacmiMap[`${tabelaIds[0]}_D+7`] = 30000;
    
    // İkinci tabela varsa D+1 ve D+14 vadeleri
    if (tabelaIds.length > 1) {
      islemHacmiMap[`${tabelaIds[1]}_D+1`] = 100000;
      islemHacmiMap[`${tabelaIds[1]}_D+14`] = 80000;
    }
  }
  
  return {
    id: `demo-${crypto.randomUUID()}`,
    firmaId,
    tabelaGroupId,
    tabelaGroupAd,
    donem,
    vade: 'Tüm Vadeler',
    durum: 'Taslak',
    aktif: true,
    islemHacmiMap,
    pfIslemHacmi: '',
    oxivoIslemHacmi: '',
    ekGelirAciklama: '',
    ekGelirPFTL: 0,
    ekGelirOXTL: 0,
    ekKesintiAciklama: '',
    ekKesintiPFTL: 0,
    ekKesintiOXTL: 0,
    notlar: 'Demo hakediş kaydı - Test amaçlı',
    olusturanKullanici: 'demo-user',
    createdAt: now.toISOString(),
  };
}

/**
 * Excel Formatı Açıklaması
 * 
 * TABLO YAPISI:
 * - Her tabela için aktif vadelerine göre ayrı satırlar
 * - 2 Tabela × 2 Aktif Vade = 4 Satır
 * 
 * SÜTUN YAPISI (13 sütun):
 * 1. KLM - Sıra numarası
 * 2. Grup - Tabela grubu
 * 3. Kısa Açıklama - Tabela kısa açıklaması
 * 4. Ürün - SoftPOS, UnattendedPOS vb.
 * 5. Gelir Modeli - Gelir Ortaklığı / Sabit Komisyon
 * 6. Kart Tipi - Credit / Debit / Paçal
 * 7. Yurt İçi/Dışı
 * 8. Vade - D+1, D+7, D+14, D+31
 * 9. Tabela Oranları - Komisyon % veya Satış TL
 * 10. İşlem Hacmi - ⚪ Manuel giriş (beyaz hücre)
 * 11. Kazanç (TL) - 🟦 Otomatik hesap (mavi)
 * 12a. PF Payı - Kuruluş % (🟨 sarı)
 * 12b. PF Payı - Hesaplama TL (🟦 mavi)
 * 13a. OXIVO Payı - OXIVO % (🟨 sarı)
 * 13b. OXIVO Payı - Hesaplama TL (🟪 mor)
 * 
 * HESAPLAMA FORMÜLLERİ:
 * 
 * 1. Gelir Ortaklığı için:
 *    Kazanç = İşlem Hacmi × Satış TL
 *    Örnek: 50,000 × 0.03 = 1,500 TL
 * 
 * 2. Sabit Komisyon için:
 *    Kazanç = İşlem Hacmi × (Komisyon % / 100)
 *    Örnek: 100,000 × (1.5 / 100) = 1,500 TL
 * 
 * 3. PF Payı:
 *    PF Payı = Kazanç × (Kuruluş % / 100)
 *    Örnek: 1,500 × (90 / 100) = 1,350 TL
 * 
 * 4. OXIVO Payı:
 *    OXIVO Payı = Kazanç × (OXIVO % / 100)
 *    Örnek: 1,500 × (10 / 100) = 150 TL
 * 
 * VERI KAYNAK YAPISI:
 * 
 * islemHacmiMap formatı:
 * {
 *   "tabelaId1_D+1": 50000,
 *   "tabelaId1_D+7": 30000,
 *   "tabelaId2_D+1": 100000,
 *   "tabelaId2_D+14": 80000
 * }
 * 
 * Bu yapı ile:
 * - Her tabela için aktif vadeler ayrı entry
 * - Her vade için işlem hacmi ayrı saklanır
 * - Tabloda her satır bir tabelaId_vade kombinasyonu
 */
