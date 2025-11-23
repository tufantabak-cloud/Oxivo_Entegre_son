import React, { useState, useMemo, useCallback } from 'react';
import { SuspensionReason } from './DefinitionsModule';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
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
import { Plus, Edit2, Trash2, Ban, Search } from 'lucide-react';
import { toast } from 'sonner';

interface SuspensionReasonsTabProps {
  suspensionReasons: SuspensionReason[];
  onSuspensionReasonsChange: (reasons: SuspensionReason[]) => void;
}

export const SuspensionReasonsTab = React.memo(function SuspensionReasonsTab({ 
  suspensionReasons, 
  onSuspensionReasonsChange 
}: SuspensionReasonsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingReason, setEditingReason] = useState<SuspensionReason | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    reason: '',
    aciklama: '',
    aktif: true,
  });

  // ⚡ PERFORMANCE: useMemo caches filtered list
  const filteredReasons = useMemo(() => {
    if (!searchTerm.trim()) return suspensionReasons;
    
    const lowerSearch = searchTerm.toLowerCase();
    return suspensionReasons.filter(
      (reason) =>
        reason.reason.toLowerCase().includes(lowerSearch) ||
        reason.aciklama.toLowerCase().includes(lowerSearch)
    );
  }, [suspensionReasons, searchTerm]);

  // ⚡ PERFORMANCE: useCallback prevents function recreation
  const handleOpenDialog = useCallback((reason?: SuspensionReason) => {
    if (reason) {
      setEditingReason(reason);
      setFormData({
        reason: reason.reason,
        aciklama: reason.aciklama,
        aktif: reason.aktif,
      });
    } else {
      setEditingReason(null);
      setFormData({
        reason: '',
        aciklama: '',
        aktif: true,
      });
    }
    setShowDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setShowDialog(false);
    setEditingReason(null);
    setFormData({
      reason: '',
      aciklama: '',
      aktif: true,
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.reason.trim()) {
      toast.error('Lütfen sebep adını girin');
      return;
    }

    if (editingReason) {
      // Güncelleme
      const updatedReasons = suspensionReasons.map((r) =>
        r.id === editingReason.id
          ? {
              ...r,
              reason: formData.reason.trim(),
              aciklama: formData.aciklama.trim(),
              aktif: formData.aktif,
            }
          : r
      );
      onSuspensionReasonsChange(updatedReasons);
      toast.success('Pasifleştirme sebebi güncellendi');
    } else {
      // Yeni ekleme
      const newReason: SuspensionReason = {
        id: Date.now().toString(),
        reason: formData.reason.trim(),
        aciklama: formData.aciklama.trim(),
        aktif: formData.aktif,
        olusturmaTarihi: new Date().toISOString().split('T')[0],
      };
      onSuspensionReasonsChange([...suspensionReasons, newReason]);
      toast.success('Yeni pasifleştirme sebebi eklendi');
    }

    handleCloseDialog();
  }, [editingReason, formData, suspensionReasons, onSuspensionReasonsChange, handleCloseDialog]);

  const handleDelete = useCallback((id: string) => {
    const updatedReasons = suspensionReasons.filter((r) => r.id !== id);
    onSuspensionReasonsChange(updatedReasons);
    toast.success('Pasifleştirme sebebi silindi');
    setDeleteConfirmId(null);
  }, [suspensionReasons, onSuspensionReasonsChange]);

  const handleToggleActive = useCallback((id: string) => {
    const updatedReasons = suspensionReasons.map((r) =>
      r.id === id ? { ...r, aktif: !r.aktif } : r
    );
    onSuspensionReasonsChange(updatedReasons);
    toast.success('Durum güncellendi');
  }, [suspensionReasons, onSuspensionReasonsChange]);

  const activeCount = suspensionReasons.filter((r) => r.aktif).length;
  const inactiveCount = suspensionReasons.filter((r) => !r.aktif).length;

  return (
    <div className="space-y-6">
      {/* Başlık ve İstatistikler */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Cihaz Pasifleştirme Sebepleri</h3>
          <p className="text-sm text-gray-600 mt-1">
            Cihazlar pasifleştirilirken kullanılacak standart sebepleri yönetin
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Toplam Sebep</p>
            <p className="text-2xl font-bold text-gray-900">{suspensionReasons.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-green-600">Aktif</p>
            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Pasif</p>
            <p className="text-2xl font-bold text-gray-500">{inactiveCount}</p>
          </div>
        </div>
      </div>

      {/* Arama ve Ekle Butonu */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Sebep veya açıklama ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => handleOpenDialog()} className="shrink-0">
              <Plus size={16} className="mr-2" />
              Yeni Sebep Ekle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sebep Listesi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban size={20} />
            Pasifleştirme Sebepleri
            <Badge variant="secondary" className="ml-2">
              {filteredReasons.length} Sebep
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReasons.length === 0 ? (
            <div className="text-center py-12">
              <Ban className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'Arama kriterlerine uygun sebep bulunamadı' : 'Henüz pasifleştirme sebebi eklenmemiş'}
              </p>
              {!searchTerm && (
                <Button onClick={() => handleOpenDialog()} variant="outline" className="mt-4">
                  <Plus size={16} className="mr-2" />
                  İlk Sebebi Ekle
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 font-medium text-gray-700">Durum</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-700">Sebep</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-700">Açıklama</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-700">Oluşturma Tarihi</th>
                    <th className="text-right py-3 px-3 font-medium text-gray-700">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReasons.map((reason) => (
                    <tr key={reason.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-3">
                        <Switch
                          checked={reason.aktif}
                          onCheckedChange={() => handleToggleActive(reason.id)}
                        />
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <Ban size={16} className={reason.aktif ? 'text-orange-600' : 'text-gray-400'} />
                          <span className={reason.aktif ? 'font-medium' : 'text-gray-500'}>
                            {reason.reason}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-gray-600">{reason.aciklama || '-'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm text-gray-500">
                          {new Date(reason.olusturmaTarihi).toLocaleDateString('tr-TR')}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(reason)}
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmId(reason.id)}
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bilgilendirme */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="bg-blue-600 text-white rounded-full p-2 shrink-0">
              <Ban size={20} />
            </div>
            <div className="space-y-2">
              <p className="font-medium text-blue-900">💡 Pasifleştirme Sebepleri Hakkında</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Bu sebepler, cihazlar pasifleştirilirken zorunlu olarak seçilmesi gereken standart sebeplerdir</li>
                <li>• Her müşteri için bu sebepler geçerlidir ve müşteri detay sayfasında kullanılır</li>
                <li>• Pasif cihazlar raporunda hangi sebepten dolayı cihazların pasif olduğunu görebilirsiniz</li>
                <li>• Pasif duruma getirilen sebepleri aktif/pasif duruma alarak kullanım durumunu kontrol edebilirsiniz</li>
                <li>• Sadece aktif sebepler, cihaz pasifleştirme işlemlerinde seçim listesinde görünür</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Düzenleme Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingReason ? 'Pasifleştirme Sebebi Düzenle' : 'Yeni Pasifleştirme Sebebi Ekle'}
            </DialogTitle>
            <DialogDescription>
              Cihaz pasifleştirme işlemlerinde kullanılacak sebep bilgilerini girin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Sebep Adı *</Label>
              <Input
                id="reason"
                placeholder="Örn: Donanım tamiratı, Müşteri talebi..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aciklama">Açıklama</Label>
              <Textarea
                id="aciklama"
                placeholder="Sebep hakkında detaylı açıklama..."
                value={formData.aciklama}
                onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
              <div>
                <Label>Durum</Label>
                <p className="text-sm text-gray-600">Sebep aktif mi?</p>
              </div>
              <Switch
                checked={formData.aktif}
                onCheckedChange={(checked) => setFormData({ ...formData, aktif: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              İptal
            </Button>
            <Button onClick={handleSave}>
              {editingReason ? 'Güncelle' : 'Ekle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Silme Onay Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pasifleştirme sebebi silinecek</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu sebep, geçmişte kullanılmış olabilir.
              Silmek yerine pasif duruma almayı düşünün.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});