/**
 * Supabase Database Type Definitions
 * Auto-generated from your SQL schema
 * 
 * Created: 2025-11-22
 * Updated: 2024-12-08 - Added 11 missing definition tables
 * 
 * NOTE: Bu dosya Supabase'deki tablo yapılarını TypeScript'e map eder
 */

// ========================================
// DATABASE ROW TYPES (snake_case)
// ========================================

// ========================================
// TANIMLAR (DEFINITIONS) - 11 TABLES
// ========================================

// ========================================
// BACKUP & SYSTEM TABLES
// ========================================

export interface DeletedRecordsBackupRow {
  id: string;
  table_name: string; // Source table name (NOT NULL)
  record_id: string; // Original record ID (NOT NULL)
  record_data: any; // JSONB - Complete record snapshot (NOT NULL)
  deleted_by: string; // User/system who deleted (NOT NULL)
  deleted_at: string; // Deletion timestamp (default: NOW())
  reason: string | null; // Deletion reason
  created_at: string; // timestamp with time zone (default: NOW())
}

export interface MCCCodesRow {
  id: string;
  kod: string; // MCC kodu (NOT NULL)
  kategori: string; // MCC kategorisi (NOT NULL)
  aciklama: string | null; // Açıklama
  aktif: boolean; // Aktif/Pasif durumu (default: true)
  created_at: string; // timestamp with time zone
}

export interface BanksRow {
  id: string;
  kod: string; // Banka kodu (NOT NULL)
  ad: string; // Banka adı (NOT NULL)
  muhasebe_kodu: string | null; // Muhasebe kodu
  vergi_no: string | null; // Vergi numarası
  vergi_dairesi: string | null; // Vergi dairesi
  adres: string | null; // Adres
  telefon: string | null; // Telefon
  email: string | null; // Email
  aktif: boolean; // Aktif/Pasif (default: true)
  created_at: string; // timestamp with time zone
}

export interface EPKInstitutionsRow {
  id: string;
  kod: string; // EPK kodu (NOT NULL)
  ad: string; // EPK adı (NOT NULL)
  muhasebe_kodu: string | null; // Muhasebe kodu
  vergi_no: string | null; // Vergi numarası
  vergi_dairesi: string | null; // Vergi dairesi
  adres: string | null; // Adres
  telefon: string | null; // Telefon
  email: string | null; // Email
  aktif: boolean; // Aktif/Pasif (default: true)
  created_at: string; // timestamp with time zone
}

export interface OKInstitutionsRow {
  id: string;
  kod: string; // ÖK kodu (NOT NULL)
  ad: string; // ÖK adı (NOT NULL)
  muhasebe_kodu: string | null; // Muhasebe kodu
  vergi_no: string | null; // Vergi numarası
  vergi_dairesi: string | null; // Vergi dairesi
  adres: string | null; // Adres
  telefon: string | null; // Telefon
  email: string | null; // Email
  aktif: boolean; // Aktif/Pasif (default: true)
  created_at: string; // timestamp with time zone
}

export interface SalesRepresentativesRow {
  id: string;
  kod: string; // Satış temsilcisi kodu (NOT NULL)
  ad_soyad: string; // Ad Soyad (NOT NULL)
  telefon: string | null; // Telefon
  email: string | null; // Email
  bolge: string | null; // Bölge
  aktif: boolean; // Aktif/Pasif (default: true)
  created_at: string; // timestamp with time zone
  ad: string | null; // Ad (eski field - backward compatibility)
}

export interface JobTitlesRow {
  id: string;
  unvan: string; // Ünvan (NOT NULL)
  aciklama: string | null; // Açıklama
  aktif: boolean; // Aktif/Pasif (default: true)
  created_at: string; // timestamp with time zone
}

export interface PartnershipsRow {
  id: string;
  partner_name: string | null; // Partner adı
  partner_type: string | null; // Partner tipi
  contact_person: string | null; // İrtibat kişisi
  phone: string | null; // Telefon
  email: string | null; // Email
  notes: string | null; // Notlar
  aktif: boolean; // Aktif/Pasif (default: true)
  created_at: string; // timestamp with time zone
  calculation_rows: any | null; // JSONB - Hesaplama satırları
}

