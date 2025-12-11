/**
 * HAKEDİŞ V2 - HESAPLAMA FONKSİYONLARI
 * Tüm finansal hesaplamalar burada merkezi olarak yapılır
 */

import { HakedisV2Record } from './types';
import { TabelaRecord } from '../TabelaTab';

// 💰 İşlem Hacmi Hesaplamaları - Detaylı
export interface IslemHacmiDetay {
  tabelaId: string;
  // Tabela Bilgileri
  kisaAciklama: string;
  urun: string;
  gelirModeli: string;
  kartTipi: string;
  yurtIciDisi: string;
  vade: string;
  
  // Hesaplama Alanları
  tabelaninIslemHacmi: number;  // Tabelanın kendi işlem hacmi (eğer veri varsa)
  islemHacmi: number;            // Kullanılan işlem hacmi
  hesaplama: number;             // İşlem Hacmi × Komisyon Oranı
  kurulusOrani: number;          // % cinsinden
  pfPayi: number;                // Hesaplama × (Kuruluş Oranı / 100)
  oxivoOrani: number;            // % cinsinden  
  oxivoPayi: number;             // Hesaplama × (OXIVO Oranı / 100)
}

export interface HakedisHesaplama {
  // İşlem Hacmi Detayları
  tabelaDetaylar: IslemHacmiDetay[];
  
  // Kümüle Toplamlar
  toplamIslemHacmi: number;
  toplamHesaplama: number;  // Tüm komisyonların toplamı
  toplamPFPayi: number;
  toplamOxivoPayi: number;
  
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
  tabelaRecords?: TabelaRecord[]
): HakedisHesaplama {
  // 1️⃣ İşlem Hacmi Detayları - Her tabela için ayrı satır
  const islemHacmiMap = hakedis.islemHacmiMap || {};
  const tabelaDetaylar: IslemHacmiDetay[] = [];
  
  let toplamIslemHacmi = 0;
  let toplamHesaplama = 0;
  let toplamPFPayi = 0;
  let toplamOxivoPayi = 0;

  Object.entries(islemHacmiMap).forEach(([tabelaId, hacim]) => {
    const hacimNumber = typeof hacim === 'number' ? hacim : parseFloat(String(hacim)) || 0;
    
    // Tabela bilgisi bul
    const tabela = tabelaRecords?.find(t => t.id === tabelaId);
    
    // Vadeye göre komisyon oranı bul
    const vadeKomisyon = tabela?.komisyonOranları?.find(
      k => k.vade === hakedis.vade && k.aktif
    );
    const komisyonOrani = vadeKomisyon?.oran ? parseFloat(vadeKomisyon.oran) : 0;
    
    // Hesaplama: İşlem Hacmi × (Komisyon Oranı / 100)
    const hesaplama = hacimNumber * (komisyonOrani / 100);
    
    // Kuruluş ve OXIVO oranları
    const kurulusOrani = tabela?.kurulusOrani || parseFloat(tabela?.paylaşımOranları?.kurulusOrani || '0') || 0;
    const oxivoOrani = tabela?.oxivoOrani || parseFloat(tabela?.paylaşımOranları?.oxivoOrani || '0') || 0;
    
    // PF ve OXIVO payları
    const pfPayi = hesaplama * (kurulusOrani / 100);
    const oxivoPayi = hesaplama * (oxivoOrani / 100);

    tabelaDetaylar.push({
      tabelaId,
      kisaAciklama: tabela?.kisaAciklama || tabela?.kurulus?.ad || 'Bilinmeyen',
      urun: tabela?.urun || tabela?.urunTipi || '-',
      gelirModeli: tabela?.gelirModeli?.ad || '-',
      kartTipi: tabela?.kartTipi || '-',
      yurtIciDisi: tabela?.yurtIciDisi || '-',
      vade: hakedis.vade,
      tabelaninIslemHacmi: 0, // TODO: Eğer tabela kendi işlem hacmi tutuyorsa buraya eklenebilir
      islemHacmi: hacimNumber,
      hesaplama,
      kurulusOrani,
      pfPayi,
      oxivoOrani,
      oxivoPayi,
    });

    toplamIslemHacmi += hacimNumber;
    toplamHesaplama += hesaplama;
    toplamPFPayi += pfPayi;
    toplamOxivoPayi += oxivoPayi;
  });

  // 2️⃣ PF Ek İşlem Hacmi (varsa ekle)
  const pfEkHacim = parseFloatSafe(hakedis.pfIslemHacmi);
  if (pfEkHacim > 0) {
    toplamIslemHacmi += pfEkHacim;
    // PF ek hacim için komisyon hesapla (varsayılan %1)
    const ekKomisyon = pfEkHacim * 0.01;
    toplamHesaplama += ekKomisyon;
    toplamPFPayi += ekKomisyon; // PF'ye ait
  }

  // 3️⃣ PF Tarafı Hesapları
  const ekGelirPF = hakedis.ekGelirPFTL || 0;
  const ekKesintiPF = hakedis.ekKesintiPFTL || 0;
  const toplamKomisyon = toplamPFPayi;
  const brutTutarPF = toplamKomisyon + ekGelirPF - ekKesintiPF;
  const kdvPF = brutTutarPF * 0.20; // %20 KDV
  const netTutarPF = brutTutarPF + kdvPF;

  // 4️⃣ OXİVO Tarafı Hesapları
  const oxivoEkHacim = parseFloatSafe(hakedis.oxivoIslemHacmi);
  const ekGelirOXIVO = hakedis.ekGelirOXTL || 0;
  const ekKesintiOXIVO = hakedis.ekKesintiOXTL || 0;
  
  // OXİVO komisyon hesabı (ek hacim varsa)
  const oxivoKomisyon = oxivoEkHacim * 0.01; // Varsayılan %1
  const brutTutarOXIVO = toplamOxivoPayi + oxivoKomisyon + ekGelirOXIVO - ekKesintiOXIVO;
  const kdvOXIVO = brutTutarOXIVO * 0.20;
  const netTutarOXIVO = brutTutarOXIVO + kdvOXIVO;

  // 5️⃣ Genel Toplam
  const toplamNetTutar = netTutarPF + netTutarOXIVO;

  return {
    tabelaDetaylar,
    toplamIslemHacmi,
    toplamHesaplama,
    toplamPFPayi,
    toplamOxivoPayi,
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