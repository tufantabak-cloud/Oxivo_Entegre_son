// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 TEMPLATE LIST - Sözleşme Şablonları
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useEffect, lazy, Suspense } from 'react';
import { Plus, FileText, Edit, Copy, Eye, Trash2 } from 'lucide-react';
import { templateApi, ContractTemplate } from '../../utils/contractApi';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { toast } from 'sonner';

// ✅ Lazy load TipTap editor to prevent SSR issues
const TemplateEditor = lazy(() => 
  import('./TemplateEditor').then(m => ({ default: m.TemplateEditor }))
);

export function TemplateList() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, [showActiveOnly]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await templateApi.list(showActiveOnly);
      setTemplates(data);
    } catch (error: any) {
      toast.error('Hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (template: ContractTemplate) => {
    setEditingTemplate(template);
    setIsEditorOpen(true);
  };

  const handleDuplicate = async (template: ContractTemplate) => {
    try {
      await templateApi.create({
        ...template,
        name: `${template.name} (Kopya)`,
        version: 1,
      });
      toast.success('Şablon kopyalandı');
      loadTemplates();
    } catch (error: any) {
      toast.error('Hata: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu şablonu silmek istediğinizden emin misiniz?')) return;

    try {
      await templateApi.delete(id);
      toast.success('Şablon silindi');
      loadTemplates();
    } catch (error: any) {
      toast.error('Hata: ' + error.message);
    }
  };

  const handleSave = async (template: Partial<ContractTemplate>) => {
    try {
      console.log('💾 [TemplateList] handleSave called with:', template);
      
      if (editingTemplate) {
        console.log('✏️ [TemplateList] Updating existing template:', editingTemplate.id);
        await templateApi.update(editingTemplate.id, template);
        toast.success('Şablon güncellendi');
      } else {
        console.log('➕ [TemplateList] Creating new template');
        await templateApi.create(template);
        toast.success('Şablon oluşturuldu');
      }
      setIsEditorOpen(false);
      loadTemplates();
    } catch (error: any) {
      console.error('❌ [TemplateList] Error saving template:', error);
      toast.error('Hata: ' + error.message);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900">Sözleşme Şablonları</h2>
            <p className="text-gray-500 text-sm mt-1">
              {templates.length} şablon
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="rounded border-gray-300"
              />
              Sadece aktif şablonlar
            </label>
            <Button onClick={handleCreate} className="gap-2">
              <Plus size={18} />
              Yeni Şablon
            </Button>
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Henüz şablon oluşturulmamış</p>
            <Button onClick={handleCreate} className="mt-4 gap-2">
              <Plus size={18} />
              İlk Şablonu Oluştur
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="!max-w-none w-[98vw] h-[98vh] max-h-[98vh] flex flex-col p-0 m-4">
          <DialogHeader className="px-6 py-4 border-b border-gray-200">
            <DialogTitle>
              {editingTemplate ? 'Şablonu Düzenle' : 'Yeni Şablon Oluştur'}
            </DialogTitle>
            <DialogDescription>
              Sözleşme şablonunu oluşturun veya düzenleyin
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto px-6 py-4">
            <Suspense fallback={<div className="text-center py-12 text-gray-500">Yükleniyor...</div>}>
              <TemplateEditor
                template={editingTemplate}
                onSave={handleSave}
                onCancel={() => setIsEditorOpen(false)}
              />
            </Suspense>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEMPLATE CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface TemplateCardProps {
  template: ContractTemplate;
  onEdit: (template: ContractTemplate) => void;
  onDuplicate: (template: ContractTemplate) => void;
  onDelete: (id: string) => void;
}

function TemplateCard({ template, onEdit, onDuplicate, onDelete }: TemplateCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <FileText size={24} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-gray-900">{template.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                {template.category}
              </span>
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                v{template.version}
              </span>
              {!template.is_active && (
                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">
                  Pasif
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-600 space-y-1 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Otomatik Alanlar:</span>
          <span>{template.auto_fill_fields?.length || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Manuel Alanlar:</span>
          <span>{template.manual_fields?.length || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Hard Copy:</span>
          <span>{template.requires_hard_copy ? 'Gerekli' : 'Gerekli Değil'}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(template)}
          className="flex-1 gap-2"
        >
          <Edit size={16} />
          Düzenle
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDuplicate(template)}
        >
          <Copy size={16} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(template.id)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
}