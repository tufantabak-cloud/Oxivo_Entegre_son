// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 SEND CONTRACT MODAL - Tekil ve Toplu Sözleşme Gönderimi
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useEffect } from 'react';
import { FileSignature, X } from 'lucide-react';
import { customerApi } from '../../utils/supabaseClient';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { transactionApi } from '../../utils/contractApi';
import { templateApi } from '../../utils/contractApi';
import { emailTemplateApi, smsTemplateApi } from '../../utils/contractApi';

interface SendContractModalProps {
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

interface SelectedTemplate {
  templateId: string;
  order: number;
}

export function SendContractModal({ open, onClose, onRefresh }: SendContractModalProps) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<SelectedTemplate[]>([]); // Multi-select with order
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState('');
  const [selectedSmsTemplate, setSelectedSmsTemplate] = useState('');
  const [transactionName, setTransactionName] = useState('');
  const [sendDate, setSendDate] = useState('');
  const [requiresHardCopy, setRequiresHardCopy] = useState(false);
  const [hardCopyDeadline, setHardCopyDeadline] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Data lists
  const [customers, setCustomers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [smsTemplates, setSmsTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      loadData();
      // Reset form
      setMode('single');
      setSelectedCustomers([]);
      setSelectedTemplates([]);
      setSelectedEmailTemplate('');
      setSelectedSmsTemplate('');
      setTransactionName('');
      setSendDate('');
      setRequiresHardCopy(false);
      setHardCopyDeadline('');
      setSearchQuery('');
      setStatusFilter('all');
    }
  }, [open]);

  const loadData = async () => {
    try {
      console.log('📋 SendContractModal - Loading data...');
      
      // Load customers from Supabase
      console.log('🔍 Fetching customers...');
      const customersResult = await customerApi.getAll();
      console.log('📦 Customers result:', customersResult);
      
      if (customersResult.success) {
        console.log(`✅ Loaded ${customersResult.data?.length || 0} customers`);
        
        // DEBUG: İlk müşterinin field'larını göster
        if (customersResult.data?.length > 0) {
          const firstCustomer = customersResult.data[0];
          console.log('🔍 First customer fields:', Object.keys(firstCustomer));
          console.log('🔍 First customer aktif value:', firstCustomer.aktif);
          console.log('🔍 First customer active value:', (firstCustomer as any).active);
          console.log('🔍 First customer sample:', firstCustomer);
          
          // Count aktif/pasif
          const aktifCount = customersResult.data.filter((c: any) => c.aktif === true).length;
          const pasifCount = customersResult.data.filter((c: any) => c.aktif === false).length;
          const undefinedCount = customersResult.data.filter((c: any) => c.aktif === undefined).length;
          console.log(`📊 Aktif durum: ✅ ${aktifCount} aktif, ❌ ${pasifCount} pasif, ❓ ${undefinedCount} belirsiz`);
        }
        
        setCustomers(customersResult.data || []);
      } else {
        console.error('❌ Customer load failed:', customersResult.error);
        toast.error('Müşteriler yüklenemedi: ' + customersResult.error);
      }
      
      // Load templates (only active ones)
      console.log('🔍 Fetching templates...');
      const templatesData = await templateApi.list(true);
      console.log(`✅ Loaded ${templatesData?.length || 0} templates`);
      setTemplates(templatesData || []);
      
      // Load email templates
      console.log('🔍 Fetching email templates...');
      const emailData = await emailTemplateApi.list();
      console.log(`✅ Loaded ${emailData?.length || 0} email templates`);
      setEmailTemplates(emailData || []);
      
      // Load SMS templates
      console.log('🔍 Fetching SMS templates...');
      const smsData = await smsTemplateApi.list();
      console.log(`✅ Loaded ${smsData?.length || 0} SMS templates`);
      setSmsTemplates(smsData || []);
      
      console.log('✅ All data loaded successfully');
    } catch (error: any) {
      console.error('❌ Error loading data:', error);
      toast.error('Veriler yüklenemedi: ' + error.message);
    }
  };

  const handleSubmit = async () => {
    // Validasyon
    if (selectedCustomers.length === 0) {
      toast.error('Lütfen en az bir müşteri seçin');
      return;
    }
    if (selectedTemplates.length === 0) {
      toast.error('Lütfen bir sözleşme şablonu seçin');
      return;
    }
    if (!selectedEmailTemplate) {
      toast.error('Lütfen bir email şablonu seçin');
      return;
    }
    if (!transactionName) {
      toast.error('Lütfen işlem adı girin');
      return;
    }
    if (requiresHardCopy && !hardCopyDeadline) {
      toast.error('Hard copy gerekiyorsa son tarih belirtmelisiniz');
      return;
    }

    try {
      setLoading(true);

      // Her müşteri için ayrı transaction oluştur
      for (const customerId of selectedCustomers) {
        const customer = customers.find(c => c.id === customerId);
        
        // 1. Transaction oluştur
        const transaction = await transactionApi.create({
          customer_id: customerId,
          transaction_name: mode === 'bulk' 
            ? `${transactionName} - ${customer?.cariAdi || customer?.unvan || 'Müşteri'}`
            : transactionName,
          hard_copy_deadline: requiresHardCopy ? hardCopyDeadline : null,
          status: 'draft',
        });

        // 2. Transaction'a template ekle (contract_transaction_documents tablosuna)
        for (const { templateId, order } of selectedTemplates) {
          const template = templates.find(t => t.id === templateId);
          if (template) {
            const { error: docError } = await window.__OXIVO_SUPABASE__.client
              .from('contract_transaction_documents')
              .insert({
                transaction_id: transaction.id,
                template_id: templateId,
                final_content_html: template.content_html,
                display_order: order,
              });

            if (docError) throw docError;
          }
        }

        // 3. Eğer gönderim tarihi yoksa veya bugünse, hemen gönder
        if (!sendDate || new Date(sendDate) <= new Date()) {
          // Email gönder
          const emailTemplate = emailTemplates.find(t => t.id === selectedEmailTemplate);
          
          // Burada gerçek email gönderimi yapılacak
          // Şimdilik sadece status'u "sent" olarak işaretle
          await transactionApi.update(transaction.id, {
            status: 'sent',
            sent_at: new Date().toISOString(),
            sent_via: 'email',
            sent_to_email: customer?.email || 'Email bulunamadı',
          });

          // SMS şablonu varsa SMS gönder
          if (selectedSmsTemplate) {
            // SMS gönderimi buraya eklenecek
          }
        }
      }

      if (mode === 'single') {
        toast.success('Sözleşme başarıyla gönderildi');
      } else {
        toast.success(`${selectedCustomers.length} müşteriye sözleşme gönderildi`);
      }

      onRefresh();
      onClose();
    } catch (error: any) {
      toast.error('Hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCustomer = (customerId: string) => {
    if (mode === 'single') {
      setSelectedCustomers([customerId]);
    } else {
      setSelectedCustomers(prev =>
        prev.includes(customerId)
          ? prev.filter(id => id !== customerId)
          : [...prev, customerId]
      );
    }
  };

  const selectAllCustomers = () => {
    const filteredIds = filteredCustomers.map(c => c.id);
    const allFilteredSelected = filteredIds.every(id => selectedCustomers.includes(id));
    
    if (allFilteredSelected) {
      // Filtrelenmiş müşterileri kaldır
      setSelectedCustomers(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // Filtrelenmiş müşterileri ekle
      setSelectedCustomers(prev => [...new Set([...prev, ...filteredIds])]);
    }
  };

  // Template management functions
  const addTemplate = (templateId: string) => {
    if (!templateId) return;
    
    const exists = selectedTemplates.some(t => t.templateId === templateId);
    if (exists) {
      toast.info('Bu şablon zaten eklenmiş');
      return;
    }
    
    setSelectedTemplates(prev => [
      ...prev,
      { templateId, order: prev.length + 1 }
    ]);
  };

  const removeTemplate = (templateId: string) => {
    setSelectedTemplates(prev => {
      const filtered = prev.filter(t => t.templateId !== templateId);
      // Re-order
      return filtered.map((t, idx) => ({ ...t, order: idx + 1 }));
    });
  };

  const moveTemplateUp = (templateId: string) => {
    const index = selectedTemplates.findIndex(t => t.templateId === templateId);
    if (index <= 0) return;
    
    const newTemplates = [...selectedTemplates];
    [newTemplates[index - 1], newTemplates[index]] = [newTemplates[index], newTemplates[index - 1]];
    
    // Re-order
    setSelectedTemplates(newTemplates.map((t, idx) => ({ ...t, order: idx + 1 })));
  };

  const moveTemplateDown = (templateId: string) => {
    const index = selectedTemplates.findIndex(t => t.templateId === templateId);
    if (index === -1 || index === selectedTemplates.length - 1) return;
    
    const newTemplates = [...selectedTemplates];
    [newTemplates[index], newTemplates[index + 1]] = [newTemplates[index + 1], newTemplates[index]];
    
    // Re-order
    setSelectedTemplates(newTemplates.map((t, idx) => ({ ...t, order: idx + 1 })));
  };

  // Müşteri filtreleme
  const filteredCustomers = customers.filter(customer => {
    // Durum filtresi
    if (statusFilter === 'active') {
      // aktif field'ı true olanları al
      // Eğer aktif field'ı yoksa, varsayılan olarak aktif kabul et
      const isActive = customer.aktif !== undefined ? customer.aktif === true : true;
      if (!isActive) return false;
    }
    if (statusFilter === 'inactive') {
      // aktif field'ı false olanları al
      const isInactive = customer.aktif === false;
      if (!isInactive) return false;
    }
    
    // Metin arama filtresi
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    const cariAdi = (customer.cariAdi || customer.unvan || '').toLowerCase();
    const vergiNo = (customer.vergiNo || '').toLowerCase();
    const cariHesapKodu = (customer.cariHesapKodu || '').toLowerCase();
    const email = (customer.email || '').toLowerCase();
    
    return (
      cariAdi.includes(query) ||
      vergiNo.includes(query) ||
      cariHesapKodu.includes(query) ||
      email.includes(query)
    );
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-gray-900">Yeni Sözleşme Gönderimi</h2>
            <p className="text-gray-500 text-sm mt-1">
              {mode === 'single' ? 'Tekil müşteriye' : 'Toplu müşterilere'} sözleşme gönder
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Mode Toggle */}
          <div className="mb-6">
            <Label className="mb-2 block">Gönderim Türü</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === 'single' ? 'default' : 'outline'}
                onClick={() => {
                  setMode('single');
                  setSelectedCustomers([]);
                }}
                className="flex-1"
              >
                <FileSignature size={16} className="mr-2" />
                Tekil Gönderim
              </Button>
              <Button
                type="button"
                variant={mode === 'bulk' ? 'default' : 'outline'}
                onClick={() => setMode('bulk')}
                className="flex-1"
              >
                <FileSignature size={16} className="mr-2" />
                Toplu Gönderim
              </Button>
            </div>
          </div>

          {/* İşlem Adı */}
          <div className="mb-4">
            <Label htmlFor="transactionName" className="mb-2 block">
              İşlem Adı *
            </Label>
            <Input
              id="transactionName"
              value={transactionName}
              onChange={(e) => setTransactionName(e.target.value)}
              placeholder={mode === 'bulk' 
                ? 'Örn: 2024 Yıllık Sözleşme (müşteri adı otomatik eklenecek)'
                : 'Örn: 2024 Yıllık Sözleşme'
              }
            />
          </div>

          {/* Müşteri Seçimi */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <Label>
                {mode === 'single' ? 'Müşteri *' : 'Müşteriler *'}
                {selectedCustomers.length > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({selectedCustomers.length} seçildi)
                  </span>
                )}
              </Label>
              {mode === 'bulk' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectAllCustomers}
                >
                  {selectedCustomers.length === customers.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                </Button>
              )}
            </div>
            
            {mode === 'single' ? (
              // Single select dropdown
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedCustomers[0] || ''}
                onChange={(e) => setSelectedCustomers(e.target.value ? [e.target.value] : [])}
              >
                <option value="">Müşteri seçin...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.cariAdi || customer.unvan || 'İsimsiz Müşteri'}
                  </option>
                ))}
              </select>
            ) : (
              // Multi select with checkboxes
              <>
                {/* Filters Row */}
                <div className="mb-2 flex gap-2">
                  {/* Search Input */}
                  <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Müşteri adı, vergi no, cari kod veya email ile ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  
                  {/* Status Filter */}
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  >
                    <option value="all">Tümü</option>
                    <option value="active">✅ Aktif</option>
                    <option value="inactive">❌ Pasif</option>
                  </select>
                </div>
                
                {/* Filtreleme sonucu bilgisi */}
                {(searchQuery || statusFilter !== 'all') && (
                  <div className="mb-2 text-xs text-gray-500">
                    {filteredCustomers.length} müşteri bulundu (Toplam: {customers.length})
                  </div>
                )}
                
                {/* Customer list */}
                <div className="border border-gray-300 rounded-lg max-h-48 overflow-auto">
                  {filteredCustomers.length === 0 ? (
                    <div className="px-3 py-8 text-center text-gray-500 text-sm">
                      {searchQuery ? 'Arama kriterine uygun müşteri bulunamadı' : 'Müşteri bulunamadı'}
                    </div>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <label
                        key={customer.id}
                        className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => toggleCustomer(customer.id)}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-900">{customer.cariAdi || customer.unvan || 'İsimsiz Müşteri'}</span>
                      </label>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Şablon Seçimi */}
          <div className="mb-4">
            <Label className="mb-2 block">
              <FileText size={16} className="inline mr-2" />
              Sözleşme Şablonları * (Birden fazla eklenebilir)
            </Label>
            
            {/* Şablon Ekleme Alanı */}
            <div className="flex gap-2 mb-3">
              <select
                id="templateSelect"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value=""
                onChange={(e) => {
                  addTemplate(e.target.value);
                  e.target.value = ''; // Reset
                }}
              >
                <option value="">Şablon eklemek için seçin...</option>
                {templates
                  .filter(t => !selectedTemplates.some(st => st.templateId === t.id))
                  .map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={templates.filter(t => !selectedTemplates.some(st => st.templateId === t.id)).length === 0}
                onClick={() => document.getElementById('templateSelect')?.focus()}
              >
                <Plus size={16} />
              </Button>
            </div>
            
            {/* Seçili Şablonlar Listesi */}
            {selectedTemplates.length > 0 ? (
              <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                <div className="text-xs text-gray-600 mb-2">
                  {selectedTemplates.length} şablon seçildi - müşteriye bu sırada gönderilecek:
                </div>
                <div className="space-y-2">
                  {selectedTemplates.map((st, idx) => {
                    const template = templates.find(t => t.id === st.templateId);
                    return (
                      <div
                        key={st.templateId}
                        className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveTemplateUp(st.templateId)}
                            disabled={idx === 0}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveTemplateDown(st.templateId)}
                            disabled={idx === selectedTemplates.length - 1}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                        <span className="text-sm text-gray-500 min-w-[24px]">
                          {st.order}.
                        </span>
                        <FileText size={14} className="text-gray-400" />
                        <span className="flex-1 text-sm text-gray-900">
                          {template?.name || 'Şablon bulunamadı'}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeTemplate(st.templateId)}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center text-sm text-gray-500">
                Henüz şablon eklenmedi. Yukarıdaki menüden şablon seçin.
              </div>
            )}
          </div>

          {/* Email Şablonu */}
          <div className="mb-4">
            <Label htmlFor="emailTemplate" className="mb-2 block">
              <Mail size={16} className="inline mr-2" />
              Email Şablonu *
            </Label>
            <select
              id="emailTemplate"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedEmailTemplate}
              onChange={(e) => setSelectedEmailTemplate(e.target.value)}
            >
              <option value="">Email şablonu seçin...</option>
              {emailTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* SMS Şablonu (Opsiyonel) */}
          <div className="mb-4">
            <Label htmlFor="smsTemplate" className="mb-2 block">
              <MessageSquare size={16} className="inline mr-2" />
              SMS Şablonu (Opsiyonel)
            </Label>
            <select
              id="smsTemplate"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedSmsTemplate}
              onChange={(e) => setSelectedSmsTemplate(e.target.value)}
            >
              <option value="">SMS şablonu seçin (isteğe bağlı)...</option>
              {smsTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Gönderim Tarihi */}
          <div className="mb-4">
            <Label htmlFor="sendDate" className="mb-2 block">
              <Calendar size={16} className="inline mr-2" />
              Gönderim Tarihi (Boş bırakılırsa hemen gönderilir)
            </Label>
            <Input
              id="sendDate"
              type="datetime-local"
              value={sendDate}
              onChange={(e) => setSendDate(e.target.value)}
            />
          </div>

          {/* Hard Copy */}
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresHardCopy}
                onChange={(e) => setRequiresHardCopy(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-900">Fiziksel imza (Hard Copy) gerekli</span>
            </label>
          </div>

          {/* Hard Copy Deadline */}
          {requiresHardCopy && (
            <div className="mb-4 ml-6">
              <Label htmlFor="hardCopyDeadline" className="mb-2 block">
                Hard Copy Son Tarih *
              </Label>
              <Input
                id="hardCopyDeadline"
                type="date"
                value={hardCopyDeadline}
                onChange={(e) => setHardCopyDeadline(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedTemplates.length > 0 && (
              <span className="mr-4">📄 {selectedTemplates.length} doküman</span>
            )}
            {mode === 'bulk' && selectedCustomers.length > 0 && (
              <span>🎯 {selectedCustomers.length} müşteriye gönderilecek</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              İptal
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              <Send size={16} className="mr-2" />
              {loading ? 'Gönderiliyor...' : 'Gönder'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}