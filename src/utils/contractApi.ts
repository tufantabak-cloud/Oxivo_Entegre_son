// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 CONTRACT API - DSYM Backend İşlemleri
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { supabase } from './supabaseClient';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ContractTemplate {
  id: string;
  name: string;
  category: string;
  content_html: string;
  version: number;
  auto_fill_fields: string[];
  manual_fields: { name: string; label: string; type: string }[];
  is_active: boolean;
  requires_hard_copy: boolean;
  display_order: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractTransaction {
  id: string;
  customer_id: string;
  sales_rep_id?: string;
  transaction_name: string;
  status: 'draft' | 'sent' | 'digital_signed' | 'hard_copy_waiting' | 'hard_copy_received' | 'completed' | 'expired';
  unique_token: string;
  sent_via?: string;
  sent_to_email?: string;
  sent_to_phone?: string;
  sent_at?: string;
  expires_at?: string;
  sms_code?: string;
  sms_code_sent_at?: string;
  sms_verified_at?: string;
  digital_signed_at?: string;
  digital_signature_ip?: string;
  hard_copy_deadline?: string;
  hard_copy_received_at?: string;
  hard_copy_notes?: string;
  version: number;
  parent_transaction_id?: string;
  admin_notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractTransactionDocument {
  id: string;
  transaction_id: string;
  template_id: string;
  final_content_html: string;
  manual_field_values: Record<string, any>;
  pdf_url?: string;
  pdf_hash?: string;
  pdf_generated_at?: string;
  display_order: number;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEMPLATE API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const templateApi = {
  // Tüm şablonları listele
  async list(activeOnly = false) {
    let query = supabase
      .from('contract_templates')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as ContractTemplate[];
  },

  // Tek şablon getir
  async get(id: string) {
    const { data, error } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as ContractTemplate;
  },

  // Yeni şablon oluştur
  async create(template: Partial<ContractTemplate>) {
    const { data, error } = await supabase
      .from('contract_templates')
      .insert([{
        ...template,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data as ContractTemplate;
  },

  // Şablon güncelle
  async update(id: string, updates: Partial<ContractTemplate>) {
    const { data, error } = await supabase
      .from('contract_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ContractTemplate;
  },

  // Şablon sil (soft delete - is_active = false)
  async delete(id: string) {
    const { data, error } = await supabase
      .from('contract_templates')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Yeni versiyon oluştur
  async createVersion(id: string) {
    const original = await this.get(id);
    
    const { data, error } = await supabase
      .from('contract_templates')
      .insert([{
        ...original,
        id: undefined,
        version: original.version + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data as ContractTemplate;
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TRANSACTION API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const transactionApi = {
  // Tüm işlemleri listele
  async list(filters?: { status?: string; customer_id?: string }) {
    // İlk olarak JOIN ile dene
    let query = supabase
      .from('contract_transactions')
      .select(`
        *,
        customers(unvan, vergi_no),
        contract_transaction_documents(id)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }

    const { data, error } = await query;
    
    // Eğer JOIN hatası varsa (400 Bad Request), fallback yap
    if (error) {
      console.warn('⚠️ [contractApi] JOIN query failed, falling back to simple query:', error.message);
      
      // Fallback: JOIN olmadan basit query
      let fallbackQuery = supabase
        .from('contract_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        fallbackQuery = fallbackQuery.eq('status', filters.status);
      }
      if (filters?.customer_id) {
        fallbackQuery = fallbackQuery.eq('customer_id', filters.customer_id);
      }

      const { data: fallbackData, error: fallbackError } = await fallbackQuery;
      if (fallbackError) throw fallbackError;
      
      // Basit veri döndür (JOIN yok)
      return (fallbackData || []).map((tx: any) => ({
        ...tx,
        customers: null, // JOIN başarısız oldu
        contract_transaction_documents: [],
        document_count: 0,
      }));
    }
    
    // Doküman sayısını ekle
    return (data || []).map((tx: any) => ({
      ...tx,
      document_count: tx.contract_transaction_documents?.length || 0,
    }));
  },

  // Tek işlem getir (dökümanlar ile birlikte)
  async get(id: string) {
    const { data: transaction, error: txError } = await supabase
      .from('contract_transactions')
      .select('*, customers(unvan, vergi_no, adres, telefon, email)')
      .eq('id', id)
      .single();

    if (txError) {
      // Fallback: JOIN olmadan basit query
      console.warn('⚠️ [contractApi.get] JOIN query failed, using fallback');
      const { data: fallbackTx, error: fallbackError } = await supabase
        .from('contract_transactions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fallbackError) throw fallbackError;
      
      const { data: documents, error: docError } = await supabase
        .from('contract_transaction_documents')
        .select('*')
        .eq('transaction_id', id)
        .order('display_order', { ascending: true });

      return {
        ...fallbackTx,
        customers: null,
        documents: documents || [],
      };
    }

    const { data: documents, error: docError } = await supabase
      .from('contract_transaction_documents')
      .select('*, contract_templates(name, category)')
      .eq('transaction_id', id)
      .order('display_order', { ascending: true });

    if (docError) {
      // Fallback for documents JOIN
      const { data: fallbackDocs } = await supabase
        .from('contract_transaction_documents')
        .select('*')
        .eq('transaction_id', id)
        .order('display_order', { ascending: true });
      
      return {
        ...transaction,
        documents: fallbackDocs || [],
      };
    }

    return {
      ...transaction,
      documents,
    };
  },

  // Token ile getir (public endpoint için)
  async getByToken(token: string) {
    const { data: transaction, error: txError } = await supabase
      .from('contract_transactions')
      .select('*, customers(unvan, vergi_no, adres, telefon)')
      .eq('unique_token', token)
      .single();

    if (txError) throw txError;

    const { data: documents, error: docError } = await supabase
      .from('contract_transaction_documents')
      .select('*, contract_templates(name, category, requires_hard_copy)')
      .eq('transaction_id', transaction.id)
      .order('display_order', { ascending: true });

    if (docError) throw docError;

    return {
      ...transaction,
      documents,
    };
  },

  // Yeni işlem oluştur (taslak)
  async create(transaction: Partial<ContractTransaction>) {
    // Benzersiz token oluştur
    const token = generateUniqueToken();

    const { data, error } = await supabase
      .from('contract_transactions')
      .insert([{
        ...transaction,
        unique_token: token,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data as ContractTransaction;
  },

  // İşlem güncelle
  async update(id: string, updates: Partial<ContractTransaction>) {
    const { data, error } = await supabase
      .from('contract_transactions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ContractTransaction;
  },

  // Sözleşme gönder (durumu güncelle)
  async send(id: string, sendData: { sent_via: string; sent_to_email?: string; sent_to_phone?: string }) {
    const { data, error } = await supabase
      .from('contract_transactions')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        ...sendData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Audit log kaydet
    await auditApi.log(id, 'email_sent', {
      sent_to_email: sendData.sent_to_email,
      sent_to_phone: sendData.sent_to_phone,
    });

    return data as ContractTransaction;
  },

  // SMS kodu oluştur ve kaydet
  async generateSMSCode(id: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const { data, error } = await supabase
      .from('contract_transactions')
      .update({
        sms_code: code,
        sms_code_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await auditApi.log(id, 'sms_code_sent', { code });

    return { code, transaction: data };
  },

  // SMS kodunu doğrula
  async verifySMSCode(id: string, code: string) {
    const { data: transaction, error } = await supabase
      .from('contract_transactions')
      .select('sms_code')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (transaction.sms_code !== code) {
      throw new Error('Geçersiz SMS kodu');
    }

    const { data, error: updateError } = await supabase
      .from('contract_transactions')
      .update({
        sms_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    await auditApi.log(id, 'sms_code_verified', {});

    return data;
  },

  // Dijital imzalama
  async digitalSign(id: string, ipAddress: string) {
    const signedAt = new Date().toISOString();
    const hardCopyDeadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(); // +5 gün

    const { data, error } = await supabase
      .from('contract_transactions')
      .update({
        status: 'hard_copy_waiting',
        digital_signed_at: signedAt,
        digital_signature_ip: ipAddress,
        hard_copy_deadline: hardCopyDeadline,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await auditApi.log(id, 'digital_signed', { ip_address: ipAddress });

    return data as ContractTransaction;
  },

  // Hard copy teslim alındı
  async receiveHardCopy(id: string, notes?: string) {
    const { data, error } = await supabase
      .from('contract_transactions')
      .update({
        status: 'completed',
        hard_copy_received_at: new Date().toISOString(),
        hard_copy_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await auditApi.log(id, 'hard_copy_received', { notes });

    return data as ContractTransaction;
  },

  // Yeni versiyon oluştur
  async createVersion(id: string) {
    const original = await this.get(id);

    const { data: newTransaction, error } = await supabase
      .from('contract_transactions')
      .insert([{
        customer_id: original.customer_id,
        sales_rep_id: original.sales_rep_id,
        transaction_name: `${original.transaction_name} (v${original.version + 1})`,
        status: 'draft',
        unique_token: generateUniqueToken(),
        version: original.version + 1,
        parent_transaction_id: original.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;

    // Dökümanları kopyala
    for (const doc of original.documents) {
      await documentApi.create({
        transaction_id: newTransaction.id,
        template_id: doc.template_id,
        final_content_html: doc.final_content_html,
        manual_field_values: doc.manual_field_values,
        display_order: doc.display_order,
      });
    }

    await auditApi.log(newTransaction.id, 'version_created', { parent_id: original.id });

    return newTransaction;
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DOCUMENT API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━���━━━━━━━━━━━━━━━━━━━

export const documentApi = {
  // Döküman oluştur
  async create(doc: Partial<ContractTransactionDocument>) {
    const { data, error } = await supabase
      .from('contract_transaction_documents')
      .insert([{
        ...doc,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data as ContractTransactionDocument;
  },

  // PDF URL'sini güncelle
  async updatePDF(id: string, pdfUrl: string, pdfHash: string) {
    const { data, error } = await supabase
      .from('contract_transaction_documents')
      .update({
        pdf_url: pdfUrl,
        pdf_hash: pdfHash,
        pdf_generated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // İşleme ait tüm dökümanları getir
  async listByTransaction(transactionId: string) {
    const { data, error } = await supabase
      .from('contract_transaction_documents')
      .select('*, contract_templates(name, category)')
      .eq('transaction_id', transactionId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data;
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EMAIL TEMPLATE API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const emailTemplateApi = {
  async list() {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as EmailTemplate[];
  },

  async getDefault() {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('is_default', true)
      .single();

    if (error) throw error;
    return data as EmailTemplate;
  },

  async create(template: Partial<EmailTemplate>) {
    const { data, error } = await supabase
      .from('email_templates')
      .insert([{
        ...template,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data as EmailTemplate;
  },

  async update(id: string, updates: Partial<EmailTemplate>) {
    const { data, error } = await supabase
      .from('email_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as EmailTemplate;
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SMS TEMPLATE API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const smsTemplateApi = {
  async list() {
    const { data, error } = await supabase
      .from('sms_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SMSTemplate[];
  },

  async getDefault() {
    const { data, error } = await supabase
      .from('sms_templates')
      .select('*')
      .eq('is_default', true)
      .single();

    if (error) throw error;
    return data as SMSTemplate;
  },

  async create(template: Partial<SMSTemplate>) {
    const { data, error } = await supabase
      .from('sms_templates')
      .insert([{
        ...template,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data as SMSTemplate;
  },

  async update(id: string, updates: Partial<SMSTemplate>) {
    const { data, error } = await supabase
      .from('sms_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as SMSTemplate;
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUDIT LOG API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const auditApi = {
  async log(transactionId: string, action: string, metadata: Record<string, any>, ipAddress?: string, userAgent?: string) {
    const { error } = await supabase
      .from('contract_audit_logs')
      .insert([{
        transaction_id: transactionId,
        action,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata,
        created_at: new Date().toISOString(),
      }]);

    if (error) throw error;
  },

  async listByTransaction(transactionId: string) {
    const { data, error } = await supabase
      .from('contract_audit_logs')
      .select('*')
      .eq('transaction_id', transactionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generateUniqueToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Şablon içindeki değişkenleri gerçek verilerle değiştir
export function mergeTemplate(
  templateHtml: string,
  customerData: Record<string, any>,
  manualData: Record<string, any>
): string {
  let result = templateHtml;

  // Otomatik alanları doldur ({{unvan}}, {{vergi_no}} vb.)
  Object.keys(customerData).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, customerData[key] || '');
  });

  // Manuel alanları doldur ([MANUEL: komisyon_orani] vb.)
  Object.keys(manualData).forEach((key) => {
    const regex = new RegExp(`\\[MANUEL: ${key}\\]`, 'g');
    result = result.replace(regex, manualData[key] || '');
  });

  return result;
}