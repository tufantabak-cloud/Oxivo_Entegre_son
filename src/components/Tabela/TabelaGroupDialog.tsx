// TABELA Grup Dialog Bileşeni
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { TabelaGroupDialogProps } from './types';

export default function TabelaGroupDialog({
  isOpen,
  onClose,
  groupFormData,
  onGroupFormDataChange,
  onCreateGroup,
  editingGroup,
  availableRecords,
}: TabelaGroupDialogProps) {
  const handleRecordToggle = (recordId: string) => {
    const currentIds = groupFormData.selectedRecordsForGroup;
    const newIds = currentIds.includes(recordId)
      ? currentIds.filter(id => id !== recordId)
      : [...currentIds, recordId];
    
    onGroupFormDataChange({ selectedRecordsForGroup: newIds });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingGroup ? 'Grup Düzenle' : 'Yeni Grup Oluştur'}</DialogTitle>
          <DialogDescription>
            TABELA kayıtlarını gruplandırarak yönetebilirsiniz
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Grup İsmi */}
          <div className="space-y-2">
            <Label htmlFor="groupName">Grup İsmi *</Label>
            <Input
              id="groupName"
              value={groupFormData.groupName}
              onChange={(e) => onGroupFormDataChange({ groupName: e.target.value })}
              placeholder="Örn: 2024 Q1 Kampanyası"
            />
          </div>

          {/* Geçerlilik Tarihleri */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="groupStartDate">Geçerlilik Başlangıcı *</Label>
              <Input
                id="groupStartDate"
                type="date"
                value={groupFormData.groupStartDate}
                onChange={(e) => onGroupFormDataChange({ groupStartDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupEndDate">Geçerlilik Bitişi</Label>
              <Input
                id="groupEndDate"
                type="date"
                value={groupFormData.groupEndDate}
                onChange={(e) => onGroupFormDataChange({ groupEndDate: e.target.value })}
              />
            </div>
          </div>

          {/* Aktif/Pasif Durumu */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div>
              <Label htmlFor="groupAktif">Grup Durumu</Label>
              <p className="text-sm text-gray-600">
                {groupFormData.groupAktif ? 'Grup hakediş için aktif' : 'Grup hakediş için pasif'}
              </p>
            </div>
            <Switch
              id="groupAktif"
              checked={groupFormData.groupAktif}
              onCheckedChange={(checked) => onGroupFormDataChange({ groupAktif: checked })}
            />
          </div>

          {/* TABELA Kayıtları Seçimi */}
          <div className="space-y-2">
            <Label>TABELA Kayıtları *</Label>
            <div className="max-h-64 overflow-y-auto border rounded-lg">
              {availableRecords.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {editingGroup
                    ? 'Gruba eklenebilecek başka kayıt bulunmuyor'
                    : 'Gruplama için uygun kayıt bulunmuyor'}
                </div>
              ) : (
                <div className="divide-y">
                  {availableRecords.map((record) => (
                    <div
                      key={record.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                      onClick={() => handleRecordToggle(record.id)}
                    >
                      <input
                        type="checkbox"
                        checked={groupFormData.selectedRecordsForGroup.includes(record.id)}
                        onChange={() => handleRecordToggle(record.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <div className="flex-1 flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                          {record.urun}
                        </Badge>
                        <span>{record.gelirModeli.ad}</span>
                        <Badge variant={record.yurtIciDisi === 'Yurt İçi' ? 'default' : 'secondary'}>
                          {record.yurtIciDisi}
                        </Badge>
                        <Badge variant="outline">
                          {record.kartTipi}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-600">
              {groupFormData.selectedRecordsForGroup.length} kayıt seçildi
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button onClick={onCreateGroup}>
            {editingGroup ? 'Güncelle' : 'Grup Oluştur'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}