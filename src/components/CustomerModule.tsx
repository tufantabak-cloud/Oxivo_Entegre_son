import React, { useState, useCallback } from 'react';
import { CustomerList } from './CustomerList';
import { CustomerDetail } from './CustomerDetail';
import { ExcelImport } from './ExcelImport';
import { Plus } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { customerApi } from '../utils/supabaseClient';
// XLSX import - ES6 module format (v3.0.8 - fixed require issue)
import * as XLSX from 'xlsx';

export interface DomainNode {
  id: string;
  name: string;
  children: DomainNode[];
}

export interface BankDeviceAssignment {
  id: string;
  bankId: string;
  bankName: string;
  bankCode: string;
  deviceIds: string[];
  createdAt: string;
}

// Hizmet Bedeli Tip Tanımlamaları
export interface ReminderHistoryRecord {
  sentDate: string; // ISO date string
  dayType: 3 | 5 | 10; // Hangi gün hatırlatması
  status: 'sent' | 'failed' | 'skipped';
  channel?: 'email' | 'sms' | 'both';
  recipientEmail?: string;
  recipientPhone?: string;
  errorMessage?: string;
}

export interface SuspensionHistoryRecord {
  suspendedDate: string; // ISO date string
  reactivatedDate?: string; // ISO date string
  reason: string;
  suspendedBy: string; // Kullanıcı adı veya sistem
  notes?: string;
  autoSuspended?: boolean; // Otomatik mi (10. gün) yoksa manuel mi
}

export interface ReminderSettings {
  day3Enabled: boolean;
  day5Enabled: boolean;
  day10AutoSuspend: boolean; // 10. günde otomatik dondur
  customMessage?: string; // Özel hatırlatma mesajı
}

export interface DeviceSubscription {
  deviceId: string;
  deviceSerialNumber: string;
  deviceName: string;
  monthlyFee: number; // Euro cinsinden
  isActive: boolean; // Aktif/Pasif durum
  activationDate: string; // Cihaz sahiplenme tarihi
  lastPaymentDate?: string;
  paymentStatus: 'paid' | 'pending' | 'overdue' | 'suspended' | 'cancelled';
  suspensionReason?: string; // Pasif duruma geçiş sebebi
  suspensionDate?: string; // Pasifleştirme tarihi
  reactivationDate?: string; // Yeniden aktifleştirme tarihi
  suspensionHistory?: Array<{
    date: string;
    reason: string;
    action: 'suspended' | 'reactivated';
    notes?: string;
  }>;
}

export interface ServiceFeeInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  period: string; // Örn: "2025-01" veya "2025"
  deviceCount: number;
  totalAmount: number; // Euro
  status: 'paid' | 'pending' | 'overdue';
  paymentDate?: string;
  dueDate: string;
  devices: DeviceSubscription[];
  // Aidat Bedelleri - Yeni alanlar
  paymentConfirmed?: boolean; // Ödeme alındı onayı
  paymentConfirmedDate?: string; // Onay tarihi
  remindersSent?: number[]; // Hangi günlerde hatırlatma gönderildi (örn: [3, 5])
  reminderHistory?: ReminderHistoryRecord[]; // Hatırlatma geçmişi
  isSuspended?: boolean; // Hizmet donduruldu mu?
  suspensionDate?: string; // Dondurma tarihi
  manualSuspensionReason?: string; // Manuel dondurma sebebi
  suspensionUntilDate?: string; // Hangi tarihe kadar donduruldu
  suspensionHistory?: SuspensionHistoryRecord[]; // Dondurma geçmişi
}

export interface PaymentReminder {
  id: string;
  sentDate: string;
  reminderType: '7days' | '3days' | 'lastday';
  channel: 'email' | 'sms' | 'both';
  status: 'sent' | 'failed';
}

// Fiyat değişikliği geçmişi kaydı
export interface PriceChangeHistory {
  id: string;
  changeDate: string; // Değişiklik tarihi
  oldPrice: number; // Eski fiyat
  newPrice: number; // Yeni fiyat
  changeType: 'manual' | 'bulk' | 'automatic'; // Değişiklik tipi
  changeReason?: string; // Değişiklik sebebi
  changedBy?: string; // Değişikliği yapan kullanıcı
  increasePercentage?: number; // Artış yüzdesi
  oldPaymentType?: 'monthly' | 'yearly'; // Eski ödeme tipi
  newPaymentType?: 'monthly' | 'yearly'; // Yeni ödeme tipi
  effectiveDate?: string; // Geçerlilik tarihi
  notes?: string; // Notlar
}

export interface ServiceFeeSettings {
  customerId: string;
  paymentType: 'monthly' | 'yearly';
  standardFeePerDevice: number; // Euro (default: 10)
  customFeePerDevice?: number; // Müşteriye özel ücret
  contractStartDate: string;
  isActive: boolean;
  suspensionStartDate?: string; // Hizmet dondurma başlangıcı
  suspensionReason?: string;
  deviceSubscriptions: DeviceSubscription[];
  invoices: ServiceFeeInvoice[];
  reminders: PaymentReminder[];
  // Aidat Bedelleri - Yeni alanlar
  suspensionReasons?: string[]; // Tanımlanmış dondurma sebepleri (örn: "Donanım tamiratı", "Ödeme anlaşmazlığı")
  reminderSettings?: ReminderSettings; // Hatırlatma ayarları (müşteri bazlı)
  priceHistory?: PriceChangeHistory[]; // Fiyat değişikliği geçmişi
}

export interface Customer {
  id: string;
  cariHesapKodu: string;
  sektor: string;
  mcc: string;
  cariAdi: string;
  guncelMyPayterDomain: string;
  domainHierarchy?: DomainNode[];
  vergiDairesi: string;
  vergiNo: string;
  adres: string;
  ilce: string;
  postaKodu: string;
  email: string;
  yetkili: string;
  tel: string;
  durum: 'Aktif' | 'Pasif';
  p6x?: string;
  apollo?: string;
  linkedBankPFIds?: string[]; // Müşteri ile ilişkilendirilmiş Banka/PF kayıtları
  bankDeviceAssignments?: BankDeviceAssignment[]; // Banka - Cihaz İlişkilendirmeleri
  blokeDurumu?: boolean; // Toplu işlemler için bloke durumu
  sorumluKisi?: string; // Toplu işlemler için sorumlu kişi
  cariGrubu?: string; // Toplu işlemler için cari grubu
  serviceFeeSettings?: ServiceFeeSettings; // Hizmet bedeli ayarları
  salesRepId?: string; // Atanmış satış temsilcisi ID
  salesRepName?: string; // Atanmış satış temsilcisi adı (cache için)
  kayitTarihi?: string; // Müşteri kayıt tarihi (ISO date string)
  musteriTipi?: string; // Müşteri büyüklük tipi (Büyük İşletme, Orta İşletme, vb.)
  domain?: string; // Alias for guncelMyPayterDomain
  ignoreMainDomain?: boolean; // Ana domain görmezden gelinsin mi? (Alt domainlerle eşleştir)
  ignoreMainDomainNote?: string; // Ana domain görmezden gelme sebebi/açıklaması (ZORUNLU)
  subscriptionFee?: number; // Aylık abone hizmet bedeli (₺) - Abonelik Geliri Widget için
  // NOT: payterProducts buraya eklenmemeli! Domain bazlı eşleştirme runtime'da yapılır
}

// Örnek müşteri verileri - Excel şablonu ile aynı formatta
// Not: Başlangıçta boş liste kullanılıyor, veriler Excel'den yüklenecek
export const mockCustomers: Customer[] = [
  // {
  //   id: '1',
  //   cariHesapKodu: '120.01.001',
  //   mcc: '5411',
  //   cariAdi: 'ABC Teknoloji A.Ş.',
  //   guncelMyPayterDomain: 'abc-teknoloji.mypayter.com',
  //   vergiDairesi: 'Maslak',
  //   vergiNo: '1234567890',
  //   adres: 'Maslak Mahallesi, Büyükdere Cad. No:123',
  //   ilce: 'Sarıyer',
  //   postaKodu: '34398',
  //   email: 'ahmet@abcteknoloji.com',
  //   yetkili: 'Ahmet Yılmaz',
  //   tel: '0532 111 2233',
  //   durum: 'Aktif',
  // },
  // {
  //   id: '2',
  //   cariHesapKodu: '120.01.002',
  //   mcc: '1520',
  //   cariAdi: 'XYZ İnşaat Ltd. Şti.',
  //   guncelMyPayterDomain: 'xyz-insaat.mypayter.com',
  //   vergiDairesi: 'Çankaya',
  //   vergiNo: '0987654321',
  //   adres: 'Kızılay Mahallesi, Atatürk Bulvarı No:45',
  //   ilce: 'Çankaya',
  //   postaKodu: '06420',
  //   email: 'ayse@xyzinsaat.com',
  //   yetkili: 'Ayşe Demir',
  //   tel: '0533 444 5566',
  //   durum: 'Aktif',
  // },
  // {
  //   id: '3',
  //   cariHesapKodu: '120.01.003',
  //   mcc: '5411',
  //   cariAdi: 'DEF Gıda San. ve Tic.',
  //   guncelMyPayterDomain: 'def-gida.mypayter.com',
  //   vergiDairesi: 'Bornova',
  //   vergiNo: '5678901234',
  //   adres: 'Erzene Mahallesi, Ankara Cad. No:67',
  //   ilce: 'Bornova',
  //   postaKodu: '35040',
  //   email: 'mehmet@defgida.com',
  //   yetkili: 'Mehmet Kaya',
  //   tel: '0534 777 8899',
  //   durum: 'Aktif',
  // },
  // {
  //   id: '4',
  //   cariHesapKodu: '120.01.004',
  //   mcc: '5533',
  //   cariAdi: 'GHI Otomotiv A.Ş.',
  //   guncelMyPayterDomain: 'ghi-otomotiv.mypayter.com',
  //   vergiDairesi: 'Nilüfer',
  //   vergiNo: '4567890123',
  //   adres: 'Fethiye Mahallesi, İstanbul Cad. No:89',
  //   ilce: 'Nilüfer',
  //   postaKodu: '16140',
  //   email: 'fatma@ghiotomotiv.com',
  //   yetkili: 'Fatma Öztürk',
  //   tel: '0535 222 3344',
  //   durum: 'Pasif',
  // },
  // {
  //   id: '5',
  //   cariHesapKodu: '120.01.005',
  //   mcc: '5651',
  //   cariAdi: 'JKL Tekstil Ltd.',
  //   guncelMyPayterDomain: 'jkl-tekstil.mypayter.com',
  //   vergiDairesi: 'Osmangazi',
  //   vergiNo: '7890123456',
  //   adres: 'Soğanlı Mahallesi, Ankara Yolu No:234',
  //   ilce: 'Osmangazi',
  //   postaKodu: '16250',
  //   email: 'ali@jkltekstil.com',
  //   yetkili: 'Ali Çelik',
  //   tel: '0536 555 6677',
  //   durum: 'Aktif',
  // },
];

