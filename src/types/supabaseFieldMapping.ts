/**
 * ========================================
 * 🗺️ SUPABASE FIELD MAPPING
 * ========================================
 * Mevcut Supabase şemasını frontend'e uyarlayan mapper
 * 
 * ÖNEMLİ: Supabase şemasına DOKUNULMADI
 * Sadece field mapping ile uyumluluk sağlandı
 * ========================================
 */

// ========================================
// CUSTOMERS MAPPING
// ========================================
export const customersFieldMap = {
  // Frontend → Supabase
  toSupabase: {
    firma_unvani: 'cari_adi',
    musteri_id: 'id',
    firma_id: 'id',
    vergi_no: 'vergi_no',
    vergi_dairesi: 'vergi_dairesi',
    adres: 'adres',
    ilce: 'ilce',
    il: 'ilce', // Supabase'de "ilce" var
    telefon: 'tel',
    email: 'email',
    yetkili_kisi: 'yetkili',
    sektor: 'sektor',
    mcc: 'mcc',  // ✅ FIX: Frontend'de mcc → Supabase'de mcc (mcc_code değil!)
    satis_temsilcisi: 'sales_rep_name',
    durum: 'durum',  // ✅ FIX: Frontend'de durum → Supabase'de durum (aktif değil!)
    askida: 'bloke_durumu',
    domain_hierarchy: 'domain_hierarchy',
    bank_device_assignments: 'bank_device_assignments',
    service_fee_settings: 'service_fee_settings',
    device_subscriptions: 'device_subscriptions',
    service_fee_invoices: 'service_fee_invoices',
    payment_reminders: 'payment_reminders',
    reminder_settings: 'reminder_settings',
    suspension_history: 'suspension_history',
    linked_bank_pf_ids: 'linked_bank_pf_ids',
  },
  
  // Supabase → Frontend
  fromSupabase: {
    cari_adi: 'firma_unvani',
    id: 'musteri_id',
    vergi_no: 'vergi_no',
    vergi_dairesi: 'vergi_dairesi',
    adres: 'adres',
    ilce: 'il',
    tel: 'telefon',
    email: 'email',
    yetkili: 'yetkili_kisi',
    sektor: 'sektor',
    mcc: 'mcc',  // ✅ FIX: Supabase'de mcc → Frontend'de mcc (mcc_code değil!)
    sales_rep_name: 'satis_temsilcisi',
    durum: 'durum',  // ✅ FIX: Supabase'de durum → Frontend'de durum (aktif değil!)
    bloke_durumu: 'askida',
    domain_hierarchy: 'domain_hierarchy',
    bank_device_assignments: 'bank_device_assignments',
    service_fee_settings: 'service_fee_settings',
    device_subscriptions: 'device_subscriptions',
    service_fee_invoices: 'service_fee_invoices',
    payment_reminders: 'payment_reminders',
    reminder_settings: 'reminder_settings',
    suspension_history: 'suspension_history',
    linked_bank_pf_ids: 'linked_bank_pf_ids',
  }
} as const;

// ========================================
// BANK_ACCOUNTS MAPPING
// ========================================
export const bankAccountsFieldMap = {
  toSupabase: {
    hesap_adi: 'firma_unvan',
    banka_adi: 'banka_pf_ad',
    musteri_id: 'id',
    aktif: 'durum',
  },
  fromSupabase: {
    firma_unvan: 'hesap_adi',
    banka_pf_ad: 'banka_adi',
    id: 'musteri_id',
    durum: 'aktif',
  }
} as const;

// ========================================
// PRODUCTS MAPPING
// ========================================
export const productsFieldMap = {
  toSupabase: {
    urun_adi: 'name',
    urun_kodu: 'serial_number',
    kategori: 'terminal_type',
    model: 'terminal_model',
    seri_no: 'tid',
    musteri_id: 'domain', // Domain bazlı ilişki
    aktif: 'online_status',
  },
  fromSupabase: {
    name: 'urun_adi',
    serial_number: 'urun_kodu',
    terminal_type: 'kategori',
    terminal_model: 'model',
    tid: 'seri_no',
    domain: 'musteri_id',
    online_status: 'aktif',
  }
} as const;

