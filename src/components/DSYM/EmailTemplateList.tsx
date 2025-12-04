// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 EMAIL TEMPLATE LIST - Email Şablonları
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useEffect } from 'react';
import { Plus, Mail, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { emailTemplateApi, EmailTemplate } from '../../src/utils/contractApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';

export function EmailTemplateList() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await emailTemplateApi.list();
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

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setIsEditorOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu email şablonunu silmek istediğinizden emin misiniz?')) return;

    try {
      // Silme işlemi (API'de henüz yok, eklenmeli)
      toast.info('Silme özelliği yakında eklenecek');
    } catch (error: any) {
      toast.error('Hata: ' + error.message);
    }
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
                {editingTemplate ? 'Email Şablonu Düzenle' : 'Yeni Email Şablonu'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Email başlığı ve içeriği oluşturun
              </p>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-auto p-6">
          <EmailTemplateEditor
            template={editingTemplate}
            onSave={async (template) => {
              try {
                if (editingTemplate) {
                  await emailTemplateApi.update(editingTemplate.id, template);
                  toast.success('Şablon güncellendi');
                } else {
                  await emailTemplateApi.create(template);
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
            <h2 className="text-gray-900">Email Şablonları</h2>
            <p className="text-gray-500 text-sm mt-1">
              Müşterilere gönderilecek email içerikleri
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
              <EmailTemplateCard
                key={template.id}
                template={template}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EMAIL TEMPLATE CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface EmailTemplateCardProps {
  template: EmailTemplate;
  onEdit: (template: EmailTemplate) => void;
  onDelete: (id: string) => void;
}

function EmailTemplateCard({ template, onEdit, onDelete }: EmailTemplateCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Mail size={24} className="text-blue-600" />
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
            <p className="text-sm text-gray-600 mb-2">{template.subject}</p>
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              {template.body_html.substring(0, 150)}...
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(template)}
          >
            <Edit size={16} />
          </Button>
          {!template.is_default && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(template.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EMAIL TEMPLATE EDITOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface EmailTemplateEditorProps {
  template: EmailTemplate | null;
  onSave: (template: Partial<EmailTemplate>) => void;
  onCancel: () => void;
}

function EmailTemplateEditor({ template, onSave, onCancel }: EmailTemplateEditorProps) {
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [bodyHtml, setBodyHtml] = useState(
    template?.body_html ||
      `<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2>Sayın {{musteri_adi}},</h2>
  <p>Sözleşme dökümanlarınız hazır.</p>
  <p>Lütfen aşağıdaki linke tıklayarak dökümanları inceleyin ve onaylayın:</p>
  <p><a href="{{link}}">{{link}}</a></p>
  <br>
  <p>Saygılarımızla,<br>{{firma_adi}}</p>
</body>
</html>`
  );
  const [isDefault, setIsDefault] = useState(template?.is_default || false);

  const handleSave = () => {
    if (!name.trim() || !subject.trim()) {
      alert('Ad ve başlık gerekli!');
      return;
    }

    onSave({
      name,
      subject,
      body_html: bodyHtml,
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
          placeholder="Örn: Standart Sözleşme Maili"
        />
      </div>

      <div>
        <Label>Email Başlığı *</Label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Örn: {{firma_adi}} - Sözleşme Onayı"
        />
      </div>

      <div>
        <Label>Email İçeriği (HTML) *</Label>
        <textarea
          value={bodyHtml}
          onChange={(e) => setBodyHtml(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm min-h-[300px]"
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="is-default"
          checked={isDefault}
          onCheckedChange={(checked) => setIsDefault(checked as boolean)}
        />
        <Label htmlFor="is-default" className="text-sm cursor-pointer">
          Varsayılan şablon olarak ayarla
        </Label>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
        <p className="text-blue-900 mb-1">Kullanılabilir Değişkenler:</p>
        <div className="text-blue-700 space-y-1">
          <div>• <code>{'{{musteri_adi}}'}</code> - Müşteri adı</div>
          <div>• <code>{'{{firma_adi}}'}</code> - Firma adı</div>
          <div>• <code>{'{{link}}'}</code> - Sözleşme linki</div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Button variant="outline" onClick={onCancel}>
          İptal
        </Button>
        <Button onClick={handleSave}>
          Kaydet
        </Button>
      </div>
    </div>
  );
}