export interface SharingsRow {
  id: string;
  kod: string; // Paylaşım kodu (NOT NULL)
  ad: string; // Paylaşım adı (NOT NULL)
  tip: string | null; // Tip
  sira: number; // Sıra (default: 0)
  aktif: boolean; // Aktif/Pasif (default: true)
  paydaslar: any | null; // JSONB - Paydaslar array
  created_at: string; // timestamp with time zone
  model_adi: string | null; // Model adı
}

export interface CardProgramsRow {
  id: string;
  kod: string | null; // Kart program kodu
  ad: string; // Kart program adı (NOT NULL)
  banka_kodu: string | null; // Banka kodu
  kart_tipi: string | null; // Kart tipi (Kredi/Banka)
  komisyon_orani: number | null; // Komisyon oranı (numeric)
  aktif: boolean; // Aktif/Pasif (default: true)
  created_at: string; // timestamp with time zone
  kart_adi: string | null; // Kart adı (eski field)
}

export interface SuspensionReasonsRow {
  id: string;
  neden: string; // Askıya alma nedeni (NOT NULL)
  aciklama: string | null; // Açıklama
  aktif: boolean; // Aktif/Pasif (default: true)
  created_at: string; // timestamp with time zone
}

export interface EarningsRow {
  id: string;
  firma_id: string; // Firma ID (NOT NULL)
  tabela_group_id: string; // Tabela grup ID (NOT NULL)
  tabela_group_ad: string; // Tabela grup adı (NOT NULL)
  donem: string; // Dönem (NOT NULL)
  olusturma_tarihi: string; // timestamp with time zone (default: now())
  guncelleme_tarihi: string | null; // timestamp with time zone
  vade: string; // Vade (NOT NULL)
  islem_hacmi_map: any; // JSONB - İşlem hacmi map (NOT NULL, default: {})
  durum: string; // Durum (default: 'Taslak')
  notlar: string | null; // Notlar
  olusturan_kullanici: string | null; // Oluşturan kullanıcı
  pf_islem_hacmi: string | null; // PF işlem hacmi
  oxivo_islem_hacmi: string | null; // Oxivo işlem hacmi
  manual_ek_gelir_oxivo_total: string | null; // Manuel ek gelir Oxivo total
  manual_ana_tabela_oxivo_total: string | null; // Manuel ana tabela Oxivo total
  manual_ana_tabela_islem_hacmi: string | null; // Manuel ana tabela işlem hacmi
  total_islem_hacmi: number | null; // Total işlem hacmi (numeric)
  total_pf_pay: number | null; // Total PF ödeme (numeric)
  total_oxivo_pay: number | null; // Total Oxivo ödeme (numeric)
  aktif: boolean; // Aktif/Pasif (default: true)
  is_deleted: boolean; // Soft delete flag (default: false)
  created_at: string; // timestamp with time zone (default: now())
  updated_at: string; // timestamp with time zone (default: now())
  ek_gelir_aciklama: string | null; // Ek gelir açıklaması
  ek_gelir_pf_tl: number | null; // Ek gelir PF TL (numeric)
  ek_gelir_ox_tl: number | null; // Ek gelir Oxivo TL (numeric)
  ek_kesinti_aciklama: string | null; // Ek kesinti açıklaması
  ek_kesinti_pf_tl: number | null; // Ek kesinti PF TL (numeric)
  ek_kesinti_ox_tl: number | null; // Ek kesinti Oxivo TL (numeric)
}

// ========================================
// CORE TABLES
// ========================================

export interface CustomersRow {
  // Primary & System Fields
  id: string;
  created_at: string;
  updated_at: string;
  