// ========================================
// EARNINGS MAPPING
// ========================================
export const earningsFieldMap = {
  toSupabase: {
    id: 'id',  // ✅ Keep ID field
    musteri_id: 'firma_id',
    firma_unvani: 'tabela_group_ad',
    toplam_ciro: 'total_islem_hacmi',
    toplam_komisyon: 'total_pf_pay',
    net_gelir: 'total_oxivo_pay',
    ek_gelir_pf_tl: 'ek_gelir_pf_tl',
    ek_gelir_ox_tl: 'ek_gelir_ox_tl',
    ek_kesinti_pf_tl: 'ek_kesinti_pf_tl',
    ek_kesinti_ox_tl: 'ek_kesinti_ox_tl',
    donem: 'donem',
    notlar: 'notlar',
    onaylandi: 'durum',
    olusturma_tarihi: 'created_at',  // ✅ CRITICAL FIX
    guncelleme_tarihi: 'updated_at', // ✅ CRITICAL FIX
    created_at: 'created_at',  // ✅ Alternative naming
    updated_at: 'updated_at',  // ✅ Alternative naming
  },
  fromSupabase: {
    id: 'id',  // ✅ Keep ID field
    firma_id: 'musteri_id',
    tabela_group_ad: 'firma_unvani',
    total_islem_hacmi: 'toplam_ciro',
    total_pf_pay: 'toplam_komisyon',
    total_oxivo_pay: 'net_gelir',
    ek_gelir_pf_tl: 'ek_gelir_pf_tl',
    ek_gelir_ox_tl: 'ek_gelir_ox_tl',
    ek_kesinti_pf_tl: 'ek_kesinti_pf_tl',
    ek_kesinti_ox_tl: 'ek_kesinti_ox_tl',
    donem: 'donem',
    notlar: 'notlar',
    durum: 'onaylandi',
    created_at: 'olusturma_tarihi',  // ✅ CRITICAL FIX
    updated_at: 'guncelleme_tarihi', // ✅ CRITICAL FIX
  }
} as const;

// ========================================
// SIGNS MAPPING (Tabela)
// ========================================
export const signsFieldMap = {
  toSupabase: {
    musteri_id: 'firma_id',
    firma_unvani: 'firma_id', // Join ile çekilecek
    tabela_tipi: 'urun',
    maliyet: 'hazine_geliri',
    aktif: 'aktif',
    notlar: 'aciklama',
    fotograflar: 'fotograf',
  },
  fromSupabase: {
    firma_id: 'musteri_id',
    urun: 'tabela_tipi',
    hazine_geliri: 'maliyet',
    aktif: 'aktif',
    aciklama: 'notlar',
    fotograf: 'fotograflar',
  }
} as const;

// ========================================
// GENERIC MAPPER FUNCTIONS
// ========================================

/**
 * Supabase'den gelen veriyi frontend formatına dönüştür
 */
export function mapFromSupabase<T extends Record<string, any>>(
  data: T,
  mapping: typeof customersFieldMap.fromSupabase
): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [supabaseKey, frontendKey] of Object.entries(mapping)) {
    if (supabaseKey in data) {
      result[frontendKey] = data[supabaseKey];
    }
  }
  
  // Mapping'de olmayan diğer alanları da koru
  for (const key of Object.keys(data)) {
    if (!(key in mapping)) {
      result[key] = data[key];
    }
  }
  
  return result;
}

/**
 * Frontend verisini Supabase formatına dönüştür
 */
export function mapToSupabase<T extends Record<string, any>>(
  data: T,
  mapping: typeof customersFieldMap.toSupabase
): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [frontendKey, supabaseKey] of Object.entries(mapping)) {
    if (frontendKey in data) {
      result[supabaseKey] = data[frontendKey];
    }
  }
  
  // Mapping'de olmayan diğer alanları da koru
  for (const key of Object.keys(data)) {
    if (!(key in mapping)) {
      result[key] = data[key];
    }
  }
  
  return result;
}

// ========================================
// CONVENIENCE WRAPPERS
// ========================================

export const mapCustomerFromSupabase = (data: any) =>
  mapFromSupabase(data, customersFieldMap.fromSupabase);

export const mapCustomerToSupabase = (data: any) =>
  mapToSupabase(data, customersFieldMap.toSupabase);

export const mapBankAccountFromSupabase = (data: any) =>
  mapFromSupabase(data, bankAccountsFieldMap.fromSupabase);

export const mapBankAccountToSupabase = (data: any) =>
  mapToSupabase(data, bankAccountsFieldMap.toSupabase);

export const mapProductFromSupabase = (data: any) =>
  mapFromSupabase(data, productsFieldMap.fromSupabase);

export const mapProductToSupabase = (data: any) =>
  mapToSupabase(data, productsFieldMap.toSupabase);

export const mapEarningFromSupabase = (data: any) =>
  mapFromSupabase(data, earningsFieldMap.fromSupabase);

export const mapEarningToSupabase = (data: any) =>
  mapToSupabase(data, earningsFieldMap.toSupabase);

export const mapSignFromSupabase = (data: any) =>
  mapFromSupabase(data, signsFieldMap.fromSupabase);

export const mapSignToSupabase = (data: any) =>
  mapToSupabase(data, signsFieldMap.toSupabase);