import React, { useState, useMemo, useCallback } from 'react';
import { JobTitle } from './DefinitionsModule';
import { Plus, Edit, Trash2, X, Check, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
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

interface JobTitlesTabProps {
  jobTitles: JobTitle[];
  onJobTitlesChange: (titles: JobTitle[]) => void;
}

// ⚡ MEMORY OPTIMIZATION: React.memo prevents re-renders when props haven't changed
export const JobTitlesTab = React.memo(function JobTitlesTab({ jobTitles, onJobTitlesChange }: JobTitlesTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState<JobTitle | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [titleToDelete, setTitleToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<JobTitle>({
    id: '',
    unvan: '',
    aciklama: '',
    aktif: true,
    olusturmaTarihi: '',
  });

  // ⚡ PERFORMANCE: useCallback prevents function recreation
  const handleAdd = useCallback(() => {
    setEditingTitle(null);
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      id: '',
      unvan: '',
      aciklama: '',
      aktif: true,
      olusturmaTarihi: today,
    });
    setIsDialogOpen(true);
  }, []);

  const handleEdit = useCallback((title: JobTitle) => {
    setEditingTitle(title);
    setFormData(title);
    setIsDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    setTitleToDelete(id);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (titleToDelete) {
      onJobTitlesChange(jobTitles.filter((t) => t.id !== titleToDelete));
      setTitleToDelete(null);
      setDeleteConfirmOpen(false);
    }
  }, [titleToDelete, jobTitles, onJobTitlesChange]);

  const handleSave = useCallback(() => {
    if (editingTitle) {
      // Update existing
      onJobTitlesChange(
        jobTitles.map((t) => (t.id === editingTitle.id ? formData : t))
      );
    } else {
      // Add new
      onJobTitlesChange([
        ...jobTitles,
        { ...formData, id: crypto.randomUUID() }, // ✅ UUID GENERATION for Supabase compatibility
      ]);
    }
    setIsDialogOpen(false);
  }, [editingTitle, formData, jobTitles, onJobTitlesChange]);

  const toggleActive = useCallback((id: string) => {
    onJobTitlesChange(
      jobTitles.map((t) => (t.id === id ? { ...t, aktif: !t.aktif } : t))
    );
  }, [jobTitles, onJobTitlesChange]);

  // ⚡ PERFORMANCE: useMemo caches filtered list
  const filteredTitles = useMemo(() => {
    if (!searchTerm.trim()) return jobTitles;
    
    const lowerSearch = searchTerm.toLowerCase();
    return jobTitles.filter(
      (title) =>
        title.unvan?.toLowerCase().includes(lowerSearch) ||
        title.aciklama?.toLowerCase().includes(lowerSearch)
    );
  }, [jobTitles, searchTerm]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Görev/Ünvan Tanımları</CardTitle>
          <Button onClick={handleAdd} className="flex items-center space-x-2">
            <Plus size={18} />
            <span>Yeni Görev Ekle</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <Input
            id="job-titles-search"
            type="text"
            placeholder="Görev ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ünvan</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Oluşturma Tarihi</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTitles.length === 0 ? (
                <TableRow key="empty-row">
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    {searchTerm ? 'Görev bulunamadı' : 'Henüz görev tanımlanmamış'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTitles.map((title) => (
                  <TableRow key={title.id}>
                    <TableCell>
                      <span className="font-medium">{title.unvan}</span>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {title.aciklama || '-'}
                    </TableCell>
                    <TableCell>{formatDate(title.olusturmaTarihi)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={title.aktif}
                          onCheckedChange={() => toggleActive(title.id)}
                        />
                        <Badge
                          variant={title.aktif ? 'default' : 'secondary'}
                        >
                          {title.aktif ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(title)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(title.id)}
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

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-600">
            Toplam <strong>{filteredTitles.length}</strong> görev tanımı
          </span>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>
              Aktif: <strong>{filteredTitles.filter((t) => t.aktif).length}</strong>
            </span>
            <span>
              Pasif: <strong>{filteredTitles.filter((t) => !t.aktif).length}</strong>
            </span>
          </div>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTitle ? 'Görev Düzenle' : 'Yeni Görev Ekle'}
              </DialogTitle>
              <DialogDescription>
                Sistemde kullanılacak görev/ünvan tanımını girin.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="unvan">Ünvan *</Label>
                <Input
                  id="unvan"
                  value={formData.unvan || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, unvan: e.target.value })
                  }
                  placeholder="Örn: Genel Müdür"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aciklama">Açıklama</Label>
                <Textarea
                  id="aciklama"
                  value={formData.aciklama || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, aciklama: e.target.value })
                  }
                  placeholder="Görev/ünvan hakkında kısa açıklama"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="aktif"
                  checked={formData.aktif}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, aktif: checked })
                  }
                />
                <Label htmlFor="aktif" className="cursor-pointer">
                  Bu görev aktif olsun
                </Label>
              </div>

              {editingTitle && (
                <div className="text-sm text-gray-500">
                  Oluşturma Tarihi: {formatDate(formData.olusturmaTarihi)}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X size={18} className="mr-2" />
                İptal
              </Button>
              <Button onClick={handleSave} disabled={!formData.unvan.trim()}>
                <Check size={18} className="mr-2" />
                {editingTitle ? 'Güncelle' : 'Ekle'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Görevi Sil</AlertDialogTitle>
              <AlertDialogDescription>
                Bu görev tanımını silmek istediğinizden emin misiniz? Bu işlem geri
                alınamaz ve bu görevi kullanan kayıtlar etkilenebilir.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700"
              >
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
});
