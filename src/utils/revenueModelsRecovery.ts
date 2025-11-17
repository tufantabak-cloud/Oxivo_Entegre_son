/**
 * Revenue Models Recovery & Diagnostic Utility
 * 
 * Hesap Kalemleri, Sabit Komisyonlar ve Ek Gelirler için
 * versiyon geçmişi kontrol ve kurtarma sistemi
 * 
 * Created: 2025-11-11
 */

import { HesapKalemi, SabitKomisyon, EkGelir } from '../components/RevenueModelsTab';

export interface VersionSnapshot<T> {
  version: string;
  timestamp: string;
  data: T;
  size: number;
}

export interface RevenueModelsHistory {
  hesapKalemleri: VersionSnapshot<HesapKalemi[]>[];
  sabitKomisyonlar: VersionSnapshot<SabitKomisyon[]>[];
  ekGelirler: VersionSnapshot<EkGelir[]>[];
}

/**
 * localStorage'dan tüm versiyon geçmişini çıkar
 */
export const extractVersionHistory = (): RevenueModelsHistory => {
  const history: RevenueModelsHistory = {
    hesapKalemleri: [],
    sabitKomisyonlar: [],
    ekGelirler: []
  };

  const keys = ['hesapKalemleri', 'sabitKomisyonlar', 'ekGelirler'] as const;

  keys.forEach(key => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        console.log(`📦 ${key}: Veri yok`);
        return;
      }

      const parsed = JSON.parse(stored);
      
      // Versiyonlu format kontrolü
      if (parsed.version && parsed.data !== undefined) {
        const snapshot: VersionSnapshot<any[]> = {
          version: parsed.version,
          timestamp: parsed.timestamp || 'Bilinmeyen',
          data: parsed.data,
          size: Array.isArray(parsed.data) ? parsed.data.length : 0
        };
        
        history[key].push(snapshot);
        console.log(`✅ ${key}: v${parsed.version} - ${snapshot.size} kayıt (${parsed.timestamp})`);
      } else {
        // Legacy format (versiyonsuz)
        const snapshot: VersionSnapshot<any[]> = {
          version: 'legacy',
          timestamp: 'Bilinmeyen',
          data: Array.isArray(parsed) ? parsed : [],
          size: Array.isArray(parsed) ? parsed.length : 0
        };
        
        history[key].push(snapshot);
        console.log(`🔧 ${key}: Legacy format - ${snapshot.size} kayıt`);
      }
    } catch (error) {
      console.error(`❌ ${key}: Okuma hatası:`, error);
    }
  });

  return history;
};

/**
 * Hesap Kalemleri detaylı analiz
 */
export const analyzeHesapKalemleri = (data: HesapKalemi[]): {
  total: number;
  active: number;
  inactive: number;
  withCode: number;
  withDescription: number;
  items: Array<{
    id: string;
    kod: string;
    adi: string;
    aktif: boolean;
    hasDescription: boolean;
  }>;
} => {
  const analysis = {
    total: data.length,
    active: data.filter(h => h.aktif).length,
    inactive: data.filter(h => !h.aktif).length,
    withCode: data.filter(h => h.kod && h.kod.trim()).length,
    withDescription: data.filter(h => h.aciklama && h.aciklama.trim()).length,
    items: data.map(h => ({
      id: h.id,
      kod: h.kod,
      adi: h.adi,
      aktif: h.aktif,
      hasDescription: Boolean(h.aciklama && h.aciklama.trim())
    }))
  };

  console.log('📊 HESAP KALEMLERİ ANALİZİ:');
  console.log(`  Toplam: ${analysis.total}`);
  console.log(`  Aktif: ${analysis.active}`);
  console.log(`  Pasif: ${analysis.inactive}`);
  console.log(`  Kodlu: ${analysis.withCode}`);
  console.log(`  Açıklamalı: ${analysis.withDescription}`);

  return analysis;
};

/**
 * Sabit Komisyonlar detaylı analiz
 */
export const analyzeSabitKomisyonlar = (data: SabitKomisyon[]): {
  total: number;
  active: number;
  inactive: number;
  avgRate: number;
  minRate: number;
  maxRate: number;
  items: Array<{
    id: string;
    adi: string;
    oran: number;
    aktif: boolean;
  }>;
} => {
  const rates = data.map(sk => sk.oran);
  const analysis = {
    total: data.length,
    active: data.filter(sk => sk.aktif).length,
    inactive: data.filter(sk => !sk.aktif).length,
    avgRate: rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0,
    minRate: rates.length > 0 ? Math.min(...rates) : 0,
    maxRate: rates.length > 0 ? Math.max(...rates) : 0,
    items: data.map(sk => ({
      id: sk.id,
      adi: sk.adi,
      oran: sk.oran,
      aktif: sk.aktif
    }))
  };

  console.log('💰 SABİT KOMİSYONLAR ANALİZİ:');
  console.log(`  Toplam: ${analysis.total}`);
  console.log(`  Aktif: ${analysis.active}`);
  console.log(`  Pasif: ${analysis.inactive}`);
  console.log(`  Ort. Oran: %${analysis.avgRate.toFixed(2)}`);
  console.log(`  Min-Max: %${analysis.minRate} - %${analysis.maxRate}`);

  return analysis;
};

