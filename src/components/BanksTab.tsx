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

export interface Bank {
  id: string;
  kod: string;
  bankaAdi: string;
  aciklama: string;
  aktif: boolean;
  olusturmaTarihi: string;
}

interface BanksTabProps {
  banks: Bank[];
  onBanksChange: (banks: Bank[]) => void;
}

// ⚡ MEMORY OPTIMIZATION: React.memo prevents re-renders when props haven't changed
export const BanksTab = React.memo(function BanksTab({ banks, onBanksChange }: BanksTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [deletingBank, setDeletingBank] = useState<Bank | null>(null);
  const [formData, setFormData] = useState<Partial<Bank>>({
    kod: '',
    bankaAdi: '',
    aciklama: '',
    aktif: true,
  });

  // ⚡ PERFORMANCE: useMemo caches filtered list
  const filteredBanks = useMemo(() => {
    if (!searchTerm.trim()) return banks;
    
    const lowerSearch = searchTerm.toLowerCase();
    return banks.filter(
      (bank) =>
        bank.bankaAdi?.toLowerCase().includes(lowerSearch) ||
        bank.kod?.toLowerCase().includes(lowerSearch)
    );
  }, [banks, searchTerm]);

  // ⚡ PERFORMANCE: useCallback prevents function recreation
  const handleOpenDialog = useCallback((bank?: Bank) => {
    if (bank) {
      setEditingBank(bank);
      setFormData(bank);
    } else {
      setEditingBank(null);
      setFormData({
        kod: '',
        bankaAdi: '',
        aciklama: '',
        aktif: true,
      });
    }
    setIsDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.kod || !formData.bankaAdi) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    // Duplicate kontrolü
    const isDuplicate = banks.some(
      (bank) =>
        bank.id !== editingBank?.id &&
        (bank.kod?.toLowerCase() === formData.kod?.toLowerCase() ||
          bank.bankaAdi?.toLowerCase() === formData.bankaAdi?.toLowerCase())
    );

    if (isDuplicate) {
      toast.error('Bu banka kodu veya adı zaten kayıtlı!');
      return;
    }

    if (editingBank) {
      // Güncelleme
      const updatedBanks = banks.map((bank) =>
        bank.id === editingBank.id ? { ...bank, ...formData } : bank
      );
      onBanksChange(updatedBanks);
      toast.success('Banka başarıyla güncellendi');
    } else {
      // Yeni ekleme
      const newBank: Bank = {
        id: Date.now().toString(),
        kod: formData.kod!,
        bankaAdi: formData.bankaAdi!,
        aciklama: formData.aciklama || '',
        aktif: formData.aktif ?? true,
        olusturmaTarihi: new Date().toISOString().split('T')[0],
      };
      onBanksChange([...banks, newBank]);
      toast.success('Banka başarıyla eklendi');
    }

    setIsDialogOpen(false);
    setEditingBank(null);
  }, [banks, editingBank, formData, onBanksChange]);

  const handleDelete = useCallback(() => {
    if (deletingBank) {
      const updatedBanks = banks.filter((bank) => bank.id !== deletingBank.id);
      onBanksChange(updatedBanks);
      toast.success('Banka başarıyla silindi');
      setIsDeleteDialogOpen(false);
      setDeletingBank(null);
    }
  }, [banks, deletingBank, onBanksChange]);

  const handleToggleStatus = useCallback((bank: Bank) => {
    const updatedBanks = banks.map((b) =>
      b.id === bank.id ? { ...b, aktif: !b.aktif } : b
    );
    onBanksChange(updatedBanks);
    toast.success(`Banka ${!bank.aktif ? 'aktif' : 'pasif'} edildi`);
  }, [banks, onBanksChange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3>Banka Tanımları</h3>
          <p className="text-gray-600">Sistemdeki banka tanımlarını yönetin</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="flex items-center space-x-2">
          <Plus size={18} />
          <span>Yeni Banka Ekle</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          id="banks-search"
          placeholder="Banka ara (ad veya kod)..."
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
              <TableHead>Banka Adı</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Oluşturma Tarihi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBanks.length === 0 ? (
              <TableRow key="empty-row">
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Banka bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              filteredBanks.map((bank) => (
                <TableRow key={bank.id}>
                  <TableCell>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{bank.kod}</code>
                  </TableCell>
                  <TableCell>{bank.bankaAdi}</TableCell>
                  <TableCell className="max-w-xs truncate">{bank.aciklama || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={bank.aktif ? 'default' : 'secondary'}>
                      {bank.aktif ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell>{bank.olusturmaTarihi}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Switch 
                        checked={bank.aktif}
                        onCheckedChange={() => handleToggleStatus(bank)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(bank)}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingBank(bank);
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
            <DialogTitle>{editingBank ? 'Banka Düzenle' : 'Yeni Banka Ekle'}</DialogTitle>
            <DialogDescription>
              {editingBank ? 'Mevcut banka bilgilerini düzenleyin' : 'Yeni bir banka tanımı ekleyin'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="kod">Banka Kodu *</Label>
              <Input
                id="kod"
                value={formData.kod || ''}
                onChange={(e) => setFormData({ ...formData, kod: e.target.value })}
                placeholder="Örn: 0001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankaAdi">Banka Adı *</Label>
              <Input
                id="bankaAdi"
                value={formData.bankaAdi || ''}
                onChange={(e) => setFormData({ ...formData, bankaAdi: e.target.value })}
                placeholder="Örn: Türkiye İş Bankası A.Ş."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aciklama">Açıklama</Label>
              <Textarea
                id="aciklama"
                value={formData.aciklama || ''}
                onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                placeholder="Banka hakkında açıklama..."
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
            <AlertDialogTitle>Bankayı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu bankayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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
