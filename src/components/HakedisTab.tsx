import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { FilterDropdown, FilterOption } from './FilterDropdown';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { TabelaRecord, TabelaGroup } from './TabelaTab';
import { HakedisRecord } from './BankPFModule';
import { Calendar, Download, Printer, Calculator, Plus, Eye, Edit, Trash2, Save, Archive, FileText, Columns3, Info, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { kisaltUrunAdi } from '../utils/formatters';

interface HakedisTabProps {
  tabelaRecords: TabelaRecord[];
  tabelaGroups?: TabelaGroup[];
  kurumAdi: string; // Firma adı (SİPAY gibi)
  hakedisRecords: HakedisRecord[];
  onHakedisRecordsChange: (records: HakedisRecord[]) => void;
}

// Vade listesi
const vadeListesi = [
  'D+1',
  'D+7',
  'D+14',
  'D+31',
];

export function HakedisTab({ 
  tabelaRecords, 
  tabelaGroups = [], 
  kurumAdi,
  hakedisRecords,
  onHakedisRecordsChange
}: HakedisTabProps) {
  // View state: 'list' | 'selectGroup' | 'create' | 'view' | 'edit'
  const [view, setView] = useState<'list' | 'selectGroup' | 'create' | 'view' | 'edit'>('list');
  const [selectedHakedis, setSelectedHakedis] = useState<HakedisRecord | null>(null);
  
  // Yeni/Düzenleme formu için state
  const [formTabelaGroupId, setFormTabelaGroupId] = useState('');
  const [formDonem, setFormDonem] = useState(new Date().toISOString().slice(0, 7));
  const [formVade, setFormVade] = useState('Tüm Vadeler'); // Artık tüm vadeler gösteriliyor
  const [formIslemHacmiMap, setFormIslemHacmiMap] = useState<Record<string, string>>({});
  const [formNotlar, setFormNotlar] = useState('');
  const [formDurum, setFormDurum] = useState<'Taslak' | 'Kesinleşmiş'>('Taslak');
  
  // PF ve OXİVO İşlem Hacmi
  const [formPFIslemHacmi, setFormPFIslemHacmi] = useState('');
  const [formOxivoIslemHacmi, setFormOxivoIslemHacmi] = useState('');
  
  // Manuel Ek Gelir OXİVO Payı toplam değeri
  const [manualEkGelirOxivoTotal, setManualEkGelirOxivoTotal] = useState<string>('');
  
  // Manuel Ana TABELA OXİVO Payı toplam değeri
  const [manualAnaTabelaOxivoTotal, setManualAnaTabelaOxivoTotal] = useState<string>('');
  
  // Manuel Ana TABELA İşlem Hacmi toplam değeri
  const [manualAnaTabelaIslemHacmi, setManualAnaTabelaIslemHacmi] = useState<string>('');
  
  // Filtreleme (liste için)
  const [filterYil, setFilterYil] = useState<string>('all');
  const [filterDurum, setFilterDurum] = useState<string>('all');
  
  // Silme onay dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hakedisToDelete, setHakedisToDelete] = useState<HakedisRecord | null>(null);
  
  // Hiyerarşi dialog
  const [showHierarchyDialog, setShowHierarchyDialog] = useState(false);
  
  // Sütun görünürlük kontrolü - Ana TABELA
  const [visibleColumns, setVisibleColumns] = useState({
    klm: true,
    grup: true,
    kisaAciklama: true,
    urun: true,
    gelirModeli: true,
    kartProg: true,
    kullanim: true,
    kartTipi: true,
    islemHacmi: true,
    vade: true,
    kazancTL: true,
    oxivoPayi: true
  });
  
  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };
  
  // Sütun görünürlük kontrolü - Ek Gelir
  const [visibleEkGelirColumns, setVisibleEkGelirColumns] = useState({
    klm: true,
    grup: true,
    kisaAciklama: true,
    urun: true,
    gelirModeli: true,
    kartProg: true,
    kullanim: true,
    kartTipi: true,
    islemHacmi: true
  });
  
  const toggleEkGelirColumn = (column: keyof typeof visibleEkGelirColumns) => {
    setVisibleEkGelirColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };
  
  // Eksi değerleri toplama dahil et/etme (varsayılan: false - eksi değerler hariç tutulur)
  const [includeNegativeValues, setIncludeNegativeValues] = useState(false);

  // Aktif TABELA grupları
  const aktifTabelaGroups = useMemo(() => {
    return tabelaGroups.filter(g => g.aktif);
  }, [tabelaGroups]);

  // Seçili gruba ait TABELA kayıtlarını filtrele
  const aktifTabelaRecords = useMemo(() => {
    if (!formTabelaGroupId) return [];
    
    const selectedGroup = tabelaGroups.find(g => g.id === formTabelaGroupId);
    if (!selectedGroup) return [];
    
    return tabelaRecords.filter(record => 
      selectedGroup.recordIds.includes(record.id) &&
      !record.kapanmaTarihi
    );
  }, [tabelaRecords, tabelaGroups, formTabelaGroupId]);

  // Ana TABELA ve Ek Gelir kayıtlarını ayır
  const normalRecords = useMemo(() => {
    return aktifTabelaRecords.filter(r => !r.ekGelirDetay);
  }, [aktifTabelaRecords]);

  const ekGelirRecords = useMemo(() => {
    return aktifTabelaRecords.filter(r => r.ekGelirDetay);
  }, [aktifTabelaRecords]);

  // Yılları çıkar (filtreleme için)
  const availableYears = useMemo(() => {
    const years = new Set(hakedisRecords.map(h => h.donem.split('-')[0]));
    return Array.from(years).sort().reverse();
  }, [hakedisRecords]);

  // Filtrelenmiş hakediş kayıtları
  const filteredHakedisRecords = useMemo(() => {
    let filtered = [...hakedisRecords];
    
    if (filterYil !== 'all') {
      filtered = filtered.filter(h => h.donem.startsWith(filterYil));
    }
    
    if (filterDurum !== 'all') {
      filtered = filtered.filter(h => h.durum === filterDurum);
    }
    
    return filtered.sort((a, b) => b.donem.localeCompare(a.donem)); // Yeniden eskiye
  }, [hakedisRecords, filterYil, filterDurum]);

  // ⚡ Filter options for FilterDropdown
  const yilFilterOptions: FilterOption[] = useMemo(() => 
    availableYears.map(year => ({
      value: year,
      label: year,
      count: hakedisRecords.filter(h => h.donem.startsWith(year)).length
    })), [availableYears, hakedisRecords]
  );

  const durumFilterOptions: FilterOption[] = useMemo(() => [
    { value: 'Taslak', label: 'Taslak', count: hakedisRecords.filter(h => h.durum === 'Taslak').length },
    { value: 'Kesinleşmiş', label: 'Onaylanmış', count: hakedisRecords.filter(h => h.durum === 'Kesinleşmiş').length }
  ], [hakedisRecords]);

  // Yeni hakediş oluşturma - önce grup seçimi
  const handleCreateNew = () => {
    const currentDate = new Date();
    setFormTabelaGroupId('');
    setFormDonem(currentDate.toISOString().slice(0, 7));
    setFormVade('Tüm Vadeler');
    setFormIslemHacmiMap({});
    setFormNotlar('');
    setFormDurum('Taslak');
    setFormPFIslemHacmi('');
    setFormOxivoIslemHacmi('');
    setManualEkGelirOxivoTotal('');
    setManualAnaTabelaOxivoTotal('');
    setManualAnaTabelaIslemHacmi('');
    setView('selectGroup');
  };

  // Grup seçildikten sonra form'a geç
  const handleGroupSelected = () => {
    if (!formTabelaGroupId) {
      toast.error('Lütfen bir TABELA grubu seçin');
      return;
    }
    setView('create');
  };

  // Hakediş görüntüleme
  const handleView = (hakedis: HakedisRecord) => {
    setSelectedHakedis(hakedis);
    setFormTabelaGroupId(hakedis.tabelaGroupId);
    setFormDonem(hakedis.donem);
    setFormVade(hakedis.vade);
    setFormIslemHacmiMap(hakedis.islemHacmiMap);
    setFormNotlar(hakedis.notlar || '');
    setFormDurum(hakedis.durum);
    setFormPFIslemHacmi(hakedis.pfIslemHacmi || '');
    setFormOxivoIslemHacmi(hakedis.oxivoIslemHacmi || '');
    setManualEkGelirOxivoTotal((hakedis as any).manualEkGelirOxivoTotal || '');
    setManualAnaTabelaOxivoTotal((hakedis as any).manualAnaTabelaOxivoTotal || '');
    setManualAnaTabelaIslemHacmi((hakedis as any).manualAnaTabelaIslemHacmi || '');
    setView('view');
  };

  // Hakediş düzenleme
  const handleEdit = (hakedis: HakedisRecord) => {
    setSelectedHakedis(hakedis);
    setFormTabelaGroupId(hakedis.tabelaGroupId);
    setFormDonem(hakedis.donem);
    setFormVade(hakedis.vade);
    setFormIslemHacmiMap(hakedis.islemHacmiMap);
    setFormNotlar(hakedis.notlar || '');
    setFormDurum(hakedis.durum);
    setFormPFIslemHacmi(hakedis.pfIslemHacmi || '');
    setFormOxivoIslemHacmi(hakedis.oxivoIslemHacmi || '');
    setManualEkGelirOxivoTotal((hakedis as any).manualEkGelirOxivoTotal || '');
    setManualAnaTabelaOxivoTotal((hakedis as any).manualAnaTabelaOxivoTotal || '');
    setManualAnaTabelaIslemHacmi((hakedis as any).manualAnaTabelaIslemHacmi || '');
    setView('edit');
  };

  // Hakediş kaydetme (yeni veya düzenleme)
  const handleSave = (durum: 'Taslak' | 'Kesinleşmiş' = formDurum) => {
    // Kesinleştirme sırasında manuel değer uyarısı
    if (durum === 'Kesinleşmiş') {
      const hasManualValues = manualAnaTabelaIslemHacmi || manualAnaTabelaOxivoTotal || manualEkGelirOxivoTotal;
      if (hasManualValues) {
        const manualFields: string[] = [];
        if (manualAnaTabelaIslemHacmi) manualFields.push('Ana TABELA Toplam İşlem Hacmi');
        if (manualAnaTabelaOxivoTotal) manualFields.push('Ana TABELA OXİVO Payı');
        if (manualEkGelirOxivoTotal) manualFields.push('Ek Gelir OXİVO Payı');
        
        const confirmMessage = `⚠️ MANUEL DEĞER UYARISI\n\nAşağıdaki alanlar manuel olarak girilmiş:\n${manualFields.map(f => `• ${f}`).join('\n')}\n\nBu değerler Excel export'ta "(MANUEL)" etiketi ile işaretlenecektir.\n\nKesinleştirmek istiyor musunuz?`;
        
        if (!confirm(confirmMessage)) {
          return;
        }
      }
    }
    
    if (view === 'create') {
      // TABELA grubu bilgisini al
      const selectedGroup = tabelaGroups.find(g => g.id === formTabelaGroupId);
      if (!selectedGroup) {
        toast.error('TABELA grubu bulunamadı!');
        return;
      }

      // Toplam değerleri hesapla (rapor performansı için önbellekleme)
      const totals = calculateTotals(formVade, formIslemHacmiMap);
      
      // Yeni hakediş kaydı oluştur
      const newHakedis: HakedisRecord = {
        id: `hakedis-${Date.now()}`,
        tabelaGroupId: formTabelaGroupId,
        tabelaGroupAd: selectedGroup.name,
        donem: formDonem,
        olusturmaTarihi: new Date().toISOString(),
        vade: formVade,
        islemHacmiMap: formIslemHacmiMap,
        durum: durum,
        notlar: formNotlar || undefined,
        pfIslemHacmi: formPFIslemHacmi || undefined,
        oxivoIslemHacmi: formOxivoIslemHacmi || undefined,
        manualEkGelirOxivoTotal: manualEkGelirOxivoTotal || undefined,
        manualAnaTabelaOxivoTotal: manualAnaTabelaOxivoTotal || undefined,
        manualAnaTabelaIslemHacmi: manualAnaTabelaIslemHacmi || undefined,
        // Hesaplanmış toplam değerleri kaydet
        totalIslemHacmi: (manualAnaTabelaIslemHacmi ? parseFloat(manualAnaTabelaIslemHacmi) : totals.normalTotals.totalIslemHacmi) + totals.ekGelirTotals.totalIslemHacmi,
        totalPFPay: totals.normalTotals.totalPFPay + totals.ekGelirTotals.totalPFTL,
        totalOxivoPay: (manualAnaTabelaOxivoTotal ? parseFloat(manualAnaTabelaOxivoTotal) : totals.normalTotals.totalOxivoPay) + (manualEkGelirOxivoTotal ? parseFloat(manualEkGelirOxivoTotal) : totals.ekGelirTotals.totalOXTL),
      } as any;
      
      onHakedisRecordsChange([...hakedisRecords, newHakedis]);
      toast.success(`${formDonem} dönemi hakediş kaydı ${durum === 'Taslak' ? 'taslak olarak' : ''} oluşturuldu`);
      setView('list');
    } else if (view === 'edit' && selectedHakedis) {
      // TABELA grubu bilgisini al
      const selectedGroup = tabelaGroups.find(g => g.id === formTabelaGroupId);
      if (!selectedGroup) {
        toast.error('TABELA grubu bulunamadı!');
        return;
      }

      // Toplam değerleri hesapla (rapor performansı için önbellekleme)
      const totals = calculateTotals(formVade, formIslemHacmiMap);

      // Mevcut kaydı güncelle
      const updatedHakedis: HakedisRecord = {
        ...selectedHakedis,
        tabelaGroupId: formTabelaGroupId,
        tabelaGroupAd: selectedGroup.name,
        donem: formDonem,
        vade: formVade,
        islemHacmiMap: formIslemHacmiMap,
        durum: durum,
        notlar: formNotlar || undefined,
        pfIslemHacmi: formPFIslemHacmi || undefined,
        oxivoIslemHacmi: formOxivoIslemHacmi || undefined,
        manualEkGelirOxivoTotal: manualEkGelirOxivoTotal || undefined,
        manualAnaTabelaOxivoTotal: manualAnaTabelaOxivoTotal || undefined,
        manualAnaTabelaIslemHacmi: manualAnaTabelaIslemHacmi || undefined,
        guncellemeTarihi: new Date().toISOString(),
        // Hesaplanmış toplam değerleri kaydet
        totalIslemHacmi: (manualAnaTabelaIslemHacmi ? parseFloat(manualAnaTabelaIslemHacmi) : totals.normalTotals.totalIslemHacmi) + totals.ekGelirTotals.totalIslemHacmi,
        totalPFPay: totals.normalTotals.totalPFPay + totals.ekGelirTotals.totalPFTL,
        totalOxivoPay: (manualAnaTabelaOxivoTotal ? parseFloat(manualAnaTabelaOxivoTotal) : totals.normalTotals.totalOxivoPay) + (manualEkGelirOxivoTotal ? parseFloat(manualEkGelirOxivoTotal) : totals.ekGelirTotals.totalOXTL),
      } as any;
      
      onHakedisRecordsChange(
        hakedisRecords.map(h => h.id === selectedHakedis.id ? updatedHakedis : h)
      );
      toast.success(`${formDonem} dönemi hakediş kaydı ${durum === 'Taslak' ? 'taslak olarak' : ''} güncellendi`);
      setView('list');
    }
  };

  // Hakediş silme
  const handleDelete = (hakedis: HakedisRecord) => {
    setHakedisToDelete(hakedis);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (hakedisToDelete) {
      onHakedisRecordsChange(hakedisRecords.filter(h => h.id !== hakedisToDelete.id));
      toast.success(`${hakedisToDelete.donem} dönemi hakediş kaydı silindi`);
      setDeleteDialogOpen(false);
      setHakedisToDelete(null);
    }
  };

  // Para formatı yardımcı fonksiyonları
  const formatCurrency = (value: string | number): string => {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    if (isNaN(numValue) || numValue === 0) return '';
    
    // Bindelik ayırım ve virgülle ondalık
    return numValue.toLocaleString('tr-TR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }) + ' ₺';
  };
  
  const parseCurrency = (formatted: string): string => {
    // "1.234,56 ₺" formatından "1234.56" sayısına dönüştür
    return formatted
      .replace(/\s₺/g, '')        // ₺ sembolünü kaldır
      .replace(/\./g, '')          // Binlik ayırıcıları kaldır
      .replace(',', '.');          // Virgülü noktaya çevir
  };

  // İşlem hacmi değişikliği
  const handleIslemHacmiChange = (tabelaId: string, value: string) => {
    // Eğer boşsa direkt boş kaydet
    if (value === '') {
      setFormIslemHacmiMap(prev => ({
        ...prev,
        [tabelaId]: ''
      }));
      return;
    }
    
    // Formatlanmış değeri sayıya çevir
    const numericValue = parseCurrency(value);
    const sanitized = numericValue.replace(/[^0-9.]/g, '');
    
    // Geçerli bir sayı ise kaydet
    if (sanitized && !isNaN(parseFloat(sanitized))) {
      setFormIslemHacmiMap(prev => ({
        ...prev,
        [tabelaId]: sanitized
      }));
    }
  };

  // Hesaplama fonksiyonu - bir TABELA kaydı için
  const calculateHakedis = (record: TabelaRecord, vade: string, islemHacmiMap: Record<string, string>) => {
    const islemHacmi = parseFloat(islemHacmiMap[record.id] || '0');
    
    if (islemHacmi === 0) {
      return {
        maliyet: 0,
        satis: 0,
        kazanc: 0,
        pfPay: 0,
        oxivoPay: 0
      };
    }

    const vadeData = record.komisyonOranları.find(ko => ko.vade === vade && ko.aktif !== false);
    
    if (!vadeData) {
      return {
        maliyet: 0,
        satis: 0,
        kazanc: 0,
        pfPay: 0,
        oxivoPay: 0
      };
    }

    let maliyet = 0;
    let satis = 0;
    let kazanc = 0;

    if (record.gelirModeli.ad === 'Hazine Geliri') {
      const tutarTL = parseFloat(record.hazineGeliri?.tutarTL || '0');
      const oxivoYuzde = parseFloat(record.hazineGeliri?.oxivoYuzde || '0');
      
      const toplamTutar = islemHacmi * tutarTL;
      kazanc = toplamTutar * (oxivoYuzde / 100);
      maliyet = toplamTutar;
      satis = toplamTutar;
      
    } else if (record.gelirModeli.ad === 'Gelir Ortaklığı') {
      const alisYuzde = parseFloat(vadeData.alisTL || '0');
      const satisYuzde = parseFloat(vadeData.satisTL || '0');
      
      maliyet = islemHacmi * (alisYuzde / 100);
      satis = islemHacmi * (satisYuzde / 100);
      kazanc = satis - maliyet;
      
    } else if (record.gelirModeli.ad === 'Sabit Komisyon') {
      // Sabit Komisyon: Kar = İşlem Hacmi × (Komisyon Oranı / 100)
      const komisyonOrani = parseFloat(vadeData.oran || '0');
      kazanc = islemHacmi * (komisyonOrani / 100);
      maliyet = 0;
      satis = kazanc;
    } else {
      // Diğer gelir modelleri
      const komisyonYuzde = parseFloat(vadeData.oran || '0');
      
      maliyet = islemHacmi * (komisyonYuzde / 100);
      satis = maliyet;
      kazanc = 0;
    }

    const kurulusOrani = parseFloat(record.paylaşımOranları.kurulusOrani || '0');
    const oxivoOrani = parseFloat(record.paylaşımOranları.oxivoOrani || '0');
    
    const pfPay = kazanc * (kurulusOrani / 100);
    const oxivoPay = kazanc * (oxivoOrani / 100);

    return {
      maliyet,
      satis,
      kazanc,
      pfPay,
      oxivoPay
    };
  };

  // Ek Gelir hesaplama - sadece PF ve OXİVO payı
  const calculateEkGelirHakedis = (record: TabelaRecord, islemHacmiMap: Record<string, string>) => {
    const islemHacmi = parseFloat(islemHacmiMap[record.id] || '0');
    
    if (islemHacmi === 0 || !record.ekGelirDetay) {
      return {
        pfTL: 0,
        oxTL: 0,
        toplamTutar: 0
      };
    }

    const pfYuzde = parseFloat(record.ekGelirDetay.pfYuzde || '0');
    const oxYuzde = parseFloat(record.ekGelirDetay.oxYuzde || '0');

    const pfTL = islemHacmi * (pfYuzde / 100);
    const oxTL = islemHacmi * (oxYuzde / 100);
    const toplamTutar = pfTL + oxTL;

    return {
      pfTL,
      oxTL,
      toplamTutar
    };
  };

  // Toplam hesaplama
  const calculateTotals = (vade: string, islemHacmiMap: Record<string, string>) => {
    let normalTotalIslemHacmi = 0;
    let normalTotalMaliyet = 0;
    let normalTotalSatis = 0;
    let normalTotalKazanc = 0;
    let normalTotalPFPay = 0;
    let normalTotalOxivoPay = 0;
    let excludedPFCount = 0;
    let excludedOxivoCount = 0;

    normalRecords.forEach(record => {
      // Her kayıt için tüm aktif vadeleri hesapla
      const aktifVadeler = record.komisyonOranları.filter(ko => ko.aktif !== false);
      
      aktifVadeler.forEach(vadeData => {
        const vadeKey = `${record.id}-${vadeData.vade}`;
        const islemHacmi = parseFloat(islemHacmiMap[vadeKey] || '0');
        
        // Gelir modeline göre hesaplama
        let alisTL = 0;
        let satisTL = 0;
        let kazancTL = 0;
        
        if (record.gelirModeli.ad === 'Sabit Komisyon') {
          // Sabit Komisyon: Kar = İşlem Hacmi × (Komisyon Oranı / 100)
          const komisyonOrani = parseFloat(vadeData.oran || '0');
          kazancTL = islemHacmi * (komisyonOrani / 100);
          alisTL = 0;
          satisTL = kazancTL;
        } else {
          // Gelir Ortaklığı ve diğer modeller
          const alisYuzde = parseFloat(vadeData.alisTL || '0');
          const satisYuzde = parseFloat(vadeData.satisTL || '0');
          
          alisTL = islemHacmi * (alisYuzde / 100);
          satisTL = islemHacmi * (satisYuzde / 100);
          kazancTL = satisTL - alisTL;
        }
        
        const pfOrani = parseFloat(record.paylaşımOranları.kurulusOrani || '0');
        const oxivoOrani = parseFloat(record.paylaşımOranları.oxivoOrani || '0');
        const pfPayi = kazancTL * (pfOrani / 100);
        const oxivoPayi = kazancTL * (oxivoOrani / 100);
        
        normalTotalIslemHacmi += islemHacmi;
        normalTotalMaliyet += alisTL;
        normalTotalSatis += satisTL;
        normalTotalKazanc += kazancTL;
        
        // Eksi değerleri kontrol et - sadece seçenek aktifse dahil et
        if (includeNegativeValues || pfPayi >= 0) {
          normalTotalPFPay += pfPayi;
        } else if (pfPayi < 0) {
          excludedPFCount++;
        }
        
        if (includeNegativeValues || oxivoPayi >= 0) {
          normalTotalOxivoPay += oxivoPayi;
        } else if (oxivoPayi < 0) {
          excludedOxivoCount++;
        }
      });
    });

    let ekGelirTotalIslemHacmi = 0;
    let ekGelirTotalPFTL = 0;
    let ekGelirTotalOXTL = 0;
    let ekGelirTotalTutar = 0;

    // ✅ NULL SAFETY: ekGelirRecords boş olabilir
    (ekGelirRecords || []).forEach(record => {
      const islemHacmi = parseFloat(islemHacmiMap[record.id] || '0');
      const calc = calculateEkGelirHakedis(record, islemHacmiMap);
      
      ekGelirTotalIslemHacmi += islemHacmi;
      ekGelirTotalPFTL += calc.pfTL;
      ekGelirTotalOXTL += calc.oxTL;
      ekGelirTotalTutar += calc.toplamTutar;
    });

    return {
      normalTotals: {
        totalIslemHacmi: normalTotalIslemHacmi,
        totalMaliyet: normalTotalMaliyet,
        totalSatis: normalTotalSatis,
        totalKazanc: normalTotalKazanc,
        totalPFPay: normalTotalPFPay,
        totalOxivoPay: normalTotalOxivoPay,
        excludedPFCount,
        excludedOxivoCount
      },
      ekGelirTotals: {
        totalIslemHacmi: ekGelirTotalIslemHacmi,
        totalPFTL: ekGelirTotalPFTL,
        totalOXTL: ekGelirTotalOXTL,
        totalTutar: ekGelirTotalTutar
      },
      grandTotal: {
        totalIslemHacmi: normalTotalIslemHacmi + ekGelirTotalIslemHacmi,
        totalKazanc: normalTotalKazanc,
        totalPFPay: normalTotalPFPay + ekGelirTotalPFTL,
        totalOxivoPay: normalTotalOxivoPay + ekGelirTotalOXTL
      }
    };
  };

  // Export Excel
  const handleExportExcel = (hakedis: HakedisRecord) => {
    try {
      const totals = calculateTotals(hakedis.vade, hakedis.islemHacmiMap);
      
      const headers = [
        'Tablo Türü',
        'Ürün',
        'Gelir Modeli',
        'Gelir Türü',
        'Kart Programları',
        'Yurt İçi/Dışı',
        'Kart Tipi',
        'Vade',
        'Komisyon/Oran',
        'İşlem Hacmi (TL)',
        'Maliyet (TL)',
        'Satış (TL)',
        'Kazanç/Tutar (TL)',
        'PF Payı (TL)',
        'OXİVO Payı (TL)'
      ];
      
      const rows: string[] = [];
      
      // Normal kayıtlar
      normalRecords.forEach(record => {
        const islemHacmi = parseFloat(hakedis.islemHacmiMap[record.id] || '0');
        const calc = calculateHakedis(record, hakedis.vade, hakedis.islemHacmiMap);
        const vadeData = record.komisyonOranları.find(ko => ko.vade === hakedis.vade && ko.aktif !== false);
        
        let komisyonStr = '-';
        if (record.gelirModeli.ad === 'Gelir Ortaklığı') {
          komisyonStr = `A:%${vadeData?.alisTL || '0'} S:%${vadeData?.satisTL || '0'}`;
        } else if (record.gelirModeli.ad === 'Sabit Komisyon') {
          komisyonStr = `%${vadeData?.oran || '0'}`;
        } else {
          komisyonStr = `${record.hazineGeliri?.tutarTL || '0'}₺ (OX:%${record.hazineGeliri?.oxivoYuzde || '0'})`;
        }
        
        rows.push([
          'Ana TABELA',
          kisaltUrunAdi(record.urun || '-'),
          record.gelirModeli.ad,
          '-',
          record.kartProgramIds?.includes('ALL') ? 'Tümü' : `${record.kartProgramIds?.length || 0} program`,
          record.yurtIciDisi,
          record.kartTipi,
          hakedis.vade,
          komisyonStr,
          islemHacmi.toFixed(2),
          calc.maliyet.toFixed(2),
          calc.satis.toFixed(2),
          calc.kazanc.toFixed(2),
          calc.pfPay.toFixed(2),
          calc.oxivoPay.toFixed(2)
        ].join(','));
      });

      // Ek gelir kayıtları
      // ✅ NULL SAFETY: ekGelirRecords boş olabilir
      (ekGelirRecords || []).forEach(record => {
        const islemHacmi = parseFloat(hakedis.islemHacmiMap[record.id] || '0');
        const calc = calculateEkGelirHakedis(record, hakedis.islemHacmiMap);
        
        const kartTipi = record.ekGelirDetay?.kartTipi 
          ? record.ekGelirDetay.kartTipi.split(' (')[0] 
          : '-';
        
        rows.push([
          'Ek Gelir',
          kisaltUrunAdi(record.urun || '-'),
          record.gelirModeli.ad,
          record.ekGelirDetay?.gelirTuru || '-',
          '-',
          record.ekGelirDetay?.kullanim || '-',
          kartTipi,
          '-',
          `${record.ekGelirDetay?.tutar || '0'}₺`,
          islemHacmi.toFixed(2),
          '-',
          '-',
          calc.toplamTutar.toFixed(2),
          calc.pfTL.toFixed(2),
          calc.oxTL.toFixed(2)
        ].join(','));
      });
      
      // Toplam satırları
      rows.push('');
      
      // Manuel değer kontrolü
      const manualAnaTabelaIslemHacmiValue = (hakedis as any).manualAnaTabelaIslemHacmi;
      const manualAnaTabelaOxivoValue = (hakedis as any).manualAnaTabelaOxivoTotal;
      const islemHacmiValue = manualAnaTabelaIslemHacmiValue 
        ? parseFloat(manualAnaTabelaIslemHacmiValue) 
        : totals.normalTotals.totalIslemHacmi;
      const oxivoPayValue = manualAnaTabelaOxivoValue 
        ? parseFloat(manualAnaTabelaOxivoValue) 
        : totals.normalTotals.totalOxivoPay;
      
      rows.push([
        'ANA TABELA TOPLAM',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        `${islemHacmiValue.toFixed(2)}${manualAnaTabelaIslemHacmiValue ? ' (MANUEL)' : ''}`,
        totals.normalTotals.totalMaliyet.toFixed(2),
        totals.normalTotals.totalSatis.toFixed(2),
        totals.normalTotals.totalKazanc.toFixed(2),
        totals.normalTotals.totalPFPay.toFixed(2),
        `${oxivoPayValue.toFixed(2)}${manualAnaTabelaOxivoValue ? ' (MANUEL)' : ''}`
      ].join(','));

      // ✅ NULL SAFETY: ekGelirRecords undefined olabilir
      if ((ekGelirRecords || []).length > 0) {
        const manualEkGelirOxivoValue = (hakedis as any).manualEkGelirOxivoTotal;
        const ekGelirOxivoValue = manualEkGelirOxivoValue 
          ? parseFloat(manualEkGelirOxivoValue) 
          : totals.ekGelirTotals.totalOXTL;
        
        rows.push([
          'EK GELİR TOPLAM',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          totals.ekGelirTotals.totalIslemHacmi.toFixed(2),
          '-',
          '-',
          totals.ekGelirTotals.totalTutar.toFixed(2),
          totals.ekGelirTotals.totalPFTL.toFixed(2),
          `${ekGelirOxivoValue.toFixed(2)}${manualEkGelirOxivoValue ? ' (MANUEL)' : ''}`
        ].join(','));
      }

      rows.push('');
      
      // Genel toplam için manuel değerleri hesaba kat
      const genelToplamIslemHacmi = islemHacmiValue + totals.ekGelirTotals.totalIslemHacmi;
      // ✅ NULL SAFETY: ekGelirRecords undefined olabilir
      const genelToplamOxivoPay = oxivoPayValue + ((ekGelirRecords || []).length > 0 ? (manualEkGelirOxivoValue ? parseFloat(manualEkGelirOxivoValue) : totals.ekGelirTotals.totalOXTL) : 0);
      const hasManualValues = manualAnaTabelaIslemHacmiValue || manualAnaTabelaOxivoValue || manualEkGelirOxivoValue;
      
      rows.push([
        'GENEL TOPLAM',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        `${genelToplamIslemHacmi.toFixed(2)}${hasManualValues ? ' (İçerir: Manuel Değerler)' : ''}`,
        '-',
        '-',
        totals.grandTotal.totalKazanc.toFixed(2),
        totals.grandTotal.totalPFPay.toFixed(2),
        `${genelToplamOxivoPay.toFixed(2)}${hasManualValues ? ' (İçerir: Manuel Değerler)' : ''}`
      ].join(','));
      
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hakedis-${kurumAdi}-${hakedis.donem}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Excel dosyası indirildi');
    } catch (error) {
      console.error('Export hatası:', error);
      toast.error('Export sırasında hata oluştu');
    }
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Dönem formatı (Ekim 2025)
  const formatDonem = (donem: string) => {
    const [yil, ay] = donem.split('-');
    const aylar = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                   'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return `${aylar[parseInt(ay) - 1]} ${yil}`;
  };

  // ============= RENDER: Liste Görünümü =============
  if (view === 'list') {
    return (
      <div className="space-y-6">
        {/* Başlık ve Filtreler */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <Calculator className="text-green-600" size={24} />
                  Hakediş Yönetimi - {kurumAdi}
                </CardTitle>
                <p className="text-sm text-green-700 mt-1">
                  Aylık hakediş kayıtlarını oluştur, görüntüle ve yönet
                </p>
              </div>
              <Button 
                onClick={handleCreateNew}
                disabled={aktifTabelaGroups.length === 0}
                className="bg-green-600 hover:bg-green-700"
                title={aktifTabelaGroups.length === 0 ? 'Önce aktif bir TABELA grubu oluşturun' : ''}
              >
                <Plus size={16} className="mr-2" />
                Yeni Hakediş Ekle
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Yıl Filtresi */}
              <FilterDropdown
                label="Yıl"
                options={yilFilterOptions}
                value={filterYil}
                onChange={setFilterYil}
                allLabel="Tüm Yıllar"
                showCount={true}
              />

              {/* Durum Filtresi */}
              <FilterDropdown
                label="Durum"
                options={durumFilterOptions}
                value={filterDurum}
                onChange={setFilterDurum}
                allLabel="Tüm Durumlar"
                showCount={true}
              />

              {/* İstatistik */}
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="text-sm text-gray-600">Toplam Hakediş</div>
                <div className="text-2xl text-green-700">{filteredHakedisRecords.length}</div>
                <div className="text-xs text-gray-500">
                  {availableYears.length} yıl
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TABELA Grubu Uyarısı */}
        {aktifTabelaGroups.length === 0 && (
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 text-sm text-orange-800">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="mb-2"><strong>Aktif TABELA Grubu Bulunamadı</strong></p>
                  <p className="text-xs">
                    Hakediş oluşturabilmek için önce TABELA sekmesinden en az bir aktif grup tanımlamalısınız.
                    TABELA grupları, belirli bir anlaşmaya veya döneme ait gelir modellerini organize eder.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hakediş Listesi */}
        <Card>
          <CardHeader>
            <CardTitle>Hakediş Kayıtları</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredHakedisRecords.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Archive size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="mb-2">Henüz hakediş kaydı bulunmuyor</p>
                <p className="text-sm">
                  {aktifTabelaGroups.length === 0 
                    ? 'Önce TABELA sekmesinden bir grup oluşturun'
                    : '"Yeni Hakediş Ekle" butonuna tıklayarak başlayın'}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>TABELA Grubu</TableHead>
                      <TableHead>Dönem</TableHead>
                      <TableHead>Güncelleme Tarihi</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHakedisRecords.map((hakedis, index) => {
                      // Güncel grup adını bul (grup silinmişse veya değişmişse eski adı göster)
                      const currentGroup = tabelaGroups.find(g => g.id === hakedis.tabelaGroupId);
                      const displayGroupName = currentGroup?.name || hakedis.tabelaGroupAd;
                      
                      return (
                        <TableRow key={hakedis.id} className="hover:bg-gray-50">
                          <TableCell className="text-gray-500">{index + 1}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300">
                              {displayGroupName}
                            </Badge>
                            {currentGroup?.name !== hakedis.tabelaGroupAd && (
                              <div className="text-xs text-gray-500 mt-1">
                                (Eski: {hakedis.tabelaGroupAd})
                              </div>
                            )}
                          </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-blue-600" />
                            <span className="font-medium">{formatDonem(hakedis.donem)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {hakedis.guncellemeTarihi 
                            ? new Date(hakedis.guncellemeTarihi).toLocaleDateString('tr-TR')
                            : new Date(hakedis.olusturmaTarihi).toLocaleDateString('tr-TR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {hakedis.durum === 'Kesinleşmiş' ? (
                              <Badge className="bg-green-100 text-green-800 border-green-300">
                                Onaylanmış
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
                                Taslak
                              </Badge>
                            )}
                            {(() => {
                              const hasManualValues = (hakedis as any).manualAnaTabelaIslemHacmi || (hakedis as any).manualAnaTabelaOxivoTotal || (hakedis as any).manualEkGelirOxivoTotal;
                              if (hasManualValues) {
                                return (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-block">
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 text-xs cursor-help">
                                          <Info size={10} className="mr-1" />
                                          Manuel Değer
                                        </Badge>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="text-xs">
                                        Bu hakediş manuel değerler içeriyor
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleView(hakedis)}
                              title="Görüntüle"
                            >
                              <Eye size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(hakedis)}
                              title="Düzenle"
                            >
                              <Edit size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleExportExcel(hakedis)}
                              title="Excel Export"
                            >
                              <Download size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(hakedis)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Sil"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Silme Onay Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hakediş Kaydını Sil</DialogTitle>
              <DialogDescription>
                {hakedisToDelete && (
                  <>
                    <strong>{formatDonem(hakedisToDelete.donem)}</strong> dönemine ait hakediş kaydını silmek istediğinizden emin misiniz?
                    <br />
                    <span className="text-red-600">Bu işlem geri alınamaz!</span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                İptal
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                <Trash2 size={16} className="mr-2" />
                Sil
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ============= RENDER: TABELA Grubu Seçimi =============
  if (view === 'selectGroup') {
    return (
      <div className="space-y-6">
        {/* Başlık */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <Calculator className="text-green-600" size={24} />
                  TABELA Grubu Seçimi - {kurumAdi}
                </CardTitle>
                <p className="text-sm text-green-700 mt-1">
                  Hakediş hesaplaması için bir TABELA grubu seçin
                </p>
              </div>
              <Button 
                variant="outline"
                onClick={() => setView('list')}
              >
                ← İptal
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* TABELA Grupları Listesi */}
        <Card>
          <CardHeader>
            <CardTitle>Aktif TABELA Grupları</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Bir grup seçerek devam edin
            </p>
          </CardHeader>
          <CardContent>
            {aktifTabelaGroups.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Archive size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="mb-2">Aktif TABELA grubu bulunmuyor</p>
                <p className="text-sm">
                  Önce TABELA sekmesinden grup oluşturun
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {aktifTabelaGroups.map((group) => {
                  const groupRecords = tabelaRecords.filter(r => group.recordIds.includes(r.id) && !r.kapanmaTarihi);
                  const isSelected = formTabelaGroupId === group.id;
                  
                  return (
                    <div
                      key={group.id}
                      onClick={() => setFormTabelaGroupId(group.id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-green-500 bg-green-50 shadow-md' 
                          : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge 
                              variant="outline" 
                              className={isSelected ? 'bg-green-600 text-white border-green-600' : 'bg-indigo-50 text-indigo-700 border-indigo-300'}
                            >
                              {group.name}
                            </Badge>
                            {isSelected && (
                              <span className="text-green-600 text-sm">✓ Seçildi</span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">Kayıt Sayısı:</span>
                              <div className="text-lg">{groupRecords.length}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Normal:</span>
                              <div className="text-lg text-blue-600">
                                {groupRecords.filter(r => !r.ekGelirDetay).length}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">Ek Gelir:</span>
                              <div className="text-lg text-purple-600">
                                {groupRecords.filter(r => r.ekGelirDetay).length}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">Durum:</span>
                              <div>
                                <Badge variant="default" className="bg-green-600">
                                  Aktif
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {group.aciklama && (
                            <div className="mt-2 text-sm text-gray-600 italic">
                              {group.aciklama}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
          
          {(aktifTabelaGroups || []).length > 0 && (
            <CardContent className="pt-0">
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline"
                  onClick={() => setView('list')}
                >
                  İptal
                </Button>
                <Button 
                  onClick={handleGroupSelected}
                  disabled={!formTabelaGroupId}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Devam Et →
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Bilgilendirme */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 text-sm text-blue-800">
              <span className="text-xl">💡</span>
              <div>
                <p className="mb-2"><strong>TABELA Grubu Nedir?</strong></p>
                <p className="text-xs">
                  TABELA grupları, belirli bir anlaşma veya dönem için tanımlanmış gelir modellerini içerir. 
                  Seçtiğiniz gruba ait tüm TABELA kayıtları hakediş hesaplamasına dahil edilecektir.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============= RENDER: Oluşturma/Düzenleme/Görüntüleme =============
  const isViewMode = view === 'view';
  const isEditMode = view === 'edit';
  const isCreateMode = view === 'create';
  const totals = calculateTotals(formVade, formIslemHacmiMap);

  return (
    <div className="space-y-6">
      {/* Başlık ve Form */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Calculator className="text-green-600" size={24} />
                {isViewMode && 'Hakediş Görüntüle'}
                {isEditMode && 'Hakediş Düzenle'}
                {isCreateMode && 'Yeni Hakediş Oluştur'}
                {' - '}{kurumAdi}
              </CardTitle>
              {isViewMode && selectedHakedis && (
                <div>
                  <p className="text-sm text-green-700 mt-1">
                    {formatDonem(selectedHakedis.donem)}
                  </p>
                  {(() => {
                    const hasManualValues = manualAnaTabelaIslemHacmi || manualAnaTabelaOxivoTotal || manualEkGelirOxivoTotal;
                    if (hasManualValues) {
                      const manualFields: string[] = [];
                      if (manualAnaTabelaIslemHacmi) manualFields.push('Ana TABELA Toplam İşlem Hacmi');
                      if (manualAnaTabelaOxivoTotal) manualFields.push('Ana TABELA OXİVO Payı');
                      if (manualEkGelirOxivoTotal) manualFields.push('Ek Gelir OXİVO Payı');
                      
                      return (
                        <div className="mt-2 bg-purple-50 border border-purple-300 rounded px-3 py-2 text-xs text-purple-800">
                          <div className="flex items-start gap-2">
                            <Info size={14} className="mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>Manuel Değer Bildirimi:</strong>
                              <div className="mt-1 space-y-0.5">
                                {manualFields.map((field, idx) => (
                                  <div key={idx}>• {field}</div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setView('list')}
              >
                ← Listeye Dön
              </Button>
              {!isViewMode && (
                <>
                  <Button 
                    onClick={() => handleSave('Taslak')}
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-100"
                  >
                    <Save size={16} className="mr-2" />
                    Taslak Kaydet
                  </Button>
                  <Button 
                    onClick={() => handleSave('Kesinleşmiş')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save size={16} className="mr-2" />
                    Kaydet
                  </Button>
                </>
              )}
              {isViewMode && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => selectedHakedis && handleExportExcel(selectedHakedis)}
                  >
                    <Download size={16} className="mr-2" />
                    Excel Export
                  </Button>
                  <Button 
                    onClick={() => selectedHakedis && handleEdit(selectedHakedis)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Edit size={16} className="mr-2" />
                    Düzenle
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* TABELA Grubu Bilgisi */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-indigo-600 text-white border-indigo-600">
                  TABELA Grubu
                </Badge>
                <div>
                  <span className="text-lg">
                    {tabelaGroups.find(g => g.id === formTabelaGroupId)?.name || 'Seçilmedi'}
                  </span>
                  {selectedHakedis && selectedHakedis.tabelaGroupAd !== tabelaGroups.find(g => g.id === formTabelaGroupId)?.name && (
                    <div className="text-xs text-gray-600 mt-0.5">
                      (Kaydedilen: {selectedHakedis.tabelaGroupAd})
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {formTabelaGroupId && (
                  <div className="text-sm bg-white px-3 py-1.5 rounded-md border border-indigo-200">
                    <div className="text-gray-700">
                      <strong>TABELA Kayıtları:</strong> {aktifTabelaRecords.length}
                    </div>
                    <div className="text-xs text-gray-600">
                      {normalRecords.length} normal + {ekGelirRecords.length} ek gelir
                    </div>
                  </div>
                )}
                {isCreateMode && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setView('selectGroup')}
                  >
                    Grup Değiştir
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Dönem Seçimi */}
          <div className="space-y-2">
            <Label htmlFor="donem" className="flex items-center gap-2">
              <Calendar size={16} />
              Dönem
            </Label>
            <Input
              id="donem"
              type="month"
              value={formDonem}
              onChange={(e) => setFormDonem(e.target.value)}
              disabled={isViewMode}
              className="bg-white"
            />
          </div>

          {/* İşlem Hacmi Tablosu */}
          <div className="border rounded-lg overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <TableHead className="w-1/3 text-center">
                    <div className="text-blue-900">PF İşlem Hacmi/TL</div>
                    <div className="text-xs text-blue-600 font-normal">Manuel giriş</div>
                  </TableHead>
                  <TableHead className="w-1/3 text-center">
                    <div className="text-indigo-900">OXİVO İşlem Hacmi/TL</div>
                    <div className="text-xs text-indigo-600 font-normal">Manuel giriş</div>
                  </TableHead>
                  <TableHead className="w-1/3 text-center">
                    <div className="text-green-900">Fark</div>
                    <div className="text-xs text-green-600 font-normal">PF - OXİVO</div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="p-2">
                    {isViewMode ? (
                      <div className="text-center py-2 px-3 bg-gray-50 rounded">
                        {formPFIslemHacmi 
                          ? `${parseFloat(formPFIslemHacmi).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`
                          : '-'}
                      </div>
                    ) : (
                      <Input
                        type="number"
                        placeholder="Manuel giriş TL tutar"
                        value={formPFIslemHacmi}
                        onChange={(e) => setFormPFIslemHacmi(e.target.value)}
                        className="bg-white text-center"
                        step="0.01"
                      />
                    )}
                  </TableCell>
                  <TableCell className="p-2">
                    {isViewMode ? (
                      <div className="text-center py-2 px-3 bg-gray-50 rounded">
                        {formOxivoIslemHacmi 
                          ? `${parseFloat(formOxivoIslemHacmi).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`
                          : '-'}
                      </div>
                    ) : (
                      <Input
                        type="number"
                        placeholder="Manuel giriş TL tutar"
                        value={formOxivoIslemHacmi}
                        onChange={(e) => setFormOxivoIslemHacmi(e.target.value)}
                        className="bg-white text-center"
                        step="0.01"
                      />
                    )}
                  </TableCell>
                  <TableCell className="p-2">
                    {(() => {
                      const pf = parseFloat(formPFIslemHacmi) || 0;
                      const oxivo = parseFloat(formOxivoIslemHacmi) || 0;
                      const fark = pf - oxivo;
                      const bgColor = fark > 0 ? 'bg-green-50' : fark < 0 ? 'bg-red-50' : 'bg-gray-50';
                      const borderColor = fark > 0 ? 'border-green-200' : fark < 0 ? 'border-red-200' : 'border-gray-200';
                      const textColor = fark > 0 ? 'text-green-800' : fark < 0 ? 'text-red-800' : 'text-gray-800';
                      const labelColor = fark > 0 ? 'text-green-600' : fark < 0 ? 'text-red-600' : 'text-gray-600';
                      
                      return (
                        <div className={`text-center py-2 px-3 ${bgColor} rounded border ${borderColor}`}>
                          <div className={`text-xs ${labelColor} mb-1`}>hesapla = PF İşlem Hacmi/TL - OXİVO İşlem Hacmi/TL</div>
                          <div className={`font-medium ${textColor}`}>
                            {fark.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                          </div>
                        </div>
                      );
                    })()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Notlar */}
          {!isViewMode && (
            <div className="space-y-2">
              <Label htmlFor="notlar">Notlar (Opsiyonel)</Label>
              <Textarea
                id="notlar"
                value={formNotlar}
                onChange={(e) => setFormNotlar(e.target.value)}
                placeholder="Bu hakediş dönemi hakkında notlar ekleyebilirsiniz..."
                className="bg-white"
                rows={2}
              />
            </div>
          )}
          
          {isViewMode && formNotlar && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-900 mb-1">📝 Notlar:</div>
              <div className="text-sm text-blue-800">{formNotlar}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bilgilendirme - Boş Grup Uyarısı */}
      {aktifTabelaRecords.length === 0 && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 text-sm text-orange-800">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="mb-2"><strong>Seçili TABELA Grubunda Kayıt Bulunamadı</strong></p>
                <p className="text-xs">
                  "{tabelaGroups.find(g => g.id === formTabelaGroupId)?.name}" grubunda aktif TABELA kaydı bulunmuyor. 
                  Önce TABELA sekmesinden bu gruba kayıt ekleyin veya başka bir grup seçin.
                </p>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setView('selectGroup')}
                  className="mt-3 bg-white"
                >
                  ← Farklı Grup Seç
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ana TABELA Tablosu */}
      {(normalRecords || []).length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Ana TABELA Tablosu</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Ek geliri olmayan normal TABELA kayıtları ({normalRecords.length} kayıt)
                </p>
                {view !== 'view' && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 rounded px-2 py-1 inline-block">
                      💡 <strong>Toplam İşlem Hacmi ve OXİVO Payı:</strong> Otomatik hesaplanır, ancak manuel değer girebilirsiniz
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-blue-600">
                  {normalRecords.length} Kayıt
                </Badge>
                
                {/* Eksi Değer Filtresi */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <label className="flex items-center gap-2 text-sm cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50 transition-colors">
                      <Checkbox 
                        checked={includeNegativeValues}
                        onCheckedChange={(checked) => setIncludeNegativeValues(checked as boolean)}
                      />
                      <span className="text-xs whitespace-nowrap">
                        Eksi (-) değerleri toplama dahil et
                      </span>
                      <Info size={14} className="text-gray-400" />
                    </label>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="text-xs">
                      <strong>PF Payı</strong> ve <strong>OXİVO Payı</strong> hesaplamalarında eksi (-) değer oluşan satırları 
                      <strong> ANA TABELA TOPLAM</strong>'a dahil edip etmeyeceğinizi seçin.
                    </p>
                    <p className="text-xs mt-1 text-gray-400">
                      ✓ İşaretli: Tüm değerler toplama dahil edilir<br/>
                      ✗ İşaretsiz: Sadece pozitif değerler toplama dahil edilir
                    </p>
                  </TooltipContent>
                </Tooltip>
                
                {/* Sütun Göster/Gizle Kontrolü */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Columns3 size={16} />
                      Sütunlar
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="dropdown-panel w-72 p-0 max-h-[70vh]" align="end" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="p-4 flex-shrink-0">
                      <div className="pb-2 border-b">
                        <h4 className="text-sm text-gray-900">Sütun Görünürlüğü</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Görmek istediğiniz sütunları seçin
                        </p>
                      </div>
                    </div>
                      
                    <div className="px-4 overflow-y-auto flex-1 min-h-0">
                      <div className="grid grid-cols-2 gap-2 pb-3">
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                          <Checkbox 
                            checked={visibleColumns.klm}
                            onCheckedChange={() => toggleColumn('klm')}
                          />
                          <span>KLM</span>
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                          <Checkbox 
                            checked={visibleColumns.grup}
                            onCheckedChange={() => toggleColumn('grup')}
                          />
                          <span>Grup</span>
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                          <Checkbox 
                            checked={visibleColumns.kisaAciklama}
                            onCheckedChange={() => toggleColumn('kisaAciklama')}
                          />
                          <span>Kısa Açıklama</span>
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                          <Checkbox 
                            checked={visibleColumns.urun}
                            onCheckedChange={() => toggleColumn('urun')}
                          />
                          <span>Ürün</span>
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                          <Checkbox 
                            checked={visibleColumns.gelirModeli}
                            onCheckedChange={() => toggleColumn('gelirModeli')}
                          />
                          <span>Gelir Modeli</span>
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                          <Checkbox 
                            checked={visibleColumns.kartProg}
                            onCheckedChange={() => toggleColumn('kartProg')}
                          />
                          <span>Kart Prog.</span>
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                          <Checkbox 
                            checked={visibleColumns.kullanim}
                            onCheckedChange={() => toggleColumn('kullanim')}
                          />
                          <span>Kullanım</span>
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                          <Checkbox 
                            checked={visibleColumns.kartTipi}
                            onCheckedChange={() => toggleColumn('kartTipi')}
                          />
                          <span>Kart Tipi</span>
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                          <Checkbox 
                            checked={visibleColumns.islemHacmi}
                            onCheckedChange={() => toggleColumn('islemHacmi')}
                          />
                          <span>İşlem Hacmi</span>
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                          <Checkbox 
                            checked={visibleColumns.vade}
                            onCheckedChange={() => toggleColumn('vade')}
                          />
                          <span>Vade</span>
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                          <Checkbox 
                            checked={visibleColumns.kazancTL}
                            onCheckedChange={() => toggleColumn('kazancTL')}
                          />
                          <span>Kar</span>
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                          <Checkbox 
                            checked={visibleColumns.oxivoPayi}
                            onCheckedChange={() => toggleColumn('oxivoPayi')}
                          />
                          <span>OXİVO Payı</span>
                        </label>
                      </div>
                    </div>
                      
                    <div className="px-4 pb-4 pt-2 border-t flex gap-2 flex-shrink-0">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setVisibleColumns({
                            klm: true, grup: true, kisaAciklama: true, urun: true,
                            gelirModeli: true, kartProg: true, kullanim: true, kartTipi: true,
                            islemHacmi: true, vade: true, kazancTL: true, oxivoPayi: true
                          })}
                          className="flex-1 text-xs"
                        >
                          Tümünü Göster
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setVisibleColumns({
                            klm: true, grup: false, kisaAciklama: false, urun: false,
                            gelirModeli: false, kartProg: false, kullanim: false, kartTipi: false,
                            islemHacmi: true, vade: true, kazancTL: true, oxivoPayi: true
                          })}
                          className="flex-1 text-xs"
                        >
                          Özet Görünüm
                        </Button>
                      </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Bilgilendirme mesajı - Eksi değer filtresi */}
            {!includeNegativeValues && (
              <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-start gap-2 text-xs text-orange-800">
                  <Info size={14} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Eksi değer filtresi aktif:</strong> PF Payı ve OXİVO Payı sütunlarında eksi (-) değerler 
                    <strong className="text-orange-900"> kırmızı renkte</strong> gösterilir ve 
                    <strong className="text-orange-900"> ANA TABELA TOPLAM'a dahil edilmez</strong>.
                    Tüm değerleri toplama dahil etmek için yukarıdaki checkbox'ı işaretleyin.
                  </div>
                </div>
              </div>
            )}
            
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    {/* A: KLM - Mavi zemin */}
                    {visibleColumns.klm && <TableHead className="bg-blue-100 text-blue-900 text-center">KLM</TableHead>}
                    {/* B: Grup - Mavi zemin */}
                    {visibleColumns.grup && <TableHead className="bg-blue-100 text-blue-900">Grup</TableHead>}
                    {/* C: Kısa Açıklama - Mavi zemin */}
                    {visibleColumns.kisaAciklama && <TableHead className="bg-blue-100 text-blue-900">Kısa Açıklama</TableHead>}
                    {/* D: Ürün - Mavi zemin */}
                    {visibleColumns.urun && <TableHead className="bg-blue-100 text-blue-900">Ürün</TableHead>}
                    {/* E: Gelir Modeli - Mavi zemin */}
                    {visibleColumns.gelirModeli && <TableHead className="bg-blue-100 text-blue-900">Gelir Modeli</TableHead>}
                    {/* F: Kart Prog. - Mavi zemin */}
                    {visibleColumns.kartProg && <TableHead className="bg-blue-100 text-blue-900">Kart Prog.</TableHead>}
                    {/* G: Kullanım - Mavi zemin */}
                    {visibleColumns.kullanim && <TableHead className="bg-blue-100 text-blue-900">Kullanım</TableHead>}
                    {/* H: Kart Tipi - Mavi zemin */}
                    {visibleColumns.kartTipi && <TableHead className="bg-blue-100 text-blue-900">Kart Tipi</TableHead>}
                    {/* I: İşlem Hacmi - Yeşil zemin (Manuel giriş) */}
                    {visibleColumns.islemHacmi && <TableHead className="bg-green-100 text-green-900 text-center">
                      <div>İşlem Hacmi</div>
                      <div className="text-xs opacity-70">Manuel TL Giriş</div>
                    </TableHead>}
                    {/* J: Vade - Mavi zemin */}
                    {visibleColumns.vade && <TableHead className="bg-blue-100 text-blue-900 text-center">Vade</TableHead>}
                    {/* K: Kar - Beyaz zemin (Sabit Komisyon için "Kar", Gelir Ortaklığı için gizli) */}
                    {visibleColumns.kazancTL && <TableHead className="bg-white text-gray-900 text-right">Kar</TableHead>}
                    {/* L: OXİVO Payı - Beyaz zemin */}
                    {visibleColumns.oxivoPayi && <TableHead className="bg-white text-gray-900 text-right">OXİVO Payı</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    // Kayıtları Yurt İçi ve Yurt Dışı olarak gruplandır
                    const yurtIciRecords = normalRecords.filter(r => r.yurtIciDisi === 'Yurt İçi');
                    const yurtDisiRecords = normalRecords.filter(r => r.yurtIciDisi === 'Yurt Dışı');
                    
                    const selectedGroup = tabelaGroups.find(g => g.id === formTabelaGroupId);
                    const totalColumns = Object.values(visibleColumns).filter(Boolean).length;
                    
                    const renderRecordRows = (records: typeof normalRecords, globalStartIndex: number) => {
                      return records.flatMap((record, localRecordIndex) => {
                        // Her kayıt için aktif vadeleri bul
                        const aktifVadeler = record.komisyonOranları.filter(ko => ko.aktif !== false);
                        
                        // Her vade için ayrı satır oluştur
                        return aktifVadeler.map((vadeData, vadeIndex) => {
                          const vadeKey = `${record.id}-${vadeData.vade}`;
                          const islemHacmi = parseFloat(formIslemHacmiMap[vadeKey] || '0');
                          
                          // Gelir Modeline göre hesaplamalar
                          const isSabitKomisyon = record.gelirModeli.ad === 'Sabit Komisyon';
                          
                          let alisYuzde = 0;
                          let satisYuzde = 0;
                          let kazancYuzde = 0;
                          let alisTL = 0;
                          let satisTL = 0;
                          let kazancTL = 0;
                          
                          if (isSabitKomisyon) {
                            // Sabit Komisyon: Sadece komisyon oranı kullan
                            kazancYuzde = parseFloat(vadeData.oran || '0');
                            kazancTL = islemHacmi * (kazancYuzde / 100);
                          } else {
                            // Gelir Ortaklığı: Alış ve Satış farkı
                            alisYuzde = parseFloat(vadeData.alisTL || '0');
                            satisYuzde = parseFloat(vadeData.satisTL || '0');
                            kazancYuzde = satisYuzde - alisYuzde;
                            
                            alisTL = islemHacmi * (alisYuzde / 100);
                            satisTL = islemHacmi * (satisYuzde / 100);
                            kazancTL = satisTL - alisTL;
                          }
                          
                          const pfOrani = parseFloat(record.paylaşımOranları.kurulusOrani || '0');
                          const oxivoOrani = parseFloat(record.paylaşımOranları.oxivoOrani || '0');
                          const pfPayi = kazancTL * (pfOrani / 100);
                          const oxivoPayi = kazancTL * (oxivoOrani / 100);
                          
                          const globalRecordIndex = globalStartIndex + localRecordIndex;
                          
                          return (
                            <TableRow key={vadeKey} className="hover:bg-gray-50">
                            {/* A: KLM */}
                            {visibleColumns.klm && (
                              <TableCell className="bg-blue-50/30 text-center">
                                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 font-mono text-xs">
                                  {String(globalRecordIndex + 1).padStart(2, '0')}
                                </Badge>
                              </TableCell>
                            )}
                        
                        {/* B: Grup */}
                        {visibleColumns.grup && (
                          <TableCell className="bg-blue-50/30">
                            {selectedGroup ? (
                              <Badge variant="default" className="bg-blue-600 text-white text-xs">
                                {selectedGroup.name}
                              </Badge>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </TableCell>
                        )}
                        
                        {/* C: Kısa Açıklama */}
                        {visibleColumns.kisaAciklama && (
                          <TableCell className="bg-blue-50/30">
                            {(record as any).kisaAciklama ? (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs">
                                {(record as any).kisaAciklama}
                              </Badge>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </TableCell>
                        )}
                        
                        {/* D: Ürün */}
                        {visibleColumns.urun && (
                          <TableCell className="bg-blue-50/30">
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300 text-xs">
                              {kisaltUrunAdi(record.urun || '-')}
                            </Badge>
                          </TableCell>
                        )}
                        
                        {/* E: Gelir Modeli */}
                        {visibleColumns.gelirModeli && (
                          <TableCell className="bg-blue-50/30">
                            <span className="text-xs">{record.gelirModeli.ad}</span>
                          </TableCell>
                        )}
                        
                        {/* F: Kart Prog. */}
                        {visibleColumns.kartProg && (
                          <TableCell className="bg-blue-50/30">
                            <span className="text-xs">
                              {record.kartProgramIds?.includes('ALL') 
                                ? 'Hepsi' 
                                : `${record.kartProgramIds?.length || 0} prog.`}
                            </span>
                          </TableCell>
                        )}
                        
                        {/* G: Kullanım */}
                        {visibleColumns.kullanim && (
                          <TableCell className="bg-blue-50/30">
                            <Badge variant={record.yurtIciDisi === 'Yurt İçi' ? 'default' : 'secondary'} className="text-xs">
                              {record.yurtIciDisi}
                            </Badge>
                          </TableCell>
                        )}
                        
                        {/* H: Kart Tipi */}
                        {visibleColumns.kartTipi && (
                          <TableCell className="bg-blue-50/30">
                            <Badge 
                              variant={record.kartTipi === 'Credit' ? 'default' : record.kartTipi === 'Debit' ? 'secondary' : 'outline'}
                              className={`text-xs ${record.kartTipi === 'Paçal' ? 'bg-purple-100 text-purple-700 border-purple-300' : ''}`}
                            >
                              {record.kartTipi}
                            </Badge>
                          </TableCell>
                        )}
                        
                        {/* I: İşlem Hacmi - Yeşil zemin (Manuel giriş) */}
                        {visibleColumns.islemHacmi && (
                          <TableCell className="bg-green-50/50">
                            {view === 'view' ? (
                              <div className="text-right pr-3">
                                <span className={`text-sm ${islemHacmi > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                                  {islemHacmi.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                                </span>
                              </div>
                            ) : (
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={formIslemHacmiMap[vadeKey] ? formatCurrency(formIslemHacmiMap[vadeKey]) : ''}
                                onChange={(e) => handleIslemHacmiChange(vadeKey, e.target.value)}
                                placeholder="0,00 ₺"
                                className="w-40 text-right bg-white"
                                onFocus={(e) => {
                                  // Focus'ta sadece sayıyı göster
                                  if (formIslemHacmiMap[vadeKey]) {
                                    const num = parseFloat(formIslemHacmiMap[vadeKey]);
                                    e.target.value = num.toFixed(2).replace('.', ',');
                                  }
                                }}
                                onBlur={(e) => {
                                  // Blur'da formatı geri yükle
                                  if (formIslemHacmiMap[vadeKey]) {
                                    e.target.value = formatCurrency(formIslemHacmiMap[vadeKey]);
                                  }
                                }}
                              />
                            )}
                          </TableCell>
                        )}
                        
                        {/* J: Vade */}
                        {visibleColumns.vade && (
                          <TableCell className="bg-blue-50/30 text-center">
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300 text-xs">
                              {vadeData.vade.replace(' (Peşin)', '')}
                            </Badge>
                          </TableCell>
                        )}
                        
                        {/* K: Kar - Beyaz zemin (Sabit Komisyon için komisyon oranı, Gelir Ortaklığı için detaylı) */}
                        {visibleColumns.kazancTL && (
                          <TableCell className="bg-white text-right">
                            {isSabitKomisyon ? (
                              // Sabit Komisyon: Komisyon oranını göster
                              <div className="text-sm text-blue-700">
                                %{parseFloat(vadeData.oran || '0').toFixed(2)}
                              </div>
                            ) : (
                              // Gelir Ortaklığı: Detaylı görünüm (Alış, Satış, Kazanç)
                              <div className="text-xs space-y-1">
                                <div className={`${islemHacmi > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                  Alış: {alisTL.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className={`${islemHacmi > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                  Satış: {satisTL.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className={`${islemHacmi > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                  Kar: {kazancTL.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              </div>
                            )}
                          </TableCell>
                        )}
                        
                        {/* L: OXİVO Payı - Beyaz zemin */}
                        {visibleColumns.oxivoPayi && (
                          <TableCell className="bg-white text-right">
                            <span className={`text-sm ${
                              islemHacmi === 0 ? 'text-gray-400' : 
                              oxivoPayi < 0 ? 'text-red-600 font-bold' : 
                              'text-indigo-700'
                            }`}>
                              {oxivoPayi.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              ({oxivoOrani.toFixed(0)}%)
                            </div>
                          </TableCell>
                        )}
                            </TableRow>
                          );
                        });
                      });
                    };
                    
                    const allRows = [];
                    
                    // Yurt İçi Grubu
                    // ✅ NULL SAFETY: yurtIciRecords undefined olabilir
                    if ((yurtIciRecords || []).length > 0) {
                      allRows.push(
                        <TableRow key="yurtici-header" className="bg-gradient-to-r from-teal-100 to-teal-50 border-y border-teal-300">
                          <TableCell colSpan={totalColumns} className="py-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="default" className="bg-teal-600 text-white">
                                Yurt İçi
                              </Badge>
                              <span className="text-sm text-teal-800">
                                {yurtIciRecords.length} kayıt
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                      allRows.push(...renderRecordRows(yurtIciRecords, 0));
                    }
                    
                    // Yurt Dışı Grubu
                    // ✅ NULL SAFETY: yurtDisiRecords undefined olabilir
                    if ((yurtDisiRecords || []).length > 0) {
                      allRows.push(
                        <TableRow key="yurtdisi-header" className="bg-gradient-to-r from-amber-100 to-amber-50 border-y border-amber-300">
                          <TableCell colSpan={totalColumns} className="py-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-amber-600 text-white">
                                Yurt Dışı
                              </Badge>
                              <span className="text-sm text-amber-800">
                                {yurtDisiRecords.length} kayıt
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                      allRows.push(...renderRecordRows(yurtDisiRecords, yurtIciRecords.length));
                    }
                    
                    return allRows;
                  })()}
                  
                  {/* ANA TABELA TOPLAM Satırı */}
                  <TableRow className="bg-gradient-to-r from-blue-100 to-blue-50 border-t-2 border-blue-300">
                    <TableCell 
                      colSpan={
                       Object.values(visibleColumns).filter(Boolean).length - 
                        (visibleColumns.islemHacmi ? 1 : 0) - 
                        (visibleColumns.kazanc ? 1 : 0) - 
                        (visibleColumns.kazancTL ? 1 : 0) - 
                        (visibleColumns.pfPayi ? 1 : 0) - 
                        (visibleColumns.oxivoPayi ? 1 : 0)
                      } 
                      className="text-right"
                    >
                      <strong className="text-blue-900">ANA TABELA TOPLAM</strong>
                    </TableCell>
                    {visibleColumns.islemHacmi && (
                      <TableCell className="bg-green-100 text-center">
                        {view === 'view' ? (
                          <div className="flex flex-col items-center gap-1">
                            <strong className="text-green-800">
                              {(manualAnaTabelaIslemHacmi 
                                ? parseFloat(manualAnaTabelaIslemHacmi) 
                                : totals.normalTotals.totalIslemHacmi
                              ).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                            </strong>
                            <div className="text-xs text-green-700">
                              Toplam İşlem Hacmi
                            </div>
                            {manualAnaTabelaIslemHacmi && (
                              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                                (Manuel Değer)
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Input
                              type="text"
                              placeholder={totals.normalTotals.totalIslemHacmi.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              value={manualAnaTabelaIslemHacmi}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9.,]/g, '');
                                setManualAnaTabelaIslemHacmi(value);
                              }}
                              className="w-32 h-8 text-center bg-white border-2 border-purple-300 focus:border-purple-500 text-sm"
                            />
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-green-700">
                                {manualAnaTabelaIslemHacmi ? '(Manuel)' : '(Otomatik)'}
                              </div>
                              {manualAnaTabelaIslemHacmi && (
                                <button
                                  onClick={() => setManualAnaTabelaIslemHacmi('')}
                                  className="text-xs text-red-600 hover:text-red-800 underline"
                                >
                                  Sıfırla
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.kazanc && (
                      <TableCell className="bg-gray-100 text-center">
                        <strong className="text-gray-700 text-xs">-</strong>
                      </TableCell>
                    )}
                    {visibleColumns.kazancTL && (
                      <TableCell className="bg-green-100 text-right">
                        <strong className="text-green-800">
                          {totals.normalTotals.totalKazanc.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                        </strong>
                      </TableCell>
                    )}
                    {visibleColumns.pfPayi && (
                      <TableCell className="bg-blue-100 text-right">
                        <strong className="text-blue-800">
                          {totals.normalTotals.totalPFPay.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                        </strong>
                        {!includeNegativeValues && totals.normalTotals.excludedPFCount > 0 && (
                          <div className="text-xs text-orange-600 mt-1">
                            ({totals.normalTotals.excludedPFCount} eksi değer hariç)
                          </div>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.oxivoPayi && (
                      <TableCell className="bg-indigo-100 text-right">
                        {view === 'view' ? (
                          <div className="flex flex-col items-end gap-1">
                            <strong className="text-indigo-800">
                              {(manualAnaTabelaOxivoTotal ? parseFloat(manualAnaTabelaOxivoTotal) : totals.normalTotals.totalOxivoPay).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                            </strong>
                            {manualAnaTabelaOxivoTotal && (
                              <span className="text-xs text-indigo-600">
                                (Manuel Değer)
                              </span>
                            )}
                            {!manualAnaTabelaOxivoTotal && !includeNegativeValues && totals.normalTotals.excludedOxivoCount > 0 && (
                              <div className="text-xs text-orange-600 mt-1">
                                ({totals.normalTotals.excludedOxivoCount} eksi değer hariç)
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 justify-end">
                            <div className="flex flex-col gap-1 flex-1">
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={manualAnaTabelaOxivoTotal ? formatCurrency(manualAnaTabelaOxivoTotal) : ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    setManualAnaTabelaOxivoTotal('');
                                    return;
                                  }
                                  const numericValue = parseCurrency(value);
                                  if (!isNaN(numericValue)) {
                                    setManualAnaTabelaOxivoTotal(numericValue.toString());
                                  }
                                }}
                                placeholder={totals.normalTotals.totalOxivoPay.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'}
                                className="w-48 text-right bg-white border-indigo-300 focus:border-indigo-500"
                                onFocus={(e) => {
                                  if (manualAnaTabelaOxivoTotal) {
                                    const num = parseFloat(manualAnaTabelaOxivoTotal);
                                    e.target.value = num.toFixed(2).replace('.', ',');
                                  }
                                }}
                                onBlur={(e) => {
                                  if (manualAnaTabelaOxivoTotal) {
                                    e.target.value = formatCurrency(manualAnaTabelaOxivoTotal);
                                  }
                                }}
                              />
                              <div className="text-xs text-indigo-600 flex items-center gap-1">
                                {manualAnaTabelaOxivoTotal ? (
                                  <>
                                    <span className="text-indigo-700">✓ Manuel</span>
                                    <button
                                      onClick={() => setManualAnaTabelaOxivoTotal('')}
                                      className="text-orange-600 hover:text-orange-700 underline"
                                    >
                                      Sıfırla
                                    </button>
                                  </>
                                ) : (
                                  <span>Otomatik: {totals.normalTotals.totalOxivoPay.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        {!manualAnaTabelaOxivoTotal && !includeNegativeValues && totals.normalTotals.excludedOxivoCount > 0 && view !== 'view' && (
                          <div className="text-xs text-orange-600 mt-1">
                            ({totals.normalTotals.excludedOxivoCount} eksi değer hariç)
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ek Gelir Detayları Tablosu */}
      {ekGelirRecords.length > 0 && (
        <Card className="mt-8">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-purple-900 flex items-center gap-2">
                  <span className="text-xl">💰</span>
                  Ek Gelir Detayları Tablosu
                </CardTitle>
                <p className="text-sm text-purple-700 mt-1">
                  Ek geliri olan TABELA kayıtları ({ekGelirRecords.length} kayıt)
                </p>
                {view !== 'view' && (
                  <p className="text-xs text-indigo-600 mt-2 bg-indigo-50 border border-indigo-200 rounded px-2 py-1">
                    💡 <strong>OXİVO Payı Toplam:</strong> Otomatik hesaplanır, ancak manuel değer girebilirsiniz
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-purple-600">
                  {ekGelirRecords.length} Kayıt
                </Badge>
                
                {/* Sütun Göster/Gizle Kontrolü - Ek Gelir */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Columns3 size={16} />
                      Sütunlar
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="dropdown-panel w-72 p-0 max-h-[70vh]" align="end" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="p-4 flex-shrink-0">
                      <div className="pb-2 border-b">
                        <h4 className="text-sm text-gray-900">Sütun Görünürlüğü</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Görmek istediğiniz sütunları seçin
                        </p>
                      </div>
                    </div>
                      
                    <div className="px-4 overflow-y-auto flex-1 min-h-0">
                      <div className="grid grid-cols-2 gap-2 pb-3">
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                          <Checkbox 
                            checked={visibleEkGelirColumns.klm}
                            onCheckedChange={() => toggleEkGelirColumn('klm')}
                          />
                          <span>KLM</span>
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                          <Checkbox 
                            checked={visibleEkGelirColumns.grup}
                            onCheckedChange={() => toggleEkGelirColumn('grup')}
                          />
                          <span>Grup</span>
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                          <Checkbox 
                            checked={visibleEkGelirColumns.kisaAciklama}
                            onCheckedChange={() => toggleEkGelirColumn('kisaAciklama')}
                          />
                          <span>Kısa Açıklama</span>
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                          <Checkbox 
                            checked={visibleEkGelirColumns.urun}
                            onCheckedChange={() => toggleEkGelirColumn('urun')}
                          />
                          <span>Ürün</span>
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                          <Checkbox 
                            checked={visibleEkGelirColumns.gelirModeli}
                            onCheckedChange={() => toggleEkGelirColumn('gelirModeli')}
                          />
                          <span>Gelir Modeli</span>
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                          <Checkbox 
                            checked={visibleEkGelirColumns.kartProg}
                            onCheckedChange={() => toggleEkGelirColumn('kartProg')}
                          />
                          <span>Kart Prog.</span>
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                          <Checkbox 
                            checked={visibleEkGelirColumns.kullanim}
                            onCheckedChange={() => toggleEkGelirColumn('kullanim')}
                          />
                          <span>Kullanım</span>
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                          <Checkbox 
                            checked={visibleEkGelirColumns.kartTipi}
                            onCheckedChange={() => toggleEkGelirColumn('kartTipi')}
                          />
                          <span>Kart Tipi</span>
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                          <Checkbox 
                            checked={visibleEkGelirColumns.islemHacmi}
                            onCheckedChange={() => toggleEkGelirColumn('islemHacmi')}
                          />
                          <span>İşlem Hacmi</span>
                        </label>
                      </div>
                    </div>
                      
                    <div className="px-4 pb-4 pt-2 border-t flex gap-2 flex-shrink-0">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setVisibleEkGelirColumns({
                            klm: true, grup: true, kisaAciklama: true, urun: true,
                            gelirModeli: true, kartProg: true, kullanim: true, kartTipi: true,
                            islemHacmi: true
                          })}
                          className="flex-1 text-xs"
                        >
                          Tümünü Göster
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setVisibleEkGelirColumns({
                            klm: true, grup: false, kisaAciklama: false, urun: false,
                            gelirModeli: false, kartProg: false, kullanim: false, kartTipi: false,
                            islemHacmi: true
                          })}
                          className="flex-1 text-xs"
                        >
                          Özet Görünüm
                        </Button>
                      </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    {/* Mavi zemin: TABELA'dan gelen veriler */}
                    {visibleEkGelirColumns.klm && <TableHead className="bg-blue-100 text-blue-900 text-center w-12">KLM</TableHead>}
                    {visibleEkGelirColumns.grup && <TableHead className="bg-blue-100 text-blue-900">Grup</TableHead>}
                    {visibleEkGelirColumns.kisaAciklama && <TableHead className="bg-blue-100 text-blue-900">Kısa Açıklama</TableHead>}
                    {visibleEkGelirColumns.urun && <TableHead className="bg-blue-100 text-blue-900">Ürün</TableHead>}
                    {visibleEkGelirColumns.gelirModeli && <TableHead className="bg-blue-100 text-blue-900">Gelir Modeli</TableHead>}
                    {visibleEkGelirColumns.kartProg && <TableHead className="bg-blue-100 text-blue-900">Kart Prog.</TableHead>}
                    {visibleEkGelirColumns.kullanim && <TableHead className="bg-blue-100 text-blue-900">Kullanım</TableHead>}
                    {visibleEkGelirColumns.kartTipi && <TableHead className="bg-blue-100 text-blue-900">Kart Tipi</TableHead>}
                    
                    {/* Yeşil zemin: Manuel TL giriş */}
                    {visibleEkGelirColumns.islemHacmi && <TableHead className="bg-green-100 text-green-900 text-center">
                      <div className="space-y-0.5">
                        <div>İşlem Hacmi</div>
                        <div className="text-xs opacity-70">Manuel TL değer Girişi</div>
                      </div>
                    </TableHead>}
                    
                    {/* Beyaz zemin: Hesaplanan değerler */}
                    <TableHead className="bg-white text-gray-900 text-right">
                      <div className="space-y-0.5">
                        <div>PF Payı</div>
                        <div className="text-xs text-gray-500">I4*J2</div>
                      </div>
                    </TableHead>
                    <TableHead className="bg-white text-gray-900 text-right">
                      <div className="space-y-0.5">
                        <div>OXİVO Payı</div>
                        <div className="text-xs text-gray-500">I4*K2</div>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ekGelirRecords.map((record, index) => {
                    const islemHacmi = parseFloat(formIslemHacmiMap[record.id] || '0');
                    const selectedGroup = tabelaGroups.find(g => g.id === formTabelaGroupId);
                    
                    // Hesaplamalar - PF Payı ve OXİVO Payı
                    const pfOrani = parseFloat(record.ekGelirDetay?.pfYuzde || '0');
                    const oxOrani = parseFloat(record.ekGelirDetay?.oxYuzde || '0');
                    const pfPayi = islemHacmi * (pfOrani / 100);
                    const oxPayi = islemHacmi * (oxOrani / 100);
                    
                    return (
                      <TableRow key={record.id} className="hover:bg-gray-50">
                        {/* Mavi zemin kolonlar */}
                        {visibleEkGelirColumns.klm && (
                          <TableCell className="bg-blue-50/30 text-center">
                            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 font-mono text-xs">
                              {String(index + 10).padStart(2, '0')}
                            </Badge>
                          </TableCell>
                        )}
                        {visibleEkGelirColumns.grup && (
                          <TableCell className="bg-blue-50/30">
                            {selectedGroup ? (
                              <Badge variant="default" className="bg-blue-600 text-white text-xs">
                                {selectedGroup.name}
                              </Badge>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </TableCell>
                        )}
                        {visibleEkGelirColumns.kisaAciklama && (
                          <TableCell className="bg-blue-50/30">
                            {(record as any).kisaAciklama ? (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs">
                                {(record as any).kisaAciklama}
                              </Badge>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </TableCell>
                        )}
                        {visibleEkGelirColumns.urun && (
                          <TableCell className="bg-blue-50/30">
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300">
                              {kisaltUrunAdi(record.urun || '-')}
                            </Badge>
                          </TableCell>
                        )}
                        {visibleEkGelirColumns.gelirModeli && (
                          <TableCell className="bg-blue-50/30">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                              {record.gelirModeli.ad}
                            </Badge>
                          </TableCell>
                        )}
                        {visibleEkGelirColumns.kartProg && (
                          <TableCell className="bg-blue-50/30">
                            <span className="text-xs text-gray-600">Hesap</span>
                          </TableCell>
                        )}
                        {visibleEkGelirColumns.kullanim && (
                          <TableCell className="bg-blue-50/30">
                            <Badge variant={record.ekGelirDetay?.kullanim === 'Yurt İçi' ? 'default' : 'secondary'}>
                              {record.ekGelirDetay?.kullanim || '-'}
                            </Badge>
                          </TableCell>
                        )}
                        {visibleEkGelirColumns.kartTipi && (
                          <TableCell className="bg-blue-50/30">
                            <Badge 
                              variant="outline"
                              className="bg-purple-100 text-purple-700 border-purple-300"
                            >
                              {record.ekGelirDetay?.kartTipi ? record.ekGelirDetay.kartTipi.split(' (')[0] : '-'}
                            </Badge>
                          </TableCell>
                        )}
                        
                        {/* Yeşil zemin: Manuel TL giriş */}
                        {visibleEkGelirColumns.islemHacmi && (
                          <TableCell className="bg-green-50/50">
                            {view === 'view' ? (
                              <div className="text-right pr-3">
                                <span className={`text-sm ${islemHacmi > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                                  {islemHacmi.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                                </span>
                              </div>
                            ) : (
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={formIslemHacmiMap[record.id] ? formatCurrency(formIslemHacmiMap[record.id]) : ''}
                                onChange={(e) => handleIslemHacmiChange(record.id, e.target.value)}
                                placeholder="0,00 ₺"
                                className="w-40 text-right bg-white"
                                onFocus={(e) => {
                                  // Focus'ta sadece sayıyı göster
                                  if (formIslemHacmiMap[record.id]) {
                                    const num = parseFloat(formIslemHacmiMap[record.id]);
                                    e.target.value = num.toFixed(2).replace('.', ',');
                                  }
                                }}
                                onBlur={(e) => {
                                  // Blur'da formatı geri yükle
                                  if (formIslemHacmiMap[record.id]) {
                                    e.target.value = formatCurrency(formIslemHacmiMap[record.id]);
                                  }
                                }}
                              />
                            )}
                          </TableCell>
                        )}
                        
                        {/* Beyaz zemin: Hesaplanan değerler */}
                        <TableCell className="text-right">
                          <span className={`text-sm ${islemHacmi > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                            {pfPayi.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`text-sm ${islemHacmi > 0 ? 'text-indigo-700' : 'text-gray-400'}`}>
                            {oxPayi.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {/* EK GELİR TOPLAM Satırı */}
                  <TableRow className="bg-gradient-to-r from-purple-100 to-purple-50 border-t-2 border-purple-300">
                    <TableCell 
                      colSpan={Object.values(visibleEkGelirColumns).filter(Boolean).length - 1}
                      className="text-right"
                    >
                      <strong className="text-purple-900">EK GELİR TOPLAM</strong>
                    </TableCell>
                    {visibleEkGelirColumns.islemHacmi && (
                      <TableCell className="bg-green-100 text-right">
                        <strong className="text-green-800">
                          {totals.ekGelirTotals.totalIslemHacmi.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                        </strong>
                      </TableCell>
                    )}
                    <TableCell className="bg-blue-100 text-right">
                      <strong className="text-blue-800">
                        {totals.ekGelirTotals.totalPFTL.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                      </strong>
                    </TableCell>
                    <TableCell className="bg-indigo-100 text-right">
                      {view === 'view' ? (
                        <div className="flex flex-col items-end gap-1">
                          <strong className="text-indigo-800">
                            {(manualEkGelirOxivoTotal ? parseFloat(manualEkGelirOxivoTotal) : totals.ekGelirTotals.totalOXTL).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                          </strong>
                          {manualEkGelirOxivoTotal && (
                            <span className="text-xs text-indigo-600">
                              (Manuel Değer)
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 justify-end">
                          <div className="flex flex-col gap-1 flex-1">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={manualEkGelirOxivoTotal ? formatCurrency(manualEkGelirOxivoTotal) : ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                  setManualEkGelirOxivoTotal('');
                                  return;
                                }
                                const numericValue = parseCurrency(value);
                                const sanitized = numericValue.replace(/[^0-9.]/g, '');
                                if (sanitized && !isNaN(parseFloat(sanitized))) {
                                  setManualEkGelirOxivoTotal(sanitized);
                                }
                              }}
                              placeholder={`Otomatik: ${totals.ekGelirTotals.totalOXTL.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`}
                              className="w-44 text-right bg-white text-sm"
                              onFocus={(e) => {
                                if (manualEkGelirOxivoTotal) {
                                  const num = parseFloat(manualEkGelirOxivoTotal);
                                  e.target.value = num.toFixed(2).replace('.', ',');
                                }
                              }}
                              onBlur={(e) => {
                                if (manualEkGelirOxivoTotal) {
                                  e.target.value = formatCurrency(manualEkGelirOxivoTotal);
                                }
                              }}
                            />
                            {manualEkGelirOxivoTotal && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-indigo-600">
                                  Otomatik: {totals.ekGelirTotals.totalOXTL.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setManualEkGelirOxivoTotal('')}
                                  className="text-red-600 hover:text-red-800 underline"
                                >
                                  Temizle
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ANA TABELA TOPLAM Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300">
          <CardContent className="pt-6 text-center">
            <div className="text-sm text-yellow-800 mb-1">Toplam İşlem Hacmi</div>
            <div className="text-2xl text-yellow-900">
              {(manualAnaTabelaIslemHacmi ? parseFloat(manualAnaTabelaIslemHacmi) : totals.normalTotals.totalIslemHacmi).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
            </div>
            {manualAnaTabelaIslemHacmi && (
              <div className="text-xs text-yellow-700 mt-1">
                (Manuel Giriş)
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-300">
          <CardContent className="pt-6 text-center">
            <div className="text-sm text-green-800 mb-1">Toplam Kazanç</div>
            <div className="text-2xl text-green-900">{totals.normalTotals.totalKazanc.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300">
          <CardContent className="pt-6 text-center">
            <div className="text-sm text-blue-800 mb-1">Toplam PF Payı</div>
            <div className="text-2xl text-blue-900">{totals.normalTotals.totalPFPay.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-300">
          <CardContent className="pt-6 text-center">
            <div className="text-sm text-indigo-800 mb-1">Toplam OXİVO Payı</div>
            <div className="text-2xl text-indigo-900">
              {(manualAnaTabelaOxivoTotal ? parseFloat(manualAnaTabelaOxivoTotal) : totals.normalTotals.totalOxivoPay).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
            </div>
            {manualAnaTabelaOxivoTotal && (
              <div className="text-xs text-indigo-700 mt-1">
                (Manuel Giriş)
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hakediş Hesaplama Mantığı - Bilgilendirme */}
      {aktifTabelaRecords.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 text-sm text-blue-800">
              <span className="text-xl">💡</span>
              <div className="space-y-1">
                <p><strong>Hakediş Hesaplama Mantığı:</strong></p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li><strong>Gelir Ortaklığı:</strong> Kazanç = (İşlem Hacmi × Satış %) - (İşlem Hacmi × Alış %)</li>
                  <li><strong>Sabit Komisyon:</strong> Maliyet = İşlem Hacmi × Komisyon %</li>
                  <li><strong>Hazne Geliri:</strong> Kazanç = (İşlem Sayısı × Birim Tutar) × OXİVO %</li>
                  <li><strong>Ek Gelir:</strong> Tutar = İşlem Hacmi × Birim Tutar, PF/OX payları hesaplanır</li>
                  <li><strong>Paylaşım:</strong> PF/OXİVO payları kazanç üzerinden hesaplanır</li>
                  <li><strong>Grup:</strong> Sadece "{tabelaGroups.find(g => g.id === formTabelaGroupId)?.name}" grubuna ait aktif TABELA kayıtları gösteriliyor</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
