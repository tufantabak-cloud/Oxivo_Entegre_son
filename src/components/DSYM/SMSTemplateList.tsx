// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 SMS TEMPLATE LIST - SMS Şablonları
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useEffect } from 'react';
import { Plus, MessageSquare, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { smsTemplateApi, SMSTemplate } from '../../utils/contractApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';

export function SMSTemplateList() {
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await smsTemplateApi.list();
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

  const handleEdit = (template: SMSTemplate) => {
    setEditingTemplate(template);
    setIsEditorOpen(true);
  };

  // Eğer editor açıksa, sadece editoru göster
  if (isEditorOpen) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Editor Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditorOpen(false)}
              className="gap-2"
            >
              <ArrowLeft size={18} />
              Geri
            </Button>
            <div>
              <h2 className="text-gray-900">
                {editingTemplate ? 'SMS Şablonu Düzenle' : 'Yeni SMS Şablonu'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                SMS mesaj içeriği oluşturun (max 160 karakter)
              </p>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-auto p-6">
          <SMSTemplateEditor
            template={editingTemplate}
            onSave={async (template) => {
              try {
                if (editingTemplate) {
                  await smsTemplateApi.update(editingTemplate.id, template);
                  toast.success('Şablon güncellendi');
                } else {
                  await smsTemplateApi.create(template);
                  toast.success('Şablon oluşturuldu');
                }
                setIsEditorOpen(false);
                loadTemplates();
              } catch (error: any) {
                toast.error('Hata: ' + error.message);
              }
            }}
            onCancel={() => setIsEditorOpen(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-gray-900">SMS Şablonları</h2>
            <p className="text-gray-500 text-sm mt-1">
              Müşterilere gönderilecek SMS mesajları (160 karakter)
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus size={18} />
            Yeni Şablon
          </Button>
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <SMSTemplateCard
                key={template.id}
                template={template}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SMS TEMPLATE CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface SMSTemplateCardProps {
  template: SMSTemplate;
  onEdit: (template: SMSTemplate) => void;
}

function SMSTemplateCard({ template, onEdit }: SMSTemplateCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-green-50 rounded-lg">
            <MessageSquare size={24} className="text-green-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-gray-900">{template.name}</h3>
              {template.is_default && (
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                  Varsayılan
                </span>
              )}
            </div>
            <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded font-mono">
              {template.content}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {template.content.length} / 160 karakter
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(template)}
        >
          <Edit size={16} />
        </Button>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SMS TEMPLATE EDITOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface SMSTemplateEditorProps {
  template: SMSTemplate | null;
  onSave: (template: Partial<SMSTemplate>) => void;
  onCancel: () => void;
}

function SMSTemplateEditor({ template, onSave, onCancel }: SMSTemplateEditorProps) {
  const [name, setName] = useState(template?.name || '');
  const [content, setContent] = useState(
    template?.content ||
      'Sayın {{musteri_adi}}, sözleşme dökümanlarınız hazır. Lütfen email adresinizi kontrol edin.'
  );
  const [isDefault, setIsDefault] = useState(template?.is_default || false);

  const charCount = content.length;
  const isOverLimit = charCount > 160;

  const handleSave = () => {
    if (!name.trim() || !content.trim()) {
      alert('Ad ve içerik gerekli!');
      return;
    }

    if (isOverLimit) {
      alert('SMS içeriği 160 karakteri geçemez!');
      return;
    }

    onSave({
      name,
      content,
      is_default: isDefault,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Şablon Adı *</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Örn: Standart Bilgilendirme"
        />
      </div>

      <div>
        <Label>SMS İçeriği * (Max 160 karakter)</Label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg font-mono text-sm min-h-[120px] ${
            isOverLimit ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          maxLength={200}
        />
        <div className="flex items-center justify-between mt-1">
          <p className={`text-sm ${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
            {charCount} / 160 karakter
            {isOverLimit && ' - Limit aşıldı!'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="is-default-sms"
          checked={isDefault}
          onCheckedChange={(checked) => setIsDefault(checked as boolean)}
        />
        <Label htmlFor="is-default-sms" className="text-sm cursor-pointer">
          Varsayılan şablon olarak ayarla
        </Label>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
        <p className="text-blue-900 mb-1">Kullanılabilir Değişkenler:</p>
        <div className="text-blue-700 space-y-1">
          <div>• <code>{'{{musteri_adi}}'}</code> - Müşteri adı</div>
          <div>• <code>{'{{firma_adi}}'}</code> - Firma adı</div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Button variant="outline" onClick={onCancel}>
          İptal
        </Button>
        <Button onClick={handleSave} disabled={isOverLimit}>
          Kaydet
        </Button>
      </div>
    </div>
  );
}