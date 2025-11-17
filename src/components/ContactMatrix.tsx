import { useState, useEffect, useCallback } from 'react';
import { ContactPerson } from './BankPFModule';
import { Plus, Edit, Trash2, X, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
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
import { ColumnVisibilityDropdown, ColumnConfig } from './ColumnVisibilityDropdown';

interface ContactMatrixProps {
  contacts: ContactPerson[];
  onContactsChange: (contacts: ContactPerson[]) => void;
  gorevListesi: string[];
}

// Sütun konfigürasyonu
const CONTACT_COLUMN_CONFIGS: ColumnConfig[] = [
  { key: 'adiSoyadi', label: 'Adı Soyadı', defaultVisible: true },
  { key: 'gorevi', label: 'Görevi', defaultVisible: true },
  { key: 'tel', label: 'Telefon', defaultVisible: true },
  { key: 'gsm', label: 'GSM', defaultVisible: true },
  { key: 'mail', label: 'E-posta', defaultVisible: true },
];

export function ContactMatrix({ contacts, onContactsChange, gorevListesi }: ContactMatrixProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactPerson | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<ContactPerson>({
    id: '',
    adiSoyadi: '',
    gorevi: '',
    tel: '',
    gsm: '',
    mail: '',
  });

  const handleAdd = () => {
    setEditingContact(null);
    setFormData({
      id: '',
      adiSoyadi: '',
      gorevi: '',
      tel: '',
      gsm: '',
      mail: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (contact: ContactPerson) => {
    setEditingContact(contact);
    setFormData(contact);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    onContactsChange(contacts.filter((c) => c.id !== id));
  };

  const handleSave = () => {
    if (editingContact) {
      // Update existing
      onContactsChange(
        contacts.map((c) => (c.id === editingContact.id ? formData : c))
      );
    } else {
      // Add new
      onContactsChange([
        ...contacts,
        { ...formData, id: Date.now().toString() },
      ]);
    }
    setIsDialogOpen(false);
  };

  // Sütun görünürlüğü değişikliği
  const handleVisibilityChange = useCallback((visibility: Record<string, boolean>) => {
    setColumnVisibility(visibility);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>İletişim Matrisi</CardTitle>
          <div className="flex gap-2">
            <ColumnVisibilityDropdown
              columns={CONTACT_COLUMN_CONFIGS}
              storageKey="contactMatrix"
              onVisibilityChange={handleVisibilityChange}
            />
            <Button onClick={handleAdd} className="flex items-center space-x-2">
              <Plus size={18} />
              <span>Kişi Ekle</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Henüz yetkili kişi eklenmemiş.</p>
            <Button onClick={handleAdd} variant="outline" className="mt-4">
              <Plus size={18} className="mr-2" />
              İlk Kişiyi Ekle
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columnVisibility['adiSoyadi'] !== false && <TableHead>Adı Soyadı</TableHead>}
                  {columnVisibility['gorevi'] !== false && <TableHead>Görevi</TableHead>}
                  {columnVisibility['tel'] !== false && <TableHead>Tel</TableHead>}
                  {columnVisibility['gsm'] !== false && <TableHead>GSM</TableHead>}
                  {columnVisibility['mail'] !== false && <TableHead>E-posta</TableHead>}
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    {columnVisibility['adiSoyadi'] !== false && (
                      <TableCell>{contact.adiSoyadi}</TableCell>
                    )}
                    {columnVisibility['gorevi'] !== false && (
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm bg-blue-100 text-blue-800">
                          {contact.gorevi}
                        </span>
                      </TableCell>
                    )}
                    {columnVisibility['tel'] !== false && (
                      <TableCell>{contact.tel || '-'}</TableCell>
                    )}
                    {columnVisibility['gsm'] !== false && (
                      <TableCell>{contact.gsm || '-'}</TableCell>
                    )}
                    {columnVisibility['mail'] !== false && (
                      <TableCell>{contact.mail}</TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(contact)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(contact.id)}
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
                {editingContact ? 'Kişiyi Düzenle' : 'Yeni Kişi Ekle'}
              </DialogTitle>
              <DialogDescription>
                İletişim matrisine yetkili kişi bilgilerini ekleyin.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="adiSoyadi">Adı Soyadı *</Label>
                <Input
                  id="adiSoyadi"
                  value={formData.adiSoyadi}
                  onChange={(e) =>
                    setFormData({ ...formData, adiSoyadi: e.target.value })
                  }
                  placeholder="Örn: Ahmet Yılmaz"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="gorevi">Görevi *</Label>
                <Select
                  value={formData.gorevi}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gorevi: value })
                  }
                >
                  <SelectTrigger id="gorevi">
                    <SelectValue placeholder="Görev seçiniz..." />
                  </SelectTrigger>
                  <SelectContent>
                    {gorevListesi.map((gorev) => (
                      <SelectItem key={gorev} value={gorev}>
                        {gorev}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tel">Telefon</Label>
                <Input
                  id="tel"
                  value={formData.tel}
                  onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                  placeholder="0212 123 4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gsm">GSM</Label>
                <Input
                  id="gsm"
                  value={formData.gsm}
                  onChange={(e) => setFormData({ ...formData, gsm: e.target.value })}
                  placeholder="0532 111 2233"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="mail">E-posta *</Label>
                <Input
                  id="mail"
                  type="email"
                  value={formData.mail}
                  onChange={(e) => setFormData({ ...formData, mail: e.target.value })}
                  placeholder="ornek@firma.com"
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
                disabled={!formData.adiSoyadi || !formData.gorevi || !formData.mail}
              >
                <Check size={18} className="mr-2" />
                {editingContact ? 'Güncelle' : 'Ekle'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