/**
 * Ek Gelirler detaylı analiz
 */
export const analyzeEkGelirler = (data: EkGelir[]): {
  total: number;
  active: number;
  inactive: number;
  byUnit: { TL: number; USD: number; EUR: number };
  totalTL: number;
  totalUSD: number;
  totalEUR: number;
  items: Array<{
    id: string;
    adi: string;
    tutar: number;
    birim: string;
    aktif: boolean;
  }>;
} => {
  const analysis = {
    total: data.length,
    active: data.filter(eg => eg.aktif).length,
    inactive: data.filter(eg => !eg.aktif).length,
    byUnit: {
      TL: data.filter(eg => eg.birim === 'TL').length,
      USD: data.filter(eg => eg.birim === 'USD').length,
      EUR: data.filter(eg => eg.birim === 'EUR').length
    },
    totalTL: data.filter(eg => eg.birim === 'TL').reduce((sum, eg) => sum + eg.tutar, 0),
    totalUSD: data.filter(eg => eg.birim === 'USD').reduce((sum, eg) => sum + eg.tutar, 0),
    totalEUR: data.filter(eg => eg.birim === 'EUR').reduce((sum, eg) => sum + eg.tutar, 0),
    items: data.map(eg => ({
      id: eg.id,
      adi: eg.adi,
      tutar: eg.tutar,
      birim: eg.birim,
      aktif: eg.aktif
    }))
  };

  console.log('💵 EK GELİRLER ANALİZİ:');
  console.log(`  Toplam: ${analysis.total}`);
  console.log(`  Aktif: ${analysis.active}`);
  console.log(`  Pasif: ${analysis.inactive}`);
  console.log(`  Para Birimi Dağılımı: TL=${analysis.byUnit.TL}, USD=${analysis.byUnit.USD}, EUR=${analysis.byUnit.EUR}`);
  console.log(`  Toplam TL: ${analysis.totalTL.toLocaleString('tr-TR')}`);
  console.log(`  Toplam USD: ${analysis.totalUSD.toLocaleString('tr-TR')}`);
  console.log(`  Toplam EUR: ${analysis.totalEUR.toLocaleString('tr-TR')}`);

  return analysis;
};

/**
 * Tam teşhis raporu
 */
export const runFullDiagnostic = (): {
  history: RevenueModelsHistory;
  hesapKalemleri: ReturnType<typeof analyzeHesapKalemleri> | null;
  sabitKomisyonlar: ReturnType<typeof analyzeSabitKomisyonlar> | null;
  ekGelirler: ReturnType<typeof analyzeEkGelirler> | null;
} => {
  console.log('🔍 GELİR MODELLERİ TAM TEŞHIS BAŞLADI...\n');

  const history = extractVersionHistory();

  const result = {
    history,
    hesapKalemleri: null as ReturnType<typeof analyzeHesapKalemleri> | null,
    sabitKomisyonlar: null as ReturnType<typeof analyzeSabitKomisyonlar> | null,
    ekGelirler: null as ReturnType<typeof analyzeEkGelirler> | null
  };

  // Hesap Kalemleri Analizi
  if (history.hesapKalemleri.length > 0) {
    console.log('\n📊 HESAP KALEMLERİ:');
    const latest = history.hesapKalemleri[history.hesapKalemleri.length - 1];
    result.hesapKalemleri = analyzeHesapKalemleri(latest.data);
  } else {
    console.log('\n📊 HESAP KALEMLERİ: Veri bulunamadı');
  }

  // Sabit Komisyonlar Analizi
  if (history.sabitKomisyonlar.length > 0) {
    console.log('\n💰 SABİT KOMİSYONLAR:');
    const latest = history.sabitKomisyonlar[history.sabitKomisyonlar.length - 1];
    result.sabitKomisyonlar = analyzeSabitKomisyonlar(latest.data);
  } else {
    console.log('\n💰 SABİT KOMİSYONLAR: Veri bulunamadı');
  }

  // Ek Gelirler Analizi
  if (history.ekGelirler.length > 0) {
    console.log('\n💵 EK GELİRLER:');
    const latest = history.ekGelirler[history.ekGelirler.length - 1];
    result.ekGelirler = analyzeEkGelirler(latest.data);
  } else {
    console.log('\n💵 EK GELİRLER: Veri bulunamadı');
  }

  console.log('\n✅ TEŞHIS TAMAMLANDI\n');

  return result;
};

/**
 * Örnek veri oluştur (test için)
 */
