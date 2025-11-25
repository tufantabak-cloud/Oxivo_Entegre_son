import React, { useState, useMemo, useCallback } from 'react';
import { MCC } from './DefinitionsModule';
import { Plus, Edit, Trash2, X, Check, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { mccCodesApi } from '../utils/supabaseClient';

interface MCCTabProps {
  mccList: MCC[];
  onMCCListChange: (list: MCC[]) => void;
}

// ⚡ MEMORY OPTIMIZATION: React.memo prevents re-renders when props haven't changed
export const MCCTab = React.memo(function MCCTab({ mccList, onMCCListChange }: MCCTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMCC, setEditingMCC] = useState<MCC | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mccToDelete, setMCCToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<MCC>({
    id: '',
    kod: '',
    kategori: '',
    aciklama: '',
    aktif: true,
    olusturmaTarihi: '',
  });

  // ⚡ PERFORMANCE: useCallback prevents function recreation on every render
  const handleAdd = useCallback(() => {
    setEditingMCC(null);
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      id: '',
      kod: '',
      kategori: '',
      aciklama: '',
      aktif: true,
      olusturmaTarihi: today,
    });
    setIsDialogOpen(true);
  }, []);

  const handleEdit = useCallback((mcc: MCC) => {
    setEditingMCC(mcc);
    setFormData(mcc);
    setIsDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    setMCCToDelete(id);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (mccToDelete) {
      // ✅ Delete from Supabase
      const result = await mccCodesApi.delete(mccToDelete);
      
      if (result.success) {
        // ✅ Update local state
        onMCCListChange(mccList.filter((m) => m.id !== mccToDelete));
        console.log(`✅ MCC ${mccToDelete} deleted successfully`);
      } else {
        console.error(`❌ Failed to delete MCC:`, result.error);
        alert(`Silme işlemi başarısız: ${result.error}`);
      }
      
      setMCCToDelete(null);
      setDeleteConfirmOpen(false);
    }
  }, [mccToDelete, mccList, onMCCListChange]);

  const handleSave = useCallback(() => {
    if (editingMCC) {
      // Update existing
      onMCCListChange(
        mccList.map((m) => (m.id === editingMCC.id ? formData : m))
      );
    } else {
      // Add new
      onMCCListChange([
        ...mccList,
        { ...formData, id: Date.now().toString() },
      ]);
    }
    setIsDialogOpen(false);
  }, [editingMCC, formData, mccList, onMCCListChange]);

  const toggleActive = useCallback((id: string) => {
    onMCCListChange(
      mccList.map((m) => (m.id === id ? { ...m, aktif: !m.aktif } : m))
    );
  }, [mccList, onMCCListChange]);

  // ⚡ PERFORMANCE: useMemo caches filtered list (no recalculation on every render)
  const filteredMCCList = useMemo(() => {
    if (!searchTerm.trim()) return mccList;
    
    const lowerSearch = searchTerm.toLowerCase();
    return mccList.filter(
      (mcc) =>
        mcc.kod?.toLowerCase().includes(lowerSearch) ||
        mcc.kategori?.toLowerCase().includes(lowerSearch) ||
        mcc.aciklama?.toLowerCase().includes(lowerSearch)
    );
  }, [mccList, searchTerm]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>MCC (Merchant Category Code) Tanımları</CardTitle>
          <Button onClick={handleAdd} className="flex items-center space-x-2">
            <Plus size={18} />
            <span>Yeni MCC Ekle</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <Input
            id="mcc-search"
            type="text"
            placeholder="MCC ara (kod, kategori, açıklama)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MCC Kodu</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Oluşturma Tarihi</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMCCList.length === 0 ? (
                <TableRow key="empty-row">
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    {searchTerm ? 'MCC bulunamadı' : 'Henüz MCC tanımlanmamış'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMCCList.map((mcc) => (
                  <TableRow key={mcc.id}>
                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded font-medium">
                        {mcc.kod}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{mcc.kategori}</span>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {mcc.aciklama || '-'}
                    </TableCell>
                    <TableCell>{formatDate(mcc.olusturmaTarihi)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={mcc.aktif}
                          onCheckedChange={() => toggleActive(mcc.id)}
                        />
                        <Badge
                          variant={mcc.aktif ? 'default' : 'secondary'}
                        >
                          {mcc.aktif ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(mcc)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(mcc.id)}
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-600">
            Toplam <strong>{filteredMCCList.length}</strong> MCC tanımı
          </span>
          <MCCStats filteredList={filteredMCCList} />
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingMCC ? 'MCC Düzenle' : 'Yeni MCC Ekle'}
              </DialogTitle>
              <DialogDescription>
                MCC (Merchant Category Code) tanımını girin.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kod">MCC Kodu *</Label>
                  <Input
                    id="kod"
                    value={formData.kod || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, kod: e.target.value })
                    }
                    placeholder="Örn: 5411"
                    maxLength={4}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kategori">Kategori *</Label>
                  <Input
                    id="kategori"
                    value={formData.kategori || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, kategori: e.target.value })
                    }
                    placeholder="Örn: Perakende"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aciklama">Açıklama</Label>
                <Textarea
                  id="aciklama"
                  value={formData.aciklama || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, aciklama: e.target.value })
                  }
                  placeholder="MCC kodu hakkında detaylı açıklama"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="aktif"
                  checked={formData.aktif}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, aktif: checked })
                  }
                />
                <Label htmlFor="aktif" className="cursor-pointer">
                  Bu MCC aktif olsun
                </Label>
              </div>

              {editingMCC && (
                <div className="text-sm text-gray-500">
                  Oluşturma Tarihi: {formatDate(formData.olusturmaTarihi)}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X size={18} className="mr-2" />
                İptal
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!formData.kod.trim() || !formData.kategori.trim()}
              >
                <Check size={18} className="mr-2" />
                {editingMCC ? 'Güncelle' : 'Ekle'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>MCC Sil</AlertDialogTitle>
              <AlertDialogDescription>
                Bu MCC tanımını silmek istediğinizden emin misiniz? Bu işlem geri
                alınamaz ve bu MCC'yi kullanan kayıtlar etkilenebilir.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700"
              >
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
});

// ⚡ MEMORY OPTIMIZATION: Separate stats component with React.memo
const MCCStats = React.memo(({ filteredList }: { filteredList: MCC[] }) => {
  const stats = useMemo(() => ({
    aktif: filteredList.filter((m) => m.aktif).length,
    pasif: filteredList.filter((m) => !m.aktif).length,
  }), [filteredList]);

  return (
    <div className="flex items-center space-x-4 text-sm text-gray-600">
      <span>
        Aktif: <strong>{stats.aktif}</strong>
      </span>
      <span>
        Pasif: <strong>{stats.pasif}</strong>
      </span>
    </div>
  );
});