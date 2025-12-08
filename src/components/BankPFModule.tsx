import React, { useState, useEffect } from 'react';
import { BankPFList } from './BankPFList';
import { BankPFDetail } from './BankPFDetail';
import { TabelaRecord, TabelaGroup } from './TabelaTab';
import { EkGelir } from './RevenueModelsTab';
import { Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { ModernFormSelect, FormSelectOption } from './ModernFormSelect';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { toast } from 'sonner';
import { bankPFApi } from '../utils/supabaseClient';
import { isFigmaMakeEnvironment } from '../utils/environmentDetection';

export interface ContactPerson {
  id: string;
  ad: string;
  soyad: string;
  gorev: string;
  telefon: string;
  gsm: string;
  email: string;
}

export interface Document {
  id: string;
  dosyaAdi: string;
  dosyaTipi: string;
  yuklemeTarihi: string;
  boyut: string;
  aciklama: string;
}

export interface Collaboration {
  id: string;
  siraNo: number;
  baslangicTarihi: string;
  bitisTarihi?: string; // Süresiz için boş
  gelirModeli?: string; // Gelir modeli adı
  hesapKalemiKod?: string; // Hesap kalemi kod no
  durum: 'Aktif' | 'Pasif';
}

export interface HakedisRecord {
  id: string;
  firmaId?: string; // Firma ID (Supabase'den)
  tabelaGroupId: string; // Hangi TABELA grubuna ait
  tabelaGroupAd: string; // Grup adı (görüntüleme için)
  donem: string; // YYYY-MM formatında (örn: "2025-10")
  olusturmaTarihi: string; // ISO date
  guncellemeTarihi?: string; // ISO date
  vade: string; // Seçili vade (D+1, D+7, vb.)
  islemHacmiMap: Record<string, string>; // tabelaId -> hacim değeri
  durum: 'Taslak' | 'Kesinleşmiş';
  notlar?: string;
  olusturanKullanici?: string;
  pfIslemHacmi?: string; // PF İşlem Hacmi/TL
  oxivoIslemHacmi?: string; // OXİVO İşlem Hacmi/TL
  // Ek Gelir/Kesinti Alanları
  ekGelirAciklama?: string; // "Merchant Fee ödenmesi" gibi
  ekGelirPFTL?: number; // Manuel TL
  ekGelirOXTL?: number; // Manuel TL
  ekKesintiAciklama?: string; // "Ceza kesintisi" gibi
  ekKesintiPFTL?: number; // Manuel TL
  ekKesintiOXTL?: number; // Manuel TL
  // Manuel değer override alanları
  manualEkGelirOxivoTotal?: string; // Manuel ek gelir OXİVO toplamı
  manualAnaTabelaOxivoTotal?: string; // Manuel ana TABELA OXİVO toplamı
  manualAnaTabelaIslemHacmi?: string; // Manuel ana TABELA işlem hacmi
  // Hesaplanmış toplam değerler (rapor performansı için)
  totalIslemHacmi?: number; // Toplam İşlem Hacmi
  totalPFPay?: number; // Toplam PF Payı
  totalOxivoPay?: number; // Toplam OXİVO Payı
  aktif?: boolean; // Aktif/Pasif durumu
}

export interface BankPF {
  id: string;
  firmaUnvan: string;
  muhasebeKodu: string;
  bankaOrPF: 'Banka' | 'PF';
  bankaPFAd: string;
  odemeKurulusuTipi: 'ÖK' | 'EPK' | '';
  odemeKurulusuAd: string;
  vergiDairesi: string;
  vergiNo: string;
  adres: string;
  telefon: string;
  email: string;
  iletisimMatrisi: ContactPerson[];
  dokumanlar: Document[];
  isbirlikleri: Collaboration[];
  tabelaRecords?: TabelaRecord[];
  agreementBanks?: string[]; // Anlaşmalı banka ID'leri
  agreementEPKs?: string[]; // Anlaşmalı EPK ID'leri
  agreementOKs?: string[]; // Anlaşmalı ÖK ID'leri
  tabelaGroups?: TabelaGroup[]; // TABELA grupları
  hakedisRecords?: HakedisRecord[]; // Hakediş kayıtları
  // Kategori ilişkilendirmeleri (Tanımlar sayfasından)
  linkedBankIds?: string[]; // Bağlı Banka ID'leri
  linkedEPKIds?: string[]; // Bağlı EPK ID'leri
  linkedOKIds?: string[]; // Bağlı ÖK ID'leri
  // ✅ EPK ve ÖK Numaraları
  epkNo?: string; // EPK numarası (EPK ise doldurulur)
  okNo?: string; // ÖK numarası (ÖK ise doldurulur)
  durum: 'Aktif' | 'Pasif';
}

// Örnek Banka/PF Adları (kullanıcı daha sonra sağlayacak)
export const bankaPFListesi = [
  'Türkiye İş Bankası A.Ş.',
  'Ziraat Bankası A.Ş.',
  'Garanti BBVA',
  'Akbank T.A.Ş.',
  'Yapı Kredi Bankası',
  'QNB Finansbank',
  'Halkbank',
  'DenizBank',
  'Vakıfbank',
  'İNG Bank',
  'PayFlex',
  'Masterpass',
  'Paycell',
  'BKM Express',
];

// Örnek ÖK Listesi (kullanıcı daha sonra sağlayacak)
export const okListesi = [
  'Intertech Bilgi İşlem ve Pazarlama Tic. A.Ş.',
  'Fintech Ödeme Hizmetleri A.Ş.',
  'Moka Ödeme Hizmetleri A.Ş.',
  'İyzico Ödeme Hizmetleri A.Ş.',
  'PayTR Ödeme ve Elektronik Para Hizmetleri A.Ş.',
];

// Örnek EPK Listesi (kullanıcı daha sonra sağlayacak)
export const epkListesi = [
  'Papara Elektronik Para ve Ödeme Hizmetleri A.Ş.',
  'Ininal Elektronik Para ve Ödeme Hizmetleri A.Ş.',
  'BKM Express Elektronik Para A.Ş.',
  'Tosla Teknoloji A.Ş.',
];

// Örnek Görev/Ünvan Listesi (Tanımlar sayfasından gelecek)
export const gorevListesi = [
  'Genel Müdür',
  'Genel Müdür Yardımcısı',
  'Finans Direktörü',
  'Satış Direktörü',
  'Pazarlama Direktörü',
  'IT Direktörü',
  'İnsan Kaynakları Müdürü',
  'Muhasebe Müdürü',
  'Uyum Müdürü',
  'Risk Yöneticisi',
  'Proje Yöneticisi',
  'Müşteri İlişkileri Müdürü',
  'Teknik Destek Uzmanı',
  'İş Geliştirme Uzmanı',
];

// Örnek veriler - Başlangıçta boş, kullanıcı kendi verilerini ekleyecek
export const mockBankPFData: BankPF[] = [];

interface BankPFModuleProps {
  gorevListesi?: string[];
  gelirModelleri?: Array<{ id: string; ad: string; aktif: boolean }>;
  ekGelirler?: EkGelir[];
  hesapKalemleri?: Array<{ 
    id: string; 
    kod: string; 
    adi: string; 
    aciklama: string;
    aktif: boolean;
  }>;
  banks?: Array<{ id: string; kod: string; bankaAdi: string; aktif: boolean }>;
  epkList?: Array<{ id: string; kod: string; kurumAdi: string; aktif: boolean }>;
  okList?: Array<{ id: string; kod: string; kurumAdi: string; aktif: boolean }>;
  kartProgramlar?: Array<{ id: string; kartAdi: string; aktif: boolean }>;
  bankPFRecords?: BankPF[];
  onBankPFRecordsChange?: (records: BankPF[]) => void;
  tabelaRecords?: TabelaRecord[];
  onTabelaRecordsChange?: (records: TabelaRecord[]) => void;
  selectedBankPFId?: string | null;
  onClearSelectedBankPFId?: () => void;
  onDeleteBankPF?: (id: string) => void; // Müşteri referanslarını temizlemek için
}

// PERFORMANCE: React.memo prevents unnecessary re-renders
export const BankPFModule = React.memo(function BankPFModule({ 
  gorevListesi = gorevListesi as string[],
  gelirModelleri = [],
  ekGelirler = [],
  hesapKalemleri = [],
  banks = [],
  epkList = [],
  okList = [],
  kartProgramlar = [],
  bankPFRecords = [],
  onBankPFRecordsChange,
  tabelaRecords = [],
  onTabelaRecordsChange,
  selectedBankPFId = null,
  onClearSelectedBankPFId,
  onDeleteBankPF
}: BankPFModuleProps) {
  const [selectedRecord, setSelectedRecord] = useState<BankPF | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Müşteri detayından geldiğinde otomatik açma
  useEffect(() => {
    if (selectedBankPFId) {
      // ✅ NULL SAFETY: bankPFRecords boş olabilir
      const record = (bankPFRecords || []).find(r => r.id === selectedBankPFId);
      if (record) {
        setSelectedRecord(record);
        setIsCreating(false);
      }
      // ID'yi temizle
      onClearSelectedBankPFId?.();
    }
  }, [selectedBankPFId, bankPFRecords, onClearSelectedBankPFId]);
  
  // Yeni kayıt dialog state
  const [isNewRecordDialogOpen, setIsNewRecordDialogOpen] = useState(false);
  const [selectedKategori, setSelectedKategori] = useState<'Banka' | 'EPK' | 'ÖK' | ''>('');
  const [selectedKurulus, setSelectedKurulus] = useState('');
  const [newRecordData, setNewRecordData] = useState({
    firmaUnvan: '',
    muhasebeKodu: '',
    bankaOrPF: 'Banka' as 'Banka' | 'PF',
    bankaPFAd: '',
    odemeKurulusuTipi: '' as 'ÖK' | 'EPK' | '',
    odemeKurulusuAd: '',
    vergiDairesi: '',
    vergiNo: '',
    adres: '',
    telefon: '',
    email: '',
    // ✅ EPK ve ÖK No alanları
    epkNo: '',
    okNo: '',
  });

  const handleSaveRecord = async (record: BankPF) => {
    if (isCreating) {
      // ✅ UUID GENERATION: Native crypto.randomUUID() for Supabase compatibility
      const newRecords = [...bankPFRecords, { ...record, id: record.id || crypto.randomUUID() }];
      onBankPFRecordsChange?.(newRecords);
      
      // ✅ INSTANT SYNC: Yeni kayıt hemen Supabase'e yazılsın
      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(record.id);
        console.log(`✅ Banka-PF kaydı oluşturuldu: ${record.id} ${isUUID ? '(UUID ✅)' : '(TIMESTAMP ❌)'}`);
        if (!isUUID) {
          console.error('🚨 CACHE SORUNU: Browser eski JavaScript kodunu çalıştırıyor! Hard refresh gerekli (Ctrl+Shift+R)');
        }
        await bankPFApi.create(record);
        toast.success('Kayıt eklendi ve Supabase\'e senkronize edildi');
      } catch (error) {
        if (!isFigmaMakeEnvironment()) {
          console.error('Supabase sync hatası:', error);
        }
        toast.error('Kayıt eklendi ama Supabase senkronizasyonu başarısız');
      }
      
      setIsCreating(false);
      setSelectedRecord(null);
    } else {
      const updatedRecords = bankPFRecords.map((r) => (r.id === record.id ? record : r));
      onBankPFRecordsChange?.(updatedRecords);
      
      // ✅ INSTANT SYNC: Güncelleme hemen Supabase'e yazılsın
      try {
        await bankPFApi.create(record);
        toast.success('Kayıt güncellendi ve Supabase\'e senkronize edildi');
        
        // ✅ FIX: Supabase'den güncel veriyi çek (tabelaRecords dahil)
        const refreshedData = await bankPFApi.getAll();
        if (refreshedData.success && refreshedData.data) {
          console.log('🔄 BankPFModule: Supabase\'den yeniden çekildi', {
            totalRecords: refreshedData.data.length,
            updatedRecordId: record.id
          });
          
          // Parent state'i güncelle
          onBankPFRecordsChange?.(refreshedData.data);
          
          // selectedRecord'u güncel veriden bul ve set et
          const refreshedRecord = refreshedData.data.find(r => r.id === record.id);
          if (refreshedRecord) {
            console.log('✅ BankPFModule: refreshedRecord bulundu', {
              id: refreshedRecord.id,
              firmaAdi: refreshedRecord.firmaUnvan,
              tabelaCount: refreshedRecord.tabelaRecords?.length || 0,
              tabelaIds: refreshedRecord.tabelaRecords?.map(t => t.id) || []
            });
            setSelectedRecord(refreshedRecord);
          } else {
            console.error('❌ BankPFModule: refreshedRecord BULUNAMADI!', record.id);
          }
        }
      } catch (error) {
        if (!isFigmaMakeEnvironment()) {
          console.error('Supabase sync hatası:', error);
        }
        toast.error('Kayıt güncellendi ama Supabase senkronizasyonu başarısız');
      }
      
      // Otomatik kaydetme durumunda sayfadan atma!
      // setSelectedRecord(null); // Bu satırı kaldırdık
      // Güncellenen kaydı yeniden set et (state'i güncel tut)
      // setSelectedRecord(record); // ✅ ARTIK GEREK YOK - yukarıda refreshedRecord set ediliyor
    }
  };

  const handleDeleteRecord = async (id: string) => {
    const deletedRecord = bankPFRecords.find(r => r.id === id);
    const filteredRecords = bankPFRecords.filter((r) => r.id !== id);
    
    // BankPF kaydını sil
    onBankPFRecordsChange?.(filteredRecords);
    
    // ✅ INSTANT SYNC: Silme işlemi hemen Supabase'e yansısın
    try {
      await bankPFApi.delete(id);
      console.log('✅ Kayıt Supabase\'den silindi');
    } catch (error) {
      console.error('❌ Supabase silme hatası:', error);
      toast.error('Kayıt silindi ama Supabase senkronizasyonu başarısız');
    }
    
    // Parent component'e bildir (müşteri referanslarını temizlemesi için)
    onDeleteBankPF?.(id);
    
    setSelectedRecord(null);
    
    // Bilgilendirme mesajı
    toast.success(
      `Banka/PF kaydı silindi: ${deletedRecord?.firmaUnvan || 'Kayıt'}\nİlişkili müşteri bağlantıları temizlendi`,
      { duration: 4000 }
    );
  };

  const handleCreateNew = () => {
    // Dialog'u aç
    setSelectedKategori('');
    setSelectedKurulus('');
    setNewRecordData({
      firmaUnvan: '',
      muhasebeKodu: '',
      bankaOrPF: 'Banka',
      bankaPFAd: '',
      odemeKurulusuTipi: '',
      odemeKurulusuAd: '',
      vergiDairesi: '',
      vergiNo: '',
      adres: '',
      telefon: '',
      email: '',
      // ✅ EPK ve ÖK No alanları
      epkNo: '',
      okNo: '',
    });
    setIsNewRecordDialogOpen(true);
  };

  const handleKurulusSelect = (kurulusId: string) => {
    setSelectedKurulus(kurulusId);
    
    if (selectedKategori === 'Banka') {
      const banka = banks.find(b => b.id === kurulusId);
      if (banka) {
        setNewRecordData({
          ...newRecordData,
          firmaUnvan: banka.bankaAdi,
          muhasebeKodu: banka.kod,
          bankaOrPF: 'Banka',
          bankaPFAd: banka.bankaAdi,
          odemeKurulusuTipi: '',
          odemeKurulusuAd: '',
        });
        if (banka.aciklama) {
          toast.info(`ℹ️ ${banka.aciklama}`);
        }
      }
    } else if (selectedKategori === 'EPK') {
      const epk = epkList.find(e => e.id === kurulusId);
      if (epk) {
        setNewRecordData({
          ...newRecordData,
          firmaUnvan: epk.kurumAdi,
          muhasebeKodu: epk.kod,
          bankaOrPF: 'PF',
          bankaPFAd: '',
          odemeKurulusuTipi: 'EPK',
          odemeKurulusuAd: epk.kurumAdi,
          // ✅ EPK No'yu doldur
          epkNo: epk.kod,
        });
        if (epk.aciklama) {
          toast.info(`ℹ️ ${epk.aciklama}`);
        }
      }
    } else if (selectedKategori === 'ÖK') {
      const ok = okList.find(o => o.id === kurulusId);
      if (ok) {
        setNewRecordData({
          ...newRecordData,
          firmaUnvan: ok.kurumAdi,
          muhasebeKodu: ok.kod,
          bankaOrPF: 'PF',
          bankaPFAd: '',
          odemeKurulusuTipi: 'ÖK',
          odemeKurulusuAd: ok.kurumAdi,
          // ✅ ÖK No'yu doldur
          okNo: ok.kod,
        });
        if (ok.aciklama) {
          toast.info(`ℹ️ ${ok.aciklama}`);
        }
      }
    }
  };

  const handleSaveNewRecord = async () => {
    // Zorunlu alanları kontrol et
    if (!selectedKategori) {
      toast.error('Kuruluş kategorisi seçmelisiniz');
      return;
    }
    if (!selectedKurulus) {
      toast.error('Kuruluş seçmelisiniz');
      return;
    }
    if (!newRecordData.firmaUnvan.trim()) {
      toast.error('Firma ünvanı zorunludur');
      return;
    }
    if (!newRecordData.muhasebeKodu.trim()) {
      toast.error('Muhasebe kodu zorunludur');
      return;
    }

    // ✅ UUID GENERATION: Yeni kayıt oluştur
    const newRecord: BankPF = {
      ...newRecordData,
      id: crypto.randomUUID(),
      iletisimMatrisi: [],
      dokumanlar: [],
      isbirlikleri: [],
      tabelaRecords: [],
      agreementBanks: [],
      tabelaGroups: [],
      durum: 'Aktif',
    };

    // Listeye ekle
    const newRecords = [...bankPFRecords, newRecord];
    onBankPFRecordsChange?.(newRecords);
    
    // ✅ INSTANT SYNC: Yeni kayıt hemen Supabase'e yazılsın
    try {
      await bankPFApi.create(newRecord);
      toast.success(`${newRecordData.firmaUnvan} başarıyla eklendi ve Supabase'e senkronize edildi`);
    } catch (error) {
      if (!isFigmaMakeEnvironment()) {
        console.error('Supabase sync hatası:', error);
      }
      toast.error('Kayıt eklendi ama Supabase senkronizasyonu başarısız');
    }
    
    setIsNewRecordDialogOpen(false);
  };

  if (selectedRecord || isCreating) {
    return (
      <BankPFDetail
        record={selectedRecord}
        onSave={handleSaveRecord}
        onCancel={() => {
          setSelectedRecord(null);
          setIsCreating(false);
        }}
        onDelete={handleDeleteRecord}
        isCreating={isCreating}
        gorevListesi={gorevListesi}
        gelirModelleri={gelirModelleri}
        ekGelirler={ekGelirler}
        hesapKalemleri={hesapKalemleri}
        banks={banks}
        epkList={epkList}
        okList={okList}
        kartProgramlar={kartProgramlar}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Banka / PF - Ödeme Kuruluşları</h2>
          <p className="text-xs sm:text-sm font-medium text-gray-600">Banka ve ödeme kuruluşu kayıtlarını yönetin</p>
        </div>
        <Button size="default" onClick={handleCreateNew} className="flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-shadow w-full sm:w-auto">
          <Plus size={18} />
          <span>Yeni Kayıt</span>
        </Button>
      </div>

      <BankPFList
        records={bankPFRecords}
        onSelectRecord={setSelectedRecord}
        banks={banks}
        epkList={epkList}
        okList={okList}
      />

      {/* Yeni Kayıt Dialog */}
      <Dialog open={isNewRecordDialogOpen} onOpenChange={setIsNewRecordDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Banka / PF Kaydı</DialogTitle>
            <DialogDescription>
              Cari bilgilerini girerek yeni kayıt oluşturun
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Kategori Seçimi */}
            <ModernFormSelect
              label="Kuruluş Kategorisi"
              options={[
                { value: 'Banka', label: 'Banka' },
                { value: 'EPK', label: 'EPK (Elektronik Para Kuruluşu)' },
                { value: 'ÖK', label: 'ÖK (Ödeme Kuruluşu)' }
              ]}
              value={selectedKategori}
              onChange={(value: string) => {
                const kategori = value as 'Banka' | 'EPK' | 'ÖK';
                setSelectedKategori(kategori);
                setSelectedKurulus('');
                setNewRecordData({
                  firmaUnvan: '',
                  muhasebeKodu: '',
                  bankaOrPF: kategori === 'Banka' ? 'Banka' : 'PF',
                  bankaPFAd: '',
                  odemeKurulusuTipi: kategori === 'Banka' ? '' : kategori,
                  odemeKurulusuAd: '',
                  vergiDairesi: '',
                  vergiNo: '',
                  adres: '',
                  telefon: '',
                  email: '',
                  // ✅ EPK ve ÖK No alanları
                  epkNo: '',
                  okNo: '',
                });
              }}
              placeholder="Kategori seçiniz..."
              required
            />

            {/* Kuruluş Seçimi */}
            {selectedKategori && (
              <ModernFormSelect
                label={`${selectedKategori === 'Banka' ? 'Banka' : selectedKategori} Adı`}
                options={
                  selectedKategori === 'Banka'
                    ? banks.filter(b => b.aktif).length === 0
                      ? [{ value: 'none', label: "Tanımlar'da aktif banka bulunamadı", disabled: true }]
                      : banks.filter(b => b.aktif).map(banka => ({
                          value: banka.id,
                          label: `${banka.kod} - ${banka.bankaAdi}`
                        }))
                    : selectedKategori === 'EPK'
                    ? epkList.filter(e => e.aktif).length === 0
                      ? [{ value: 'none', label: "Tanımlar'da aktif EPK bulunamadı", disabled: true }]
                      : epkList.filter(e => e.aktif).map(epk => ({
                          value: epk.id,
                          label: `${epk.kod} - ${epk.kurumAdi}`
                        }))
                    : okList.filter(o => o.aktif).length === 0
                    ? [{ value: 'none', label: "Tanımlar'da aktif ÖK bulunamadı", disabled: true }]
                    : okList.filter(o => o.aktif).map(ok => ({
                        value: ok.id,
                        label: `${ok.kod} - ${ok.kurumAdi}`
                      }))
                }
                value={selectedKurulus}
                onChange={handleKurulusSelect}
                placeholder={`${selectedKategori} seçiniz...`}
                required
              />
            )}

            {/* Seçilen Kuruluş Bilgileri */}
            {selectedKurulus && (() => {
              const kurulusInfo = selectedKategori === 'Banka' 
                ? banks.find(b => b.id === selectedKurulus)
                : selectedKategori === 'EPK'
                ? epkList.find(e => e.id === selectedKurulus)
                : okList.find(o => o.id === selectedKurulus);
              
              return kurulusInfo ? (
                <div className="bg-blue-50 border border-blue-200 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm bg-blue-600 text-white px-2 py-1 rounded">
                      {selectedKategori}
                    </span>
                    <h4 className="text-blue-900">Seçili Kuruluş Bilgileri</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Kod:</span>
                      <span className="ml-2">{kurulusInfo.kod}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Ad:</span>
                      <span className="ml-2">
                        {selectedKategori === 'Banka' 
                          ? (kurulusInfo as any).bankaAdi 
                          : (kurulusInfo as any).kurumAdi}
                      </span>
                    </div>
                  </div>
                  {kurulusInfo.aciklama && (
                    <div className="text-sm">
                      <span className="text-gray-600">Açıklama:</span>
                      <p className="mt-1 text-gray-700">{kurulusInfo.aciklama}</p>
                    </div>
                  )}
                </div>
              ) : null;
            })()}

            {/* Firma Ünvanı (Otomatik doldurulur) */}
            {selectedKurulus && (
              <div className="space-y-2">
                <Label>Firma Ünvanı <span className="text-red-500">*</span></Label>
                <Input
                  value={newRecordData.firmaUnvan}
                  onChange={(e) => setNewRecordData({ ...newRecordData, firmaUnvan: e.target.value })}
                  placeholder="Örn: ABC Teknoloji A.Ş."
                  className="bg-blue-50"
                />
                <p className="text-xs text-blue-600">✓ Otomatik dolduruldu - gerekirse düzenleyebilirsiniz</p>
              </div>
            )}

            {/* Muhasebe Kodu (Otomatik doldurulur) */}
            {selectedKurulus && (
              <div className="space-y-2">
                <Label>Muhasebe Kodu <span className="text-red-500">*</span></Label>
                <Input
                  value={newRecordData.muhasebeKodu}
                  onChange={(e) => setNewRecordData({ ...newRecordData, muhasebeKodu: e.target.value })}
                  placeholder="Örn: 120.01.001"
                  className="bg-blue-50"
                />
                <p className="text-xs text-blue-600">✓ Otomatik dolduruldu - gerekirse düzenleyebilirsiniz</p>
              </div>
            )}

            {/* Vergi Dairesi */}
            {selectedKurulus && (
              <>
                <div className="space-y-2">
                  <Label>Vergi Dairesi</Label>
                  <Input
                    value={newRecordData.vergiDairesi}
                    onChange={(e) => setNewRecordData({ ...newRecordData, vergiDairesi: e.target.value })}
                    placeholder="Örn: Kadıköy Vergi Dairesi"
                  />
                </div>

                {/* Vergi Numarası */}
                <div className="space-y-2">
                  <Label>Vergi Numarası</Label>
                  <Input
                    value={newRecordData.vergiNo}
                    onChange={(e) => setNewRecordData({ ...newRecordData, vergiNo: e.target.value })}
                    placeholder="10 haneli vergi numarası"
                    maxLength={10}
                  />
                </div>

                {/* Adres */}
                <div className="space-y-2">
                  <Label>Adres</Label>
                  <Input
                    value={newRecordData.adres}
                    onChange={(e) => setNewRecordData({ ...newRecordData, adres: e.target.value })}
                    placeholder="Tam adres"
                  />
                </div>

                {/* Telefon */}
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input
                    value={newRecordData.telefon}
                    onChange={(e) => setNewRecordData({ ...newRecordData, telefon: e.target.value })}
                    placeholder="Örn: +90 212 123 45 67"
                  />
                </div>

                {/* E-posta */}
                <div className="space-y-2">
                  <Label>E-posta</Label>
                  <Input
                    type="email"
                    value={newRecordData.email}
                    onChange={(e) => setNewRecordData({ ...newRecordData, email: e.target.value })}
                    placeholder="Örn: info@firma.com"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="default" onClick={() => setIsNewRecordDialogOpen(false)}>
              İptal
            </Button>
            <Button 
              size="default"
              onClick={handleSaveNewRecord}
              disabled={!selectedKurulus}
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});