export const createSampleData = (): {
  hesapKalemleri: HesapKalemi[];
  sabitKomisyonlar: SabitKomisyon[];
  ekGelirler: EkGelir[];
} => {
  return {
    hesapKalemleri: [
      {
        id: '1',
        kod: 'HK001',
        adi: 'İşlem Komisyonu',
        aciklama: 'POS işlem başına alınan komisyon',
        aktif: true
      },
      {
        id: '2',
        kod: 'HK002',
        adi: 'Aylık Sabit Ücret',
        aciklama: 'POS cihazı için aylık sabit ücret',
        aktif: true
      },
      {
        id: '3',
        kod: 'HK003',
        adi: 'Kurulum Ücreti',
        aciklama: 'İlk kurulum ücret kalemi',
        aktif: true
      }
    ],
    sabitKomisyonlar: [
      {
        id: '1',
        adi: 'Standart Komisyon',
        oran: 2.5,
        aciklama: 'Standart işlem komisyonu oranı',
        aktif: true
      },
      {
        id: '2',
        adi: 'Premium Komisyon',
        oran: 1.8,
        aciklama: 'Premium üyeler için indirimli oran',
        aktif: true
      }
    ],
    ekGelirler: [
      {
        id: '1',
        adi: 'SMS Bildirimi',
        tutar: 0.50,
        birim: 'TL',
        aciklama: 'İşlem başına SMS ücreti',
        aktif: true
      },
      {
        id: '2',
        adi: 'Entegrasyon Ücreti',
        tutar: 100,
        birim: 'USD',
        aciklama: 'API entegrasyon aylık ücreti',
        aktif: true
      }
    ]
  };
};

/**
 * Legacy kayıtları geri yükle (vlegacy → güncel format)
 */
export const recoveryLegacyData = (): {
  success: boolean;
  recovered: {
    hesapKalemleri: HesapKalemi[];
    sabitKomisyonlar: SabitKomisyon[];
    ekGelirler: EkGelir[];
  };
  message: string;
} => {
  console.log('🔄 Legacy veri kurtarma başlatılıyor...');
  
  const recovered = {
    hesapKalemleri: [] as HesapKalemi[],
    sabitKomisyonlar: [] as SabitKomisyon[],
    ekGelirler: [] as EkGelir[]
  };

  let recoveredCount = 0;
  const keys = ['hesapKalemleri', 'sabitKomisyonlar', 'ekGelirler'] as const;

  keys.forEach(key => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        console.log(`  ⏭️ ${key}: Veri yok, atlanıyor`);
        return;
      }

      const parsed = JSON.parse(stored);

      // Eğer versiyonlu format ise ve data var ise
      if (parsed.version && parsed.data !== undefined) {
        if (parsed.version === 'legacy' || parsed.version === 'vlegacy') {
          // Legacy veriyi çıkar
          const legacyData = Array.isArray(parsed.data) ? parsed.data : [];
          recovered[key] = legacyData;
          recoveredCount += legacyData.length;
          console.log(`  ✅ ${key}: ${legacyData.length} kayıt kurtarıldı (legacy → güncel)`);
        } else {
          // Zaten güncel versiyondaysa, datayı al
          const currentData = Array.isArray(parsed.data) ? parsed.data : [];
          recovered[key] = currentData;
          console.log(`  ℹ️ ${key}: ${currentData.length} kayıt zaten güncel (v${parsed.version})`);
        }
      } else if (Array.isArray(parsed)) {
        // Versiyonsuz ama doğrudan array ise
        recovered[key] = parsed;
        recoveredCount += parsed.length;
        console.log(`  ✅ ${key}: ${parsed.length} kayıt kurtarıldı (versiyonsuz → güncel)`);
      } else {
        console.warn(`  ⚠️ ${key}: Beklenmeyen format, atlanıyor`);
      }
    } catch (error) {
      console.error(`  ❌ ${key}: Kurtarma hatası:`, error);
    }
  });

  const success = recoveredCount > 0 || 
    recovered.hesapKalemleri.length > 0 || 
    recovered.sabitKomisyonlar.length > 0 || 
    recovered.ekGelirler.length > 0;

  const message = success
    ? `✅ ${recoveredCount} kayıt başarıyla kurtarıldı`
    : '⚠️ Kurtarılacak legacy veri bulunamadı';

  console.log(message);
  return { success, recovered, message };
};

/**
 * Browser console'da kullanım:
 * 
 * import { runFullDiagnostic, extractVersionHistory, recoveryLegacyData } from './utils/revenueModelsRecovery';
 * 
 * // Tam teşhis
 * const result = runFullDiagnostic();
 * 
 * // Sadece versiyon geçmişi
 * const history = extractVersionHistory();
 * 
 * // Legacy veri kurtarma
 * const recovery = recoveryLegacyData();
 * 
 * // Detaylı veri görüntüleme
 * console.table(result.hesapKalemleri?.items);
 */
