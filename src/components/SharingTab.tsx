import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { sharingApi } from '../utils/supabaseClient';

export interface Sharing {
  id: string;
  kod: string;
  modelAdi: string;
  oran: string;
  aciklama: string;
  aktif: boolean;
  olusturmaTarihi: string;
  // ✅ EKSIK ALANLAR EKLENDİ - Supabase entegrasyonu için gerekli
  ad?: string; // Supabase'de 'ad' kolonu kullanılıyor
  tip?: string;
  sira?: number;
  paydaslar?: any[]; // JSONB field
}

interface SharingTabProps {
  sharings: Sharing[];
  onSharingsChange: (list: Sharing[]) => void;
}

export function SharingTab({ sharings, onSharingsChange }: SharingTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSharing, setEditingSharing] = useState<Sharing | null>(null);
  const [deletingSharing, setDeletingSharing] = useState<Sharing | null>(null);
  const [formData, setFormData] = useState<Partial<Sharing>>({
    kod: '',
    modelAdi: '',
    oran: '',
    aciklama: '',
    aktif: true,
  });

  // ✅ SAFETY: Ensure sharings is always an array
  const safeSharings = Array.isArray(sharings) ? sharings : [];
  
  const filteredSharings = safeSharings.filter(
    (s) =>
      s.modelAdi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.kod?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (sharing?: Sharing) => {
    if (sharing) {
      setEditingSharing(sharing);
      setFormData(sharing);
    } else {
      setEditingSharing(null);
      setFormData({
        kod: '',
        modelAdi: '',
        oran: '',
        aciklama: '',
        aktif: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.kod || !formData.modelAdi || !formData.oran) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    // ✅ SAFETY: Duplicate kontrolü with array safety
    const isDuplicate = safeSharings.some(
      (s) =>
        s.id !== editingSharing?.id &&
        (s.kod?.toLowerCase() === formData.kod?.toLowerCase() ||
          s.modelAdi?.toLowerCase() === formData.modelAdi?.toLowerCase())
    );

    if (isDuplicate) {
      toast.error('Bu kod veya model adı zaten kayıtlı!');
      return;
    }

    if (editingSharing) {
      // Güncelleme
      const updatedList = safeSharings.map((s) =>
        s.id === editingSharing.id ? { ...s, ...formData } : s
      );
      onSharingsChange(updatedList);
      toast.success('Paylaşım modeli başarıyla güncellendi');
    } else {
      // Yeni ekleme
      const newSharing: Sharing = {
        id: crypto.randomUUID(), // ✅ UUID GENERATION for Supabase compatibility
        kod: formData.kod!,
        modelAdi: formData.modelAdi!,
        oran: formData.oran!,
        aciklama: formData.aciklama || '',
        aktif: formData.aktif ?? true,
        olusturmaTarihi: new Date().toISOString().split('T')[0],
      };
      onSharingsChange([...safeSharings, newSharing]);
      toast.success('Paylaşım modeli başarıyla eklendi');
    }

    setIsDialogOpen(false);
    setEditingSharing(null);
  };

  const handleDelete = async () => {
    if (deletingSharing) {
      // ✅ Supabase'den sil
      const result = await sharingApi.delete(deletingSharing.id);
      
      if (result.success) {
        // Frontend state'ini güncelle
        const updatedList = safeSharings.filter((s) => s.id !== deletingSharing.id);
        onSharingsChange(updatedList);
        toast.success('Paylaşım modeli başarıyla silindi');
      } else {
        toast.error(`Silme hatası: ${result.error}`);
      }
      
      setIsDeleteDialogOpen(false);
      setDeletingSharing(null);
    }
  };

  const handleToggleStatus = (sharing: Sharing) => {
    // ✅ SAFETY: Use safeSharings
    const updatedList = safeSharings.map((s) =>
      s.id === sharing.id ? { ...s, aktif: !s.aktif } : s
    );
    onSharingsChange(updatedList);
    toast.success(`Paylaşım modeli ${!sharing.aktif ? 'aktif' : 'pasif'} edildi`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3>Paylaşım Modelleri</h3>
          <p className="text-gray-600">Paylaşım gelir modellerini yönetin</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="flex items-center space-x-2">
          <Plus size={18} />
          <span>Yeni Model Ekle</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="Model ara (ad veya kod)..."
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
              <TableHead>Model Adı</TableHead>
              <TableHead>Oran</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Oluşturma Tarihi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSharings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Paylaşım modeli bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              filteredSharings.map((sharing) => (
                <TableRow key={sharing.id}>
                  <TableCell>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{sharing.kod}</code>
                  </TableCell>
                  <TableCell>{sharing.modelAdi}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{sharing.oran}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{sharing.aciklama || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={sharing.aktif ? 'default' : 'secondary'}>
                      {sharing.aktif ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell>{sharing.olusturmaTarihi}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Switch 
                        checked={sharing.aktif}
                        onCheckedChange={() => handleToggleStatus(sharing)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(sharing)}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingSharing(sharing);
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
            <DialogTitle>{editingSharing ? 'Paylaşım Modeli Düzenle' : 'Yeni Paylaşım Modeli Ekle'}</DialogTitle>
            <DialogDescription>
              {editingSharing ? 'Mevcut paylaşım modelini düzenleyin' : 'Yeni bir paylaşım gelir modeli ekleyin'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="kod">Model Kodu *</Label>
              <Input
                id="kod"
                value={formData.kod || ''}
                onChange={(e) => setFormData({ ...formData, kod: e.target.value })}
                placeholder="Örn: PAY001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelAdi">Model Adı *</Label>
              <Input
                id="modelAdi"
                value={formData.modelAdi || ''}
                onChange={(e) => setFormData({ ...formData, modelAdi: e.target.value })}
                placeholder="Örn: Gelir Paylaşımı"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oran">Oran *</Label>
              <Input
                id="oran"
                value={formData.oran || ''}
                onChange={(e) => setFormData({ ...formData, oran: e.target.value })}
                placeholder="Örn: 70/30 veya %25"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aciklama">Açıklama</Label>
              <Textarea
                id="aciklama"
                value={formData.aciklama || ''}
                onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                placeholder="Model hakkında açıklama..."
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
            <AlertDialogTitle>Paylaşım Modelini Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu paylaşım modelini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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