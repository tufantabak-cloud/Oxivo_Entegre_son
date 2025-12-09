// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FIRMA TABELA TAB - FINAL VERSION (All Features Included)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import React, { useState, useMemo, useRef } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { ModernFormSelect } from './ModernFormSelect';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Switch } from './ui/switch';
import { Plus, Pencil, Trash2, AlertCircle, Upload, X, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { TabelaRecord, TabelaGroup } from './TabelaTab';
import { EkGelir } from './RevenueModelsTab';
import { signApi } from '../utils/supabaseClient';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const VADE_LISTESI = ['D+1', 'D+7', 'D+14', 'D+31'];
const URUN_LISTESI = ['UnattendedPOS', 'AttendedPOS', 'SoftPOS', 'SanalPOS'];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface FirmaTabelaTabProps {
  firmaId: string;
  firmaAdi: string;
  firmaTipi: 'Banka' | 'PF';
  odemeKurulusuTipi?: string;
  gelirModelleri: Array<{ id: string; ad: string; aktif: boolean }>;
  ekGelirler: EkGelir[];
  banks: Array<{ id: string; kod: string; bankaAdi: string; aktif: boolean }>;
  kartProgramlar: Array<{ id: string; kartAdi: string; aktif: boolean }>;
  tabelaRecords: TabelaRecord[];
  tabelaGroups: TabelaGroup[];
  onTabelaRecordsChange: (records: TabelaRecord[]) => void;
  onTabelaGroupsChange: (groups: TabelaGroup[]) => void;
}

interface TabelaFormData {
  kisaAciklama: string;
  urun: 'UnattendedPOS' | 'AttendedPOS' | 'SoftPOS' | 'SanalPOS' | '';
  kartTipi: 'Credit' | 'Debit' | 'Paçal' | '';
  gelirModeliId: string;
  yurtIciDisi: 'Yurt İçi' | 'Yurt Dışı' | '';
  kartProgramIds: string[];
  selectedEkGelirId: string;
  kurulusOrani: string;
  oxivoOrani: string;
  aciklama: string;
  fotograf: string;
  komisyonOranları: Array<{
    vade: string;
    oran: string;
    alisTL: string;
    satisTL: string;
    karTL: string;
    aktif: boolean;
  }>;
  hazineGeliri: {
    tutarTL: string;
    oxivoYuzde: string;
    kazancTL: string;
  };
}

interface GroupFormData {
  selectedRecordsForGroup: string[];
  groupName: string;
  groupStartDate: string;
  groupEndDate: string;
  groupAktif: boolean;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function FirmaTabelaTab({
  firmaId,
  firmaAdi,
  firmaTipi,
  odemeKurulusuTipi,
  gelirModelleri,
  ekGelirler,
  banks,
  kartProgramlar,
  tabelaRecords,
  tabelaGroups,
  onTabelaRecordsChange,
  onTabelaGroupsChange,
}: FirmaTabelaTabProps) {
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const [showFilter, setShowFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TabelaRecord | null>(null);
  const [editingGroup, setEditingGroup] = useState<TabelaGroup | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<TabelaFormData>({
    kisaAciklama: '',
    urun: '',
    kartTipi: '',
    gelirModeliId: '',
    yurtIciDisi: '',
    kartProgramIds: [],
    selectedEkGelirId: 'NONE',
    kurulusOrani: '',
    oxivoOrani: '',
    aciklama: '',
    fotograf: '',
    komisyonOranları: VADE_LISTESI.map(vade => ({
      vade,
      oran: '',
      alisTL: '',
      satisTL: '',
      karTL: '',
      aktif: true
    })),
    hazineGeliri: { tutarTL: '', oxivoYuzde: '', kazancTL: '' }
  });
  
  const [groupFormData, setGroupFormData] = useState<GroupFormData>({
    selectedRecordsForGroup: [],
    groupName: '',
    groupStartDate: '',
    groupEndDate: '',
    groupAktif: true
  });
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DATA ENRICHMENT - Map Supabase IDs to display objects
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const enrichedRecords = useMemo(() => {
    console.log('🔍 [FirmaTabelaTab] Enriching records:', {
      firmaId,
      firmaAdi,
      rawRecordsCount: tabelaRecords.length,
      gelirModelleriCount: gelirModelleri.length
    });
    
    return tabelaRecords.map(record => {
      // ✅ FIX: Map gelirModeliId (UUID) to gelirModeli object
      const gelirModeliId = (record as any).gelirModeliId || record.gelirModeli?.id;
      const gelirModeli = gelirModelleri.find(g => g.id === gelirModeliId);
      
      // Find kart programlar
      const kartProgramlar_display = (record.kartProgramIds || [])
        .map(id => kartProgramlar.find(k => k.id === id))
        .filter(Boolean)
        .map(k => k!.kartAdi)
        .join(', ') || '-';
      
      const enriched = {
        ...record,
        gelirModeliId: gelirModeliId || '',
        gelirModeli: gelirModeli || { id: '', ad: 'Gelir Modeli Bulunamadı', aktif: false },
        kartProgramlar_display
      };
      
      console.log('✅ Enriched record:', {
        id: record.id,
        urun: record.urun,
        gelirModeliId: gelirModeliId,
        foundGelirModeli: gelirModeli?.ad,
        kartTipi: record.kartTipi
      });
      
      return enriched;
    });
  }, [tabelaRecords, gelirModelleri, kartProgramlar, firmaId, firmaAdi]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FILTERING & GROUPING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const filteredRecords = useMemo(() => {
    return enrichedRecords.filter(record => {
      // Filter out Ek Gelir detail records from main list
      if (record.ekGelirDetay) return false;
      
      if (showFilter === 'active') return record.aktif;
      if (showFilter === 'closed') return !record.aktif;
      return true;
    });
  }, [enrichedRecords, showFilter]);
  
  const activeCount = enrichedRecords.filter(r => r.aktif && !r.ekGelirDetay).length;
  const closedCount = enrichedRecords.filter(r => !r.aktif && !r.ekGelirDetay).length;
  
  const getRecordGroup = (recordId: string): TabelaGroup | undefined => {
    return tabelaGroups.find(group => group.recordIds?.includes(recordId));
  };
  
  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };
  
  // Active data
  const activeGelirModelleri = gelirModelleri.filter(g => g.aktif);
  const activeEkGelirler = ekGelirler.filter(e => e.aktif);
  const activeKartProgramlar = kartProgramlar.filter(k => k.aktif);
  
  const selectedGelirModeli = gelirModelleri.find(g => g.id === formData.gelirModeliId);
  const isPacalGelirModeli = selectedGelirModeli?.ad?.toLowerCase().includes('paçal') || false;
  const isHazineGeliriSelected = formData.selectedEkGelirId !== 'NONE';
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EVENT HANDLERS - RECORD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const resetForm = () => {
    setFormData({
      kisaAciklama: '',
      urun: '',
      kartTipi: '',
      gelirModeliId: '',
      yurtIciDisi: '',
      kartProgramIds: [],
      selectedEkGelirId: 'NONE',
      kurulusOrani: '',
      oxivoOrani: '',
      aciklama: '',
      fotograf: '',
      komisyonOranları: VADE_LISTESI.map(vade => ({
        vade,
        oran: '',
        alisTL: '',
        satisTL: '',
        karTL: '',
        aktif: true
      })),
      hazineGeliri: { tutarTL: '', oxivoYuzde: '', kazancTL: '' }
    });
    setEditingRecord(null);
  };
  
  const handleOpenDialog = (record?: TabelaRecord) => {
    if (record) {
      // Edit mode
      const enrichedRecord = enrichedRecords.find(r => r.id === record.id);
      const gelirModeliId = enrichedRecord?.gelirModeliId || record.gelirModeli?.id || '';
      
      setEditingRecord(record);
      setFormData({
        kisaAciklama: record.kisaAciklama || '',
        urun: record.urun || '',
        kartTipi: record.kartTipi,
        gelirModeliId: gelirModeliId,
        yurtIciDisi: record.yurtIciDisi,
        kartProgramIds: record.kartProgramIds || [],
        selectedEkGelirId: 'NONE',
        kurulusOrani: record.paylaşımOranları?.kurulusOrani || '',
        oxivoOrani: record.paylaşımOranları?.oxivoOrani || '',
        aciklama: record.aciklama || '',
        fotograf: record.fotograf || '',
        komisyonOranları: VADE_LISTESI.map(vade => {
          const existing = record.komisyonOranları?.find(k => k.vade === vade);
          return {
            vade,
            oran: existing?.oran?.toString() || '',
            alisTL: existing?.alisTL?.toString() || '',
            satisTL: existing?.satisTL?.toString() || '',
            karTL: existing?.karTL?.toString() || '',
            aktif: existing?.aktif !== false
          };
        }),
        hazineGeliri: record.hazineGeliri || { tutarTL: '', oxivoYuzde: '', kazancTL: '' }
      });
    } else {
      // New record mode
      resetForm();
    }
    setShowDialog(true);
  };
  
  const handleCloseDialog = () => {
    setShowDialog(false);
    resetForm();
  };
  
  const handleSave = async () => {
    // Validation
    if (!formData.urun || !formData.kartTipi || !formData.gelirModeliId || !formData.yurtIciDisi) {
      toast.error('Lütfen tüm zorunlu alanları doldurun!');
      return;
    }
    
    const selectedGelirModeli = gelirModelleri.find(g => g.id === formData.gelirModeliId);
    
    const newRecord: TabelaRecord = {
      id: editingRecord?.id || `sign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      firmaId,
      kurulus: editingRecord?.kurulus || { tip: 'EPK', id: firmaId, ad: firmaAdi },
      urun: formData.urun,
      kartTipi: formData.kartTipi,
      gelirModeli: selectedGelirModeli || { id: formData.gelirModeliId, ad: 'Bilinmiyor' },
      gelirModeliId: formData.gelirModeliId,
      kartProgramIds: formData.kartProgramIds,
      yurtIciDisi: formData.yurtIciDisi,
      komisyonOranları: formData.komisyonOranları.map(k => ({
        vade: k.vade,
        oran: k.oran,
        alisTL: k.alisTL,
        satisTL: k.satisTL,
        karTL: k.karTL,
        aktif: k.aktif
      })),
      paylaşımOranları: {
        kurulusOrani: formData.kurulusOrani,
        oxivoOrani: formData.oxivoOrani
      },
      hazineGeliri: formData.hazineGeliri,
      kisaAciklama: formData.kisaAciklama,
      aciklama: formData.aciklama,
      fotograf: formData.fotograf,
      olusturmaTarihi: editingRecord?.olusturmaTarihi || new Date().toISOString(),
      guncellemeTarihi: new Date().toISOString(),
      aktif: editingRecord?.aktif !== false
    };
    
    try {
      console.log('🚀 [FirmaTabelaTab] Saving record to Supabase:', newRecord);
      const result = await signApi.create(newRecord);
      
      if (result.success) {
        console.log('✅ TABELA kaydı kaydedildi:', newRecord.id);
        
        if (editingRecord) {
          // Update existing
          const updatedRecords = tabelaRecords.map(r => r.id === newRecord.id ? newRecord : r);
          onTabelaRecordsChange(updatedRecords);
          toast.success('TABELA kaydı güncellendi');
        } else {
          // Add new
          onTabelaRecordsChange([...tabelaRecords, newRecord]);
          toast.success('TABELA kaydı oluşturuldu');
        }
        
        handleCloseDialog();
      } else {
        console.error('❌ Kayıt hatası:', result.error);
        toast.error('Kayıt hatası: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Kayıt hatası:', error);
      toast.error('Kayıt işlemi başarısız');
    }
  };
  
  const handleDelete = async (id: string) => {
    try {
      const result = await signApi.delete(id);
      if (result.success) {
        console.log('✅ TABELA kaydı silindi:', id);
        const updatedRecords = tabelaRecords.filter(r => r.id !== id);
        onTabelaRecordsChange(updatedRecords);
        toast.success('TABELA kaydı silindi');
      } else {
        console.error('❌ Silme hatası:', result.error);
        toast.error('Silme hatası: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Silme hatası:', error);
      toast.error('Silme işlemi başarısız');
    }
  };
  
  const handleToggleStatus = async (id: string) => {
    const record = tabelaRecords.find(r => r.id === id);
    if (!record) return;
    
    const updatedRecord = {
      ...record,
      aktif: !record.aktif,
      guncellemeTarihi: new Date().toISOString()
    };
    
    try {
      const result = await signApi.create(updatedRecord);
      if (result.success) {
        console.log('✅ Durum değiştirildi:', id);
        const updatedRecords = tabelaRecords.map(r => r.id === id ? updatedRecord : r);
        onTabelaRecordsChange(updatedRecords);
        toast.success(updatedRecord.aktif ? 'Kayıt aktif edildi' : 'Kayıt kapatıldı');
      } else {
        console.error('❌ Durum değiştirme hatası:', result.error);
        toast.error('Durum değiştirme hatası');
      }
    } catch (error) {
      console.error('❌ Durum değiştirme hatası:', error);
      toast.error('İşlem başarısız');
    }
  };
  
  const toggleKartProgram = (id: string) => {
    const current = formData.kartProgramIds;
    const updated = current.includes(id)
      ? current.filter(x => x !== id)
      : [...current, id];
    setFormData({ ...formData, kartProgramIds: updated });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, fotograf: reader.result as string });
    };
    reader.readAsDataURL(file);
  };
  
  const handleKomisyonChange = (vade: string, value: string) => {
    const updated = formData.komisyonOranları.map(k =>
      k.vade === vade ? { ...k, oran: value } : k
    );
    setFormData({ ...formData, komisyonOranları: updated });
  };
  
  const handleAlisTLChange = (vade: string, value: string) => {
    const updated = formData.komisyonOranları.map(k => {
      if (k.vade === vade) {
        const alisTL = parseFloat(value) || 0;
        const satisTL = parseFloat(k.satisTL) || 0;
        const karTL = satisTL - alisTL;
        return { ...k, alisTL: value, karTL: karTL.toFixed(2) };
      }
      return k;
    });
    setFormData({ ...formData, komisyonOranları: updated });
  };
  
  const handleSatisTLChange = (vade: string, value: string) => {
    const updated = formData.komisyonOranları.map(k => {
      if (k.vade === vade) {
        const alisTL = parseFloat(k.alisTL) || 0;
        const satisTL = parseFloat(value) || 0;
        const karTL = satisTL - alisTL;
        return { ...k, satisTL: value, karTL: karTL.toFixed(2) };
      }
      return k;
    });
    setFormData({ ...formData, komisyonOranları: updated });
  };
  
  const handleVadeAktifChange = (vade: string, aktif: boolean) => {
    const updated = formData.komisyonOranları.map(k =>
      k.vade === vade ? { ...k, aktif } : k
    );
    setFormData({ ...formData, komisyonOranları: updated });
  };
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EVENT HANDLERS - GROUP
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const handleOpenGroupDialog = (group?: TabelaGroup) => {
    if (group) {
      setEditingGroup(group);
      setGroupFormData({
        selectedRecordsForGroup: group.recordIds || [],
        groupName: group.name,
        groupStartDate: group.gecerlilikBaslangic,
        groupEndDate: group.gecerlilikBitis || '',
        groupAktif: group.aktif
      });
    } else {
      setEditingGroup(null);
      setGroupFormData({
        selectedRecordsForGroup: [],
        groupName: '',
        groupStartDate: '',
        groupEndDate: '',
        groupAktif: true
      });
    }
    setShowGroupDialog(true);
  };
  
  const handleCloseGroupDialog = () => {
    setShowGroupDialog(false);
    setEditingGroup(null);
  };
  
  const handleCreateGroup = () => {
    if (!groupFormData.groupName || !groupFormData.groupStartDate || groupFormData.selectedRecordsForGroup.length === 0) {
      toast.error('Lütfen grup adı, geçerlilik başlangıcı ve en az 1 kayıt seçin!');
      return;
    }
    
    const newGroup: TabelaGroup = {
      id: editingGroup?.id || `group_${Date.now()}`,
      name: groupFormData.groupName,
      gecerlilikBaslangic: groupFormData.groupStartDate,
      gecerlilikBitis: groupFormData.groupEndDate,
      recordIds: groupFormData.selectedRecordsForGroup,
      pinned: editingGroup?.pinned || false,
      aktif: groupFormData.groupAktif
    };
    
    if (editingGroup) {
      const updated = tabelaGroups.map(g => g.id === newGroup.id ? newGroup : g);
      onTabelaGroupsChange(updated);
      toast.success('Grup güncellendi');
    } else {
      onTabelaGroupsChange([...tabelaGroups, newGroup]);
      toast.success('Grup oluşturuldu');
    }
    
    handleCloseGroupDialog();
  };
  
  const handleDeleteGroup = (groupId: string) => {
    const updated = tabelaGroups.filter(g => g.id !== groupId);
    onTabelaGroupsChange(updated);
    toast.success('Grup silindi');
  };
  
  const handleToggleGroupAktif = (groupId: string) => {
    const updated = tabelaGroups.map(g =>
      g.id === groupId ? { ...g, aktif: !g.aktif } : g
    );
    onTabelaGroupsChange(updated);
  };
  
  const availableRecordsForGroup = filteredRecords.filter(record => {
    if (!record.aktif) return false;
    if (editingGroup && editingGroup.recordIds?.includes(record.id)) return true;
    const recordGroup = getRecordGroup(record.id);
    return !recordGroup;
  });
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg">
            {firmaAdi} - TABELA Kayıtları
          </h3>
          <p className="text-sm text-gray-600">
            Toplam {enrichedRecords.filter(r => !r.ekGelirDetay).length} kayıt • {activeCount} aktif • {closedCount} kapalı
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenGroupDialog()} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Grup
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni TABELA Kaydı
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={showFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setShowFilter('all')}
        >
          Tümü ({enrichedRecords.filter(r => !r.ekGelirDetay).length})
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
      
      {/* Records Table */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {showFilter === 'all' 
              ? 'Henüz TABELA kaydı bulunmuyor' 
              : `Henüz ${showFilter === 'active' ? 'aktif' : 'kapalı'} TABELA kaydı bulunmuyor`
            }
          </p>
          <Button 
            onClick={() => handleOpenDialog()} 
            size="sm" 
            className="mt-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            İlk Kaydı Oluştur
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">KLM</TableHead>
                <TableHead>Ürün</TableHead>
                <TableHead>Gelir Modeli</TableHead>
                <TableHead>Kart Tipi</TableHead>
                <TableHead>Yurt İçi/Dışı</TableHead>
                <TableHead>Kart Programlar</TableHead>
                <TableHead>Paylaşım</TableHead>
                <TableHead className="text-center">Durum</TableHead>
                <TableHead className="text-center w-32">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Gruplu Kayıtlar */}
              {tabelaGroups.map((group) => {
                const groupRecords = filteredRecords.filter(r => getRecordGroup(r.id)?.id === group.id);
                if (groupRecords.length === 0) return null;
                
                const isCollapsed = collapsedGroups.has(group.id);
                
                return (
                  <React.Fragment key={`group-${group.id}`}>
                    {/* Grup Başlığı */}
                    <TableRow 
                      onClick={() => toggleGroupCollapse(group.id)} 
                      className="bg-blue-100 hover:bg-blue-200 cursor-pointer border-b-2 border-blue-300"
                    >
                      <TableCell colSpan={9} className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            <span className="text-blue-800">
                              <strong>{group.name}</strong> ({groupRecords.length} kayıt)
                            </span>
                            <Badge variant={group.aktif ? 'default' : 'secondary'}>
                              {group.aktif ? 'Aktif' : 'Pasif'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenGroupDialog(group);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Grubu silmek istediğinizden emin misiniz?')) {
                                  handleDeleteGroup(group.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {/* Grup Kayıtları */}
                    {!isCollapsed && groupRecords.map((record) => (
                      <TableRow key={record.id} className={!record.aktif ? 'bg-gray-50 opacity-60' : ''}>
                        <TableCell>
                          {record.kisaAciklama && (
                            <Badge variant="outline" className="text-xs">{record.kisaAciklama}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{record.urun || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                            {record.gelirModeli.ad}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{record.kartTipi}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={record.yurtIciDisi === 'Yurt İçi' ? 'default' : 'secondary'}>
                            {record.yurtIciDisi}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{record.kartProgramlar_display}</div>
                        </TableCell>
                        <TableCell>
                          {record.paylaşımOranları ? (
                            <div className="text-sm">
                              {record.paylaşımOranları.kurulusOrani}% / {record.paylaşımOranları.oxivoOrani}%
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant={record.aktif ? 'default' : 'outline'}
                            onClick={() => handleToggleStatus(record.id)}
                          >
                            {record.aktif ? 'Aktif' : 'Kapalı'}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenDialog(record)}
                              title="Düzenle"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })}
              
              {/* Gruplanmamış Kayıtlar */}
              {(() => {
                const ungroupedRecords = filteredRecords.filter(r => !getRecordGroup(r.id));
                if (ungroupedRecords.length === 0) return null;
                
                const isCollapsed = collapsedGroups.has('UNGROUPED');
                
                return (
                  <React.Fragment key="ungrouped-section">
                    <TableRow 
                      onClick={() => toggleGroupCollapse('UNGROUPED')} 
                      className="bg-gray-100 hover:bg-gray-200 cursor-pointer border-b-2 border-gray-300"
                    >
                      <TableCell colSpan={9} className="py-3">
                        <div className="flex items-center gap-2">
                          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          <span className="text-gray-700">
                            <strong>Gruplanmamış Kayıtlar</strong> ({ungroupedRecords.length} kayıt)
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {!isCollapsed && ungroupedRecords.map((record) => (
                      <TableRow key={record.id} className={!record.aktif ? 'bg-gray-50 opacity-60' : ''}>
                        <TableCell>
                          {record.kisaAciklama && (
                            <Badge variant="outline" className="text-xs">{record.kisaAciklama}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{record.urun || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                            {record.gelirModeli.ad}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{record.kartTipi}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={record.yurtIciDisi === 'Yurt İçi' ? 'default' : 'secondary'}>
                            {record.yurtIciDisi}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{record.kartProgramlar_display}</div>
                        </TableCell>
                        <TableCell>
                          {record.paylaşımOranları ? (
                            <div className="text-sm">
                              {record.paylaşımOranları.kurulusOrani}% / {record.paylaşımOranları.oxivoOrani}%
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant={record.aktif ? 'default' : 'outline'}
                            onClick={() => handleToggleStatus(record.id)}
                          >
                            {record.aktif ? 'Aktif' : 'Kapalı'}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenDialog(record)}
                              title="Düzenle"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })()}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? 'TABELA Kaydı Düzenle' : 'Yeni TABELA Kaydı'}
            </DialogTitle>
            <DialogDescription>
              {firmaAdi} için TABELA kaydı {editingRecord ? 'düzenleyin' : 'oluşturun'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Temel Bilgiler */}
            <div className="space-y-4">
              <h4 className="font-medium">Temel Bilgiler</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kısa Açıklama (max 15 karakter)</Label>
                  <Input
                    value={formData.kisaAciklama}
                    onChange={(e) => setFormData({ ...formData, kisaAciklama: e.target.value.slice(0, 15) })}
                    placeholder="Örn: 2024-Q1"
                    maxLength={15}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Ürün *</Label>
                  <ModernFormSelect
                    value={formData.urun}
                    onValueChange={(value) => setFormData({ ...formData, urun: value as any })}
                    options={URUN_LISTESI.map(u => ({ value: u, label: u }))}
                    placeholder="Ürün seçin"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Kart Tipi *</Label>
                  <ModernFormSelect
                    value={formData.kartTipi}
                    onValueChange={(value) => setFormData({ ...formData, kartTipi: value as any })}
                    options={[
                      { value: 'Credit', label: 'Credit' },
                      { value: 'Debit', label: 'Debit' },
                      { value: 'Paçal', label: 'Paçal' }
                    ]}
                    placeholder="Kart tipi seçin"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Gelir Modeli *</Label>
                  <ModernFormSelect
                    value={formData.gelirModeliId}
                    onValueChange={(value) => setFormData({ ...formData, gelirModeliId: value })}
                    options={activeGelirModelleri.map(g => ({ value: g.id, label: g.ad }))}
                    placeholder="Gelir modeli seçin"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Yurt İçi/Dışı *</Label>
                  <ModernFormSelect
                    value={formData.yurtIciDisi}
                    onValueChange={(value) => setFormData({ ...formData, yurtIciDisi: value as any })}
                    options={[
                      { value: 'Yurt İçi', label: 'Yurt İçi' },
                      { value: 'Yurt Dışı', label: 'Yurt Dışı' }
                    ]}
                    placeholder="Seçin"
                  />
                </div>
              </div>
            </div>
            
            {/* Kart Programları */}
            <div className="space-y-2">
              <Label>Kart Programları</Label>
              <div className="grid grid-cols-3 gap-2 p-4 border rounded-lg max-h-40 overflow-y-auto">
                {activeKartProgramlar.map(kp => (
                  <div key={kp.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.kartProgramIds.includes(kp.id)}
                      onCheckedChange={() => toggleKartProgram(kp.id)}
                      id={`kp-${kp.id}`}
                    />
                    <label htmlFor={`kp-${kp.id}`} className="text-sm cursor-pointer">
                      {kp.kartAdi}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Paylaşım Oranları */}
            <div className="space-y-4">
              <h4 className="font-medium">Paylaşım Oranları</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kuruluş Oranı (%)</Label>
                  <Input
                    type="number"
                    value={formData.kurulusOrani}
                    onChange={(e) => setFormData({ ...formData, kurulusOrani: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Oxivo Oranı (%)</Label>
                  <Input
                    type="number"
                    value={formData.oxivoOrani}
                    onChange={(e) => setFormData({ ...formData, oxivoOrani: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            
            {/* Komisyon Oranları */}
            <div className="space-y-4">
              <h4 className="font-medium">Komisyon Oranları (Vade Bazlı)</h4>
              {isPacalGelirModeli ? (
                <div className="space-y-2">
                  {formData.komisyonOranları.map((k) => (
                    <div key={k.vade} className="grid grid-cols-5 gap-2 items-center">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={k.aktif}
                          onCheckedChange={(checked) => handleVadeAktifChange(k.vade, checked as boolean)}
                        />
                        <span className="text-sm font-medium">{k.vade}</span>
                      </div>
                      <div>
                        <Input
                          type="number"
                          value={k.alisTL}
                          onChange={(e) => handleAlisTLChange(k.vade, e.target.value)}
                          placeholder="Alış TL"
                          disabled={!k.aktif}
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          value={k.satisTL}
                          onChange={(e) => handleSatisTLChange(k.vade, e.target.value)}
                          placeholder="Satış TL"
                          disabled={!k.aktif}
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          value={k.karTL}
                          placeholder="Kar TL"
                          disabled
                          className="bg-gray-100"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {formData.komisyonOranları.map((k) => (
                    <div key={k.vade} className="flex items-center gap-2">
                      <span className="text-sm w-12">{k.vade}:</span>
                      <Input
                        type="number"
                        value={k.oran}
                        onChange={(e) => handleKomisyonChange(k.vade, e.target.value)}
                        placeholder="%"
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Ek Gelir (Hazine Geliri) */}
            <div className="space-y-4">
              <h4 className="font-medium">Ek Gelir (Opsiyonel)</h4>
              <div className="space-y-2">
                <Label>Ek Gelir Türü</Label>
                <ModernFormSelect
                  value={formData.selectedEkGelirId}
                  onValueChange={(value) => setFormData({ ...formData, selectedEkGelirId: value })}
                  options={[
                    { value: 'NONE', label: 'Seçilmedi' },
                    ...activeEkGelirler.map(e => ({ value: e.id, label: e.gelirTuru }))
                  ]}
                  placeholder="Ek gelir seçin"
                />
              </div>
              
              {isHazineGeliriSelected && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                  <div className="space-y-2">
                    <Label>Tutar (TL)</Label>
                    <Input
                      type="number"
                      value={formData.hazineGeliri.tutarTL}
                      onChange={(e) => setFormData({
                        ...formData,
                        hazineGeliri: { ...formData.hazineGeliri, tutarTL: e.target.value }
                      })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Oxivo Yüzde (%)</Label>
                    <Input
                      type="number"
                      value={formData.hazineGeliri.oxivoYuzde}
                      onChange={(e) => setFormData({
                        ...formData,
                        hazineGeliri: { ...formData.hazineGeliri, oxivoYuzde: e.target.value }
                      })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kazanç (TL)</Label>
                    <Input
                      type="number"
                      value={formData.hazineGeliri.kazancTL}
                      onChange={(e) => setFormData({
                        ...formData,
                        hazineGeliri: { ...formData.hazineGeliri, kazancTL: e.target.value }
                      })}
                      placeholder="0"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Açıklama ve Fotoğraf */}
            <div className="space-y-4">
              <h4 className="font-medium">Ek Bilgiler</h4>
              
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={formData.aciklama}
                  onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                  placeholder="Detaylı açıklama yazın..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Fotoğraf</Label>
                <div className="flex items-center gap-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Fotoğraf Yükle
                  </Button>
                  {formData.fotograf && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, fotograf: '' })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {formData.fotograf && (
                  <img 
                    src={formData.fotograf} 
                    alt="Preview" 
                    className="mt-2 max-w-xs rounded-lg border"
                  />
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              İptal
            </Button>
            <Button onClick={handleSave}>
              {editingRecord ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Group Dialog */}
      <Dialog open={showGroupDialog} onOpenChange={handleCloseGroupDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Grup Düzenle' : 'Yeni Grup Oluştur'}</DialogTitle>
            <DialogDescription>
              TABELA kayıtlarını gruplandırarak yönetebilirsiniz
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Grup İsmi *</Label>
              <Input
                value={groupFormData.groupName}
                onChange={(e) => setGroupFormData({ ...groupFormData, groupName: e.target.value })}
                placeholder="Örn: 2024 Q1 Kampanyası"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Geçerlilik Başlangıcı *</Label>
                <Input
                  type="date"
                  value={groupFormData.groupStartDate}
                  onChange={(e) => setGroupFormData({ ...groupFormData, groupStartDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Geçerlilik Bitişi</Label>
                <Input
                  type="date"
                  value={groupFormData.groupEndDate}
                  onChange={(e) => setGroupFormData({ ...groupFormData, groupEndDate: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div>
                <Label>Grup Durumu</Label>
                <p className="text-sm text-gray-600">
                  {groupFormData.groupAktif ? 'Grup hakediş için aktif' : 'Grup hakediş için pasif'}
                </p>
              </div>
              <Switch
                checked={groupFormData.groupAktif}
                onCheckedChange={(checked) => setGroupFormData({ ...groupFormData, groupAktif: checked })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Kayıtları Seç *</Label>
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                {availableRecordsForGroup.length === 0 ? (
                  <p className="text-sm text-gray-500">Gruplanabilir aktif kayıt bulunamadı</p>
                ) : (
                  availableRecordsForGroup.map(record => (
                    <div key={record.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        checked={groupFormData.selectedRecordsForGroup.includes(record.id)}
                        onCheckedChange={() => {
                          const current = groupFormData.selectedRecordsForGroup;
                          const updated = current.includes(record.id)
                            ? current.filter(id => id !== record.id)
                            : [...current, record.id];
                          setGroupFormData({ ...groupFormData, selectedRecordsForGroup: updated });
                        }}
                      />
                      <div className="flex-1 flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                          {record.urun}
                        </Badge>
                        <span>{record.gelirModeli.ad}</span>
                        <Badge variant={record.yurtIciDisi === 'Yurt İçi' ? 'default' : 'secondary'}>
                          {record.yurtIciDisi}
                        </Badge>
                        <Badge variant="outline">
                          {record.kartTipi}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseGroupDialog}>
              İptal
            </Button>
            <Button onClick={handleCreateGroup}>
              {editingGroup ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
