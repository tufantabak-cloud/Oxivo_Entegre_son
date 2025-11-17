import React, { useState, useCallback } from 'react';
import { JobTitlesTab } from './JobTitlesTab';
import { MCCTab } from './MCCTab';
import { BanksTab, Bank } from './BanksTab';
import { EPKTab, EPK } from './EPKTab';
import { OKTab, OK } from './OKTab';
import { RevenueModelsTab, HesapKalemi, SabitKomisyon, EkGelir } from './RevenueModelsTab';
import { Partnership } from './PartnershipTab';
import { SharingTab, Sharing } from './SharingTab';
import { KartProgramTab, KartProgram } from './KartProgramTab';
import { SalesRepresentativesTab, SalesRepresentative, defaultSalesRepresentatives } from './SalesRepresentativesTab';
import { SuspensionReasonsTab } from './SuspensionReasonsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export interface JobTitle {
  id: string;
  unvan: string;
  aciklama: string;
  aktif: boolean;
  olusturmaTarihi: string;
}

export interface MCC {
  id: string;
  kod: string;
  kategori: string;
  aciklama: string;
  aktif: boolean;
  olusturmaTarihi: string;
}

export interface SuspensionReason {
  id: string;
  reason: string;
  aciklama: string;
  aktif: boolean;
  olusturmaTarihi: string;
}

export type { Bank, EPK, OK, Partnership, Sharing, KartProgram, HesapKalemi, SabitKomisyon, EkGelir, SalesRepresentative };
export { defaultSalesRepresentatives };

