import { useState, useRef } from 'react';
import { Customer } from './CustomerModule';
import { BankPF } from './BankPFModule';
import { PayterProduct } from './PayterProductTab';
import { Partnership } from './PartnershipTab';
import { HesapKalemi, SabitKomisyon, EkGelir } from './RevenueModelsTab';
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ExcelDataManagerProps {
  // Tüm veri kaynaklarından aldığımız data
  customers: Customer[];
  bankPFRecords: BankPF[];
  payterProducts: PayterProduct[];
  mccList: Array<{ kod: string; kategori: string }>;
  banks: Array<{ id: string; kod: string; bankaAdi: string; aciklama: string; aktif: boolean }>;
  epkList: Array<{ id: string; kod: string; kurumAdi: string; aciklama: string; aktif: boolean }>;
  okList: Array<{ id: string; kod: string; kurumAdi: string; aciklama: string; aktif: boolean }>;
  salesReps: Array<{ id: string; adSoyad: string; aktif: boolean }>;
  jobTitles: Array<{ id: string; unvan: string; aktif: boolean }>;
  partnerships: Partnership[];
  sharings: Array<{ id: string; ad: string; aktif: boolean }>;
  kartProgramlar: Array<{ id: string; kartAdi: string; aciklama: string; aktif: boolean; olusturmaTarihi: string }>;
  hesapKalemleri: HesapKalemi[];
  sabitKomisyonlar: SabitKomisyon[];
  ekGelirler: EkGelir[];
  // Import callback'leri
  onCustomersChange: (customers: Customer[]) => void;
  onBankPFRecordsChange: (records: BankPF[]) => void;
  onPayterProductsChange: (products: PayterProduct[]) => void;
  onMCCListChange: (list: Array<{ kod: string; kategori: string }>) => void;
  onBanksChange: (list: Array<{ id: string; kod: string; bankaAdi: string; aciklama: string; aktif: boolean }>) => void;
  onEPKListChange: (list: Array<{ id: string; kod: string; kurumAdi: string; aciklama: string; aktif: boolean }>) => void;
  onOKListChange: (list: Array<{ id: string; kod: string; kurumAdi: string; aciklama: string; aktif: boolean }>) => void;
  onSalesRepsChange: (list: Array<{ id: string; adSoyad: string; aktif: boolean }>) => void;
  onJobTitlesChange: (list: Array<{ id: string; unvan: string; aktif: boolean }>) => void;
  onPartnershipsChange: (list: Partnership[]) => void;
  onSharingsChange: (list: Array<{ id: string; ad: string; aktif: boolean }>) => void;
  onKartProgramlarChange: (list: Array<{ id: string; kartAdi: string; aciklama: string; aktif: boolean; olusturmaTarihi: string }>) => void;
  onHesapKalemleriChange: (list: HesapKalemi[]) => void;
  onSabitKomisyonlarChange: (list: SabitKomisyon[]) => void;
  onEkGelirlerChange: (list: EkGelir[]) => void;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  sheetResults: {
    [sheetName: string]: {
      success: number;
      failed: number;
      errors: string[];
    };
  };
}