interface Bank {
  id: string;
  kod: string;
  bankaAdi: string;
  aciklama: string;
  aktif: boolean;
}

interface EPK {
  id: string;
  kod: string;
  kurumAdi: string;
  aciklama: string;
  aktif: boolean;
}

interface OK {
  id: string;
  kod: string;
  kurumAdi: string;
  aciklama: string;
  aktif: boolean;
}

interface SalesRepresentative {
  id: string;
  adSoyad: string;
  aktif: boolean;
}

interface SuspensionReason {
  id: string;
  reason: string;
  aciklama: string;
  aktif: boolean;
  olusturmaTarihi: string;
}

interface CustomerModuleProps {
  mccList?: Array<{ kod: string; kategori: string }>;
  customers?: Customer[];
  onCustomersChange?: (customers: Customer[]) => void;
  payterProducts?: any[];
  bankPFRecords?: any[];
  onBankPFNavigate?: (id: string) => void;
  banks?: Bank[];
  epkList?: EPK[];
  okList?: OK[];
  salesReps?: SalesRepresentative[];
  suspensionReasons?: SuspensionReason[];
}

// PERFORMANCE: React.memo prevents unnecessary re-renders when props haven't changed
export const CustomerModule = React.memo(function CustomerModule({ 
  mccList = [],
  customers = [],
  onCustomersChange,
  payterProducts = [],
  bankPFRecords = [],
  onBankPFNavigate,
  banks = [],
  epkList = [],
  okList = [],
  salesReps = [],
  suspensionReasons = []
}: CustomerModuleProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // useCallback ile memoize edilmiş navigation handler
  const handleNavigateToCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
  }, []);

  const checkDuplicate = (customer: Customer, excludeId?: string): string | null => {
    // Cari Hesap Kodu kontrolü
    const duplicateByCode = customers.find(
      (c) => c.id !== excludeId && c.cariHesapKodu.toLowerCase() === customer.cariHesapKodu.toLowerCase()
    );
    if (duplicateByCode) {
      return `Bu Cari Hesap Kodu (${customer.cariHesapKodu}) zaten kayıtlı!`;
    }

    // Vergi No kontrolü (boş değilse)
    if (customer.vergiNo && customer.vergiNo.trim() !== '') {
      const duplicateByTaxNo = customers.find(
        (c) => c.id !== excludeId && c.vergiNo && c.vergiNo === customer.vergiNo
      );
      if (duplicateByTaxNo) {
        return `Bu Vergi No (${customer.vergiNo}) zaten kayıtlı! (${duplicateByTaxNo.cariAdi})`;
      }
    }

    // Email kontrolü (boş değilse)
    if (customer.email && customer.email.trim() !== '') {
      const duplicateByEmail = customers.find(
        (c) => c.id !== excludeId && c.email && c.email.toLowerCase() === customer.email.toLowerCase()
      );
      if (duplicateByEmail) {
        return `Bu Email (${customer.email}) zaten kayıtlı! (${duplicateByEmail.cariAdi})`;
      }
    }

    return null;
  };

  const handleUpdateCustomer = (customer: Customer) => {
    const updatedCustomers = customers.map((c) => (c.id === customer.id ? customer : c));
    onCustomersChange?.(updatedCustomers);
  };

  const handleSaveCustomer = async (customer: Customer, options?: { autoSave?: boolean }) => {
    const duplicateError = checkDuplicate(customer, isCreating ? undefined : customer.id);
    
    if (duplicateError) {
      toast.error(duplicateError);
      return;
    }

    if (isCreating) {
      const newCustomers = [...customers, { ...customer, id: Date.now().toString() }];
      onCustomersChange?.(newCustomers);
      setIsCreating(false);
      toast.success('Müşteri başarıyla eklendi');
      
      // ✅ INSTANT SUPABASE SYNC: Yeni müşteri
      try {
        await customerApi.upsert([{ ...customer, id: Date.now().toString() }]);
        console.log('✅ New customer instantly synced to Supabase');
      } catch (error) {
        console.error('❌ Customer instant sync error:', error);
      }
    } else {
      const updatedCustomers = customers.map((c) => (c.id === customer.id ? customer : c));
      onCustomersChange?.(updatedCustomers);
      
      // ✅ INSTANT SUPABASE SYNC: Müşteri güncelleme (banka atamaları dahil)
      try {
        await customerApi.upsert([customer]);
        console.log('✅ Customer update instantly synced to Supabase (including bank assignments)');
      } catch (error) {
        console.error('❌ Customer update instant sync error:', error);
      }
      
      // Otomatik kayıt durumunda sayfadan atma
      if (!options?.autoSave) {
        setSelectedCustomer(null);
        toast.success('Müşteri başarıyla güncellendi');
      }
    }
  };

  const handleImportCustomers = async (importedCustomers: Customer[]) => {
    console.log('\n🔄 CustomerModule - Import İşlemi Başlıyor...');
    console.log(`📊 Excel'den gelen kayıt sayısı: ${importedCustomers.length}`);
    console.log(`📊 Sistemdeki mevcut kayıt sayısı: ${customers.length}`);
    
    try {
      // ✅ SUPABASE'E KAYDET
      toast.info('📤 Veriler Supabase\'e kaydediliyor...');
      
      const response = await customerApi.create(importedCustomers);
      
      if (!response.success) {
        throw new Error(response.error || 'Supabase kaydetme hatası');
      }
      
      console.log(`✅ ${response.count} müşteri Supabase'e kaydedildi`);
      
      // ✅ LOCAL STATE'İ GÜNCELLEdocument (Backward compatibility)
      const updatedCustomers = [...customers, ...importedCustomers];
      onCustomersChange?.(updatedCustomers);
      
      toast.success(
        `✅ ${response.count} müşteri başarıyla kaydedildi!\n🌐 Supabase'e yüklendi\n📊 Toplam: ${updatedCustomers.length}`,
        { duration: 5000 }
      );
    } catch (error: any) {
      console.error('❌ Supabase import hatası:', error);
      toast.error(
        `❌ Import Hatası!\n${error.message}\n\nLütfen bağlantınızı kontrol edin.`,
        { duration: 7000 }
      );
      
      // Fallback: Local'e kaydet
      console.log('⚠️ Fallback: Local storage\'a kaydediliyor...');
      const updatedCustomers = [...customers, ...importedCustomers];
      onCustomersChange?.(updatedCustomers);
      toast.info(`⚠️ Offline mode: ${importedCustomers.length} müşteri local'e kaydedildi`);
    }
  };

  // REMOVED OLD DUPLICATE LOGIC - Now handled directly by Supabase
  const handleImportCustomers_OLD_BACKUP = (importedCustomers: Customer[]) => {
    // Excel içi duplicate kontrol
    const seenInFile = new Set<string>();
    const excelDuplicates: string[] = [];
    
    importedCustomers.forEach((customer, index) => {
      const lowerCode = customer.cariHesapKodu.toLowerCase();
      if (seenInFile.has(lowerCode)) {
        excelDuplicates.push(`Satır ${index + 2}: Excel içinde tekrar eden Cari Hesap Kodu: ${customer.cariHesapKodu}`);
      }
      seenInFile.add(lowerCode);
    });

    // Excel içi duplicate varsa hemen çık
    if (excelDuplicates.length > 0) {
      toast.error(
        `Excel dosyasında ${excelDuplicates.length} adet duplicate kayıt bulundu! Lütfen Excel'i düzeltin.`,
        { duration: 5000 }
      );
      console.error('❌ Excel İçi Duplicate Kayıtlar:', excelDuplicates);
      return;
    }

    // Mevcut kayıtlarla karşılaştırma
    const newCustomers: Customer[] = [];
    const duplicateCustomers: { imported: Customer; existing: Customer }[] = [];

    importedCustomers.forEach((customer) => {
      const existing = customers.find(
        (c) => c.cariHesapKodu.toLowerCase() === customer.cariHesapKodu.toLowerCase()
      );
      
      if (existing) {
        duplicateCustomers.push({ imported: customer, existing });
      } else {
        newCustomers.push(customer);
      }
    });

    // Eğer duplicate yoksa, direkt ekle
    if (duplicateCustomers.length === 0) {
      if (newCustomers.length > 0) {
        const updatedCustomers = [...customers, ...newCustomers];
        onCustomersChange?.(updatedCustomers);
        toast.success(`✅ ${newCustomers.length} yeni müşteri başarıyla eklendi\n📊 Toplam müşteri sayısı: ${updatedCustomers.length}`);
      } else {
        toast.info('Eklenecek yeni kayıt bulunamadı');
      }
      return;
    }

    // Duplicate var - Kullanıcıya sor
    const message = `
📊 Import Özeti:
• ${newCustomers.length} adet yeni kayıt
• ${duplicateCustomers.length} adet mevcut kayıt (duplicate)

Mevcut kayıtları güncellemek ister misiniz?

✅ EVET = Mevcut kayıtlar güncellenecek + Yeni kayıtlar eklenecek
❌ HAYIR = Sadece yeni kayıtlar eklenecek (Mevcut kayıtlar korunacak)
    `.trim();

    if (confirm(message)) {
      // Mevcut kayıtları güncelle + Yeni kayıtları ekle
      const updatedCustomers = customers.map((existing) => {
        const duplicate = duplicateCustomers.find(
          (d) => d.existing.id === existing.id
        );
        return duplicate ? { ...duplicate.imported, id: existing.id } : existing;
      });
      
      // Yeni kayıtları ekle
      const finalCustomers = [...updatedCustomers, ...newCustomers];
      onCustomersChange?.(finalCustomers);
      
      toast.success(
        `✅ Import tamamlandı!\n${duplicateCustomers.length} kayıt güncellendi\n${newCustomers.length} yeni kayıt eklendi`,
        { duration: 5000 }
      );
      console.log('✅ Import Özeti:', {
        guncellenen: duplicateCustomers.length,
        yeniEklenen: newCustomers.length,
        toplam: finalCustomers.length
      });
    } else {
      // Sadece yeni kayıtları ekle
      if (newCustomers.length > 0) {
        const finalCustomers = [...customers, ...newCustomers];
        onCustomersChange?.(finalCustomers);
        toast.success(
          `✅ ${newCustomers.length} yeni müşteri eklendi\n${duplicateCustomers.length} mevcut kayıt atlandı`,
          { duration: 5000 }
        );
        console.log('ℹ️ Atlanan Kayitlar:', duplicateCustomers.map(d => d.existing.cariHesapKodu));
      } else {
        toast.info('Sadece mevcut kayıtlar vardı - Hiçbir değişiklik yapılmadı');
      }
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    // ✅ Delete from Supabase
    const result = await customerApi.delete(id);
    
    if (result.success) {
      // ✅ Update local state
      const filteredCustomers = customers.filter((c) => c.id !== id);
      onCustomersChange?.(filteredCustomers);
      setSelectedCustomer(null);
      toast.success('Müşteri başarıyla silindi');
      console.log(`✅ Customer ${id} deleted successfully`);
    } else {
      console.error(`❌ Failed to delete customer:`, result.error);
      toast.error(`Silme işlemi başarısız: ${result.error}`);
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedCustomer({
      id: '',
      cariHesapKodu: '',
      mcc: '',
      cariAdi: '',
      guncelMyPayterDomain: '',
      vergiDairesi: '',
      vergiNo: '',
      adres: '',
      ilce: '',
      postaKodu: '',
      email: '',
      yetkili: '',
      tel: '',
      durum: 'Aktif',
    });
  };

  // Removed: SİPAY Domain Eşleştirme
  const handleSipayDomainMatching_REMOVED_OLD = () => {
    const sipayDomains = [
      'AKANMAR', 'ALIARI', 'ALKANN', 'ANKROTMT', 'ARESOTM', 'ARTVINOTMT',
      'ASPOWER', 'AYSGDA', 'BACKTOFIT', 'BILVEND', 'BOSOTOMATSIPAY', 'CANTINA',
      'CASTRUM', 'CDAGOTMT', 'CEMALOGLU', 'CYBORG', 'EATBOX', 'EFEVENDING',
      'ENSOTOMAT', 'FELECE', 'GENCAY', 'GITESMAK', 'GLOBALTRUST', 'GNCAIRPORTHOTEL',
      'GYMFIT', 'H2OGYM', 'HAPPYSCOFFEE', 'HKABAL', 'HUVEN', 'INTEGRAL',
      'KARADAGOTEL', 'KASREVIMARKET', 'KAYAT', 'KAYAYEMEKCILIK', 'KESKINOGLU',
      'KIRTURTRZM', 'KOCAK', 'MEGWASH', 'MEHMETETEMGURBUZ', 'METEDOGER',
      'MGMVEND', 'MIMARSINANUNI', 'MOODY', 'MQHOTELS', 'MYMADEN', 'OKYANUSFLYSPM',
      'ONGUN', 'ORERIS', 'ORSAYPTR', 'ORVEND', 'OTMEXPRESS', 'OTMT360',
      'OZDEMIR', 'OZGUOTMT', 'OZTURK', 'RIZEOTMT', 'ROBOWASH', 'SIPAYAKTIFTECH',
      'SIPAYTEST', 'SUPEROTOMAT', 'TAFEKS', 'TINTCAFE', 'TRABZONORMN', 'TURKUAZ',
      'UNIVEND', 'VENTEK', 'VITAVIEN', 'YUCELM', 'ZEUSGYM'
    ];

    // EPK004 SİPAY bilgilerini bul
    const sipayEPK = epkList.find(epk => epk.kod === 'EPK004');
    
    if (!sipayEPK) {
      toast.error('EPK004 SİPAY tanımı bulunamadı! Lütfen önce Tanımlar > EPK listesinden EPK004 SİPAY kaydını ekleyin.');
      return;
    }

    console.log('🔄 SİPAY domain eşleştirme başlatılıyor...');
    console.log('📋 Toplam domain sayısı:', sipayDomains.length);
    console.log('👥 Toplam müşteri sayısı:', customers.length);

    let matchedCount = 0;
    let updatedCount = 0;
    let alreadyAssignedCount = 0;
    const matchedCustomers: string[] = [];
    const notMatchedDomains: string[] = [];

    // Her domain için müşteri ara
    sipayDomains.forEach(domain => {
      const normalizedDomain = domain.toLowerCase();
      
      // Ana domain veya domain hiyerarşisinde bu domaini içeren müşteriyi ara
      const matchingCustomer = customers.find(customer => {
        // Ana domain kontrolü
        if (customer.guncelMyPayterDomain) {
          const mainDomain = customer.guncelMyPayterDomain.toLowerCase();
          if (mainDomain.includes(normalizedDomain)) {
            return true;
          }
        }
        
        // Domain hiyerarşisinde ara (recursive)
        const searchInHierarchy = (nodes: DomainNode[]): boolean => {
          for (const node of nodes) {
            if (node.name.toLowerCase().includes(normalizedDomain)) {
              return true;
            }
            if (node.children && node.children.length > 0) {
              if (searchInHierarchy(node.children)) {
                return true;
              }
            }
          }
          return false;
        };
        
        if (customer.domainHierarchy && customer.domainHierarchy.length > 0) {
          return searchInHierarchy(customer.domainHierarchy);
        }
        
        return false;
      });

      if (matchingCustomer) {
        matchedCount++;
        matchedCustomers.push(`${domain} → ${matchingCustomer.cariAdi}`);
        
        // EPK004 SİPAY kategorisinin zaten ekli olup olmadığını kontrol et
        const sipayAssignmentId = `ok-epk-${sipayEPK.id}`;
        const existingAssignment = matchingCustomer.bankDeviceAssignments?.find(
          a => a.bankId === sipayAssignmentId
        );

        if (existingAssignment) {
          alreadyAssignedCount++;
          console.log(`  ✓ ${matchingCustomer.cariAdi} - EPK004 SİPAY zaten atanmış`);
        } else {
          // Yeni assignment ekle
          if (!matchingCustomer.bankDeviceAssignments) {
            matchingCustomer.bankDeviceAssignments = [];
          }

          const newAssignment: BankDeviceAssignment = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            bankId: sipayAssignmentId,
            bankName: sipayEPK.kurumAdi,
            bankCode: sipayEPK.kod,
            deviceIds: [],
            createdAt: new Date().toISOString(),
          };

          matchingCustomer.bankDeviceAssignments.push(newAssignment);
          updatedCount++;
          console.log(`  ✅ ${matchingCustomer.cariAdi} - EPK004 SİPAY kategorisi eklendi`);
        }
      } else {
        notMatchedDomains.push(domain);
      }
    });

    // Değişiklikleri kaydet
    if (updatedCount > 0 || alreadyAssignedCount > 0) {
      onCustomersChange?.([...customers]);
    }

    // Sonuçları raporla
    console.log('\n📊 SİPAY Domain Eşleştirme Sonuçları:');
    console.log('✅ Toplam eşleşme:', matchedCount);
    console.log('���� Yeni kategori ataması:', updatedCount);
    console.log('♻️ Zaten atanmış:', alreadyAssignedCount);
    console.log('❌ Eşleşmeyen domain:', notMatchedDomains.length);

    if (matchedCustomers.length > 0) {
      console.log('\n📋 Eşleşen Müşteriler:');
      matchedCustomers.forEach(match => console.log(`  ${match}`));
    }

    if (notMatchedDomains.length > 0) {
      console.log('\n⚠️ Eşleşmeyen Domainler:', notMatchedDomains.join(', '));
    }

    // Kullanıcıya bilgi ver
    const message = `✅ SİPAY Domain Eşleştirme Tamamlandı!

📊 Sonuçlar:
• ${matchedCount} domain eşleşti
• ${updatedCount} yeni EPK004 SİPAY kategorisi eklendi
• ${alreadyAssignedCount} müşteride zaten kayıtlı
• ${notMatchedDomains.length} domain eşleşmedi

${updatedCount > 0 ? '\n✓ Değişiklikler kaydedildi' : ''}
${notMatchedDomains.length > 0 ? `\n⚠️ Eşleşmeyen domainler konsola yazdırıldı` : ''}`;

    if (matchedCount > 0) {
      toast.success(message, { duration: 8000 });
    } else {
      toast.warning('Hiçbir domain eşleşmedi! Lütfen müşteri ana domainlerini kontrol edin.', { duration: 6000 });
    }
  };

  // Removed: Otomatik eşleştirme
  const handleSaveAutoMatchedBankPF_REMOVED_OLD = () => {
    if (!bankPFRecords || bankPFRecords.length === 0) {
      toast.error('Banka/PF kaydı bulunamadı! Önce Banka/PF modülünden kayıt ekleyin.');
      return;
    }

    if (!customers || customers.length === 0) {
      toast.error('Müşteri kaydı bulunamadı! Önce müşteri ekleyin.');
      return;
    }

    console.log('🔄 Otomatik eşleştirme kaydı başlatılıyor...');
    console.log('👥 Toplam müşteri:', customers.length);
    console.log('🏦 Toplam Banka/PF kaydı:', bankPFRecords.length);

    let updatedCount = 0;
    let alreadyLinkedCount = 0;
    let totalAutoMatchedCount = 0;

    const updatedCustomers = customers.map(customer => {
      // Otomatik eşleştirilen Banka/PF kayıtlarını bul
      const normalizedCariAdi = customer.cariAdi.trim().toLowerCase();
      const autoMatchedBankPFIds = bankPFRecords
        .filter((record: any) => {
          const normalizedFirmaUnvan = record.firmaUnvan.trim().toLowerCase();
          return normalizedCariAdi === normalizedFirmaUnvan;
        })
        .map((record: any) => record.id);

      if (autoMatchedBankPFIds.length === 0) {
        // Otomatik eşleşme yok, değiştirme
        return customer;
      }

      totalAutoMatchedCount++;

      // Mevcut linkedBankPFIds ile birleştir
      const existingIds = customer.linkedBankPFIds || [];
      const newIds = autoMatchedBankPFIds.filter(id => !existingIds.includes(id));

      if (newIds.length === 0) {
        // Zaten kayıtlı
        alreadyLinkedCount++;
        console.log(`  ♻️  ${customer.cariAdi} - Zaten kayıtlı (${autoMatchedBankPFIds.length} eşleşme)`);
        return customer;
      }

      // Yeni ID'leri ekle
      updatedCount++;
      const allLinkedIds = [...existingIds, ...newIds];

      console.log(`  ✅ ${customer.cariAdi} → ${newIds.length} yeni Banka/PF eklendi`);

      return {
        ...customer,
        linkedBankPFIds: allLinkedIds
      };
    });

    // Güncellenmiş müşteri listesini kaydet
    if (onCustomersChange && updatedCount > 0) {
      onCustomersChange(updatedCustomers);
    }

    // Sonuç mesajı
    let message = '';
    if (updatedCount > 0) {
      message = `✅ ${updatedCount} müşterinin otomatik eşleştirmeleri linkedBankPFIds'e eklendi!`;
      if (alreadyLinkedCount > 0) {
        message += `\\n\\n✓ ${alreadyLinkedCount} müşteride zaten kayıtlıydı`;
      }
      toast.success(message, { duration: 5000 });
    } else {
      toast.info('Tüm otomatik eşleştirmeler zaten linkedBankPFIds\'de kayıtlı', { duration: 4000 });
    }

    console.log('\\n📊 Otomatik eşleştirme sonuçları:', {
      toplamOtomatikEslesen: totalAutoMatchedCount,
      yeniKaydedilen: updatedCount,
      zarenKayitli: alreadyLinkedCount
    });
  };

  if (selectedCustomer || isCreating) {
    console.log('🔍 [CustomerModule] Rendering CustomerDetail with mccList:', {
      mccListLength: mccList.length,
      sampleMCC: mccList.slice(0, 5),
      isCreating,
      customerId: selectedCustomer?.id
    });
    
    return (
      <CustomerDetail
        customer={selectedCustomer}
        onSave={handleSaveCustomer}
        onCancel={() => {
          setSelectedCustomer(null);
          setIsCreating(false);
        }}
        onDelete={handleDeleteCustomer}
        isCreating={isCreating}
        mccList={mccList}
        payterProducts={payterProducts}
        bankPFRecords={bankPFRecords}
        onBankPFNavigate={onBankPFNavigate}
        banks={banks}
        epkList={epkList}
        okList={okList}
        salesReps={salesReps}
        suspensionReasons={suspensionReasons}
        allCustomers={customers}
        onNavigateToCustomer={handleNavigateToCustomer}
      />
    );
  }

  // Domain Hiyerarşisi Excel'den yükleme fonksiyonu
  // Müşteri adı normalizasyon fonksiyonu - eşleştirme için
  const normalizeCustomerName = (name: string): string => {
    if (!name) return '';
    
    return name
      .trim()
      .toUpperCase()
      .replace(/\s+/g, ' ') // Birden fazla boşluğu tek boşluğa indir
      // Türkçe karakterleri normalize et (hem büyük hem küçük)
      .replace(/İ/g, 'I')
      .replace(/I/g, 'I')
      .replace(/ı/g, 'I')
      .replace(/Ş/g, 'S')
      .replace(/ş/g, 'S')
      .replace(/Ğ/g, 'G')
      .replace(/ğ/g, 'G')
      .replace(/Ü/g, 'U')
      .replace(/ü/g, 'U')
      .replace(/Ö/g, 'O')
      .replace(/ö/g, 'O')
      .replace(/Ç/g, 'C')
      .replace(/ç/g, 'C')
      // Yaygın kısaltmaları normalize et (noktasız hale getir) - SIRALAMAYA DİKKAT!
      // Önce Türkçe karakterli versiyonları değiştir
      .replace(/T\.C\.?\s*/g, 'TC')  // T.C veya T.C. → TC
      .replace(/A\.Ş\.?\s*/g, 'AS')  // A.Ş. → AS
      .replace(/A\.S\.?\s*/g, 'AS')  // A.S. → AS
      .replace(/LTD\.?\s*ŞTİ\.?\s*/gi, 'LTDSTI') // LTD. ŞTİ. → LTDSTI
      .replace(/LTD\.?\s*STI\.?\s*/gi, 'LTDSTI') // LTD. STI. → LTDSTI
      .replace(/SAN\.?\s*VE\s*TİC\.?\s*/gi, 'SANVETIC') // SAN. VE TİC. → SANVETIC
      .replace(/SAN\.?\s*VE\s*TIC\.?\s*/gi, 'SANVETIC') // SAN. VE TIC. → SANVETIC
      .replace(/İTH\.?\s*İHR\.?\s*/gi, 'ITHIHR') // İTH. İHR. → ITHIHR
      .replace(/ITH\.?\s*IHR\.?\s*/gi, 'ITHIHR') // ITH. IHR. → ITHIHR
      .replace(/İNS\.?\s*/gi, 'INS') // İNS. → INS
      .replace(/INS\.?\s*/gi, 'INS') // INS. → INS
      .replace(/GENEL\s*MÜDÜRLÜĞÜ/gi, 'GENELMUDURLUGU') // GENEL MÜDÜRLÜĞÜ → GENELMUDURLUGU
      .replace(/GENEL\s*MUDURLUGU/gi, 'GENELMUDURLUGU') // GENEL MUDURLUGU → GENELMUDURLUGU
      // Özel karakterleri ve noktalama işaretlerini tamamen sil
      .replace(/[.,\-_()]/g, '')
      .replace(/\s+/g, '') // Tüm boşlukları tamamen kaldır
      .trim();
  };

  // Levenshtein distance ile benzerlik hesaplama
  const calculateSimilarity = (str1: string, str2: string): number => {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : 1 - distance / maxLen;
  };

  const handleDomainImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          toast.error('❌ Excel dosyası boş!');
          return;
        }
        
        // Müşteri bazlı domain verilerini grupla
        // Her satır bir domain hiyerarşi yolu temsil eder
        // Aynı müşteriye ait birden fazla satır olabilir (farklı domain yolları)
        const customerDomainMap = new Map<string, { 
          originalName: string;
          anaDomain: string; 
          paths: string[][] 
        }>();
        
        console.log('📊 Excel verisi okunuyor...', { toplamSatır: jsonData.length });
        
        // İstatistik için sayaçlar
        let skippedEmptyRows = 0;
        let skippedNoDomainRows = 0;
        let skippedPlaceholderRows = 0;
        
        jsonData.forEach((row: any, index: number) => {
          const cariAdi = row['Cari Adı']?.trim();
          const anaDomain = row['Ana Domain']?.trim();
          
          if (!cariAdi) {
            skippedEmptyRows++;
            return;
          }
          
          // "X CARİ KAYDI OLMAYAN MÜŞTERİLER" gibi placeholder kayıtları filtrele
          if (cariAdi.startsWith('X CARİ KAYDI OLMAYAN') || cariAdi.startsWith('X CARI KAYDI OLMAYAN')) {
            skippedPlaceholderRows++;
            return;
          }
          
          // Domain hiyerarşi yolunu oluştur (1.Alt → 2.Alt → 3.Alt → 4.Alt → 5.Alt)
          const domainPath = [
            row['1.Alt'],
            row['2.Alt'],
            row['3.Alt'],
            row['4.Alt'],
            row['5.Alt']
          ].filter(Boolean).map((v: string) => v.trim());
          
          if (domainPath.length === 0 && !anaDomain) {
            skippedNoDomainRows++;
            return;
          }
          
          // Normalize key kullan (eşleştirme için)
          const normalizedKey = normalizeCustomerName(cariAdi);
          
          // Müşteri ilk kez görülüyorsa Map'e ekle
          if (!customerDomainMap.has(normalizedKey)) {
            customerDomainMap.set(normalizedKey, { 
              originalName: cariAdi,
              anaDomain: anaDomain || '', 
              paths: [] 
            });
            console.log(`✅ Yeni müşteri tespit edildi: ${cariAdi} (key: ${normalizedKey})`);
          }
          
          const customerData = customerDomainMap.get(normalizedKey)!;
          if (anaDomain) customerData.anaDomain = anaDomain;
          if (domainPath.length > 0) {
            customerData.paths.push(domainPath);
            console.log(`  📁 ${cariAdi} için domain yolu: ${domainPath.join(' → ')}`);
          }
        });
        
        // İstatistik özeti
        console.log('\\n📋 İçe Aktarma Özeti:');
        console.log(`  ✅ İşlenen satır: ${jsonData.length}`);
        if (skippedEmptyRows > 0) {
          console.log(`  ⏭️  Boş satır atlandı: ${skippedEmptyRows}`);
        }
        if (skippedPlaceholderRows > 0) {
          console.log(`  ⏭️  Placeholder kayıt atlandı: ${skippedPlaceholderRows}`);
        }
        if (skippedNoDomainRows > 0) {
          console.log(`  ℹ️  Domain bilgisi olmayan kayıt: ${skippedNoDomainRows} (atlandı)`);
        }
        
        console.log(`\n📦 Toplam ${customerDomainMap.size} farklı müşteri için domain verisi bulundu`);
        
        // Müşteri normalleştirme map'i oluştur (sistemdeki müşteriler için)
        const customerNormalizedMap = new Map<string, Customer>();
        // ✅ NULL SAFETY: customers boş olabilir
        (customers || []).forEach(customer => {
          const normalizedName = normalizeCustomerName(customer.cariAdi);
          customerNormalizedMap.set(normalizedName, customer);
        });
        
        // Müşterileri güncelle
        let updatedCount = 0;
        let notFoundCount = 0;
        const notFoundCustomers: { excel: string; suggestions: string[] }[] = [];
        
        console.log('\n🔄 Müşteri kayıtları güncelleniyor...\n');
        
        // Normalize edilmiş anahtarlarla eşleştirme yap
        const updatedCustomersMap = new Map<string, Customer>();
        
        customerDomainMap.forEach((domainData, normalizedKey) => {
          const customer = customerNormalizedMap.get(normalizedKey);
          
          if (customer) {
            console.log(`🔹 ${customer.cariAdi} için domain hiyerarşisi oluşturuluyor...`);
            console.log(`  📍 Excel'de: ${domainData.originalName}`);
            console.log(`  📍 Sistemde: ${customer.cariAdi}`);
            console.log(`  📍 Normalize Key: ${normalizedKey}`);
            console.log(`  📍 Ana Domain: ${domainData.anaDomain || '(yok)'}`);
            console.log(`  📊 Toplam ${domainData.paths.length} farklı domain yolu`);
            
            // Bu müşteri için domain hiyerarşisi oluştur
            const hierarchy = parseDomainHierarchyFromPaths(domainData.paths);
            updatedCount++;
            
            console.log(`  ✅ ${customer.cariAdi} güncellendi (${hierarchy.length} kök domain)\n`);
            
            updatedCustomersMap.set(customer.id, {
              ...customer,
              guncelMyPayterDomain: domainData.anaDomain || customer.guncelMyPayterDomain,
              domainHierarchy: hierarchy
            });
          } else {
            // Müşteri bulunamadı - debug bilgileri
            console.warn(`⚠️ Müşteri bulunamadı: ${domainData.originalName}`);
            console.warn(`   Excel'deki ORIJINAL: "${domainData.originalName}"`);
            console.warn(`   Excel'deki NORMALIZE KEY: "${normalizedKey}"`);
            console.warn(`   Sistemdeki normalize keyler (ilk 10):`);
            Array.from(customerNormalizedMap.keys()).slice(0, 10).forEach((key, idx) => {
              const originalCustomer = customers.find(c => normalizeCustomerName(c.cariAdi) === key);
              console.warn(`     ${idx+1}. "${key}" (orijinal: "${originalCustomer?.cariAdi || 'BULUNAMADI'}")`);
            });
            
            // Benzer isimleri bul
            notFoundCount++;
            
            // Özel kontrol: "ZIRAAT" içeren müşteriler var mı?
            if (normalizedKey.includes('ZIRAAT')) {
              console.warn(`   🔍 Excel'de "ZIRAAT" kelimesi var, sistemdeki "ZIRAAT" içeren müşteriler:`);
              const ziraatCustomers = customers.filter(c => 
                normalizeCustomerName(c.cariAdi).includes('ZIRAAT')
              );
              if (ziraatCustomers.length > 0) {
                ziraatCustomers.forEach(c => {
                  console.warn(`     - Orijinal: "${c.cariAdi}"`);
                  console.warn(`       Normalize: "${normalizeCustomerName(c.cariAdi)}"`);
                });
              } else {
                console.warn(`     ❌ Sistemde hiç "ZIRAAT" içeren müşteri yok!`);
              }
            }
            
            const similarities = customers
              .map(c => ({
                name: c.cariAdi,
                normalizedName: normalizeCustomerName(c.cariAdi),
                similarity: calculateSimilarity(normalizedKey, normalizeCustomerName(c.cariAdi))
              }))
              .filter(s => s.similarity > 0.3)
              .sort((a, b) => b.similarity - a.similarity)
              .slice(0, 5);
            
            const suggestions = similarities.slice(0, 3).map(s => s.name);
            
            notFoundCustomers.push({
              excel: domainData.originalName,
              suggestions
            });
            
            if (similarities.length > 0) {
              console.warn(`   En benzer 3 isim (benzerlik skoru ile):`);
              similarities.slice(0, 3).forEach(s => {
                console.warn(`     - ${s.name} (skor: ${s.similarity.toFixed(2)}, normalize: ${s.normalizedName})`);
              });
            } else {
              console.warn(`   Hiç benzer isim bulunamadı (eşik: 0.3)`);
            }
          }
        });
        
        // Güncellenmiş müşterileri birleştir
        const updatedCustomers = customers.map(customer => 
          updatedCustomersMap.get(customer.id) || customer
        );
        
        // Güncellemeyi uygula
        onCustomersChange?.(updatedCustomers);
        
        // Sonuç bildirimi  
        if (notFoundCount > 0) {
          console.warn('⚠️ Sistemde bulunamayan müşteriler:', notFoundCustomers);
          
          const errorParts: string[] = [];
          errorParts.push(`⚠️ ${updatedCount} müşteri güncellendi`);
          errorParts.push('');
          errorParts.push(`❌ ${notFoundCount} müşteri bulunamadı:`);
          errorParts.push('');
          
          notFoundCustomers.slice(0, 3).forEach(({ excel, suggestions }) => {
            errorParts.push(`📌 Excel: "${excel}"`);
            if (suggestions.length > 0) {
              errorParts.push(`   💡 Benzer: ${suggestions.slice(0, 2).join(', ')}`);
            } else {
              errorParts.push(`   ⚠️ Sistemde benzer isim yok`);
            }
            errorParts.push('');
          });
          
          if (notFoundCount > 3) {
            errorParts.push(`... ve ${notFoundCount - 3} müşteri daha`);
            errorParts.push('');
          }
          
          errorParts.push('💡 İpucu: Cari adlarını sistemdekiyle AYNI yazın');
          errorParts.push('(Büyük/küçük harf ve boşluklar önemsiz)');
          
          // Hata mesajını göster
          
          toast.warning(errorParts.join('\n'), { duration: 12000 });
        } else {
          // Tüm müşteriler başarıyla bulundu
          toast.success(
            `✅ Domain hiyerarşisi başarıyla yüklendi!\n\n${updatedCount} müşteri güncellendi\n${jsonData.length} satır işlendi`,
            { duration: 5000 }
          );
        }
        
        console.log('✅ Domain import tamamlandı:', {
          güncellenen: updatedCount,
          bulunamayan: notFoundCount,
          toplamSatır: jsonData.length
        });
        
      } catch (error) {
        console.error('❌ Excel import hatası:', error);
        toast.error(
          `❌ Hata!\n${error instanceof Error ? error.message : 'Bilinmeyen hata'}\n\nLütfen şablon dosyasını kullandığınızdan emin olun.`,
          { duration: 8000 }
        );
      }
    };
    input.click();
  };
  
  // Domain hiyerarşisi oluşturma - Path listesinden ağaç yapısı oluştur
  // ÖRNEK:
  // paths = [
  //   ['İSTANBUL', 'İSTHASTANE', 'FLORYA'],
  //   ['İSTANBUL', 'ÇANKAYA'],
  //   ['ANKARA']
  // ]
  // SONUÇ:
  // İSTANBUL
  //   ├─ İSTHASTANE
  //   │   └─ FLORYA
  //   └─ ÇANKAYA
  // ANKARA
  const parseDomainHierarchyFromPaths = (paths: string[][]): DomainNode[] => {
    const hierarchy: DomainNode[] = [];
    let nodeIdCounter = 1;
    
    console.log(`  🌳 Domain ağacı oluşturuluyor... (${paths.length} farklı yol)`);
    
    paths.forEach((path, pathIndex) => {
      let currentLevel = hierarchy;
      let pathDescription = '';
      
      path.forEach((levelName, levelIndex) => {
        if (!levelName) return;
        
        pathDescription += (levelIndex > 0 ? ' → ' : '') + levelName;
        
        // Bu seviyede aynı isimde node var mı kontrol et
        let existingNode = currentLevel.find(n => n.name === levelName);
        
        if (!existingNode) {
          // Yeni node oluştur
          existingNode = {
            id: `domain-${nodeIdCounter++}`,
            name: levelName,
            children: []
          };
          currentLevel.push(existingNode);
          console.log(`    ✨ Yeni node: ${'  '.repeat(levelIndex)}${levelName} (Seviye ${levelIndex + 1})`);
        } else {
          console.log(`    ♻️  Mevcut: ${'  '.repeat(levelIndex)}${levelName} (Seviye ${levelIndex + 1})`);
        }
        
        // Bir sonraki seviye için currentLevel'ı güncelle
        currentLevel = existingNode.children;
      });
      
      console.log(`  📍 Yol ${pathIndex + 1}: ${pathDescription}`);
    });
    
    console.log(`  ✅ Domain ağacı oluşturuldu: ${hierarchy.length} kök node\n`);
    
    return hierarchy;
  };

  // Müşterinin domain bazlı cihaz sayısını hesapla
  const getCustomerDeviceCount = (customer: Customer): number => {
    if (!payterProducts || payterProducts.length === 0) {
      return 0;
    }
    
    const customerDomains: string[] = [];
    
    // Ana domain ekle
    if (customer.guncelMyPayterDomain && customer.guncelMyPayterDomain.trim()) {
      customerDomains.push(customer.guncelMyPayterDomain.trim().toLowerCase());
    }
    
    // Domain hiyerarşisinden tüm domain'leri topla (recursive)
    const collectFromHierarchy = (nodes: DomainNode[]) => {
      nodes.forEach(node => {
        if (node.name && node.name.trim()) {
          customerDomains.push(node.name.trim().toLowerCase());
        }
        if (node.children && node.children.length > 0) {
          collectFromHierarchy(node.children);
        }
      });
    };
    
    if (customer.domainHierarchy && customer.domainHierarchy.length > 0) {
      collectFromHierarchy(customer.domainHierarchy);
    }
    
    if (customerDomains.length === 0) {
      return 0;
    }
    
    // Domain eşleşmesi olan ürünleri say
    const matchedCount = payterProducts.filter((product: any) => {
      if (!product.domain || !product.domain.trim()) {
        return false;
      }
      
      const productDomain = product.domain.trim().toLowerCase();
      return customerDomains.includes(productDomain);
    }).length;
    
    return matchedCount;
  };

  // Banka/PF şablonu indirme
  const handleDownloadBankPFTemplate = () => {
    try {
      
      // Tüm müşterilerin verileri ile şablon oluştur
      const templateData: any[] = [];
      
      if (customers.length > 0) {
        // ✅ NULL SAFETY: customers boş olabilir
        (customers || []).forEach(customer => {
          // Otomatik eşleşen veya manuel bağlı Banka/PF kayıtlarını bul
          const linkedRecords = bankPFRecords.filter(record => {
            // Manuel bağlantı kontrolü
            if (customer.linkedBankPFIds && customer.linkedBankPFIds.includes(record.id)) {
              return true;
            }
            // Otomatik eşleştirme (cari adı = firma ünvanı)
            const normalizedCariAdi = customer.cariAdi.trim().toLowerCase();
            const normalizedFirmaUnvan = record.firmaUnvan.trim().toLowerCase();
            return normalizedCariAdi === normalizedFirmaUnvan;
          });
          
          if (linkedRecords.length > 0) {
            // Her eşleşme için ayrı satır
            linkedRecords.forEach(record => {
              templateData.push({
                'Cari Adı': customer.cariAdi,
                'Ana Domain': customer.guncelMyPayterDomain || '',
                'Cihaz Adedi': getCustomerDeviceCount(customer),
                '1.Alt': '',
                '2.Alt': '',
                '3.Alt': '',
                '4.Alt': '',
                '5.Alt': '',
                'Banka/PF Firma Ünvanı': record.firmaUnvan,
                'Banka/PF ID': record.id,
                'Banka/PF Tipi': record.bankaOrPF,
                'ÖK Tipi': record.odemeKurulusuTipi || '-',
                'Durum': customer.durum
              });
            });
          } else {
            // Eşleşme yoksa boş satır
            templateData.push({
              'Cari Adı': customer.cariAdi,
              'Ana Domain': customer.guncelMyPayterDomain || '',
              'Cihaz Adedi': getCustomerDeviceCount(customer),
              '1.Alt': '',
              '2.Alt': '',
              '3.Alt': '',
              '4.Alt': '',
              '5.Alt': '',
              'Banka/PF Firma Ünvanı': '',
              'Banka/PF ID': '',
              'Banka/PF Tipi': '',
              'ÖK Tipi': '',
              'Durum': customer.durum
            });
          }
        });
      } else {
        // Hiç müşteri yoksa örnek veriler ekle
        templateData.push(
          {
            'Cari Adı': 'ABC Teknoloji A.Ş.',
            'Ana Domain': 'abc-teknoloji.mypayter.com',
            'Cihaz Adedi': 0,
            '1.Alt': 'İSTANBUL',
            '2.Alt': '',
            '3.Alt': '',
            '4.Alt': '',
            '5.Alt': '',
            'Banka/PF Firma Ünvanı': 'ABC Teknoloji A.Ş.',
            'Banka/PF ID': '1',
            'Banka/PF Tipi': 'PF',
            'ÖK Tipi': 'EPK',
            'Durum': 'Aktif'
          },
          {
            'Cari Adı': 'XYZ İnşaat Ltd. Şti.',
            'Ana Domain': 'xyz-insaat.mypayter.com',
            'Cihaz Adedi': 0,
            '1.Alt': '',
            '2.Alt': '',
            '3.Alt': '',
            '4.Alt': '',
            '5.Alt': '',
            'Banka/PF Firma Ünvanı': '',
            'Banka/PF ID': '',
            'Banka/PF Tipi': '',
            'ÖK Tipi': '',
            'Durum': 'Aktif'
          }
        );
      }
      
      // Excel workbook oluştur
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData);
      
      // Sütun genişliklerini ayarla
      ws['!cols'] = [
        { wch: 30 }, // Cari Adı
        { wch: 30 }, // Ana Domain
        { wch: 12 }, // Cihaz Adedi
        { wch: 18 }, // 1.Alt
        { wch: 18 }, // 2.Alt
        { wch: 18 }, // 3.Alt
        { wch: 18 }, // 4.Alt
        { wch: 18 }, // 5.Alt
        { wch: 35 }, // Banka/PF Firma Ünvanı
        { wch: 15 }, // Banka/PF ID
        { wch: 12 }, // Banka/PF Tipi
        { wch: 10 }, // ÖK Tipi
        { wch: 10 }  // Durum
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Banka-PF Eşleştirme');
      
      // Kullanım kılavuzu sayfası
      const instructionData = [
        { 'ALAN': '📋 BANKA/PF EŞLEŞTİRME ŞABLONU', 'AÇIKLAMA': '' },
        { 'ALAN': '', 'AÇIKLAMA': '' },
        { 'ALAN': '🎯 AMAÇ', 'AÇIKLAMA': 'Müşteriler ile Banka/PF kayıtlarını eşleştirme + Domain bilgileri' },
        { 'ALAN': '', 'AÇIKLAMA': '' },
        { 'ALAN': '📊 SÜTUNLAR', 'AÇIKLAMA': '' },
        { 'ALAN': 'Cari Adı', 'AÇIKLAMA': 'Müşteri cari kartı adı (DEĞİŞTİRMEYİN)' },
        { 'ALAN': 'Ana Domain', 'AÇIKLAMA': 'Müşterinin ana domain adresi (BİLGİ AMAÇLI)' },
        { 'ALAN': 'Cihaz Adedi', 'AÇIKLAMA': 'Payter sekmesindeki toplam cihaz sayısı (BİLGİ AMAÇLI)' },
        { 'ALAN': '1.Alt - 5.Alt', 'AÇIKLAMA': 'Domain hiyerarşisi seviyeleri (BİLGİ AMAÇLI)' },
        { 'ALAN': 'Banka/PF Firma Ünvanı', 'AÇIKLAMA': 'Banka/PF modülündeki firma ünvanı (MANUEL GİRİN)' },
        { 'ALAN': 'Banka/PF ID', 'AÇIKLAMA': 'Otomatik doldurulur (BİLGİ AMAÇLI)' },
        { 'ALAN': 'Banka/PF Tipi', 'AÇIKLAMA': 'Banka veya PF (BİLGİ AMAÇLI)' },
        { 'ALAN': 'ÖK Tipi', 'AÇIKLAMA': 'EPK veya ÖK (BİLGİ AMAÇLI)' },
        { 'ALAN': 'Durum', 'AÇIKLAMA': 'Müşteri durumu (BİLGİ AMAÇLI)' },
        { 'ALAN': '', 'AÇIKLAMA': '' },
        { 'ALAN': '✏️ NASIL KULLANILIR', 'AÇIKLAMA': '' },
        { 'ALAN': '1️⃣', 'AÇIKLAMA': 'Şablonu indirin' },
        { 'ALAN': '2️⃣', 'AÇIKLAMA': 'Her müşteri için "Banka/PF Firma Ünvanı" sütununu doldurun' },
        { 'ALAN': '3️⃣', 'AÇIKLAMA': 'Firma ünvanı Banka/PF modülündeki kayıtlarla AYNI olmalı' },
        { 'ALAN': '4️⃣', 'AÇIKLAMA': '"Banka/PF Yükle" butonu ile dosyayı yükleyin' },
        { 'ALAN': '', 'AÇIKLAMA': '' },
        { 'ALAN': '🔍 OTOMATİK EŞLEŞTİRME', 'AÇIKLAMA': '' },
        { 'ALAN': '✓', 'AÇIKLAMA': 'Cari Adı = Firma Ünvanı ise otomatik eşleşir' },
        { 'ALAN': '✓', 'AÇIKLAMA': 'Manuel yükleme ile farklı eşleştirmeler yapabilirsiniz' },
        { 'ALAN': '', 'AÇIKLAMA': '' },
        { 'ALAN': '⚠️ ÖNEMLİ', 'AÇIKLAMA': '' },
        { 'ALAN': '❗', 'AÇIKLAMA': 'Cari Adı sütununu DEĞİŞTİRMEYİN' },
        { 'ALAN': '❗', 'AÇIKLAMA': 'Domain sütunları (Ana Domain, 1.Alt-5.Alt) sadece BİLGİ AMAÇLI' },
        { 'ALAN': '❗', 'AÇIKLAMA': 'Firma ünvanını Banka/PF modülünden kopyalayın' },
        { 'ALAN': '❗', 'AÇIKLAMA': 'Büyük/küçük harf farkı gözetilmez' }
      ];
      
      const wsInst = XLSX.utils.json_to_sheet(instructionData);
      wsInst['!cols'] = [{ wch: 25 }, { wch: 60 }];
      XLSX.utils.book_append_sheet(wb, wsInst, 'Kullanım Kılavuzu');
      
      // Dosyayı indir
      const fileName = `banka-pf-eslestirme-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      const matchedCount = templateData.filter(row => row['Banka/PF Firma Ünvanı']).length;
      toast.success(
        `✅ Şablon indirildi!\n\n${templateData.length} müşteri\n${matchedCount} eşleşme mevcut`,
        { duration: 4000 }
      );
      
    } catch (error) {
      console.error('❌ Banka/PF şablon oluşturma hatası:', error);
      toast.error('Şablon oluşturulamadı! Lütfen tekrar deneyin.');
    }
  };

  // Banka/PF import
  const handleBankPFImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls';
    
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          toast.error('❌ Excel dosyası boş!');
          return;
        }
        
        console.log('📊 Banka/PF eşleştirme verisi okunuyor...', { toplamSatır: jsonData.length });
        
        // Müşteri eşleştirme map'i
        const customerNormalizedMap = new Map<string, Customer>();
        // ✅ NULL SAFETY: customers boş olabilir
        (customers || []).forEach(customer => {
          const normalizedName = normalizeCustomerName(customer.cariAdi);
          customerNormalizedMap.set(normalizedName, customer);
        });
        
        // Banka/PF eşleştirme map'i
        const bankPFNormalizedMap = new Map<string, any>();
        // ✅ NULL SAFETY: bankPFRecords boş olabilir
        (bankPFRecords || []).forEach(record => {
          const normalizedName = normalizeCustomerName(record.firmaUnvan);
          bankPFNormalizedMap.set(normalizedName, record);
        });
        
        let updatedCount = 0;
        let notFoundCustomers: string[] = [];
        let notFoundBankPF: string[] = [];
        
        jsonData.forEach((row: any, index: number) => {
          const cariAdi = row['Cari Adı']?.trim();
          const bankPFFirmaUnvan = row['Banka/PF Firma Ünvanı']?.trim();
          // Domain sütunları varsa okuyoruz (şimdilik kullanmıyoruz, gelecekte kullanılabilir)
          const anaDomain = row['Ana Domain']?.trim();
          const alt1 = row['1.Alt']?.trim();
          const alt2 = row['2.Alt']?.trim();
          const alt3 = row['3.Alt']?.trim();
          const alt4 = row['4.Alt']?.trim();
          const alt5 = row['5.Alt']?.trim();
          
          if (!cariAdi) {
            console.warn(`⚠️ Satır ${index + 2}: Cari Adı boş, atlanıyor`);
            return;
          }
          
          if (!bankPFFirmaUnvan) {
            // Boş satır - eşleştirme kaldır
            const normalizedCariAdi = normalizeCustomerName(cariAdi);
            const customer = customerNormalizedMap.get(normalizedCariAdi);
            
            if (customer) {
              customer.linkedBankPFIds = [];
              updatedCount++;
            }
            return;
          }
          
          // Müşteriyi bul
          const normalizedCariAdi = normalizeCustomerName(cariAdi);
          const customer = customerNormalizedMap.get(normalizedCariAdi);
          
          if (!customer) {
            notFoundCustomers.push(cariAdi);
            return;
          }
          
          // Banka/PF kaydını bul
          const normalizedBankPF = normalizeCustomerName(bankPFFirmaUnvan);
          const bankPFRecord = bankPFNormalizedMap.get(normalizedBankPF);
          
          if (!bankPFRecord) {
            notFoundBankPF.push(bankPFFirmaUnvan);
            return;
          }
          
          // Eşleştirmeyi kaydet
          if (!customer.linkedBankPFIds) {
            customer.linkedBankPFIds = [];
          }
          
          if (!customer.linkedBankPFIds.includes(bankPFRecord.id)) {
            customer.linkedBankPFIds.push(bankPFRecord.id);
            updatedCount++;
            console.log(`✅ Eşleştirme: ${cariAdi} ↔ ${bankPFFirmaUnvan}`);
          }
        });
        
        // Güncellenmiş müşteri listesini kaydet
        if (onCustomersChange) {
          onCustomersChange([...customers]);
        }
        
        // Sonuç mesajı
        let message = `✅ Import tamamlandı!\n\n${updatedCount} eşleştirme yapıldı`;
        
        if (notFoundCustomers.length > 0) {
          message += `\n\n⚠️ ${notFoundCustomers.length} müşteri bulunamadı`;
        }
        
        if (notFoundBankPF.length > 0) {
          message += `\n\n⚠️ ${notFoundBankPF.length} Banka/PF kaydı bulunamadı`;
        }
        
        if (notFoundCustomers.length > 0 || notFoundBankPF.length > 0) {
          toast.warning(message, { duration: 8000 });
          
          if (notFoundCustomers.length > 0) {
            console.warn('⚠️ Bulunamayan müşteriler:', notFoundCustomers.slice(0, 5).join(', '));
          }
          if (notFoundBankPF.length > 0) {
            console.warn('⚠️ Bulunamayan Banka/PF kayıtları:', notFoundBankPF.slice(0, 5).join(', '));
          }
        } else {
          toast.success(message, { duration: 5000 });
        }
        
      } catch (error) {
        console.error('❌ Banka/PF import hatası:', error);
        toast.error(
          `❌ Hata!\n${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
          { duration: 6000 }
        );
      }
    };
    
    input.click();
  };

  // Domain şablonu indirme
  const handleDownloadDomainTemplate = () => {
    try {
      
      // Tüm müşterilerin verileri ile şablon oluştur
      const templateData: any[] = [];
      
      if (customers.length > 0) {
        // ✅ NULL SAFETY: customers boş olabilir
        (customers || []).forEach(customer => {
          if (customer.domainHierarchy && customer.domainHierarchy.length > 0) {
            // Mevcut domain hiyerarşisini düzleştir
            flattenDomainHierarchy(customer.domainHierarchy, [], customer).forEach(row => {
              templateData.push(row);
            });
          } else {
            // Domain hiyerarşisi yoksa boş satır ekle
            templateData.push({
              'Cari Adı': customer.cariAdi,
              'Ana Domain': customer.guncelMyPayterDomain || '',
              'Cihaz Adedi': getCustomerDeviceCount(customer),
              '1.Alt': '',
              '2.Alt': '',
              '3.Alt': '',
              '4.Alt': '',
              '5.Alt': ''
            });
          }
        });
      } else {
        // Hiç müşteri yoksa örnek veriler ekle
        templateData.push(
          {
            'Cari Adı': 'MACGAL',
            'Ana Domain': 'macgal.mypayter.com',
            'Cihaz Adedi': 0,
            '1.Alt': 'İSTANBUL',
            '2.Alt': 'İSTHASTANE',
            '3.Alt': 'MEDICALPARK',
            '4.Alt': 'FLORYA',
            '5.Alt': ''
          },
          {
            'Cari Adı': 'MACGAL',
            'Ana Domain': 'macgal.mypayter.com',
            'Cihaz Adedi': 0,
            '1.Alt': 'ANKARA',
            '2.Alt': 'ÇANKAYA',
            '3.Alt': '',
            '4.Alt': '',
            '5.Alt': ''
          },
          {
            'Cari Adı': '',
            'Ana Domain': '',
            'Cihaz Adedi': 0,
            '1.Alt': '',
            '2.Alt': '',
            '3.Alt': '',
            '4.Alt': '',
            '5.Alt': ''
          }
        );
      }
      
      // Worksheet oluştur
      const ws = XLSX.utils.json_to_sheet(templateData);
      
      // Sütun genişlikleri
      ws['!cols'] = [
        { wch: 25 }, // Cari Adı
        { wch: 30 }, // Ana Domain
        { wch: 12 }, // Cihaz Adedi
        { wch: 18 }, // 1.Alt
        { wch: 18 }, // 2.Alt
        { wch: 18 }, // 3.Alt
        { wch: 18 }, // 4.Alt
        { wch: 18 }  // 5.Alt
      ];
      
      // Workbook oluştur
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Domain Hiyerarşisi');
      
      // Kullanım kılavuzu sayfası
      const instructionData = [
        { 'ALAN': 'SÜTUNLAR', 'AÇIKLAMA': '' },
        { 'ALAN': 'Cari Adı', 'AÇIKLAMA': 'Müşteri firma adı (sistemde kayıtlı olmalı - tam eşleşme gerekli)' },
        { 'ALAN': 'Ana Domain', 'AÇIKLAMA': 'Müşterinin ana domain adresi (örn: firma.mypayter.com)' },
        { 'ALAN': 'Cihaz Adedi', 'AÇIKLAMA': 'Payter sekmesindeki toplam cihaz sayısı (BİLGİ AMAÇLI - değiştirilemez)' },
        { 'ALAN': '1.Alt', 'AÇIKLAMA': 'Birinci seviye domain - Kök organizasyon (örn: İSTANBUL, ANKARA)' },
        { 'ALAN': '2.Alt', 'AÇIKLAMA': 'İkinci seviye domain - Alt organizasyon (örn: İSTHASTANE, ÇANKAYA)' },
        { 'ALAN': '3.Alt', 'AÇIKLAMA': 'Üçüncü seviye domain - Daha detaylı organizasyon' },
        { 'ALAN': '4.Alt', 'AÇIKLAMA': 'Dördüncü seviye domain' },
        { 'ALAN': '5.Alt', 'AÇIKLAMA': 'Beşinci seviye domain (maksimum derinlik)' },
        { 'ALAN': '', 'AÇIKLAMA': '' },
        { 'ALAN': 'NASIL ÇALIŞIR?', 'AÇIKLAMA': '' },
        { 'ALAN': '📍 Her Satır', 'AÇIKLAMA': 'Bir domain hiyerarşi yolunu temsil eder (1.Alt → 2.Alt → 3.Alt...)' },
        { 'ALAN': '👥 Aynı Müşteri', 'AÇIKLAMA': 'Birden fazla satır olabilir (farklı domain yolları için)' },
        { 'ALAN': '🔄 Birleştirme', 'AÇIKLAMA': 'Aynı seviyedeki aynı isimli domainler otomatik birleştirilir' },
        { 'ALAN': '⚠️ Boş Sütun', 'AÇIKLAMA': 'Boş sütunlar göz ardı edilir (örn: sadece 1.Alt ve 2.Alt dolu ise 3 seviye oluşturulmaz)' },
        { 'ALAN': '', 'AÇIKLAMA': '' },
        { 'ALAN': 'ÖRNEK - MACGAL', 'AÇIKLAMA': '' },
        { 'ALAN': 'Satır 1', 'AÇIKLAMA': 'MACGAL | macgal.com | İSTANBUL | İSTHASTANE | MEDICALPARK | FLORYA | (boş)' },
        { 'ALAN': 'Satır 2', 'AÇIKLAMA': 'MACGAL | macgal.com | İSTANBUL | ÇANKAYA | (boş) | (boş) | (boş)' },
        { 'ALAN': 'Satır 3', 'AÇIKLAMA': 'MACGAL | macgal.com | ANKARA | (boş) | (boş) | (boş) | (boş)' },
        { 'ALAN': '', 'AÇIKLAMA': '' },
        { 'ALAN': 'SONUÇ', 'AÇIKLAMA': 'İSTANBUL → İSTHASTANE → MEDICALPARK → FLORYA' },
        { 'ALAN': '', 'AÇIKLAMA': 'İSTANBUL → ÇANKAYA' },
        { 'ALAN': '', 'AÇIKLAMA': 'ANKARA' },
        { 'ALAN': '', 'AÇIKLAMA': '(İSTANBUL node\'u otomatik birleştirildi ve 2 alt dalı var)' }
      ];
      const wsInst = XLSX.utils.json_to_sheet(instructionData);
      wsInst['!cols'] = [{ wch: 15 }, { wch: 60 }];
      XLSX.utils.book_append_sheet(wb, wsInst, 'Kullanım Kılavuzu');
      
      // Dosyayı indir
      const fileName = `domain-hiyerarsi-tum-musteriler.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success(`✅ Şablon indirildi: ${fileName}`);
      console.log('✅ Domain şablonu oluşturuldu:', { müşteriSayısı: customers.length, satırSayısı: templateData.length });
      
    } catch (error) {
      console.error('❌ Şablon oluşturma hatası:', error);
      toast.error('Şablon oluşturulamadı! Lütfen tekrar deneyin.');
    }
  };
  
  // Domain hiyerarşisini düzleştir (Excel formatına dönüştür)
  const flattenDomainHierarchy = (nodes: DomainNode[], parentPath: string[], customer: Customer): any[] => {
    const rows: any[] = [];
    
    nodes.forEach(node => {
      const currentPath = [...parentPath, node.name];
      
      // Bu path için bir satır oluştur
      const row: any = {
        'Cari Adı': customer.cariAdi,
        'Ana Domain': customer.guncelMyPayterDomain || '',
        'Cihaz Adedi': getCustomerDeviceCount(customer),
        '1.Alt': currentPath[0] || '',
        '2.Alt': currentPath[1] || '',
        '3.Alt': currentPath[2] || '',
        '4.Alt': currentPath[3] || '',
        '5.Alt': currentPath[4] || ''
      };
      
      // Eğer child varsa, recursive çağır
      if (node.children && node.children.length > 0) {
        rows.push(...flattenDomainHierarchy(node.children, currentPath, customer));
      } else {
        // Leaf node - satırı ekle
        rows.push(row);
      }
    });
    
    return rows;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        {/* Title Section */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Müşteri Cari Kart Listesi</h2>
          <p className="text-xs sm:text-sm font-medium text-gray-600">Tüm cari bilgilerini görüntüleyin ve yönetin</p>
        </div>
        
        {/* Action Buttons - Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {/* Banka/PF Eşleştirme Butonları */}
          <Button
            onClick={handleDownloadBankPFTemplate}
            className="group relative text-xs sm:text-sm"
            title="Müşteri-Banka/PF eşleştirme şablonunu indir"
          >
            <span className="hidden lg:inline">Banka/PF Şablon</span>
            <span className="lg:hidden">Şablon</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBankPFImport}
            className="group relative text-xs sm:text-sm"
            title="Excel'den müşteri-Banka/PF eşleştirmelerini yükle"
          >
            <span className="hidden lg:inline">Banka/PF Yükle</span>
            <span className="lg:hidden">Yükle</span>
          </Button>

          {/* Domain Hiyerarşisi Butonları */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadDomainTemplate}
            className="group relative text-xs sm:text-sm"
            title="Tüm müşterilerin mevcut domain hiyerarşisini Excel'e aktar"
          >
            <span className="hidden lg:inline">Domain Şablon</span>
            <span className="lg:hidden">Şablon</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDomainImport}
            className="group relative text-xs sm:text-sm"
            title="Excel'den tüm müşteriler için domain hiyerarşisini yükle (Cari Adı bazlı)"
          >
            <span className="hidden lg:inline">Domain Yükle</span>
            <span className="lg:hidden">Yükle</span>
          </Button>
          
          <ExcelImport onImport={handleImportCustomers} bankPFRecords={bankPFRecords} />
          <Button onClick={handleCreateNew} className="flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-shadow text-xs sm:text-sm col-span-2 sm:col-span-1">
            <Plus size={18} />
            <span className="hidden sm:inline">Yeni Cari Kart</span>
            <span className="sm:hidden">Yeni</span>
          </Button>
        </div>
      </div>

      <CustomerList
        customers={customers}
        onSelectCustomer={setSelectedCustomer}
        onUpdateCustomer={handleUpdateCustomer}
        onUpdateCustomers={onCustomersChange}
        payterProducts={payterProducts}
        bankPFRecords={bankPFRecords}
        salesReps={salesReps}
        banks={banks}
        epkList={epkList}
        okList={okList}
      />
    </div>
  );
});
