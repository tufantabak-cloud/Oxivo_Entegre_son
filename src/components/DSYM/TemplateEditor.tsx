// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 TEMPLATE EDITOR - Zengin Metin Editörü (TipTap)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Table as TableIcon,
  Image as ImageIcon,
  Variable,
  Save,
  X,
} from 'lucide-react';
import { ContractTemplate } from '../../src/utils/contractApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';

interface TemplateEditorProps {
  template: ContractTemplate | null;
  onSave: (template: Partial<ContractTemplate>) => void;
  onCancel: () => void;
}

// Otomatik doldurulacak alanlar
const AUTO_FILL_FIELDS = [
  { key: 'unvan', label: 'Ünvan' },
  { key: 'vergi_no', label: 'Vergi No' },
  { key: 'vergi_dairesi', label: 'Vergi Dairesi' },
  { key: 'adres', label: 'Adres' },
  { key: 'telefon', label: 'Telefon' },
  { key: 'email', label: 'Email' },
  { key: 'yetkili_kisi', label: 'Yetkili Kişi' },
  { key: 'tarih', label: 'Bugünün Tarihi' },
];

export function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [name, setName] = useState(template?.name || '');
  const [category, setCategory] = useState(template?.category || 'Sözleşme');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [requiresHardCopy, setRequiresHardCopy] = useState(template?.requires_hard_copy ?? true);
  const [manualFields, setManualFields] = useState<any[]>(template?.manual_fields || []);
  const [showVariableMenu, setShowVariableMenu] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image,
    ],
    content: template?.content_html || '<p>Sözleşme içeriğini buraya yazın...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-4 border border-gray-200 rounded-lg min-h-[calc(98vh-450px)] focus:outline-none focus:ring-2 focus:ring-blue-500',
      },
    },
  });

  const handleSave = () => {
    console.log('💾 [TemplateEditor] handleSave called');
    
    if (!editor) {
      console.warn('⚠️ [TemplateEditor] Editor is not ready');
      return;
    }
    
    if (!name.trim()) {
      console.warn('⚠️ [TemplateEditor] Name is empty');
      alert('Şablon adı gerekli!');
      return;
    }

    const autoFillFieldKeys = AUTO_FILL_FIELDS.map((f) => f.key);

    const templateData = {
      name,
      category,
      content_html: editor.getHTML(),
      auto_fill_fields: autoFillFieldKeys,
      manual_fields: manualFields,
      requires_hard_copy: requiresHardCopy,
      is_active: true,
      version: template?.version || 1,
      display_order: template?.display_order || 0,
    };

    console.log('📝 [TemplateEditor] Saving template:', templateData);
    
    onSave(templateData);
  };

  const insertVariable = (key: string, label: string, isManual = false) => {
    if (!editor) return;

    const variableHtml = isManual
      ? `<span style="background-color: #fef3c7; padding: 2px 6px; border-radius: 4px;">[MANUEL: ${key}]</span>`
      : `<span style="background-color: #dbeafe; padding: 2px 6px; border-radius: 4px;">{{${key}}}</span>`;

    editor.chain().focus().insertContent(variableHtml).run();
    setShowVariableMenu(false);
  };

  const addManualField = () => {
    const fieldName = prompt('Alan adı (örn: komisyon_orani):');
    if (!fieldName) return;

    const fieldLabel = prompt('Alan etiketi (örn: Komisyon Oranı):');
    if (!fieldLabel) return;

    setManualFields([
      ...manualFields,
      { name: fieldName, label: fieldLabel, type: 'text' },
    ]);

    insertVariable(fieldName, fieldLabel, true);
  };

  const handleCategoryChange = (value: string) => {
    if (value === '__ADD_NEW__') {
      setIsAddingNewCategory(true);
      setNewCategoryName('');
    } else {
      setCategory(value);
      setIsAddingNewCategory(false);
    }
  };

  const handleAddNewCategory = () => {
    if (!newCategoryName.trim()) {
      alert('Kategori adı boş olamaz!');
      return;
    }

    // Yeni kategoriyi custom kategoriler listesine ekle
    setCustomCategories([...customCategories, newCategoryName.trim()]);
    // Yeni kategoriyi seç
    setCategory(newCategoryName.trim());
    // Input'u kapat
    setIsAddingNewCategory(false);
    setNewCategoryName('');
  };

  const handleCancelNewCategory = () => {
    setIsAddingNewCategory(false);
    setNewCategoryName('');
  };

  if (!editor) return null;

  return (
    <div className="space-y-6">
      {/* Genel Bilgiler */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Şablon Adı *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn: Ana Bayilik Sözleşmesi"
          />
        </div>
        <div>
          <Label>Kategori</Label>
          <select
            value={isAddingNewCategory ? '' : category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            disabled={isAddingNewCategory}
          >
            {isAddingNewCategory && <option value="">Yeni kategori ekleniyor...</option>}
            {!isAddingNewCategory && (
              <>
                <option value="Sözleşme">Sözleşme</option>
                <option value="Protokol">Protokol</option>
                <option value="Aydınlatma">Aydınlatma Metni</option>
                <option value="Teminat">Teminat Mektubu</option>
                <option value="Diğer">Diğer</option>
                
                {/* Custom Kategoriler */}
                {customCategories.length > 0 && (
                  <optgroup label="Özel Kategoriler">
                    {customCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </optgroup>
                )}
                
                <option value="__ADD_NEW__" className="text-blue-600">
                  + Yeni Kategori Ekle
                </option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Yeni Kategori Ekleme Alanı */}
      {isAddingNewCategory && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label>Yeni Kategori Adı *</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewCategory();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    handleCancelNewCategory();
                  }
                }}
                placeholder="Örn: Gizlilik Sözleşmesi"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleAddNewCategory}
                disabled={!newCategoryName.trim()}
              >
                ✓ Ekle
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCancelNewCategory}
              >
                ✗ İptal
              </Button>
              <span className="text-xs text-gray-600 ml-2">
                Enter = Ekle | Esc = İptal
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Ayarlar */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="hard-copy"
          checked={requiresHardCopy}
          onCheckedChange={(checked) => setRequiresHardCopy(checked as boolean)}
        />
        <Label htmlFor="hard-copy" className="text-sm cursor-pointer">
          Islak imzalı hard copy gerekli
        </Label>
      </div>

      {/* Editor Toolbar */}
      <div className="border border-gray-200 rounded-lg p-3 flex flex-wrap items-center gap-2 bg-gray-50">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-300' : ''}`}
          title="Kalın"
        >
          <Bold size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-300' : ''}`}
          title="İtalik"
        >
          <Italic size={18} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-300' : ''}`}
          title="Liste"
        >
          <List size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-300' : ''}`}
          title="Numaralı Liste"
        >
          <ListOrdered size={18} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          className="p-2 rounded hover:bg-gray-200"
          title="Tablo Ekle"
        >
          <TableIcon size={18} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowVariableMenu(!showVariableMenu)}
            className="p-2 rounded hover:bg-gray-200 flex items-center gap-2"
            title="Değişken Ekle"
          >
            <Variable size={18} />
            <span className="text-sm">Değişken Ekle</span>
          </button>

          {showVariableMenu && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-10 min-w-[300px]">
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-600">Otomatik Doldurulacak Alanlar</p>
              </div>
              <div className="p-2 max-h-60 overflow-y-auto">
                {AUTO_FILL_FIELDS.map((field) => (
                  <button
                    type="button"
                    key={field.key}
                    onClick={() => insertVariable(field.key, field.label, false)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 rounded flex items-center gap-2"
                  >
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                      {`{{${field.key}}}`}
                    </span>
                    <span className="text-gray-600">{field.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-600 mb-2">Manuel Girilecek Alanlar</p>
                {manualFields.map((field) => (
                  <button
                    type="button"
                    key={field.name}
                    onClick={() => insertVariable(field.name, field.label, true)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-yellow-50 rounded flex items-center gap-2 mb-1"
                  >
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                      {`[MANUEL: ${field.name}]`}
                    </span>
                    <span className="text-gray-600">{field.label}</span>
                  </button>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addManualField}
                  className="w-full mt-2"
                >
                  + Yeni Manuel Alan Ekle
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div>
        <Label className="mb-2 block">Sözleşme İçeriği</Label>
        <EditorContent editor={editor} />
      </div>

      {/* Bilgilendirme */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <p className="text-blue-900 mb-2">💡 Kullanım İpuçları:</p>
        <ul className="text-blue-700 space-y-1 ml-4">
          <li>• Mavi renkli alanlar ({'{{unvan}}'}) müşteri bilgisinden otomatik doldurulur</li>
          <li>• Sarı renkli alanlar ([MANUEL: komisyon]) admin tarafından manuel girilir</li>
          <li>• Tablo eklemek için toolbar'daki tablo butonunu kullanın</li>
        </ul>
      </div>

      {/* Aksiyonlar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel} className="gap-2">
          <X size={18} />
          İptal
        </Button>
        <Button type="button" onClick={handleSave} className="gap-2">
          <Save size={18} />
          Kaydet
        </Button>
      </div>
    </div>
  );
}