export function ExcelDataManager({
  customers,
  bankPFRecords,
  payterProducts,
  mccList,
  banks,
  epkList,
  okList,
  salesReps,
  jobTitles,
  partnerships,
  sharings,
  kartProgramlar,
  hesapKalemleri,
  sabitKomisyonlar,
  ekGelirler,
  onCustomersChange,
  onBankPFRecordsChange,
  onPayterProductsChange,
  onMCCListChange,
  onBanksChange,
  onEPKListChange,
  onOKListChange,
  onSalesRepsChange,
  onJobTitlesChange,
  onPartnershipsChange,
  onSharingsChange,
  onKartProgramlarChange,
  onHesapKalemleriChange,
  onSabitKomisyonlarChange,
  onEkGelirlerChange,
}: ExcelDataManagerProps) {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // EXPORT FONKSİYONU - TÜM VERİLERİ EXCEL'E
  // ============================================
  const handleExportAll = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      // ❌ MÜŞTERİLER SAYFASI KALDIRILDI - Müşteri modülünden export edin
      // const customerData = customers.map(c => {
      //   // Bağlı Banka/PF adlarını al
      //   const linkedBankPFNames = c.linkedBankPFIds?.map(id => {
      //     const bankPF = bankPFRecords.find(b => b.id === id);
      //     return bankPF ? bankPF.firmaUnvan : '';
      //   }).filter(name => name).join(', ') || '';

      //   return {
      //     'Cari Hesap Kodu': c.cariHesapKodu,
      //     'Sektör': c.sektor,
      //     'MCC': c.mcc,
      //     'Cari Adı': c.cariAdi,
      //     'Güncel MyPayter Domain': c.guncelMyPayterDomain,
      //     'Vergi Dairesi': c.vergiDairesi,
      //     'Vergi No': c.vergiNo,
      //     'Adres': c.adres,
      //     'İlçe': c.ilce,
      //     'Posta Kodu': c.postaKodu,
      //     'Email': c.email,
      //     'Yetkili': c.yetkili,
      //     'Telefon': c.tel,
      //     'P6X': c.p6x || '',
      //     'APOLLO': c.apollo || '',
      //     'Durum': c.durum,
      //     'Satış Temsilcisi': c.salesRepName || '',
      //     'Bağlı Banka/PF Sayısı': c.linkedBankPFIds?.length || 0,
      //     'Bağlı Banka/PF Adları': linkedBankPFNames,
      //     // Toplu işlem alanları
      //     'Bloke Durumu': c.blokeDurumu ? 'Evet' : 'Hayır',
      //     'Sorumlu Kişi': c.sorumluKisi || '',
      //     'Cari Grubu': c.cariGrubu || '',
      //     // Hizmet bedeli ayarları
      //     'Abonelik Tipi': c.serviceFeeSettings?.paymentType === 'monthly' ? 'Aylık' : c.serviceFeeSettings?.paymentType === 'yearly' ? 'Yıllık' : '',
      //     'Standart Ücret (€)': c.serviceFeeSettings?.standardFeePerDevice || '',
      //     'Özel Ücret (€)': c.serviceFeeSettings?.customFeePerDevice || '',
      //     'Sözleşme Başlangıç': c.serviceFeeSettings?.contractStartDate || '',
      //     'Hizmet Aktif': c.serviceFeeSettings?.isActive ? 'Evet' : 'Hayır',
      //     'Dondurma Tarihi': c.serviceFeeSettings?.suspensionStartDate || '',
      //     'Dondurma Sebebi': c.serviceFeeSettings?.suspensionReason || '',
      //     'Cihaz Abonelikleri Sayısı': c.serviceFeeSettings?.deviceSubscriptions?.length || 0,
      //     'Fatura Sayısı': c.serviceFeeSettings?.invoices?.length || 0,
      //   };
      // });
      
      // const wsCustomers = XLSX.utils.json_to_sheet(customerData);
      // wsCustomers['!cols'] = [
      //   { wch: 18 }, { wch: 15 }, { wch: 8 }, { wch: 30 }, { wch: 30 },
      //   { wch: 15 }, { wch: 12 }, { wch: 40 }, { wch: 15 }, { wch: 12 },
      //   { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 10 },
      //   { wch: 10 }, { wch: 20 }, { wch: 22 }, { wch: 50 }, // Bağlı Banka/PF Adları sütunu
      //   // Toplu işlem alanları
      //   { wch: 14 }, { wch: 20 }, { wch: 15 },
      //   // Hizmet bedeli alanları
      //   { wch: 15 }, { wch: 16 }, { wch: 14 }, { wch: 20 }, { wch: 12 },
      //   { wch: 16 }, { wch: 20 }, { wch: 24 }, { wch: 14 }
      // ];
      // XLSX.utils.book_append_sheet(wb, wsCustomers, 'Müşteriler');

      // 2. BANKA/PF ANA BİLGİLER SAYFASI
      const bankPFData = bankPFRecords.map(b => ({
        'Firma Ünvanı': b.firmaUnvan,
        'Muhasebe Kodu': b.muhasebeKodu,
        'Banka veya PF': b.bankaOrPF,
        'Banka/PF Adı': b.bankaPFAd,
        'Ödeme Kuruluşu Tipi': b.odemeKurulusuTipi || '',
        'Ödeme Kuruluşu Adı': b.odemeKurulusuAd || '',
        'Vergi Dairesi': b.vergiDairesi || '',
        'Vergi No': b.vergiNo || '',
        'Adres': b.adres || '',
        'Telefon': b.telefon || '',
        'Email': b.email || '',
        'Durum': b.durum,
        'İletişim Kişi Sayısı': b.iletisimMatrisi?.length || 0,
        'Doküman Sayısı': b.dokumanlar?.length || 0,
        'İşbirliği Sayısı': b.isbirlikleri?.length || 0,
        'TABELA Sayısı': b.tabelaRecords?.length || 0,
        'TABELA Grup Sayısı': b.tabelaGroups?.length || 0,
        'Hakediş Kayıt Sayısı': b.hakedisRecords?.length || 0,
        'Anlaşmalı Banka Sayısı': b.agreementBanks?.length || 0,
        'Anlaşmalı EPK Sayısı': b.agreementEPKs?.length || 0,
        'Anlaşmalı ÖK Sayısı': b.agreementOKs?.length || 0,
      }));
      
      const wsBankPF = XLSX.utils.json_to_sheet(bankPFData);
      wsBankPF['!cols'] = [
        { wch: 35 }, { wch: 16 }, { wch: 14 }, { wch: 25 }, { wch: 20 },
        { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 40 }, { wch: 15 },
        { wch: 25 }, { wch: 10 }, { wch: 20 }, { wch: 16 }, { wch: 16 },
        { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 16 }
      ];
      XLSX.utils.book_append_sheet(wb, wsBankPF, 'Banka-PF Ana Bilgiler');
      
      // 2b. BANKA/PF İLETİŞİM MATRİSİ (Detaylı)
      const contactData: any[] = [];
      // ✅ NULL SAFETY: bankPFRecords boş olabilir
      (bankPFRecords || []).forEach(b => {
        if (b.iletisimMatrisi && b.iletisimMatrisi.length > 0) {
          b.iletisimMatrisi.forEach(contact => {
            contactData.push({
              'Firma Ünvanı': b.firmaUnvan,
              'Adı Soyadı': `${contact.ad} ${contact.soyad}`,
              'Görevi': contact.gorev,
              'Telefon': contact.telefon,
              'GSM': contact.gsm,
              'Email': contact.email,
            });
          });
        }
      });
      
      if (contactData.length > 0) {
        const wsContacts = XLSX.utils.json_to_sheet(contactData);
        wsContacts['!cols'] = [
          { wch: 35 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 30 }
        ];
        XLSX.utils.book_append_sheet(wb, wsContacts, 'İletişim Matrisi');
      }
      
      // 2c. BANKA/PF İŞBİRLİKLERİ (Detaylı)
      const collabData: any[] = [];
      // ✅ NULL SAFETY: bankPFRecords boş olabilir
      (bankPFRecords || []).forEach(b => {
        if (b.isbirlikleri && b.isbirlikleri.length > 0) {
          b.isbirlikleri.forEach(collab => {
            collabData.push({
              'Firma Ünvanı': b.firmaUnvan,
              'Sıra No': collab.siraNo,
              'Başlangıç Tarihi': collab.baslangicTarihi,
              'Bitiş Tarihi': collab.bitisTarihi || 'Süresiz',
              'Gelir Modeli': collab.gelirModeli || '',
              'Hesap Kalemi Kodu': collab.hesapKalemiKod || '',
              'Durum': collab.durum,
            });
          });
        }
      });
      
      if (collabData.length > 0) {
        const wsCollab = XLSX.utils.json_to_sheet(collabData);
        wsCollab['!cols'] = [
          { wch: 35 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 10 }
        ];
        XLSX.utils.book_append_sheet(wb, wsCollab, 'İşbirlikleri');
      }

      // 3. PAYTER ÜRÜNLERİ SAYFASI (Sütun sıralaması görsel referansa göre düzenlendi)
      const payterData = payterProducts.map(p => ({
        'Serial number': p.serialNumber,
        'Name': p.name || '',
        'TID': p.tid || '',
        'Domain': p.domain || '',
        'Firmware': p.firmware || '',
        'SAM 1': p.sam1 || '',
        'SAM 2': p.sam2 || '',
        'SAM 3': p.sam3 || '',
        'SIM': p.sim || '',
        'Terminal type': p.terminalType || '',
        'Online status': p.onlineStatus || '',
        'Sync status': p.syncStatus || '',
        'Terminal model': p.terminalModel || '',
        'MAC address': p.macAddress || '',
        'PTID': p.ptid || '',
      }));
      
      const wsPayter = XLSX.utils.json_to_sheet(payterData);
      wsPayter['!cols'] = [
        { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 },
        { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(wb, wsPayter, 'Payter Ürünleri');

      // 4. MCC TANIMLARI SAYFASI
      const mccData = mccList.map(m => ({
        'MCC Kodu': m.kod,
        'Kategori': m.kategori,
      }));
      
      const wsMCC = XLSX.utils.json_to_sheet(mccData);
      wsMCC['!cols'] = [{ wch: 12 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(wb, wsMCC, 'MCC Tanımları');

      // 5. BANKALAR SAYFASI
      const banksData = banks.map(b => ({
        'Kod': b.kod,
        'Banka Adı': b.bankaAdi,
        'Açıklama': b.aciklama || '',
        'Durum': b.aktif ? 'Aktif' : 'Pasif',
      }));
      
      const wsBanks = XLSX.utils.json_to_sheet(banksData);
      wsBanks['!cols'] = [{ wch: 12 }, { wch: 35 }, { wch: 40 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsBanks, 'Bankalar');

      // 6. EPK TANIMLARI SAYFASI
      const epkData = epkList.map(e => ({
        'Kod': e.kod,
        'Kurum Adı': e.kurumAdi,
        'Açıklama': e.aciklama || '',
        'Durum': e.aktif ? 'Aktif' : 'Pasif',
      }));
      
      const wsEPK = XLSX.utils.json_to_sheet(epkData);
      wsEPK['!cols'] = [{ wch: 12 }, { wch: 35 }, { wch: 40 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsEPK, 'EPK');

      // 7. ÖK TANIMLARI SAYFASI
      const okData = okList.map(o => ({
        'Kod': o.kod,
        'Kurum Adı': o.kurumAdi,
        'Açıklama': o.aciklama || '',
        'Durum': o.aktif ? 'Aktif' : 'Pasif',
      }));
      
      const wsOK = XLSX.utils.json_to_sheet(okData);
      wsOK['!cols'] = [{ wch: 12 }, { wch: 35 }, { wch: 40 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsOK, 'ÖK');

      // 8. SATIŞ TEMSİLCİLERİ SAYFASI
      const salesRepsData = salesReps.map(s => ({
        'Ad Soyad': s.adSoyad,
        'Durum': s.aktif ? 'Aktif' : 'Pasif',
      }));
      
      const wsSalesReps = XLSX.utils.json_to_sheet(salesRepsData);
      wsSalesReps['!cols'] = [{ wch: 30 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsSalesReps, 'Satış Temsilcileri');

      // 9. ÜNVANLAR SAYFASI
      const jobTitlesData = jobTitles.map(j => ({
        'Ünvan': j.unvan,
        'Durum': j.aktif ? 'Aktif' : 'Pasif',
      }));
      
      const wsJobTitles = XLSX.utils.json_to_sheet(jobTitlesData);
      wsJobTitles['!cols'] = [{ wch: 30 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsJobTitles, 'Ünvanlar');

      // 10. PARTNERLİK ANLAŞMALARI SAYFASI
      const partnershipsData = partnerships.map(p => ({
        'Kod': p.kod,
        'Model Adı': p.modelAdi,
        'Oran': p.oran,
        'Açıklama': p.aciklama || '',
        'Durum': p.aktif ? 'Aktif' : 'Pasif',
        'Oluşturma Tarihi': p.olusturmaTarihi || '',
        'Hesaplama Satır Sayısı': p.calculationRows?.length || 0,
      }));
      
      const wsPartnerships = XLSX.utils.json_to_sheet(partnershipsData);
      wsPartnerships['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 40 }, { wch: 10 }, { wch: 18 }, { wch: 22 }];
      XLSX.utils.book_append_sheet(wb, wsPartnerships, 'Partnerlik Anlaşmaları');

      // 11. HESAP KALEMLERİ SAYFASI
      const hesapKalemleriData = hesapKalemleri.map(h => ({
        'Kod': h.kod,
        'Hesap Kalemi Adı': h.adi,
        'Açıklama': h.aciklama || '',
        'Durum': h.aktif ? 'Aktif' : 'Pasif',
      }));
      
      const wsHesapKalemleri = XLSX.utils.json_to_sheet(hesapKalemleriData);
      wsHesapKalemleri['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 40 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsHesapKalemleri, 'Hesap Kalemleri');

      // 12. SABİT KOMİSYONLAR SAYFASI
      const sabitKomisyonlarData = sabitKomisyonlar.map(s => ({
        'Komisyon Adı': s.adi,
        'Oran (%)': s.oran,
        'Açıklama': s.aciklama || '',
        'Durum': s.aktif ? 'Aktif' : 'Pasif',
      }));
      
      const wsSabitKomisyonlar = XLSX.utils.json_to_sheet(sabitKomisyonlarData);
      wsSabitKomisyonlar['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 40 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsSabitKomisyonlar, 'Sabit Komisyonlar');

      // 13. EK GELİRLER SAYFASI
      const ekGelirlerData = ekGelirler.map(e => ({
        'Gelir Adı': e.adi,
        'Tutar': e.tutar,
        'Birim': e.birim || 'EUR',
        'Açıklama': e.aciklama || '',
        'Durum': e.aktif ? 'Aktif' : 'Pasif',
      }));
      
      const wsEkGelirler = XLSX.utils.json_to_sheet(ekGelirlerData);
      wsEkGelirler['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 10 }, { wch: 40 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsEkGelirler, 'Ek Gelirler');

      // 14. GELİR MODELLERİ SAYFASI
      const sharingsData = sharings.map(s => ({
        'Gelir Modeli Adı': s.ad,
        'Durum': s.aktif ? 'Aktif' : 'Pasif',
      }));
      
      const wsSharings = XLSX.utils.json_to_sheet(sharingsData);
      wsSharings['!cols'] = [{ wch: 35 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsSharings, 'Gelir Modelleri');

      // 15. KART PROGRAMLARI SAYFASI
      const kartProgramlarData = kartProgramlar.map(k => ({
        'Kart Programı Adı': k.kartAdi,
        'Açıklama': k.aciklama || '',
        'Durum': k.aktif ? 'Aktif' : 'Pasif',
      }));
      
      const wsKartProgramlar = XLSX.utils.json_to_sheet(kartProgramlarData);
      wsKartProgramlar['!cols'] = [{ wch: 35 }, { wch: 40 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, wsKartProgramlar, 'Kart Programları');

      // Excel dosyasını indir
      const fileName = `Yonetim_Sistemi_Yedek_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success(`Tüm veriler Excel'e aktarıldı: ${fileName}`, {
        description: `${wb.SheetNames.length} sayfa içeren dosya oluşturuldu`,
        duration: 5000,
      });
    } catch (error) {
      console.error('Excel export hatası:', error);
      toast.error('Excel dosyası oluşturulurken bir hata oluştu!');
    }
  };

  // ============================================
  // IMPORT FONKSİYONU - EXCEL'DEN VERİ OKUMA
  // ============================================
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);
    setResult(null);

    try {
      const data = await file.arrayBuffer();
      setProgress(30);

      const workbook = XLSX.read(data);
      setProgress(50);

      const sheetResults: ImportResult['sheetResults'] = {};
      let totalSuccess = 0;
      let totalFailed = 0;
      const allErrors: string[] = [];

      // Her sheet'i işle
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const sheetResult = {
          success: 0,
          failed: 0,
          errors: [] as string[],
        };

        try {
          // Sheet adına göre uygun import fonksiyonunu çağır
          switch (sheetName) {
            // ❌ MÜŞTERİLER IMPORT KALDIRILDI - Müşteri modülünden import edin
            // case 'Müşteriler':
            //   {
            //     const importedCustomers: Customer[] = jsonData.map((row: any) => {
            //       // Satış temsilcisi ID'sini bul
            //       const salesRep = salesReps.find(s => s.adSoyad === row['Satış Temsilcisi']);
            //       
            //       return {
            //         id: `customer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            //         cariHesapKodu: row['Cari Hesap Kodu'] || '',
            //         sektor: row['Sektör'] || '',
            //         mcc: row['MCC'] || '',
            //         cariAdi: row['Cari Adı'] || '',
            //         guncelMyPayterDomain: row['Güncel MyPayter Domain'] || '',
            //         vergiDairesi: row['Vergi Dairesi'] || '',
            //         vergiNo: row['Vergi No'] || '',
            //         adres: row['Adres'] || '',
            //         ilce: row['İlçe'] || '',
            //         postaKodu: row['Posta Kodu'] || '',
            //         email: row['Email'] || '',
            //         yetkili: row['Yetkili'] || '',
            //         tel: row['Telefon'] || '',
            //         p6x: row['P6X'] || '',
            //         apollo: row['APOLLO'] || '',
            //         durum: row['Durum'] || 'Aktif',
            //         salesRepId: salesRep?.id || '',
            //         salesRepName: salesRep?.adSoyad || '',
            //         linkedBankPFIds: [],
            //         blokeDurumu: row['Bloke Durumu'] === 'Evet',
            //         sorumluKisi: row['Sorumlu Kişi'] || '',
            //         cariGrubu: row['Cari Grubu'] || '',
            //         serviceFeeSettings: {
            //           paymentType: row['Abonelik Tipi'] === 'Aylık' ? 'monthly' : row['Abonelik Tipi'] === 'Yıllık' ? 'yearly' : 'monthly',
            //           standardFeePerDevice: Number(row['Standart Ücret (€)']) || 0,
            //           customFeePerDevice: row['Özel Ücret (€)'] ? Number(row['Özel Ücret (€)']) : undefined,
            //           contractStartDate: row['Sözleşme Başlangıç'] || '',
            //           isActive: row['Hizmet Aktif'] === 'Evet',
            //           suspensionStartDate: row['Dondurma Tarihi'] || undefined,
            //           suspensionReason: row['Dondurma Sebebi'] || undefined,
            //           deviceSubscriptions: [],
            //           invoices: [],
            //         },
            //       };
            //     });
            //     onCustomersChange(importedCustomers);
            //     sheetResult.success = importedCustomers.length;
            //   }
            //   break;

            case 'Banka-PF Ana Bilgiler':
              {
                const importedBankPF: BankPF[] = jsonData.map((row: any) => ({
                  id: `bankpf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  firmaUnvan: row['Firma Ünvanı'] || '',
                  muhasebeKodu: row['Muhasebe Kodu'] || '',
                  bankaOrPF: row['Banka veya PF'] || 'Banka',
                  bankaPFAd: row['Banka/PF Adı'] || '',
                  odemeKurulusuTipi: row['Ödeme Kuruluşu Tipi'] || '',
                  odemeKurulusuAd: row['Ödeme Kuruluşu Adı'] || '',
                  vergiDairesi: row['Vergi Dairesi'] || '',
                  vergiNo: row['Vergi No'] || '',
                  adres: row['Adres'] || '',
                  telefon: row['Telefon'] || '',
                  email: row['Email'] || '',
                  durum: row['Durum'] || 'Aktif',
                  iletisimMatrisi: [],
                  dokumanlar: [],
                  isbirlikleri: [],
                  tabelaRecords: [],
                  tabelaGroups: [],
                  hakedisRecords: [],
                  agreementBanks: [],
                  agreementEPKs: [],
                  agreementOKs: [],
                }));
                onBankPFRecordsChange(importedBankPF);
                sheetResult.success = importedBankPF.length;
              }
              break;

            case 'Payter Ürünleri':
              {
                const imported: PayterProduct[] = jsonData.map((row: any) => ({
                  id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  serialNumber: row['Serial number'] || '',
                  name: row['Name'] || '',
                  tid: row['TID'] || '',
                  domain: row['Domain'] || '',
                  firmware: row['Firmware'] || '',
                  sam1: row['SAM 1'] || '',
                  sam2: row['SAM 2'] || '',
                  sam3: row['SAM 3'] || '',
                  sim: row['SIM'] || '',
                  terminalType: row['Terminal type'] || '',
                  onlineStatus: row['Online status'] || '',
                  syncStatus: row['Sync status'] || '',
                  terminalModel: row['Terminal model'] || '',
                  macAddress: row['MAC address'] || '',
                  ptid: row['PTID'] || '',
                }));
                onPayterProductsChange(imported);
                sheetResult.success = imported.length;
              }
              break;

            case 'MCC Tanımları':
              {
                const imported = jsonData.map((row: any) => ({
                  kod: row['MCC Kodu'] || '',
                  kategori: row['Kategori'] || '',
                }));
                onMCCListChange(imported);
                sheetResult.success = imported.length;
              }
              break;

            case 'Bankalar':
              {
                const imported = jsonData.map((row: any) => ({
                  id: `bank-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  kod: row['Kod'] || '',
                  bankaAdi: row['Banka Adı'] || '',
                  aciklama: row['Açıklama'] || '',
                  aktif: row['Durum'] === 'Aktif',
                }));
                onBanksChange(imported);
                sheetResult.success = imported.length;
              }
              break;

            case 'EPK':
              {
                const imported = jsonData.map((row: any) => ({
                  id: `epk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  kod: row['Kod'] || '',
                  kurumAdi: row['Kurum Adı'] || '',
                  aciklama: row['Açıklama'] || '',
                  aktif: row['Durum'] === 'Aktif',
                }));
                onEPKListChange(imported);
                sheetResult.success = imported.length;
              }
              break;

            case 'ÖK':
              {
                const imported = jsonData.map((row: any) => ({
                  id: `ok-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  kod: row['Kod'] || '',
                  kurumAdi: row['Kurum Adı'] || '',
                  aciklama: row['Açıklama'] || '',
                  aktif: row['Durum'] === 'Aktif',
                }));
                onOKListChange(imported);
                sheetResult.success = imported.length;
              }
              break;

            case 'Satış Temsilcileri':
              {
                const imported = jsonData.map((row: any) => ({
                  id: `salesrep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  adSoyad: row['Ad Soyad'] || '',
                  aktif: row['Durum'] === 'Aktif',
                }));
                onSalesRepsChange(imported);
                sheetResult.success = imported.length;
              }
              break;

            case 'Ünvanlar':
              {
                const imported = jsonData.map((row: any) => ({
                  id: `title-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  unvan: row['Ünvan'] || '',
                  aktif: row['Durum'] === 'Aktif',
                }));
                onJobTitlesChange(imported);
                sheetResult.success = imported.length;
              }
              break;

            case 'Partnerlik Anlaşmaları':
              {
                const imported: Partnership[] = jsonData.map((row: any) => ({
                  id: `partnership-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  kod: row['Kod'] || '',
                  modelAdi: row['Model Adı'] || '',
                  oran: row['Oran'] || '',
                  aciklama: row['Açıklama'] || '',
                  aktif: row['Durum'] === 'Aktif',
                  olusturmaTarihi: row['Oluşturma Tarihi'] || new Date().toISOString().split('T')[0],
                  calculationRows: [],
                }));
                onPartnershipsChange(imported);
                sheetResult.success = imported.length;
              }
              break;

            case 'Hesap Kalemleri':
              {
                const imported: HesapKalemi[] = jsonData.map((row: any) => ({
                  id: `hk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  kod: row['Kod'] || '',
                  adi: row['Hesap Kalemi Adı'] || '',
                  aciklama: row['Açıklama'] || '',
                  aktif: row['Durum'] === 'Aktif',
                }));
                onHesapKalemleriChange(imported);
                sheetResult.success = imported.length;
              }
              break;

            case 'Sabit Komisyonlar':
              {
                const imported: SabitKomisyon[] = jsonData.map((row: any) => ({
                  id: `sk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  adi: row['Komisyon Adı'] || '',
                  oran: Number(row['Oran (%)']) || 0,
                  aciklama: row['Açıklama'] || '',
                  aktif: row['Durum'] === 'Aktif',
                }));
                onSabitKomisyonlarChange(imported);
                sheetResult.success = imported.length;
              }
              break;

            case 'Ek Gelirler':
              {
                const imported: EkGelir[] = jsonData.map((row: any) => ({
                  id: `eg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  adi: row['Gelir Adı'] || '',
                  tutar: Number(row['Tutar']) || 0,
                  birim: (row['Birim'] || 'EUR') as 'TL' | 'EUR' | 'USD',
                  aciklama: row['Açıklama'] || '',
                  aktif: row['Durum'] === 'Aktif',
                }));
                onEkGelirlerChange(imported);
                sheetResult.success = imported.length;
              }
              break;

            case 'Gelir Modelleri':
              {
                const imported = jsonData.map((row: any) => ({
                  id: `sharing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  ad: row['Gelir Modeli Adı'] || '',
                  aktif: row['Durum'] === 'Aktif',
                }));
                onSharingsChange(imported);
                sheetResult.success = imported.length;
              }
              break;

            case 'Kart Programları':
              {
                const imported = jsonData.map((row: any) => ({
                  id: `kp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  kartAdi: row['Kart Programı Adı'] || '',
                  aciklama: row['Açıklama'] || '',
                  aktif: row['Durum'] === 'Aktif',
                  olusturmaTarihi: new Date().toISOString(),
                }));
                onKartProgramlarChange(imported);
                sheetResult.success = imported.length;
              }
              break;

            default:
              sheetResult.errors.push(`Bilinmeyen sayfa: ${sheetName}`);
              sheetResult.failed = jsonData.length;
          }
        } catch (error) {
          sheetResult.errors.push(`${sheetName} işlenirken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
          sheetResult.failed = jsonData.length;
        }

        sheetResults[sheetName] = sheetResult;
        totalSuccess += sheetResult.success;
        totalFailed += sheetResult.failed;
        allErrors.push(...sheetResult.errors);
      });

      setProgress(90);

      setResult({
        success: totalSuccess,
        failed: totalFailed,
        errors: allErrors,
        sheetResults,
      });

      setProgress(100);

      if (totalSuccess > 0) {
        toast.success(`Import tamamlandı!`, {
          description: `${totalSuccess} kayıt başarıyla içe aktarıldı${totalFailed > 0 ? `, ${totalFailed} hata` : ''}. Sayfayı yenilemeden önce değişiklikleri görebilirsiniz.`,
          duration: 5000,
        });
      } else if (totalFailed > 0) {
        toast.error(`Import başarısız!`, {
          description: `${totalFailed} kayıt içe aktarılamadı. Hata detaylarını kontrol edin.`,
          duration: 5000,
        });
      }
    } catch (error) {
      setResult({
        success: 0,
        failed: 1,
        errors: [`Dosya okuma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`],
        sheetResults: {},
      });
      toast.error('Excel dosyası okunamadı!');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClose = () => {
    setIsImportOpen(false);
    setProgress(0);
    setResult(null);
    setIsProcessing(false);
  };

  // ============================================
  // ŞABLON İNDRME FONKSİYONU
  // ============================================
  const downloadTemplate = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      // ❌ MÜŞTERİLER SAYFASI KALDIRILDI - Müşteri modülünden şablon indirin
      // const emptyCustomer = [
      //   {
      //     'Cari Hesap Kodu': '120.01.001',
      //     'Sektör': 'Teknoloji',
      //     'MCC': '5411',
      //     'Cari Adı': 'Örnek Firma A.Ş.',
      //     'Güncel MyPayter Domain': 'ornek-firma.mypayter.com',
      //     'Vergi Dairesi': 'Maslak',
      //     'Vergi No': '1234567890',
      //     'Adres': 'Örnek Mahallesi, No:123',
      //     'İlçe': 'Sarıyer',
      //     'Posta Kodu': '34398',
      //     'Email': 'info@ornekfirma.com',
      //     'Yetkili': 'Ahmet Yılmaz',
      //     'Telefon': '0532 111 2233',
      //     'P6X': '10',
      //     'APOLLO': '5',
      //     'Durum': 'Aktif',
      //     'Satış Temsilcisi': 'Ali Veli',
      //     'Bağlı Banka/PF Sayısı': '0',
      //     'Bağlı Banka/PF Adları': '',
      //     // Toplu işlem alanları
      //     'Bloke Durumu': 'Hayır',
      //     'Sorumlu Kişi': 'Mehmet Demir',
      //     'Cari Grubu': 'A Grubu',
      //     // Hizmet bedeli ayarları
      //     'Abonelik Tipi': 'Aylık',
      //     'Standart Ücret (€)': '10',
      //     'Özel Ücret (€)': '',
      //     'Sözleşme Başlangıç': '2025-01-01',
      //     'Hizmet Aktif': 'Evet',
      //     'Dondurma Tarihi': '',
      //     'Dondurma Sebebi': '',
      //     'Cihaz Abonelikleri Sayısı': '0',
      //     'Fatura Sayısı': '0',
      //   }
      // ];
      
      // const wsCustomers = XLSX.utils.json_to_sheet(emptyCustomer);
      // XLSX.utils.book_append_sheet(wb, wsCustomers, 'Müşteriler');

      // Diğer boş sayfalar...
      const emptyBankPF = [{
        'Firma Ünvanı': 'Örnek Banka A.Ş.',
        'Muhasebe Kodu': '320.01.001',
        'Banka veya PF': 'Banka',
        'Banka/PF Adı': 'Türkiye İş Bankası A.Ş.',
        'Ödeme Kuruluşu Tipi': 'EPK',
        'Ödeme Kuruluşu Adı': 'İŞ BANKAS',
        'Vergi Dairesi': 'Esentepe',
        'Vergi No': '9876543210',
        'Adres': 'İstanbul',
        'Telefon': '0212 111 2233',
        'Email': 'info@ornekbanka.com',
        'Durum': 'Aktif',
        'İletişim Kişi Sayısı': '0',
        'Doküman Sayısı': '0',
        'İşbirliği Sayısı': '0',
        'TABELA Sayısı': '0',
        'TABELA Grup Sayısı': '0',
        'Hakediş Kayıt Sayısı': '0',
        'Anlaşmalı Banka Sayısı': '0',
        'Anlaşmalı EPK Sayısı': '0',
        'Anlaşmalı ÖK Sayısı': '0',
      }];
      const wsBankPF = XLSX.utils.json_to_sheet(emptyBankPF);
      XLSX.utils.book_append_sheet(wb, wsBankPF, 'Banka-PF Ana Bilgiler');

      const emptyPayter = [{ 'Serial Number': 'SN001', 'Domain': 'ornek.mypayter.com', 'Durum': 'Aktif' }];
      const wsPayter = XLSX.utils.json_to_sheet(emptyPayter);
      XLSX.utils.book_append_sheet(wb, wsPayter, 'Payter Ürünleri');

      // Sabit Komisyonlar şablonu
      const emptySabitKomisyon = [{
        'Komisyon Adı': 'Örnek Komisyon',
        'Oran (%)': '2.5',
        'Açıklama': 'Örnek açıklama',
        'Durum': 'Aktif',
      }];
      const wsSabitKomisyon = XLSX.utils.json_to_sheet(emptySabitKomisyon);
      XLSX.utils.book_append_sheet(wb, wsSabitKomisyon, 'Sabit Komisyonlar');

      // Ek Gelirler şablonu
      const emptyEkGelir = [{
        'Gelir Adı': 'Örnek Ek Gelir',
        'Tutar': '100',
        'Birim': 'EUR',
        'Açıklama': 'Örnek açıklama',
        'Durum': 'Aktif',
      }];
      const wsEkGelir = XLSX.utils.json_to_sheet(emptyEkGelir);
      XLSX.utils.book_append_sheet(wb, wsEkGelir, 'Ek Gelirler');

      // MCC Tanımları şablonu
      const emptyMCC = [{
        'MCC Kodu': '5411',
        'Kategori': 'Market ve Gıda',
      }];
      const wsMCC = XLSX.utils.json_to_sheet(emptyMCC);
      XLSX.utils.book_append_sheet(wb, wsMCC, 'MCC Tanımları');

      // Bankalar şablonu
      const emptyBanks = [{
        'Kod': 'B001',
        'Banka Adı': 'Örnek Banka A.Ş.',
        'Açıklama': 'Örnek açıklama',
        'Durum': 'Aktif',
      }];
      const wsBanks = XLSX.utils.json_to_sheet(emptyBanks);
      XLSX.utils.book_append_sheet(wb, wsBanks, 'Bankalar');

      // EPK şablonu
      const emptyEPK = [{
        'Kod': 'EPK001',
        'Kurum Adı': 'Örnek EPK',
        'Açıklama': 'Örnek açıklama',
        'Durum': 'Aktif',
      }];
      const wsEPK = XLSX.utils.json_to_sheet(emptyEPK);
      XLSX.utils.book_append_sheet(wb, wsEPK, 'EPK');

      // ÖK şablonu
      const emptyOK = [{
        'Kod': 'OK001',
        'Kurum Adı': 'Örnek ÖK',
        'Açıklama': 'Örnek açıklama',
        'Durum': 'Aktif',
      }];
      const wsOK = XLSX.utils.json_to_sheet(emptyOK);
      XLSX.utils.book_append_sheet(wb, wsOK, 'ÖK');

      // Satış Temsilcileri şablonu
      const emptySalesReps = [{
        'Ad Soyad': 'Ahmet Yılmaz',
        'Durum': 'Aktif',
      }];
      const wsSalesReps = XLSX.utils.json_to_sheet(emptySalesReps);
      XLSX.utils.book_append_sheet(wb, wsSalesReps, 'Satış Temsilcileri');

      // Ünvanlar şablonu
      const emptyJobTitles = [{
        'Ünvan': 'Genel Müdür',
        'Durum': 'Aktif',
      }];
      const wsJobTitles = XLSX.utils.json_to_sheet(emptyJobTitles);
      XLSX.utils.book_append_sheet(wb, wsJobTitles, 'Ünvanlar');

      // Partnerlik Anlaşmaları şablonu
      const emptyPartnerships = [{
        'Kod': 'P001',
        'Model Adı': 'Örnek Partnerlik Modeli',
        'Oran': '60/40',
        'Açıklama': 'Örnek açıklama',
        'Durum': 'Aktif',
        'Oluşturma Tarihi': '2025-01-01',
        'Hesaplama Satır Sayısı': '0',
      }];
      const wsPartnerships = XLSX.utils.json_to_sheet(emptyPartnerships);
      XLSX.utils.book_append_sheet(wb, wsPartnerships, 'Partnerlik Anlaşmaları');

      // Hesap Kalemleri şablonu
      const emptyHesapKalemleri = [{
        'Kod': 'HK001',
        'Hesap Kalemi Adı': 'Örnek Hesap Kalemi',
        'Açıklama': 'Örnek açıklama',
        'Durum': 'Aktif',
      }];
      const wsHesapKalemleri = XLSX.utils.json_to_sheet(emptyHesapKalemleri);
      XLSX.utils.book_append_sheet(wb, wsHesapKalemleri, 'Hesap Kalemleri');

      // Gelir Modelleri şablonu
      const emptyGelirModelleri = [{
        'Gelir Modeli Adı': 'Örnek Gelir Modeli',
        'Durum': 'Aktif',
      }];
      const wsGelirModelleri = XLSX.utils.json_to_sheet(emptyGelirModelleri);
      XLSX.utils.book_append_sheet(wb, wsGelirModelleri, 'Gelir Modelleri');

      // Kart Programları şablonu
      const emptyKartProgramlari = [{
        'Kart Programı Adı': 'Visa',
        'Açıklama': 'Visa kart programı',
        'Durum': 'Aktif',
      }];
      const wsKartProgramlari = XLSX.utils.json_to_sheet(emptyKartProgramlari);
      XLSX.utils.book_append_sheet(wb, wsKartProgramlari, 'Kart Programları');

      // Excel dosyasını indir
      const fileName = 'Yonetim_Sistemi_Sablon.xlsx';
      XLSX.writeFile(wb, fileName);
      
      toast.success(`Şablon indirildi: ${fileName}`);
    } catch (error) {
      console.error('Şablon indirme hatası:', error);
      toast.error('Şablon oluşturulurken bir hata oluştu!');
    }
  };

  return (
    <div className="flex gap-2">
      {/* Export Button */}
      <Button
        onClick={handleExportAll}
        variant="outline"
        className="flex items-center gap-2 bg-[rgb(255,41,41)]"
      >
        <Upload size={18} />
        <span>Excel</span>
      </Button>

      {/* Import Button */}
      <Button
        onClick={() => setIsImportOpen(true)}
        variant="outline"
        className="flex items-center gap-2 bg-[rgb(61,229,43)]"
      >
        <Download size={18} />
        <span>Excel</span>
      </Button>

      {/* Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Excel'den Toplu Veri Yükleme</DialogTitle>
            <DialogDescription>
              Tüm sistem verilerini içeren Excel dosyasını yükleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            {/* Template Download */}
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription>
                Excel şablonunu indirmek için:
                <Button
                  variant="link"
                  onClick={downloadTemplate}
                  className="h-auto p-0 ml-2"
                >
                  Şablonu İndir
                </Button>
              </AlertDescription>
            </Alert>

            {/* Format Info */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <p className="text-sm">
                <strong>Excel Dosyası Sayfaları (16 sayfa - Müşteriler kaldırıldı):</strong>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <ul className="text-sm space-y-1 ml-4 list-disc">
                  <li><strong>Banka-PF Ana Bilgiler</strong></li>
                  <li><strong>İletişim Matrisi</strong></li>
                  <li><strong>İşbirlikleri</strong></li>
                  <li><strong>Payter Ürünleri</strong></li>
                  <li><strong>MCC Tanımları</strong></li>
                  <li><strong>Bankalar</strong></li>
                  <li><strong>EPK</strong></li>
                  <li><strong>ÖK</strong></li>
                </ul>
                <ul className="text-sm space-y-1 ml-4 list-disc">
                  <li><strong>Satış Temsilcileri</strong></li>
                  <li><strong>Ünvanlar</strong></li>
                  <li><strong>Partnerlik Anlaşmaları</strong></li>
                  <li><strong>Hesap Kalemleri</strong></li>
                  <li><strong>Sabit Komisyonlar</strong></li>
                  <li><strong>Ek Gelirler</strong></li>
                  <li><strong>Gelir Modelleri</strong></li>
                  <li><strong>Kart Programları</strong></li>
                </ul>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                ℹ️ Müşteri import için <strong>Müşteriler modülü</strong> içindeki Excel import butonunu kullanın.
              </div>
            </div>

            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="excel-data-upload"
                disabled={isProcessing}
              />
              <label
                htmlFor="excel-data-upload"
                className={`cursor-pointer ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="mb-2">
                  Excel dosyasını sürükleyin veya tıklayarak seçin
                </p>
                <p className="text-sm text-gray-500">
                  Desteklenen formatlar: .xlsx, .xls
                </p>
              </label>
            </div>

            {/* Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-gray-600">
                  İşleniyor... {progress}%
                </p>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="space-y-3">
                <Alert className={result.failed > 0 ? "bg-yellow-50 border-yellow-300" : "bg-green-50 border-green-200"}>
                  {result.failed > 0 ? <AlertCircle className="h-4 w-4 text-yellow-600" /> : <CheckCircle className="h-4 w-4 text-green-600" />}
                  <AlertDescription>
                    <div className="space-y-2">
                      <div><strong>İmport Özeti:</strong></div>
                      <div>✅ Toplam Başarılı: {result.success} kayıt</div>
                      {result.failed > 0 && <div>⚠️ Toplam Hata: {result.failed} kayıt</div>}
                      
                      {Object.keys(result.sheetResults).length > 0 && (
                        <div className="mt-3 space-y-1">
                          <strong>Sayfa Bazlı Sonuçlar:</strong>
                          {Object.entries(result.sheetResults).map(([sheetName, sheetResult]) => (
                            <div key={sheetName} className="text-sm ml-2">
                              📄 {sheetName}: ✅ {sheetResult.success} {sheetResult.failed > 0 && `| ⚠️ ${sheetResult.failed} hata`}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

                {result.errors.length > 0 && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Hatalar:</strong>
                      <ul className="mt-2 ml-4 list-disc text-sm max-h-60 overflow-y-auto">
                        {result.errors.slice(0, 10).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {result.errors.length > 10 && (
                          <li className="text-gray-500">
                            ... ve {result.errors.length - 10} hata daha
                          </li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button onClick={handleClose} variant="outline">
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}