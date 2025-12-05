// TABELA Kayıtları - KLM sütunu başa, Checkbox "Seçim" sütunu sona taşındı (v2.2 - FINAL)
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { ModernFormSelect, FormSelectOption } from './ModernFormSelect';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Switch } from './ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
// Tooltip removed - import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Plus, Pencil, Trash2, AlertCircle, Upload, X, Image as ImageIcon, XCircle, ChevronDown, ChevronRight, Info, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { TabelaRecord, TabelaGroup } from './TabelaTab';
import { EkGelir } from './RevenueModelsTab';
import { kisaltUrunAdi } from '../utils/formatters';

// Vade listesi
const vadeListesi = [
  'D+1',
  'D+7',
  'D+14',
  'D+31',
];

interface FirmaTabelaTabProps {
  firmaId: string;
  firmaAdi: string;
  firmaTipi: 'Banka' | 'PF';
  odemeKurulusuTipi?: 'ÖK' | 'EPK' | '';
  gelirModelleri?: Array<{ id: string; ad: string; aktif: boolean }>;
  ekGelirler?: EkGelir[];
  banks?: Array<{ id: string; kod: string; bankaAdi: string; aktif: boolean }>;
  kartProgramlar?: Array<{ id: string; kartAdi: string; aktif: boolean }>;
  tabelaRecords?: TabelaRecord[];
  tabelaGroups?: TabelaGroup[];
  onTabelaRecordsChange?: (records: TabelaRecord[]) => void;
  onTabelaGroupsChange?: (groups: TabelaGroup[]) => void;
}

