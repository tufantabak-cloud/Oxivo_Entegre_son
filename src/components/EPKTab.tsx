import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';

export interface EPK {
  id: string;
  kod: string;
  kurumAdi: string;
  aciklama: string;
  aktif: boolean;
  olusturmaTarihi: string;
}

interface EPKTabProps {
  epkList: EPK[];
  onEPKListChange: (list: EPK[]) => void;
}

// ⚡ MEMORY OPTIMIZATION: React.memo prevents re-renders when props haven't changed
export const EPKTab = React.memo(function EPKTab({ epkList, onEPKListChange }: EPKTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingEPK, setEditingEPK] = useState<EPK | null>(null);
  const [deletingEPK, setDeletingEPK] = useState<EPK | null>(null);
  const [formData, setFormData] = useState<Partial<EPK>>({
    kod: '',
    kurumAdi: '',
    aciklama: '',
    aktif: true,
  });

  // ⚡ PERFORMANCE: useMemo caches filtered list
  const filteredEPK = useMemo(() => {
    if (!searchTerm.trim()) return epkList;
    
    const lowerSearch = searchTerm.toLowerCase();
    return epkList.filter(
      (epk) =>
        epk.kurumAdi?.toLowerCase().includes(lowerSearch) ||
        epk.kod?.toLowerCase().includes(lowerSearch)
    );
  }, [epkList, searchTerm]);

  // ⚡ PERFORMANCE: useCallback prevents function recreation
  const handleOpenDialog = useCallback((epk?: EPK) => {
    if (epk) {
      setEditingEPK(epk);
      setFormData(epk);
    } else {
      setEditingEPK(null);
      setFormData({
        kod: '',
        kurumAdi: '',
        aciklama: '',
        aktif: true,
      });
    }
    setIsDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.kod || !formData.kurumAdi) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    // Duplicate kontrolü
    const isDuplicate = epkList.some(
      (epk) =>
        epk.id !== editingEPK?.id &&
        (epk.kod?.toLowerCase() === formData.kod?.toLowerCase() ||
          epk.kurumAdi?.toLowerCase() === formData.kurumAdi?.toLowerCase())
    );

    if (isDuplicate) {
      toast.error('Bu EPK kodu veya adı zaten kayıtlı!');
      return;
    }

    if (editingEPK) {
      // Güncelleme
      const updatedList = epkList.map((epk) =>
        epk.id === editingEPK.id ? { ...epk, ...formData } : epk
      );
      onEPKListChange(updatedList);
      toast.success('EPK başarıyla güncellendi');
    } else {
      // Yeni ekleme
      const newEPK: EPK = {
        id: Date.now().toString(),
        kod: formData.kod!,
        kurumAdi: formData.kurumAdi!,
        aciklama: formData.aciklama || '',
        aktif: formData.aktif ?? true,
        olusturmaTarihi: new Date().toISOString().split('T')[0],
      };
      onEPKListChange([...epkList, newEPK]);
      toast.success('EPK başarıyla eklendi');
    }

    setIsDialogOpen(false);
    setEditingEPK(null);
  }, [epkList, editingEPK, formData, onEPKListChange]);

  const handleDelete = useCallback(() => {
    if (deletingEPK) {
      const updatedList = epkList.filter((epk) => epk.id !== deletingEPK.id);
      onEPKListChange(updatedList);
      toast.success('EPK başarıyla silindi');
      setIsDeleteDialogOpen(false);
      setDeletingEPK(null);
    }
  }, [epkList, deletingEPK, onEPKListChange]);

  const handleToggleStatus = useCallback((epk: EPK) => {
    const updatedList = epkList.map((e) =>
      e.id === epk.id ? { ...e, aktif: !e.aktif } : e
    );
    onEPKListChange(updatedList);
    toast.success(`EPK ${!epk.aktif ? 'aktif' : 'pasif'} edildi`);
  }, [epkList, onEPKListChange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3>Elektronik Para Kuruluşları (EPK)</h3>
          <p className="text-gray-600">EPK tanımlarını yönetin</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="flex items-center space-x-2">
          <Plus size={18} />
          <span>Yeni EPK Ekle</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          id="epk-search"
          placeholder="EPK ara (ad veya kod)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kod</TableHead>
              <TableHead>Kurum Adı</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Oluşturma Tarihi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEPK.length === 0 ? (
              <TableRow key="empty-row">
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  EPK bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              filteredEPK.map((epk) => (
                <TableRow key={epk.id}>
                  <TableCell>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{epk.kod}</code>
                  </TableCell>
                  <TableCell>{epk.kurumAdi}</TableCell>
                  <TableCell className="max-w-xs truncate">{epk.aciklama || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={epk.aktif ? 'default' : 'secondary'}>
                      {epk.aktif ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell>{epk.olusturmaTarihi}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Switch 
                        checked={epk.aktif}
                        onCheckedChange={() => handleToggleStatus(epk)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(epk)}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingEPK(epk);
                          setIsDeleteDialogOpen(true);
                        }}
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEPK ? 'EPK Düzenle' : 'Yeni EPK Ekle'}</DialogTitle>
            <DialogDescription>
              {editingEPK ? 'Mevcut EPK bilgilerini düzenleyin' : 'Yeni bir elektronik para kuruluşu ekleyin'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="kod">EPK Kodu *</Label>
              <Input
                id="kod"
                value={formData.kod || ''}
                onChange={(e) => setFormData({ ...formData, kod: e.target.value })}
                placeholder="Örn: EPK001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kurumAdi">Kurum Adı *</Label>
              <Input
                id="kurumAdi"
                value={formData.kurumAdi || ''}
                onChange={(e) => setFormData({ ...formData, kurumAdi: e.target.value })}
                placeholder="Örn: XYZ Elektronik Para A.Ş."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aciklama">Açıklama</Label>
              <Textarea
                id="aciklama"
                value={formData.aciklama || ''}
                onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                placeholder="EPK hakkında açıklama..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="aktif"
                checked={formData.aktif}
                onCheckedChange={(checked) => setFormData({ ...formData, aktif: checked })}
              />
              <Label htmlFor="aktif">Aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>EPK Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu EPK'yı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});
