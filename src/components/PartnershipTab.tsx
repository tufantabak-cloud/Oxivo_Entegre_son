import { useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

export interface PartnershipCalculationRow {
  id: string;
  kullanim: string; // Yurtiçi / Yurtdışı
  kartTipi: string; // Debit / Credit / Prepaid
  islemHacmi: string;
  alisYuzde: string;
  alisTL: string;
  satisYuzde: string;
  satisTL: string;
  kazancYuzde: string;
}

export interface Partnership {
  id: string;
  kod: string;
  modelAdi: string;
  oran: string;
  aciklama: string;
  aktif: boolean;
  olusturmaTarihi: string;
  calculationRows: PartnershipCalculationRow[];
}

interface PartnershipTabProps {
  partnerships: Partnership[];
  onPartnershipsChange: (list: Partnership[]) => void;
}

export function PartnershipTab({ partnerships, onPartnershipsChange }: PartnershipTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRowFormOpen, setIsRowFormOpen] = useState(false);
  const [deletingPartnership, setDeletingPartnership] = useState<Partnership | null>(null);
  const [currentRow, setCurrentRow] = useState<PartnershipCalculationRow | null>(null);

  const filteredPartnerships = partnerships.filter(
    (p) =>
      p.modelAdi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.kod?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenNewModel = () => {
    const newRow: PartnershipCalculationRow = {
      id: Date.now().toString(),
      kullanim: 'Yurtiçi',
      kartTipi: 'Debit',
      islemHacmi: '',
      alisYuzde: '',
      alisTL: '',
      satisYuzde: '',
      satisTL: '',
      kazancYuzde: '',
    };
    setCurrentRow(newRow);
    setIsRowFormOpen(true);
  };

  const handleSaveRow = () => {
    if (!currentRow) return;

    // Otomatik model bilgileri üret
    const timestamp = Date.now();
    const autoKod = `ORT${String(partnerships.length + 1).padStart(3, '0')}`;
    const autoModelAdi = `Ortaklık Modeli ${partnerships.length + 1}`;

    // Yeni ortaklık modeli oluştur
    const newPartnership: Partnership = {
      id: timestamp.toString(),
      kod: autoKod,
      modelAdi: autoModelAdi,
      oran: '50/50',
      aciklama: '',
      aktif: true,
      olusturmaTarihi: new Date().toISOString().split('T')[0],
      calculationRows: [currentRow],
    };
    
    onPartnershipsChange([...partnerships, newPartnership]);
    
    // Row formunu kapat
    setIsRowFormOpen(false);
    setCurrentRow(null);
    
    toast.success('Ortaklık modeli başarıyla eklendi');
  };

  const handleRowFieldChange = (field: keyof PartnershipCalculationRow, value: string) => {
    if (!currentRow) return;

    let updatedRow = { ...currentRow, [field]: value };

    // Otomatik hesaplamalar
    const islemHacmi = parseFloat(updatedRow.islemHacmi) || 0;
    const alisYuzde = parseFloat(updatedRow.alisYuzde) || 0;
    const satisYuzde = parseFloat(updatedRow.satisYuzde) || 0;

    if (field === 'alisYuzde' || field === 'islemHacmi') {
      updatedRow.alisTL = (islemHacmi * alisYuzde / 100).toFixed(2);
    }

    if (field === 'satisYuzde' || field === 'islemHacmi') {
      updatedRow.satisTL = (islemHacmi * satisYuzde / 100).toFixed(2);
    }

    const alisTL = parseFloat(updatedRow.alisTL) || 0;
    const satisTL = parseFloat(updatedRow.satisTL) || 0;
    if (islemHacmi > 0) {
      updatedRow.kazancYuzde = (((satisTL - alisTL) / islemHacmi) * 100).toFixed(2);
    }

    setCurrentRow(updatedRow);
  };

  const handleDelete = () => {
    if (deletingPartnership) {
      const updatedList = partnerships.filter((p) => p.id !== deletingPartnership.id);
      onPartnershipsChange(updatedList);
      toast.success('Ortaklık modeli başarıyla silindi');
      setIsDeleteDialogOpen(false);
      setDeletingPartnership(null);
    }
  };

  const formatNumber = (num: number | string) => {
    const value = typeof num === 'string' ? parseFloat(num) : num;
    return isNaN(value) ? '0.00' : value.toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3>Ortaklık Modelleri</h3>
          <p className="text-gray-600">Ortaklık gelir modellerini yönetin</p>
        </div>
        <Button onClick={handleOpenNewModel} className="flex items-center space-x-2">
          <Plus size={18} />
          <span>Yeni Model Ekle</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          id="partnership-search"
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
              <TableHead>Hesaplama Satırları</TableHead>
              <TableHead>Oluşturma Tarihi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPartnerships.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Ortaklık modeli bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              filteredPartnerships.map((partnership) => (
                <TableRow key={partnership.id}>
                  <TableCell>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{partnership.kod}</code>
                  </TableCell>
                  <TableCell>{partnership.modelAdi}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {partnership.calculationRows?.length || 0} satır
                    </Badge>
                  </TableCell>
                  <TableCell>{partnership.olusturmaTarihi}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingPartnership(partnership);
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

      {/* Full Page Row Form */}
      {isRowFormOpen && currentRow && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen">
            {/* Header */}
            <div className="border-b bg-white sticky top-0 z-10">
              <div className="flex items-center justify-between px-8 py-4">
                <h2 className="text-xl">Yeni Hesaplama Satırı</h2>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsRowFormOpen(false);
                      setCurrentRow(null);
                    }}
                  >
                    İptal
                  </Button>
                  <Button onClick={handleSaveRow}>
                    Kaydet
                  </Button>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="max-w-4xl mx-auto px-8 py-8">
              <div className="space-y-6">
                {/* Kullanım */}
                <div className="space-y-2">
                  <Label>Kullanım</Label>
                  <Select
                    value={currentRow.kullanim}
                    onValueChange={(value) => handleRowFieldChange('kullanim', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yurtiçi">Yurtiçi</SelectItem>
                      <SelectItem value="Yurtdışı">Yurtdışı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Kart Tipi */}
                <div className="space-y-2">
                  <Label>Kart Tipi</Label>
                  <Select
                    value={currentRow.kartTipi}
                    onValueChange={(value) => handleRowFieldChange('kartTipi', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Debit">Debit</SelectItem>
                      <SelectItem value="Credit">Credit</SelectItem>
                      <SelectItem value="Prepaid">Prepaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* İşlem Hacmi */}
                <div className="space-y-2">
                  <Label>İşlem Hacmi (TL)</Label>
                  <Input
                    type="number"
                    value={currentRow.islemHacmi}
                    onChange={(e) => handleRowFieldChange('islemHacmi', e.target.value)}
                    placeholder="Örn: 1000000"
                  />
                </div>

                {/* Alış % */}
                <div className="space-y-2">
                  <Label>Alış %</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={currentRow.alisYuzde}
                    onChange={(e) => handleRowFieldChange('alisYuzde', e.target.value)}
                    placeholder="Örn: 1.5"
                  />
                </div>

                {/* Alış TL (Otomatik) */}
                <div className="space-y-2">
                  <Label>Alış TL (Otomatik)</Label>
                  <Input
                    type="text"
                    value={currentRow.alisTL}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                {/* Satış % */}
                <div className="space-y-2">
                  <Label>Satış %</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={currentRow.satisYuzde}
                    onChange={(e) => handleRowFieldChange('satisYuzde', e.target.value)}
                    placeholder="Örn: 2.0"
                  />
                </div>

                {/* Satış TL (Otomatik) */}
                <div className="space-y-2">
                  <Label>Satış TL (Otomatik)</Label>
                  <Input
                    type="text"
                    value={currentRow.satisTL}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                {/* Kazanç % (Otomatik) */}
                <div className="space-y-2">
                  <Label>Kazanç % (Otomatik)</Label>
                  <Input
                    type="text"
                    value={currentRow.kazancYuzde}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ortaklık Modelini Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu ortaklık modelini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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
