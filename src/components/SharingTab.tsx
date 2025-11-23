import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, AlertTriangle, CheckCircle, RefreshCw, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
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
import { 
  checkSharingsStatus, 
  restoreSharingsData, 
  diagnosticAndRepair,
  getSharingsReport 
} from '../utils/sharingsRecovery';

export interface Sharing {
  id: string;
  kod: string;
  modelAdi: string;
  oran: string;
  aciklama: string;
  aktif: boolean;
  olusturmaTarihi: string;
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
  const [diagnosticStatus, setDiagnosticStatus] = useState<ReturnType<typeof checkSharingsStatus> | null>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  // ✅ AUTO-REPAIR: Check data status on mount and when sharings change
  useEffect(() => {
    const status = checkSharingsStatus();
    setDiagnosticStatus(status);
    
    // ✅ AUTO-REPAIR: If data is invalid or empty, auto-repair silently
    if (!status.isValid || status.count === 0) {
      console.log('[SharingTab] Auto-repairing sharings data...', status);
      
      // Silent auto-repair without showing diagnostic UI
      const repairResult = diagnosticAndRepair(false); // false = no toasts
      
      if (repairResult.repaired) {
        console.log('[SharingTab] Auto-repair successful:', repairResult.message);
        
        // Reload data from localStorage
        const repairedStatus = checkSharingsStatus();
        if (repairedStatus.isValid && repairedStatus.data) {
          onSharingsChange(repairedStatus.data);
          toast.success('Paylaşım modelleri otomatik olarak düzeltildi');
        }
      }
      
      // Only show diagnostic UI if auto-repair failed
      if (!repairResult.repaired) {
        setShowDiagnostic(true);
      }
    }
  }, []);

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
        id: Date.now().toString(),
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

  const handleDelete = () => {
    if (deletingSharing) {
      // ✅ SAFETY: Use safeSharings
      const updatedList = safeSharings.filter((s) => s.id !== deletingSharing.id);
      onSharingsChange(updatedList);
      toast.success('Paylaşım modeli başarıyla silindi');
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

  const handleRunDiagnostic = () => {
    const result = diagnosticAndRepair(true);
    setDiagnosticStatus(result.status);
    
    if (result.repaired) {
      // Reload page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const handleForceRestore = () => {
    const result = restoreSharingsData(true);
    if (result.success) {
      toast.success(result.message);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      toast.error(result.message);
    }
  };

  const handleViewReport = () => {
    const report = getSharingsReport();
    console.log(report);
    toast.info('Detaylı rapor console\'a yazdırıldı');
  };

  return (
    <div className="space-y-6">
      {/* Diagnostic Alert */}
      {showDiagnostic && diagnosticStatus && (!diagnosticStatus.isValid || diagnosticStatus.count === 0) && (
        <Alert variant="destructive" className="border-orange-500 bg-orange-50">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <AlertTitle className="text-orange-900">Veri Sorunu Tespit Edildi</AlertTitle>
          <AlertDescription className="space-y-3">
            <p className="text-orange-800">
              {diagnosticStatus.error || 'Paylaşım modelleri verisi eksik veya bozuk.'}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Button 
                onClick={handleRunDiagnostic} 
                variant="outline" 
                size="sm"
                className="border-orange-600 text-orange-700 hover:bg-orange-100"
              >
                <RefreshCw size={16} className="mr-2" />
                Otomatik Onar
              </Button>
              <Button 
                onClick={handleForceRestore} 
                variant="outline" 
                size="sm"
                className="border-orange-600 text-orange-700 hover:bg-orange-100"
              >
                <RefreshCw size={16} className="mr-2" />
                Varsayılan Değerleri Yükle
              </Button>
              <Button 
                onClick={handleViewReport} 
                variant="ghost" 
                size="sm"
                className="text-orange-700 hover:bg-orange-100"
              >
                <Info size={16} className="mr-2" />
                Detaylı Rapor
              </Button>
              <Button 
                onClick={() => setShowDiagnostic(false)} 
                variant="ghost" 
                size="sm"
                className="text-orange-700 hover:bg-orange-100"
              >
                Kapat
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Status */}
      {diagnosticStatus && diagnosticStatus.isValid && diagnosticStatus.count > 0 && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-900">Veri Sağlam</AlertTitle>
          <AlertDescription className="text-green-800">
            {diagnosticStatus.count} paylaşım modeli başarıyla yüklendi.
            {showDiagnostic && (
              <Button 
                onClick={() => setShowDiagnostic(false)} 
                variant="ghost" 
                size="sm"
                className="ml-4 text-green-700 hover:bg-green-100"
              >
                Kapat
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3>Paylaşım Modelleri</h3>
          <p className="text-gray-600">Paylaşım gelir modellerini yönetin</p>
        </div>
        <div className="flex items-center gap-2">
          {!showDiagnostic && (
            <Button 
              onClick={() => setShowDiagnostic(true)} 
              variant="outline" 
              size="sm"
              className="flex items-center space-x-2"
            >
              <Info size={16} />
              <span>Veri Durumu</span>
            </Button>
          )}
          <Button onClick={() => handleOpenDialog()} className="flex items-center space-x-2">
            <Plus size={18} />
            <span>Yeni Model Ekle</span>
          </Button>
        </div>
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
