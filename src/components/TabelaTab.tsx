import React, { useState } from 'react';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Plus, Pencil, Trash2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { signApi } from '../utils/supabaseClient';

export type TabelaRecord = {
  id: string;
  kurulus: { tip: 'EPK' | 'OK'; id: string; ad: string };
  musteri?: string; // Müşteri adı (cariAdi)
  urun?: 'UnattendedPOS' | 'AttendedPOS' | 'SoftPOS' | 'SanalPOS'; // Ürün tipi
  urunTipi?: string; // Ürün tipi (string olarak da saklanabilir)
  kartTipi: 'Credit' | 'Debit' | 'Paçal';
  gelirModeli: { id: string; ad: string };
  bankIds?: string[]; // Anlaşmalı banka ID'leri (eski kayıtlar için - artık kullanılmıyor)
  kartProgramIds?: string[]; // Kart program ID'leri (yeni)
  yurtIciDisi: 'Yurt İçi' | 'Yurt Dışı';
  komisyonOranları: { 
    vade: string; 
    oran?: string; // % için (Sabit Komisyon)
    alisTL?: number | string; // Gelir Ortaklığı için (string olarak da saklanabilir)
    satisTL?: number | string; // Gelir Ortaklığı için (string olarak da saklanabilir)
    karTL?: number | string; // Gelir Ortaklığı için (otomatik hesaplanan, string olarak da saklanabilir)
    aktif: boolean; // Vade aktif/pasif durumu
  }[];
  // Hazine Geliri için özel alanlar
  hazineGeliri?: {
    tutarTL: string;
    oxivoYuzde: string;
    kazancTL: string;
  };
  // Ek Gelir bilgileri - Hazine Geliri seçildiğinde
  ekGelirDetay?: {
    id: string;
    kodNo: string;
    gelirTuru: string; // Hazine Geliri vb.
    kullanim: string; // Yurt İçi / Yurt Dışı
    kartTipi: string;
    tutar: string;
    pfYuzde: string;
    pfTL: string;
    oxYuzde: string;
    oxTL: string;
  };
  paylaşımOranları: { kurulusOrani: string; oxivoOrani: string };
  kurulusOrani?: number; // Kuruluş oranı (sayısal)
  oxivoOrani?: number; // OXIVO oranı (sayısal)
  kisaAciklama?: string; // Kısa açıklama (maksimum 15 karakter)
  aciklama?: string; // Açıklama alanı
  fotograf?: string; // Fotoğraf URL veya base64
  olusturmaTarihi: string;
  kapanmaTarihi?: string; // Anlaşma kapanış tarihi
  aktif: boolean;
};

// TABELA Grup tipi
export type TabelaGroup = {
  id: string;
  name: string;
  gecerlilikBaslangic: string;
  gecerlilikBitis?: string; // Opsiyonel - süresiz için boş
  recordIds: string[]; // Bu gruba dahil TABELA kayıt ID'leri
  pinned: boolean; // Sabitlenmiş/sabitlenmemiş
  aktif: boolean; // Grup aktif/pasif durumu
};

// Vade listesi
const vadeListesi = [
  'D+1',
  'D+7',
  'D+14',
  'D+31',
];

interface TabelaTabProps {
  epkList?: Array<{ id: string; kod: string; kurumAdi: string; aktif: boolean }>;
  okList?: Array<{ id: string; kod: string; kurumAdi: string; aktif: boolean }>;
  gelirModelleri?: Array<{ id: string; ad: string; aktif: boolean }>;
  tabelaRecords?: TabelaRecord[];
  onTabelaRecordsChange?: (records: TabelaRecord[]) => void;
}

