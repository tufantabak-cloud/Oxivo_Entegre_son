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

export interface OK {
  id: string;
  kod: string;
  kurumAdi: string;
  aciklama: string;
  aktif: boolean;
  olusturmaTarihi: string;
}

interface OKTabProps {
  okList: OK[];
  onOKListChange: (list: OK[]) => void;
}

// ⚡ MEMORY OPTIMIZATION: React.memo prevents re-renders when props haven't changed
export const OKTab = React.memo(function OKTab({ okList, onOKListChange }: OKTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingOK, setEditingOK] = useState<OK | null>(null);
  const [deletingOK, setDeletingOK] = useState<OK | null>(null);
  const [formData, setFormData] = useState<Partial<OK>>({
    kod: '',
    kurumAdi: '',
    aciklama: '',
    aktif: true,
  });

  // ⚡ PERFORMANCE: useMemo caches filtered list
  const filteredOK = useMemo(() => {
    if (!searchTerm.trim()) return okList;
    
    const lowerSearch = searchTerm.toLowerCase();
    return okList.filter(
      (ok) =>
        ok.kurumAdi?.toLowerCase().includes(lowerSearch) ||
        ok.kod?.toLowerCase().includes(lowerSearch)
    );
  }, [okList, searchTerm]);

  // ⚡ PERFORMANCE: useCallback prevents function recreation
  const handleOpenDialog = useCallback((ok?: OK) => {
    if (ok) {
      setEditingOK(ok);
      setFormData(ok);
    } else {
      setEditingOK(null);
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
    const isDuplicate = okList.some(
      (ok) =>
        ok.id !== editingOK?.id &&
        (ok.kod.toLowerCase() === formData.kod?.toLowerCase() ||
          ok.kurumAdi.toLowerCase() === formData.kurumAdi?.toLowerCase())
    );

    if (isDuplicate) {
      toast.error('Bu ÖK kodu veya adı zaten kayıtlı!');
      return;
    }

    if (editingOK) {
      // Güncelleme
      const updatedList = okList.map((ok) =>
        ok.id === editingOK.id ? { ...ok, ...formData } : ok
      );
      onOKListChange(updatedList);
      toast.success('ÖK başarıyla güncellendi');
    } else {
      // Yeni ekleme
      const newOK: OK = {
        id: Date.now().toString(),
        kod: formData.kod!,
        kurumAdi: formData.kurumAdi!,
        aciklama: formData.aciklama || '',
        aktif: formData.aktif ?? true,
        olusturmaTarihi: new Date().toISOString().split('T')[0],
      };
      onOKListChange([...okList, newOK]);
      toast.success('ÖK başarıyla eklendi');
    }

    setIsDialogOpen(false);
    setEditingOK(null);
  }, [okList, editingOK, formData, onOKListChange]);

  const handleDelete = useCallback(() => {
    if (deletingOK) {
      const updatedList = okList.filter((ok) => ok.id !== deletingOK.id);
      onOKListChange(updatedList);
      toast.success('ÖK başarıyla silindi');
      setIsDeleteDialogOpen(false);
      setDeletingOK(null);
    }
  }, [okList, deletingOK, onOKListChange]);

  const handleToggleStatus = useCallback((ok: OK) => {
    const updatedList = okList.map((o) =>
      o.id === ok.id ? { ...o, aktif: !o.aktif } : o
    );
    onOKListChange(updatedList);
    toast.success(`ÖK ${!ok.aktif ? 'aktif' : 'pasif'} edildi`);
  }, [okList, onOKListChange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3>Ödeme Kuruluşları (ÖK)</h3>
          <p className="text-gray-600">ÖK tanımlarını yönetin</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="flex items-center space-x-2">
          <Plus size={18} />
          <span>Yeni ÖK Ekle</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          id="ok-search"
          placeholder="ÖK ara (ad veya kod)..."
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
            {filteredOK.length === 0 ? (
              <TableRow key="empty-row">
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  ÖK bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              filteredOK.map((ok) => (
                <TableRow key={ok.id}>
                  <TableCell>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{ok.kod}</code>
                  </TableCell>
                  <TableCell>{ok.kurumAdi}</TableCell>
                  <TableCell className="max-w-xs truncate">{ok.aciklama || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={ok.aktif ? 'default' : 'secondary'}>
                      {ok.aktif ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell>{ok.olusturmaTarihi}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Switch 
                        checked={ok.aktif}
                        onCheckedChange={() => handleToggleStatus(ok)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(ok)}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingOK(ok);
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
            <DialogTitle>{editingOK ? 'ÖK Düzenle' : 'Yeni ÖK Ekle'}</DialogTitle>
            <DialogDescription>
              {editingOK ? 'Mevcut ÖK bilgilerini düzenleyin' : 'Yeni bir ödeme kuruluşu ekleyin'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="kod">ÖK Kodu *</Label>
              <Input
                id="kod"
                value={formData.kod || ''}
                onChange={(e) => setFormData({ ...formData, kod: e.target.value })}
                placeholder="Örn: OK001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kurumAdi">Kurum Adı *</Label>
              <Input
                id="kurumAdi"
                value={formData.kurumAdi || ''}
                onChange={(e) => setFormData({ ...formData, kurumAdi: e.target.value })}
                placeholder="Örn: ABC Ödeme Kuruluşu A.Ş."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aciklama">Açıklama</Label>
              <Textarea
                id="aciklama"
                value={formData.aciklama || ''}
                onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                placeholder="ÖK hakkında açıklama..."
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
            <AlertDialogTitle>ÖK Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu ÖK'yı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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
