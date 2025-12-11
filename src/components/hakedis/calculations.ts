/**
 * HAKEDİŞ V2 - HESAPLAMA FONKSİYONLARI
 * Tüm finansal hesaplamalar burada merkezi olarak yapılır
 */

import { HakedisV2Record } from './types';

// 💰 İşlem Hacmi Hesaplamaları
export interface IslemHacmiDetay {
  tabelaId: string;
  tabelaAd: string;
  hacim: number;
  komisyonOrani: number;
  komisyon: number;
}

export interface HakedisHesaplama {
  // İşlem Hacmi
  toplamIslemHacmi: number;
  tabelaDetaylar: IslemHacmiDetay[];
  
  // PF Tarafı
  toplamKomisyon: number;
  ekGelirPF: number;
  ekKesintiPF: number;
  brutTutarPF: number;
  kdvPF: number;
  netTutarPF: number;
  
  // OXİVO Tarafı
  brutTutarOXIVO: number;
  ekGelirOXIVO: number;
  ekKesintiOXIVO: number;
  kdvOXIVO: number;
  netTutarOXIVO: number;
  
  // Genel Toplam
  toplamNetTutar: number;
}

/**
 * Ana hesaplama fonksiyonu
 * Bir hakediş kaydının tüm finansal hesaplamalarını yapar
 */
export function calculateHakedis(
  hakedis: HakedisV2Record,
  tabelaData?: Array<{ id: string; ad: string; komisyonOrani: number }>
): HakedisHesaplama {
  // 1️⃣ İşlem Hacmi Detayları
  const islemHacmiMap = hakedis.islemHacmiMap || {};
  const tabelaDetaylar: IslemHacmiDetay[] = [];
  let toplamIslemHacmi = 0;
  let toplamKomisyon = 0;

  Object.entries(islemHacmiMap).forEach(([tabelaId, hacim]) => {
    const hacimNumber = typeof hacim === 'number' ? hacim : parseFloat(String(hacim)) || 0;
    
    // Tabela bilgisi bul
    const tabela = tabelaData?.find(t => t.id === tabelaId);
    const komisyonOrani = tabela?.komisyonOrani || 0;
    const komisyon = hacimNumber * (komisyonOrani / 100);

    tabelaDetaylar.push({
      tabelaId,
      tabelaAd: tabela?.ad || tabelaId,
      hacim: hacimNumber,
      komisyonOrani,
      komisyon,
    });

    toplamIslemHacmi += hacimNumber;
    toplamKomisyon += komisyon;
  });

  // 2️⃣ PF Ek İşlem Hacmi (varsa ekle)
  const pfEkHacim = parseFloatSafe(hakedis.pfIslemHacmi);
  if (pfEkHacim > 0) {
    toplamIslemHacmi += pfEkHacim;
    // PF ek hacim için komisyon hesapla (varsayılan %1)
    toplamKomisyon += pfEkHacim * 0.01;
  }

  // 3️⃣ PF Tarafı Hesapları
  const ekGelirPF = hakedis.ekGelirPFTL || 0;
  const ekKesintiPF = hakedis.ekKesintiPFTL || 0;
  const brutTutarPF = toplamKomisyon + ekGelirPF - ekKesintiPF;
  const kdvPF = brutTutarPF * 0.20; // %20 KDV
  const netTutarPF = brutTutarPF + kdvPF;

  // 4️⃣ OXİVO Tarafı Hesapları
  const oxivoEkHacim = parseFloatSafe(hakedis.oxivoIslemHacmi);
  const ekGelirOXIVO = hakedis.ekGelirOXTL || 0;
  const ekKesintiOXIVO = hakedis.ekKesintiOXTL || 0;
  
  // OXİVO komisyon hesabı (ek hacim varsa)
  const oxivoKomisyon = oxivoEkHacim * 0.01; // Varsayılan %1
  const brutTutarOXIVO = oxivoKomisyon + ekGelirOXIVO - ekKesintiOXIVO;
  const kdvOXIVO = brutTutarOXIVO * 0.20;
  const netTutarOXIVO = brutTutarOXIVO + kdvOXIVO;

  // 5️⃣ Genel Toplam
  const toplamNetTutar = netTutarPF + netTutarOXIVO;

  return {
    toplamIslemHacmi,
    tabelaDetaylar,
    toplamKomisyon,
    ekGelirPF,
    ekKesintiPF,
    brutTutarPF,
    kdvPF,
    netTutarPF,
    brutTutarOXIVO,
    ekGelirOXIVO,
    ekKesintiOXIVO,
    kdvOXIVO,
    netTutarOXIVO,
    toplamNetTutar,
  };
}

/**
 * Format: Para birimi (₺)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format: Sayı (virgüllü)
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format: Yüzde
 */
export function formatPercent(value: number): string {
  return `%${value.toFixed(2)}`;
}

/**
 * Safe parse float
 */
function parseFloatSafe(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  return isNaN(num) ? 0 : num;
}

/**
 * Dönemsel özet hesaplama
 * Birden fazla hakediş kaydının toplamını alır
 */
export function calculateDonemOzet(hakedisler: HakedisV2Record[]): {
  toplamIslemHacmi: number;
  toplamNetTutar: number;
  taslakSayisi: number;
  kesinlesmis: number;
} {
  let toplamIslemHacmi = 0;
  let toplamNetTutar = 0;
  let taslakSayisi = 0;
  let kesinlesmis = 0;

  hakedisler.forEach(h => {
    const hesap = calculateHakedis(h);
    toplamIslemHacmi += hesap.toplamIslemHacmi;
    toplamNetTutar += hesap.toplamNetTutar;
    
    if (h.durum === 'Taslak') taslakSayisi++;
    if (h.durum === 'Kesinleşmiş') kesinlesmis++;
  });

  return {
    toplamIslemHacmi,
    toplamNetTutar,
    taslakSayisi,
    kesinlesmis,
  };
}