// Global cihaz pasifleştirme sebepleri listesi
export const defaultSuspensionReasons: SuspensionReason[] = [
  {
    id: '1',
    reason: 'Donanım tamiratı',
    aciklama: 'Cihaz arıza nedeniyle tamirde',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '2',
    reason: 'Ödeme anlaşmazlığı',
    aciklama: 'Müşteri ile ödeme konusunda anlaşmazlık',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '3',
    reason: 'Müşteri talebi',
    aciklama: 'Müşterinin talebi üzerine geçici durdurma',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '4',
    reason: 'Teknik sorun',
    aciklama: 'Sistem veya yazılım kaynaklı sorun',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '5',
    reason: 'İşletme geçici kapalı',
    aciklama: 'Müşteri işletmesi geçici olarak kapatılmış',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '6',
    reason: 'Mevsimsel durdurma',
    aciklama: 'Sezon dışı dönemde cihaz kullanılmıyor',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '7',
    reason: 'Banka değişikliği',
    aciklama: 'Müşteri banka değiştirme sürecinde',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '8',
    reason: 'Lisans yenileme',
    aciklama: 'Lisans yenileme işlemleri devam ediyor',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
];

// Global görev listesi (tüm uygulama genelinde kullanılacak)
export const defaultJobTitles: JobTitle[] = [
  {
    id: '1',
    unvan: 'Genel Müdür',
    aciklama: 'Şirketin en üst düzey yöneticisi',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '2',
    unvan: 'Genel Müdür Yardımcısı',
    aciklama: 'Genel müdüre bağlı çalışan yardımcı yönetici',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '3',
    unvan: 'Finans Direktörü',
    aciklama: 'Finans departmanının başkanı',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '4',
    unvan: 'Satış Direktörü',
    aciklama: 'Satış departmanının başkanı',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '5',
    unvan: 'Pazarlama Direktörü',
    aciklama: 'Pazarlama departmanının başkanı',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '6',
    unvan: 'IT Direktörü',
    aciklama: 'Bilgi teknolojileri departmanının başkanı',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '7',
    unvan: 'İnsan Kaynakları Müdürü',
    aciklama: 'İK departmanının müdürü',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '8',
    unvan: 'Muhasebe Müdürü',
    aciklama: 'Muhasebe departmanının müdürü',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '9',
    unvan: 'Uyum Müdürü',
    aciklama: 'Uyum ve denetim sorumlusu',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '10',
    unvan: 'Risk Yöneticisi',
    aciklama: 'Risk yönetimi sorumlusu',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '11',
    unvan: 'Proje Yöneticisi',
    aciklama: 'Proje yönetiminden sorumlu',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '12',
    unvan: 'Müşteri İlişkileri Müdürü',
    aciklama: 'Müşteri ilişkileri departmanı müdürü',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '13',
    unvan: 'Teknik Destek Uzmanı',
    aciklama: 'Teknik destek hizmetleri uzmanı',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '14',
    unvan: 'İş Geliştirme Uzmanı',
    aciklama: 'İş geliştirme ve stratejik planlama uzmanı',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
];

// Global MCC listesi
export const defaultMCCList: MCC[] = [
  {
    id: '1',
    kod: '5411',
    kategori: 'Gıda Marketleri',
    aciklama: 'Süpermarketler ve bakkallar',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '2',
    kod: '5812',
    kategori: 'Yeme İçme',
    aciklama: 'Restoranlar',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '3',
    kod: '5814',
    kategori: 'Yeme İçme',
    aciklama: 'Fast Food Restoranları',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '4',
    kod: '5912',
    kategori: 'Sağlık',
    aciklama: 'Eczaneler ve İlaç Satış Yerleri',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '5',
    kod: '5999',
    kategori: 'Perakende',
    aciklama: 'Çeşitli Perakende Mağazalar',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '6',
    kod: '5651',
    kategori: 'Giyim',
    aciklama: 'Giyim ve Aksesuar Mağazaları',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '7',
    kod: '5722',
    kategori: 'Elektronik',
    aciklama: 'Ev Aletleri Mağazaları',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '8',
    kod: '5732',
    kategori: 'Elektronik',
    aciklama: 'Elektronik Mağazaları',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '9',
    kod: '5533',
    kategori: 'Otomotiv',
    aciklama: 'Otomotiv Yedek Parça Satıcıları',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '10',
    kod: '5541',
    kategori: 'Otomotiv',
    aciklama: 'Akaryakıt İstasyonları',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '11',
    kod: '1520',
    kategori: 'İnşaat',
    aciklama: 'Genel İnşaat Müteahhitleri',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '12',
    kod: '7011',
    kategori: 'Konaklama',
    aciklama: 'Oteller ve Moteller',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '13',
    kod: '7832',
    kategori: 'Eğlence',
    aciklama: 'Sinema ve Tiyatro',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '14',
    kod: '7997',
    kategori: 'Eğlence',
    aciklama: 'Spor ve Rekreasyon Kulüpleri',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '15',
    kod: '8011',
    kategori: 'Sağlık',
    aciklama: 'Doktorlar ve Hekimler',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
];

// Global Banka listesi
export const defaultBanks: Bank[] = [
  {
    id: '1',
    kod: '0001',
    bankaAdi: 'Türkiye Cumhuriyet Merkez Bankası',
    aciklama: 'Merkez Bankası',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '2',
    kod: '0010',
    bankaAdi: 'Türkiye Ziraat Bankası A.Ş.',
    aciklama: 'Kamu Bankası',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '3',
    kod: '0012',
    bankaAdi: 'Türkiye Halk Bankası A.Ş.',
    aciklama: 'Kamu Bankası',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '4',
    kod: '0015',
    bankaAdi: 'Türkiye Vakıflar Bankası T.A.O.',
    aciklama: 'Kamu Bankası',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '5',
    kod: '0032',
    bankaAdi: 'Türkiye İş Bankası A.Ş.',
    aciklama: 'Özel Banka',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '6',
    kod: '0046',
    bankaAdi: 'Akbank T.A.Ş.',
    aciklama: 'Özel Banka',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '7',
    kod: '0062',
    bankaAdi: 'Türkiye Garanti Bankası A.Ş.',
    aciklama: 'Özel Banka',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '8',
    kod: '0064',
    bankaAdi: 'Yapı ve Kredi Bankası A.Ş.',
    aciklama: 'Özel Banka',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
];

// Global EPK listesi
export const defaultEPKList: EPK[] = [
  {
    id: '1',
    kod: 'EPK001',
    kurumAdi: 'Papara Elektronik Para A.Ş.',
    aciklama: 'Elektronik Para Kuruluşu',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '2',
    kod: 'EPK002',
    kurumAdi: 'Paybol Elektronik Para A.Ş.',
    aciklama: 'Elektronik Para Kuruluşu',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
];

// Global ÖK listesi
export const defaultOKList: OK[] = [
  {
    id: '1',
    kod: 'OK001',
    kurumAdi: 'İyzico Ödeme Hizmetleri A.Ş.',
    aciklama: 'Ödeme Kuruluşu',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '2',
    kod: 'OK002',
    kurumAdi: 'PayTR Ödeme ve Elektronik Para Hizmetleri A.Ş.',
    aciklama: 'Ödeme Kuruluşu',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
];

// Global Ortaklık modelleri
export const defaultPartnerships: Partnership[] = [
  {
    id: '1',
    kod: 'ORT001',
    modelAdi: 'Standart Ortaklık',
    oran: '50/50',
    aciklama: 'Eşit gelir paylaşımı modeli',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
    calculationRows: [],
  },
  {
    id: '2',
    kod: 'ORT002',
    modelAdi: 'Kademeli Ortaklık',
    oran: '60/40',
    aciklama: 'Kademeli gelir paylaşımı modeli',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
    calculationRows: [],
  },
];

// Global Paylaşım modelleri
export const defaultSharings: Sharing[] = [
  {
    id: '1',
    kod: 'PAY001',
    modelAdi: 'Gelir Ortaklığı',
    oran: '%50',
    aciklama: 'Gelir ortaklığı modeli',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '2',
    kod: 'PAY002',
    modelAdi: 'Sabit Komisyon',
    oran: 'Sabit',
    aciklama: 'Sabit komisyon modeli',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
];

// Global Kart Program listesi
export const defaultKartProgramlar: KartProgram[] = [
  {
    id: '1',
    kartAdi: 'BONUS',
    aciklama: 'Garanti BBVA Bonus Kart Programı',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '2',
    kartAdi: 'AXESS',
    aciklama: 'Akbank Axess Kart Programı',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '3',
    kartAdi: 'MAXIMUM',
    aciklama: 'İş Bankası Maximum Kart Programı',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '4',
    kartAdi: 'WORLDCARD',
    aciklama: 'Yapı Kredi World Card Programı',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '5',
    kartAdi: 'CARDFINANS',
    aciklama: 'CardFinans Kart Programı',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '6',
    kartAdi: 'PARAF',
    aciklama: 'Halkbank Paraf Kart Programı',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '7',
    kartAdi: 'BANKKART COMBO',
    aciklama: 'BankKart Combo Kart Programı',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '8',
    kartAdi: 'SAĞLAM KART',
    aciklama: 'Ziraat Bankası Sağlam Kart Programı',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
];

interface DefinitionsModuleProps {
  jobTitles: JobTitle[];
  onJobTitlesChange: (titles: JobTitle[]) => void;
  mccList: MCC[];
  onMCCListChange: (list: MCC[]) => void;
  banks: Bank[];
  onBanksChange: (banks: Bank[]) => void;
  epkList: EPK[];
  onEPKListChange: (list: EPK[]) => void;
  okList: OK[];
  onOKListChange: (list: OK[]) => void;
  partnerships: Partnership[];
  onPartnershipsChange: (list: Partnership[]) => void;
  sharings: Sharing[];
  onSharingsChange: (list: Sharing[]) => void;
  hesapKalemleri: HesapKalemi[];
  onHesapKalemleriChange: (list: HesapKalemi[]) => void;
  sabitKomisyonlar?: SabitKomisyon[];
  onSabitKomisyonlarChange?: (list: SabitKomisyon[]) => void;
  ekGelirler?: EkGelir[];
  onEkGelirlerChange?: (list: EkGelir[]) => void;
  kartProgramlar: KartProgram[];
  onKartProgramlarChange: (list: KartProgram[]) => void;
  salesReps: SalesRepresentative[];
  onSalesRepsChange: (reps: SalesRepresentative[]) => void;
  suspensionReasons: SuspensionReason[];
  onSuspensionReasonsChange: (reasons: SuspensionReason[]) => void;
}

// PERFORMANCE: React.memo prevents unnecessary re-renders (critical for 22 props!)
export const DefinitionsModule = React.memo(function DefinitionsModule({ 
  jobTitles, 
  onJobTitlesChange,
  mccList,
  onMCCListChange,
  banks,
  onBanksChange,
  epkList,
  onEPKListChange,
  okList,
  onOKListChange,
  partnerships,
  onPartnershipsChange,
  sharings,
  onSharingsChange,
  hesapKalemleri,
  onHesapKalemleriChange,
  sabitKomisyonlar = [],
  onSabitKomisyonlarChange = () => {},
  ekGelirler = [],
  onEkGelirlerChange = () => {},
  kartProgramlar,
  onKartProgramlarChange,
  salesReps,
  onSalesRepsChange,
  suspensionReasons,
  onSuspensionReasonsChange
}: DefinitionsModuleProps) {
  // ⚡ PERFORMANCE: Wrap all onChange handlers in useCallback to prevent child re-renders
  const handleJobTitlesChange = useCallback((titles: typeof jobTitles) => {
    onJobTitlesChange(titles);
  }, [onJobTitlesChange]);

  const handleMCCListChange = useCallback((list: typeof mccList) => {
    onMCCListChange(list);
  }, [onMCCListChange]);

  const handleBanksChange = useCallback((list: typeof banks) => {
    onBanksChange(list);
  }, [onBanksChange]);

  const handleEPKListChange = useCallback((list: typeof epkList) => {
    onEPKListChange(list);
  }, [onEPKListChange]);

  const handleOKListChange = useCallback((list: typeof okList) => {
    onOKListChange(list);
  }, [onOKListChange]);

  const handlePartnershipsChange = useCallback((list: typeof partnerships) => {
    onPartnershipsChange(list);
  }, [onPartnershipsChange]);

  const handleSharingsChange = useCallback((list: typeof sharings) => {
    onSharingsChange(list);
  }, [onSharingsChange]);

  const handleHesapKalemleriChange = useCallback((list: typeof hesapKalemleri) => {
    onHesapKalemleriChange(list);
  }, [onHesapKalemleriChange]);

  const handleSabitKomisyonlarChange = useCallback((list: typeof sabitKomisyonlar) => {
    onSabitKomisyonlarChange(list);
  }, [onSabitKomisyonlarChange]);

  const handleEkGelirlerChange = useCallback((list: typeof ekGelirler) => {
    onEkGelirlerChange(list);
  }, [onEkGelirlerChange]);

  const handleKartProgramlarChange = useCallback((list: typeof kartProgramlar) => {
    onKartProgramlarChange(list);
  }, [onKartProgramlarChange]);

  const handleSalesRepsChange = useCallback((list: typeof salesReps) => {
    onSalesRepsChange(list);
  }, [onSalesRepsChange]);

  const handleSuspensionReasonsChange = useCallback((list: typeof suspensionReasons) => {
    onSuspensionReasonsChange(list);
  }, [onSuspensionReasonsChange]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tanımlar</h2>
        <p className="text-sm font-medium text-gray-600">
          Sistemde kullanılan tanımları yönetin
        </p>
      </div>

      <Tabs defaultValue="gorevler" className="space-y-6">
        <TabsList>
          <TabsTrigger value="gorevler">Görev Tanımları</TabsTrigger>
          <TabsTrigger value="salesreps">Satış Temsilcileri</TabsTrigger>
          <TabsTrigger value="suspensionreasons">Pasifleştirme Sebepleri</TabsTrigger>
          <TabsTrigger value="mcc">MCC Tanımları</TabsTrigger>
          <TabsTrigger value="bankalar">Bankalar</TabsTrigger>
          <TabsTrigger value="epk">EPK</TabsTrigger>
          <TabsTrigger value="ok">ÖK</TabsTrigger>
          <TabsTrigger value="paylasimmodelleri">Paylaşım Modelleri</TabsTrigger>
          <TabsTrigger value="gelirmodelleri">Hesap Kalemleri</TabsTrigger>
          <TabsTrigger value="kartprogram">Kart Program</TabsTrigger>
        </TabsList>

        <TabsContent value="gorevler">
          <JobTitlesTab jobTitles={jobTitles} onJobTitlesChange={handleJobTitlesChange} />
        </TabsContent>

        <TabsContent value="salesreps">
          <SalesRepresentativesTab salesReps={salesReps} onSalesRepsChange={handleSalesRepsChange} />
        </TabsContent>

        <TabsContent value="suspensionreasons">
          <SuspensionReasonsTab 
            suspensionReasons={suspensionReasons} 
            onSuspensionReasonsChange={handleSuspensionReasonsChange} 
          />
        </TabsContent>

        <TabsContent value="mcc">
          <MCCTab mccList={mccList} onMCCListChange={handleMCCListChange} />
        </TabsContent>

        <TabsContent value="bankalar">
          <BanksTab banks={banks} onBanksChange={handleBanksChange} />
        </TabsContent>

        <TabsContent value="epk">
          <EPKTab epkList={epkList} onEPKListChange={handleEPKListChange} />
        </TabsContent>

        <TabsContent value="ok">
          <OKTab okList={okList} onOKListChange={handleOKListChange} />
        </TabsContent>

        <TabsContent value="paylasimmodelleri">
          <SharingTab 
            sharings={sharings}
            onSharingsChange={handleSharingsChange}
          />
        </TabsContent>

        <TabsContent value="gelirmodelleri">
          <RevenueModelsTab 
            hesapKalemleri={hesapKalemleri}
            onHesapKalemleriChange={handleHesapKalemleriChange}
            sabitKomisyonlar={sabitKomisyonlar}
            onSabitKomisyonlarChange={handleSabitKomisyonlarChange}
            ekGelirler={ekGelirler}
            onEkGelirlerChange={handleEkGelirlerChange}
          />
        </TabsContent>

        <TabsContent value="kartprogram">
          <KartProgramTab 
            kartProgramlar={kartProgramlar}
            onKartProgramlarChange={handleKartProgramlarChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
});
