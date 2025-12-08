import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { kartProgramApi } from '../utils/supabaseClient';

export interface KartProgram {
  id: string;
  kartAdi: string;
  aciklama: string;
  aktif: boolean;
  olusturmaTarihi: string;
  // ✅ EKSIK ALANLAR EKLENDİ - Supabase entegrasyonu için gerekli
  kod?: string;
  ad?: string; // Supabase'de 'ad' kolonu kullanılıyor
  bankaKodu?: string;
  kartTipi?: string;
  komisyonOrani?: number;
}

interface KartProgramTabProps {
  kartProgramlar: KartProgram[];
  onKartProgramlarChange: (kartProgramlar: KartProgram[]) => void;
}

export function KartProgramTab({ kartProgramlar, onKartProgramlarChange }: KartProgramTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingKart, setEditingKart] = useState<KartProgram | null>(null);
  const [deletingKart, setDeletingKart] = useState<KartProgram | null>(null);
  const [formData, setFormData] = useState<Partial<KartProgram>>({
    kartAdi: '',
    aciklama: '',
    aktif: true,
  });

  const filteredKartlar = kartProgramlar.filter(
    (kart) =>
      kart.kartAdi?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (kart?: KartProgram) => {
    if (kart) {
      setEditingKart(kart);
      setFormData(kart);
    } else {
      setEditingKart(null);
      setFormData({
        kartAdi: '',
        aciklama: '',
        aktif: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.kartAdi) {
      toast.error('Lütfen kart adını girin');
      return;
    }

    // Duplicate kontrolü
    const isDuplicate = kartProgramlar.some(
      (kart) =>
        kart.id !== editingKart?.id &&
        kart.kartAdi?.toLowerCase() === formData.kartAdi?.toLowerCase()
    );

    if (isDuplicate) {
      toast.error('Bu kart adı zaten kayıtlı!');
      return;
    }

    if (editingKart) {
      // Güncelleme
      const updatedKartlar = kartProgramlar.map((kart) =>
        kart.id === editingKart.id ? { ...kart, ...formData } : kart
      );
      onKartProgramlarChange(updatedKartlar);
      toast.success('Kart başarıyla güncellendi');
    } else {
      // Yeni ekleme
      const newKart: KartProgram = {
        id: crypto.randomUUID(), // ✅ UUID GENERATION for Supabase compatibility
        kartAdi: formData.kartAdi!,
        aciklama: formData.aciklama || '',
        aktif: formData.aktif ?? true,
        olusturmaTarihi: new Date().toISOString().split('T')[0],
      };
      onKartProgramlarChange([...kartProgramlar, newKart]);
      toast.success('Kart başarıyla eklendi');
    }

    setIsDialogOpen(false);
    setEditingKart(null);
  };

  const handleDelete = async () => {
    if (deletingKart) {
      // ✅ Supabase'den sil
      const result = await kartProgramApi.delete(deletingKart.id);
      
      if (result.success) {
        // Frontend state'ini güncelle
        const updatedKartlar = kartProgramlar.filter((kart) => kart.id !== deletingKart.id);
        onKartProgramlarChange(updatedKartlar);
        toast.success('Kart başarıyla silindi');
      } else {
        toast.error(`Silme hatası: ${result.error}`);
      }
      
      setIsDeleteDialogOpen(false);
      setDeletingKart(null);
    }
  };

  const handleToggleStatus = (kart: KartProgram) => {
    const updatedKartlar = kartProgramlar.map((k) =>
      k.id === kart.id ? { ...k, aktif: !k.aktif } : k
    );
    onKartProgramlarChange(updatedKartlar);
    toast.success(`Kart ${!kart.aktif ? 'aktif' : 'pasif'} edildi`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3>Kart Program Tanımları</h3>
          <p className="text-gray-600">Sistemdeki kart programlarını yönetin</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="flex items-center space-x-2">
          <Plus size={18} />
          <span>Yeni Kart Ekle</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          id="kart-program-search"
          placeholder="Kart ara..."
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
              <TableHead>Kart Adı</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Oluşturma Tarihi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredKartlar.length === 0 ? (
              <TableRow key="empty-row">
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Kart bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              filteredKartlar.map((kart) => (
                <TableRow key={kart.id}>
                  <TableCell>{kart.kartAdi}</TableCell>
                  <TableCell className="max-w-xs truncate">{kart.aciklama || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={kart.aktif ? 'default' : 'secondary'}>
                      {kart.aktif ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell>{kart.olusturmaTarihi}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Switch 
                        checked={kart.aktif}
                        onCheckedChange={() => handleToggleStatus(kart)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(kart)}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingKart(kart);
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
            <DialogTitle>{editingKart ? 'Kart Düzenle' : 'Yeni Kart Ekle'}</DialogTitle>
            <DialogDescription>
              {editingKart ? 'Mevcut kart bilgilerini düzenleyin' : 'Yeni bir kart programı tanımı ekleyin'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="kartAdi">Kart Adı *</Label>
              <Input
                id="kartAdi"
                value={formData.kartAdi || ''}
                onChange={(e) => setFormData({ ...formData, kartAdi: e.target.value })}
                placeholder="Örn: BONUS, AXESS, MAXIMUM"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aciklama">Açıklama</Label>
              <Textarea
                id="aciklama"
                value={formData.aciklama || ''}
                onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                placeholder="Kart programı hakkında açıklama..."
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
            <AlertDialogTitle>Kartı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kartı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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
}