  // ========================================
  // CORE CUSTOMER FIELDS (Turkish names → snake_case)
  // Matches Customer interface from CustomerModule.tsx
  // ========================================
  cari_hesap_kodu: string; // Customer code (cariHesapKodu)
  sektor: string | null; // Sector
  mcc: string | null; // MCC code
  cari_adi: string; // Customer name (cariAdi)
  guncel_my_payter_domain: string | null; // Current MyPayter domain (guncelMyPayterDomain)
  vergi_dairesi: string | null; // Tax office (vergiDairesi)
  vergi_no: string | null; // Tax number (vergiNo)
  adres: string | null; // Address
  ilce: string | null; // District
  posta_kodu: string | null; // Postal code (postaKodu)
  email: string | null; // Email
  yetkili: string | null; // Contact person
  tel: string | null; // Phone
  durum: string; // Status: 'Aktif' | 'Pasif'
  p6x: string | null; // P6X info
  apollo: string | null; // Apollo info
  
  // ========================================
  // SALES & MANAGEMENT FIELDS
  // ========================================
  sales_rep_id: string | null; // Sales rep ID (salesRepId)
  sales_rep_name: string | null; // Sales rep name cached (salesRepName)
  bloke_durumu: boolean | null; // Blocked status (blokeDurumu)
  sorumlu_kisi: string | null; // Responsible person (sorumluKisi)
  cari_grubu: string | null; // Customer group (cariGrubu)
  kayit_tarihi: string | null; // Registration date ISO string (kayitTarihi)
  musteri_tipi: string | null; // Customer type (musteriTipi)
  
  // ========================================
  // DOMAIN & SUBSCRIPTION
  // ========================================
  domain: string | null; // Alias for guncel_my_payter_domain
  ignore_main_domain: boolean | null; // Ignore main domain flag (ignoreMainDomain)
  ignore_main_domain_note: string | null; // Reason for ignoring (ignoreMainDomainNote)
  subscription_fee: number | null; // Monthly subscription fee (subscriptionFee)
  
  // ========================================
  // JSONB FIELDS (Complex data structures)
  // ========================================
  domain_hierarchy: any | null; // JSONB - DomainNode[] tree structure
  linked_bank_pf_ids: any | null; // JSONB - string[] Related Bank/PF IDs (linkedBankPFIds)
  bank_device_assignments: any | null; // JSONB - BankDeviceAssignment[] (bankDeviceAssignments)
  service_fee_settings: any | null; // JSONB - ServiceFeeSettings object (serviceFeeSettings)
  device_subscriptions: any | null; // JSONB - DeviceSubscription[]
  service_fee_invoices: any | null; // JSONB - ServiceFeeInvoice[]
  payment_reminders: any | null; // JSONB - PaymentReminder[]
  reminder_settings: any | null; // JSONB - ReminderSettings
  suspension_history: any | null; // JSONB - SuspensionHistoryRecord[]
}

export interface BankAccountsRow {
  id: string;
  account_code: string;
  bank_name: string;
  branch_name: string | null;
  account_number: string;
  iban: string | null;
  currency: string;
  account_type: string;
  balance: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  // ========================================
  // 🆕 BANKPF COMPREHENSIVE FIELDS
  // ========================================
  firma_unvan: string | null; // Firma ünvanı
  muhasebe_kodu: string | null; // Muhasebe kodu
  banka_or_pf: string | null; // 'Banka' veya 'PF'
  banka_pf_ad: string | null; // Banka/PF adı
  odeme_kurulusu_tipi: string | null; // 'ÖK', 'EPK' veya ''
  odeme_kurulusu_ad: string | null; // Ödeme kuruluşu adı
  vergi_dairesi: string | null; // Vergi dairesi
  vergi_no: string | null; // Vergi numarası
  adres: string | null; // Adres
  telefon: string | null; // Telefon
  email: string | null; // Email
  iletisim_matrisi: any | null; // JSONB - ContactPerson[]
  dokumanlar: any | null; // JSONB - Document[]
  isbirlikleri: any | null; // JSONB - Collaboration[]
  tabela_records: any | null; // JSONB - TabelaRecord[]
  tabela_groups: any | null; // JSONB - TabelaGroup[]
  hakedis_records: any | null; // JSONB - HakedisRecord[]
  agreement_banks: any | null; // JSONB - string[] (Bank IDs)
  agreement_epks: any | null; // JSONB - string[] (EPK IDs)
  agreement_oks: any | null; // JSONB - string[] (OK IDs)
  linked_bank_ids: any | null; // JSONB - string[] (Bağlı Banka ID'leri)
  linked_epk_ids: any | null; // JSONB - string[] (Bağlı EPK ID'leri)
  linked_ok_ids: any | null; // JSONB - string[] (Bağlı ÖK ID'leri)
  durum: string | null; // 'Aktif' veya 'Pasif'
}

