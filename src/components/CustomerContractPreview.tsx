// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 CUSTOMER CONTRACT PREVIEW - Müşteri Özelinde Sözleşme Görüntüleme
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { templateApi, ContractTemplate } from '../utils/contractApi';
import { FileText, Eye, X, RefreshCw, Maximize2, Edit } from 'lucide-react';
import { toast } from 'sonner';

// Lazy load the fullscreen editor to prevent SSR issues
const FullscreenContractEditor = lazy(() => 
  import('./FullscreenContractEditor').then(m => ({ default: m.FullscreenContractEditor }))
);

// Müşteri veri yapısı
export interface CustomerData {
  id: string;
  cariAdi: string;
  cariHesapKodu: string;
  vergiDairesi: string;
  vergiNo: string;
  adres: string;
  tel: string;
  email: string;
  yetkiliAdiSoyadi?: string;
  // Diğer alanlar...
}

interface CustomerContractPreviewProps {
  customer: CustomerData;
}

export function CustomerContractPreview({ customer }: CustomerContractPreviewProps) {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState<ContractTemplate | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [fullscreenEditorOpen, setFullscreenEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await templateApi.list(true); // Sadece aktif şablonlar
      setTemplates(data);
    } catch (error: any) {
      console.error('Şablonlar yüklenirken hata:', error);
      
      // Tablo yoksa kullanıcıyı bilgilendir
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.warn('⚠️ contract_templates tablosu henüz oluşturulmamış. SQL script çalıştırın.');
        // Sessizce handle et - toast gösterme (spam önlemek için)
        setTemplates([]); // Boş array set et
      } else {
        toast.error('Şablonlar yüklenemedi');
      }
    } finally {
      setLoading(false);
    }
  };

  // Şablondaki değişkenleri müşteri verisiyle değiştiren fonksiyon
  const fillTemplateVariables = (htmlContent: string, customerData: CustomerData): string => {
    let filledContent = htmlContent;

    // Değişken mapping'i - Hem büyük hem küçük harfli desteklenir
    const variableMap: Record<string, string> = {
      // Müşteri bilgileri - Büyük harf
      '{{MUSTERI_UNVAN}}': customerData.cariAdi || '',
      '{{MUSTERI_ADI}}': customerData.cariAdi || '',
      '{{CARI_HESAP_KODU}}': customerData.cariHesapKodu || '',
      '{{VERGI_DAIRESI}}': customerData.vergiDairesi || '',
      '{{VERGI_NO}}': customerData.vergiNo || '',
      '{{VERGI_NUMARASI}}': customerData.vergiNo || '',
      '{{ADRES}}': customerData.adres || '',
      '{{TELEFON}}': customerData.tel || '',
      '{{TEL}}': customerData.tel || '',
      '{{EMAIL}}': customerData.email || '',
      '{{EPOSTA}}': customerData.email || '',
      '{{YETKILI_ADI_SOYADI}}': customerData.yetkiliAdiSoyadi || '',
      
      // Müşteri bilgileri - Küçük harf (backward compatibility)
      '{{musteri_unvan}}': customerData.cariAdi || '',
      '{{musteri_adi}}': customerData.cariAdi || '',
      '{{unvan}}': customerData.cariAdi || '',
      '{{cari_hesap_kodu}}': customerData.cariHesapKodu || '',
      '{{vergi_dairesi}}': customerData.vergiDairesi || '',
      '{{vergi_no}}': customerData.vergiNo || '',
      '{{adres}}': customerData.adres || '',
      '{{telefon}}': customerData.tel || '',
      '{{tel}}': customerData.tel || '',
      '{{email}}': customerData.email || '',
      '{{eposta}}': customerData.email || '',
      '{{yetkili_adi_soyadi}}': customerData.yetkiliAdiSoyadi || '',
      '{{yetkili_kisi}}': customerData.yetkiliAdiSoyadi || '',
      
      // Tarih bilgileri - Büyük harf
      '{{BUGUN}}': new Date().toLocaleDateString('tr-TR'),
      '{{TARIH}}': new Date().toLocaleDateString('tr-TR'),
      '{{YIL}}': new Date().getFullYear().toString(),
      '{{AY}}': (new Date().getMonth() + 1).toString().padStart(2, '0'),
      '{{GUN}}': new Date().getDate().toString().padStart(2, '0'),
      
      // Tarih bilgileri - Küçük harf
      '{{bugun}}': new Date().toLocaleDateString('tr-TR'),
      '{{tarih}}': new Date().toLocaleDateString('tr-TR'),
      '{{yil}}': new Date().getFullYear().toString(),
      '{{ay}}': (new Date().getMonth() + 1).toString().padStart(2, '0'),
      '{{gun}}': new Date().getDate().toString().padStart(2, '0'),
      
      // Firma bilgileri (OXİVO) - Büyük harf
      '{{FIRMA_UNVAN}}': 'OXİVO Ödeme ve Elektronik Para Hizmetleri A.Ş.',
      '{{FIRMA_ADRES}}': 'Büyükdere Cad. No:127 Esentepe, Şişli/İstanbul',
      '{{FIRMA_TELEFON}}': '+90 212 123 45 67',
      '{{FIRMA_EMAIL}}': 'info@oxivo.com.tr',
      '{{FIRMA_VERGI_DAIRESI}}': 'Mecidiyeköy Vergi Dairesi',
      '{{FIRMA_VERGI_NO}}': '1234567890',
      
      // Firma bilgileri (OXİVO) - Küçük harf
      '{{firma_unvan}}': 'OXİVO Ödeme ve Elektronik Para Hizmetleri A.Ş.',
      '{{firma_adres}}': 'Büyükdere Cad. No:127 Esentepe, Şişli/İstanbul',
      '{{firma_telefon}}': '+90 212 123 45 67',
      '{{firma_email}}': 'info@oxivo.com.tr',
      '{{firma_vergi_dairesi}}': 'Mecidiyeköy Vergi Dairesi',
      '{{firma_vergi_no}}': '1234567890',
    };

    // Tüm değişkenleri değiştir
    Object.entries(variableMap).forEach(([variable, value]) => {
      const regex = new RegExp(variable.replace(/[{}]/g, '\\\\$&'), 'g');
      filledContent = filledContent.replace(regex, value);
    });

    return filledContent;
  };

  // Preview için doldurulmuş HTML
  const previewHtml = useMemo(() => {
    if (!previewTemplate) return '';
    return fillTemplateVariables(previewTemplate.content_html, customer);
  }, [previewTemplate, customer]);

  const handlePreview = (template: ContractTemplate) => {
    setPreviewTemplate(template);
    setPreviewDialogOpen(true);
  };

  const handleEdit = (template: ContractTemplate) => {
    setEditingTemplate(template);
    setFullscreenEditorOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          <RefreshCw className="animate-spin mx-auto mb-2" size={32} />
          <p>Sözleşme şablonları yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="mx-auto text-gray-400 mb-3" size={48} />
          <p className="text-gray-600 mb-2">Henüz sözleşme şablonu tanımlanmamış</p>
          <p className="text-sm text-gray-500">
            Sözleşme şablonlarını DSYM modülünden tanımlayabilirsiniz
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={20} className="text-purple-600" />
            Sözleşme Şablonları
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Aşağıdaki şablonlar müşteri bilgileriyle otomatik doldurulacaktır
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <FileText size={24} className="text-blue-600" />
                    <div className="flex-1">
                      <h4 className="text-sm">{template.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-blue-50">
                          v{template.version}
                        </Badge>
                        {template.auto_fill_fields && template.auto_fill_fields.length > 0 && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                            {template.auto_fill_fields.length} alan otomatik
                          </Badge>
                        )}
                        {template.manual_fields && template.manual_fields.length > 0 && (
                          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                            {template.manual_fields.length} alan manuel
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreview(template)}
                      className="gap-2"
                    >
                      <Eye size={16} />
                      Önizle
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(template)}
                      className="gap-2"
                    >
                      <Edit size={16} />
                      Düzenle
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bilgilendirme */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm text-blue-900 mb-2">🔄 Otomatik Doldurulacak Alanlar</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-blue-800">
              <div>• <code className="bg-blue-100 px-1 rounded">{'{{MUSTERI_UNVAN}}'}</code> → {customer.cariAdi}</div>
              <div>• <code className="bg-blue-100 px-1 rounded">{'{{VERGI_NO}}'}</code> → {customer.vergiNo}</div>
              <div>• <code className="bg-blue-100 px-1 rounded">{'{{VERGI_DAIRESI}}'}</code> → {customer.vergiDairesi}</div>
              <div>• <code className="bg-blue-100 px-1 rounded">{'{{ADRES}}'}</code> → {customer.adres?.substring(0, 20)}...</div>
              <div>• <code className="bg-blue-100 px-1 rounded">{'{{TELEFON}}'}</code> → {customer.tel}</div>
              <div>• <code className="bg-blue-100 px-1 rounded">{'{{EMAIL}}'}</code> → {customer.email}</div>
              <div>• <code className="bg-blue-100 px-1 rounded">{'{{BUGUN}}'}</code> → {new Date().toLocaleDateString('tr-TR')}</div>
              <div>• <code className="bg-blue-100 px-1 rounded">{'{{FIRMA_UNVAN}}'}</code> → OXİVO A.Ş.</div>
            </div>
            <p className="text-xs text-blue-700 mt-3 italic">
              ℹ️ Şablonlardaki değişkenler yukarıdaki müşteri bilgileriyle otomatik değiştirilir
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText size={20} />
                {previewTemplate?.name} - Önizleme
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewDialogOpen(false)}
              >
                <X size={20} />
              </Button>
            </div>
          </DialogHeader>

          {/* Template Info */}
          <div className="flex items-center gap-2 mb-4">
            <Badge>{previewTemplate?.category}</Badge>
            <Badge variant="outline">v{previewTemplate?.version}</Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              ✓ Müşteri bilgileriyle dolduruldu
            </Badge>
          </div>

          {/* HTML Content */}
          <div
            className="border border-gray-200 rounded-lg p-6 bg-white"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
            style={{
              fontFamily: 'Arial, sans-serif',
              lineHeight: '1.6',
              color: '#333',
            }}
          />

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Kapat
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setPreviewDialogOpen(false);
                if (previewTemplate) {
                  handleEdit(previewTemplate);
                }
              }}
              className="gap-2"
            >
              <Maximize2 size={16} />
              Tam Ekran Düzenle
            </Button>
            <Button onClick={() => toast.info('Sözleşme gönderimi aktif değil')}>
              Bu Şablonu Gönder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Editor */}
      {editingTemplate && (
        <Suspense fallback={<div>Loading...</div>}>
          <FullscreenContractEditor
            isOpen={fullscreenEditorOpen}
            onClose={() => setFullscreenEditorOpen(false)}
            customerId={customer.id}
            templateId={editingTemplate.id}
            templateName={editingTemplate.name}
            initialContent={fillTemplateVariables(editingTemplate.content_html, customer)}
            onSave={loadTemplates}
          />
        </Suspense>
      )}
    </>
  );
}