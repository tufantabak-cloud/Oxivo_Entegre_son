// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 FULLSCREEN CONTRACT EDITOR - Tam Ekran Sözleşme Düzenleme
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import {
  X,
  Save,
  Bold,
  Italic,
  List,
  ListOrdered,
  Undo,
  Redo,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { supabase } from '../utils/supabaseClient';
import { getCurrentUserId } from '../utils/authBypass';

interface FullscreenContractEditorProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  templateId: string;
  templateName: string;
  initialContent: string;
  onSave?: () => void;
}

export function FullscreenContractEditor({
  isOpen,
  onClose,
  customerId,
  templateId,
  templateName,
  initialContent,
  onSave: onSaveCallback,
}: FullscreenContractEditorProps) {
  const [saving, setSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [editorError, setEditorError] = useState(false);

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
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-8 focus:outline-none min-h-[calc(100vh-200px)]',
      },
    },
    onError: ({ error }) => {
      console.error('TipTap Editor Error:', error);
      setEditorError(true);
      toast.error('Editor yüklenemedi');
    },
  });

  useEffect(() => {
    if (editor && isOpen) {
      editor.commands.setContent(initialContent);
    }
  }, [isOpen, initialContent, editor]);

  // SSR Safety: Don't render on server
  if (typeof window === 'undefined') {
    return null;
  }

  const handleSave = async () => {
    if (!editor) {
      toast.error('Editör hazır değil');
      return;
    }

    try {
      setSaving(true);

      const filledContent = editor.getHTML();
      const userId = getCurrentUserId();

      // Önce mevcut kaydı kontrol et
      const { data: existingContract, error: checkError } = await supabase
        .from('customer_contracts')
        .select('id')
        .eq('customer_id', customerId)
        .eq('template_id', templateId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingContract) {
        // Güncelle
        const { error: updateError } = await supabase
          .from('customer_contracts')
          .update({
            filled_content_html: filledContent,
            updated_by: userId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingContract.id);

        if (updateError) throw updateError;

        toast.success('Sözleşme güncellendi');
      } else {
        // Yeni kayıt oluştur
        const { error: insertError } = await supabase
          .from('customer_contracts')
          .insert({
            customer_id: customerId,
            template_id: templateId,
            filled_content_html: filledContent,
            status: 'draft',
            created_by: userId,
            updated_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;

        toast.success('Sözleşme kaydedildi');
      }

      if (onSaveCallback) {
        onSaveCallback();
      }

      onClose();
    } catch (error: any) {
      console.error('Sözleşme kaydedilirken hata:', error);
      toast.error('Sözleşme kaydedilemedi: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (editor) {
      const hasChanges = editor.getHTML() !== initialContent;
      if (hasChanges) {
        const confirmed = confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinize emin misiniz?');
        if (!confirmed) return;
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl">
              {templateName} - Düzenleme
            </h2>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="gap-2"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              {isFullscreen ? 'Küçült' : 'Tam Ekran'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="gap-2"
              disabled={saving}
            >
              <X size={18} />
              İptal
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="gap-2"
              disabled={saving}
            >
              <Save size={18} />
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        {editor && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
            <div className="flex items-center gap-2 flex-wrap">
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
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Geri Al"
              >
                <Undo size={18} />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="İleri Al"
              >
                <Redo size={18} />
              </button>

              <div className="ml-auto text-sm text-gray-600">
                Sözleşmeyi düzenleyin ve kaydedin
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editor Content */}
      <div className="overflow-y-auto" style={{ height: 'calc(100vh - 160px)' }}>
        <div className={isFullscreen ? 'max-w-[210mm] mx-auto bg-white' : 'container mx-auto'}>
          {editor ? (
            <EditorContent editor={editor} />
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Editör yükleniyor...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}