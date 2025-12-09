// TABELA Kayıtları - REFACTORED: State Consolidated, Type-Safe (v3.1 - Fixes Applied)
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { ModernFormSelect } from './ModernFormSelect';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Checkbox } from './ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Plus, Pencil, Trash2, AlertCircle, Upload, X, Image as ImageIcon, XCircle, ChevronDown, ChevronRight, Info, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { TabelaRecord, TabelaGroup } from './TabelaTab';
import { EkGelir } from './RevenueModelsTab';
import { kisaltUrunAdi } from '../utils/formatters';
import { TabelaFormData, GroupFormData, FirmaTabelaTabProps, TabelaGroupDialogProps } from './tabela/types';
import { signApi } from '../utils/supabaseClient';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INLINE COMPONENT: TabelaGroupDialog (to avoid build resolution issues)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function TabelaGroupDialog({
  isOpen,
  onClose,
  groupFormData,
  onGroupFormDataChange,
  onCreateGroup,
  editingGroup,
  availableRecords,
}: TabelaGroupDialogProps) {
  const handleRecordToggle = (recordId: string) => {
    const currentIds = groupFormData.selectedRecordsForGroup;
    const newIds = currentIds.includes(recordId)
      ? currentIds.filter(id => id !== recordId)
      : [...currentIds, recordId];
    
    onGroupFormDataChange({ selectedRecordsForGroup: newIds });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingGroup ? 'Grup Düzenle' : 'Yeni Grup Oluştur'}</DialogTitle>
          <DialogDescription>
            TABELA kayıtlarını gruplandırarak yönetebilirsiniz
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Grup İsmi */}
          <div className="space-y-2">
            <Label htmlFor="groupName">Grup İsmi *</Label>
            <Input
              id="groupName"
              value={groupFormData.groupName}
              onChange={(e) => onGroupFormDataChange({ groupName: e.target.value })}
              placeholder="Örn: 2024 Q1 Kampanyası"
            />
          </div>

          {/* Geçerlilik Tarihleri */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="groupStartDate">Geçerlilik Başlangıcı *</Label>
              <Input
                id="groupStartDate"
                type="date"
                value={groupFormData.groupStartDate}
                onChange={(e) => onGroupFormDataChange({ groupStartDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupEndDate">Geçerlilik Bitişi</Label>
              <Input
                id="groupEndDate"
                type="date"
                value={groupFormData.groupEndDate}
                onChange={(e) => onGroupFormDataChange({ groupEndDate: e.target.value })}
              />
            </div>
          </div>

          {/* Aktif/Pasif Durumu */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div>
              <Label htmlFor="groupAktif">Grup Durumu</Label>
              <p className="text-sm text-gray-600">
                {groupFormData.groupAktif ? 'Grup hakediş için aktif' : 'Grup hakediş için pasif'}
              </p>
            </div>
            <Switch
              id="groupAktif"
              checked={groupFormData.groupAktif}
              onCheckedChange={(checked) => onGroupFormDataChange({ groupAktif: checked })}
            />
          </div>

          {/* TABELA Kayıtları Seçimi */}
          <div className="space-y-2">
            <Label>TABELA Kayıtları *</Label>
            <div className="max-h-64 overflow-y-auto border rounded-lg">
              {availableRecords.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {editingGroup
                    ? 'Gruba eklenebilecek başka kayıt bulunmuyor'
                    : 'Gruplama için uygun kayıt bulunmuyor'}
                </div>
              ) : (
                <div className="divide-y">
                  {availableRecords.map((record) => (
                    <div
                      key={record.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                      onClick={() => handleRecordToggle(record.id)}
                    >
                      <input
                        type="checkbox"
                        checked={groupFormData.selectedRecordsForGroup.includes(record.id)}
                        onChange={() => handleRecordToggle(record.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <div className="flex-1 flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                          {record.urun}
                        </Badge>
                        <span>{record.gelirModeli?.ad || 'Gelir Modeli Yok'}</span>
                        <Badge variant={record.yurtIciDisi === 'Yurt İçi' ? 'default' : 'secondary'}>
                          {record.yurtIciDisi}
                        </Badge>
                        <Badge variant="outline">
                          {record.kartTipi}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-600">
              {groupFormData.selectedRecordsForGroup.length} kayıt seçildi
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button onClick={onCreateGroup}>
            {editingGroup ? 'Güncelle' : 'Grup Oluştur'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ✅ Vade listesi
const DEFAULT_VADE_LISTESI = [
  'D+1',
  'D+7',
  'D+14',
  'D+31',
];

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
  vadeListesi = DEFAULT_VADE_LISTESI,
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
  const [editingGroup, setEditingGroup] = useState<TabelaGroup | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showHierarchyDialog, setShowHierarchyDialog] = useState(false);

  // ✅ FORM STATE
  const [formData, setFormData] = useState<TabelaFormData>({
    kisaAciklama: '',
    urun: '',
    kartTipi: '',
    gelirModeliId: '',
    selectedEkGelirId: 'NONE',
    selectedKartProgramIds: [],
    yurtIciDisi: '',
    komisyonOranları: vadeListesi.map(v => ({ vade: v, oran: '', alisTL: '', satisTL: '', karTL: '', aktif: true })),
    kurulusOrani: '',
    oxivoOrani: '',
    aciklama: '',
    fotograf: '',
    hazineGeliri: { tutarTL: '', oxivoYuzde: '', kazancTL: '' },
  });

  // ✅ GROUP FORM STATE
  const [groupFormData, setGroupFormData] = useState<GroupFormData>({
    selectedRecordsForGroup: [],
    groupName: '',
    groupStartDate: '',
    groupEndDate: '',
    groupAktif: true,
  });

  const aktifGelirModelleri = gelirModelleri.filter(g => g.aktif);
  const aktifEkGelirler = ekGelirler.filter(e => e.aktif);
  const aktifBankalar = banks.filter(b => b.aktif);
  const aktifKartProgramlar = kartProgramlar.filter(k => k.aktif);
  
  // 🔍 DEBUG: Check data structure on mount
  useEffect(() => {
    if (tabelaRecords.length > 0) {
      console.log('🔍 [FirmaTabelaTab] TABELA Data Structure:', {
        recordCount: tabelaRecords.length,
        sampleRecord: tabelaRecords[0],
        hasGelirModeli: !!tabelaRecords[0]?.gelirModeli,
        gelirModeliValue: tabelaRecords[0]?.gelirModeli,
        hasUrun: !!tabelaRecords[0]?.urun,
        urunValue: tabelaRecords[0]?.urun,
        allKeys: Object.keys(tabelaRecords[0] || {})
      });
    }
  }, [tabelaRecords]);
  
  // ✅ Seçili gelir modelini bul
  const selectedGelirModeli = gelirModelleri.find(g => g.id === formData.gelirModeliId);
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
    if (isPacalGelirModeli && formData.kartTipi !== 'Paçal') {
      setFormData(prev => ({ ...prev, kartTipi: 'Paçal' }));
      toast.info('Kart tipi otomatik olarak "Paçal" olarak ayarlandı');
    }
  }, [isPacalGelirModeli]);
  
  // Scroll pozisyonunu geri yükle (tabelaRecords değiştiğinde)
  useEffect(() => {
    restoreScrollPosition();
  }, [tabelaRecords]);

  // ✅ RESET FORM
  const resetForm = () => {
    setFormData({
      kisaAciklama: '',
      urun: '',
      kartTipi: '',
      gelirModeliId: '',
      selectedEkGelirId: 'NONE',
      selectedKartProgramIds: [],
      yurtIciDisi: '',
      komisyonOranları: vadeListesi.map(v => ({ vade: v, oran: '', alisTL: '', satisTL: '', karTL: '', aktif: true })),
      kurulusOrani: '',
      oxivoOrani: '',
      aciklama: '',
      fotograf: '',
      hazineGeliri: { tutarTL: '', oxivoYuzde: '', kazancTL: '' },
    });
    setCurrentStep(0);
    setEditingRecord(null);
  };

  const handleOpenDialog = (record?: TabelaRecord) => {
    console.log('🔍 [FirmaTabelaTab] handleOpenDialog çağrıldı:', {
      recordProvided: !!record,
      recordId: record?.id
    });
    if (record) {
      setEditingRecord(record);
      
      const loadedKomisyonlar = vadeListesi.map(vade => {
        const existing = record.komisyonOranları?.find(k => k.vade === vade);
        const result = existing ? {
          vade: existing.vade,
          oran: existing.oran || '',
          alisTL: typeof existing.alisTL === 'number' ? existing.alisTL.toString() : (existing.alisTL || ''),
          satisTL: typeof existing.satisTL === 'number' ? existing.satisTL.toString() : (existing.satisTL || ''),
          karTL: typeof existing.karTL === 'number' ? existing.karTL.toString() : (existing.karTL || ''),
          aktif: existing.aktif !== false
        } : { vade, oran: '', alisTL: '', satisTL: '', karTL: '', aktif: false };
        
        return result;
      });
      
      setFormData({
        kisaAciklama: record.kisaAciklama || '',
        urun: record.urun || '',
        kartTipi: record.kartTipi,
        gelirModeliId: record.gelirModeli?.id || '',
        selectedEkGelirId: 'NONE',
        selectedKartProgramIds: record.kartProgramIds || record.bankIds || [],
        yurtIciDisi: record.yurtIciDisi,
        komisyonOranları: loadedKomisyonlar,
        kurulusOrani: record.paylaşımOranları?.kurulusOrani || '',
        oxivoOrani: record.paylaşımOranları?.oxivoOrani || '',
        aciklama: record.aciklama || '',
        fotograf: record.fotograf || '',
        hazineGeliri: record.hazineGeliri || { tutarTL: '', oxivoYuzde: '', kazancTL: '' },
      });
      setCurrentStep(0);
      console.log('✅ [FirmaTabelaTab] Edit modu: kayıt yüklendi');
    } else {
      resetForm();
      console.log('✅ [FirmaTabelaTab] Yeni kayıt modu: form sıfırlandı');
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
        if (!formData.urun) { toast.error('❌ Lütfen ürün seçiniz'); return; }
        if (!formData.gelirModeliId) { toast.error('❌ Lütfen gelir modeli seçiniz'); return; }
        if (!formData.kartTipi) { toast.error('❌ Lütfen kart tipi seçiniz'); return; }
        if (!formData.yurtIciDisi) { toast.error('❌ Lütfen Yurt İçi/Dışı seçiniz'); return; }
    }
    if (currentStep === 2) {
        const hasActiveVade = formData.komisyonOranları.some(k => k.aktif && k.oran);
        if (!hasActiveVade) { toast.error('❌ En az bir vade için komisyon oranı giriniz'); return; }
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => setCurrentStep(prev => prev - 1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            setFormData(prev => ({ ...prev, fotograf: reader.result as string }));
            toast.success('Fotoğraf yüklendi');
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    // ✅ Validate gelirModeli before saving
    const selectedGelirModeli = gelirModelleri.find(g => g.id === formData.gelirModeliId);
    if (!selectedGelirModeli) {
      toast.error('Lütfen bir gelir modeli seçin');
      return;
    }

    // ✅ DEBUG: editingRecord durumunu kontrol et
    console.log('🔍 [FirmaTabelaTab] handleSave çağrıldı:', {
      editingRecordExists: !!editingRecord,
      editingRecordId: editingRecord?.id,
      action: editingRecord ? 'UPDATE' : 'CREATE'
    });

    // ✅ CRITICAL: Generate UUID for new records ONLY - v3.2.0
    const generatedId = editingRecord?.id || crypto.randomUUID();
    
    const newRecord: TabelaRecord = {
      id: generatedId, // ✅ UUID GENERATION for Supabase compatibility
      firmaId,
      kisaAciklama: formData.kisaAciklama,
      urun: formData.urun,
      kartTipi: formData.kartTipi,
      gelirModeli: selectedGelirModeli,
      yurtIciDisi: formData.yurtIciDisi,
      komisyonOranları: formData.komisyonOranları,
      paylaşımOranları: {
        kurulusOrani: formData.kurulusOrani,
        oxivoOrani: formData.oxivoOrani,
      },
      aciklama: formData.aciklama,
      fotograf: formData.fotograf,
      hazineGeliri: formData.hazineGeliri,
      kartProgramIds: formData.selectedKartProgramIds,
      bankIds: formData.selectedKartProgramIds,
      aktif: editingRecord?.aktif !== undefined ? editingRecord.aktif : true,
      olusturmaTarihi: editingRecord?.olusturmaTarihi || new Date().toISOString(),
      guncellemeTarihi: new Date().toISOString(),
    };

    // ✅ Supabase'e kaydet
    try {
      console.log('🚀 [DEBUG] TABELA kaydı Supabase\'e GÖNDERİLİYOR:', {
        id: newRecord.id,
        firmaId: newRecord.firmaId,
        kisaAciklama: newRecord.kisaAciklama,
        gelirModeli: newRecord.gelirModeli
      });
      
      const result = await signApi.create(newRecord);
      
      if (result.success) {
        console.log(`✅ TABELA kaydı Supabase'e kaydedildi: ${newRecord.id}`);
        // ✅ Realtime listener otomatik olarak BankPF listesini güncelleyecek
      } else {
        console.error('❌ Supabase kayıt hatası:', result.error);
        toast.error(`Supabase hatası: ${result.error}`);
        return; // ✅ CRITICAL: Hata varsa devam etme!
      }
    } catch (error) {
      console.error('❌ TABELA kayıt hatası:', error);
      toast.error('Kayıt sırasında hata oluştu!');
      return; // ✅ CRITICAL: Hata varsa devam etme!
    }

    if (editingRecord) {
      const updatedRecords = tabelaRecords.map(r => r.id === editingRecord.id ? newRecord : r);
      onTabelaRecordsChange?.(updatedRecords);
      toast.success('TABELA kaydı güncellendi');
      console.log('🔄 [FirmaTabelaTab] Mevcut kayıt GÜNCELLENDİ:', editingRecord.id);
    } else {
      const updatedRecords = [...tabelaRecords, newRecord];
      onTabelaRecordsChange?.(updatedRecords);
      toast.success('TABELA kaydı oluşturuldu');
      console.log('✅ [FirmaTabelaTab] Yeni kayıt EKLENDİ:', newRecord.id);
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
    toast.success('TABELA kaydı silindi');
  };
  
  const handleToggleStatus = async (id: string) => {
    const record = tabelaRecords.find(r => r.id === id);
    if (!record) return;

    const updatedRecord = { ...record, aktif: !record.aktif, guncellemeTarihi: new Date().toISOString() };
    
    // ✅ Supabase'e kaydet
    try {
      const result = await signApi.create(updatedRecord);
      if (result.success) {
        console.log('✅ TABELA durum değişikliği Supabase\'e kaydedildi:', id);
      } else {
        console.warn('⚠️ Supabase güncelleme hatası:', result.error);
      }
    } catch (error) {
      console.error('❌ Supabase güncelleme hatası:', error);
    }

    const updatedRecords = tabelaRecords.map(r => r.id === id ? updatedRecord : r);
    onTabelaRecordsChange?.(updatedRecords);
    toast.success(record.aktif ? 'TABELA kaydı kapatıldı' : 'TABELA kaydı açıldı');
  };
  
  const handleCloseAgreement = () => {
    setClosingRecord(null);
  };

  // Komisyon hesaplama fonksiyonları
  const handleVadeAktifChange = (vade: string, aktif: boolean) => {
    setFormData(prev => ({
      ...prev,
      komisyonOranları: prev.komisyonOranları.map(k => 
        k.vade === vade ? { ...k, aktif } : k
      )
    }));
  };

  const handleKomisyonChange = (vade: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      komisyonOranları: prev.komisyonOranları.map(k => 
        k.vade === vade ? { ...k, oran: value } : k
      )
    }));
  };

  const handleAlisTLChange = (vade: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      komisyonOranları: prev.komisyonOranları.map(k => {
        if (k.vade === vade) {
          const alisTL = parseFloat(value) || 0;
          const satisTL = parseFloat(k.satisTL || '0') || 0;
          const karTL = (satisTL - alisTL).toFixed(2);
          return { ...k, alisTL: value, karTL };
        }
        return k;
      })
    }));
  };

  const handleSatisTLChange = (vade: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      komisyonOranları: prev.komisyonOranları.map(k => {
        if (k.vade === vade) {
          const alisTL = parseFloat(k.alisTL || '0') || 0;
          const satisTL = parseFloat(value) || 0;
          const karTL = (satisTL - alisTL).toFixed(2);
          return { ...k, satisTL: value, karTL };
        }
        return k;
      })
    }));
  };

  // Grup fonksiyonları
  const handleOpenGroupDialog = () => {
    setGroupFormData({
      selectedRecordsForGroup: [],
      groupName: '',
      groupStartDate: '',
      groupEndDate: '',
      groupAktif: true,
    });
    setEditingGroup(null);
    setShowGroupDialog(true);
  };

  const handleCreateGroup = () => {
    if (!groupFormData.groupName.trim()) {
      toast.error('Grup adı gereklidir');
      return;
    }
    if (!groupFormData.groupStartDate) {
      toast.error('Başlangıç tarihi gereklidir');
      return;
    }
    if (groupFormData.selectedRecordsForGroup.length === 0) {
      toast.error('En az bir kayıt seçmelisiniz');
      return;
    }

    const newGroup: TabelaGroup = {
      id: editingGroup?.id || crypto.randomUUID(), // ✅ UUID GENERATION for Supabase compatibility
      name: groupFormData.groupName.trim(),
      gecerlilikBaslangic: groupFormData.groupStartDate,
      gecerlilikBitis: groupFormData.groupEndDate || undefined,
      recordIds: groupFormData.selectedRecordsForGroup,
      pinned: editingGroup?.pinned || false,
      aktif: groupFormData.groupAktif,
    };

    if (editingGroup) {
      const updatedGroups = tabelaGroups.map(g => g.id === editingGroup.id ? newGroup : g);
      onTabelaGroupsChange?.(updatedGroups);
      toast.success('Grup güncellendi');
    } else {
      const updatedGroups = [...tabelaGroups, newGroup];
      onTabelaGroupsChange?.(updatedGroups);
      toast.success('Grup oluşturuldu');
    }

    setShowGroupDialog(false);
    setEditingGroup(null);
    setGroupFormData({
      selectedRecordsForGroup: [],
      groupName: '',
      groupStartDate: '',
      groupEndDate: '',
      groupAktif: true,
    });
  };

  const handleEditGroup = (group: TabelaGroup) => {
    setEditingGroup(group);
    setGroupFormData({
      selectedRecordsForGroup: group.recordIds || [],
      groupName: group.name,
      groupStartDate: group.gecerlilikBaslangic,
      groupEndDate: group.gecerlilikBitis || '',
      groupAktif: group.aktif !== undefined ? group.aktif : true,
    });
    setShowGroupDialog(true);
  };

  const handleDeleteGroup = (groupId: string) => {
    const updatedGroups = tabelaGroups.filter(g => g.id !== groupId);
    onTabelaGroupsChange?.(updatedGroups);
    toast.success('Grup silindi');
  };

  const handleToggleGroupPin = (groupId: string) => {
    const updatedGroups = tabelaGroups.map(g =>
      g.id === groupId ? { ...g, pinned: !g.pinned } : g
    );
    onTabelaGroupsChange?.(updatedGroups);
  };

  const handleToggleGroupAktif = (groupId: string) => {
    const updatedGroups = tabelaGroups.map(g =>
      g.id === groupId ? { ...g, aktif: !g.aktif } : g
    );
    onTabelaGroupsChange?.(updatedGroups);
    const group = tabelaGroups.find(g => g.id === groupId);
    if (group) {
      toast.success(group.aktif ? 'Grup kapatıldı' : 'Grup açıldı');
    }
  };

  const filteredRecords = tabelaRecords.filter(record => {
    if (showFilter === 'active') return record.aktif;
    if (showFilter === 'closed') return !record.aktif;
    return true;
  });

  const availableRecordsForGroup = tabelaRecords.filter(record => {
    if (!record.aktif) return false;
    if (editingGroup && editingGroup.recordIds?.includes(record.id)) {
      return true;
    }
    const recordGroup = getRecordGroup(record.id);
    return !recordGroup;
  });

  const activeCount = tabelaRecords.filter(r => r.aktif).length;
  const closedCount = tabelaRecords.filter(r => !r.aktif).length;

  const getGroupAbbreviation = (groupName: string): string => {
    const words = groupName.trim().split(/\s+/);
    return words[0] || '';
  };

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) newSet.delete(groupId);
      else newSet.add(groupId);
      return newSet;
    });
  };

  return (
    <div className="space-y-6" ref={scrollContainerRef}>
      {/* Header ve Butonlar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">
            TABELA Kayıtları - {firmaAdi}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {tabelaRecords.length} kayıt • {activeCount} aktif • {closedCount} kapalı
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleOpenGroupDialog}
            variant="outline"
            size="sm"
            disabled={groupFormData.selectedRecordsForGroup.length === 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            Grup Oluştur ({groupFormData.selectedRecordsForGroup.length})
          </Button>
          <Button onClick={() => handleOpenDialog()} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Yeni TABELA Kaydı
          </Button>
        </div>
      </div>

      {/* Grup Kartları Grid'i */}
      {tabelaGroups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tabelaGroups.map(group => {
            const groupRecordCount = group.recordIds?.length || 0;
            const activeRecordsInGroup = tabelaRecords.filter(r => 
              group.recordIds?.includes(r.id) && r.aktif
            ).length;

            return (
              <div
                key={group.id}
                className={`border rounded-lg p-4 ${
                  group.aktif ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                } ${group.pinned ? 'ring-2 ring-yellow-400' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-gray-900 flex items-center gap-2">
                      {group.pinned && <span>📌</span>}
                      {group.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {groupRecordCount} kayıt • {activeRecordsInGroup} aktif
                    </p>
                  </div>
                  <Badge variant={group.aktif ? 'default' : 'secondary'}>
                    {group.aktif ? 'Aktif' : 'Kapalı'}
                  </Badge>
                </div>
                <div className="text-xs text-gray-600 mb-3">
                  <div>Başlangıç: {new Date(group.gecerlilikBaslangic).toLocaleDateString('tr-TR')}</div>
                  {group.gecerlilikBitis && (
                    <div>Bitiş: {new Date(group.gecerlilikBitis).toLocaleDateString('tr-TR')}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEditGroup(group)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Düzenle
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleGroupPin(group.id)}
                    title={group.pinned ? 'Sabitlemeyi kaldır' : 'Sabitle'}
                  >
                    {group.pinned ? '📌' : '📍'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteGroup(group.id)}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filtre Butonları */}
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
        >
          Aktif ({activeCount})
        </Button>
        <Button
          size="sm"
          variant={showFilter === 'closed' ? 'default' : 'outline'}
          onClick={() => setShowFilter('closed')}
        >
          Kapalı ({closedCount})
        </Button>
      </div>

      {/* TABELA Kayıtları Listesi */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Henüz TABELA kaydı bulunmuyor</p>
          <Button onClick={() => handleOpenDialog()} size="sm" className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            İlk Kaydı Oluştur
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">Seç</TableHead>
                <TableHead className="w-16">KLM</TableHead>
                <TableHead>Ürün</TableHead>
                <TableHead>Gelir Modeli</TableHead>
                <TableHead>Kart Tipi</TableHead>
                <TableHead>Yurt İçi/Dışı</TableHead>
                <TableHead>Vade</TableHead>
                <TableHead className="text-right">Komisyon %</TableHead>
                <TableHead className="text-right">Alış TL</TableHead>
                <TableHead className="text-right">Satış TL</TableHead>
                <TableHead className="text-right">Kar TL</TableHead>
                <TableHead className="text-center">Durum</TableHead>
                <TableHead className="text-center w-32">İşlemler</TableHead>
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
                      onClick={() => toggleGroupCollapse(group.id)} 
                      className="bg-blue-100 hover:bg-blue-200 cursor-pointer border-b-2 border-blue-300"
                    >
                      <TableCell colSpan={13} className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isCollapsed ? (
                              <ChevronRight className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                            <span className="text-blue-900">
                              {group.pinned && '📌 '}
                              <strong>{group.name}</strong> ({groupRecords.length} kayıt)
                            </span>
                            <Badge variant={group.aktif ? 'default' : 'secondary'} className="ml-2">
                              {group.aktif ? 'Aktif' : 'Kapalı'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-blue-700">
                            <span>{new Date(group.gecerlilikBaslangic).toLocaleDateString('tr-TR')}</span>
                            {group.gecerlilikBitis && (
                              <>
                                <span>→</span>
                                <span>{new Date(group.gecerlilikBitis).toLocaleDateString('tr-TR')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {/* Grup Kayıtları */}
                    {!isCollapsed && group.aktif !== false && groupRecords.flatMap((record, indexInGroup) => {
                      const recordGroup = getRecordGroup(record.id);
                      const isGrouped = !!recordGroup;
                      const activeVadeler = record.komisyonOranları?.filter(ko => ko.aktif !== false) || [];
                      if (activeVadeler.length === 0) activeVadeler.push({ vade: '-', oran: '0', aktif: true });
                      
                      return activeVadeler.map((vadeInfo, vadeIndex) => {
                        const isFirstRow = vadeIndex === 0;
                        
                        return (
                          <TableRow key={`${record.id}-vade-${vadeIndex}`} className="hover:bg-gray-50 bg-blue-50/20">
                            {isFirstRow && (
                              <TableCell className="py-4" rowSpan={activeVadeler.length}>
                                <Checkbox
                                  checked={groupFormData.selectedRecordsForGroup.includes(record.id)}
                                  disabled={isGrouped}
                                  onCheckedChange={(checked) => {
                                    saveScrollPosition();
                                    if (checked) {
                                      setGroupFormData(prev => ({ ...prev, selectedRecordsForGroup: [...prev.selectedRecordsForGroup, record.id] }));
                                    } else {
                                      setGroupFormData(prev => ({ ...prev, selectedRecordsForGroup: prev.selectedRecordsForGroup.filter(id => id !== record.id) }));
                                    }
                                    restoreScrollPosition();
                                  }}
                                  title={isGrouped ? `Bu kayıt "${recordGroup?.name}" grubuna aittir` : ''}
                                />
                              </TableCell>
                            )}
                            {isFirstRow && (
                              <TableCell className="py-2" rowSpan={activeVadeler.length}>
                                <Badge variant="outline" className="text-xs">
                                  {kisaltUrunAdi(record.kisaAciklama || record.urun || '-')}
                                </Badge>
                              </TableCell>
                            )}
                            {isFirstRow && (
                              <TableCell className="py-2" rowSpan={activeVadeler.length}>
                                {record.urun || '-'}
                              </TableCell>
                            )}
                            {isFirstRow && (
                              <TableCell className="py-2" rowSpan={activeVadeler.length}>
                                <Badge variant="secondary">{record.gelirModeli?.ad || 'Gelir Modeli Yok'}</Badge>
                              </TableCell>
                            )}
                            {isFirstRow && (
                              <TableCell className="py-2" rowSpan={activeVadeler.length}>
                                {record.kartTipi}
                              </TableCell>
                            )}
                            {isFirstRow && (
                              <TableCell className="py-2" rowSpan={activeVadeler.length}>
                                {record.yurtIciDisi}
                              </TableCell>
                            )}
                            <TableCell className="py-2">
                              <Badge variant="outline">{vadeInfo.vade}</Badge>
                            </TableCell>
                            <TableCell className="py-2 text-right">{vadeInfo.oran || '-'}</TableCell>
                            <TableCell className="py-2 text-right">{vadeInfo.alisTL || '-'}</TableCell>
                            <TableCell className="py-2 text-right">{vadeInfo.satisTL || '-'}</TableCell>
                            <TableCell className="py-2 text-right">{vadeInfo.karTL || '-'}</TableCell>
                            {isFirstRow && (
                              <TableCell className="py-2 text-center" rowSpan={activeVadeler.length}>
                                <Badge variant={record.aktif ? 'default' : 'secondary'}>
                                  {record.aktif ? 'Açık' : 'Kapalı'}
                                </Badge>
                              </TableCell>
                            )}
                            {isFirstRow && (
                              <TableCell className="py-2 w-32" rowSpan={activeVadeler.length} onClick={(e) => e.stopPropagation()}>
                                <div className="flex flex-col gap-2">
                                  {record.aktif && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 px-3"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenDialog(record);
                                        }}
                                        title="Düzenle"
                                      >
                                        <Pencil className="h-3 w-3 mr-1" />
                                        Düzenle
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-red-50 text-red-700 hover:bg-red-100 h-8 px-3"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleStatus(record.id);
                                        }}
                                        title="Kapat"
                                      >
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Kapat
                                      </Button>
                                    </>
                                  )}
                                  {!record.aktif && (
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
                                      🔒 Kapalı
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-3"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
                                        handleDelete(record.id);
                                      }
                                    }}
                                    title="Sil"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      });
                    })}
                  </React.Fragment>
                );
              })}
              
              {/* Gruplanmamış Kayıtlar */}
              {(() => {
                const ungroupedRecords = filteredRecords.filter(r => !r.ekGelirDetay && !getRecordGroup(r.id));
                if (ungroupedRecords.length === 0) return null;
                const isCollapsed = collapsedGroups.has('UNGROUPED');
                
                return (
                  <React.Fragment key="ungrouped-section">
                    <TableRow 
                      onClick={() => toggleGroupCollapse('UNGROUPED')} 
                      className="bg-gray-100 hover:bg-gray-200 cursor-pointer border-b-2 border-gray-300"
                    >
                      <TableCell colSpan={13} className="py-3">
                        <div className="flex items-center gap-2">
                          {isCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          <span className="text-gray-700">
                            <strong>Gruplanmamış Kayıtlar</strong> ({ungroupedRecords.length} kayıt)
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {!isCollapsed && ungroupedRecords.flatMap((record, indexInUngrouped) => {
                      const recordGroup = getRecordGroup(record.id);
                      const isGrouped = !!recordGroup;
                      const activeVadeler = record.komisyonOranları?.filter(ko => ko.aktif !== false) || [];
                      if (activeVadeler.length === 0) activeVadeler.push({ vade: '-', oran: '0', aktif: true });
                      
                      return activeVadeler.map((vadeInfo, vadeIndex) => {
                        const isFirstRow = vadeIndex === 0;
                        
                        return (
                          <TableRow key={`${record.id}-vade-${vadeIndex}`} className="hover:bg-gray-50">
                            {isFirstRow && (
                              <TableCell className="py-4" rowSpan={activeVadeler.length}>
                                <Checkbox
                                  checked={groupFormData.selectedRecordsForGroup.includes(record.id)}
                                  disabled={isGrouped}
                                  onCheckedChange={(checked) => {
                                    saveScrollPosition();
                                    if (checked) {
                                      setGroupFormData(prev => ({ ...prev, selectedRecordsForGroup: [...prev.selectedRecordsForGroup, record.id] }));
                                    } else {
                                      setGroupFormData(prev => ({ ...prev, selectedRecordsForGroup: prev.selectedRecordsForGroup.filter(id => id !== record.id) }));
                                    }
                                    restoreScrollPosition();
                                  }}
                                  title={isGrouped ? `Bu kayıt "${recordGroup?.name}" grubuna aittir` : ''}
                                />
                              </TableCell>
                            )}
                            {isFirstRow && (
                              <TableCell className="py-2" rowSpan={activeVadeler.length}>
                                <Badge variant="outline" className="text-xs">
                                  {kisaltUrunAdi(record.kisaAciklama || record.urun || '-')}
                                </Badge>
                              </TableCell>
                            )}
                            {isFirstRow && (
                              <TableCell className="py-2" rowSpan={activeVadeler.length}>
                                {record.urun || '-'}
                              </TableCell>
                            )}
                            {isFirstRow && (
                              <TableCell className="py-2" rowSpan={activeVadeler.length}>
                                <Badge variant="secondary">{record.gelirModeli?.ad || 'Gelir Modeli Yok'}</Badge>
                              </TableCell>
                            )}
                            {isFirstRow && (
                              <TableCell className="py-2" rowSpan={activeVadeler.length}>
                                {record.kartTipi}
                              </TableCell>
                            )}
                            {isFirstRow && (
                              <TableCell className="py-2" rowSpan={activeVadeler.length}>
                                {record.yurtIciDisi}
                              </TableCell>
                            )}
                            <TableCell className="py-2">
                              <Badge variant="outline">{vadeInfo.vade}</Badge>
                            </TableCell>
                            <TableCell className="py-2 text-right">{vadeInfo.oran || '-'}</TableCell>
                            <TableCell className="py-2 text-right">{vadeInfo.alisTL || '-'}</TableCell>
                            <TableCell className="py-2 text-right">{vadeInfo.satisTL || '-'}</TableCell>
                            <TableCell className="py-2 text-right">{vadeInfo.karTL || '-'}</TableCell>
                            {isFirstRow && (
                              <TableCell className="py-2 text-center" rowSpan={activeVadeler.length}>
                                <Badge variant={record.aktif ? 'default' : 'secondary'}>
                                  {record.aktif ? 'Açık' : 'Kapalı'}
                                </Badge>
                              </TableCell>
                            )}
                            {isFirstRow && (
                              <TableCell className="py-2 w-32" rowSpan={activeVadeler.length}>
                                <div className="flex flex-col gap-2">
                                  {record.aktif && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 px-3"
                                        onClick={() => handleOpenDialog(record)}
                                        title="Düzenle"
                                      >
                                        <Pencil className="h-3 w-3 mr-1" />
                                        Düzenle
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-red-50 text-red-700 hover:bg-red-100 h-8 px-3"
                                        onClick={() => handleToggleStatus(record.id)}
                                        title="Kapat"
                                      >
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Kapat
                                      </Button>
                                    </>
                                  )}
                                  {!record.aktif && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="bg-orange-100 text-orange-700 hover:bg-orange-200 h-8 px-3"
                                      onClick={() => handleToggleStatus(record.id)}
                                      title="Kapalı - Aç"
                                    >
                                      🔒 Kapalı
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-3"
                                    onClick={() => {
                                      if (confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
                                        handleDelete(record.id);
                                      }
                                    }}
                                    title="Sil"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      });
                    })}
                  </React.Fragment>
                );
              })()}
            </TableBody>
          </Table>
        </div>
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
                  <TableHead>Kod No</TableHead>
                  <TableHead>Gelir Türü</TableHead>
                  <TableHead>Kullanım</TableHead>
                  <TableHead>Kart Tipi</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead className="text-right">PF %</TableHead>
                  <TableHead className="text-right">PF TL</TableHead>
                  <TableHead className="text-right">OX %</TableHead>
                  <TableHead className="text-right">OX TL</TableHead>
                  <TableHead className="text-center">Durum</TableHead>
                  <TableHead className="text-center w-32">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Gruplu Ek Gelir kayıtlarını render et */}
                {tabelaGroups.map((group) => {
                  const groupEkGelirRecords = filteredRecords.filter(r => r.ekGelirDetay && getRecordGroup(r.id)?.id === group.id);
                  if (groupEkGelirRecords.length === 0) return null;
                  const isCollapsed = collapsedGroups.has(group.id);
                  
                  return (
                    <React.Fragment key={`ekgelir-group-${group.id}`}>
                      <TableRow 
                        onClick={() => toggleGroupCollapse(group.id)} 
                        className="bg-purple-100 hover:bg-purple-200 cursor-pointer border-b-2 border-purple-300"
                      >
                        <TableCell colSpan={12} className="py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isCollapsed ? (
                                <ChevronRight className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                              <span className="text-purple-900">
                                {group.pinned && '📌 '}
                                <strong>{group.name}</strong> ({groupEkGelirRecords.length} ek gelir)
                              </span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {!isCollapsed && group.aktif !== false && groupEkGelirRecords.map((record, indexInGroup) => {
                        const recordGroup = getRecordGroup(record.id);
                        const ekGelir = record.ekGelirDetay!;
                        
                        return (
                          <TableRow key={record.id} className="hover:bg-gray-50 bg-purple-50/20">
                            <TableCell className="py-2">
                              <Badge variant="outline" className="text-xs">
                                {kisaltUrunAdi(record.kisaAciklama || record.urun || '-')}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2">{ekGelir.kodNo}</TableCell>
                            <TableCell className="py-2">{ekGelir.gelirTuru}</TableCell>
                            <TableCell className="py-2">{ekGelir.kullanim}</TableCell>
                            <TableCell className="py-2">{ekGelir.kartTipi}</TableCell>
                            <TableCell className="py-2 text-right">{ekGelir.tutar}</TableCell>
                            <TableCell className="py-2 text-right">{ekGelir.pfYuzde}</TableCell>
                            <TableCell className="py-2 text-right">{ekGelir.pfTL}</TableCell>
                            <TableCell className="py-2 text-right">{ekGelir.oxYuzde}</TableCell>
                            <TableCell className="py-2 text-right">{ekGelir.oxTL}</TableCell>
                            <TableCell className="py-2 text-center">
                              <Badge variant={record.aktif ? 'default' : 'secondary'}>
                                {record.aktif ? 'Açık' : 'Kapalı'}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="flex gap-1 justify-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2"
                                  onClick={() => handleOpenDialog(record)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 h-8 px-2"
                                  onClick={() => {
                                    if (confirm('Bu ek gelir kaydını silmek istediğinizden emin misiniz?')) {
                                      handleDelete(record.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
                
                {/* Gruplanmamış Ek Gelir Kayıtları */}
                {(() => {
                  const ungroupedEkGelirRecords = filteredRecords.filter(r => r.ekGelirDetay && !getRecordGroup(r.id));
                  if (ungroupedEkGelirRecords.length === 0) return null;
                  const isCollapsed = collapsedGroups.has('UNGROUPED-EKGELIR');
                  
                  return (
                    <React.Fragment key="ungrouped-ekgelir-section">
                      <TableRow 
                        onClick={() => toggleGroupCollapse('UNGROUPED-EKGELIR')} 
                        className="bg-gray-100 hover:bg-gray-200 cursor-pointer border-b-2 border-gray-300"
                      >
                        <TableCell colSpan={12} className="py-3">
                          <div className="flex items-center gap-2">
                            {isCollapsed ? (
                              <ChevronRight className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                            <span className="text-gray-700">
                              <strong>Gruplanmamış Ek Gelir Kayıtları</strong> ({ungroupedEkGelirRecords.length} kayıt)
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {!isCollapsed && ungroupedEkGelirRecords.map((record, indexInUngrouped) => {
                        const recordGroup = getRecordGroup(record.id);
                        const ekGelir = record.ekGelirDetay!;
                        
                        return (
                          <TableRow key={record.id} className="hover:bg-gray-50">
                            <TableCell className="py-2">
                              <Badge variant="outline" className="text-xs">
                                {kisaltUrunAdi(record.kisaAciklama || record.urun || '-')}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2">{ekGelir.kodNo}</TableCell>
                            <TableCell className="py-2">{ekGelir.gelirTuru}</TableCell>
                            <TableCell className="py-2">{ekGelir.kullanim}</TableCell>
                            <TableCell className="py-2">{ekGelir.kartTipi}</TableCell>
                            <TableCell className="py-2 text-right">{ekGelir.tutar}</TableCell>
                            <TableCell className="py-2 text-right">{ekGelir.pfYuzde}</TableCell>
                            <TableCell className="py-2 text-right">{ekGelir.pfTL}</TableCell>
                            <TableCell className="py-2 text-right">{ekGelir.oxYuzde}</TableCell>
                            <TableCell className="py-2 text-right">{ekGelir.oxTL}</TableCell>
                            <TableCell className="py-2 text-center">
                              <Badge variant={record.aktif ? 'default' : 'secondary'}>
                                {record.aktif ? 'Açık' : 'Kapalı'}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="flex gap-1 justify-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2"
                                  onClick={() => handleOpenDialog(record)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 h-8 px-2"
                                  onClick={() => {
                                    if (confirm('Bu ek gelir kaydını silmek istediğinizden emin misiniz?')) {
                                      handleDelete(record.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
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
              {firmaAdi} için TABELA kaydı {editingRecord ? 'düzenleniyor' : 'oluşturuluyor'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Kısa Açıklama */}
            <div className="space-y-2">
              <Label>
                Kısa Açıklama (Opsiyonel)
                <span className="text-xs text-gray-500 ml-2">(Maks. 15 karakter)</span>
              </Label>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  💡 Bu alan opsiyoneldir. TABELA kaydınız için kısa bir açıklama girebilirsiniz.
                </p>
              </div>
              <Input
                value={formData.kisaAciklama}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 15);
                  setFormData(prev => ({ ...prev, kisaAciklama: value }));
                }}
                placeholder="Örn: Visa Credit"
                maxLength={15}
              />
              <p className="text-xs text-gray-500">
                {formData.kisaAciklama.length}/15 karakter
              </p>
            </div>

            {/* Ürün Seçimi */}
            <div className="space-y-2">
              <Label>Ürün *</Label>
              <ModernFormSelect
                options={[
                  { value: 'UnattendedPOS', label: 'UnattendedPOS' },
                  { value: 'AttendedPOS', label: 'AttendedPOS' },
                  { value: 'SoftPOS', label: 'SoftPOS' },
                  { value: 'SanalPOS', label: 'SanalPOS' }
                ]}
                value={formData.urun}
                onChange={(value) => setFormData(prev => ({ ...prev, urun: value }))}
                placeholder="Ürün seçiniz"
              />
            </div>

            {/* Gelir Modeli */}
            <div className="space-y-2">
              <Label>Gelir Modeli *</Label>
              <ModernFormSelect
                options={aktifGelirModelleri.map(gm => ({
                  value: gm.id,
                  label: gm.ad
                }))}
                value={formData.gelirModeliId}
                onChange={(value) => setFormData(prev => ({ ...prev, gelirModeliId: value }))}
                placeholder="Gelir modeli seçiniz"
              />
            </div>

            {/* Kart Tipi */}
            <div className="space-y-2">
              <Label>Kart Tipi *</Label>
              <ModernFormSelect
                options={[
                  { value: 'Credit', label: 'Credit' },
                  { value: 'Debit', label: 'Debit' },
                  { value: 'Paçal', label: 'Paçal' }
                ]}
                value={formData.kartTipi}
                onChange={(value) => setFormData(prev => ({ ...prev, kartTipi: value }))}
                placeholder="Kart tipi seçiniz"
                disabled={isPacalGelirModeli}
              />
              {isPacalGelirModeli && (
                <p className="text-xs text-blue-600">
                  ℹ️ Paçal gelir modeli seçildiğinde kart tipi otomatik "Paçal" olarak ayarlanır
                </p>
              )}
            </div>

            {/* Yurt İçi/Dışı */}
            <div className="space-y-2">
              <Label>Yurt İçi/Dışı *</Label>
              <ModernFormSelect
                options={[
                  { value: 'Yurt İçi', label: 'Yurt İçi' },
                  { value: 'Yurt Dışı', label: 'Yurt Dışı' }
                ]}
                value={formData.yurtIciDisi}
                onChange={(value) => setFormData(prev => ({ ...prev, yurtIciDisi: value }))}
                placeholder="Seçiniz"
              />
            </div>

            {/* Komisyon Oranları */}
            <div className="space-y-2">
              <Label>Komisyon Oranları (%)</Label>
              <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
                {formData.komisyonOranları.map(ko => (
                  <div key={ko.vade} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-24">
                      <Checkbox
                        checked={ko.aktif}
                        onCheckedChange={(checked) => handleVadeAktifChange(ko.vade, checked as boolean)}
                      />
                      <Label className="text-sm">{ko.vade}</Label>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={ko.oran}
                      onChange={(e) => handleKomisyonChange(ko.vade, e.target.value)}
                      placeholder="Oran %"
                      disabled={!ko.aktif}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={ko.alisTL}
                      onChange={(e) => handleAlisTLChange(ko.vade, e.target.value)}
                      placeholder="Alış TL"
                      disabled={!ko.aktif}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={ko.satisTL}
                      onChange={(e) => handleSatisTLChange(ko.vade, e.target.value)}
                      placeholder="Satış TL"
                      disabled={!ko.aktif}
                      className="flex-1"
                    />
                    <Input
                      type="text"
                      value={ko.karTL}
                      placeholder="Kar TL"
                      disabled
                      className="flex-1 bg-gray-100"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Paylaşım Oranları */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kuruluş Oranı (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.kurulusOrani}
                  onChange={(e) => setFormData(prev => ({ ...prev, kurulusOrani: e.target.value }))}
                  placeholder="Kuruluş oranı"
                />
              </div>
              <div className="space-y-2">
                <Label>OXIVO Oranı (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.oxivoOrani}
                  onChange={(e) => setFormData(prev => ({ ...prev, oxivoOrani: e.target.value }))}
                  placeholder="OXIVO oranı"
                />
              </div>
            </div>

            {/* Açıklama */}
            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea
                value={formData.aciklama}
                onChange={(e) => setFormData(prev => ({ ...prev, aciklama: e.target.value }))}
                placeholder="Ek açıklama girebilirsiniz..."
                rows={3}
              />
            </div>

            {/* Fotoğraf */}
            <div className="space-y-2">
              <Label>Fotoğraf</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                {formData.fotograf && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, fotograf: '' }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {formData.fotograf && (
                <div className="mt-2 border rounded-lg p-2">
                  <img src={formData.fotograf} alt="Preview" className="max-h-32 rounded" />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              İptal
            </Button>
            <Button onClick={handleSave}>
              {editingRecord ? 'Güncelle' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TabelaGroupDialog */}
      <TabelaGroupDialog
        isOpen={showGroupDialog}
        onClose={() => setShowGroupDialog(false)}
        editingGroup={editingGroup}
        groupFormData={groupFormData}
        onGroupFormDataChange={(data) => setGroupFormData(prev => ({ ...prev, ...data }))}
        availableRecords={availableRecordsForGroup}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
}
