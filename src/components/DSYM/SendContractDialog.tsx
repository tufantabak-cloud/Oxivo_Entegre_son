// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 SEND CONTRACT DIALOG - Sözleşme Gönderme
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useEffect } from 'react';
import { FileSignature, Send, Smartphone, Mail } from 'lucide-react';
import { Customer } from '../CustomerModule';
import {
  templateApi,
  emailTemplateApi,
  smsTemplateApi,
  transactionApi,
  documentApi,
  mergeTemplate,
  ContractTemplate,
  EmailTemplate,
  SMSTemplate,
} from '../../utils/contractApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { toast } from 'sonner';

interface SendContractDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer; // Müşteri bilgisi
  onSuccess?: () => void;
}

export function SendContractDialog({ isOpen, onClose, customer, onSuccess }: SendContractDialogProps) {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [smsTemplates, setSMSTemplates] = useState<SMSTemplate[]>([]);
  
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [manualFieldValues, setManualFieldValues] = useState<Record<string, Record<string, any>>>({});
  
  const [sendVia, setSendVia] = useState({ email: true, sms: false });
  const [sendToEmail, setSendToEmail] = useState(customer?.email || '');
  const [sendToPhone, setSendToPhone] = useState(customer?.gsm || '');
  
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState('');
  const [selectedSMSTemplate, setSelectedSMSTemplate] = useState('');
  
  const [salesRepEmail, setSalesRepEmail] = useState('');
  const [bccEmail] = useState('sales@oxivo.eu');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [tmpl, emailTmpl, smsTmpl] = await Promise.all([
        templateApi.list(true),
        emailTemplateApi.list(),
        smsTemplateApi.list(),
      ]);
      
      setTemplates(tmpl);
      setEmailTemplates(emailTmpl);
      setSMSTemplates(smsTmpl);
      
      // Varsayılan şablonları seç
      const defaultEmail = emailTmpl.find(t => t.is_default);
      const defaultSMS = smsTmpl.find(t => t.is_default);
      
      if (defaultEmail) setSelectedEmailTemplate(defaultEmail.id);
      if (defaultSMS) setSelectedSMSTemplate(defaultSMS.id);
    } catch (error: any) {
      toast.error('Hata: ' + error.message);
    }
  };

  const toggleTemplate = (templateId: string) => {
    if (selectedTemplates.includes(templateId)) {
      setSelectedTemplates(selectedTemplates.filter(id => id !== templateId));
      // Manuel alan değerlerini temizle
      const newValues = { ...manualFieldValues };
      delete newValues[templateId];
      setManualFieldValues(newValues);
    } else {
      setSelectedTemplates([...selectedTemplates, templateId]);
      // Manuel alanları başlat
      const template = templates.find(t => t.id === templateId);
      if (template?.manual_fields) {
        setManualFieldValues({
          ...manualFieldValues,
          [templateId]: {},
        });
      }
    }
  };

  const updateManualField = (templateId: string, fieldName: string, value: any) => {
    setManualFieldValues({
      ...manualFieldValues,
      [templateId]: {
        ...(manualFieldValues[templateId] || {}),
        [fieldName]: value,
      },
    });
  };

  const handleSend = async () => {
    if (selectedTemplates.length === 0) {
      alert('En az bir döküman seçmelisiniz!');
      return;
    }

    if (sendVia.email && !sendToEmail) {
      alert('Email adresi gerekli!');
      return;
    }

    if (sendVia.sms && !sendToPhone) {
      alert('Telefon numarası gerekli!');
      return;
    }

    try {
      setLoading(true);

      // 1. Transaction oluştur
      const transaction = await transactionApi.create({
        customer_id: customer.id,
        sales_rep_id: salesRepEmail ? undefined : undefined, // TODO: Satış temsilcisi ID'si
        transaction_name: `${customer.unvan} - Sözleşme Paketi`,
        status: 'draft',
      });

      // 2. Her seçili şablon için döküman oluştur
      for (let i = 0; i < selectedTemplates.length; i++) {
        const templateId = selectedTemplates[i];
        const template = templates.find(t => t.id === templateId);
        if (!template) continue;

        // Müşteri verilerini hazırla
        const customerData = {
          unvan: customer.unvan || '',
          vergi_no: customer.vergi_no || '',
          vergi_dairesi: customer.vergi_dairesi || '',
          adres: customer.adres || '',
          telefon: customer.telefon || customer.gsm || '',
          email: customer.email || '',
          yetkili_kisi: customer.yetkili_adi || '',
          tarih: new Date().toLocaleDateString('tr-TR'),
        };

        // Manuel verileri al
        const manualData = manualFieldValues[templateId] || {};

        // Şablonu merge et
        const finalContent = mergeTemplate(
          template.content_html,
          customerData,
          manualData
        );

        // Döküman oluştur
        await documentApi.create({
          transaction_id: transaction.id,
          template_id: templateId,
          final_content_html: finalContent,
          manual_field_values: manualData,
          display_order: i,
        });
      }

      // 3. Gönderim bilgilerini güncelle
      await transactionApi.send(transaction.id, {
        sent_via: sendVia.email && sendVia.sms ? 'both' : sendVia.email ? 'email' : 'sms',
        sent_to_email: sendVia.email ? sendToEmail : undefined,
        sent_to_phone: sendVia.sms ? sendToPhone : undefined,
      });

      // 4. Email gönder (simüle)
      if (sendVia.email) {
        // TODO: Gerçek email gönderimi (Microsoft 365 SMTP)
        const link = `${window.location.origin}/sozlesme/${transaction.unique_token}`;
        console.log('Email gönderilecek:', {
          to: sendToEmail,
          from: salesRepEmail || 'noreply@oxivo.eu',
          bcc: bccEmail,
          link,
        });
        toast.success(`Email gönderildi (simüle): ${sendToEmail}`);
      }

      // 5. SMS gönder (simüle)
      if (sendVia.sms) {
        // TODO: Gerçek SMS gönderimi
        console.log('SMS gönderilecek:', {
          to: sendToPhone,
          message: `Sözleşme linkiniz: ${window.location.origin}/sozlesme/${transaction.unique_token}`,
        });
        toast.success(`SMS gönderildi (simüle): ${sendToPhone}`);
      }

      toast.success('Sözleşme başarıyla gönderildi!');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error('Hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sözleşme Gönder - {customer?.unvan}</DialogTitle>
          <DialogDescription>
            Müşteriye göndermek istediğiniz dökümanları seçin ve gönderim bilgilerini doldurun
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 1. Döküman Seçimi */}
          <div>
            <Label className="mb-3 block">1️⃣ Döküman Seçimi</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {templates.map((template) => {
                const isSelected = selectedTemplates.includes(template.id);
                return (
                  <div key={template.id} className="border-b border-gray-100 last:border-0 pb-2">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id={`template-${template.id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleTemplate(template.id)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={`template-${template.id}`} className="cursor-pointer">
                          {template.name} <span className="text-xs text-gray-500">(v{template.version})</span>
                        </Label>
                        
                        {/* Manuel Alanlar */}
                        {isSelected && template.manual_fields && template.manual_fields.length > 0 && (
                          <div className="mt-2 ml-6 space-y-2 bg-yellow-50 p-3 rounded border border-yellow-200">
                            <p className="text-xs text-yellow-700 mb-2">Manuel alanları doldurun:</p>
                            {template.manual_fields.map((field: any) => (
                              <div key={field.name}>
                                <Label className="text-xs">{field.label}</Label>
                                <Input
                                  size="sm"
                                  value={manualFieldValues[template.id]?.[field.name] || ''}
                                  onChange={(e) => updateManualField(template.id, field.name, e.target.value)}
                                  placeholder={`Örn: ${field.label}`}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Gönderim Bilgileri */}
          <div>
            <Label className="mb-3 block">2️⃣ Gönderim Bilgileri</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    id="send-email"
                    checked={sendVia.email}
                    onCheckedChange={(checked) => setSendVia({ ...sendVia, email: checked as boolean })}
                  />
                  <Label htmlFor="send-email" className="cursor-pointer">Email Gönder</Label>
                </div>
                {sendVia.email && (
                  <Input
                    type="email"
                    value={sendToEmail}
                    onChange={(e) => setSendToEmail(e.target.value)}
                    placeholder="ornek@firma.com"
                  />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    id="send-sms"
                    checked={sendVia.sms}
                    onCheckedChange={(checked) => setSendVia({ ...sendVia, sms: checked as boolean })}
                  />
                  <Label htmlFor="send-sms" className="cursor-pointer">SMS Bildir</Label>
                </div>
                {sendVia.sms && (
                  <Input
                    type="tel"
                    value={sendToPhone}
                    onChange={(e) => setSendToPhone(e.target.value)}
                    placeholder="+90 532 123 4567"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label className="text-xs">Satış Temsilcisi Email</Label>
                <Input
                  type="email"
                  value={salesRepEmail}
                  onChange={(e) => setSalesRepEmail(e.target.value)}
                  placeholder="ahmet@oxivo.eu"
                />
              </div>
              <div>
                <Label className="text-xs">BCC (Otomatik)</Label>
                <Input type="email" value={bccEmail} disabled className="bg-gray-100" />
              </div>
            </div>
          </div>

          {/* 3. Şablon Seçimi */}
          <div className="grid grid-cols-2 gap-4">
            {sendVia.email && (
              <div>
                <Label>Email Şablonu</Label>
                <select
                  value={selectedEmailTemplate}
                  onChange={(e) => setSelectedEmailTemplate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {emailTemplates.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.name} {tmpl.is_default && '(Varsayılan)'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {sendVia.sms && (
              <div>
                <Label>SMS Şablonu</Label>
                <select
                  value={selectedSMSTemplate}
                  onChange={(e) => setSelectedSMSTemplate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {smsTemplates.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.name} {tmpl.is_default && '(Varsayılan)'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Bilgilendirme */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <p className="text-blue-900">ℹ️ Bilgilendirme:</p>
            <ul className="text-blue-700 mt-2 space-y-1 ml-4">
              <li>• Müşteriye benzersiz bir link gönderilecek</li>
              <li>• Müşteri SMS kodu ile dijital onay verecek</li>
              <li>• Dijital onay sonrası 5 gün içinde hard copy bekleniyor</li>
            </ul>
          </div>
        </div>

        {/* Aksiyonlar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            <X size={18} className="mr-2" />
            İptal
          </Button>
          <Button onClick={handleSend} disabled={loading || selectedTemplates.length === 0}>
            {loading ? (
              'Gönderiliyor...'
            ) : (
              <>
                <Send size={18} className="mr-2" />
                Gönder
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}