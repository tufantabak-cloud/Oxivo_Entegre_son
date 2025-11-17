import { useState } from 'react';
import { Document } from './BankPFModule';
import { Plus, Edit, Trash2, X, Check, Upload, Download, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
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
import { Badge } from './ui/badge';

interface DocumentManagementProps {
  documents: Document[];
  onDocumentsChange: (documents: Document[]) => void;
}

export function DocumentManagement({ documents, onDocumentsChange }: DocumentManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [formData, setFormData] = useState<Document>({
    id: '',
    dosyaAdi: '',
    dosyaTipi: '',
    yuklemeTarihi: '',
    boyut: '',
    aciklama: '',
  });

  const handleAdd = () => {
    setEditingDocument(null);
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      id: '',
      dosyaAdi: '',
      dosyaTipi: 'PDF',
      yuklemeTarihi: today,
      boyut: '',
      aciklama: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (document: Document) => {
    setEditingDocument(document);
    setFormData(document);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    onDocumentsChange(documents.filter((d) => d.id !== id));
  };

  const handleSave = () => {
    if (editingDocument) {
      // Update existing
      onDocumentsChange(
        documents.map((d) => (d.id === editingDocument.id ? formData : d))
      );
    } else {
      // Add new
      onDocumentsChange([
        ...documents,
        { ...formData, id: Date.now().toString() },
      ]);
    }
    setIsDialogOpen(false);
  };

  const getFileIcon = (dosyaTipi: string) => {
    return <FileText size={20} className="text-blue-600" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Doküman Yönetimi</CardTitle>
          <Button onClick={handleAdd} className="flex items-center space-x-2">
            <Upload size={18} />
            <span>Doküman Ekle</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Upload size={48} className="mx-auto mb-4 text-gray-400" />
            <p>Henüz doküman eklenmemiş.</p>
            <Button onClick={handleAdd} variant="outline" className="mt-4">
              <Upload size={18} className="mr-2" />
              İlk Dokümanı Ekle
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dosya Adı</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Yükleme Tarihi</TableHead>
                  <TableHead>Boyut</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getFileIcon(document.dosyaTipi)}
                        <span>{document.dosyaAdi}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{document.dosyaTipi}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(document.yuklemeTarihi)}</TableCell>
                    <TableCell>{document.boyut}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {document.aciklama || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="İndir"
                        >
                          <Download size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(document)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(document.id)}
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingDocument ? 'Dokümanı Düzenle' : 'Yeni Doküman Ekle'}
              </DialogTitle>
              <DialogDescription>
                Doküman bilgilerini girin. Gerçek dosya yükleme özelliği simüle edilmiştir.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="dosyaAdi">Dosya Adı *</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="dosyaAdi"
                    value={formData.dosyaAdi}
                    onChange={(e) =>
                      setFormData({ ...formData, dosyaAdi: e.target.value })
                    }
                    placeholder="Örn: Faaliyet Belgesi.pdf"
                    className="flex-1"
                  />
                  <Button variant="outline" type="button">
                    <Upload size={18} className="mr-2" />
                    Dosya Seç
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Not: Bu demo versiyonunda dosya yükleme simüle edilmektedir.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dosyaTipi">Dosya Tipi *</Label>
                  <Input
                    id="dosyaTipi"
                    value={formData.dosyaTipi}
                    onChange={(e) =>
                      setFormData({ ...formData, dosyaTipi: e.target.value })
                    }
                    placeholder="PDF, DOCX, XLSX, vb."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="boyut">Boyut</Label>
                  <Input
                    id="boyut"
                    value={formData.boyut}
                    onChange={(e) =>
                      setFormData({ ...formData, boyut: e.target.value })
                    }
                    placeholder="Örn: 2.5 MB"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="yuklemeTarihi">Yükleme Tarihi</Label>
                <Input
                  id="yuklemeTarihi"
                  type="date"
                  value={formData.yuklemeTarihi}
                  onChange={(e) =>
                    setFormData({ ...formData, yuklemeTarihi: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aciklama">Açıklama</Label>
                <Textarea
                  id="aciklama"
                  value={formData.aciklama}
                  onChange={(e) =>
                    setFormData({ ...formData, aciklama: e.target.value })
                  }
                  placeholder="Doküman hakkında kısa açıklama"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X size={18} className="mr-2" />
                İptal
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.dosyaAdi || !formData.dosyaTipi}
              >
                <Check size={18} className="mr-2" />
                {editingDocument ? 'Güncelle' : 'Ekle'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
