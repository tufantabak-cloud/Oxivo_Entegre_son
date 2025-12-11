/**
 * Ana hesaplama fonksiyonu
 * Bir hakediş kaydının tüm finansal hesaplamalarını yapar
 */
export function calculateHakedis(
  hakedis: HakedisV2Record,
  tabelaRecords?: TabelaRecord[],
  tabelaGroups?: TabelaGroup[]
): HakedisHesaplama {
  // 1️⃣ YENİ: Her tabela × aktif vade için satır oluştur
  const islemHacmiMap = hakedis.islemHacmiMap || {};
  let tabelaDetaylar: IslemHacmiDetay[] = [];
  
  if (tabelaRecords && tabelaGroups) {
    // Yeni format: generateHakedisDetayRows kullan
    tabelaDetaylar = generateHakedisDetayRows(
      tabelaRecords,
      tabelaGroups,
      islemHacmiMap
    );
  } else {
    // Fallback: Eski format (tabela listesi yoksa)
    tabelaDetaylar = [];
  }
  
  let toplamIslemHacmi = 0;
  let toplamHesaplama = 0;
  let toplamPFPayi = 0;
  let toplamOxivoPayi = 0;

  // Detay satırlarından toplamları hesapla
  tabelaDetaylar.forEach(detay => {
    toplamIslemHacmi += detay.islemHacmi;
    toplamHesaplama += detay.kazanc;
    toplamPFPayi += detay.pfPayiHesaplama;
    toplamOxivoPayi += detay.oxivoPayiHesaplama;
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

/**
 * 🚀 YENİ: Her TABELA ve aktif VADESİ için ayrı satır oluştur
 * Excel formatındaki gibi: 2 Tabela × 2 Aktif Vade = 4 Satır
 */
export function generateHakedisDetayRows(
  tabelaRecords: TabelaRecord[],
  tabelaGroups: TabelaGroup[],
  islemHacmiMap: Record<string, number> // tabelaId_vade → hacim
): IslemHacmiDetay[] {
  const rows: IslemHacmiDetay[] = [];
  
  tabelaRecords.forEach((tabela) => {
    // Grup adını bul
    const grup = tabelaGroups.find(g => g.recordIds.includes(tabela.id));
    const grupAdi = grup?.name || 'Grupsuz';
    
    // Kuruluş ve OXIVO oranları
    const kurulusOrani = tabela.kurulusOrani || parseFloat(tabela.paylaşımOranları?.kurulusOrani || '0') || 0;
    const oxivoOrani = tabela.oxivoOrani || parseFloat(tabela.paylaşımOranları?.oxivoOrani || '0') || 0;
    
    // Aktif vadeleri bul
    const aktifVadeler = tabela.komisyonOranları?.filter(k => k.aktif) || [];
    
    aktifVadeler.forEach((vadeKomisyon) => {
      const vade = vadeKomisyon.vade;
      const mapKey = `${tabela.id}_${vade}`;
      const islemHacmi = islemHacmiMap[mapKey] || 0;
      
      // Gelir modeline göre komisyon oranı ve display metni
      let tabelaOrani = '';
      let komisyonOran = 0;
      
      const gelirModeliAd = tabela.gelirModeli?.ad || '';
      
      if (gelirModeliAd === 'Gelir Ortaklığı') {
        // Satış TL kullan
        const satisTL = parseFloatSafe(vadeKomisyon.satisTL);
        tabelaOrani = `${satisTL.toFixed(3)} TL`;
        // Komisyon oranı: Satış TL değerini % olarak kullan (örn: 0.03 TL → işlem hacmi başına 0.03 TL kazanç)
        komisyonOran = satisTL; // Doğrudan kullanılacak (hacim × satisTL)
      } else if (gelirModeliAd === 'Sabit Komisyon') {
        // Oran % kullan
        komisyonOran = parseFloatSafe(vadeKomisyon.oran);
        tabelaOrani = `${komisyonOran.toFixed(2)}%`;
      } else {
        // Diğer durumlar
        komisyonOran = parseFloatSafe(vadeKomisyon.oran);
        tabelaOrani = komisyonOran > 0 ? `${komisyonOran.toFixed(2)}%` : '-';
      }
      
      // Kazanç hesaplama
      let kazanc = 0;
      if (gelirModeliAd === 'Gelir Ortaklığı') {
        // Satış TL × İşlem Hacmi
        kazanc = islemHacmi * komisyonOran;
      } else {
        // (Komisyon % / 100) × İşlem Hacmi
        kazanc = islemHacmi * (komisyonOran / 100);
      }
      
      // PF ve OXIVO payları
      const pfPayiHesaplama = kazanc * (kurulusOrani / 100);
      const oxivoPayiHesaplama = kazanc * (oxivoOrani / 100);
      
      rows.push({
        tabelaId: tabela.id,
        grupAdi,
        kisaAciklama: tabela.kisaAciklama || tabela.kurulus?.ad || 'Bilinmeyen',
        urun: tabela.urun || tabela.urunTipi || '-',
        gelirModeli: gelirModeliAd,
        kartTipi: tabela.kartTipi || '-',
        yurtIciDisi: tabela.yurtIciDisi || '-',
        vade,
        tabelaOrani,
        komisyonOran,
        kurulusOrani,
        oxivoOrani,
        islemHacmi,
        kazanc,
        pfPayiHesaplama,
        oxivoPayiHesaplama,
      });
    });
  });
  
  return rows;
}