export interface PettyCashRow {
  id: string;
  cash_code: string;
  name: string;
  responsible_person: string | null;
  balance: number;
  currency: string;
  is_active: boolean;
  is_deleted: boolean; // Soft delete flag (default: false)
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface CategoriesRow {
  id: string;
  category_code: string;
  name: string;
  category_type: string;
  parent_id: string | null;
  description: string | null;
  color: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface TransactionsRow {
  id: string;
  transaction_code: string;
  transaction_date: string;
  transaction_type: string;
  customer_id: string | null;
  bank_account_id: string | null;
  petty_cash_id: string | null;
  category_id: string | null;
  amount: number;
  currency: string;
  exchange_rate: number;
  target_bank_account_id: string | null;
  target_petty_cash_id: string | null;
  description: string | null;
  notes: string | null;
  document_number: string | null;
  status: string;
  is_recurring: boolean;
  is_deleted: boolean; // Soft delete flag (default: false)
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface SignsRow {
  id: string;
  sign_code: string;
  customer_id: string | null;
  sign_name: string;
  location: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  width: number | null;
  height: number | null;
  area: number | null;
  unit: string;
  sign_type: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  monthly_rent: number | null;
  status: string;
  installation_date: string | null;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
  notes: string | null;
  photos: any | null; // JSONB
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface IncomeRecordsRow {
  id: string;
  income_code: string;
  transaction_id: string | null;
  customer_id: string | null;
  sign_id: string | null;
  category_id: string | null;
  income_date: string;
  amount: number;
  currency: string;
  period_start: string | null;
  period_end: string | null;
  period_month: number | null;
  period_year: number | null;
  payment_method: string | null;
  payment_status: string;
  description: string | null;
  notes: string | null;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  is_deleted: boolean; // Soft delete flag (default: false)
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ProductsRow {
  id: string;
  product_code: string;
  barcode: string | null;
  name: string;
  description: string | null;
  category_id: string | null;
  unit: string;
  purchase_price: number;
  sale_price: number;
  currency: string;
  tax_rate: number;
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level: number | null;
  supplier_name: string | null;
  supplier_code: string | null;
  brand: string | null;
  model: string | null;
  color: string | null;
  size: string | null;
  weight: number | null;
  image_url: string | null;
  images: any | null; // JSONB
  notes: string | null;
  is_active: boolean;
  is_for_sale: boolean;
  is_for_purchase: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  // ========================================
  // 🆕 PAYTER PRODUCT SPECIFIC FIELDS
  // ========================================
  serial_number: string | null; // Serial number
  tid: string | null; // Terminal ID
  mid: string | null; // Merchant ID
  domain: string | null; // Domain/URL
  firmware: string | null; // Firmware version
  sam1: string | null; // SAM slot 1
  sam2: string | null; // SAM slot 2
  sam3: string | null; // SAM slot 3
  sim: string | null; // SIM card info
  terminal_type: string | null; // Terminal type
  online_status: string | null; // Online/Offline
  sync_status: string | null; // Sync status
  terminal_model: string | null; // Terminal model
  mac_address: string | null; // MAC address
  ptid: string | null; // PTID
}

export interface DomainMappingsRow {
  id: string;
  mapping_code: string;
  domain_name: string;
  subdomain: string | null;
  full_domain: string;
  customer_id: string | null;
  sign_id: string | null;
  ssl_enabled: boolean;
  ssl_certificate_expiry: string | null;
  dns_status: string;
  dns_records: any | null; // JSONB
  redirect_url: string | null;
  redirect_type: string | null;
  status: string;
  verified: boolean;
  verification_token: string | null;
  verified_at: string | null;
  registered_date: string | null;
  expiry_date: string | null;
  last_checked_at: string | null;
  visit_count: number;
  last_visit_at: string | null;
  notes: string | null;
  is_active: boolean;
  is_deleted: boolean; // Soft delete flag (default: false)
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface CustomerDocumentsRow {
  id: string;
  customer_id: string; // Customer ID (NOT NULL)
  document_type: string; // Document type (vergi_levhasi, ticaret_sicil_gazetesi, etc.)
  file_name: string; // Original file name
  file_path: string; // Storage path
  file_size: number; // File size in bytes
  file_type: string; // MIME type (application/pdf, image/jpeg, etc.)
  is_required: boolean; // Required document flag (default: false)
  status: string; // Status: pending, approved, rejected, expired (default: 'pending')
  uploaded_by: string | null; // User who uploaded
  reviewed_by: string | null; // User who reviewed
  reviewed_at: string | null; // Review timestamp
  notes: string | null; // Review notes
  is_deleted: boolean; // Soft delete flag (default: false)
  created_at: string; // timestamp with time zone (default: NOW())
  updated_at: string; // timestamp with time zone (default: NOW())
}

export interface RevenueModelsRow {
  id: string;
  model_code: string; // Revenue model kodu (NOT NULL)
  model_name: string; // Model adı (NOT NULL)
  description: string | null; // Açıklama
  commission_rate: number | null; // Komisyon oranı (numeric)
  revenue_sharing_rate: number | null; // Gelir paylaşım oranı (numeric)
  calculation_formula: string | null; // Hesaplama formülü
  is_active: boolean; // Aktif/Pasif (default: true)
  is_deleted: boolean; // Soft delete flag (default: false)
  notes: string | null; // Notlar
  created_at: string; // timestamp with time zone
  updated_at: string; // timestamp with time zone
  created_by: string | null; // Oluşturan kullanıcı
  updated_by: string | null; // Güncelleyen kullanıcı
}

export interface SMSTemplatesRow {
  id: string;
  template_code: string; // Template kodu (NOT NULL)
  template_name: string; // Template adı (NOT NULL)
  template_type: string | null; // Template tipi (reminder, notification, alert, etc.)
  message_content: string; // SMS içeriği (NOT NULL)
  variables: any | null; // JSONB - Değişkenler array (e.g., [{name: 'customerName', description: '...'}])
  is_active: boolean; // Aktif/Pasif (default: true)
  is_deleted: boolean; // Soft delete flag (default: false)
  usage_count: number; // Kullanım sayısı (default: 0)
  last_used_at: string | null; // Son kullanım zamanı
  notes: string | null; // Notlar
  created_at: string; // timestamp with time zone
  updated_at: string; // timestamp with time zone
  created_by: string | null; // Oluşturan kullanıcı
  updated_by: string | null; // Güncelleyen kullanıcı
}

// ========================================
// DATABASE INSERT TYPES (Omit auto-generated)
// ========================================

// Definitions Tables
export type MCCCodesInsert = Omit<MCCCodesRow, 'id' | 'created_at'>;
export type BanksInsert = Omit<BanksRow, 'id' | 'created_at'>;
export type EPKInstitutionsInsert = Omit<EPKInstitutionsRow, 'id' | 'created_at'>;
export type OKInstitutionsInsert = Omit<OKInstitutionsRow, 'id' | 'created_at'>;
export type SalesRepresentativesInsert = Omit<SalesRepresentativesRow, 'id' | 'created_at'>;
export type JobTitlesInsert = Omit<JobTitlesRow, 'id' | 'created_at'>;
export type PartnershipsInsert = Omit<PartnershipsRow, 'id' | 'created_at'>;
export type SharingsInsert = Omit<SharingsRow, 'id' | 'created_at'>;
export type CardProgramsInsert = Omit<CardProgramsRow, 'id' | 'created_at'>;
export type SuspensionReasonsInsert = Omit<SuspensionReasonsRow, 'id' | 'created_at'>;
export type EarningsInsert = Omit<EarningsRow, 'id' | 'created_at' | 'updated_at'>;

// Core Tables
export type CustomersInsert = Omit<CustomersRow, 'id' | 'created_at' | 'updated_at'>;
export type BankAccountsInsert = Omit<BankAccountsRow, 'id' | 'created_at' | 'updated_at'>;
export type PettyCashInsert = Omit<PettyCashRow, 'id' | 'created_at' | 'updated_at'>;
export type CategoriesInsert = Omit<CategoriesRow, 'id' | 'created_at' | 'updated_at'>;
export type TransactionsInsert = Omit<TransactionsRow, 'id' | 'created_at' | 'updated_at'>;
export type SignsInsert = Omit<SignsRow, 'id' | 'created_at' | 'updated_at'>;
export type IncomeRecordsInsert = Omit<IncomeRecordsRow, 'id' | 'created_at' | 'updated_at'>;
export type ProductsInsert = Omit<ProductsRow, 'id' | 'created_at' | 'updated_at'>;
export type DomainMappingsInsert = Omit<DomainMappingsRow, 'id' | 'created_at' | 'updated_at'>;
export type CustomerDocumentsInsert = Omit<CustomerDocumentsRow, 'id' | 'created_at' | 'updated_at'>;
export type RevenueModelsInsert = Omit<RevenueModelsRow, 'id' | 'created_at' | 'updated_at'>;
export type SMSTemplatesInsert = Omit<SMSTemplatesRow, 'id' | 'created_at' | 'updated_at'>;

// ========================================
// DATABASE UPDATE TYPES (All optional)
// ========================================

// Definitions Tables
export type MCCCodesUpdate = Partial<MCCCodesInsert>;
export type BanksUpdate = Partial<BanksInsert>;
export type EPKInstitutionsUpdate = Partial<EPKInstitutionsInsert>;
export type OKInstitutionsUpdate = Partial<OKInstitutionsInsert>;
export type SalesRepresentativesUpdate = Partial<SalesRepresentativesInsert>;
export type JobTitlesUpdate = Partial<JobTitlesInsert>;
export type PartnershipsUpdate = Partial<PartnershipsInsert>;
export type SharingsUpdate = Partial<SharingsInsert>;
export type CardProgramsUpdate = Partial<CardProgramsInsert>;
export type SuspensionReasonsUpdate = Partial<SuspensionReasonsInsert>;
export type EarningsUpdate = Partial<EarningsInsert>;

// Core Tables
export type CustomersUpdate = Partial<CustomersInsert>;
export type BankAccountsUpdate = Partial<BankAccountsInsert>;
export type PettyCashUpdate = Partial<PettyCashInsert>;
export type CategoriesUpdate = Partial<CategoriesInsert>;
export type TransactionsUpdate = Partial<TransactionsInsert>;
export type SignsUpdate = Partial<SignsInsert>;
export type IncomeRecordsUpdate = Partial<IncomeRecordsInsert>;
export type ProductsUpdate = Partial<ProductsInsert>;
export type DomainMappingsUpdate = Partial<DomainMappingsInsert>;
export type CustomerDocumentsUpdate = Partial<CustomerDocumentsInsert>;
export type RevenueModelsUpdate = Partial<RevenueModelsInsert>;
export type SMSTemplatesUpdate = Partial<SMSTemplatesInsert>;

// ========================================
// DATABASE TYPE (Supabase SDK)
// ========================================

export interface Database {
  public: {
    Tables: {
      // ========================================
      // TANIMLAR (DEFINITIONS) TABLES
      // ========================================
      deleted_records_backup: {
        Row: DeletedRecordsBackupRow;
        Insert: Omit<DeletedRecordsBackupRow, 'id' | 'created_at'>;
        Update: Partial<Omit<DeletedRecordsBackupRow, 'id' | 'created_at'>>;
      };
      mcc_codes: {
        Row: MCCCodesRow;
        Insert: MCCCodesInsert;
        Update: MCCCodesUpdate;
      };
      banks: {
        Row: BanksRow;
        Insert: BanksInsert;
        Update: BanksUpdate;
      };
      epk_institutions: {
        Row: EPKInstitutionsRow;
        Insert: EPKInstitutionsInsert;
        Update: EPKInstitutionsUpdate;
      };
      ok_institutions: {
        Row: OKInstitutionsRow;
        Insert: OKInstitutionsInsert;
        Update: OKInstitutionsUpdate;
      };
      sales_representatives: {
        Row: SalesRepresentativesRow;
        Insert: SalesRepresentativesInsert;
        Update: SalesRepresentativesUpdate;
      };
      job_titles: {
        Row: JobTitlesRow;
        Insert: JobTitlesInsert;
        Update: JobTitlesUpdate;
      };
      partnerships: {
        Row: PartnershipsRow;
        Insert: PartnershipsInsert;
        Update: PartnershipsUpdate;
      };
      sharings: {
        Row: SharingsRow;
        Insert: SharingsInsert;
        Update: SharingsUpdate;
      };
      card_programs: {
        Row: CardProgramsRow;
        Insert: CardProgramsInsert;
        Update: CardProgramsUpdate;
      };
      suspension_reasons: {
        Row: SuspensionReasonsRow;
        Insert: SuspensionReasonsInsert;
        Update: SuspensionReasonsUpdate;
      };
      earnings: {
        Row: EarningsRow;
        Insert: EarningsInsert;
        Update: EarningsUpdate;
      };
      // ========================================
      // CORE TABLES
      // ========================================
      customers: {
        Row: CustomersRow;
        Insert: CustomersInsert;
        Update: CustomersUpdate;
      };
      bank_accounts: {
        Row: BankAccountsRow;
        Insert: BankAccountsInsert;
        Update: BankAccountsUpdate;
      };
      petty_cash: {
        Row: PettyCashRow;
        Insert: PettyCashInsert;
        Update: PettyCashUpdate;
      };
      categories: {
        Row: CategoriesRow;
        Insert: CategoriesInsert;
        Update: CategoriesUpdate;
      };
      transactions: {
        Row: TransactionsRow;
        Insert: TransactionsInsert;
        Update: TransactionsUpdate;
      };
      signs: {
        Row: SignsRow;
        Insert: SignsInsert;
        Update: SignsUpdate;
      };
      income_records: {
        Row: IncomeRecordsRow;
        Insert: IncomeRecordsInsert;
        Update: IncomeRecordsUpdate;
      };
      products: {
        Row: ProductsRow;
        Insert: ProductsInsert;
        Update: ProductsUpdate;
      };
      domain_mappings: {
        Row: DomainMappingsRow;
        Insert: DomainMappingsInsert;
        Update: DomainMappingsUpdate;
      };
      customer_documents: {
        Row: CustomerDocumentsRow;
        Insert: CustomerDocumentsInsert;
        Update: CustomerDocumentsUpdate;
      };
      revenue_models: {
        Row: RevenueModelsRow;
        Insert: RevenueModelsInsert;
        Update: RevenueModelsUpdate;
      };
      sms_templates: {
        Row: SMSTemplatesRow;
        Insert: SMSTemplatesInsert;
        Update: SMSTemplatesUpdate;
      };
    };
    Views: {
      customer_balance_summary: {
        Row: {
          id: string;
          customer_code: string;
          name: string;
          balance: number;
          credit_limit: number;
          transaction_count: number;
          total_invoiced: number;
          total_paid: number;
        };
      };
      monthly_income_report: {
        Row: {
          period_year: number;
          period_month: number;
          record_count: number;
          total_income: number;
          currency: string;
        };
      };
      bank_account_summary: {
        Row: {
          id: string;
          account_code: string;
          bank_name: string;
          balance: number;
          transaction_count: number;
          total_credit: number;
          total_debit: number;
        };
      };
    };
    Functions: {};
    Enums: {};
  };
}