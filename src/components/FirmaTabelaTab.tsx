// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TABELA TAB - COMPLETELY REWRITTEN (v4.0 - CLEAN START)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { TabelaRecord, TabelaGroup } from './TabelaTab';
import { signApi } from '../utils/supabaseClient';

export interface FirmaTabelaTabProps {
  firmaId: string;
  firmaAdi: string;
  firmaTipi: 'Banka' | 'PF';
  odemeKurulusuTipi?: string;
  gelirModelleri: Array<{ id: string; ad: string; aktif: boolean }>;
  ekGelirler: Array<{ id: string; gelirTuru: string; aktif: boolean }>;
  banks: Array<{ id: string; kod: string; bankaAdi: string; aktif: boolean }>;
  kartProgramlar: Array<{ id: string; kartAdi: string; aktif: boolean }>;
  tabelaRecords: TabelaRecord[];
  tabelaGroups: TabelaGroup[];
  onTabelaRecordsChange: (records: TabelaRecord[]) => void;
  onTabelaGroupsChange: (groups: TabelaGroup[]) => void;
}

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
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DATA ENRICHMENT - Map Supabase data to display format
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const enrichedRecords = useMemo(() => {
    console.log('🔍 [FirmaTabelaTab] Enriching records:', {
      firmaId,
      firmaAdi,
      rawRecordsCount: tabelaRecords.length,
      gelirModelleriCount: gelirModelleri.length,
      rawRecords: tabelaRecords
    });
    
    return tabelaRecords.map(record => {
      // Find gelir modeli by ID
      const gelirModeli = gelirModelleri.find(g => g.id === record.gelirModeliId);
      
      // Find kart programlar
      const kartProgramlar_display = (record.kartProgramIds || [])
        .map(id => kartProgramlar.find(k => k.id === id))
        .filter(Boolean)
        .map(k => k!.kartAdi)
        .join(', ') || '-';
      
      const enriched = {
        ...record,
        gelirModeli: gelirModeli || { id: '', ad: 'Gelir Modeli Bulunamadı', aktif: false },
        kartProgramlar_display
      };
      
      console.log('✅ Enriched record:', {
        id: record.id,
        urun: record.urun,
        gelirModeliId: record.gelirModeliId,
        foundGelirModeli: gelirModeli?.ad,
        kartTipi: record.kartTipi,
        yurtIciDisi: record.yurtIciDisi
      });
      
      return enriched;
    });
  }, [tabelaRecords, gelirModelleri, kartProgramlar, firmaId, firmaAdi]);
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FILTERING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  const filteredRecords = useMemo(() => {
    return enrichedRecords.filter(record => {
      if (showFilter === 'active') return record.aktif;
      if (showFilter === 'closed') return !record.aktif;
      return true;
    });
  }, [enrichedRecords, showFilter]);
  
  const activeCount = enrichedRecords.filter(r => r.aktif).length;
  const closedCount = enrichedRecords.filter(r => !r.aktif).length;
  
  console.log('📊 [FirmaTabelaTab] Display stats:', {
    totalRecords: enrichedRecords.length,
    filteredRecords: filteredRecords.length,
    activeCount,
    closedCount,
    showFilter
  });
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EVENT HANDLERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
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
            Toplam {enrichedRecords.length} kayıt • {activeCount} aktif • {closedCount} kapalı
          </p>
        </div>
        <Button onClick={() => toast.info('Yeni kayıt ekleme özelliği yakında')}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni TABELA Kaydı
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={showFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setShowFilter('all')}
        >
          Tümü ({enrichedRecords.length})
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
            onClick={() => toast.info('Yeni kayıt ekleme özelliği yakında')} 
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
              {filteredRecords.map((record) => (
                <TableRow key={record.id} className={!record.aktif ? 'bg-gray-50 opacity-60' : ''}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{record.urun || '-'}</div>
                      {record.kisaAciklama && (
                        <div className="text-xs text-gray-500">{record.kisaAciklama}</div>
                      )}
                    </div>
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
                        onClick={() => toast.info('Düzenleme özelliği yakında')}
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
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