export function TabelaTab({
  epkList = [],
  okList = [],
  gelirModelleri = [],
  tabelaRecords = [],
  onTabelaRecordsChange,
}: TabelaTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TabelaRecord | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [kurulusTipi, setKurulusTipi] = useState<'EPK' | 'OK' | ''>('');
  const [kurulusId, setKurulusId] = useState('');
  const [kartTipi, setKartTipi] = useState<'Credit' | 'Debit' | 'Paçal' | ''>('');
  const [gelirModeliId, setGelirModeliId] = useState('');
  const [yurtIciDisi, setYurtIciDisi] = useState<'Yurt İçi' | 'Yurt Dışı' | ''>('');
  const [komisyonOranları, setKomisyonOranları] = useState<{ 
    vade: string; 
    oran: string;
    alisTL?: string;
    satisTL?: string;
    karTL?: string;
    aktif: boolean;
  }[]>(
    vadeListesi.map(v => ({ vade: v, oran: '', alisTL: '', satisTL: '', karTL: '', aktif: true }))
  );
  const [kurulusOrani, setKurulusOrani] = useState('');
  const [oxivoOrani, setOxivoOrani] = useState('');
  
  // Hazine Geliri için state
  const [hazineGeliri, setHazineGeliri] = useState({
    tutarTL: '',
    oxivoYuzde: '',
    kazancTL: ''
  });
  
  // ✅ Ek Gelir için state
  const [ekGelir, setEkGelir] = useState({
    kodNo: '',
    gelirTuru: '',
    kullanim: '',
    kartTipi: '',
    tutar: '',
    pfYuzde: '',
    pfTL: '',
    oxYuzde: '',
    oxTL: ''
  });

  const aktifEPKList = epkList.filter(e => e.aktif);
  const aktifOKList = okList.filter(o => o.aktif);
  const aktifGelirModelleri = gelirModelleri.filter(g => g.aktif);

  const resetForm = () => {
    setKurulusTipi('');
    setKurulusId('');
    setKartTipi('');
    setGelirModeliId('');
    setYurtIciDisi('');
    setKomisyonOranları(vadeListesi.map(v => ({ vade: v, oran: '', alisTL: '', satisTL: '', karTL: '', aktif: true })));
    setKurulusOrani('');
    setOxivoOrani('');
    setHazineGeliri({ tutarTL: '', oxivoYuzde: '', kazancTL: '' });
    setEkGelir({ kodNo: '', gelirTuru: '', kullanim: '', kartTipi: '', tutar: '', pfYuzde: '', pfTL: '', oxYuzde: '', oxTL: '' });
    setCurrentStep(1);
    setEditingRecord(null);
  };

  const handleOpenDialog = (record?: TabelaRecord) => {
    if (record) {
      setEditingRecord(record);
      setKurulusTipi(record.kurulus?.tip || '');
      setKurulusId(record.kurulus?.id || '');
      setKartTipi(record.kartTipi);
      setGelirModeliId(record.gelirModeli?.id || '');
      setYurtIciDisi(record.yurtIciDisi);
      setKomisyonOranları(record.komisyonOranları);
      setKurulusOrani(record.paylaşımOranları?.kurulusOrani || '');
      setOxivoOrani(record.paylaşımOranları?.oxivoOrani || '');
      setHazineGeliri(record.hazineGeliri || { tutarTL: '', oxivoYuzde: '', kazancTL: '' });
      setEkGelir(record.ekGelirDetay || { kodNo: '', gelirTuru: '', kullanim: '', kartTipi: '', tutar: '', pfYuzde: '', pfTL: '', oxYuzde: '', oxTL: '' });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  // Hazine Geliri hesaplama fonksiyonları
  const handleHazineTutarTLChange = (value: string) => {
    const tutarTL = value;
    const oxivoYuzde = hazineGeliri.oxivoYuzde;
    
    if (tutarTL && oxivoYuzde) {
      const tutar = parseFloat(tutarTL);
      const yuzde = parseFloat(oxivoYuzde);
      if (!isNaN(tutar) && !isNaN(yuzde)) {
        const kazanc = (tutar * yuzde) / 100;
        setHazineGeliri({
          tutarTL,
          oxivoYuzde,
          kazancTL: kazanc.toFixed(2)
        });
        return;
      }
    }
    
    setHazineGeliri({ ...hazineGeliri, tutarTL });
  };

  const handleHazineOxivoYuzdeChange = (value: string) => {
    const oxivoYuzde = value;
    const tutarTL = hazineGeliri.tutarTL;
    
    if (tutarTL && oxivoYuzde) {
      const tutar = parseFloat(tutarTL);
      const yuzde = parseFloat(oxivoYuzde);
      if (!isNaN(tutar) && !isNaN(yuzde)) {
        const kazanc = (tutar * yuzde) / 100;
        setHazineGeliri({
          tutarTL,
          oxivoYuzde,
          kazancTL: kazanc.toFixed(2)
        });
        return;
      }
    }
    
    setHazineGeliri({ ...hazineGeliri, oxivoYuzde });
  };

  const handleHazineKazancTLChange = (value: string) => {
    const kazancTL = value;
    const tutarTL = hazineGeliri.tutarTL;
    
    if (tutarTL && kazancTL) {
      const tutar = parseFloat(tutarTL);
      const kazanc = parseFloat(kazancTL);
      if (!isNaN(tutar) && !isNaN(kazanc) && tutar !== 0) {
        const yuzde = (kazanc / tutar) * 100;
        setHazineGeliri({
          tutarTL,
          oxivoYuzde: yuzde.toFixed(2),
          kazancTL
        });
        return;
      }
    }
    
    setHazineGeliri({ ...hazineGeliri, kazancTL });
  };

  const handleNext = () => {
    // Adım 1 Validasyonu
    if (currentStep === 1) {
      if (!kurulusTipi) {
        toast.error('❌ Lütfen kuruluş tipi seçiniz (EPK veya ÖK)');
        return;
      }
      if (!kurulusId) {
        toast.error(`❌ Lütfen ${kurulusTipi} seçiniz`);
        return;
      }
      
      // Seçilen kuruluşun gerçekten var olduğunu kontrol et
      const kurulusList = kurulusTipi === 'EPK' ? aktifEPKList : aktifOKList;
      const kurulus = kurulusList.find(k => k.id === kurulusId);
      if (!kurulus) {
        toast.error('❌ Seçilen kuruluş bulunamadı');
        return;
      }
      
      toast.success(`✅ Kuruluş seçildi: ${kurulus.kurumAdi}`);
    } 
    
    // Adım 2 Validasyonu
    else if (currentStep === 2) {
      if (!gelirModeliId) {
        toast.error('❌ Lütfen gelir modeli seçiniz');
        return;
      }
      
      // Seçilen gelir modelinin gerçekten var olduğunu kontrol et
      const gelirModeli = aktifGelirModelleri.find(g => g.id === gelirModeliId);
      if (!gelirModeli) {
        toast.error('❌ Seçilen gelir modeli bulunamadı');
        return;
      }
      
      toast.success(`✅ Gelir modeli seçildi: ${gelirModeli?.ad || 'Gelir Modeli'}`);
    } 
    
    // ✅ Adım 3 Validasyonu (Ek Gelir - Opsiyonel)
    else if (currentStep === 3) {
      // Ek gelir opsiyonel, validation yok
      if (ekGelir.kodNo || ekGelir.tutar) {
        toast.success('✅ Ek gelir bilgileri kaydedildi');
      } else {
        toast.info('ℹ️ Ek gelir bilgisi atlandı');
      }
    }
    
    // Adım 4 Validasyonu (Yurt İçi/Dışı)
    else if (currentStep === 4) {
      if (!yurtIciDisi) {
        toast.error('❌ Lütfen Yurt İçi veya Yurt Dışı seçimi yapınız');
        return;
      }
      
      toast.success(`✅ ${yurtIciDisi} seçildi`);
    }
    
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSave = async () => {
    const kurulusList = kurulusTipi === 'EPK' ? aktifEPKList : aktifOKList;
    const selectedKurulus = kurulusList.find(k => k.id === kurulusId);
    const selectedGelirModeli = aktifGelirModelleri.find(g => g.id === gelirModeliId);

    if (!selectedKurulus || !selectedGelirModeli) {
      toast.error('Seçim hatası oluştu');
      return;
    }

    // Hazine Geliri kontrolü
    const isHazineGeliri = selectedGelirModeli.ad === 'Hazine Geliri';
    if (isHazineGeliri) {
      if (!hazineGeliri.tutarTL || !hazineGeliri.oxivoYuzde || !hazineGeliri.kazancTL) {
        toast.error('Hazine Geliri için Tutar TL, OXiVO % ve Kazanç TL alanları doldurulmalıdır');
        return;
      }
    } else {
      // Diğer gelir modelleri için kart tipi zorunlu
      if (!kartTipi) {
        toast.error('Lütfen kart tipi seçiniz');
        return;
      }
    }

    const newRecord: TabelaRecord = {
      id: editingRecord?.id || Date.now().toString(),
      kurulus: {
        tip: kurulusTipi as 'EPK' | 'OK',
        id: selectedKurulus.id,
        ad: selectedKurulus.kurumAdi,
      },
      kartTipi: isHazineGeliri ? 'Credit' : (kartTipi as 'Credit' | 'Debit' | 'Paçal'),
      gelirModeli: {
        id: selectedGelirModeli.id,
        ad: selectedGelirModeli.ad,
      },
      yurtIciDisi: yurtIciDisi as 'Yurt İçi' | 'Yurt Dışı',
      komisyonOranları: isHazineGeliri ? [] : komisyonOranları, // Hazine Geliri için boş array
      // Hazine Geliri seçilmişse özel alanları ekle
      ...(isHazineGeliri && {
        hazineGeliri: {
          tutarTL: hazineGeliri.tutarTL,
          oxivoYuzde: hazineGeliri.oxivoYuzde,
          kazancTL: hazineGeliri.kazancTL
        }
      }),
      // ✅ Ek Gelir bilgileri (eğer girilmişse)
      ...((ekGelir.kodNo || ekGelir.tutar) && {
        ekGelirDetay: {
          id: editingRecord?.ekGelirDetay?.id || `eg-${Date.now()}`,
          kodNo: ekGelir.kodNo,
          gelirTuru: ekGelir.gelirTuru,
          kullanim: ekGelir.kullanim,
          kartTipi: ekGelir.kartTipi,
          tutar: ekGelir.tutar,
          pfYuzde: ekGelir.pfYuzde,
          pfTL: ekGelir.pfTL,
          oxYuzde: ekGelir.oxYuzde,
          oxTL: ekGelir.oxTL
        }
      }),
      paylaşımOranları: {
        kurulusOrani: isHazineGeliri ? '0' : '50', // Default değerler
        oxivoOrani: isHazineGeliri ? '100' : '50',
      },
      olusturmaTarihi: editingRecord?.olusturmaTarihi || new Date().toISOString(),
      aktif: editingRecord?.aktif ?? true,
    };

    // ✅ Supabase'e kaydet
    try {
      const result = await signApi.create(newRecord);
      if (result.success) {
        console.log('✅ TABELA kaydı Supabase\'e kaydedildi:', newRecord.id);
      } else {
        console.warn('⚠️ Supabase kaydetme hatası:', result.error);
        toast.warning('Kayıt yerel olarak kaydedildi ancak Supabase senkronizasyonu başarısız');
      }
    } catch (error) {
      console.error('❌ Supabase kaydetme hatası:', error);
    }

    if (editingRecord) {
      const updatedRecords = tabelaRecords.map(r => (r.id === editingRecord.id ? newRecord : r));
      onTabelaRecordsChange?.(updatedRecords);
      toast.success('Tabela kaydı güncellendi');
    } else {
      const newRecords = [...tabelaRecords, newRecord];
      onTabelaRecordsChange?.(newRecords);
      toast.success('Tabela kaydı eklendi');
    }

    handleCloseDialog();
  };

  const handleDelete = async (id: string) => {
    // ✅ Supabase'den sil
    try {
      const result = await signApi.delete(id);
      if (result.success) {
        console.log('✅ TABELA kaydı Supabase\'den silindi:', id);
      } else {
        console.warn('⚠️ Supabase silme hatası:', result.error);
      }
    } catch (error) {
      console.error('❌ Supabase silme hatası:', error);
    }

    const filteredRecords = tabelaRecords.filter(r => r.id !== id);
    onTabelaRecordsChange?.(filteredRecords);
    toast.success('Tabela kaydı silindi');
  };

  const handleKomisyonChange = (vade: string, value: string) => {
    setKomisyonOranları(
      komisyonOranları.map(k => (k.vade === vade ? { ...k, oran: value } : k))
    );
  };

  const handleAlisTLChange = (vade: string, value: string) => {
    setKomisyonOranları(prevOranlar =>
      prevOranlar.map(k => {
        if (k.vade === vade) {
          const alisTL = parseFloat(value) || 0;
          const satisTL = parseFloat(k.satisTL || '0') || 0;
          const karTL = (satisTL - alisTL).toFixed(2);
          return { ...k, alisTL: value, karTL };
        }
        return k;
      })
    );
  };

  const handleSatisTLChange = (vade: string, value: string) => {
    setKomisyonOranları(prevOranlar =>
      prevOranlar.map(k => {
        if (k.vade === vade) {
          const alisTL = parseFloat(k.alisTL || '0') || 0;
          const satisTL = parseFloat(value) || 0;
          const karTL = (satisTL - alisTL).toFixed(2);
          return { ...k, satisTL: value, karTL };
        }
        return k;
      })
    );
  };

  const handleVadeAktifChange = (vade: string, aktif: boolean) => {
    setKomisyonOranları(prevOranlar =>
      prevOranlar.map(k => k.vade === vade ? { ...k, aktif } : k)
    );
  };

  // Hazine Geliri hesaplama fonksiyonları
  const calculateHazineKazanc = (tutar: string, yuzde: string): string => {
    const tutarNum = parseFloat(tutar) || 0;
    const yuzdeNum = parseFloat(yuzde) || 0;
    return ((tutarNum * yuzdeNum) / 100).toFixed(2);
  };

  const calculateHazineYuzde = (tutar: string, kazanc: string): string => {
    const tutarNum = parseFloat(tutar) || 0;
    const kazancNum = parseFloat(kazanc) || 0;
    if (tutarNum === 0) return '0.00';
    return ((kazancNum / tutarNum) * 100).toFixed(2);
  };

  const handleHazineOxivoYuzdeChange = (value: string) => {
    const kazanc = value ? calculateHazineKazanc(hazineGeliri.tutarTL, value) : '';
    setHazineGeliri({ ...hazineGeliri, oxivoYuzde: value, kazancTL: kazanc });
  };

  const handleHazineKazancTLChange = (value: string) => {
    const yuzde = value ? calculateHazineYuzde(hazineGeliri.tutarTL, value) : '';
    setHazineGeliri({ ...hazineGeliri, kazancTL: value, oxivoYuzde: yuzde });
  };

  const handleHazineTutarTLChange = (value: string) => {
    // Tutar değişince, mevcut yüzdeye göre kazancı yeniden hesapla
    const kazanc = hazineGeliri.oxivoYuzde ? calculateHazineKazanc(value, hazineGeliri.oxivoYuzde) : '';
    setHazineGeliri({ ...hazineGeliri, tutarTL: value, kazancTL: kazanc });
  };

  // Tüm kayıtları göster (artık komisyon %0 filtresi yok)
  const filteredRecords = tabelaRecords;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3>TABELA Yönetimi</h3>
          <p className="text-gray-600">Kuruluş komisyon ve paylaşım oranları</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
          <Plus size={20} />
          Yeni Tabela Kaydı
        </Button>
      </div>

      {filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <CreditCard size={48} className="text-gray-400 mb-4" />
              <h3 className="text-gray-900 mb-2">
                {tabelaRecords.length === 0 
                  ? 'Henüz tabela kaydı bulunmuyor'
                  : 'Tüm TABELA kayıtlarının komisyon oranları %0 (gizlendi)'}
              </h3>
              <p className="text-gray-600 mb-4">
                {tabelaRecords.length === 0 
                  ? 'Yeni bir tabela kaydı oluşturmak için yukarıdaki butona tıklayın.'
                  : `${zeroCommissionCount} kayıt komisyon oranı %0 olduğu için gösterilmiyor.`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kuruluş</TableHead>
                  <TableHead>Gelir Modeli</TableHead>
                  <TableHead>Yurt İçi/Dışı</TableHead>
                  <TableHead>Kart Tipi</TableHead>
                  <TableHead>Komisyon</TableHead>
                  <TableHead>Paylaşım Oranı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map(record => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div>{record.kurulus?.ad || 'Kuruluş Yok'}</div>
                        <div className="text-sm text-gray-500">{record.kurulus?.tip}</div>
                      </div>
                    </TableCell>
                    <TableCell>{record.gelirModeli?.ad || 'Gelir Modeli Yok'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {record.yurtIciDisi}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.kartTipi === 'Credit' ? 'default' : record.kartTipi === 'Debit' ? 'secondary' : 'outline'}>
                        {record.kartTipi}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.gelirModeli?.ad === 'Hazine Geliri' ? (
                        // Hazine Geliri: Tutar, OXiVO %, Kazanç göster
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between gap-2 bg-purple-50 px-2 py-1 rounded">
                            <span className="text-gray-700">Tutar:</span>
                            <span className="text-purple-700">{parseFloat(record.hazineGeliri?.tutarTL || '0').toFixed(2)}₺</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 bg-blue-50 px-2 py-1 rounded">
                            <span className="text-gray-700">OXiVO %:</span>
                            <span className="text-blue-700">%{parseFloat(record.hazineGeliri?.oxivoYuzde || '0').toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 bg-green-50 px-2 py-1 rounded">
                            <span className="text-gray-700">Kazanç:</span>
                            <span className="text-green-700">{parseFloat(record.hazineGeliri?.kazancTL || '0').toFixed(2)}₺</span>
                          </div>
                        </div>
                      ) : record.gelirModeli?.ad === 'Gelir Ortaklığı' ? (
                        // Gelir Ortaklığı: KAR/TL göster
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {record.komisyonOranları.map((ko, idx) => {
                            const vadeLabel = ko.vade;
                            
                            return (
                              <div key={idx} className="flex items-center justify-between gap-1 bg-green-50 px-2 py-0.5 rounded" title={`Alış: ${ko.alisTL || '0.00'}₺ | Satış: ${ko.satisTL || '0.00'}₺`}>
                                <span className="text-gray-700">{vadeLabel}:</span>
                                <span className="text-green-700">{ko.karTL || '0.00'}₺</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        // Sabit Komisyon: % göster
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {record.komisyonOranları.map((ko, idx) => {
                            const vadeLabel = ko.vade;
                            
                            return (
                              <div key={idx} className="flex items-center justify-between gap-1 bg-blue-50 px-2 py-0.5 rounded">
                                <span className="text-gray-700">{vadeLabel}:</span>
                                <span className="text-blue-700">%{ko.oran}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{record.kurulus?.ad || 'Kuruluş'}: %{record.paylaşımOranları.kurulusOrani}</div>
                        <div>OXİVO: %{record.paylaşımOranları.oxivoOrani}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.aktif ? 'default' : 'secondary'}>
                        {record.aktif ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(record)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(record.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? 'Tabela Kaydını Düzenle' : `Yeni TABELA Kaydı ${kurulusTipi ? `(${kurulusTipi})` : ''}`}
            </DialogTitle>
            <DialogDescription>
              {editingRecord 
                ? 'Mevcut tabela kaydını düzenleyin' 
                : `Adım ${currentStep}/5: ${
                    currentStep === 1 ? 'Kuruluş seçimi yapınız' :
                    currentStep === 2 ? 'Gelir modeli seçiniz' :
                    currentStep === 3 ? 'Ek gelir bilgilerini giriniz (opsiyonel)' :
                    currentStep === 4 ? 'Yurt içi/dışı belirleyiniz' :
                    'Son adım: Kart tipi seçiniz'
                  }`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Progress Indicator */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                {[
                  { num: 1, label: 'Kuruluş' },
                  { num: 2, label: 'Gelir Modeli' },
                  { num: 3, label: 'Ek Gelir' },
                  { num: 4, label: 'Yurt İçi/Dışı' },
                  { num: 5, label: 'Kart Tipi' }
                ].map((step, idx) => (
                  <div key={step.num} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                          currentStep >= step.num
                            ? 'bg-blue-600 text-white shadow-lg'
                            : currentStep === step.num - 1
                            ? 'bg-blue-200 text-blue-700 ring-2 ring-blue-400'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {currentStep > step.num ? '✓' : step.num}
                      </div>
                      <span className={`text-xs mt-1 text-center ${
                        currentStep >= step.num ? 'text-blue-700 font-medium' : 'text-gray-500'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {idx < 4 && (
                      <div className="flex-1 h-1 mx-2 rounded">
                        <div
                          className={`h-full rounded transition-all ${
                            currentStep > step.num ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1: Kuruluş Seçimi */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Adım 1/5: Kuruluş Seçimi</h4>
                <p className="text-sm text-gray-600">
                  TABELA kaydı oluşturmak istediğiniz kuruluşu seçiniz
                </p>

                <ModernFormSelect
                  label="Kuruluş Tipi"
                  options={[
                    { value: 'EPK', label: 'EPK (E-Para Kuruluşu)', description: 'E-Para Kuruluşları için' },
                    { value: 'OK', label: 'ÖK (Ödeme Kuruluşu)', description: 'Ödeme Kuruluşları için' }
                  ]}
                  value={kurulusTipi}
                  onChange={v => setKurulusTipi(v as 'EPK' | 'OK')}
                  placeholder="Kuruluş tipi seçiniz"
                  required
                />

                {kurulusTipi && (
                  <div className="space-y-2">
                    {(kurulusTipi === 'EPK' ? aktifEPKList : aktifOKList).length === 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-700 font-medium">
                          ⚠️ {kurulusTipi} Kaydı Bulunamadı
                        </p>
                        <p className="text-sm text-yellow-600 mt-2">
                          Henüz aktif {kurulusTipi} tanımlanmamış. Lütfen önce Tanımlar modülünden {kurulusTipi} ekleyiniz.
                        </p>
                      </div>
                    ) : (
                      <ModernFormSelect
                        label="Kuruluş Adı"
                        options={(kurulusTipi === 'EPK' ? aktifEPKList : aktifOKList).map(k => ({
                          value: k.id,
                          label: `${k.kurumAdi} (${k.kod})`
                        }))}
                        value={kurulusId}
                        onChange={setKurulusId}
                        placeholder="Kuruluş seçiniz"
                        required
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Gelir Modeli */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Adım 2/5: Gelir Modeli Seçimi</h4>
                <p className="text-sm text-gray-600">
                  {kurulusTipi && kurulusId ? (
                    `${kurulusTipi === 'EPK' ? aktifEPKList.find(e => e.id === kurulusId)?.kurumAdi : aktifOKList.find(o => o.id === kurulusId)?.kurumAdi} için gelir modelini seçiniz`
                  ) : (
                    'Gelir modelini seçiniz'
                  )}
                </p>

                {gelirModelleri.length === 0 ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700 font-medium">
                      ⚠️ Gelir Modeli Bulunamadı
                    </p>
                    <p className="text-sm text-red-600 mt-2">
                      Henüz hiç gelir modeli tanımlanmamış. Lütfen önce Tanımlar modülünden gelir modeli ekleyiniz.
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-3"
                      onClick={() => {
                        toast.info('Tanımlar > Gelir Modelleri bölümüne gidiniz');
                      }}
                    >
                      Nasıl Eklerim?
                    </Button>
                  </div>
                ) : aktifGelirModelleri.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-700 font-medium">
                      ⚠️ Aktif Gelir Modeli Bulunamadı
                    </p>
                    <p className="text-sm text-yellow-600 mt-2">
                      Toplam {gelirModelleri.length} gelir modeli var ama hiçbiri aktif değil. Pasif modeller:
                    </p>
                    <ul className="list-disc list-inside text-sm text-yellow-600 mt-2">
                      {gelirModelleri.map(g => (
                        <li key={g.id}>{g.ad}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <ModernFormSelect
                      label="Gelir Modeli"
                      options={aktifGelirModelleri.map(g => ({
                        value: g.id,
                        label: g.ad,
                        description: g.ad === 'Hazine Geliri' 
                          ? 'Sabit tutar bazlı gelir modeli' 
                          : g.ad === 'Gelir Ortaklığı'
                          ? 'Alış-satış farkı bazlı gelir modeli'
                          : 'Komisyon oranı bazlı gelir modeli'
                      }))}
                      value={gelirModeliId}
                      onChange={setGelirModeliId}
                      placeholder="Gelir modeli seçiniz"
                      required
                    />
                    
                    {gelirModeliId && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                        💡 Seçilen: <strong>{aktifGelirModelleri.find(g => g.id === gelirModeliId)?.ad}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ✅ Step 3: Ek Gelir (YENİ) */}
            {currentStep === 3 && (() => {
              const selectedGelirModeli = aktifGelirModelleri.find(g => g.id === gelirModeliId);
              const isHazineGeliri = selectedGelirModeli?.ad === 'Hazine Geliri';
              
              return (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Adım 3/5: Ek Gelir Bilgileri (Opsiyonel)</h4>
                <p className="text-sm text-gray-600">
                  {isHazineGeliri 
                    ? 'Hazine Geliri için ek gelir bilgilerini girebilirsiniz' 
                    : 'Bu adımı atlayarak devam edebilirsiniz veya ek gelir bilgisi girebilirsiniz'}
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700 mb-3">
                    ℹ️ Bu adım opsiyoneldir. İsterseniz boş bırakarak "İleri" butonuna tıklayabilirsiniz.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Kod No</Label>
                      <Input
                        placeholder="Ör: EG001"
                        value={ekGelir.kodNo}
                        onChange={e => setEkGelir({ ...ekGelir, kodNo: e.target.value })}
                        className="bg-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Gelir Türü</Label>
                      <Input
                        placeholder="Ör: Hazine Geliri"
                        value={ekGelir.gelirTuru}
                        onChange={e => setEkGelir({ ...ekGelir, gelirTuru: e.target.value })}
                        className="bg-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Kullanım</Label>
                      <ModernFormSelect
                        label=""
                        options={[
                          { value: 'Yurt İçi', label: 'Yurt İçi' },
                          { value: 'Yurt Dışı', label: 'Yurt Dışı' }
                        ]}
                        value={ekGelir.kullanim}
                        onChange={v => setEkGelir({ ...ekGelir, kullanim: v })}
                        placeholder="Seçiniz"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Kart Tipi</Label>
                      <ModernFormSelect
                        label=""
                        options={[
                          { value: 'Credit', label: 'Credit' },
                          { value: 'Debit', label: 'Debit' },
                          { value: 'Paçal', label: 'Paçal' }
                        ]}
                        value={ekGelir.kartTipi}
                        onChange={v => setEkGelir({ ...ekGelir, kartTipi: v })}
                        placeholder="Seçiniz"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Tutar (₺)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={ekGelir.tutar}
                        onChange={e => {
                          const tutar = e.target.value;
                          setEkGelir({ ...ekGelir, tutar });
                          
                          // Auto-calculate PF TL from PF %
                          if (ekGelir.pfYuzde && tutar) {
                            const tutarNum = parseFloat(tutar);
                            const pfYuzdeNum = parseFloat(ekGelir.pfYuzde);
                            if (!isNaN(tutarNum) && !isNaN(pfYuzdeNum)) {
                              const pfTL = ((tutarNum * pfYuzdeNum) / 100).toFixed(2);
                              setEkGelir(prev => ({ ...prev, tutar, pfTL }));
                            }
                          }
                        }}
                        className="bg-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">PF %</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="%0.00"
                        value={ekGelir.pfYuzde}
                        onChange={e => {
                          const pfYuzde = e.target.value;
                          setEkGelir({ ...ekGelir, pfYuzde });
                          
                          // Auto-calculate PF TL
                          if (ekGelir.tutar && pfYuzde) {
                            const tutarNum = parseFloat(ekGelir.tutar);
                            const pfYuzdeNum = parseFloat(pfYuzde);
                            if (!isNaN(tutarNum) && !isNaN(pfYuzdeNum)) {
                              const pfTL = ((tutarNum * pfYuzdeNum) / 100).toFixed(2);
                              setEkGelir(prev => ({ ...prev, pfYuzde, pfTL }));
                            }
                          }
                        }}
                        className="bg-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">PF TL</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={ekGelir.pfTL}
                        onChange={e => setEkGelir({ ...ekGelir, pfTL: e.target.value })}
                        className="bg-white bg-gray-50"
                        readOnly
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">OX %</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="%0.00"
                        value={ekGelir.oxYuzde}
                        onChange={e => {
                          const oxYuzde = e.target.value;
                          setEkGelir({ ...ekGelir, oxYuzde });
                          
                          // Auto-calculate OX TL
                          if (ekGelir.tutar && oxYuzde) {
                            const tutarNum = parseFloat(ekGelir.tutar);
                            const oxYuzdeNum = parseFloat(oxYuzde);
                            if (!isNaN(tutarNum) && !isNaN(oxYuzdeNum)) {
                              const oxTL = ((tutarNum * oxYuzdeNum) / 100).toFixed(2);
                              setEkGelir(prev => ({ ...prev, oxYuzde, oxTL }));
                            }
                          }
                        }}
                        className="bg-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">OX TL</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={ekGelir.oxTL}
                        onChange={e => setEkGelir({ ...ekGelir, oxTL: e.target.value })}
                        className="bg-white bg-gray-50"
                        readOnly
                      />
                    </div>
                  </div>
                  
                  {(ekGelir.kodNo || ekGelir.tutar) && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded p-3 text-sm text-green-700">
                      ✅ Ek gelir bilgileri girildi
                    </div>
                  )}
                </div>
              </div>
              );
            })()}

            {/* Step 4: Yurt İçi/Dışı */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Adım 4/5: Yurt İçi / Yurt Dışı Seçimi</h4>
                <p className="text-sm text-gray-600">
                  İşlemlerin yapılacağı coğrafi bölgeyi belirleyiniz
                </p>

                <ModernFormSelect
                  label="Yurt İçi / Yurt Dışı"
                  options={[
                    { value: 'Yurt İçi', label: 'Yurt İçi', description: 'Türkiye içi işlemler için' },
                    { value: 'Yurt Dışı', label: 'Yurt Dışı', description: 'Uluslararası işlemler için' }
                  ]}
                  value={yurtIciDisi}
                  onChange={v => setYurtIciDisi(v as 'Yurt İçi' | 'Yurt Dışı')}
                  placeholder="Seçim yapınız"
                  required
                />
                
                {yurtIciDisi && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                    💡 Seçilen: <strong>{yurtIciDisi}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Kart Tipi Seçimi */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">
                  Adım 5/5: Kart Tipi Seçimi
                </h4>
                <p className="text-sm text-gray-600">
                  İşlemlerde kullanılacak kart tipini seçiniz
                </p>

                <div className="space-y-2">
                  <ModernFormSelect
                    label="Kart Tipi"
                    options={[
                      { value: 'Credit', label: 'Credit', description: 'Kredi kartı işlemleri' },
                      { value: 'Debit', label: 'Debit', description: 'Banka kartı işlemleri' },
                      { value: 'Paçal', label: 'Paçal', description: 'Tüm kart tipleri (birleşik)' }
                    ]}
                    value={kartTipi}
                    onChange={v => setKartTipi(v as 'Credit' | 'Debit' | 'Paçal')}
                    placeholder="Kart tipi seçiniz"
                    required
                  />
                  
                  {kartTipi && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                      💡 Seçilen: <strong>{kartTipi}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}


          </div>

          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <div>
                {currentStep > 1 && (
                  <Button variant="outline" onClick={handleBack}>
                    Geri
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleCloseDialog}>
                  İptal
                </Button>
                {currentStep < 4 ? (
                  <Button onClick={handleNext}>İleri</Button>
                ) : (
                  <Button onClick={handleSave}>Kaydet</Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}