import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Plus, Pencil, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export interface SalesRepresentative {
  id: string;
  adSoyad: string;
  email: string;
  telefon: string;
  departman: string;
  bolge?: string;
  aktif: boolean;
  olusturmaTarihi: string;
  notlar?: string;
}

export const defaultSalesRepresentatives: SalesRepresentative[] = [
  {
    id: '1',
    adSoyad: 'Ahmet Yılmaz',
    email: 'ahmet.yilmaz@firma.com',
    telefon: '0532 123 45 67',
    departman: 'Satış',
    bolge: 'İstanbul',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
    notlar: 'Kurumsal müşteriler'
  },
  {
    id: '2',
    adSoyad: 'Ayşe Demir',
    email: 'ayse.demir@firma.com',
    telefon: '0533 234 56 78',
    departman: 'Satış',
    bolge: 'Ankara',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
    notlar: 'KOBİ segmenti'
  },
  {
    id: '3',
    adSoyad: 'Mehmet Kaya',
    email: 'mehmet.kaya@firma.com',
    telefon: '0534 345 67 89',
    departman: 'Satış',
    bolge: 'İzmir',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
  {
    id: '4',
    adSoyad: 'Fatma Şahin',
    email: 'fatma.sahin@firma.com',
    telefon: '0535 456 78 90',
    departman: 'Satış',
    bolge: 'Bursa',
    aktif: true,
    olusturmaTarihi: '2024-01-01',
  },
];

interface SalesRepresentativesTabProps {
  salesReps: SalesRepresentative[];
  onSalesRepsChange: (reps: SalesRepresentative[]) => void;
}

// ⚡ MEMORY OPTIMIZATION: React.memo prevents re-renders when props haven't changed
export const SalesRepresentativesTab = React.memo(function SalesRepresentativesTab({ salesReps, onSalesRepsChange }: SalesRepresentativesTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<SalesRepresentative | null>(null);
  const [formData, setFormData] = useState<Partial<SalesRepresentative>>({
    adSoyad: '',
    email: '',
    telefon: '',
    departman: 'Satış',
    bolge: '',
    aktif: true,
    notlar: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  // ⚡ PERFORMANCE: useMemo caches filtered list
  const filteredReps = useMemo(() => {
    if (!searchTerm.trim()) return salesReps;
    
    const lowerSearch = searchTerm.toLowerCase();
    return salesReps.filter(rep =>
      rep.adSoyad.toLowerCase().includes(lowerSearch) ||
      rep.email.toLowerCase().includes(lowerSearch) ||
      rep.telefon.includes(searchTerm) ||
      (rep.bolge?.toLowerCase().includes(lowerSearch))
    );
  }, [salesReps, searchTerm]);

  // ⚡ PERFORMANCE: useCallback prevents function recreation
  const handleAdd = useCallback(() => {
    setEditingRep(null);
    setFormData({
      adSoyad: '',
      email: '',
      telefon: '',
      departman: 'Satış',
      bolge: '',
      aktif: true,
      notlar: '',
    });
    setIsDialogOpen(true);
  }, []);

  const handleEdit = useCallback((rep: SalesRepresentative) => {
    setEditingRep(rep);
    setFormData(rep);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (confirm('Bu satış temsilcisini silmek istediğinizden emin misiniz?')) {
      onSalesRepsChange(salesReps.filter(rep => rep.id !== id));
      toast.success('Satış temsilcisi silindi');
    }
  }, [salesReps, onSalesRepsChange]);

  const handleSave = useCallback(() => {
    if (!formData.adSoyad?.trim()) {
      toast.error('Ad Soyad alanı zorunludur!');
      return;
    }

    if (!formData.email?.trim()) {
      toast.error('E-posta alanı zorunludur!');
      return;
    }

    if (!formData.telefon?.trim()) {
      toast.error('Telefon alanı zorunludur!');
      return;
    }

    if (editingRep) {
      // Güncelleme
      onSalesRepsChange(
        salesReps.map(rep =>
          rep.id === editingRep.id
            ? { ...formData, id: editingRep.id, olusturmaTarihi: editingRep.olusturmaTarihi } as SalesRepresentative
            : rep
        )
      );
      toast.success('Satış temsilcisi güncellendi');
    } else {
      // Yeni ekleme
      const newRep: SalesRepresentative = {
        ...formData,
        id: Date.now().toString(),
        olusturmaTarihi: new Date().toISOString().split('T')[0],
      } as SalesRepresentative;
      onSalesRepsChange([...salesReps, newRep]);
      toast.success('Satış temsilcisi eklendi');
    }

    setIsDialogOpen(false);
  }, [editingRep, formData, salesReps, onSalesRepsChange]);

  const handleToggleActive = useCallback((id: string) => {
    onSalesRepsChange(
      salesReps.map(rep =>
        rep.id === id ? { ...rep, aktif: !rep.aktif } : rep
      )
    );
  }, [salesReps, onSalesRepsChange]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Satış Temsilcileri
            </CardTitle>
            <p className="text-sm font-medium text-gray-600 mt-1">
              Müşterilere atanacak satış temsilcilerini yönetin
            </p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Temsilci
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Arama */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Ad, email, telefon veya bölge ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-sm font-medium text-gray-600">
              Toplam: {salesReps.length} temsilci ({salesReps.filter(r => r.aktif).length} aktif)
            </div>
          </div>

          {/* Tablo */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Bölge</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Notlar</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReps.length === 0 ? (
                  <TableRow key="empty-row">
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz satış temsilcisi eklenmemiş'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReps.map((rep) => (
                    <TableRow key={rep.id}>
                      <TableCell className="font-medium">{rep.adSoyad}</TableCell>
                      <TableCell className="text-sm">{rep.email}</TableCell>
                      <TableCell className="text-sm">{rep.telefon}</TableCell>
                      <TableCell>
                        {rep.bolge && (
                          <Badge variant="outline" className="font-medium">
                            {rep.bolge}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rep.aktif}
                            onCheckedChange={() => handleToggleActive(rep.id)}
                          />
                          <Badge variant={rep.aktif ? 'default' : 'secondary'}>
                            {rep.aktif ? 'Aktif' : 'Pasif'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">
                        {rep.notlar}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(rep)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(rep.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRep ? 'Satış Temsilcisini Düzenle' : 'Yeni Satış Temsilcisi'}
            </DialogTitle>
            <DialogDescription>
              Satış temsilcisi bilgilerini girin
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adSoyad">Ad Soyad *</Label>
                <Input
                  id="adSoyad"
                  value={formData.adSoyad || ''}
                  onChange={(e) => setFormData({ ...formData, adSoyad: e.target.value })}
                  placeholder="Ahmet Yılmaz"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ahmet.yilmaz@firma.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefon">Telefon *</Label>
                <Input
                  id="telefon"
                  value={formData.telefon || ''}
                  onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                  placeholder="0532 123 45 67"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bolge">Bölge</Label>
                <Input
                  id="bolge"
                  value={formData.bolge || ''}
                  onChange={(e) => setFormData({ ...formData, bolge: e.target.value })}
                  placeholder="İstanbul, Ankara, vb."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notlar">Notlar</Label>
              <Input
                id="notlar"
                value={formData.notlar || ''}
                onChange={(e) => setFormData({ ...formData, notlar: e.target.value })}
                placeholder="Opsiyonel notlar (örn: Kurumsal müşteriler)"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.aktif ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, aktif: checked })}
              />
              <Label>Aktif</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave}>
              {editingRep ? 'Güncelle' : 'Ekle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
});