export function FirmaTabelaTab({
  firmaId,
  firmaAdi,
  firmaTipi,
  odemeKurulusuTipi = '',
  gelirModelleri = [],
  ekGelirler = [],
  banks = [],
  kartProgramlar = [],
  tabelaRecords = [],
  tabelaGroups = [],
  onTabelaRecordsChange,
  onTabelaGroupsChange,
}: FirmaTabelaTabProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TabelaRecord | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [closingRecord, setClosingRecord] = useState<TabelaRecord | null>(null);
  const [showFilter, setShowFilter] = useState<'all' | 'active' | 'closed'>('all');
  
  // Gruplama state'leri
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [selectedRecordsForGroup, setSelectedRecordsForGroup] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupStartDate, setGroupStartDate] = useState('');
  const [groupEndDate, setGroupEndDate] = useState('');
  const [groupAktif, setGroupAktif] = useState(true); // Grup aktif/pasif durumu
  const [editingGroup, setEditingGroup] = useState<TabelaGroup | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set()); // Daraltılmış gruplar
  const [showHierarchyDialog, setShowHierarchyDialog] = useState(false); // Hiyerarşi dialog

  // Form state - 0. adımdan başlıyor (Kısa Açıklama)
  const [kisaAciklama, setKisaAciklama] = useState('');
  const [urun, setUrun] = useState<'UnattendedPOS' | 'AttendedPOS' | 'SoftPOS' | 'SanalPOS' | ''>('');
  const [kartTipi, setKartTipi] = useState<'Credit' | 'Debit' | 'Paçal' | ''>('');
  const [gelirModeliId, setGelirModeliId] = useState('');
  const [selectedEkGelirId, setSelectedEkGelirId] = useState('NONE'); // Seçilen ek gelir ID
  const [selectedKartProgramIds, setSelectedKartProgramIds] = useState<string[]>([]);
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
  const [aciklama, setAciklama] = useState('');
  const [fotograf, setFotograf] = useState('');
  
  // Hazine Geliri için state
  const [hazineGeliri, setHazineGeliri] = useState({
    tutarTL: '',
    oxivoYuzde: '',
    kazancTL: ''
  });

  const aktifGelirModelleri = gelirModelleri.filter(g => g.aktif);
  const aktifEkGelirler = ekGelirler.filter(e => e.aktif);
  const aktifBankalar = banks.filter(b => b.aktif);
  const aktifKartProgramlar = kartProgramlar.filter(k => k.aktif);
  
  // Seçili gelir modelini bul
  const selectedGelirModeli = gelirModelleri.find(g => g.id === gelirModeliId);
  const isPacalGelirModeli = selectedGelirModeli?.ad?.toLowerCase().includes('paçal') || false;
  
  // Scroll pozisyonunu kaydet
  const saveScrollPosition = () => {
    if (scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollTop;
    }
  };
  
  // Scroll pozisyonunu geri yükle
  const restoreScrollPosition = () => {
    requestAnimationFrame(() => {
      if (scrollContainerRef.current && scrollPositionRef.current > 0) {
        scrollContainerRef.current.scrollTop = scrollPositionRef.current;
      }
    });
  };
  
  // Yardımcı fonksiyonlar: Gruplanmış kayıt kontrolü
  const getRecordGroup = (recordId: string): TabelaGroup | undefined => {
    return tabelaGroups.find(group => group.recordIds?.includes(recordId));
  };

  const isRecordGrouped = (recordId: string): boolean => {
    return !!getRecordGroup(recordId);
  };
  
  // Düzenlenen kayıt gruplanmış mı?
  const isEditingGroupedRecord = editingRecord ? isRecordGrouped(editingRecord.id) : false;

  // Paçal gelir modeli seçildiğinde kart tipini otomatik Paçal yap
  useEffect(() => {
    if (isPacalGelirModeli && kartTipi !== 'Paçal') {
      console.log('🔒 Paçal gelir modeli algılandı:', selectedGelirModeli?.ad);
      console.log('🎯 Kart tipi otomatik "Paçal" olarak ayarlandı');
      setKartTipi('Paçal');
      toast.info('Kart tipi otomatik olarak "Paçal" olarak ayarlandı');
    }
  }, [isPacalGelirModeli]);
  
  // Scroll pozisyonunu geri yükle (tabelaRecords değiştiğinde)
  useEffect(() => {
    restoreScrollPosition();
  }, [tabelaRecords]);

  const resetForm = () => {
    setKisaAciklama('');
    setUrun('');
    setKartTipi('');
    setGelirModeliId('');
    setSelectedEkGelirId('NONE');
    setSelectedKartProgramIds([]);
    setYurtIciDisi('');
    setKomisyonOranları(vadeListesi.map(v => ({ vade: v, oran: '', alisTL: '', satisTL: '', karTL: '', aktif: true })));
    setKurulusOrani('');
    setOxivoOrani('');
    setAciklama('');
    setFotograf('');
    setHazineGeliri({ tutarTL: '', oxivoYuzde: '', kazancTL: '' });
    setCurrentStep(0);
    setEditingRecord(null);
  };

  const handleOpenDialog = (record?: TabelaRecord) => {
    if (record) {
      setEditingRecord(record);
      setKisaAciklama((record as any).kisaAciklama || '');
      setUrun(record.urun || '');
      setKartTipi(record.kartTipi);
      setGelirModeliId(record.gelirModeli.id);
      // Eski kayıtlarda bankIds varsa kartProgramIds'e çevir (geçici backward compatibility)
      setSelectedKartProgramIds(record.kartProgramIds || record.bankIds || []);
      setYurtIciDisi(record.yurtIciDisi);
      
      // Komisyon oranlarını yükle - kayıtlı olanlar + eksik vadeler
      const loadedKomisyonlar = vadeListesi.map(vade => {
        const existing = record.komisyonOranları.find(k => k.vade === vade);
        return existing || { vade, oran: '', alisTL: '', satisTL: '', karTL: '', aktif: false };
      });
      setKomisyonOranları(loadedKomisyonlar);
      
      setKurulusOrani(record.paylaşımOranları.kurulusOrani);
      setOxivoOrani(record.paylaşımOranları.oxivoOrani);
      setAciklama(record.aciklama || '');
      setFotograf(record.fotograf || '');
      setHazineGeliri(record.hazineGeliri || { tutarTL: '', oxivoYuzde: '', kazancTL: '' });
      setCurrentStep(0);
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

  const handleNextStep = () => {
    // Step 1: Ürün ve Gelir Modeli
    if (currentStep === 1) {
      if (!urun) {
        toast.error('❌ Lütfen ürün seçiniz');
        return;
      }
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
      
      toast.success(`✅ Ürün: ${urun}, Gelir Modeli: ${gelirModeli.ad}`);
      
      // ÖNEMLİ: Eğer "Hazine Geliri + Yurt İçi" veya "Hazine Geliri + Yurt Dışı" seçildiyse, 
      // direkt kayıt oluştur (başka adım sorma)
      if (selectedEkGelirId && selectedEkGelirId !== 'NONE') {
        const selectedEkGelir = aktifEkGelirler.find(eg => eg.id === selectedEkGelirId);
        if (selectedEkGelir && selectedEkGelir.gelirTuru === 'Hazine Geliri') {
          // Hazine Geliri için direkt TABELA kaydı oluştur
          handleQuickSaveWithEkGelir(selectedEkGelir);
          return;
        }
      }
      // Diğer durumlarda normal akışa devam et
    }
    // Step 2: Kart Program Seçimi
    if (currentStep === 2) {
      if (selectedKartProgramIds.length === 0) {
        toast.error('❌ Lütfen en az bir kart programı seçiniz');
        return;
      }
      toast.success(`✅ ${selectedKartProgramIds.includes('ALL') ? 'Tüm kart programları' : selectedKartProgramIds.length + ' kart programı'} seçildi`);
    }
    // Step 3: Yurt İçi/Dışı
    if (currentStep === 3) {
      if (!yurtIciDisi) {
        toast.error('❌ Lütfen yurt içi veya yurt dışı seçiniz');
        return;
      }
      toast.success(`✅ ${yurtIciDisi} seçildi`);
    }
    // Step 4: Kart Tipi
    if (currentStep === 4) {
      if (!kartTipi) {
        toast.error('❌ Lütfen kart tipi seçiniz');
        return;
      }
      toast.success(`✅ Kart Tipi: ${kartTipi}`);
    }
    // Step 5, 6, 7, 8, 9 için ek validasyon gerekmez (opsiyonel alanlar)
    
    setCurrentStep(prev => prev + 1);
  };
  
  // Hızlı kayıt - Ek Gelir ile
  const handleQuickSaveWithEkGelir = (ekGelir: EkGelir) => {
    const gelirModeli = gelirModelleri.find(g => g.id === gelirModeliId);
    if (!gelirModeli) return;
    
    const kurulusTip = firmaTipi === 'Banka' ? 'EPK' : (odemeKurulusuTipi as 'EPK' | 'OK');
    
    const newRecord: TabelaRecord = {
      id: Date.now().toString(),
      kurulus: {
        tip: kurulusTip,
        id: firmaId,
        ad: firmaAdi,
      },
      urun,
      kartTipi: ekGelir.kartTipi as 'Credit' | 'Debit' | 'Paçal',
      gelirModeli: {
        id: gelirModeli.id,
        ad: gelirModeli.ad,
      },
      kartProgramIds: ['ALL'], // Tüm kart programları için
      yurtIciDisi: ekGelir.kullanim as 'Yurt İçi' | 'Yurt Dışı',
      komisyonOranları: [], // Hazine Geliri için boş
      ekGelirDetay: {
        id: ekGelir.id,
        kodNo: ekGelir.kodNo,
        gelirTuru: ekGelir.gelirTuru,
        kullanim: ekGelir.kullanim,
        kartTipi: ekGelir.kartTipi,
        tutar: ekGelir.tutar || '0.00',
        pfYuzde: ekGelir.pfYuzde || '0.00',
        pfTL: ekGelir.pfTL || '0.00',
        oxYuzde: ekGelir.oxYuzde || '0.00',
        oxTL: ekGelir.oxTL || '0.00',
      },
      paylaşımOranları: {
        kurulusOrani: ekGelir.pfYuzde || '0',
        oxivoOrani: ekGelir.oxYuzde || '0',
      },
      olusturmaTarihi: new Date().toISOString().split('T')[0],
      aktif: true,
    };
    
    const updatedRecords = [...tabelaRecords, newRecord];
    onTabelaRecordsChange?.(updatedRecords);
    
    toast.success(`✓ TABELA kaydı oluşturuldu: ${ekGelir.gelirTuru} + ${ekGelir.kullanim}`);
    
    // Dialog'u kapat ve formu temizle
    setIsDialogOpen(false);
    resetForm();
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Dosya boyutu kontrolü (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Fotoğraf boyutu 2MB\'dan küçük olmalıdır');
        return;
      }

      // Dosya tipini kontrol et
      if (!file.type.startsWith('image/')) {
        toast.error('Lütfen geçerli bir resim dosyası seçiniz');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setFotograf(reader.result as string);
        toast.success('Fotoğraf yüklendi');
      };
      reader.onerror = () => {
        toast.error('Fotoğraf yüklenirken hata oluştu');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // Validasyon
    if (!urun) {
      toast.error('Ürün seçmelisiniz');
      return;
    }
    if (!gelirModeliId) {
      toast.error('Gelir modeli seçmelisiniz');
      return;
    }
    if (selectedKartProgramIds.length === 0) {
      toast.error('En az bir kart programı seçmelisiniz');
      return;
    }
    if (!yurtIciDisi) {
      toast.error('Yurt içi/dışı seçmelisiniz');
      return;
    }
    if (!kartTipi) {
      toast.error('Lütfen kart tipi seçiniz');
      return;
    }
    
    const gelirModeli = gelirModelleri.find(g => g.id === gelirModeliId);
    if (!gelirModeli) return;

    // Kuruluş bilgisi otomatik - firmadan geliyor
    const kurulusTip = firmaTipi === 'Banka' ? 'EPK' : (odemeKurulusuTipi as 'EPK' | 'OK');
    
    const newRecord: TabelaRecord = {
      id: editingRecord?.id || Date.now().toString(),
      kurulus: {
        tip: kurulusTip,
        id: firmaId,
        ad: firmaAdi,
      },
      urun,
      kartTipi: kartTipi as 'Credit' | 'Debit' | 'Paçal',
      gelirModeli: {
        id: gelirModeli.id,
        ad: gelirModeli.ad,
      },
      kartProgramIds: selectedKartProgramIds,
      yurtIciDisi,
      komisyonOranları: komisyonOranları.filter(k => k.aktif), // Sadece aktif olanları kaydet
      paylaşımOranları: {
        kurulusOrani: kurulusOrani || '50', // Girilen değer veya default
        oxivoOrani: oxivoOrani || '50',
      },
      kisaAciklama: kisaAciklama || undefined,
      aciklama: aciklama || undefined,
      fotograf: fotograf || undefined,
      olusturmaTarihi: editingRecord?.olusturmaTarihi || new Date().toLocaleDateString('tr-TR'),
      kapanmaTarihi: editingRecord?.kapanmaTarihi,
      aktif: editingRecord?.aktif ?? true,
    } as any;

    saveScrollPosition();
    if (editingRecord) {
      const updatedRecords = tabelaRecords.map(r => r.id === editingRecord.id ? newRecord : r);
      onTabelaRecordsChange?.(updatedRecords);
      toast.success('TABELA kaydı güncellendi');
    } else {
      onTabelaRecordsChange?.([...tabelaRecords, newRecord]);
      toast.success('TABELA kaydı eklendi');
    }

    handleCloseDialog();
    restoreScrollPosition();
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu TABELA kaydını silmek istediğinizden emin misiniz?')) {
      saveScrollPosition();
      const updatedRecords = tabelaRecords.filter(r => r.id !== id);
      onTabelaRecordsChange?.(updatedRecords);
      toast.success('TABELA kaydı silindi');
      restoreScrollPosition();
    }
  };

  const handleToggleStatus = (id: string) => {
    saveScrollPosition();
    const updatedRecords = tabelaRecords.map(r =>
      r.id === id ? { ...r, aktif: !r.aktif } : r
    );
    onTabelaRecordsChange?.(updatedRecords);
    restoreScrollPosition();
  };

  const handleCloseAgreement = () => {
    if (!closingRecord) return;
    
    saveScrollPosition();
    const updatedRecords = tabelaRecords.map(r =>
      r.id === closingRecord.id 
        ? { 
            ...r, 
            aktif: false, 
            kapanmaTarihi: new Date().toLocaleDateString('tr-TR')
          } 
        : r
    );
    onTabelaRecordsChange?.(updatedRecords);
    toast.success('TABELA anlaşması kapatıldı');
    restoreScrollPosition();
    setClosingRecord(null);
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

  const handleVadeAktifChange = (vade: string, aktif: boolean) => {
    setKomisyonOranları(prevOranlar =>
      prevOranlar.map(k => k.vade === vade ? { ...k, aktif } : k)
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

  // Gruplama fonksiyonları
  const handleOpenGroupDialog = () => {
    setSelectedRecordsForGroup([]);
    setGroupName('');
    setGroupStartDate('');
    setGroupEndDate('');
    setGroupAktif(true); // Yeni grup için varsayılan aktif
    setEditingGroup(null);
    setShowGroupDialog(true);
  };

  const handleCreateGroup = () => {
    if (selectedRecordsForGroup.length === 0) {
      toast.error('Lütfen en az bir TABELA kaydı seçiniz');
      return;
    }
    if (!groupName.trim()) {
      toast.error('Lütfen grup ismi giriniz');
      return;
    }
    if (!groupStartDate) {
      toast.error('Lütfen geçerlilik başlangıç tarihi giriniz');
      return;
    }

    saveScrollPosition();
    const newGroup: TabelaGroup = {
      id: editingGroup?.id || Date.now().toString(),
      name: groupName,
      gecerlilikBaslangic: groupStartDate,
      gecerlilikBitis: groupEndDate || undefined,
      recordIds: selectedRecordsForGroup,
      pinned: editingGroup?.pinned || false,
      aktif: groupAktif,
    };

    if (editingGroup) {
      const updatedGroups = tabelaGroups.map(g => g.id === editingGroup.id ? newGroup : g);
      onTabelaGroupsChange?.(updatedGroups);
      toast.success('Grup güncellendi');
    } else {
      onTabelaGroupsChange?.([...tabelaGroups, newGroup]);
      toast.success('Grup oluşturuldu');
    }

    setShowGroupDialog(false);
    setSelectedRecordsForGroup([]);
    setGroupName('');
    setGroupStartDate('');
    setGroupEndDate('');
    setGroupAktif(true);
    setEditingGroup(null);
    restoreScrollPosition();
  };

  const handleEditGroup = (group: TabelaGroup) => {
    setEditingGroup(group);
    setSelectedRecordsForGroup(group.recordIds || []);
    setGroupName(group.name);
    setGroupStartDate(group.gecerlilikBaslangic);
    setGroupEndDate(group.gecerlilikBitis || '');
    setGroupAktif(group.aktif !== undefined ? group.aktif : true); // Eski kayıtlar için default true
    setShowGroupDialog(true);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm('Bu grubu silmek istediğinizden emin misiniz?')) {
      saveScrollPosition();
      const updatedGroups = tabelaGroups.filter(g => g.id !== groupId);
      onTabelaGroupsChange?.(updatedGroups);
      toast.success('Grup silindi');
      restoreScrollPosition();
    }
  };

  const handleToggleGroupPin = (groupId: string) => {
    saveScrollPosition();
    const updatedGroups = tabelaGroups.map(g =>
      g.id === groupId ? { ...g, pinned: !g.pinned } : g
    );
    onTabelaGroupsChange?.(updatedGroups);
    restoreScrollPosition();
  };

  const handleToggleGroupAktif = (groupId: string) => {
    saveScrollPosition();
    const updatedGroups = tabelaGroups.map(g =>
      g.id === groupId ? { ...g, aktif: !g.aktif } : g
    );
    onTabelaGroupsChange?.(updatedGroups);
    const group = tabelaGroups.find(g => g.id === groupId);
    toast.success(`Grup "${group?.name}" ${group?.aktif ? 'pasif' : 'aktif'} edildi`);
    restoreScrollPosition();
  };

  // Sadece PF için TABELA eklenebilir
  if (firmaTipi === 'Banka') {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-gray-600 mb-2">TABELA Uyarısı</h3>
        <p className="text-gray-500">
          TABELA kayıtları sadece Ödeme Kuruluşları (PF) için tanımlanabilir.
        </p>
      </div>
    );
  }

  if (!odemeKurulusuTipi || (odemeKurulusuTipi !== 'EPK' && odemeKurulusuTipi !== 'ÖK')) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-gray-600 mb-2">Kuruluş Tipi Belirtilmemiş</h3>
        <p className="text-gray-500">
          TABELA kayıtları için lütfen önce ödeme kuruluşu tipini (EPK/ÖK) belirleyin.
        </p>
      </div>
    );
  }

  const filteredRecords = tabelaRecords.filter(record => {
    // Durum filtreleme
    if (showFilter === 'active') return record.aktif;
    if (showFilter === 'closed') return !record.aktif;
    return true;
  });

  // Grup dialog'u için kullanılabilir kayıtlar
  // Sadece başka gruplara atanmamış ve aktif olan kayıtları göster
  const availableRecordsForGroup = tabelaRecords.filter(record => {
    // Sadece aktif kayıtlar
    if (!record.aktif) return false;
    
    // Eğer düzenleme modundaysa, mevcut gruptaki kayıtları da göster
    if (editingGroup && editingGroup.recordIds.includes(record.id)) {
      return true;
    }
    
    // Başka bir gruba ait olmayan kayıtlar
    const recordGroup = getRecordGroup(record.id);
    return !recordGroup;
  });

  // Debug: TABELA kayıtlarını kontrol et
  useEffect(() => {
    // ✅ NULL SAFETY: tabelaRecords undefined olabilir
    if ((tabelaRecords || []).length > 0) {
      console.log('📊 TABELA Kayıtları:', tabelaRecords.length);
      // ✅ NULL SAFETY: tabelaRecords boş olabilir
      (tabelaRecords || []).forEach((record, idx) => {
        console.log(`\n📝 TABELA ${idx + 1}:`, {
          id: record.id,
          gelirModeli: record.gelirModeli.ad,
          kurulusAd: record.kurulus.ad,
          komisyonOranları: record.komisyonOranları,
          paylaşımOranları: record.paylaşımOranları,
          aktif: record.aktif
        });
      });
    }
  }, [tabelaRecords]);

  const activeCount = tabelaRecords.filter(r => r.aktif).length;
  const closedCount = tabelaRecords.filter(r => !r.aktif).length;

  // Grup ismi olarak cümlenin ilk kelimesini göster
  const getGroupAbbreviation = (groupName: string): string => {
    const words = groupName.trim().split(/\s+/);
    return words[0] || '';
  };

  // Grup göster/daralt toggle
  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6" ref={scrollContainerRef}>
      <div className="flex items-center justify-between">
        <div>
          <h3>TABELA Kayıtları</h3>
          <p className="text-sm text-gray-600">
            {firmaAdi} için komisyon ve paylaşım oranları
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowHierarchyDialog(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <HelpCircle size={16} />
            <span>Hiyerarşi</span>
          </Button>
          <Button 
            onClick={() => {
              console.log('\n🔍 TABELA Debug - Firma:', firmaAdi);
              console.log('📊 Toplam kayıt:', tabelaRecords.length);
              console.log('✅ Gösterilen kayıt:', filteredRecords.length);
              
              // ✅ NULL SAFETY: tabelaRecords boş olabilir
              (tabelaRecords || []).forEach((record, idx) => {
                console.log(`\n📝 TABELA ${idx + 1}:`, {
                  gelirModeli: record.gelirModeli.ad,
                  kurulusAd: record.kurulus.ad,
                  kurulusTip: record.kurulus.tip,
                  komisyonlar: record.komisyonOranları.map(k => `${k.vade}: %${k.oran}`),
                  paylaşım: `Kuruluş: %${record.paylaşımOranları.kurulusOrani}, OXİVO: %${record.paylaşımOranları.oxivoOrani}`,
                  bankalar: record.bankIds,
                  aktif: record.aktif ? '✓ Aktif' : '🔒 Kapalı'
                });
              });
              
              toast.success(
                `${filteredRecords.length} kayıt görüntüleniyor`,
                {
                  description: 'Detaylar konsolda (F12)'
                }
              );
            }}
            variant="outline"
            size="sm"
          >
            🔍 Verileri Kontrol Et
          </Button>
          {filteredRecords.length > 0 && (
            <Button 
              onClick={() => {
                if (availableRecordsForGroup.length === 0) {
                  toast.error('Gruplanabilir kayıt yok', {
                    description: 'Tüm aktif TABELA kayıtları zaten bir gruba atanmış. Önce yeni TABELA kaydı oluşturun veya mevcut kayıtları gruplardan çıkarın.'
                  });
                  return;
                }
                handleOpenGroupDialog();
              }}
              variant="outline"
              className="flex items-center gap-2"
              disabled={availableRecordsForGroup.length === 0}
            >
              <Plus size={20} />
              <span>Grup Oluştur</span>
              {availableRecordsForGroup.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {availableRecordsForGroup.length}
                </Badge>
              )}
            </Button>
          )}
          <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
            <Plus size={20} />
            <span>Yeni TABELA Kaydı</span>
          </Button>
        </div>
      </div>

      {/* Mevcut Gruplar */}
      {(tabelaGroups || []).length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-2">
            📁 TABELA Grupları
            <Badge variant="secondary">{tabelaGroups.length}</Badge>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tabelaGroups.map((group) => (
              <div 
                key={group.id} 
                className={`border rounded-lg p-4 bg-white hover:shadow-md transition-shadow ${
                  group.pinned ? 'border-blue-500 border-2' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="text-sm">{group.name}</h5>
                      {group.pinned && (
                        <Badge variant="default" className="text-xs bg-blue-600">
                          📌
                        </Badge>
                      )}
                      <Badge 
                        variant={group.aktif !== false ? "default" : "secondary"} 
                        className={`text-xs ${group.aktif !== false ? 'bg-green-600' : 'bg-gray-400'}`}
                      >
                        {group.aktif !== false ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      <div>Başlangıç: {group.gecerlilikBaslangic}</div>
                      {group.gecerlilikBitis && (
                        <div>Bitiş: {group.gecerlilikBitis}</div>
                      )}
                      {!group.gecerlilikBitis && (
                        <div className="text-green-600">Süresiz</div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleGroupPin(group.id)}
                      title={group.pinned ? 'Sabitlemeyi Kaldır' : 'Sabitle'}
                    >
                      {group.pinned ? '📌' : '📍'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditGroup(group)}
                      title="Düzenle"
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteGroup(group.id)}
                      title="Sil"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <div className="text-xs text-gray-600">
                    <Badge variant="outline" className="text-xs">
                      {group.recordIds?.length || 0} TABELA kaydı
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">
                      {group.aktif !== false ? '✓ Hakediş için aktif' : '⚠️ Hakediş için pasif'}
                    </span>
                    <Switch
                      checked={group.aktif !== false}
                      onCheckedChange={() => handleToggleGroupAktif(group.id)}
                      className="scale-75"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtre ve İstatistikler */}
      {(tabelaRecords || []).length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border">
          <span className="text-sm text-gray-600">Filtre:</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={showFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setShowFilter('all')}
            >
              Tümü ({tabelaRecords.length})
            </Button>
            <Button
              size="sm"
              variant={showFilter === 'active' ? 'default' : 'outline'}
              onClick={() => setShowFilter('active')}
              className={showFilter === 'active' ? 'bg-green-600' : ''}
            >
              ✓ Aktif ({activeCount})
            </Button>
            <Button
              size="sm"
              variant={showFilter === 'closed' ? 'default' : 'outline'}
              onClick={() => setShowFilter('closed')}
              className={showFilter === 'closed' ? 'bg-orange-600' : ''}
            >
              🔒 Kapalı ({closedCount})
            </Button>
          </div>
        </div>
      )}

      {/* TABELA Kayıtları Listesi */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">
            {tabelaRecords.length === 0 
              ? 'Henüz TABELA kaydı bulunmamaktadır.' 
              : `${showFilter === 'active' ? 'Aktif' : 'Kapalı'} TABELA kaydı bulunmamaktadır.`}
          </p>
          {tabelaRecords.length === 0 && (
            <Button onClick={() => handleOpenDialog()} className="mt-4">
              İlk Kaydı Oluştur
            </Button>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-16">KLM</TableHead>
              <TableHead className="w-32">Grup</TableHead>
              <TableHead className="w-36">Kısa Açıklama</TableHead>
              <TableHead className="w-40">Ürün</TableHead>
              <TableHead className="w-36">Gelir Modeli</TableHead>
              <TableHead className="w-32">Yurt İçi/Dışı</TableHead>
              <TableHead className="w-24">Kart Tipi</TableHead>
              <TableHead className="w-20">Vade</TableHead>
              <TableHead className="w-40">Oran</TableHead>
              <TableHead className="w-36">Paylaşım</TableHead>
              <TableHead className="w-36">Oluşturma</TableHead>
              <TableHead className="w-32 text-center">
                <div>İşlemler</div>
                <div className="text-xs opacity-70">Aktif</div>
              </TableHead>
              <TableHead className="w-12 text-center">
                <div className="text-xs mb-1">Seçim</div>
                <Checkbox
                  checked={
                    filteredRecords.length > 0 && 
                    filteredRecords.filter(r => !isRecordGrouped(r.id)).length > 0 &&
                    filteredRecords.filter(r => !isRecordGrouped(r.id)).every(r => selectedRecordsForGroup.includes(r.id))
                  }
                  onCheckedChange={(checked) => {
                    saveScrollPosition();
                    if (checked) {
                      const ungroupedRecords = filteredRecords.filter(r => !isRecordGrouped(r.id));
                      setSelectedRecordsForGroup(ungroupedRecords.map(r => r.id));
                    } else {
                      setSelectedRecordsForGroup([]);
                    }
                    restoreScrollPosition();
                  }}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Gruplu kayıtları render et */}
            {tabelaGroups.map((group) => {
              const groupRecords = filteredRecords.filter(r => 
                !r.ekGelirDetay && getRecordGroup(r.id)?.id === group.id
              );
              
              if (groupRecords.length === 0) return null;
              
              const isCollapsed = collapsedGroups.has(group.id);
              
              return (
                <React.Fragment key={`group-${group.id}`}>
                  {/* Grup Başlığı */}
                  <TableRow 
                    key={`group-header-${group.id}`}
                    className="bg-gradient-to-r from-blue-100 to-blue-50 border-t-2 border-blue-300 hover:from-blue-200 hover:to-blue-100 cursor-pointer"
                    onClick={() => toggleGroupCollapse(group.id)}
                  >
                    <TableCell colSpan={12} className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isCollapsed ? (
                            <ChevronRight size={20} className="text-blue-700" />
                          ) : (
                            <ChevronDown size={20} className="text-blue-700" />
                          )}
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-blue-600 text-white">
                              {group.name}
                            </Badge>
                            <span className="text-sm text-blue-800">
                              {groupRecords.length} kayıt
                            </span>
                            {!group.aktif && (
                              <Badge variant="secondary" className="bg-gray-400 text-white text-xs">
                                Pasif
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-blue-700">
                          <span>Geçerlilik: {new Date(group.gecerlilikBaslangic).toLocaleDateString('tr-TR')}</span>
                          {group.gecerlilikBitis && (
                            <span>- {new Date(group.gecerlilikBitis).toLocaleDateString('tr-TR')}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {/* Grup Kayıtları - Sadece açıksa ve grup aktifse göster */}
                  {!isCollapsed && group.aktif !== false && groupRecords.map((record, indexInGroup) => {
              // Yeni ve eski kayıtları destekle
              const programIds = record.kartProgramIds || record.bankIds || [];
              const recordGroup = getRecordGroup(record.id);
              const isGrouped = !!recordGroup;
              
              return (
              <TableRow 
                key={record.id}
                className="hover:bg-gray-50 bg-blue-50/20"
              >
                {/* Checkbox sona taşındı */}
                {/* <TableCell className="py-4">
                  <Checkbox
                    checked={selectedRecordsForGroup.includes(record.id)}
                    disabled={isGrouped}
                    onCheckedChange={(checked) => {
                      saveScrollPosition();
                      if (checked) {
                        setSelectedRecordsForGroup([...selectedRecordsForGroup, record.id]);
                      } else {
                        setSelectedRecordsForGroup(selectedRecordsForGroup.filter(id => id !== record.id));
                      }
                      restoreScrollPosition();
                    }}
                    title={isGrouped ? `Bu kayıt "${recordGroup?.name}" grubuna aittir` : ''}
                  />
                </TableCell> */}
                {/* KLM - İlk sütun */}
                <TableCell className="py-4 w-16">
                  <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 font-mono text-xs">
                    {String(indexInGroup + 1).padStart(2, '0')}
                  </Badge>
                </TableCell>
                {/* Grup */}
                <TableCell className="py-4 w-32">
                  {isGrouped && recordGroup ? (
                    <Badge variant="default" className="bg-blue-600 text-white">
                      {getGroupAbbreviation(recordGroup.name)}
                    </Badge>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </TableCell>
                {/* Kısa Açıklama */}
                <TableCell className="py-4 w-36">
                  {(record as any).kisaAciklama ? (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs">
                      {(record as any).kisaAciklama}
                    </Badge>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </TableCell>
                {/* Ürün */}
                <TableCell className="py-4 w-40">
                  {record.urun ? (
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300">
                      {kisaltUrunAdi(record.urun)}
                    </Badge>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </TableCell>
                {/* Gelir Modeli */}
                <TableCell className="py-4 w-36">
                  <div className="flex items-center gap-2">
                    <span>{record.gelirModeli.ad}</span>
                    {record.gelirModeli.ad?.toLowerCase().includes('paçal') && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 text-xs">
                        Auto
                      </Badge>
                    )}
                    {record.ekGelirDetay && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                        {record.ekGelirDetay.gelirTuru}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                {/* Kart Programları sütunu kaldırıldı */}
                <TableCell className="py-4 w-32">
                  <Badge variant={record.yurtIciDisi === 'Yurt İçi' ? 'default' : 'secondary'}>
                    {record.yurtIciDisi}
                  </Badge>
                </TableCell>
                {/* Kart Tipi */}
                <TableCell className="py-4 w-24">
                  <Badge 
                    variant={record.kartTipi === 'Credit' ? 'default' : record.kartTipi === 'Debit' ? 'secondary' : 'outline'}
                    className={record.kartTipi?.includes('Paçal') ? 'bg-purple-100 text-purple-700 border-purple-300' : ''}
                  >
                    {record.kartTipi?.replace(' (Tüm Kart Tipleri)', '') || record.kartTipi}
                  </Badge>
                </TableCell>
                {/* Vade */}
                <TableCell className="py-4 w-20">
                  <div className="space-y-2">
                    {/* Sadece seçilen (aktif) vadeleri göster - Alt alta */}
                    {record.komisyonOranları.filter(ko => ko.aktif !== false).length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {record.komisyonOranları.filter(ko => ko.aktif !== false).map((ko, idx) => (
                          <div key={idx} className="text-xs text-blue-700">
                            {ko.vade.replace(' (Peşin)', '')}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </div>
                </TableCell>
                {/* Oran */}
                <TableCell className="py-4 w-40">
                  <div className="text-xs space-y-2">
                    {record.gelirModeli.ad === 'Hazine Geliri' ? (
                      <div className="flex items-center justify-between gap-2 bg-blue-50 px-2 py-2 rounded">
                        <span className="text-gray-700">Kazanç:</span>
                        <span className="text-blue-700">{parseFloat(record.hazineGeliri?.kazancTL || '0').toFixed(2)}₺</span>
                      </div>
                    ) : record.gelirModeli.ad === 'Gelir Ortaklığı' ? (
                      // Gelir Ortaklığı: Alış (kırmızı), Satış (yeşil), Kazanç (mavi)
                      <div className="flex flex-col gap-2">
                        {record.komisyonOranları.filter(ko => ko.aktif !== false).map((ko, idx) => {
                          const formatPercent = (val: string | undefined) => {
                            if (!val || val === '') return '0,00';
                            return parseFloat(val).toFixed(2).replace('.', ',');
                          };
                          
                          return (
                            <div key={idx} className="flex flex-col gap-1 px-2 py-2 rounded bg-gray-50">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-gray-600">Alış:</span>
                                <span className="text-red-600">%{formatPercent(ko.alisTL)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-gray-600">Satış:</span>
                                <span className="text-green-600">%{formatPercent(ko.satisTL)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-gray-600">Kazanç:</span>
                                <span className="text-blue-600">%{formatPercent(ko.karTL)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // Sabit Komisyon: Komisyon oranı yüzdesi göster - Alt alta
                      <div className="flex flex-col gap-1">
                        {record.komisyonOranları.filter(ko => ko.aktif !== false).map((ko, idx) => {
                          const vadeLabel = ko.vade.replace(' (Peşin)', '');
                          
                          return (
                            <div key={idx} className="text-blue-700">
                              {vadeLabel}:%{ko.oran}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TableCell>
                {/* Paylaşım */}
                <TableCell className="py-4 w-36">
                  <div className="text-xs space-y-2">
                    <div className="flex items-center justify-between gap-2 bg-green-50 px-2 py-2 rounded">
                      <span className="text-gray-700">{record.kurulus.ad}</span>
                      <span className="text-green-700">%{record.paylaşımOranları.kurulusOrani}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 bg-blue-50 px-2 py-2 rounded">
                      <span className="text-gray-700">OXİVO</span>
                      <span className="text-blue-700">%{record.paylaşımOranları.oxivoOrani}</span>
                    </div>
                  </div>
                </TableCell>
                {/* Oluşturma */}
                <TableCell className="py-4 w-36">
                  <div className="text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <span className="text-green-600">📅</span>
                      <span>{record.olusturmaTarihi}</span>
                    </div>
                    {record.kapanmaTarihi && (
                      <div className="flex items-center gap-1 mt-1 text-orange-600">
                        <span>🔒</span>
                        <span>{record.kapanmaTarihi}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      {record.aciklama && (
                        <Badge variant="outline" className="text-xs">
                          📝
                        </Badge>
                      )}
                      {record.fotograf && (
                        <Badge variant="outline" className="text-xs">
                          📷
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                {/* İşlemler */}
                <TableCell className="py-4 w-32" onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-col gap-2">
                    {record.aktif ? (
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700 h-8 px-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(record.id);
                        }}
                        title="Aktif - Kapat"
                      >
                        ✓ Aktif
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-orange-100 text-orange-700 hover:bg-orange-200 h-8 px-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(record.id);
                        }}
                        title="Kapalı - Aç"
                      >
                        🔒 Kapa
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDialog(record);
                      }}
                      title="Güncelle"
                      className="h-8 px-2"
                    >
                      <Pencil size={14} />
                    </Button>
                    {record.aktif ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setClosingRecord(record);
                        }}
                        className="text-orange-600 border-orange-300 hover:bg-orange-50 h-8 px-3"
                        title="Anlaşmayı Kapat"
                      >
                        Kapa
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(record.id);
                        }}
                        className="text-red-600 border-red-300 hover:bg-red-50 h-8 px-2"
                        title="Sil"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </TableCell>
                {/* Checkbox - En sona taşındı */}
                <TableCell className="py-4 w-12">
                  <Checkbox
                    checked={selectedRecordsForGroup.includes(record.id)}
                    disabled={isGrouped}
                    onCheckedChange={(checked) => {
                      saveScrollPosition();
                      if (checked) {
                        setSelectedRecordsForGroup([...selectedRecordsForGroup, record.id]);
                      } else {
                        setSelectedRecordsForGroup(selectedRecordsForGroup.filter(id => id !== record.id));
                      }
                      restoreScrollPosition();
                    }}
                    title={isGrouped ? `Bu kayıt "${recordGroup?.name}" grubuna aittir` : ''}
                  />
                </TableCell>
              </TableRow>
            );
            })}
                </React.Fragment>
              );
            })}
            
            {/* Gruplanmamış Kayıtlar */}
            {(() => {
              const ungroupedRecords = filteredRecords.filter(r => 
                !r.ekGelirDetay && !getRecordGroup(r.id)
              );
              
              if (ungroupedRecords.length === 0) return null;
              
              const isCollapsed = collapsedGroups.has('UNGROUPED');
              
              return (
                <React.Fragment key="ungrouped-section">
                  {/* Gruplanmamış Kayıtlar Başlığı */}
                  <TableRow 
                    key="ungrouped-header"
                    className="bg-gradient-to-r from-gray-100 to-gray-50 border-t-2 border-gray-300 hover:from-gray-200 hover:to-gray-100 cursor-pointer"
                    onClick={() => toggleGroupCollapse('UNGROUPED')}
                  >
                    <TableCell colSpan={12} className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isCollapsed ? (
                            <ChevronRight size={20} className="text-gray-700" />
                          ) : (
                            <ChevronDown size={20} className="text-gray-700" />
                          )}
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-gray-200 text-gray-700 border-gray-400">
                              Gruplanmamış Kayıtlar
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {ungroupedRecords.length} kayıt
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {/* Gruplanmamış Kayıtlar - Sadece açıksa göster */}
                  {!isCollapsed && ungroupedRecords.map((record, indexInUngrouped) => {
                    const programIds = record.kartProgramIds || record.bankIds || [];
                    const recordGroup = getRecordGroup(record.id);
                    const isGrouped = !!recordGroup;
                    
                    return (
                      <TableRow 
                        key={record.id}
                        className="hover:bg-gray-50"
                      >
                        {/* Checkbox sona taşındı */}
                        {/* <TableCell className="py-4">
                          <Checkbox
                            checked={selectedRecordsForGroup.includes(record.id)}
                            disabled={isGrouped}
                            onCheckedChange={(checked) => {
                              saveScrollPosition();
                              if (checked) {
                                setSelectedRecordsForGroup([...selectedRecordsForGroup, record.id]);
                              } else {
                                setSelectedRecordsForGroup(selectedRecordsForGroup.filter(id => id !== record.id));
                              }
                              restoreScrollPosition();
                            }}
                            title={isGrouped ? `Bu kayıt \"${recordGroup?.name}\" grubuna aittir` : ''}
                          />
                        </TableCell> */}
                        {/* KLM - İlk sütun */}
                        <TableCell className="py-4 w-16">
                          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 font-mono text-xs">
                            {String(indexInUngrouped + 1).padStart(2, '0')}
                          </Badge>
                        </TableCell>
                        {/* Grup */}
                        <TableCell className="py-4 w-32">
                          <span className="text-xs text-gray-400">-</span>
                        </TableCell>
                        {/* Kısa Açıklama */}
                        <TableCell className="py-4 w-36">
                          {(record as any).kisaAciklama ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs">
                              {(record as any).kisaAciklama}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </TableCell>
                        {/* Ürün */}
                        <TableCell className="py-4 w-40">
                          {record.urun ? (
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300">
                              {kisaltUrunAdi(record.urun)}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </TableCell>
                        {/* Gelir Modeli */}
                        <TableCell className="py-4 w-36">
                          <div className="flex items-center gap-2">
                            <span>{record.gelirModeli.ad}</span>
                            {record.gelirModeli.ad?.toLowerCase().includes('paçal') && (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 text-xs">
                                Auto
                              </Badge>
                            )}
                            {record.ekGelirDetay && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                                {record.ekGelirDetay.gelirTuru}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        {/* Kart Programları sütunu kaldırıldı */}
                        {/* Yurt İçi/Dışı */}
                        <TableCell className="py-4 w-32">
                          <Badge variant={record.yurtIciDisi === 'Yurt İçi' ? 'default' : 'secondary'}>
                            {record.yurtIciDisi}
                          </Badge>
                        </TableCell>
                        {/* Kart Tipi */}
                        <TableCell className="py-4 w-24">
                          <Badge 
                            variant={record.kartTipi === 'Credit' ? 'default' : record.kartTipi === 'Debit' ? 'secondary' : 'outline'}
                            className={record.kartTipi?.includes('Paçal') ? 'bg-purple-100 text-purple-700 border-purple-300' : ''}
                          >
                            {record.kartTipi?.replace(' (Tüm Kart Tipleri)', '') || record.kartTipi}
                          </Badge>
                        </TableCell>
                        {/* Vade */}
                        <TableCell className="py-4 w-20">
                          <div className="space-y-2">
                            {record.komisyonOranları.filter(ko => ko.aktif !== false).length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {record.komisyonOranları.filter(ko => ko.aktif !== false).map((ko, idx) => (
                                  <div key={idx} className="text-xs text-blue-700">
                                    {ko.vade.replace(' (Peşin)', '')}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </div>
                        </TableCell>
                        {/* Oran */}
                        <TableCell className="py-4 w-40">
                          <div className="text-xs space-y-2">
                            {record.gelirModeli.ad === 'Hazine Geliri' ? (
                              <div className="flex items-center justify-between gap-2 bg-blue-50 px-2 py-2 rounded">
                                <span className="text-gray-700">Kazanç:</span>
                                <span className="text-blue-700">{parseFloat(record.hazineGeliri?.kazancTL || '0').toFixed(2)}₺</span>
                              </div>
                            ) : record.gelirModeli.ad === 'Gelir Ortaklığı' ? (
                              <div className="flex flex-col gap-2">
                                {record.komisyonOranları.filter(ko => ko.aktif !== false).map((ko, idx) => {
                                  const formatPercent = (val: string | undefined) => {
                                    if (!val || val === '') return '0,00';
                                    return parseFloat(val).toFixed(2).replace('.', ',');
                                  };
                                  
                                  return (
                                    <div key={idx} className="flex flex-col gap-1 px-2 py-2 rounded bg-gray-50">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-gray-600">Alış:</span>
                                        <span className="text-red-600">%{formatPercent(ko.alisTL)}</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-gray-600">Satış:</span>
                                        <span className="text-green-600">%{formatPercent(ko.satisTL)}</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-2 border-t pt-0.5">
                                        <span className="text-gray-600">Kazanç:</span>
                                        <span className="text-blue-600">%{formatPercent(ko.karTL)}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1">
                                {record.komisyonOranları.filter(ko => ko.aktif !== false).map((ko, idx) => {
                                  const vadeLabel = ko.vade.replace(' (Peşin)', '');
                                  return (
                                    <div key={idx} className="text-blue-700">
                                      {vadeLabel}:%{ko.oran}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        {/* Paylaşım */}
                        <TableCell className="py-4 w-36">
                          <div className="text-xs space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-gray-600">{firmaAdi}:</span>
                              <span className="text-blue-700">%{record.paylaşımOranları.kurulusOrani}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-gray-600">OXİVO:</span>
                              <span className="text-indigo-700">%{record.paylaşımOranları.oxivoOrani}</span>
                            </div>
                          </div>
                        </TableCell>
                        {/* Oluşturma */}
                        <TableCell className="py-4 w-36">
                          <div className="text-xs space-y-1">
                            <div className="text-gray-600">
                              {new Date(record.olusturmaTarihi).toLocaleDateString('tr-TR')}
                            </div>
                            {record.kapanmaTarihi && (
                              <div>
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 text-xs">
                                  Kapanış: {new Date(record.kapanmaTarihi).toLocaleDateString('tr-TR')}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        {/* İşlemler */}
                        <TableCell className="py-4 w-32" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col gap-2">
                            {record.aktif ? (
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700 h-8 px-3"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStatus(record.id);
                                }}
                                title="Aktif - Kapat"
                              >
                                ✓ Aktif
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="bg-orange-100 text-orange-700 hover:bg-orange-200 h-8 px-3"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStatus(record.id);
                                }}
                                title="Kapalı - Aç"
                              >
                                🔒 Kapa
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDialog(record);
                              }}
                              title="Güncelle"
                              className="h-8 px-2"
                            >
                              <Pencil size={14} />
                            </Button>
                            {record.aktif ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setClosingRecord(record);
                                }}
                                className="text-orange-600 border-orange-300 hover:bg-orange-50 h-8 px-3"
                                title="Anlaşmayı Kapat"
                              >
                                Kapa
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(record.id);
                                }}
                                className="text-red-600 border-red-300 hover:bg-red-50 h-8 px-2"
                                title="Sil"
                              >
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        {/* Checkbox - En sona taşındı */}
                        <TableCell className="py-4 w-12">
                          <Checkbox
                            checked={selectedRecordsForGroup.includes(record.id)}
                            disabled={isGrouped}
                            onCheckedChange={(checked) => {
                              saveScrollPosition();
                              if (checked) {
                                setSelectedRecordsForGroup([...selectedRecordsForGroup, record.id]);
                              } else {
                                setSelectedRecordsForGroup(selectedRecordsForGroup.filter(id => id !== record.id));
                              }
                              restoreScrollPosition();
                            }}
                            title={isGrouped ? `Bu kayıt "${recordGroup?.name}" grubuna aittir` : ''}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              );
            })()}
          </TableBody>
        </Table>
      )}

      {/* Ek Gelir Detayları Bölümü */}
      {filteredRecords.filter(r => r.ekGelirDetay).length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-purple-900 flex items-center gap-2">
              <span className="text-xl">💰</span>
              Ek Gelir Detayları
            </h3>
            <p className="text-sm text-purple-700 mt-1">
              Aşağıdaki tabloda ek geliri olan TABELA kayıtları gösterilmektedir
            </p>
          </div>

          <div className="border rounded-lg overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-16">KLM</TableHead>
                  <TableHead className="w-32">Grup</TableHead>
                  <TableHead className="w-36">Kısa Açıklama</TableHead>
                  <TableHead className="w-40">Ürün</TableHead>
                  <TableHead className="w-32">Gelir Modeli</TableHead>
                  <TableHead className="w-24">Gelir Türü</TableHead>
                  <TableHead className="w-24">Kullanım</TableHead>
                  <TableHead className="w-24">Kart Tipi</TableHead>
                  <TableHead className="text-right w-24">Tutar</TableHead>
                  <TableHead className="text-right w-20">PF%</TableHead>
                  <TableHead className="text-right w-24">PF-TL</TableHead>
                  <TableHead className="text-right w-20">OX %</TableHead>
                  <TableHead className="text-right w-24">OX TL</TableHead>
                  <TableHead className="text-center w-32">İşlemler</TableHead>
                  <TableHead className="w-12 text-center">Seçim</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Gruplu Ek Gelir kayıtlarını render et */}
                {tabelaGroups.map((group) => {
                  const groupEkGelirRecords = filteredRecords.filter(r => 
                    r.ekGelirDetay && getRecordGroup(r.id)?.id === group.id
                  );
                  
                  if (groupEkGelirRecords.length === 0) return null;
                  
                  const isCollapsed = collapsedGroups.has(group.id);
                  
                  return (
                    <React.Fragment key={`ekgelir-group-${group.id}`}>
                      {/* Ek Gelir Grup Başlığı */}
                      <TableRow 
                        key={`ekgelir-group-header-${group.id}`}
                        className="bg-gradient-to-r from-purple-100 to-purple-50 border-t-2 border-purple-300 hover:from-purple-200 hover:to-purple-100 cursor-pointer"
                        onClick={() => toggleGroupCollapse(group.id)}
                      >
                        <TableCell colSpan={14} className="py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isCollapsed ? (
                                <ChevronRight size={20} className="text-purple-700" />
                              ) : (
                                <ChevronDown size={20} className="text-purple-700" />
                              )}
                              <div className="flex items-center gap-2">
                                <Badge variant="default" className="bg-purple-600 text-white">
                                  {group.name}
                                </Badge>
                                <span className="text-sm text-purple-800">
                                  {groupEkGelirRecords.length} ek gelir kaydı
                                </span>
                                {!group.aktif && (
                                  <Badge variant="secondary" className="bg-gray-400 text-white text-xs">
                                    Pasif
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Ek Gelir Grup Kayıtları - Sadece açıksa ve grup aktifse göster */}
                      {!isCollapsed && group.aktif !== false && groupEkGelirRecords.map((record, indexInGroup) => {
                        const recordGroup = getRecordGroup(record.id);
                        return (
                        <TableRow key={record.id} className="hover:bg-gray-50 bg-purple-50/20">
                      {/* Checkbox sona taşındı */}
                      {/* <TableCell className="py-4">
                        <Checkbox
                          checked={selectedRecordsForGroup.includes(record.id)}
                          disabled={!!recordGroup}
                          onCheckedChange={(checked) => {
                            saveScrollPosition();
                            if (checked) {
                              setSelectedRecordsForGroup([...selectedRecordsForGroup, record.id]);
                            } else {
                              setSelectedRecordsForGroup(selectedRecordsForGroup.filter(id => id !== record.id));
                            }
                            restoreScrollPosition();
                          }}
                          title={recordGroup ? `Bu kayıt "${recordGroup?.name}" grubuna aittir` : ''}
                        />
                      </TableCell> */}
                      {/* KLM - İlk sütun */}
                      <TableCell className="py-4 w-16">
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 font-mono text-xs">
                          {String(indexInGroup + 1).padStart(2, '0')}
                        </Badge>
                      </TableCell>
                      {/* Grup */}
                      <TableCell className="py-4 w-32">
                        {recordGroup ? (
                          <Badge variant="default" className="bg-blue-600 text-white">
                            {getGroupAbbreviation(recordGroup.name)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                      {/* Kısa Açıklama */}
                      <TableCell className="py-4 w-36">
                        {(record as any).kisaAciklama ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs">
                            {(record as any).kisaAciklama}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                      {/* Ürün */}
                      <TableCell className="py-4 w-40">
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300">
                          {kisaltUrunAdi(record.urun || '')}
                        </Badge>
                      </TableCell>
                      {/* Gelir Modeli */}
                      <TableCell className="py-4 w-32">
                        <span>{record.gelirModeli.ad}</span>
                      </TableCell>
                      {/* Gelir Türü */}
                      <TableCell className="py-4 w-24">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                          {record.ekGelirDetay?.gelirTuru}
                        </Badge>
                      </TableCell>
                      {/* Kullanım */}
                      <TableCell className="py-4 w-24">
                        <Badge variant={record.ekGelirDetay?.kullanim === 'Yurt İçi' ? 'default' : 'secondary'}>
                          {record.ekGelirDetay?.kullanim}
                        </Badge>
                      </TableCell>
                      {/* Kart Tipi */}
                      <TableCell className="py-4 w-24">
                        <Badge 
                          variant={record.ekGelirDetay?.kartTipi === 'Credit' ? 'default' : record.ekGelirDetay?.kartTipi === 'Debit' ? 'secondary' : 'outline'}
                          className={record.ekGelirDetay?.kartTipi?.includes('Paçal') ? 'bg-purple-100 text-purple-700 border-purple-300' : ''}
                        >
                          {record.ekGelirDetay?.kartTipi?.replace(' (Tüm Kart Tipleri)', '') || record.ekGelirDetay?.kartTipi}
                        </Badge>
                      </TableCell>
                      {/* Tutar */}
                      <TableCell className="text-right w-24">
                        <span className="text-sm bg-purple-50 px-2 py-1 rounded">
                          {parseFloat(record.ekGelirDetay?.tutar || '0').toFixed(2)}₺
                        </span>
                      </TableCell>
                      {/* PF% */}
                      <TableCell className="text-right w-20" onClick={(e) => e.stopPropagation()}>
                        <Input
                          type="number"
                          step="0.01"
                          value={record.ekGelirDetay?.pfYuzde || '0'}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => {
                            e.stopPropagation();
                            saveScrollPosition();
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            saveScrollPosition();
                            const newPfYuzde = e.target.value;
                            const tutar = parseFloat(record.ekGelirDetay?.tutar || '0');
                            const pfYuzdeNum = parseFloat(newPfYuzde) || 0;
                            const newPfTL = ((tutar * pfYuzdeNum) / 100).toFixed(2);
                            
                            const updatedRecords = tabelaRecords.map(r => 
                              r.id === record.id 
                                ? {
                                    ...r,
                                    ekGelirDetay: {
                                      ...r.ekGelirDetay!,
                                      pfYuzde: newPfYuzde,
                                      pfTL: newPfTL
                                    },
                                    paylaşımOranları: {
                                      ...r.paylaşımOranları,
                                      kurulusOrani: newPfYuzde
                                    }
                                  }
                                : r
                            );
                            
                            if (onTabelaRecordsChange) {
                              onTabelaRecordsChange(updatedRecords);
                            }
                            
                            restoreScrollPosition();
                          }}
                          className="w-24 text-right"
                        />
                      </TableCell>
                      {/* PF-TL */}
                      <TableCell className="text-right w-24">
                        <span className="text-sm bg-green-50 px-2 py-1 rounded">
                          {parseFloat(record.ekGelirDetay?.pfTL || '0').toFixed(2)}₺
                        </span>
                      </TableCell>
                      {/* OX % */}
                      <TableCell className="text-right w-20" onClick={(e) => e.stopPropagation()}>
                        <Input
                          type="number"
                          step="0.01"
                          value={record.ekGelirDetay?.oxYuzde || '0'}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => {
                            e.stopPropagation();
                            saveScrollPosition();
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            saveScrollPosition();
                            const newOxYuzde = e.target.value;
                            const tutar = parseFloat(record.ekGelirDetay?.tutar || '0');
                            const oxYuzdeNum = parseFloat(newOxYuzde) || 0;
                            const newOxTL = ((tutar * oxYuzdeNum) / 100).toFixed(2);
                            
                            const updatedRecords = tabelaRecords.map(r => 
                              r.id === record.id 
                                ? {
                                    ...r,
                                    ekGelirDetay: {
                                      ...r.ekGelirDetay!,
                                      oxYuzde: newOxYuzde,
                                      oxTL: newOxTL
                                    },
                                    paylaşımOranları: {
                                      ...r.paylaşımOranları,
                                      oxivoOrani: newOxYuzde
                                    }
                                  }
                                : r
                            );
                            
                            if (onTabelaRecordsChange) {
                              onTabelaRecordsChange(updatedRecords);
                            }
                            
                            restoreScrollPosition();
                          }}
                          className="w-24 text-right"
                        />
                      </TableCell>
                      {/* OX TL */}
                      <TableCell className="text-right w-24">
                        <span className="text-sm bg-blue-50 px-2 py-1 rounded">
                          {parseFloat(record.ekGelirDetay?.oxTL || '0').toFixed(2)}₺
                        </span>
                      </TableCell>
                      {/* İşlemler */}
                      <TableCell className="w-32">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenDialog(record)}
                            title="Düzenle"
                            className="text-blue-600"
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(record.id)}
                            title="Sil"
                            className="text-red-600"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                      {/* Checkbox - En sona taşındı */}
                      <TableCell className="py-4 w-12 text-center">
                        <Checkbox
                          checked={selectedRecordsForGroup.includes(record.id)}
                          disabled={!!recordGroup}
                          onCheckedChange={(checked) => {
                            saveScrollPosition();
                            if (checked) {
                              setSelectedRecordsForGroup([...selectedRecordsForGroup, record.id]);
                            } else {
                              setSelectedRecordsForGroup(selectedRecordsForGroup.filter(id => id !== record.id));
                            }
                            restoreScrollPosition();
                          }}
                          title={recordGroup ? `Bu kayıt "${recordGroup?.name}" grubuna aittir` : ''}
                        />
                      </TableCell>
                    </TableRow>
                    );
                  })}
                    </React.Fragment>
                  );
                })}
                
                {/* Gruplanmamış Ek Gelir Kayıtları */}
                {(() => {
                  const ungroupedEkGelirRecords = filteredRecords.filter(r => 
                    r.ekGelirDetay && !getRecordGroup(r.id)
                  );
                  
                  if (ungroupedEkGelirRecords.length === 0) return null;
                  
                  const isCollapsed = collapsedGroups.has('UNGROUPED');
                  
                  return (
                    <React.Fragment key="ungrouped-ekgelir-section">
                      {/* Gruplanmamış Ek Gelir Başlığı */}
                      <TableRow 
                        key="ungrouped-ekgelir-header"
                        className="bg-gradient-to-r from-gray-100 to-gray-50 border-t-2 border-gray-300 hover:from-gray-200 hover:to-gray-100 cursor-pointer"
                        onClick={() => toggleGroupCollapse('UNGROUPED')}
                      >
                        <TableCell colSpan={14} className="py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isCollapsed ? (
                                <ChevronRight size={20} className="text-gray-700" />
                              ) : (
                                <ChevronDown size={20} className="text-gray-700" />
                              )}
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-gray-200 text-gray-700 border-gray-400">
                                  Gruplanmamış Ek Gelir Kayıtları
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {ungroupedEkGelirRecords.length} kayıt
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Gruplanmamı�� Ek Gelir Kayıtları - Sadece açıksa göster */}
                      {!isCollapsed && ungroupedEkGelirRecords.map((record, indexInUngrouped) => {
                        const recordGroup = getRecordGroup(record.id);
                        return (
                          <TableRow key={record.id} className="hover:bg-gray-50">
                            {/* Checkbox sona taşındı */}
                            {/* <TableCell className="py-4">
                              <Checkbox
                                checked={selectedRecordsForGroup.includes(record.id)}
                                disabled={!!recordGroup}
                                onCheckedChange={(checked) => {
                                  saveScrollPosition();
                                  if (checked) {
                                    setSelectedRecordsForGroup([...selectedRecordsForGroup, record.id]);
                                  } else {
                                    setSelectedRecordsForGroup(selectedRecordsForGroup.filter(id => id !== record.id));
                                  }
                                  restoreScrollPosition();
                                }}
                                title={recordGroup ? `Bu kayıt \"${recordGroup?.name}\" grubuna aittir` : ''}
                              />
                            </TableCell> */}
                            {/* KLM - İlk sütun */}
                            <TableCell className="py-4 w-16">
                              <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 font-mono text-xs">
                                {String(indexInUngrouped + 1).padStart(2, '0')}
                              </Badge>
                            </TableCell>
                            {/* Grup */}
                            <TableCell className="py-4 w-32">
                              <span className="text-xs text-gray-400">-</span>
                            </TableCell>
                            {/* Kısa Açıklama */}
                            <TableCell className="py-4 w-36">
                              {(record as any).kisaAciklama ? (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs">
                                  {(record as any).kisaAciklama}
                                </Badge>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </TableCell>
                            {/* Ürün */}
                            <TableCell className="py-4 w-40">
                              {record.urun ? (
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300">
                                  {kisaltUrunAdi(record.urun)}
                                </Badge>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </TableCell>
                            {/* Gelir Modeli */}
                            <TableCell className="py-4 w-32">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                {record.gelirModeli.ad}
                              </Badge>
                            </TableCell>
                            {/* Gelir Türü */}
                            <TableCell className="py-4 w-24">
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                                {record.ekGelirDetay?.gelirTuru || '-'}
                              </Badge>
                            </TableCell>
                            {/* Kullanım */}
                            <TableCell className="py-4 w-24">
                              <Badge variant={record.ekGelirDetay?.kullanim === 'Yurt İçi' ? 'default' : 'secondary'}>
                                {record.ekGelirDetay?.kullanim || '-'}
                              </Badge>
                            </TableCell>
                            {/* Kart Tipi */}
                            <TableCell className="py-4 w-24">
                              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                                {record.ekGelirDetay?.kartTipi ? record.ekGelirDetay.kartTipi.split(' (')[0] : '-'}
                              </Badge>
                            </TableCell>
                            {/* Tutar */}
                            <TableCell className="text-right w-24">
                              <span className="text-sm bg-purple-50 px-2 py-1 rounded">
                                {parseFloat(record.ekGelirDetay?.tutar || '0').toFixed(2)}₺
                              </span>
                            </TableCell>
                            {/* PF% */}
                            <TableCell className="text-right w-20">
                              <span className="text-xs">{parseFloat(record.ekGelirDetay?.pfYuzde || '0').toFixed(2)}%</span>
                            </TableCell>
                            {/* PF-TL */}
                            <TableCell className="text-right w-24">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={parseFloat(record.ekGelirDetay?.pfYuzde || '0').toFixed(2)}
                                onChange={(e) => {
                                  saveScrollPosition();
                                  
                                  const newPfYuzde = e.target.value;
                                  const tutar = parseFloat(record.ekGelirDetay?.tutar || '0');
                                  const newPfTL = ((tutar * parseFloat(newPfYuzde)) / 100).toFixed(2);
                                  
                                  const oxYuzde = parseFloat(record.ekGelirDetay?.oxYuzde || '0');
                                  const newOxTL = ((tutar * oxYuzde) / 100).toFixed(2);
                                  
                                  const updatedRecords = tabelaRecords.map(r => 
                                    r.id === record.id 
                                      ? {
                                          ...r,
                                          ekGelirDetay: {
                                            ...r.ekGelirDetay!,
                                            pfYuzde: newPfYuzde,
                                            pfTL: newPfTL
                                          },
                                          paylaşımOranları: {
                                            ...r.paylaşımOranları,
                                            kurulusOrani: newPfYuzde
                                          }
                                        }
                                      : r
                                  );
                                  
                                  if (onTabelaRecordsChange) {
                                    onTabelaRecordsChange(updatedRecords);
                                  }
                                  
                                  restoreScrollPosition();
                                }}
                                className="w-24 text-right"
                              />
                            </TableCell>
                            {/* OX % */}
                            <TableCell className="text-right w-20">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={parseFloat(record.ekGelirDetay?.oxYuzde || '0').toFixed(2)}
                                onChange={(e) => {
                                  saveScrollPosition();
                                  
                                  const newOxYuzde = e.target.value;
                                  const tutar = parseFloat(record.ekGelirDetay?.tutar || '0');
                                  const newOxTL = ((tutar * parseFloat(newOxYuzde)) / 100).toFixed(2);
                                  
                                  const updatedRecords = tabelaRecords.map(r => 
                                    r.id === record.id 
                                      ? {
                                          ...r,
                                          ekGelirDetay: {
                                            ...r.ekGelirDetay!,
                                            oxYuzde: newOxYuzde,
                                            oxTL: newOxTL
                                          },
                                          paylaşımOranları: {
                                            ...r.paylaşımOranları,
                                            oxivoOrani: newOxYuzde
                                          }
                                        }
                                      : r
                                  );
                                  
                                  if (onTabelaRecordsChange) {
                                    onTabelaRecordsChange(updatedRecords);
                                  }
                                  
                                  restoreScrollPosition();
                                }}
                                className="w-24 text-right"
                              />
                            </TableCell>
                            {/* OX TL */}
                            <TableCell className="text-right w-24">
                              <span className="text-sm bg-blue-50 px-2 py-1 rounded">
                                {parseFloat(record.ekGelirDetay?.oxTL || '0').toFixed(2)}₺
                              </span>
                            </TableCell>
                            {/* İşlemler */}
                            <TableCell className="w-32">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleOpenDialog(record)}
                                  title="Düzenle"
                                  className="text-blue-600"
                                >
                                  <Pencil size={14} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(record.id)}
                                  title="Sil"
                                  className="text-red-600"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </TableCell>
                            {/* Checkbox - En sona taşındı */}
                            <TableCell className="py-4 w-12 text-center">
                              <Checkbox
                                checked={selectedRecordsForGroup.includes(record.id)}
                                disabled={!!recordGroup}
                                onCheckedChange={(checked) => {
                                  saveScrollPosition();
                                  if (checked) {
                                    setSelectedRecordsForGroup([...selectedRecordsForGroup, record.id]);
                                  } else {
                                    setSelectedRecordsForGroup(selectedRecordsForGroup.filter(id => id !== record.id));
                                  }
                                  restoreScrollPosition();
                                }}
                                title={recordGroup ? `Bu kayıt "${recordGroup?.name}" grubuna aittir` : ''}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </React.Fragment>
                  );
                })()}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? 'TABELA Kaydını Düzenle' : 'Yeni TABELA Kaydı'}
            </DialogTitle>
            <DialogDescription>
              {firmaAdi} için TABELA bilgilerini giriniz (Adım {currentStep}/9)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Gruplanmış Kayıt Uyarısı */}
            {isEditingGroupedRecord && editingRecord && (() => {
              const group = getRecordGroup(editingRecord.id);
              return group ? (
                <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🔒</div>
                    <div>
                      <p className="text-sm text-orange-900 mb-1">
                        <strong>Gruplanmış Kayıt:</strong> Bu TABELA kaydı "{group.name}" grubuna aittir
                      </p>
                      <p className="text-xs text-orange-700">
                        Gruplanmış kayıtların temel ayarları (Ürün, Gelir Modeli, Kart Programları, Yurt İçi/Dışı, Kart Tipi) değiştirilemez. 
                        Sadece komisyon oranları, paylaşım oranları ve açıklama güncellenebilir.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}

            {/* Firma Bilgisi - Otomatik */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm">
                <span className="text-gray-600">Kuruluş:</span>
                <span className="ml-2 font-medium">{firmaAdi}</span>
                <span className="ml-4 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                  {odemeKurulusuTipi}
                </span>
              </div>
            </div>

            {/* Step 0: Kısa Açıklama */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Adım 1/10: Kısa Açıklama (Opsiyonel)</h4>
                <p className="text-sm text-gray-600">
                  TABELA kaydı için kısa bir açıklama girebilirsiniz (maksimum 15 karakter)
                </p>
                
                <div className="space-y-2">
                  <Label>Açıklama (Opsiyonel - Maksimum 15 karakter)</Label>
                  <Input
                    value={kisaAciklama}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 15) {
                        setKisaAciklama(value);
                      }
                    }}
                    placeholder="açıklamanız varsa"
                    maxLength={15}
                  />
                  <p className="text-xs text-gray-500">
                    {kisaAciklama.length}/15 karakter
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    💡 Bu alan opsiyoneldir. TABELA kaydınız için kısa bir a��ıklama girebilirsiniz.
                  </p>
                </div>
              </div>
            )}

            {/* Step 1: Ürün + Gelir Modeli */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">
                  Adım 2/10: Ürün ve Gelir Modeli {isEditingGroupedRecord && <span className="text-orange-600">(Kilitli)</span>}
                </h4>
                <p className="text-sm text-gray-600">
                  {firmaAdi} için ürün tipi ve gelir modelini seçiniz
                </p>
                
                {/* Ürün Seçimi */}
                <ModernFormSelect
                  label="Ürün"
                  options={[
                    { value: 'UnattendedPOS', label: 'UnattendedPOS' },
                    { value: 'AttendedPOS', label: 'AttendedPOS' },
                    { value: 'SoftPOS', label: 'SoftPOS' },
                    { value: 'SanalPOS', label: 'SanalPOS' }
                  ]}
                  value={urun}
                  onChange={(value: any) => setUrun(value)}
                  placeholder="Ürün seçiniz"
                  disabled={isEditingGroupedRecord}
                  error={isEditingGroupedRecord ? '🔒 Bu alan gruplanmış kayıt olduğu için değiştirilemez' : undefined}
                />

                {/* Gelir Modeli */}
                <div className="space-y-2">
                  {/* Paçal Bilgilendirme */}
                  {!isEditingGroupedRecord && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="text-sm text-purple-800">
                        💡 <strong>Önemli:</strong> "Paçal" içeren gelir modelleri seçildiğinde, kart tipi otomatik olarak <strong>"Paçal"</strong> olarak ayarlanır.
                      </p>
                    </div>
                  )}

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
                        options={aktifGelirModelleri.map(model => ({
                          value: model.id,
                          label: (model.ad || '') + (model.ad?.toLowerCase().includes('paçal') ? ' 🔒' : ''),
                          description: model.ad?.toLowerCase().includes('paçal')
                            ? 'Kart tipi otomatik "Paçal" olarak ayarlanır'
                            : model.ad?.toLowerCase().includes('hazine')
                            ? 'Sabit tutar bazlı gelir modeli'
                            : model.ad?.toLowerCase().includes('ortaklı')
                            ? 'Alış-satış farkı bazlı gelir modeli'
                            : 'Komisyon oranı bazlı gelir modeli'
                        }))}
                        value={gelirModeliId}
                        onChange={setGelirModeliId}
                        placeholder="Gelir modeli seçiniz"
                        disabled={isEditingGroupedRecord}
                        error={isEditingGroupedRecord ? '🔒 Bu alan gruplanmış kayıt olduğu için değiştirilemez' : undefined}
                        required
                      />
                      
                      {gelirModeliId && !isEditingGroupedRecord && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                          💡 Seçilen: <strong>{aktifGelirModelleri.find(g => g.id === gelirModeliId)?.ad}</strong>
                        </div>
                      )}
                    </div>
                  )}
                  {isPacalGelirModeli && !isEditingGroupedRecord && (
                    <p className="text-xs text-purple-600 mt-1">
                      ✓ Paçal gelir modeli seçildi - Kart tipi otomatik "Paçal" olacaktır
                    </p>
                  )}
                </div>

                {/* Ek Gelirler - Gelir Modeline Ait */}
                {gelirModeliId && urun && (() => {
                  // Seçilen gelir modelini bul
                  const selectedGelirModel = aktifGelirModelleri.find(g => g.id === gelirModeliId);
                  if (!selectedGelirModel) return null;

                  // Bu gelir modeline ve ürüne uygun ek gelirleri filtrele
                  const ilgiliEkGelirler = aktifEkGelirler.filter(eg => 
                    eg.gelirModeli === selectedGelirModel.ad && 
                    eg.urun === urun
                  );

                  if (ilgiliEkGelirler.length === 0) return null;

                  return (
                    <div className="space-y-2">
                      <ModernFormSelect
                        label="İlgili Ek Gelirler (Opsiyonel)"
                        options={[
                          { value: 'NONE', label: 'Seçim yapma (yok)' },
                          ...ilgiliEkGelirler.map((ekGelir) => ({
                            value: ekGelir.id,
                            label: `${ekGelir.gelirTuru} + ${ekGelir.kullanim}`
                          }))
                        ]}
                        value={selectedEkGelirId}
                        onChange={setSelectedEkGelirId}
                        placeholder="Ek gelir seçmek isterseniz buradan seçin"
                        disabled={isEditingGroupedRecord}
                        error={isEditingGroupedRecord ? '🔒 Bu alan gruplanmış kayıt olduğu için değiştirilemez' : undefined}
                      />
                      {selectedEkGelirId && selectedEkGelirId !== 'NONE' && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Ek gelir seçildi
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Step 2: Kart Program Seçimi */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">
                  Adım 3/10: Kart Program Seçimi {isEditingGroupedRecord && <span className="text-orange-600">(Kilitli)</span>}
                </h4>
                <p className="text-sm text-gray-600">
                  Bu TABELA'nın geçerli olacağı kart programlarını seçiniz
                </p>

                <div className="space-y-2">
                  <Label>Bu TABELA'nın geçerli olduğu kart programlarını seçiniz</Label>
                  
                  {/* Hepsi Seçeneği */}
                  <div className={`flex items-center gap-2 p-3 border rounded-lg ${isEditingGroupedRecord ? 'bg-orange-50 border-orange-300' : 'bg-blue-50 border-blue-200'}`}>
                    <Checkbox
                      id="all-kart-programs"
                      checked={selectedKartProgramIds.includes('ALL')}
                      disabled={isEditingGroupedRecord}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedKartProgramIds(['ALL']);
                        } else {
                          setSelectedKartProgramIds([]);
                        }
                      }}
                    />
                    <Label htmlFor="all-kart-programs" className={`flex-1 ${isEditingGroupedRecord ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                      <span className="font-medium">Hepsi</span>
                      <span className="text-xs text-gray-600 ml-2">(Tüm kart programları için geçerli)</span>
                    </Label>
                  </div>

                  {/* Kart Program Listesi */}
                  {aktifKartProgramlar.length === 0 ? (
                    <div className="text-sm text-gray-500 p-4 text-center border rounded-lg">
                      Tanımlar modülünde aktif kart programı bulunamadı
                    </div>
                  ) : (
                    <div className="border rounded-lg divide-y" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                      {aktifKartProgramlar.map((program) => (
                        <div key={program.id} className={`flex items-center gap-2 p-3 ${isEditingGroupedRecord ? 'bg-orange-50/50' : 'hover:bg-gray-50'}`}>
                          <Checkbox
                            id={`kart-program-${program.id}`}
                            checked={selectedKartProgramIds.includes(program.id) && !selectedKartProgramIds.includes('ALL')}
                            disabled={selectedKartProgramIds.includes('ALL') || isEditingGroupedRecord}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedKartProgramIds([...selectedKartProgramIds.filter(id => id !== 'ALL'), program.id]);
                              } else {
                                setSelectedKartProgramIds(selectedKartProgramIds.filter(id => id !== program.id));
                              }
                            }}
                          />
                          <Label htmlFor={`kart-program-${program.id}`} className={`flex-1 ${isEditingGroupedRecord ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{program.kartAdi}</span>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedKartProgramIds.length > 0 && (
                    <div className={`text-sm p-2 rounded ${isEditingGroupedRecord ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50'}`}>
                      {isEditingGroupedRecord ? '🔒' : '✓'} {selectedKartProgramIds.includes('ALL') ? 'Tüm kart programları' : `${selectedKartProgramIds.length} kart programı`} seçildi
                      {isEditingGroupedRecord && ' (değiştirilemez)'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Yurt İçi/Dışı */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h4>Adım 4/10: Yurt İçi / Yurt Dışı {isEditingGroupedRecord && <span className="text-orange-600">(Kilitli)</span>}</h4>

                <ModernFormSelect
                  label="Yurt İçi / Yurt Dışı"
                  options={[
                    { value: 'Yurt İçi', label: 'Yurt İçi' },
                    { value: 'Yurt Dışı', label: 'Yurt Dışı' }
                  ]}
                  value={yurtIciDisi}
                  onChange={v => setYurtIciDisi(v as 'Yurt İçi' | 'Yurt Dışı')}
                  placeholder="Seçiniz"
                  disabled={isEditingGroupedRecord}
                  error={isEditingGroupedRecord ? '🔒 Bu alan gruplanmış kayıt olduğu için değiştirilemez' : undefined}
                />
              </div>
            )}

            {/* Step 4: Kart Tipi */}
            {currentStep === 4 && (() => {
              const selectedGelirModeli = aktifGelirModelleri.find(g => g.id === gelirModeliId);
              
              return (
              <div className="space-y-4">
                <h4>Adım 5/10: Kart Tipi Seçimi {isEditingGroupedRecord && <span className="text-orange-600">(Kilitli)</span>}</h4>

                {isPacalGelirModeli && !isEditingGroupedRecord && (
                  <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">🔒</div>
                      <div>
                        <p className="text-sm text-purple-900 mb-1">
                          <strong>Otomatik Ayar:</strong> Paçal gelir modeli seçildi
                        </p>
                        <p className="text-xs text-purple-700">
                          Kart tipi otomatik olarak <strong>"Paçal"</strong> olarak ayarlanmıştır ve değiştirilemez.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <ModernFormSelect
                  label={
                    <span>
                      Kart Tipi
                      {isPacalGelirModeli && !isEditingGroupedRecord && <span className="text-purple-600"> (Otomatik)</span>}
                      {isEditingGroupedRecord && <span className="text-orange-600"> (Kilitli)</span>}
                    </span>
                  }
                  options={[
                    { value: 'Credit', label: 'Credit' },
                    { value: 'Debit', label: 'Debit' },
                    { value: 'Paçal', label: 'Paçal' }
                  ]}
                  value={kartTipi}
                  onChange={v => setKartTipi(v as 'Credit' | 'Debit' | 'Paçal')}
                  placeholder="Kart tipi seçiniz"
                  disabled={isPacalGelirModeli || isEditingGroupedRecord}
                  error={
                    isPacalGelirModeli && !isEditingGroupedRecord
                      ? '✓ Bu alan otomatik olarak ayarlanmıştır ve değiştirilemez'
                      : isEditingGroupedRecord
                      ? '🔒 Bu alan gruplanmış kayıt olduğu için değiştirilemez'
                      : undefined
                  }
                />
              </div>
              );
            })()}

            {/* Step 5: Vadeler ve Komisyon Oranları */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <h4>Adım 6/10: Vade Seçimi</h4>
                
                <div className="space-y-3">
                  <Label>Kullanmak istediğiniz vadeleri seçiniz</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="w-12 text-center">Aktif</TableHead>
                          <TableHead>Vade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {komisyonOranları.map((item, idx) => (
                          <TableRow key={idx} className={!item.aktif ? 'bg-gray-50' : ''}>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={item.aktif}
                                onCheckedChange={(checked) => {
                                  const updated = [...komisyonOranları];
                                  updated[idx].aktif = checked === true;
                                  setKomisyonOranları(updated);
                                }}
                              />
                            </TableCell>
                            <TableCell className={!item.aktif ? 'line-through text-gray-400' : ''}>
                              {item.vade.replace(' (Peşin)', '')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-xs text-gray-500">
                    💡 Kullanılmayacak vadelerin işaretini kaldırabilirsiniz
                  </p>
                </div>
              </div>
            )}

            {/* Step 6: Alış/Satış/Kar TL */}
            {currentStep === 6 && (() => {
              // Sabit komisyon mu kontrol et
              const isSabitKomisyon = selectedGelirModeli?.ad?.toLowerCase().includes('sabit komisyon') || 
                                     selectedGelirModeli?.ad?.toLowerCase() === 'sabit komisyon' || false;
              
              return (
                <div className="space-y-4">
                  <h4>Adım 7/10: {isSabitKomisyon ? 'Kar (Komisyon Oranları)' : 'Alış, Satış ve Kar (Komisyon Oranları)'}</h4>
                  
                  <div className="space-y-3">
                    {isSabitKomisyon ? (
                      // Sabit Komisyon için sadece Kar (Komisyon %) göster
                      <>
                        <Label>Her vade için Kar (Komisyon) oranını giriniz</Label>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50">
                                <TableHead>Vade</TableHead>
                                <TableHead className="text-right bg-green-50">Kar (Komisyon %)</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {komisyonOranları.filter(k => k.aktif).map((item, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>{item.vade.replace(' (Peşin)', '')}</TableCell>
                                  <TableCell>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-700">%</span>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0,00"
                                        value={item.oran || ''}
                                        onChange={(e) => {
                                          const updated = [...komisyonOranları];
                                          const actualIdx = komisyonOranları.findIndex(k => k.vade === item.vade);
                                          updated[actualIdx].oran = e.target.value;
                                          setKomisyonOranları(updated);
                                        }}
                                        className="text-right pl-8 bg-green-50"
                                      />
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <p className="text-xs text-green-600">
                          💡 Sabit komisyon oranını her vade için doğrudan girebilirsiniz
                        </p>
                      </>
                    ) : (
                      // Diğer gelir modelleri için Alış, Satış, Kar göster
                      <>
                        <Label>Her vade için Alış ve Satış oranlarını giriniz - Kar (Komisyon) otomatik hesaplanır</Label>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50">
                                <TableHead>Vade</TableHead>
                                <TableHead className="text-right">Alış (%)</TableHead>
                                <TableHead className="text-right">Satış (%)</TableHead>
                                <TableHead className="text-right bg-green-50">Kar (Komisyon %)</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {komisyonOranları.filter(k => k.aktif).map((item, idx) => {
                                // Kar otomatik hesaplama: Satış - Alış
                                const alis = parseFloat(item.alisTL || '0');
                                const satis = parseFloat(item.satisTL || '0');
                                const kar = satis - alis;
                                const karFormatted = kar > 0 ? kar.toFixed(2) : '0.00';
                                
                                return (
                                  <TableRow key={idx}>
                                    <TableCell>{item.vade.replace(' (Peşin)', '')}</TableCell>
                                    <TableCell>
                                      <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder="0,00"
                                          value={item.alisTL || ''}
                                          onChange={(e) => {
                                            const updated = [...komisyonOranları];
                                            const actualIdx = komisyonOranları.findIndex(k => k.vade === item.vade);
                                            updated[actualIdx].alisTL = e.target.value;
                                            
                                            // Kar otomatik hesapla ve kaydet
                                            const newAlis = parseFloat(e.target.value || '0');
                                            const newSatis = parseFloat(updated[actualIdx].satisTL || '0');
                                            const newKar = newSatis - newAlis;
                                            updated[actualIdx].karTL = newKar > 0 ? newKar.toFixed(2) : '0.00';
                                            
                                            setKomisyonOranları(updated);
                                          }}
                                          className="text-right pl-8"
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder="0,00"
                                          value={item.satisTL || ''}
                                          onChange={(e) => {
                                            const updated = [...komisyonOranları];
                                            const actualIdx = komisyonOranları.findIndex(k => k.vade === item.vade);
                                            updated[actualIdx].satisTL = e.target.value;
                                            
                                            // Kar otomatik hesapla ve kaydet
                                            const newAlis = parseFloat(updated[actualIdx].alisTL || '0');
                                            const newSatis = parseFloat(e.target.value || '0');
                                            const newKar = newSatis - newAlis;
                                            updated[actualIdx].karTL = newKar > 0 ? newKar.toFixed(2) : '0.00';
                                            
                                            setKomisyonOranları(updated);
                                          }}
                                          className="text-right pl-8"
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-700">%</span>
                                        <Input
                                          type="text"
                                          value={karFormatted}
                                          readOnly
                                          disabled
                                          className="text-right pl-8 bg-green-50 text-green-700"
                                        />
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                        <p className="text-xs text-green-600">
                          💡 Kar (Komisyon) = Satış - Alış olarak otomatik hesaplanır ve bu değer komisyon oranı olarak kullanılır
                        </p>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Step 7: Paylaşım Oranları */}
            {currentStep === 7 && (
              <div className="space-y-4">
                <h4>Adım 8/10: Paylaşım Oranları</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{firmaTipi === 'Banka' ? 'EPK' : 'PF'} Paylaşım Oranı (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="50.00"
                      value={kurulusOrani}
                      onChange={(e) => setKurulusOrani(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Kuruluşa ait gelir paylaşım yüzdesi
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>OXİVO Paylaşım Oranı (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="50.00"
                      value={oxivoOrani}
                      onChange={(e) => setOxivoOrani(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      OXİVO'ya ait gelir paylaşım yüzdesi
                    </p>
                  </div>
                </div>

                {kurulusOrani && oxivoOrani && (
                  <div className={`p-3 rounded text-sm ${
                    (parseFloat(kurulusOrani) + parseFloat(oxivoOrani)) === 100
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-orange-50 text-orange-700 border border-orange-200'
                  }`}>
                    {(parseFloat(kurulusOrani) + parseFloat(oxivoOrani)) === 100
                      ? '✓ Toplam: 100% - Doğru!'
                      : `⚠️ Toplam: ${(parseFloat(kurulusOrani) + parseFloat(oxivoOrani)).toFixed(2)}% - Toplamın 100% olması önerilir`
                    }
                  </div>
                )}
              </div>
            )}

            {/* Step 8: Açıklama */}
            {currentStep === 8 && (
              <div className="space-y-4">
                <h4>Adım 9/10: Açıklama (Opsiyonel)</h4>
                
                <div className="space-y-2">
                  <Label>Açıklama / Not</Label>
                  <Textarea
                    placeholder="Bu TABELA kaydı ile ilgili notlarınızı buraya ekleyebilirsiniz..."
                    value={aciklama}
                    onChange={(e) => setAciklama(e.target.value)}
                    rows={5}
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500">
                    💡 Bu alan isteğe bağlıdır
                  </p>
                </div>
              </div>
            )}

            {/* Step 9: Fotoğraf */}
            {currentStep === 9 && (
              <div className="space-y-4">
                <h4>Adım 10/10: Fotoğraf Yükleme (Opsiyonel)</h4>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>TABELA Fotoğrafı</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      {fotograf ? (
                        <div className="space-y-4">
                          <div className="relative inline-block">
                            <img 
                              src={fotograf} 
                              alt="TABELA Fotoğraf" 
                              className="max-h-64 rounded border"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setFotograf('')}
                              className="absolute top-2 right-2"
                            >
                              <X size={16} />
                            </Button>
                          </div>
                          <p className="text-sm text-green-600">✓ Fotoğraf yüklendi</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <ImageIcon size={48} className="mx-auto text-gray-300" />
                          <div>
                            <Label 
                              htmlFor="fotograf-upload"
                              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Upload size={18} />
                              <span>Fotoğraf Seç</span>
                            </Label>
                            <Input
                              id="fotograf-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            Maksimum 2MB, JPG/PNG formatında
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    💡 Bu alan isteğe bağlıdır
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              İptal
            </Button>
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevStep}>
                Geri
              </Button>
            )}
            {currentStep < 9 ? (
              <Button onClick={handleNextStep}>
                İleri
              </Button>
            ) : (
              <Button onClick={handleSave}>
                {editingRecord ? 'Güncelle' : 'Kaydet'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grup Oluştur/Düzenle Dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? 'TABELA Grubunu Düzenle' : 'Yeni TABELA Grubu Oluştur'}
            </DialogTitle>
            <DialogDescription>
              Birden fazla TABELA kaydını gruplandırarak yönetimi kolaylaştırın
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Grup Bilgileri */}
            <div className="space-y-4">
              <h4>Grup Bilgileri</h4>
              
              <div className="space-y-2">
                <Label>Grup İsmi *</Label>
                <Input
                  placeholder="Örn: 2024 Q1 TABELA Kayıtları"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Geçerlilik Başlangıç *</Label>
                  <Input
                    type="date"
                    value={groupStartDate}
                    onChange={(e) => setGroupStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Geçerlilik Bitiş</Label>
                  <Input
                    type="date"
                    value={groupEndDate}
                    onChange={(e) => setGroupEndDate(e.target.value)}
                    placeholder="Süresiz için boş bırakın"
                  />
                  <p className="text-xs text-gray-500">
                    Boş bırakılırsa süresiz olarak kabul edilir
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-1">
                  <Label htmlFor="group-aktif" className="cursor-pointer">
                    Grup Durumu
                  </Label>
                  <p className="text-xs text-gray-500">
                    {groupAktif ? 'Grup aktif - Hakediş için kullanılabilir' : 'Grup pasif - Hakediş için kullanılamaz'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${groupAktif ? 'text-green-600' : 'text-gray-400'}`}>
                    {groupAktif ? 'Aktif' : 'Pasif'}
                  </span>
                  <Switch
                    id="group-aktif"
                    checked={groupAktif}
                    onCheckedChange={setGroupAktif}
                  />
                </div>
              </div>
            </div>

            {/* TABELA Seçimi */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4>TABELA Kayıtları Seçimi *</h4>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Otomatik gruplama önerisi: Aynı kart programlarına sahip kayıtları seç
                      if (availableRecordsForGroup.length === 0) return;
                      
                      // En yaygın kart programı kombinasyonunu bul
                      const programCombinations: Record<string, string[]> = {};
                      availableRecordsForGroup.forEach(record => {
                        const programIds = record.kartProgramIds || record.bankIds || [];
                        const key = programIds.sort().join(',');
                        if (!programCombinations[key]) {
                          programCombinations[key] = [];
                        }
                        programCombinations[key].push(record.id);
                      });
                      
                      // En çok tekrar eden kombinasyonu bul
                      let maxCount = 0;
                      let suggestedIds: string[] = [];
                      Object.entries(programCombinations).forEach(([key, ids]) => {
                        if (ids.length > maxCount) {
                          maxCount = ids.length;
                          suggestedIds = ids;
                        }
                      });
                      
                      if (suggestedIds.length > 1) {
                        setSelectedRecordsForGroup(suggestedIds);
                        toast.success(`${suggestedIds.length} adet benzer TABELA kaydı önerildi`);
                      } else {
                        toast.info('Otomatik gruplama için yeterli benzer kayıt bulunamadı');
                      }
                    }}
                  >
                    ✨ Otomatik Öner
                  </Button>
                  <Badge variant="secondary">
                    {selectedRecordsForGroup.length} kayıt seçildi
                  </Badge>
                </div>
              </div>
              
              {availableRecordsForGroup.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    Sadece <strong>başka gruplara atanmamış ve aktif</strong> olan TABELA kayıtları gösteriliyor. 
                    Toplam {availableRecordsForGroup.length} kayıt seçilebilir.
                    {tabelaRecords.filter(r => r.aktif).length - availableRecordsForGroup.length > 0 && (
                      <span className="block mt-1">
                        ({tabelaRecords.filter(r => r.aktif).length - availableRecordsForGroup.length} kayıt zaten başka gruplarda)
                      </span>
                    )}
                  </p>
                </div>
              )}

              {availableRecordsForGroup.length === 0 ? (
                <div className="text-sm text-gray-500 p-4 text-center border rounded-lg">
                  {editingGroup 
                    ? 'Gruba eklenebilecek aktif TABELA kaydı bulunamadı (tüm kayıtlar başka gruplarda)' 
                    : 'Gruplama için müsait aktif TABELA kaydı bulunamadı (tüm kayıtlar başka gruplarda veya pasif)'}
                </div>
              ) : (
                <div className="border rounded-lg divide-y" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  <div className="p-3 bg-gray-50 sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={
                          availableRecordsForGroup.length > 0 && 
                          availableRecordsForGroup.every(r => selectedRecordsForGroup.includes(r.id))
                        }
                        onCheckedChange={(checked) => {
                          saveScrollPosition();
                          if (checked) {
                            setSelectedRecordsForGroup(availableRecordsForGroup.map(r => r.id));
                          } else {
                            setSelectedRecordsForGroup([]);
                          }
                          restoreScrollPosition();
                        }}
                      />
                      <Label className="cursor-pointer flex-1">
                        Tümünü Seç ({availableRecordsForGroup.length} kayıt)
                      </Label>
                    </div>
                  </div>
                  {availableRecordsForGroup.map((record) => {
                    const programIds = record.kartProgramIds || record.bankIds || [];
                    return (
                      <div key={record.id} className="flex items-start gap-3 p-3 hover:bg-gray-50">
                        <Checkbox
                          id={`group-record-${record.id}`}
                          checked={selectedRecordsForGroup.includes(record.id)}
                          onCheckedChange={(checked) => {
                            saveScrollPosition();
                            if (checked) {
                              setSelectedRecordsForGroup([...selectedRecordsForGroup, record.id]);
                            } else {
                              setSelectedRecordsForGroup(selectedRecordsForGroup.filter(id => id !== record.id));
                            }
                            restoreScrollPosition();
                          }}
                        />
                        <Label htmlFor={`group-record-${record.id}`} className="cursor-pointer flex-1">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {record.urun && (
                                <Badge variant="outline" className="text-xs bg-indigo-50">
                                  {record.urun}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {record.gelirModeli.ad}
                              </Badge>
                              <Badge variant={record.kartTipi === 'Credit' ? 'default' : record.kartTipi === 'Debit' ? 'secondary' : 'outline'} className="text-xs">
                                {record.kartTipi}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {record.yurtIciDisi}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                              {programIds.includes('ALL') ? (
                                <span>Tüm kart programları</span>
                              ) : programIds.length > 0 ? (
                                <span>{programIds.length} kart programı</span>
                              ) : (
                                <span>Kart programı seçilmemiş</span>
                              )}
                              {' • '}
                              <span>Oluşturma: {record.olusturmaTarihi}</span>
                            </div>
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowGroupDialog(false);
                setSelectedRecordsForGroup([]);
                setGroupName('');
                setGroupStartDate('');
                setGroupEndDate('');
                setGroupAktif(true);
                setEditingGroup(null);
              }}
            >
              İptal
            </Button>
            <Button onClick={handleCreateGroup}>
              {editingGroup ? 'Güncelle' : 'Grup Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hiyerarşi Açıklama Dialog */}
      <Dialog open={showHierarchyDialog} onOpenChange={setShowHierarchyDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📊 TABELA Hiyerarşik Yapı</DialogTitle>
            <DialogDescription>
              TABELA sayfasının veri yapısı ve ilişkileri
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Genel Hiyerarşi */}
            <div className="space-y-3">
              <h4 className="flex items-center gap-2">
                <Info size={18} className="text-blue-600" />
                Genel Hiyerarşi
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 font-mono text-xs space-y-1">
                <div>Banka/PF Modülü</div>
                <div className="pl-4">└── Firma Detay Sayfası</div>
                <div className="pl-8">├── TABELA Tab</div>
                <div className="pl-12">│   ├── 📋 TABELA Grupları</div>
                <div className="pl-16">│   │   ├── Grup 1 (Örn: "2024 Q1 Anlaşmaları")</div>
                <div className="pl-20">│   │   │   ├── Geçerlilik: 2024-01-01 → 2024-03-31</div>
                <div className="pl-20">│   │   │   ├── Durum: Aktif/Pasif</div>
                <div className="pl-20">│   │   │   └── 🔗 TABELA Kayıtları (1-N)</div>
                <div className="pl-12">│   └── 📝 TABELA Kayıtları</div>
                <div className="pl-16">│       ├── Kayıt Detayları</div>
                <div className="pl-20">│       │   ├── Kısa Açıklama</div>
                <div className="pl-20">│       │   ├── Ürün (UnattendedPOS, AttendedPOS...)</div>
                <div className="pl-20">│       │   ├── Kart Tipi (Credit, Debit, Paçal)</div>
                <div className="pl-20">│       │   ├── Gelir Modeli</div>
                <div className="pl-20">│       │   └── Durum (Aktif/Kapalı)</div>
                <div className="pl-16">│       ├── Komisyon Oranları (Vade Bazlı)</div>
                <div className="pl-20">│       │   ├── D+1, D+7, D+14, D+31</div>
                <div className="pl-16">│       └── Paylaşım Oranları</div>
                <div className="pl-20">│           ├── Kuruluş Oranı (%)</div>
                <div className="pl-20">│           └── OXIVO Oranı (%)</div>
                <div className="pl-8">└── Hakediş Tab</div>
                <div className="pl-12">└── 💰 Hakediş Kayıtları</div>
                <div className="pl-16">├── TABELA Grup Bazlı</div>
                <div className="pl-16">├── Dönem (Ay/Yıl)</div>
                <div className="pl-16">└── Durum (Taslak/Kesinleşmiş)</div>
              </div>
            </div>

            {/* Veri İlişkileri */}
            <div className="space-y-3">
              <h4 className="flex items-center gap-2">
                <Info size={18} className="text-blue-600" />
                Önemli İlişkiler
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <div className="text-sm">
                      <strong>TABELA → Grup:</strong> Bir TABELA kaydı birden fazla gruba ait olabilir (Many-to-Many)
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">•</span>
                    <div className="text-sm">
                      <strong>Grup → Hakediş:</strong> Bir grup birden fazla hakediş kaydına sahip olabilir (One-to-Many)
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <div className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <div className="text-sm">
                      <strong>Firma → TABELA:</strong> Bir firma birden fazla TABELA kaydına sahip olabilir (One-to-Many)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kullanım Senaryoları */}
            <div className="space-y-3">
              <h4 className="flex items-center gap-2">
                <Info size={18} className="text-blue-600" />
                Temel Kullanım Senaryoları
              </h4>
              <div className="space-y-2">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-2">
                    <span className="text-orange-600">1.</span>
                    <div className="text-sm space-y-1">
                      <strong>Yeni Anlaşma Ekleme:</strong>
                      <div className="text-gray-600 pl-4 space-y-1">
                        <div>• TABELA tab'ına git</div>
                        <div>• "Yeni TABELA Kaydı" butonuna tıkla</div>
                        <div>• Form adımlarını doldur (10 adım)</div>
                        <div>• Kaydet</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-2">
                    <span className="text-orange-600">2.</span>
                    <div className="text-sm space-y-1">
                      <strong>Dönemsel Gruplama:</strong>
                      <div className="text-gray-600 pl-4 space-y-1">
                        <div>• TABELA kayıtlarını seç (Checkbox)</div>
                        <div>• "Grup Oluştur" butonuna tıkla</div>
                        <div>• Grup bilgilerini gir (ad, geçerlilik tarihleri)</div>
                        <div>• Kaydet</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-2">
                    <span className="text-orange-600">3.</span>
                    <div className="text-sm space-y-1">
                      <strong>Aylık Hakediş Hesaplama:</strong>
                      <div className="text-gray-600 pl-4 space-y-1">
                        <div>• Hakediş tab'ına geç</div>
                        <div>• "Yeni Hakediş Oluştur" butonuna tıkla</div>
                        <div>• TABELA grubunu seç (sadece aktif gruplar)</div>
                        <div>• Her kayıt için vade bazlı işlem hacmi gir</div>
                        <div>• Sistem otomatik hesaplar (Kazanç, PF/OXIVO payları)</div>
                        <div>• "Taslak Kaydet" veya "Kesinleştir"</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Veri Modelleri */}
            <div className="space-y-3">
              <h4 className="flex items-center gap-2">
                <Info size={18} className="text-blue-600" />
                Veri Modelleri
              </h4>
              <div className="space-y-2">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="text-sm space-y-1">
                    <strong>TabelaRecord (TABELA Kaydı)</strong>
                    <div className="text-gray-700 pl-4 text-xs space-y-1 font-mono">
                      <div>• id, kurulus, urun, kartTipi</div>
                      <div>• gelirModeli, kartProgramIds</div>
                      <div>• komisyonOranları (vade bazlı)</div>
                      <div>• paylaşımOranları</div>
                      <div>• kisaAciklama, olusturmaTarihi</div>
                      <div>• aktif, kapanmaTarihi</div>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="text-sm space-y-1">
                    <strong>TabelaGroup (TABELA Grubu)</strong>
                    <div className="text-gray-700 pl-4 text-xs space-y-1 font-mono">
                      <div>• id, name</div>
                      <div>• gecerlilikBaslangic, gecerlilikBitis</div>
                      <div>• recordIds (kayıt ID dizisi)</div>
                      <div>• pinned (sabitlenmiş mi?)</div>
                      <div>• aktif (grup aktif/pasif)</div>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <div className="text-sm space-y-1">
                    <strong>HakedisRecord (Hakediş Kaydı)</strong>
                    <div className="text-gray-700 pl-4 text-xs space-y-1 font-mono">
                      <div>• id, tabelaGroupId, tabelaGroupAd</div>
                      <div>• donem (YYYY-MM)</div>
                      <div>• islemHacmiMap (vade bazlı)</div>
                      <div>• pfIslemHacmi, oxivoIslemHacmi</div>
                      <div>• durum (Taslak/Kesinleşmiş)</div>
                      <div>• olusturmaTarihi, guncellemeTarihi</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gelir Modelleri */}
            <div className="space-y-3">
              <h4 className="flex items-center gap-2">
                <Info size={18} className="text-blue-600" />
                Gelir Modelleri
              </h4>
              <div className="space-y-2">
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <div className="text-sm space-y-1">
                    <strong>Sabit Komisyon</strong>
                    <div className="text-gray-700 pl-4 text-xs">
                      Kazanç = İşlem Hacmi × (Komisyon Oranı / 100)
                    </div>
                  </div>
                </div>
                <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                  <div className="text-sm space-y-1">
                    <strong>Gelir Ortaklığı</strong>
                    <div className="text-gray-700 pl-4 text-xs">
                      Kazanç = Satış TL - Alış TL
                    </div>
                  </div>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                  <div className="text-sm space-y-1">
                    <strong>Hazine Geliri (Ek Gelir)</strong>
                    <div className="text-gray-700 pl-4 text-xs">
                      Özel hesaplama mantığı ile
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowHierarchyDialog(false)}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kapanma Onay Dialog */}
      <AlertDialog open={!!closingRecord} onOpenChange={() => setClosingRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>TABELA Anlaşmasını Kapat</AlertDialogTitle>
            <AlertDialogDescription>
              Bu TABELA anlaşmasını kapatmak istediğinizden emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="space-y-2 text-sm">
              {closingRecord?.urun && (
                <div><strong>Ürün:</strong> {closingRecord.urun}</div>
              )}
              <div><strong>Gelir Modeli:</strong> {closingRecord?.gelirModeli.ad}</div>
              <div><strong>Kart Tipi:</strong> {closingRecord?.kartTipi}</div>
              <div><strong>Yurt İçi/Dışı:</strong> {closingRecord?.yurtIciDisi}</div>
              <div><strong>Oluşturma Tarihi:</strong> {closingRecord?.olusturmaTarihi}</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-orange-600">
            ⚠️ Kapatılan anlaşma "Kapalı" durumuna alınacak ve kapanma tarihi kaydedilecektir.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloseAgreement} className="bg-orange-600 hover:bg-orange-700">
              Anlaşmayı Kapat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
